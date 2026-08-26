const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixInstances() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  console.log('Inserting default instance into auth.instances...');
  await client.query(`
    INSERT INTO auth.instances (id, uuid, raw_base_config, created_at, updated_at)
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      '{}',
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO NOTHING;
  `);

  console.log('Done inserting default instance!');
  await client.end();
}

fixInstances().catch(console.error);
