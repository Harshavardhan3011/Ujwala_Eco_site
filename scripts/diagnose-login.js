const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

globalThis.WebSocket = class Dummy {};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const db = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

async function diagnose() {
  console.log('--- TEST A: Direct Supabase Auth Check ---');

  // Test 1: harshavardhanvesalapu1@gmail.com
  const email1 = 'harshavardhanvesalapu1@gmail.com';
  const pass1 = process.env.SUPERADMIN_PASSWORD || 'UjwalaSuperAdmin2026!';

  const res1 = await db.auth.signInWithPassword({ email: email1, password: pass1 });
  if (res1.error || !res1.data?.user) {
    console.log(`User ${email1}: AUTH FAILURE (${res1.error?.message || 'No user returned'})`);
  } else {
    console.log(`User ${email1}: AUTH SUCCESS (User ID: ${res1.data.user.id})`);
  }

  // Test 2: ujwala.admin@gmail.com
  const email2 = 'ujwala.admin@gmail.com';
  const pass2 = process.env.ADMIN_INITIAL_PASSWORD || 'UjwalaAdminPassword2026!';

  const res2 = await db.auth.signInWithPassword({ email: email2, password: pass2 });
  if (res2.error || !res2.data?.user) {
    console.log(`User ${email2}: AUTH FAILURE (${res2.error?.message || 'No user returned'})`);
  } else {
    console.log(`User ${email2}: AUTH SUCCESS (User ID: ${res2.data.user.id})`);
  }
}

diagnose().catch(console.error);
