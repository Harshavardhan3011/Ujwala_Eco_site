import { db } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const product = await db.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }, { sku: id }],
      },
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        variants: true,
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const totalReviews = product.reviews.length;
    const avgRating = totalReviews > 0
      ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
      : 5;

    // Fetch related products from same category
    const relatedProducts = await db.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
      },
      take: 4,
      include: {
        images: { orderBy: { displayOrder: 'asc' } },
        category: true,
      },
    });

    return NextResponse.json({
      product: {
        ...product,
        avgRating,
        totalReviews,
      },
      relatedProducts,
    });
  } catch (error) {
    console.error('Get product detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch product details' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getAuthFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access required' }, { status: 403 });
    }

    const { id } = params;
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
      productStatus,
      isFeatured,
      isBestseller,
      tags,
      seoTitle,
      seoDescription,
      images,
    } = data;

    const product = await db.product.update({
      where: { id },
      data: {
        name,
        slug,
        sku,
        description,
        shortDescription,
        categoryId,
        price: price !== undefined ? parseFloat(price) : undefined,
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        stockQuantity: stockQuantity !== undefined ? parseInt(stockQuantity) : undefined,
        minOrderQuantity: minOrderQuantity !== undefined ? parseInt(minOrderQuantity) : undefined,
        material,
        dimensions,
        weight,
        isCustomizable,
        customizationDetails,
        productStatus,
        isFeatured,
        isBestseller,
        tags,
        seoTitle,
        seoDescription,
      },
      include: {
        category: true,
        images: true,
      },
    });

    if (images && Array.isArray(images)) {
      await db.productImage.deleteMany({ where: { productId: id } });
      await db.productImage.createMany({
        data: images.map((imgUrl: string, index: number) => ({
          productId: id,
          imageUrl: imgUrl,
          altText: `${name} Image ${index + 1}`,
          isPrimary: index === 0,
          displayOrder: index,
        })),
      });
    }

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getAuthFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized admin access required' }, { status: 403 });
    }

    const { id } = params;
    await db.product.delete({ where: { id } });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
