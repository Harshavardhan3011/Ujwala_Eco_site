const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error('SUPABASE_DB_URL environment variable is missing!');
  process.exit(1);
}

async function run() {
  console.log('Connecting to Supabase PostgreSQL database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected successfully!');

  try {
    // 1. Run migration SQL
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log('Running migration script 001_initial_schema.sql...');
    await client.query(sqlContent);
    console.log('Migration completed successfully!');

    // 2. Clear existing data to ensure clean state
    console.log('Clearing existing product data for clean re-seed...');
    await client.query('TRUNCATE TABLE public.product_images, public.product_variants, public.products, public.categories CASCADE;');

    // 3. Seed Categories
    const categoriesData = [
      {
        name: 'Jute Shopping & Tote Bags',
        slug: 'shopping-tote-bags',
        description: 'Eco-friendly, durable jute shopping and tote bags for daily use, grocery, and carrying essentials.',
        image: '/bags/b1.jpeg',
        display_order: 1,
      },
      {
        name: 'Promotional & Event Bags',
        slug: 'promotional-event-bags',
        description: 'Customizable branded jute bags for corporate events, seminars, trade shows, and brand marketing.',
        image: '/bags/b5.jpeg',
        display_order: 2,
      },
      {
        name: 'Designer & Fancy Jute Bags',
        slug: 'designer-fancy-bags',
        description: 'Stylish handcrafted jute bags featuring ethnic prints, embroidery, vibrant handles, and modern aesthetics.',
        image: '/bags/b10.jpeg',
        display_order: 3,
      },
      {
        name: 'Executive & Laptop Jute Bags',
        slug: 'executive-laptop-bags',
        description: 'Sleek, office-ready padded jute laptops bags and executive folders with leatherette handles.',
        image: '/bags/b15.jpeg',
        display_order: 4,
      },
      {
        name: 'Return Gift & Wedding Bags',
        slug: 'return-gift-wedding-bags',
        description: 'Traditional and elegant jute return gift pouches for weddings, pujas, housewarmings, and festivals.',
        image: '/bags/b20.jpeg',
        display_order: 5,
      },
      {
        name: 'Brass & German Silver Items',
        slug: 'brass-german-silver',
        description: 'Exquisite handcrafted Brass and German Silver return gift items, diyas, plates, and artifacts.',
        image: '/bags/m1.jpeg',
        display_order: 6,
      },
      {
        name: 'Etikoppaka Wooden Toys',
        slug: 'etikoppaka-wooden-toys',
        description: 'Traditional GI-tagged eco-friendly wooden toys lacquered with natural vegetable dyes.',
        image: '/bags/m4.jpeg',
        display_order: 7,
      },
    ];

    const categoryIdMap = {};

    for (const cat of categoriesData) {
      const res = await client.query(
        `INSERT INTO public.categories (name, slug, description, image, display_order)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [cat.name, cat.slug, cat.description, cat.image, cat.display_order]
      );
      categoryIdMap[cat.slug] = res.rows[0].id;
    }
    console.log('Categories seeded:', Object.keys(categoryIdMap).length);

    // 4. Seed Products & Product Images
    const productsData = [
      {
        name: 'Classic Natural Jute Grocery Tote Bag',
        slug: 'classic-natural-jute-grocery-tote-bag',
        sku: 'UJW-BAG-001',
        description: 'Heavy-duty 100% natural jute tote bag with cotton padded handles. Reinforced stitching for up to 15kg capacity.',
        short_description: 'Durable 100% natural jute tote bag for groceries.',
        category_slug: 'shopping-tote-bags',
        price: 199.00,
        discount_price: 149.00,
        stock_quantity: 250,
        min_order_quantity: 5,
        available_colors: 'Natural, Beige, Olive',
        material: '100% Laminated Jute',
        dimensions: '14" x 15" x 6"',
        weight: '280g',
        is_customizable: true,
        customization_details: 'Custom logo printing available for orders of 50+ units.',
        is_featured: true,
        is_bestseller: true,
        tags: 'jute, shopping bag, tote, eco-friendly, natural',
        images: ['/bags/b1.jpeg', '/bags/b2.jpeg', '/bags/b3.jpeg']
      },
      {
        name: 'Floral Print Fancy Jute Handbag',
        slug: 'floral-print-fancy-jute-handbag',
        sku: 'UJW-BAG-002',
        description: 'Vibrant handcrafted jute handbag featuring traditional floral prints and smooth zipper closure.',
        short_description: 'Stylish printed jute handbag with zipper closure.',
        category_slug: 'designer-fancy-bags',
        price: 349.00,
        discount_price: 279.00,
        stock_quantity: 150,
        min_order_quantity: 1,
        available_colors: 'Multicolor, Maroon, Teal',
        material: 'Jute & Cotton Blend',
        dimensions: '12" x 14" x 4"',
        weight: '220g',
        is_customizable: true,
        is_featured: true,
        is_bestseller: true,
        tags: 'handbag, designer, floral, zip bag',
        images: ['/bags/b4.jpeg', '/bags/b5.jpeg', '/bags/b6.jpeg']
      },
      {
        name: 'Corporate Branding Jute Conference Bag',
        slug: 'corporate-branding-jute-conference-bag',
        sku: 'UJW-BAG-003',
        description: 'Professional jute document bag with pen slots and logo printing area. Ideal for seminars and corporate events.',
        short_description: 'Customizable corporate branding conference bag.',
        category_slug: 'promotional-event-bags',
        price: 220.00,
        discount_price: 180.00,
        stock_quantity: 500,
        min_order_quantity: 25,
        available_colors: 'Natural, Navy Blue, Maroon',
        material: 'Fine Weave Laminated Jute',
        dimensions: '15" x 11" x 3"',
        weight: '310g',
        is_customizable: true,
        customization_details: 'Screen printing and foil stamping available.',
        is_featured: true,
        is_bestseller: false,
        tags: 'corporate, event, conference, logo print',
        images: ['/bags/b7.jpeg', '/bags/b8.jpeg', '/bags/b9.jpeg']
      },
      {
        name: 'Executive Laptop & Document Jute Messenger Bag',
        slug: 'executive-laptop-document-jute-messenger-bag',
        sku: 'UJW-BAG-004',
        description: 'Padded laptop compartment jute messenger bag with vegan leather accents and adjustable shoulder strap.',
        short_description: 'Padded laptop messenger bag crafted from premium jute.',
        category_slug: 'executive-laptop-bags',
        price: 799.00,
        discount_price: 649.00,
        stock_quantity: 80,
        min_order_quantity: 1,
        available_colors: 'Brown, Black, Natural',
        material: 'Jute + Vegan Leather',
        dimensions: '16" x 12" x 4"',
        weight: '550g',
        is_customizable: true,
        is_featured: true,
        is_bestseller: false,
        tags: 'laptop bag, executive, messenger, office',
        images: ['/bags/b10.jpeg', '/bags/b11.jpeg', '/bags/b12.jpeg']
      },
      {
        name: 'Wedding Return Gift Mini Jute Pouch Set (Pack of 10)',
        slug: 'wedding-return-gift-mini-jute-pouch-set',
        sku: 'UJW-BAG-005',
        description: 'Elegant drawstring mini jute pouches with golden lace trim. Perfect for return gifts, dry fruits, and wedding favors.',
        short_description: 'Mini jute return gift pouches with golden lace trim.',
        category_slug: 'return-gift-wedding-bags',
        price: 499.00,
        discount_price: 399.00,
        stock_quantity: 300,
        min_order_quantity: 2,
        available_colors: 'Red, Gold, Green, Orange',
        material: 'Jute Brocade',
        dimensions: '6" x 8"',
        weight: '180g',
        is_customizable: true,
        is_featured: true,
        is_bestseller: true,
        tags: 'wedding gift, return gift, pouch, drawstring',
        images: ['/bags/b13.jpeg', '/bags/b14.jpeg', '/bags/b15.jpeg']
      },
      {
        name: 'Eco Shopping Jute Bag with Front Pocket',
        slug: 'eco-shopping-jute-bag-with-front-pocket',
        sku: 'UJW-BAG-006',
        description: 'Spacious daily utility jute tote bag featuring a convenient outer canvas pocket for keys and phone.',
        short_description: 'Spacious jute tote bag with extra outer pocket.',
        category_slug: 'shopping-tote-bags',
        price: 250.00,
        discount_price: 199.00,
        stock_quantity: 200,
        min_order_quantity: 5,
        available_colors: 'Natural & Green, Natural & Blue',
        material: 'Jute & Canvas Pocket',
        dimensions: '15" x 14" x 5"',
        weight: '300g',
        is_customizable: true,
        is_featured: false,
        is_bestseller: true,
        tags: 'pocket bag, tote, shopping, canvas accent',
        images: ['/bags/b16.jpeg', '/bags/b17.jpeg', '/bags/b18.jpeg']
      },
      {
        name: 'German Silver Embossed Diya & Plate Set',
        slug: 'german-silver-embossed-diya-plate-set',
        sku: 'UJW-MET-001',
        description: 'Intricately handcrafted German Silver plate with twin peacock diyas. Ideal for auspicious occasions and return gifts.',
        short_description: 'Handcrafted German Silver peacock diya return gift set.',
        category_slug: 'brass-german-silver',
        price: 599.00,
        discount_price: 499.00,
        stock_quantity: 60,
        min_order_quantity: 5,
        available_colors: 'Silver Finish',
        material: 'German Silver Metal',
        dimensions: '8" Diameter Plate',
        weight: '400g',
        is_customizable: false,
        is_featured: true,
        is_bestseller: true,
        tags: 'german silver, return gift, diya, plate set',
        images: ['/bags/m1.jpeg', '/bags/m2.jpeg', '/bags/m3.jpeg']
      },
      {
        name: 'Etikoppaka Handcrafted Wooden Kumkum Box',
        slug: 'etikoppaka-handcrafted-wooden-kumkum-box',
        sku: 'UJW-TOY-001',
        description: 'Traditional GI-tagged Etikoppaka wooden kumkum box lacquered with natural non-toxic vegetable dyes.',
        short_description: 'GI-tagged natural lacquered Etikoppaka wooden kumkum box.',
        category_slug: 'etikoppaka-wooden-toys',
        price: 299.00,
        discount_price: 249.00,
        stock_quantity: 120,
        min_order_quantity: 5,
        available_colors: 'Red & Yellow, Green & Red',
        material: 'Ankudi Wood & Natural Lac',
        dimensions: '3" Height x 2.5" Diameter',
        weight: '120g',
        is_customizable: false,
        is_featured: true,
        is_bestseller: false,
        tags: 'etikoppaka, wooden, kumkum box, GI tag, eco toy',
        images: ['/bags/m4.jpeg', '/bags/m5.jpeg']
      },
      {
        name: 'Printed Jute Bottle Bag (Single & Double Bottle)',
        slug: 'printed-jute-bottle-bag',
        sku: 'UJW-BAG-007',
        description: 'Sturdy jute bottle sleeve with divider inserts. Keeps bottles upright and protected during travel.',
        short_description: 'Sturdy eco-friendly jute bag for wine and beverage bottles.',
        category_slug: 'shopping-tote-bags',
        price: 150.00,
        discount_price: 120.00,
        stock_quantity: 180,
        min_order_quantity: 10,
        available_colors: 'Natural, Maroon, Olive Green',
        material: 'Laminated Jute',
        dimensions: '14" x 5" x 4"',
        weight: '160g',
        is_customizable: true,
        is_featured: false,
        is_bestseller: false,
        tags: 'bottle bag, jute sleeve, gift packaging',
        images: ['/bags/b19.jpeg', '/bags/b20.jpeg']
      },
      {
        name: 'Ethnic Embroidery Jute Clutch Bag',
        slug: 'ethnic-embroidery-jute-clutch-bag',
        sku: 'UJW-BAG-008',
        description: 'Chic hand-embroidered jute clutch bag with magnetic snap closure and detachable sling chain.',
        short_description: 'Hand-embroidered jute clutch bag with sling chain.',
        category_slug: 'designer-fancy-bags',
        price: 450.00,
        discount_price: 380.00,
        stock_quantity: 90,
        min_order_quantity: 2,
        available_colors: 'Golden Jute, Black, Maroon',
        material: 'Jute & Silk Thread Embroidery',
        dimensions: '10" x 6" x 2"',
        weight: '210g',
        is_customizable: true,
        is_featured: true,
        is_bestseller: false,
        tags: 'clutch, embroidery, fancy, sling bag',
        images: ['/bags/b21.jpeg', '/bags/b22.jpeg']
      },
      {
        name: 'Heavy-Duty Jute Utility Zipper Tote',
        slug: 'heavy-duty-jute-utility-zipper-tote',
        sku: 'UJW-BAG-009',
        description: 'Extra-large laminated jute utility tote with secure top zipper and inner zip pocket.',
        short_description: 'Extra large utility tote bag with full zipper top.',
        category_slug: 'shopping-tote-bags',
        price: 299.00,
        discount_price: 239.00,
        stock_quantity: 300,
        min_order_quantity: 5,
        available_colors: 'Natural & Black',
        material: 'Heavyweight Laminated Jute',
        dimensions: '17" x 14" x 7"',
        weight: '360g',
        is_customizable: true,
        is_featured: false,
        is_bestseller: true,
        tags: 'large tote, zipper, utility bag, shopping',
        images: ['/bags/b23.jpeg', '/bags/b24.jpeg', '/bags/b25.jpeg']
      }
    ];

    for (const p of productsData) {
      const categoryId = categoryIdMap[p.category_slug];
      if (!categoryId) {
        console.warn(`Category slug ${p.category_slug} not found for product ${p.name}`);
        continue;
      }

      const res = await client.query(
        `INSERT INTO public.products (
          name, slug, sku, description, short_description, category_id,
          price, discount_price, stock_quantity, min_order_quantity,
          available_colors, material, dimensions, weight, is_customizable,
          customization_details, is_featured, is_bestseller, tags
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        ) RETURNING id`,
        [
          p.name, p.slug, p.sku, p.description, p.short_description, categoryId,
          p.price, p.discount_price, p.stock_quantity, p.min_order_quantity,
          p.available_colors, p.material, p.dimensions, p.weight, p.is_customizable,
          p.customization_details || null, p.is_featured, p.is_bestseller, p.tags
        ]
      );

      const productId = res.rows[0].id;

      // Insert product images
      if (p.images && p.images.length > 0) {
        for (let idx = 0; idx < p.images.length; idx++) {
          const imgUrl = p.images[idx];
          await client.query(
            `INSERT INTO public.product_images (product_id, image_url, alt_text, is_primary, display_order)
             VALUES ($1, $2, $3, $4, $5)`,
            [productId, imgUrl, `${p.name} image ${idx + 1}`, idx === 0, idx]
          );
        }
      }
    }

    console.log('Products & Product Images seeded successfully!');

    // 5. Seed Site Settings
    const settings = [
      { key: 'site_name', value: 'Ujwala Eco Products' },
      { key: 'site_tagline', value: 'Sustainable Eco-Friendly Jute Bags & Handicrafts' },
      { key: 'support_email', value: 'contact@ujwalaecoproducts.com' },
      { key: 'support_phone', value: '+91 98765 43210' },
      { key: 'free_shipping_threshold', value: '999' },
    ];

    for (const s of settings) {
      await client.query(
        `INSERT INTO public.site_settings (key, value)
         VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [s.key, s.value]
      );
    }
    console.log('Site settings seeded!');

  } catch (err) {
    console.error('Error during migration & seeding:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
