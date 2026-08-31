import { getAuthFromRequest } from '@/lib/auth';
import { customerGetWishlist, customerToggleWishlist } from '@/lib/serverDb';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getAuthFromRequest(req);
    if (!session) {
      return NextResponse.json({ wishlist: [] });
    }

    const items = await customerGetWishlist(session.userId);

    const formattedWishlist = (items || []).map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      productId: item.product_id,
      createdAt: item.created_at,
      product: item.product ? {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        sku: item.product.sku,
        price: parseFloat(item.product.price),
        discountPrice: item.product.discount_price ? parseFloat(item.product.discount_price) : null,
        stockQuantity: item.product.stock_quantity,
        productStatus: item.product.product_status,
        images: (item.images || []).map((img: any) => ({
          id: img.id,
          imageUrl: img.image_url,
          isPrimary: img.is_primary,
        })),
      } : null,
    }));

    return NextResponse.json({ wishlist: formattedWishlist });
  } catch (error: any) {
    console.error('Fetch wishlist error:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getAuthFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Please login to manage wishlist' }, { status: 401 });
    }

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const result = await customerToggleWishlist(session.userId, productId);
    return NextResponse.json(result, { status: result.inWishlist ? 201 : 200 });
  } catch (error: any) {
    console.error('Wishlist POST error:', error);
    return NextResponse.json({ error: 'Failed to update wishlist' }, { status: 500 });
  }
}
