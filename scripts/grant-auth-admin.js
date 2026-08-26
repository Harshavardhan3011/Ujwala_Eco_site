const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function grantAuthAdmin() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  console.log('Granting schema & table permissions to supabase_auth_admin...');

  await client.query(`
    GRANT USAGE ON SCHEMA auth TO supabase_auth_admin, service_role, postgres;
    GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin, service_role, postgres;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin, service_role, postgres;
    GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO supabase_auth_admin, service_role, postgres;

    GRANT USAGE ON SCHEMA public TO supabase_auth_admin, service_role, postgres;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin, service_role, postgres;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin, service_role, postgres;
    GRANT ALL ON ALL ROUTINES IN SCHEMA public TO supabase_auth_admin, service_role, postgres;
  `);

  console.log('Permissions granted successfully!');
  await client.end();
}

grantAuthAdmin().catch(console.error);
