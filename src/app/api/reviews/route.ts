import { db } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    let query = db.from('reviews').select('*').eq('is_approved', true).order('created_at', { ascending: false }).limit(50);
    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data: reviews, error } = await query;
    if (error) throw error;

    return NextResponse.json({ reviews: reviews || [] });
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

    const { data: review, error } = await db.from('reviews').insert({
      product_id: productId,
      user_id: session.userId,
      user_name: session.name,
      rating: parseInt(rating),
      comment,
      is_approved: true,
    }).select().single();

    if (error) throw error;

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Submit review error:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
