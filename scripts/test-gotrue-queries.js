const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testGoTrueSteps() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  console.log('--- Step 1: User lookup ---');
  try {
    const userRes = await client.query(
      `SELECT * FROM auth.users WHERE LOWER(email) = LOWER('admin@ujwalaeco.com') AND deleted_at IS NULL`
    );
    console.log(`✅ User found: id=${userRes.rows[0]?.id}, email=${userRes.rows[0]?.email}`);
    const u = userRes.rows[0];

    console.log('\n--- Step 2: Identity lookup ---');
    const idRes = await client.query(
      `SELECT * FROM auth.identities WHERE user_id = $1::uuid AND provider = 'email'`,
      [u.id]
    );
    console.log(`✅ Identity found: id=${idRes.rows[0]?.id}`);

    console.log('\n--- Step 3: Password verify ---');
    const passRes = await client.query(
      `SELECT (encrypted_password = crypt('UjwalaAdminPassword2026!', encrypted_password)) as valid FROM auth.users WHERE id = $1::uuid`,
      [u.id]
    );
    console.log(`✅ Password match: ${passRes.rows[0]?.valid}`);

    console.log('\n--- Step 4: Test Session insert ---');
    const sessRes = await client.query(
      `INSERT INTO auth.sessions (id, user_id, created_at, updated_at) VALUES (gen_random_uuid(), $1::uuid, NOW(), NOW()) RETURNING id`,
      [u.id]
    );
    console.log(`✅ Session inserted: ${sessRes.rows[0]?.id}`);

    console.log('\n--- Step 5: Test Refresh token insert ---');
    const refRes = await client.query(
      `INSERT INTO auth.refresh_tokens (id, instance_id, token, user_id, revoked, created_at, updated_at, session_id) VALUES (1, '00000000-0000-0000-0000-000000000000', 'test_token', $1::text, false, NOW(), NOW(), $2::uuid) RETURNING id`,
      [u.id, sessRes.rows[0]?.id]
    );
    console.log(`✅ Refresh token inserted: ${refRes.rows[0]?.id}`);

  } catch (err) {
    console.error(`❌ STEP FAILED: ${err.message}`, err);
  } finally {
    await client.end();
  }
}

testGoTrueSteps().catch(console.error);
