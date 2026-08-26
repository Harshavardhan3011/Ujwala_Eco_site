const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function configureSuperadmin() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  const email = 'harshavardhanvesalapu1@gmail.com';
  const password = 'UjwalaSuperAdmin2026!';

  console.log(`Configuring superadmin for ${email}...`);

  // 1. Get user ID
  const userRes = await client.query(
    `SELECT id FROM auth.users WHERE LOWER(email) = $1`,
    [email.toLowerCase()]
  );

  if (userRes.rows.length === 0) {
    console.error(`Error: User ${email} not found in auth.users!`);
    await client.end();
    return;
  }

  const userId = userRes.rows[0].id;
  console.log(`Found auth user ID: ${userId}`);

  // 2. Update password and confirm email in auth.users
  await client.query(
    `
    UPDATE auth.users
    SET encrypted_password = crypt($2, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role":"superadmin","name":"Harshavardhan (Superadmin)"}'::jsonb,
        updated_at = NOW()
    WHERE id = $1;
    `,
    [userId, password]
  );

  // 3. Ensure identity row exists
  await client.query(
    `
    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), $1::uuid, $1::text, json_build_object('sub', $1::text, 'email', $2::text), 'email', NOW(), NOW(), NOW()
    ) ON CONFLICT (provider_id, provider) DO UPDATE
    SET updated_at = NOW();
    `,
    [userId, email]
  );

  // 4. Update profile in public.profiles to role = 'superadmin'
  await client.query(
    `
    INSERT INTO public.profiles (id, name, email, role, created_at, updated_at)
    VALUES ($1, 'Harshavardhan (Superadmin)', $2, 'superadmin', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE
    SET role = 'superadmin',
        name = 'Harshavardhan (Superadmin)',
        updated_at = NOW();
    `,
    [userId, email]
  );

  console.log(`✅ Superadmin role assigned to ${email} successfully!`);
  await client.end();
}

configureSuperadmin().catch(console.error);
