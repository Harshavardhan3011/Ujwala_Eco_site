const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function debugAuth() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  const tables = [
    'auth.users',
    'auth.identities',
    'auth.sessions',
    'auth.refresh_tokens',
    'auth.audit_log_entries',
    'auth.instances',
    'auth.flow_state',
    'auth.mfa_amr_claims',
    'auth.mfa_factors',
    'public.profiles',
  ];

  for (const tbl of tables) {
    try {
      const res = await client.query(`SELECT count(*) FROM ${tbl}`);
      console.log(`✅ ${tbl}: ${res.rows[0].count} rows`);
    } catch (err) {
      console.error(`❌ ${tbl} FAILED: ${err.message}`);
    }
  }

  // Test handle_new_user function or triggers
  try {
    const fn = await client.query(`SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'handle_new_user'`);
    console.log('\n--- handle_new_user definition ---');
    console.log(fn.rows[0]?.pg_get_functiondef);
  } catch (err) {
    console.error(`❌ handle_new_user check failed: ${err.message}`);
  }

  await client.end();
}

debugAuth().catch(console.error);
