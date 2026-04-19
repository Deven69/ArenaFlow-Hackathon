import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { BigQuery } from "npm:@google-cloud/bigquery";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Helper for GCP structured logging
async function logToGoogleCloud(functionName: string, eventDesc: string) {
  try {
    const loggingKey = Deno.env.get('GOOGLE_LOGGING_KEY');
    const projectId = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID');
    if (loggingKey && projectId) {
      await fetch(`https://logging.googleapis.com/v2/entries:write?key=${loggingKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logName: `projects/${projectId}/logs/arenaflow`,
          resource: { type: 'cloud_run_revision' },
          entries: [{
            severity: 'INFO',
            jsonPayload: { function: functionName, event: eventDesc, timestamp: new Date().toISOString() }
          }]
        })
      });
    }
  } catch (e) {
    // ignore
  }
}

// AES-256-GCM encryption helper
async function encryptField(plaintext: string, keyString: string): Promise<string> {
  const keyBytes = new TextEncoder().encode(keyString.padEnd(32, '0').slice(0, 32));
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext));
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

// Helper function to hash fan_id
async function hashStringToSha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const bqConfig: any = {};
if (Deno.env.get("GOOGLE_CLOUD_CREDENTIALS")) {
  try {
     bqConfig.credentials = JSON.parse(Deno.env.get("GOOGLE_CLOUD_CREDENTIALS") as string);
  } catch (e) {
     logToGoogleCloud('log-analytics', "Failed to parse GOOGLE_CLOUD_CREDENTIALS");
  }
}
if (Deno.env.get("GOOGLE_CLOUD_PROJECT_ID")) {
  bqConfig.projectId = Deno.env.get("GOOGLE_CLOUD_PROJECT_ID");
}
const bigquery = new BigQuery(bqConfig);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const clientIP = req.headers.get('x-forwarded-for') ?? 'unknown';
    const ipHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(clientIP));
    const ipHashHex = Array.from(new Uint8Array(ipHash)).map(b => b.toString(16).padStart(2, '0')).join('');

    const { data: limitData } = await supabaseAdmin
      .from('rate_limits')
      .select('count')
      .eq('ip_hash', ipHashHex)
      .eq('function_name', 'log-analytics')
      .gte('window_start', new Date(Date.now() - 60000).toISOString())
      .single();

    const count = limitData?.count;
    if (count && count > 100) {
      return new Response(JSON.stringify({ error: 'RATE_LIMITED', message: 'Too many requests' }), 
        { status: 429, headers: { 'Content-Type': 'application/json' } });
    }

    const { action, payload } = await req.json();

    if (!action || !payload) {
      throw new Error("action and payload are required");
    }

    const dataset = bigquery.dataset("arenaflow_analytics");
    await logToGoogleCloud('log-analytics', `Processing action: ${action}`);

    if (action === "checkin_events") {
      const {
        event_id, venue_id, gate_id, gate_name,
        ticket_tier, is_group_checkin, group_size,
        fan_id, session_id, time_to_checkin_seconds
      } = payload;

      let fan_id_hash = fan_id ? await hashStringToSha256(fan_id) : "";
      
      const encKey = Deno.env.get('ENCRYPTION_KEY');
      if (encKey && fan_id_hash) {
        fan_id_hash = await encryptField(fan_id_hash, encKey);
      }

      const row = {
        event_id: event_id || "default_event",
        venue_id: venue_id || "default_venue",
        gate_id: gate_id || "gate_1",
        gate_name: gate_name || "Gate 1",
        ticket_tier: ticket_tier || "Standard",
        is_group_checkin: Boolean(is_group_checkin),
        group_size: Number(group_size) || 1,
        checkin_timestamp: new Date().toISOString(),
        fan_id_hash,
        session_id: session_id || "unknown",
        time_to_checkin_seconds: Number(time_to_checkin_seconds) || 0
      };

      await dataset.table("checkin_events").insert([row]);
      await logToGoogleCloud('log-analytics', "Successfully inserted checkin_events row");
    } else if (action === "nudge_events") {
      const {
        nudge_id, venue_id, gate_id,
        recipients_count, gemini_latency_ms,
        maps_latency_ms, message_preview
      } = payload;
      
      let sentiment_score = null;
      let sentiment_magnitude = null;
      
      const nlpApiKey = Deno.env.get('GOOGLE_NLP_API_KEY');
      if (nlpApiKey && message_preview) {
        try {
          await logToGoogleCloud('log-analytics', "Calling Natural Language API for sentiment");
          const nlpRes = await fetch(`https://language.googleapis.com/v1/documents:analyzeSentiment?key=${nlpApiKey}`, {
            method: 'POST',
            body: JSON.stringify({
              document: { type: 'PLAIN_TEXT', content: message_preview },
              encodingType: 'UTF8'
            })
          });
          if (nlpRes.ok) {
            const nlpData = await nlpRes.json();
            sentiment_score = nlpData?.documentSentiment?.score ?? null;
            sentiment_magnitude = nlpData?.documentSentiment?.magnitude ?? null;
            await logToGoogleCloud('log-analytics', "Successfully retrieved sentiment score");
          } else {
            await logToGoogleCloud('log-analytics', `Natural Language API failed: ${nlpRes.status}`);
          }
        } catch (nlpErr: any) {
          await logToGoogleCloud('log-analytics', `Natural Language API error: ${nlpErr.message}`);
        }
      }

      const row = {
        nudge_id: nudge_id || crypto.randomUUID(),
        venue_id: venue_id || "default_venue",
        gate_id: gate_id || "gate_1",
        recipients_count: Number(recipients_count) || 0,
        gemini_latency_ms: Number(gemini_latency_ms) || 0,
        maps_latency_ms: Number(maps_latency_ms) || 0,
        sent_timestamp: new Date().toISOString(),
        message_preview: message_preview ? message_preview.substring(0, 50) : "",
        sentiment_score,
        sentiment_magnitude
      };

      await dataset.table("nudge_events").insert([row]);
      await logToGoogleCloud('log-analytics', "Successfully inserted nudge_events row");
    } else {
       throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    await logToGoogleCloud('log-analytics', `BigQuery Log Error: ${error.message}`);
    // Usually we don't want analytics to block user flow if this fails
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Returning 200 so the client app doesn't crash on analytics failure
    });
  }
});
