const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

console.log('Testing Supabase Connection & Data...');

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

async function test() {
  const { data: categories, error: catErr } = await supabase.from('categories').select('*');
  console.log('\n--- CATEGORIES ---');
  if (catErr) console.error('Category error:', catErr);
  else console.log(`Found ${categories ? categories.length : 0} categories:`, categories ? categories.map(c => ({ name: c.name, slug: c.slug })) : []);

  const { data: products, count, error: prodErr } = await supabase
    .from('products')
    .select('*, images:product_images(*), category:categories(*)', { count: 'exact' });

  console.log('\n--- PRODUCTS ---');
  if (prodErr) console.error('Product error:', prodErr);
  else {
    console.log(`Found ${products ? products.length : 0} products (Total count: ${count}):`);
    (products || []).forEach(p => {
      console.log(`- [${p.id}] ${p.name} | Price: ₹${p.price} | Category: ${p.category?.slug || p.category_id} | Images: ${p.images?.length || 0}`);
      if (p.images && p.images.length > 0) {
        console.log(`   First image URL: ${p.images[0].image_url}`);
      }
    });
  }
}

test();
