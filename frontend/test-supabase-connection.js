// Test script to verify Supabase connection
// Run with: node test-supabase-connection.js

const { createClient } = require('@supabase/supabase-js');

// Your Supabase project credentials
const supabaseUrl = 'https://ffjuuihwlwskyxuxwtkc.supabase.co';
const supabaseKey = 'sb_publishable_3C6d2fGZ4go0Jo7QIoJLbw_TkrCrnvW';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  // Test 1: Check if we can reach Supabase
  console.log('1️⃣ Testing basic connectivity...');
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) throw error;
    console.log('   ✅ Connected to Supabase!\n');
  } catch (error) {
    console.log(`   ❌ Connection failed: ${error.message}\n`);
    return;
  }

  // Test 2: List all tables
  console.log('2️⃣ Checking database tables...');
  const tables = [
    'profiles', 'venues', 'matches', 'tickets',
    'ticket_groups', 'ticket_group_members', 'orders',
    'gate_queue_snapshots', 'nudge_log'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('id').limit(1);
      if (error && error.code === '42P01') {
        console.log(`   ❌ Table '${table}' does not exist`);
      } else if (error) {
        console.log(`   ⚠️  Table '${table}' exists but: ${error.message}`);
      } else {
        console.log(`   ✅ Table '${table}' exists`);
      }
    } catch (error) {
      console.log(`   ❌ Error checking '${table}': ${error.message}`);
    }
  }
  console.log('');

  // Test 3: Check PostgreSQL functions
  console.log('3️⃣ Checking PostgreSQL functions...');
  const functions = ['create_ticket_group', 'checkin_group', 'get_user_role'];

  for (const func of functions) {
    try {
      // Try to call get_user_role (it needs no params)
      if (func === 'get_user_role') {
        const { data, error } = await supabase.rpc(func);
        if (error && error.code === '42883') {
          console.log(`   ❌ Function '${func}' does not exist`);
        } else if (error) {
          console.log(`   ⚠️  Function '${func}' exists but: ${error.message}`);
        } else {
          console.log(`   ✅ Function '${func}' exists`);
        }
      } else {
        console.log(`   ⏭️  Function '${func}' - skipped (requires params)`);
      }
    } catch (error) {
      console.log(`   ❌ Error checking '${func}': ${error.message}`);
    }
  }
  console.log('');

  // Test 4: Check Edge Functions
  console.log('4️⃣ Checking Edge Functions...');
  const edgeFunctions = [
    'process-ticket-vision',
    'generate-gate-nudge',
    'send-whatsapp-alerts',
    'cron-geofence-check'
  ];

  for (const fn of edgeFunctions) {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/${fn}`, {
        method: 'OPTIONS',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (response.status === 200 || response.status === 405) {
        console.log(`   ✅ Edge Function '${fn}' is deployed`);
      } else if (response.status === 404) {
        console.log(`   ❌ Edge Function '${fn}' NOT deployed (404)`);
      } else {
        console.log(`   ⚠️  Edge Function '${fn}' - status: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error checking '${fn}': ${error.message}`);
    }
  }
  console.log('');

  // Test 5: Check RLS policies
  console.log('5️⃣ Checking RLS policies...');
  const { data: rlsData, error: rlsError } = await supabase
    .from('pg_policies')
    .select('tablename, policyname')
    .in('tablename', tables);

  if (rlsError) {
    console.log(`   ⚠️  Could not check RLS: ${rlsError.message}`);
  } else if (rlsData && rlsData.length > 0) {
    const policiesByTable = {};
    rlsData.forEach(p => {
      if (!policiesByTable[p.tablename]) policiesByTable[p.tablename] = [];
      policiesByTable[p.tablename].push(p.policyname);
    });

    for (const [table, policies] of Object.entries(policiesByTable)) {
      if (tables.includes(table)) {
        console.log(`   ✅ Table '${table}' has ${policies.length} RLS policy(ies)`);
      }
    }
  } else {
    console.log(`   ⚠️  No RLS policies found - tables may be unprotected!`);
  }
  console.log('');

  console.log('✅ Connection test complete!\n');
}

testConnection();
