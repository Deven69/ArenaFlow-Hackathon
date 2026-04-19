import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let originalText = "";
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
      .eq('function_name', 'translate-nudge')
      .gte('window_start', new Date(Date.now() - 60000).toISOString())
      .single();

    const count = limitData?.count;
    if (count && count > 100) {
      return new Response(JSON.stringify({ error: 'RATE_LIMITED', message: 'Too many requests' }), 
        { status: 429, headers: { 'Content-Type': 'application/json' } });
    }


    const { text, targetLanguage } = await req.json();
    originalText = text;

    if (!text || typeof text !== 'string') {
      await logToGoogleCloud('translate-nudge', 'Invalid input: text missing or invalid');
      return new Response(JSON.stringify({ error: "Invalid text" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    if (!['hi', 'mr', 'en'].includes(targetLanguage)) {
      await logToGoogleCloud('translate-nudge', 'Invalid input: unsupported targetLanguage');
      return new Response(JSON.stringify({ error: "Invalid targetLanguage" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const apiKey = Deno.env.get('GOOGLE_TRANSLATE_API_KEY');
    if (!apiKey) {
      await logToGoogleCloud('translate-nudge', 'Missing GOOGLE_TRANSLATE_API_KEY');
      return new Response(JSON.stringify({ translatedText: text, detectedSourceLanguage: "en" }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    await logToGoogleCloud('translate-nudge', `Translating text to ${targetLanguage}`);
    
    const translateResponse = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, target: targetLanguage, format: "text" })
    });

    if (!translateResponse.ok) {
      await logToGoogleCloud('translate-nudge', `Translation API failed: ${translateResponse.status}`);
      return new Response(JSON.stringify({ translatedText: text, detectedSourceLanguage: "en" }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const result = await translateResponse.json();
    const translation = result.data?.translations?.[0];
    
    if (translation) {
      await logToGoogleCloud('translate-nudge', 'Translation successful');
      return new Response(JSON.stringify({ 
        translatedText: translation.translatedText, 
        detectedSourceLanguage: translation.detectedSourceLanguage 
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else {
      await logToGoogleCloud('translate-nudge', 'Translation successful but no data returned');
      return new Response(JSON.stringify({ translatedText: text, detectedSourceLanguage: "en" }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

  } catch (err: any) {
    await logToGoogleCloud('translate-nudge', `Error: ${err.message}`);
    return new Response(JSON.stringify({ translatedText: originalText, detectedSourceLanguage: "en" }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
