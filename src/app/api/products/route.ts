import { db } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const categorySlug = searchParams.get('category') || '';
    const rawMinPrice = parseFloat(searchParams.get('minPrice') || '0');
    const minPrice = isNaN(rawMinPrice) || rawMinPrice < 0 ? 0 : rawMinPrice;

    const rawMaxPrice = parseFloat(searchParams.get('maxPrice') || '100000');
    const maxPrice = isNaN(rawMaxPrice) || rawMaxPrice < 0 ? 100000 : rawMaxPrice;

    const sort = searchParams.get('sort') || 'featured';
    const featured = searchParams.get('featured');
    const bestseller = searchParams.get('bestseller');
    const customizable = searchParams.get('customizable');

    const rawPage = parseInt(searchParams.get('page') || '1');
    const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

    const rawLimit = parseInt(searchParams.get('limit') || '24');
    const limit = isNaN(rawLimit) || rawLimit < 1 ? 24 : Math.min(rawLimit, 100);

    let query = db.from('products').select(
      `
        *,
        category:categories(*),
        images:product_images(*),
        reviews:reviews(rating)
      `,
      { count: 'exact' }
    );

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%,tags.ilike.%${search}%`);
    }

    if (minPrice > 0) {
      query = query.gte('price', minPrice);
    }
    if (maxPrice < 100000) {
      query = query.lte('price', maxPrice);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    if (bestseller === 'true') {
      query = query.eq('is_bestseller', true);
    }

    if (customizable === 'true') {
      query = query.eq('is_customizable', true);
    }

    // Filter by category slug if provided
    if (categorySlug) {
      const { data: catData } = await db.from('categories').select('id').eq('slug', categorySlug).single();
      if (catData) {
        query = query.eq('category_id', catData.id);
      } else {
        // Return empty result if category slug doesn't exist
        return NextResponse.json({
          products: [],
          pagination: { total: 0, page, limit, totalPages: 0 },
        });
      }
    }

    // Order
    if (sort === 'price-low') {
      query = query.order('price', { ascending: true });
    } else if (sort === 'price-high') {
      query = query.order('price', { ascending: false });
    } else if (sort === 'featured') {
      query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Pagination
    const fromOffset = (page - 1) * limit;
    const toOffset = fromOffset + limit - 1;
    query = query.range(fromOffset, toOffset);

    const { data: products, count, error } = await query;

    if (error) {
      console.error('Fetch products Supabase error:', error);
      throw error;
    }

    const formattedProducts = (products || []).map((p: any) => {
      const reviewsArr = p.reviews || [];
      const totalReviews = reviewsArr.length;
      const avgRating = totalReviews > 0
        ? reviewsArr.reduce((acc: number, r: any) => acc + (r.rating || 0), 0) / totalReviews
        : 5;

      // Format fields to camelCase if expected by frontend
      const {
        id, name, slug, sku, description, short_description, price, discount_price,
        stock_quantity, min_order_quantity, available_colors, available_sizes,
        material, dimensions, weight, is_customizable, customization_details,
        product_status, is_featured, is_bestseller, tags, category, images
      } = p;

      const formattedImages = (images || [])
        .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((img: any) => ({
          id: img.id,
          imageUrl: img.image_url,
          altText: img.alt_text,
          isPrimary: img.is_primary,
          displayOrder: img.display_order,
        }));

      return {
        id,
        name,
        slug,
        sku,
        description,
        shortDescription: short_description,
        categoryId: p.category_id,
        category: category ? {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          image: category.image,
        } : null,
        price: parseFloat(price),
        discountPrice: discount_price ? parseFloat(discount_price) : null,
        stockQuantity: stock_quantity,
        minOrderQuantity: min_order_quantity,
        availableColors: available_colors,
        availableSizes: available_sizes,
        material,
        dimensions,
        weight,
        isCustomizable: is_customizable,
        customizationDetails: customization_details,
        productStatus: product_status,
        isFeatured: is_featured,
        isBestseller: is_bestseller,
        tags,
        images: formattedImages,
        avgRating,
        totalReviews,
      };
    });

    const total = count || formattedProducts.length;

    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
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
      name, slug, sku, description, shortDescription, categoryId, price,
      discountPrice, stockQuantity, minOrderQuantity, material, dimensions,
      weight, isCustomizable, customizationDetails, isFeatured, isBestseller,
      tags, seoTitle, seoDescription, images,
    } = data;

    if (!name || !sku || !categoryId || price === undefined) {
      return NextResponse.json({ error: 'Name, SKU, categoryId, and price are required' }, { status: 400 });
    }

    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { data: product, error } = await db.from('products').insert({
      name,
      slug: generatedSlug,
      sku,
      description: description || '',
      short_description: shortDescription,
      category_id: categoryId,
      price: parseFloat(price),
      discount_price: discountPrice ? parseFloat(discountPrice) : null,
      stock_quantity: parseInt(stockQuantity || '0'),
      min_order_quantity: parseInt(minOrderQuantity || '1'),
      material,
      dimensions,
      weight,
      is_customizable: Boolean(isCustomizable),
      customization_details: customizationDetails,
      is_featured: Boolean(isFeatured),
      is_bestseller: Boolean(isBestseller),
      tags,
      seo_title: seoTitle,
      seo_description: seoDescription,
    }).select().single();

    if (error) throw error;

    if (images && Array.isArray(images) && images.length > 0) {
      const imageRows = images.map((imgUrl: string, idx: number) => ({
        product_id: product.id,
        image_url: imgUrl,
        alt_text: `${name} Image ${idx + 1}`,
        is_primary: idx === 0,
        display_order: idx,
      }));

      await db.from('product_images').insert(imageRows);
    }

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}
