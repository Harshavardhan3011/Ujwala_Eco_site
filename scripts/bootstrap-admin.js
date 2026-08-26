/**
 * UJWALA ECO PRODUCTS — ADMIN BOOTSTRAP SCRIPT
 *
 * Usage:
 *   ADMIN_EMAIL="ujwala.admin@gmail.com" \
 *   ADMIN_INITIAL_PASSWORD="your-strong-password" \
 *   ADMIN_BOOTSTRAP_SECRET="your-bootstrap-secret" \
 *   node scripts/bootstrap-admin.js
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function bootstrapAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'ujwala.admin@gmail.com';
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'UjwalaAdminPassword2026!';
  const bootstrapSecret = process.env.ADMIN_BOOTSTRAP_SECRET || 'bootstrap_secret_2026';

  if (!adminEmail || !adminPassword || !bootstrapSecret) {
    console.error('Error: ADMIN_EMAIL, ADMIN_INITIAL_PASSWORD, and ADMIN_BOOTSTRAP_SECRET must be set in environment variables.');
    process.exit(1);
  }

  const cleanEmail = adminEmail.toLowerCase().trim();
  const dbUrl = process.env.SUPABASE_DB_URL;

  if (!dbUrl) {
    console.error('Error: SUPABASE_DB_URL environment variable is missing.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    const userRes = await client.query(
      `SELECT id FROM auth.users WHERE LOWER(email) = $1`,
      [cleanEmail]
    );

    let userId;

    if (userRes.rows.length === 0) {
      const insertRes = await client.query(
        `
        INSERT INTO auth.users (
          instance_id,
          id,
          aud,
          role,
          email,
          encrypted_password,
          email_confirmed_at,
          confirmation_token,
          recovery_token,
          email_change_token_new,
          raw_app_meta_data,
          raw_user_meta_data,
          created_at,
          updated_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000000',
          gen_random_uuid(),
          'authenticated',
          'authenticated',
          $1,
          crypt($2, gen_salt('bf')),
          NOW(),
          '',
          '',
          '',
          '{"provider":"email","providers":["email"]}'::jsonb,
          '{"name":"System Administrator","role":"admin","must_change_password":true}'::jsonb,
          NOW(),
          NOW()
        ) RETURNING id;
        `,
        [cleanEmail, adminPassword]
      );
      userId = insertRes.rows[0].id;
    } else {
      userId = userRes.rows[0].id;
      await client.query(
        `
        UPDATE auth.users
        SET encrypted_password = crypt($2, gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role":"admin","must_change_password":true}'::jsonb,
            updated_at = NOW()
        WHERE id = $1;
        `,
        [userId, adminPassword]
      );
    }

    // Ensure identity row exists
    await client.query(
      `
      INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        $1::uuid,
        $1::text,
        json_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true, 'phone_verified', false),
        'email',
        NOW(),
        NOW(),
        NOW()
      ) ON CONFLICT (provider_id, provider) DO UPDATE
      SET updated_at = NOW();
      `,
      [userId, cleanEmail]
    );

    // Ensure profile row in public.profiles
    await client.query(
      `
      INSERT INTO public.profiles (id, name, email, role, created_at, updated_at)
      VALUES ($1, 'System Administrator', $2, 'admin', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE
      SET role = 'admin',
          email = EXCLUDED.email,
          updated_at = NOW();
      `,
      [userId, cleanEmail]
    );

    console.log('Admin bootstrap completed successfully.');
  } finally {
    await client.end();
  }
}

bootstrapAdmin().catch((err) => {
  console.error('Admin bootstrap failed:', err.message);
  process.exit(1);
});
