const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function run() {
  try {
    const catCount = await db.category.count();
    const prodCount = await db.product.count();
    const featuredCount = await db.product.count({ where: { isFeatured: true } });
    const imgCount = await db.productImage.count();

    console.log('=== DATABASE COUNTS ===');
    console.log('categories:', catCount);
    console.log('products:', prodCount);
    console.log('featured products:', featuredCount);
    console.log('product images:', imgCount);

    if (catCount > 0) {
      const cats = await db.category.findMany({ include: { _count: { select: { products: true } } } });
      console.log('\n=== CATEGORIES ===');
      cats.forEach(c => console.log(' -', c.name, '| isActive:', c.isActive, '| products:', c._count.products, '| image:', c.image));
    }

    if (prodCount > 0) {
      const prods = await db.product.findMany({
        take: 5,
        include: { images: { take: 1 }, category: true },
      });
      console.log('\n=== PRODUCTS (first 5) ===');
      prods.forEach(p => console.log(
        ' -', p.name, '\n   price:', p.price, '| status:', p.productStatus,
        '| isFeatured:', p.isFeatured, '| stock:', p.stockQuantity,
        '| images:', '| img0:', p.images[0]?.imageUrl || 'NO IMAGE', '| cat:', p.category?.name
      ));
    }

    console.log('\nDB_URL resolves to: dev.db at', process.cwd());
  } catch (err) {
    console.error('DB ERROR:', err.message);
  } finally {
    await db.$disconnect();
  }
}
run();
