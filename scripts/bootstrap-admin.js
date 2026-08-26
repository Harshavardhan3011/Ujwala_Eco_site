/**
 * UJWALA ECO PRODUCTS — ADMIN BOOTSTRAP SCRIPT
 *
 * Usage:
 *   ADMIN_EMAIL="admin@ujwalaeco.com" \
 *   ADMIN_INITIAL_PASSWORD="your-strong-password" \
 *   ADMIN_BOOTSTRAP_SECRET="your-bootstrap-secret" \
 *   node scripts/bootstrap-admin.js
 *
 * This script runs server-side and uses the database connection URL or
 * Supabase Service Role Key to bootstrap the admin account securely.
 * It NEVER logs sensitive credentials or tokens.
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

async function bootstrapAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  const bootstrapSecret = process.env.ADMIN_BOOTSTRAP_SECRET;

  if (!adminEmail || !adminPassword || !bootstrapSecret) {
    console.error('Error: ADMIN_EMAIL, ADMIN_INITIAL_PASSWORD, and ADMIN_BOOTSTRAP_SECRET must be set in environment variables.');
    process.exit(1);
  }

  // Sanitize email
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
    // 1. Check if user exists in auth.users
    const userRes = await client.query(
      `SELECT id, email FROM auth.users WHERE LOWER(email) = $1`,
      [cleanEmail]
    );

    let userId;

    if (userRes.rows.length === 0) {
      // 2a. Create new auth user using pgcrypto for encrypted_password
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
      // 2b. User exists: update password and metadata
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

    // 3. Ensure profile in public.profiles has role = 'admin'
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

    // Safe success output without logging email, password, or secret
    console.log('Admin bootstrap completed successfully.');
  } finally {
    await client.end();
  }
}

bootstrapAdmin().catch((err) => {
  console.error('Admin bootstrap failed:', err.message);
  process.exit(1);
});
