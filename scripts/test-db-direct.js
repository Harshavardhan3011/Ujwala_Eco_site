const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  console.log('--- DIRECT POSTGRESQL CHECK ---');
  const catRes = await client.query('SELECT count(*) FROM public.categories;');
  console.log('Total categories in DB:', catRes.rows[0].count);

  const prodRes = await client.query('SELECT count(*) FROM public.products;');
  console.log('Total products in DB:', prodRes.rows[0].count);

  const imgRes = await client.query('SELECT count(*) FROM public.product_images;');
  console.log('Total product images in DB:', imgRes.rows[0].count);

  const sampleProds = await client.query('SELECT id, name, price, is_featured FROM public.products LIMIT 5;');
  console.log('\nSample Products:');
  console.table(sampleProds.rows);

  await client.end();
}

check();
