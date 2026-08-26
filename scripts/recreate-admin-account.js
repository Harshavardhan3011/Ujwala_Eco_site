const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

globalThis.WebSocket = class Dummy {};

async function recreateAdmin() {
  const pgClient = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  await pgClient.connect();

  console.log('Cleaning up old manual admin records...');
  await pgClient.query("DELETE FROM auth.identities WHERE email = 'admin@ujwalaeco.com'");
  await pgClient.query("DELETE FROM public.profiles WHERE email = 'admin@ujwalaeco.com'");
  await pgClient.query("DELETE FROM auth.users WHERE email = 'admin@ujwalaeco.com'");
  console.log('Cleaned up old record.');

  await pgClient.end();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const db = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

  console.log('Registering admin user through Supabase Auth API...');
  const { data: signUpData, error: signUpError } = await db.auth.signUp({
    email: 'admin@ujwalaeco.com',
    password: 'UjwalaAdminPassword2026!',
    options: {
      data: { name: 'System Administrator', role: 'admin' },
    },
  });

  if (signUpError) {
    console.error('signUpError:', signUpError);
    return;
  }

  const userId = signUpData.user.id;
  console.log(`Admin user created via Auth API! User ID: ${userId}`);

  // Confirm email and assign admin profile
  const pgClient2 = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
  });
  await pgClient2.connect();

  await pgClient2.query(
    "UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = $1",
    [userId]
  );

  await pgClient2.query(
    "INSERT INTO public.profiles (id, name, email, role, created_at, updated_at) VALUES ($1, 'System Administrator', 'admin@ujwalaeco.com', 'admin', NOW(), NOW()) ON CONFLICT (id) DO UPDATE SET role = 'admin'",
    [userId]
  );

  console.log('✅ Admin user confirmed and profile set to admin!');
  await pgClient2.end();
}

recreateAdmin().catch(console.error);
