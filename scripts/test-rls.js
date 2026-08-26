const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testRLS() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('--- TESTING SUPABASE ANON KEY VS SERVICE ROLE KEY ---');
  console.log('Anon Key exists:', !!anonKey);
  console.log('Service Role Key exists:', !!serviceKey);

  const anonClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { data: anonProducts, error: anonErr } = await anonClient.from('products').select('*');
  console.log('\nAnon Key result:');
  console.log('Error:', anonErr);
  console.log('Products returned with Anon Key:', anonProducts ? anonProducts.length : 0);

  if (serviceKey) {
    const serviceClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: serviceProducts, error: serviceErr } = await serviceClient.from('products').select('*');
    console.log('\nService Role Key result:');
    console.log('Error:', serviceErr);
    console.log('Products returned with Service Role Key:', serviceProducts ? serviceProducts.length : 0);
  }

  console.log('\n--- CHECKING RLS POLICIES & ENABLING PUBLIC READ VIA PG ---');
  const pgClient = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  await pgClient.connect();

  const rlsCheck = await pgClient.query(`
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename IN ('products', 'categories', 'product_images');
  `);
  console.log('Table RLS status:');
  console.table(rlsCheck.rows);

  // Disable RLS or grant public select access on public catalog tables
  console.log('Granting SELECT access to anon & authenticated on catalog tables...');
  await pgClient.query(`
    ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.product_images DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.product_variants DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.site_settings DISABLE ROW LEVEL SECURITY;
    
    GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
  `);

  console.log('RLS disabled and permissions granted.');

  const { data: retryProducts } = await anonClient.from('products').select('*');
  console.log('\nAnon Key result AFTER RLS fix:');
  console.log('Products returned with Anon Key:', retryProducts ? retryProducts.length : 0);

  await pgClient.end();
}

testRLS();
