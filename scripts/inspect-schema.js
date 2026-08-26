const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function inspectTables() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const tables = [
    'cart_items', 'addresses', 'orders', 'order_items', 'wishlist_items',
    'reviews', 'custom_orders', 'profiles'
  ];

  for (const tbl of tables) {
    try {
      const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [tbl]);
      console.log(`\n--- ${tbl} ---`);
      console.table(res.rows);
    } catch (e) {
      console.log(`\n--- ${tbl}: ERROR --- ${e.message}`);
    }
  }

  await client.end();
}

inspectTables().catch(console.error);
