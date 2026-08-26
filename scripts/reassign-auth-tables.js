const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function reassignAuthTables() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  console.log('Reassigning auth tables owner to postgres...');

  const authTablesRes = await client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'auth' AND rowsecurity = true"
  );

  for (const row of authTablesRes.rows) {
    const tbl = row.tablename;
    try {
      await client.query(`ALTER TABLE auth."${tbl}" OWNER TO postgres;`);
      await client.query(`ALTER TABLE auth."${tbl}" DISABLE ROW LEVEL SECURITY;`);
      console.log(`✅ Disabled RLS on auth.${tbl}`);
    } catch (e) {
      console.error(`❌ auth.${tbl}: ${e.message}`);
    }
  }

  await client.end();
}

reassignAuthTables().catch(console.error);
