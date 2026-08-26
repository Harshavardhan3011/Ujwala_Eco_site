const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkImages() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  console.log('--- CHECKING PRODUCT IMAGES TABLE ---');
  const imgRows = await client.query(`
    SELECT pi.id, p.name as product_name, pi.image_url, pi.is_primary 
    FROM public.product_images pi 
    JOIN public.products p ON pi.product_id = p.id 
    LIMIT 10;
  `);

  console.table(imgRows.rows);

  await client.end();
}

checkImages();
