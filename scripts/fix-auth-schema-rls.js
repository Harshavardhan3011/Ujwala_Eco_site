const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixAuthSchemaRLS() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  console.log('Granting supabase_auth_admin role to postgres...');
  try {
    await client.query('GRANT supabase_auth_admin TO postgres;');
    console.log('Role granted!');
  } catch (e) {
    console.warn('Grant role warning:', e.message);
  }

  const authTablesRes = await client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'auth' AND rowsecurity = true"
  );

  for (const row of authTablesRes.rows) {
    const tbl = row.tablename;
    console.log(`Disabling RLS on auth.${tbl}...`);
    try {
      await client.query(`SET ROLE supabase_auth_admin; ALTER TABLE auth."${tbl}" DISABLE ROW LEVEL SECURITY; RESET ROLE;`);
      console.log(`  ✅ Disabled RLS on auth.${tbl}`);
    } catch (e) {
      console.error(`  ❌ Failed on auth.${tbl}: ${e.message}`);
      await client.query('RESET ROLE;');
    }
  }

  console.log('Auth schema RLS cleanup complete!');
  await client.end();
}

fixAuthSchemaRLS().catch(console.error);
