const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixRLS() {
  console.log('--- FIXING SUPABASE RLS PERMISSIONS VIA PG ---');
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
  console.log('Table RLS status before fix:');
  console.table(rlsCheck.rows);

  // Disable RLS or grant public select access on public catalog tables
  console.log('Disabling RLS on catalog tables and granting access to anon & authenticated...');
  await pgClient.query(`
    ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.product_images DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.product_variants DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.site_settings DISABLE ROW LEVEL SECURITY;
    
    GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
  `);

  const rlsCheckAfter = await pgClient.query(`
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename IN ('products', 'categories', 'product_images');
  `);
  console.log('Table RLS status AFTER fix:');
  console.table(rlsCheckAfter.rows);

  await pgClient.end();
}

fixRLS();
