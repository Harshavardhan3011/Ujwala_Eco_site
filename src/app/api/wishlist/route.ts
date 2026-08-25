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

    const items = await db.wishlistItem.findMany({
      where: { userId: session.userId },
      include: {
        product: {
          include: {
            category: true,
            images: { orderBy: { displayOrder: 'asc' }, take: 1 },
          },
        },
      },
    });

    return NextResponse.json({ wishlist: items });
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

    const existing = await db.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: session.userId,
          productId,
        },
      },
    });

    if (existing) {
      await db.wishlistItem.delete({ where: { id: existing.id } });
      return NextResponse.json({ message: 'Removed from wishlist', inWishlist: false });
    } else {
      await db.wishlistItem.create({
        data: {
          userId: session.userId,
          productId,
        },
      });
      return NextResponse.json({ message: 'Added to wishlist', inWishlist: true }, { status: 201 });
    }
  } catch (error: any) {
    console.error('Wishlist POST error:', error);
    return NextResponse.json({ error: 'Failed to update wishlist' }, { status: 500 });
  }
}
