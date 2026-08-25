const { register } = require('ts-node');
register({ compilerOptions: { module: 'commonjs', target: 'es2020' } });
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient({ datasources: { db: { url: 'file:./prisma/dev.db' } } });

async function inspect() {
  const cats = await db.category.findMany({ include: { _count: { select: { products: true } } } });
  console.log('=== CATEGORIES ===');
  cats.forEach(c => console.log(c.slug, '| isActive:', c.isActive, '| products:', c._count.products, '| image:', c.image));

  const prods = await db.product.findMany({ include: { images: true, category: true }, take: 5 });
  console.log('\n=== PRODUCTS (first 5) ===');
  prods.forEach(p => console.log(
    p.slug, '| price:', p.price, '| status:', p.productStatus,
    '| isFeatured:', p.isFeatured, '| stock:', p.stockQuantity,
    '| images:', p.images.length, '| imgUrl:', p.images[0]?.imageUrl, '| cat:', p.category?.slug
  ));

  const totalProds = await db.product.count();
  const featuredProds = await db.product.count({ where: { isFeatured: true } });
  console.log('\n=== COUNTS ===');
  console.log('Total products:', totalProds, '| Featured:', featuredProds);
  await db.$disconnect();
}
inspect().catch(console.error);
