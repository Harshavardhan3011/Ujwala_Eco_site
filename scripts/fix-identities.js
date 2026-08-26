const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixIdentities() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  const users = await client.query('SELECT id, email FROM auth.users');

  for (const u of users.rows) {
    const existing = await client.query(
      'SELECT id FROM auth.identities WHERE user_id = $1::uuid',
      [u.id]
    );

    if (existing.rows.length === 0) {
      console.log(`Creating identity for ${u.email}...`);
      await client.query(
        `
        INSERT INTO auth.identities (
          id,
          user_id,
          provider_id,
          identity_data,
          provider,
          last_sign_in_at,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          $1::uuid,
          $1::text,
          json_build_object('sub', $1::text, 'email', $2::text),
          'email',
          NOW(),
          NOW(),
          NOW()
        );
        `,
        [u.id, u.email]
      );
      console.log(`Identity created for ${u.email}!`);
    }
  }

  await client.end();
}

fixIdentities().catch(console.error);
