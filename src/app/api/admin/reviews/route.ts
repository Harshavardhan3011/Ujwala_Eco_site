import { verifyAdminFromRequest } from '@/lib/auth';
import { adminGetReviews } from '@/lib/serverDb';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = verifyAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });

  try {
    const reviews = await adminGetReviews();

    const mapped = (reviews || []).map((r: any) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      isApproved: r.is_approved,
      createdAt: r.created_at,
      productName: r.product_name || 'Unknown Product',
      userName: r.user_name || 'Anonymous',
    }));

    return NextResponse.json({ reviews: mapped });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch reviews' }, { status: 500 });
  }
}
