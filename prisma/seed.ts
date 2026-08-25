import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Ensure public/uploads directory exists and copy images
  const targetUploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(targetUploadsDir)) {
    fs.mkdirSync(targetUploadsDir, { recursive: true });
  }

  const imageFolders = [
    { src: path.join(process.cwd(), 'bags'), prefix: '' },
    { src: path.join(process.cwd(), 'opening'), prefix: '' },
    { src: path.join(process.cwd(), 'Ujwala Educational & Social Trust'), prefix: '' },
  ];

  imageFolders.forEach(({ src }) => {
    if (fs.existsSync(src)) {
      const files = fs.readdirSync(src);
      files.forEach((file) => {
        const srcFile = path.join(src, file);
        const destFile = path.join(targetUploadsDir, file);
        if (fs.lstatSync(srcFile).isFile()) {
          fs.copyFileSync(srcFile, destFile);
        }
      });
    }
  });

  // Copy WhatsApp images if they exist
  const rootFiles = ['WhatsApp Image 2026-08-25 at 7.14.42 PM.jpeg', 'WhatsApp Image 2026-08-25 at 7.16.38 PM.jpeg'];
  rootFiles.forEach((file) => {
    const srcFile = path.join(process.cwd(), file);
    if (fs.existsSync(srcFile)) {
      const safeName = file.includes('7.14.42') ? 'founder-suguna.jpeg' : 'ujwala-banner.jpeg';
      fs.copyFileSync(srcFile, path.join(targetUploadsDir, safeName));
    }
  });

  console.log('✅ Image assets copied to /public/uploads');

  // 2. Clean existing records
  await prisma.review.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.wishlistItem.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.customOrder.deleteMany({});
  await prisma.siteSetting.deleteMany({});
  await prisma.user.deleteMany({});

  // 3. Seed Site Settings
  const settings = [
    { key: 'site_name', value: 'Ujwala Eco Products' },
    { key: 'site_tagline', value: 'Say No to Plastic – Handcrafted Eco-Friendly Jute Bags & Return Gifts' },
    { key: 'phone_primary', value: '+91 9849530536' },
    { key: 'phone_secondary', value: '+91 9701347838, +91 8374431924' },
    { key: 'email', value: 'contact@ujwalaeco.com' },
    { key: 'address', value: 'D.No. 7-116, Simhadrinagar, Sector-1, Duvvada, Near VSEZ, Visakhapatnam - 530 049, Andhra Pradesh' },
    { key: 'whatsapp_number', value: '919849530536' },
    { key: 'founder_name', value: 'N. Suguna' },
    { key: 'trust_name', value: 'Ujwala Educational & Social Trust (Est. 2012)' },
    { key: 'announcement_banner', value: '🌿 Custom Jute Bags Available for Weddings, Housewarmings & Bulk Shop Orders! Direct Factory Prices.' },
    { key: 'youtube_url', value: 'https://www.youtube.com/embed/_KQ70ZSE_p4' },
  ];

  for (const setting of settings) {
    await prisma.siteSetting.create({ data: setting });
  }

  // 4. Seed Users
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      name: 'N. Suguna (Admin)',
      email: 'admin@ujwalaeco.com',
      passwordHash: adminPasswordHash,
      phone: '+91 9849530536',
      role: 'ADMIN',
    },
  });

  const customerPasswordHash = await bcrypt.hash('customer123', 10);
  const customerUser = await prisma.user.create({
    data: {
      name: 'Ramesh Kumar',
      email: 'customer@gmail.com',
      passwordHash: customerPasswordHash,
      phone: '+91 9876543210',
      role: 'CUSTOMER',
      addresses: {
        create: {
          recipientName: 'Ramesh Kumar',
          phone: '+91 9876543210',
          streetAddress: 'Flat 402, Royal Residency, MVP Colony',
          city: 'Visakhapatnam',
          state: 'Andhra Pradesh',
          postalCode: '530017',
          isDefault: true,
        },
      },
    },
  });

  console.log('✅ Users created: Admin (admin@ujwalaeco.com / admin123), Customer (customer@gmail.com / customer123)');

  // 5. Seed Categories
  const categoriesData = [
    {
      name: 'Jute Bags',
      slug: 'jute-bags',
      description: 'Durable, 100% natural, biodegradable everyday tote & shopping bags handcrafted by local women artisans.',
      image: '/uploads/b1.jpeg',
      displayOrder: 1,
    },
    {
      name: 'Customized Jute Bags',
      slug: 'customized-jute-bags',
      description: 'Personalized jute bags tailored with custom logo printing, colors, and designs for special occasions & corporate branding.',
      image: '/uploads/b3.jpeg',
      displayOrder: 2,
    },
    {
      name: 'Gift & Return Gift Bags',
      slug: 'gift-return-gift-bags',
      description: 'Elegant return gift pouches and decorative bags for weddings, housewarmings, engagements, and birthday celebrations.',
      image: '/uploads/b5.jpeg',
      displayOrder: 3,
    },
    {
      name: 'Designer Jute Bags',
      slug: 'designer-jute-bags',
      description: 'Stylish printed jute handbags with padded handles, inner cotton lining, and waterproof coating.',
      image: '/uploads/b10.jpeg',
      displayOrder: 4,
    },
    {
      name: 'Utility Bags & Pouches',
      slug: 'utility-bags-pouches',
      description: 'Multipurpose eco pouches, lunch boxes, bottle bags, and grocery totes designed for daily convenience.',
      image: '/uploads/b4.jpeg',
      displayOrder: 5,
    },
    {
      name: 'Brass & German Silver Items',
      slug: 'brass-german-silver',
      description: 'Handcrafted traditional brass lamps, pooja accessories, and German silver return gift collectibles.',
      image: '/uploads/b18.jpeg',
      displayOrder: 6,
    },
    {
      name: 'Etikoppaka Wooden Toys',
      slug: 'etikoppaka-wooden-toys',
      description: 'Authentic GI-tagged Etikoppaka lacquerware wooden toys crafted with natural vegetable dyes.',
      image: '/uploads/b22.jpeg',
      displayOrder: 7,
    },
  ];

  const categories: Record<string, any> = {};
  for (const catData of categoriesData) {
    const created = await prisma.category.create({ data: catData });
    categories[catData.slug] = created;
  }

  console.log('✅ Categories created');

  // 6. Seed Products
  const productsData = [
    {
      name: 'Eco-Friendly Everyday Jute Tote Bag',
      slug: 'eco-friendly-everyday-jute-tote-bag',
      sku: 'UJW-BAG-001',
      description: 'Handwoven from 100% raw natural jute fibre. Stitched for high durability with padded rope handles and waterproof inner coating. Reusable and fully biodegradable.',
      shortDescription: '100% Natural Jute Tote with padded cotton rope handles.',
      categorySlug: 'jute-bags',
      price: 180,
      discountPrice: 150,
      stockQuantity: 150,
      minOrderQuantity: 5,
      material: '100% Natural Golden Jute',
      dimensions: '12" W x 14" H x 4" D',
      weight: '220g',
      isCustomizable: true,
      customizationDetails: 'Custom text and logo printing available on bulk orders above 25 pcs.',
      isFeatured: true,
      isBestseller: true,
      productStatus: 'IN_STOCK',
      tags: 'jute tote, eco bag, reusable, shopping bag',
      images: ['/uploads/b1.jpeg', '/uploads/b2.jpeg'],
    },
    {
      name: 'Heavy-Duty Bulk Grocery Jute Carrier',
      slug: 'heavy-duty-bulk-grocery-jute-carrier',
      sku: 'UJW-BAG-002',
      description: 'Spacious heavy-grade golden jute shopping bag reinforced with double stitching and comfort cotton webbed handles. Perfect for super market shopping.',
      shortDescription: 'Reinforced heavy-duty grocery tote bag.',
      categorySlug: 'jute-bags',
      price: 220,
      discountPrice: 190,
      stockQuantity: 120,
      minOrderQuantity: 5,
      material: 'Laminated Natural Jute',
      dimensions: '14" W x 16" H x 6" D',
      weight: '280g',
      isCustomizable: false,
      isFeatured: true,
      isBestseller: false,
      productStatus: 'IN_STOCK',
      tags: 'grocery bag, large tote, heavy duty',
      images: ['/uploads/b2.jpeg', '/uploads/b1.jpeg'],
    },
    {
      name: 'Custom Printed Wedding Favor Jute Bag',
      slug: 'custom-printed-wedding-favor-jute-bag',
      sku: 'UJW-CST-003',
      description: 'Premium customizable return gift jute bag tailored for weddings, engagements, and housewarming ceremonies. Personalize with couple names, event dates, and custom artwork.',
      shortDescription: 'Custom printed wedding return gift jute bag.',
      categorySlug: 'customized-jute-bags',
      price: 250,
      discountPrice: 210,
      stockQuantity: 300,
      minOrderQuantity: 20,
      material: 'Export Quality Jute with Soft Cotton Handle',
      dimensions: '10" W x 12" H x 4" D',
      weight: '190g',
      isCustomizable: true,
      customizationDetails: 'Provide bride & groom names, event date, and print color preference.',
      isFeatured: true,
      isBestseller: true,
      productStatus: 'IN_STOCK',
      tags: 'wedding favor, custom bag, return gift, personalized',
      images: ['/uploads/b3.jpeg', '/uploads/b5.jpeg'],
    },
    {
      name: 'Compact Eco Zipper Lunch & Utility Bag',
      slug: 'compact-eco-zipper-lunch-utility-bag',
      sku: 'UJW-UTL-004',
      description: 'Insulated waterproof jute pouch with smooth zip closure. Ideal for carrying office lunch boxes, water bottles, and personal utility items.',
      shortDescription: 'Waterproof zip-top lunch bag.',
      categorySlug: 'utility-bags-pouches',
      price: 160,
      discountPrice: 135,
      stockQuantity: 80,
      minOrderQuantity: 2,
      material: 'Waterproof Laminated Jute',
      dimensions: '10" W x 10" H x 5" D',
      weight: '160g',
      isCustomizable: true,
      isFeatured: false,
      isBestseller: true,
      productStatus: 'IN_STOCK',
      tags: 'lunch bag, zipper pouch, office tote',
      images: ['/uploads/b4.jpeg', '/uploads/b14.jpeg'],
    },
    {
      name: 'Royal Golden Border Wedding Return Gift Bag',
      slug: 'royal-golden-border-wedding-return-gift-bag',
      sku: 'UJW-GFT-005',
      description: 'Exquisite return gift jute bag featuring traditional golden zari borders and reinforced cane handles. Gives a majestic touch to your function return gifts.',
      shortDescription: 'Zari border decorative return gift tote.',
      categorySlug: 'gift-return-gift-bags',
      price: 200,
      discountPrice: 175,
      stockQuantity: 200,
      minOrderQuantity: 10,
      material: 'Jute Silk Blend with Zari Trim',
      dimensions: '11" W x 11" H x 4" D',
      weight: '210g',
      isCustomizable: true,
      isFeatured: true,
      isBestseller: true,
      productStatus: 'IN_STOCK',
      tags: 'return gift, golden border, housewarming gift',
      images: ['/uploads/b5.jpeg', '/uploads/b7.jpeg'],
    },
    {
      name: 'Botanical Leaf Print Designer Handbag',
      slug: 'botanical-leaf-print-designer-handbag',
      sku: 'UJW-DSG-006',
      description: 'Contemporary eco-fashion handbag styled with screen-printed eco-leaf graphics, sturdy cane handles, and internal zipper pocket.',
      shortDescription: 'Screen-printed leaf pattern designer tote.',
      categorySlug: 'designer-jute-bags',
      price: 290,
      discountPrice: 249,
      stockQuantity: 65,
      minOrderQuantity: 1,
      material: 'Fine Weave Jute Canvas',
      dimensions: '13" W x 14" H x 4.5" D',
      weight: '250g',
      isCustomizable: true,
      isFeatured: true,
      isBestseller: false,
      productStatus: 'IN_STOCK',
      tags: 'designer tote, leaf print, handbag',
      images: ['/uploads/b6.jpeg', '/uploads/b8.jpeg'],
    },
    {
      name: 'Traditional Motif Printed Pooja Gift Bag',
      slug: 'traditional-motif-printed-pooja-gift-bag',
      sku: 'UJW-GFT-007',
      description: 'Vibrant ethnic printed jute gift carrier decorated with traditional Indian motifs. Ideal for distributing sweets and prasadam during festivals.',
      shortDescription: 'Ethnic print festival & pooja gift bag.',
      categorySlug: 'gift-return-gift-bags',
      price: 150,
      discountPrice: 130,
      stockQuantity: 180,
      minOrderQuantity: 10,
      material: 'Dyed Jute Yarn',
      dimensions: '9" W x 10" H x 3.5" D',
      weight: '150g',
      isCustomizable: true,
      isFeatured: false,
      isBestseller: false,
      productStatus: 'IN_STOCK',
      tags: 'pooja bag, prasadam pouch, festival gift',
      images: ['/uploads/b7.jpeg', '/uploads/b9.jpeg'],
    },
    {
      name: 'Contemporary Color-Block Jute Shoulder Bag',
      slug: 'contemporary-color-block-jute-shoulder-bag',
      sku: 'UJW-DSG-008',
      description: 'Chic dual-tone color-block handbag with long padded shoulder straps and magnetic button fastener.',
      shortDescription: 'Dual-tone shoulder tote with magnetic closure.',
      categorySlug: 'designer-jute-bags',
      price: 320,
      discountPrice: 279,
      stockQuantity: 45,
      minOrderQuantity: 1,
      material: 'Premium Dyed Jute Canvas',
      dimensions: '14" W x 15" H x 5" D',
      weight: '290g',
      isCustomizable: true,
      isFeatured: false,
      isBestseller: true,
      productStatus: 'IN_STOCK',
      tags: 'shoulder bag, dual tone, designer',
      images: ['/uploads/b8.jpeg', '/uploads/b10.jpeg'],
    },
    {
      name: 'Drawstring Jute Jewelry & Coin Pouch',
      slug: 'drawstring-jute-jewelry-coin-pouch',
      sku: 'UJW-UTL-009',
      description: 'Rustic drawstring pouch crafted from soft raw jute fabric. Ideal for jewelry, return gift coins, dry fruits, and small goodies.',
      shortDescription: 'Rustic raw jute drawstring pouch.',
      categorySlug: 'utility-bags-pouches',
      price: 75,
      discountPrice: 60,
      stockQuantity: 400,
      minOrderQuantity: 15,
      material: 'Soft Raw Jute',
      dimensions: '6" W x 8" H',
      weight: '60g',
      isCustomizable: true,
      isFeatured: false,
      isBestseller: true,
      productStatus: 'IN_STOCK',
      tags: 'drawstring pouch, coin pouch, dry fruit bag',
      images: ['/uploads/b9.jpeg', '/uploads/b13.jpeg'],
    },
    {
      name: 'Multi-Compartment Shopping & Travel Jute Bag',
      slug: 'multi-compartment-shopping-travel-jute-bag',
      sku: 'UJW-BAG-010',
      description: 'Large travel and market tote featuring front pocket, bottle sleeve, and extra thick base support.',
      shortDescription: 'Multi-pocket travel & market jute bag.',
      categorySlug: 'jute-bags',
      price: 350,
      discountPrice: 299,
      stockQuantity: 50,
      minOrderQuantity: 2,
      material: 'Heavy-Grade Laminated Jute',
      dimensions: '15" W x 16" H x 6" D',
      weight: '340g',
      isCustomizable: true,
      isFeatured: true,
      isBestseller: false,
      productStatus: 'IN_STOCK',
      tags: 'travel bag, multi pocket, market tote',
      images: ['/uploads/b10.jpeg', '/uploads/b11.jpeg'],
    },
    {
      name: 'Custom Corporate Logo Printed Jute Conference Tote',
      slug: 'custom-corporate-logo-printed-jute-conference-tote',
      sku: 'UJW-CST-011',
      description: 'Professional conference bag designed for corporate events, seminars, and AGMs. Holds A4 notebooks and laptops securely.',
      shortDescription: 'A4 corporate conference tote with logo print.',
      categorySlug: 'customized-jute-bags',
      price: 280,
      discountPrice: 240,
      stockQuantity: 250,
      minOrderQuantity: 15,
      material: 'Export Jute with Nylon Stitching',
      dimensions: '12" W x 15" H x 4" D',
      weight: '230g',
      isCustomizable: true,
      customizationDetails: 'Upload vector logo and custom event text.',
      isFeatured: true,
      isBestseller: false,
      productStatus: 'IN_STOCK',
      tags: 'corporate bag, conference tote, logo print',
      images: ['/uploads/b11.jpeg', '/uploads/b12.jpeg'],
    },
    {
      name: 'Elegant Peacock Print Return Gift Bag',
      slug: 'elegant-peacock-print-return-gift-bag',
      sku: 'UJW-GFT-012',
      description: 'Stunning peacock artwork printed on natural golden jute canvas with golden cord handles.',
      shortDescription: 'Peacock motif wedding return gift bag.',
      categorySlug: 'gift-return-gift-bags',
      price: 210,
      discountPrice: 180,
      stockQuantity: 140,
      minOrderQuantity: 10,
      material: 'Fine Jute Yarn',
      dimensions: '10" W x 12" H x 4" D',
      weight: '190g',
      isCustomizable: true,
      isFeatured: false,
      isBestseller: true,
      productStatus: 'IN_STOCK',
      tags: 'peacock print, return gift, function tote',
      images: ['/uploads/b12.jpeg', '/uploads/b15.jpeg'],
    },
    {
      name: 'Traditional Brass Pooja Diya / Lamp Set',
      slug: 'traditional-brass-pooja-diya-lamp-set',
      sku: 'UJW-BRS-018',
      description: 'Authentic handcrafted solid brass oil lamp diyas crafted by Andhra artisans. Ideal return gift collectible for traditional ceremonies.',
      shortDescription: 'Solid brass traditional pooja oil diya set.',
      categorySlug: 'brass-german-silver',
      price: 450,
      discountPrice: 390,
      stockQuantity: 40,
      minOrderQuantity: 2,
      material: '100% Solid Brass',
      dimensions: '4" Height x 3" Diameter',
      weight: '350g',
      isCustomizable: false,
      isFeatured: true,
      isBestseller: true,
      productStatus: 'IN_STOCK',
      tags: 'brass diya, pooja item, return gift brass',
      images: ['/uploads/b18.jpeg', '/uploads/b17.jpeg'],
    },
    {
      name: 'German Silver Embossed Pooja Bowl & Plate Set',
      slug: 'german-silver-embossed-pooja-bowl-plate-set',
      sku: 'UJW-SLV-019',
      description: 'Intricately carved German Silver return gift set featuring kumkum bowl and carved plate, packed in velvet presentation box.',
      shortDescription: 'German Silver gift set with velvet box.',
      categorySlug: 'brass-german-silver',
      price: 520,
      discountPrice: 460,
      stockQuantity: 30,
      minOrderQuantity: 5,
      material: 'German Silver Alloy',
      dimensions: '6" Plate Diameter',
      weight: '280g',
      isCustomizable: false,
      isFeatured: true,
      isBestseller: false,
      productStatus: 'IN_STOCK',
      tags: 'german silver, return gift, pooja plate',
      images: ['/uploads/b19.jpeg', '/uploads/b16.jpeg'],
    },
    {
      name: 'Authentic Etikoppaka Lacquerware Wooden Dancing Doll',
      slug: 'authentic-etikoppaka-lacquerware-wooden-dancing-doll',
      sku: 'UJW-ETK-022',
      description: 'Hand-turned GI-tagged Etikoppaka wooden dancing doll colored with non-toxic natural vegetable dyes and shellac polish.',
      shortDescription: 'GI-tagged Etikoppaka natural lacquer wooden doll.',
      categorySlug: 'etikoppaka-wooden-toys',
      price: 380,
      discountPrice: 320,
      stockQuantity: 50,
      minOrderQuantity: 2,
      material: 'Ankudi Wood & Natural Vegetable Dyes',
      dimensions: '7" Height',
      weight: '180g',
      isCustomizable: false,
      isFeatured: true,
      isBestseller: true,
      productStatus: 'IN_STOCK',
      tags: 'etikoppaka toy, wooden doll, handmade toy',
      images: ['/uploads/b22.jpeg', '/uploads/b23.jpeg'],
    },
    {
      name: 'Etikoppaka Handcrafted Wooden Kumkum Box Set',
      slug: 'etikoppaka-handcrafted-wooden-kumkum-box-set',
      sku: 'UJW-ETK-024',
      description: 'Charming round Etikoppaka lacquerware wooden container set with smooth fitted lid, painted in vibrant organic yellow and red hues.',
      shortDescription: 'Eco-friendly Etikoppaka wooden kumkum box.',
      categorySlug: 'etikoppaka-wooden-toys',
      price: 240,
      discountPrice: 199,
      stockQuantity: 70,
      minOrderQuantity: 5,
      material: 'Natural Wood with Shellac Finish',
      dimensions: '3" Diameter x 2.5" Height',
      weight: '110g',
      isCustomizable: false,
      isFeatured: false,
      isBestseller: true,
      productStatus: 'IN_STOCK',
      tags: 'etikoppaka, kumkum box, wooden souvenir',
      images: ['/uploads/b24.jpeg', '/uploads/b25.jpeg'],
    },
  ];

  for (const prodData of productsData) {
    const { categorySlug, images, ...rest } = prodData;
    const cat = categories[categorySlug];
    if (!cat) continue;

    const product = await prisma.product.create({
      data: {
        ...rest,
        categoryId: cat.id,
        images: {
          create: images.map((imgUrl, idx) => ({
            imageUrl: imgUrl,
            altText: `${prodData.name} - View ${idx + 1}`,
            isPrimary: idx === 0,
            displayOrder: idx,
          })),
        },
        variants: {
          create: [
            { color: 'Natural Jute', size: 'Medium (12"x14")', additionalPrice: 0, stockQuantity: 50 },
            { color: 'Forest Green', size: 'Medium (12"x14")', additionalPrice: 20, stockQuantity: 30 },
            { color: 'Maroon', size: 'Large (14"x16")', additionalPrice: 40, stockQuantity: 25 },
          ],
        },
      },
    });

    // Create a sample review
    await prisma.review.create({
      data: {
        productId: product.id,
        userId: customerUser.id,
        userName: customerUser.name,
        rating: 5,
        comment: 'Exceptional stitching quality! We ordered 50 pieces for our daughter\'s housewarming return gifts. High quality jute and super fast delivery.',
        isApproved: true,
      },
    });
  }

  console.log('✅ Products, variants, and reviews seeded');

  // 7. Seed Sample Custom Orders
  await prisma.customOrder.create({
    data: {
      customerName: 'Srinivas Rao',
      email: 'srinivas.rao@gmail.com',
      phone: '+91 9440123456',
      productType: 'Customized Jute Gift Bags',
      quantity: 100,
      requiredDimensions: '10" x 12" x 4"',
      colorPreference: 'Natural Jute with Maroon Border',
      customText: 'Srinivas & Lakshmi Housewarming Ceremony - 15th Sept 2026',
      eventType: 'Housewarming Ceremony',
      requiredDeliveryDate: '2026-09-10',
      specialInstructions: 'Please ensure gold foil printing on the front panel and soft cotton rope handles.',
      status: 'NEW',
    },
  });

  console.log('✅ Sample Custom Order seeded');
  console.log('🎉 Seeding complete successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
