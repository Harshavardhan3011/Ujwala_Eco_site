import { db } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '100000');
    const sort = searchParams.get('sort') || 'featured'; // 'price-low', 'price-high', 'newest', 'rating', 'featured'
    const featured = searchParams.get('featured');
    const bestseller = searchParams.get('bestseller');
    const customizable = searchParams.get('customizable');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '24');

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { sku: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    if (category) {
      where.category = {
        slug: category,
      };
    }

    if (minPrice > 0 || maxPrice < 100000) {
      where.price = {
        gte: minPrice,
        lte: maxPrice,
      };
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (bestseller === 'true') {
      where.isBestseller = true;
    }

    if (customizable === 'true') {
      where.isCustomizable = true;
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price-low') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price-high') {
      orderBy = { price: 'desc' };
    } else if (sort === 'featured') {
      orderBy = { isFeatured: 'desc' };
    }

    const total = await db.product.count({ where });
    const products = await db.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        reviews: {
          select: { rating: true },
        },
      },
    });

    const formattedProducts = products.map((p) => {
      const totalReviews = p.reviews.length;
      const avgRating = totalReviews > 0
        ? p.reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
        : 5;
      const { reviews, ...rest } = p;
      return {
        ...rest,
        avgRating,
        totalReviews,
      };
    });

    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getAuthFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access required' }, { status: 403 });
    }

    const data = await req.json();
    const {
      name,
      slug,
      sku,
      description,
      shortDescription,
      categoryId,
      price,
      discountPrice,
      stockQuantity,
      minOrderQuantity,
      material,
      dimensions,
      weight,
      isCustomizable,
      customizationDetails,
      isFeatured,
      isBestseller,
      tags,
      seoTitle,
      seoDescription,
      images, // array of image URLs
    } = data;

    if (!name || !sku || !categoryId || price === undefined) {
      return NextResponse.json({ error: 'Name, SKU, categoryId, and price are required' }, { status: 400 });
    }

    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const product = await db.product.create({
      data: {
        name,
        slug: generatedSlug,
        sku,
        description: description || '',
        shortDescription,
        categoryId,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        stockQuantity: parseInt(stockQuantity || '0'),
        minOrderQuantity: parseInt(minOrderQuantity || '1'),
        material,
        dimensions,
        weight,
        isCustomizable: Boolean(isCustomizable),
        customizationDetails,
        isFeatured: Boolean(isFeatured),
        isBestseller: Boolean(isBestseller),
        tags,
        seoTitle,
        seoDescription,
        images: {
          create: (images || []).map((imgUrl: string, index: number) => ({
            imageUrl: imgUrl,
            altText: `${name} Image ${index + 1}`,
            isPrimary: index === 0,
            displayOrder: index,
          })),
        },
      },
      include: {
        category: true,
        images: true,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}
