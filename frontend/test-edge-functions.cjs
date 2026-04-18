// Test script for Edge Functions
// Run with: node test-edge-functions.cjs

const supabaseUrl = 'https://ffjuuihwlwskyxuxwtkc.supabase.co';
const supabaseKey = 'sb_publishable_3C6d2fGZ4go0Jo7QIoJLbw_TkrCrnvW';

async function testEdgeFunction(functionName, method = 'GET', body = null, useAnonKey = true) {
  const url = `${supabaseUrl}/functions/v1/${functionName}`;
  const apiKey = useAnonKey ? supabaseKey : 'sb_publishable_3C6d2fGZ4go0Jo7QIoJLbw_TkrCrnvW';

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);

    // CORS preflight returns plain text "ok"
    if (method === 'OPTIONS') {
      const text = await response.text();
      console.log(`\n📡 Edge Function: ${functionName}`);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Response: ${text}`);
      return { success: response.status === 200, status: response.status, data: text };
    }

    const data = await response.json();

    console.log(`\n📡 Edge Function: ${functionName}`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2).substring(0, 500)}...`);

    return { success: true, status: response.status, data };
  } catch (error) {
    console.log(`\n❌ Edge Function: ${functionName}`);
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing ArenaFlow Edge Functions\n');
  console.log('=' .repeat(50));

  // Test 1: process-ticket-vision (OPTIONS - CORS preflight)
  console.log('\n1️⃣ Testing process-ticket-vision (CORS preflight)...');
  await testEdgeFunction('process-ticket-vision', 'OPTIONS');

  // Test 2: process-ticket-vision (POST - will fail without image but tests API structure)
  console.log('\n2️⃣ Testing process-ticket-vision (POST - empty body)...');
  await testEdgeFunction('process-ticket-vision', 'POST', {});

  // Test 3: generate-gate-nudge (OPTIONS)
  console.log('\n3️⃣ Testing generate-gate-nudge (CORS preflight)...');
  await testEdgeFunction('generate-gate-nudge', 'OPTIONS');

  // Test 4: generate-gate-nudge (POST)
  console.log('\n4️⃣ Testing generate-gate-nudge (POST - empty body)...');
  await testEdgeFunction('generate-gate-nudge', 'POST', {});

  // Test 5: send-whatsapp-alerts (OPTIONS)
  console.log('\n5️⃣ Testing send-whatsapp-alerts (CORS preflight)...');
  await testEdgeFunction('send-whatsapp-alerts', 'OPTIONS');

  // Test 6: send-whatsapp-alerts (POST - will fail without credentials)
  console.log('\n6️⃣ Testing send-whatsapp-alerts (POST - empty body)...');
  await testEdgeFunction('send-whatsapp-alerts', 'POST', {});

  // Test 7: cron-geofence-check (OPTIONS)
  console.log('\n7️⃣ Testing cron-geofence-check (CORS preflight)...');
  await testEdgeFunction('cron-geofence-check', 'OPTIONS');

  // Test 8: cron-geofence-check (GET)
  console.log('\n8️⃣ Testing cron-geofence-check (GET)...');
  await testEdgeFunction('cron-geofence-check', 'GET');

  console.log('\n' + '='.repeat(50));
  console.log('✅ Edge Function tests complete!\n');
}

runTests();
