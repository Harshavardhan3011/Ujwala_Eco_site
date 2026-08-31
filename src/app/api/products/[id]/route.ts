import { db } from '@/lib/db';
import { verifyAdminFromRequest } from '@/lib/auth';
import { adminUpdateProduct, adminDeleteProduct } from '@/lib/serverDb';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Check by id, slug, or sku
    let query = db.from('products').select(`
      *,
      category:categories(*),
      images:product_images(*),
      variants:product_variants(*),
      reviews:reviews(*)
    `);

    // uuid format check
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (isUuid) {
      query = query.or(`id.eq.${id},slug.eq.${id},sku.eq.${id}`);
    } else {
      query = query.or(`slug.eq.${id},sku.eq.${id}`);
    }

    const { data: products, error } = await query;

    if (error || !products || products.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const p = products[0];

    const reviewsArr = p.reviews || [];
    const totalReviews = reviewsArr.length;
    const avgRating = totalReviews > 0
      ? reviewsArr.reduce((acc: number, r: any) => acc + (r.rating || 0), 0) / totalReviews
      : 5;

    const formattedImages = (p.images || [])
      .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map((img: any) => ({
        id: img.id,
        imageUrl: img.image_url,
        altText: img.alt_text,
        isPrimary: img.is_primary,
        displayOrder: img.display_order,
      }));

    const formattedProduct = {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      description: p.description,
      shortDescription: p.short_description,
      categoryId: p.category_id,
      category: p.category ? {
        id: p.category.id,
        name: p.category.name,
        slug: p.category.slug,
        description: p.category.description,
        image: p.category.image,
      } : null,
      price: parseFloat(p.price),
      discountPrice: p.discount_price ? parseFloat(p.discount_price) : null,
      stockQuantity: p.stock_quantity,
      minOrderQuantity: p.min_order_quantity,
      availableColors: p.available_colors,
      availableSizes: p.available_sizes,
      material: p.material,
      dimensions: p.dimensions,
      weight: p.weight,
      isCustomizable: p.is_customizable,
      customizationDetails: p.customization_details,
      productStatus: p.product_status,
      isFeatured: p.is_featured,
      isBestseller: p.is_bestseller,
      tags: p.tags,
      images: formattedImages,
      variants: p.variants || [],
      reviews: reviewsArr,
      avgRating,
      totalReviews,
    };

    // Related products
    const { data: relatedRaw } = await db.from('products')
      .select('*, category:categories(*), images:product_images(*)')
      .eq('category_id', p.category_id)
      .neq('id', p.id)
      .limit(4);

    const relatedProducts = (relatedRaw || []).map((rel: any) => ({
      id: rel.id,
      name: rel.name,
      slug: rel.slug,
      price: parseFloat(rel.price),
      discountPrice: rel.discount_price ? parseFloat(rel.discount_price) : null,
      category: rel.category,
      images: (rel.images || []).map((img: any) => ({
        id: img.id,
        imageUrl: img.image_url,
      })),
    }));

    return NextResponse.json({
      product: formattedProduct,
      relatedProducts,
    });
  } catch (error) {
    console.error('Get product detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch product details' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = verifyAdminFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized admin access required' }, { status: 403 });
    }

    const { id } = params;
    const data = await req.json();

    const {
      name, slug, sku, description, shortDescription, categoryId, price,
      discountPrice, stockQuantity, minOrderQuantity, material, dimensions,
      weight, isCustomizable, customizationDetails, productStatus, isFeatured,
      isBestseller, tags, seoTitle, seoDescription, images,
    } = data;

    const payload: any = {};
    if (name !== undefined) payload.name = name;
    if (slug !== undefined) payload.slug = slug;
    if (sku !== undefined) payload.sku = sku;
    if (description !== undefined) payload.description = description;
    if (shortDescription !== undefined) payload.short_description = shortDescription;
    if (categoryId !== undefined) payload.category_id = categoryId;
    if (price !== undefined) payload.price = parseFloat(price);
    if (discountPrice !== undefined) payload.discount_price = discountPrice ? parseFloat(discountPrice) : null;
    if (stockQuantity !== undefined) payload.stock_quantity = parseInt(stockQuantity);
    if (minOrderQuantity !== undefined) payload.min_order_quantity = parseInt(minOrderQuantity);
    if (material !== undefined) payload.material = material;
    if (dimensions !== undefined) payload.dimensions = dimensions;
    if (weight !== undefined) payload.weight = weight;
    if (isCustomizable !== undefined) payload.is_customizable = Boolean(isCustomizable);
    if (customizationDetails !== undefined) payload.customization_details = customizationDetails;
    if (productStatus !== undefined) payload.product_status = productStatus;
    if (isFeatured !== undefined) payload.is_featured = Boolean(isFeatured);
    if (isBestseller !== undefined) payload.is_bestseller = Boolean(isBestseller);
    if (tags !== undefined) payload.tags = tags;
    if (seoTitle !== undefined) payload.seo_title = seoTitle;
    if (seoDescription !== undefined) payload.seo_description = seoDescription;

    const updatedProduct = await adminUpdateProduct(id, payload, images);

    return NextResponse.json({ product: updatedProduct });
  } catch (error: any) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = verifyAdminFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized admin access required' }, { status: 403 });
    }

    const { id } = params;
    await adminDeleteProduct(id);

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete product' }, { status: 500 });
  }
}
