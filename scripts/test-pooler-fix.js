const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

function getValidConnectionString(url) {
  if (!url) return undefined;
  if (url.includes('db.ujkhgvhqofdbqwgahslc.supabase.co')) {
    return url
      .replace('db.ujkhgvhqofdbqwgahslc.supabase.co', 'aws-0-ap-south-1.pooler.supabase.com')
      .replace('postgres:', 'postgres.ujkhgvhqofdbqwgahslc:');
  }
  return url;
}

async function testPoolerFix() {
  const connectionString = getValidConnectionString(process.env.SUPABASE_DB_URL);
  console.log('Formatted Connection String Host:', new URL(connectionString).hostname);

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  const res = await client.query('SELECT count(*) FROM public.profiles WHERE LOWER(role) IN (\'admin\', \'superadmin\')');
  console.log('✅ DB QUERY SUCCESS! Total admin users in profiles:', res.rows[0].count);
  await client.end();
}

testPoolerFix().catch(console.error);
