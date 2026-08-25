require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function run() {
  try {
    const catCount = await db.category.count();
    const prodCount = await db.product.count();
    const featuredCount = await db.product.count({ where: { isFeatured: true } });
    const imgCount = await db.productImage.count();

    console.log('=== DATABASE COUNTS ===');
    console.log('categories:', catCount, '| products:', prodCount, '| featured:', featuredCount, '| images:', imgCount);

    if (catCount > 0) {
      const cats = await db.category.findMany({ include: { _count: { select: { products: true } } } });
      console.log('\n=== CATEGORIES ===');
      cats.forEach(c => console.log(' -', c.name, '| image:', c.image, '| products:', c._count.products));
    }

    const prods = await db.product.findMany({ take: 5, include: { images: { take: 2 } } });
    console.log('\n=== PRODUCTS image sample ===');
    prods.forEach(p => {
      const imgs = p.images.map(i => i.imageUrl).join(', ');
      console.log(' -', p.name, '| imgs:', imgs || 'NO IMAGES');
    });
  } catch (err) {
    console.error('DB ERROR:', err.message);
  } finally {
    await db.$disconnect();
  }
}
run();
