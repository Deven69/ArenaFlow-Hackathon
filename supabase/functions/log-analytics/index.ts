import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { BigQuery } from "npm:@google-cloud/bigquery";

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
     console.error("Failed to parse GOOGLE_CLOUD_CREDENTIALS");
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
    const { action, payload } = await req.json();

    if (!action || !payload) {
      throw new Error("action and payload are required");
    }

    const dataset = bigquery.dataset("arenaflow_analytics");

    if (action === "checkin_events") {
      const {
        event_id,
        venue_id,
        gate_id,
        gate_name,
        ticket_tier,
        is_group_checkin,
        group_size,
        fan_id, // We will hash this
        session_id,
        time_to_checkin_seconds
      } = payload;

      const fan_id_hash = fan_id ? await hashStringToSha256(fan_id) : "";

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
    } else if (action === "nudge_events") {
      const {
        nudge_id,
        venue_id,
        gate_id,
        recipients_count,
        gemini_latency_ms,
        maps_latency_ms,
        message_preview
      } = payload;

      const row = {
        nudge_id: nudge_id || crypto.randomUUID(),
        venue_id: venue_id || "default_venue",
        gate_id: gate_id || "gate_1",
        recipients_count: Number(recipients_count) || 0,
        gemini_latency_ms: Number(gemini_latency_ms) || 0,
        maps_latency_ms: Number(maps_latency_ms) || 0,
        sent_timestamp: new Date().toISOString(),
        message_preview: message_preview ? message_preview.substring(0, 50) : ""
      };

      await dataset.table("nudge_events").insert([row]);
    } else {
       throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error("BigQuery Log Error: ", error.message);
    // Usually we don't want analytics to block user flow if this fails
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Returning 200 so the client app doesn't crash on analytics failure
    });
  }
});
