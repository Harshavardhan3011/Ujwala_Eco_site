import { db } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    const where: any = { isApproved: true };
    if (productId) where.productId = productId;

    const reviews = await db.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Fetch reviews error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getAuthFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Please login to submit a review' }, { status: 401 });
    }

    const { productId, rating, comment } = await req.json();
    if (!productId || !rating || !comment) {
      return NextResponse.json({ error: 'Product ID, rating, and comment are required' }, { status: 400 });
    }

    const review = await db.review.create({
      data: {
        productId,
        userId: session.userId,
        userName: session.name,
        rating: parseInt(rating),
        comment,
        isApproved: true,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Submit review error:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
