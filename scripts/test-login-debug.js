const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const db = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  global: {
    fetch: (...args) => {
      console.log('FETCH URL:', args[0]);
      return fetch(...args);
    }
  }
});

async function run() {
  console.log('Testing login...');
  const { data, error } = await db.auth.signInWithPassword({
    email: 'admin@ujwalaeco.com',
    password: 'UjwalaAdminPassword2026!'
  });

  console.log('Result data:', data);
  console.log('Result error:', error);
}

run().catch(console.error);
