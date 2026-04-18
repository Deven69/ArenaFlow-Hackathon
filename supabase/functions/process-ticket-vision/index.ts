// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      throw new Error("imageBase64 is required");
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const GOOGLE_CLOUD_API_KEY = Deno.env.get('GOOGLE_CLOUD_API_KEY');
    
    if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");
    if (!GOOGLE_CLOUD_API_KEY) throw new Error("Missing GOOGLE_CLOUD_API_KEY");

    // 1. Google Cloud Vision API for robust text & barcode extraction
    const visionReq = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [{
            image: { content: imageBase64 },
            features: [{ type: "TEXT_DETECTION" }]
          }]
        })
      }
    );
    const visionData = await visionReq.json();
    const extractedText = visionData.responses?.[0]?.fullTextAnnotation?.text || "";

    // 2. Gemini fallback structure to extract JSON format taking Vision context into account
    const prompt = `You are extracting ticket details from a ticket image. 
    Google Cloud Vision extracted the following raw text from this image: 
    <<<
    ${extractedText}
    >>>
    Using both the image and the raw text above, respond with a clean JSON object containing exact values for: matchTitle, section, block, row, seat, tier, user, barcode_value.`;

    const apiReqOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
          ]
        }]
      })
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      apiReqOptions
    );
    const data = await res.json();

    return new Response(JSON.stringify({ result: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
