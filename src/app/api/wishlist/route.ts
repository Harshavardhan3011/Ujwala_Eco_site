import { db } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getAuthFromRequest(req);
    if (!session) {
      return NextResponse.json({ wishlist: [] });
    }

    const { data: items, error } = await db
      .from('wishlist_items')
      .select('*, product:products(*, category:categories(*), images:product_images(*))')
      .eq('user_id', session.userId);

    if (error) throw error;

    return NextResponse.json({ wishlist: items || [] });
  } catch (error) {
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

    const { data: existing } = await db
      .from('wishlist_items')
      .select('*')
      .eq('user_id', session.userId)
      .eq('product_id', productId)
      .single();

    if (existing) {
      await db.from('wishlist_items').delete().eq('id', existing.id);
      return NextResponse.json({ message: 'Removed from wishlist', inWishlist: false });
    } else {
      await db.from('wishlist_items').insert({
        user_id: session.userId,
        product_id: productId,
      });
      return NextResponse.json({ message: 'Added to wishlist', inWishlist: true }, { status: 201 });
    }
  } catch (error: any) {
    console.error('Wishlist POST error:', error);
    return NextResponse.json({ error: 'Failed to update wishlist' }, { status: 500 });
  }
}
