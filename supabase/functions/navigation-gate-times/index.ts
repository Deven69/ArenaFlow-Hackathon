import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock stadium gate coords for the Haversine fallback to work
const MOCK_GATES = [
  { id: "gate_1", name: "Gate A", lat: 19.0821, lng: 72.8270 },
  { id: "gate_2", name: "Gate B", lat: 19.0825, lng: 72.8275 },
  { id: "gate_3", name: "Gate C", lat: 19.0815, lng: 72.8280 },
  { id: "gate_4", name: "Gate D", lat: 19.0810, lng: 72.8265 },
];

function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

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
      .eq('function_name', 'navigation-gate-times')
      .gte('window_start', new Date(Date.now() - 60000).toISOString())
      .single();

    const count = limitData?.count;
    if (count && count > 100) {
      return new Response(JSON.stringify({ error: 'RATE_LIMITED', message: 'Too many requests' }), 
        { status: 429, headers: { 'Content-Type': 'application/json' } });
    }

    const { fanLat, fanLng, venueId } = await req.json();

    if (fanLat === undefined || fanLng === undefined) {
      throw new Error("fanLat and fanLng are required");
    }

    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    let results: Array<{ gate: string; timeMins: number; method: string }> = [];

    if (GOOGLE_MAPS_API_KEY) {
      try {
        const origins = `${fanLat},${fanLng}`;
        const destinations = MOCK_GATES.map(g => `${g.lat},${g.lng}`).join('|');
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&mode=walking&key=${GOOGLE_MAPS_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === "OK") {
          const elements = data.rows[0].elements;
          results = MOCK_GATES.map((gate, index) => {
            const elm = elements[index];
            if (elm.status === "OK") {
              const durationSecs = elm.duration.value;
              return { gate: gate.name, timeMins: Math.ceil(durationSecs / 60), method: "api" };
            }
            throw new Error("Element error"); // force fallback
          });
        } else {
           throw new Error(data.error_message || "Maps API Error");
        }
      } catch (e) {
        console.error("Maps API failed, using fallback", e);
        results = []; // Clear partial to trigger fallback below
      }
    }

    if (results.length === 0) {
      // Fallback: Haversine straight line. User walking speed approx 1.4 m/s (84 m/min)
      results = MOCK_GATES.map(gate => {
        const dist = haversineDistanceMeters(fanLat, fanLng, gate.lat, gate.lng);
        const walkTimeMins = Math.ceil(dist / 84); 
        return { 
          gate: gate.name, 
          timeMins: walkTimeMins > 0 ? walkTimeMins : 1, 
          method: "haversine_fallback" 
        };
      });
    }

    return new Response(JSON.stringify({ success: true, gates: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    // Failsafe fallback even on horrific failures 
    const failsafe = MOCK_GATES.map(gate => ({
       gate: gate.name,
       timeMins: 5,
       method: "hard_failsafe"
    }));

    return new Response(JSON.stringify({ success: false, error: error.message, gates: failsafe }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Important: keep returning 200 so UI always has actionable data
    });
  }
});
