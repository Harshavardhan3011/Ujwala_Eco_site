const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixSequence() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  console.log('Cleaning up auth.refresh_tokens and resetting sequence...');

  await client.query('DELETE FROM auth.refresh_tokens;');
  await client.query('DELETE FROM auth.sessions;');

  // Reset sequence
  await client.query("SELECT setval(pg_get_serial_sequence('auth.refresh_tokens', 'id'), 1, false);");

  console.log('Sequence reset successfully!');
  await client.end();
}

fixSequence().catch(console.error);
