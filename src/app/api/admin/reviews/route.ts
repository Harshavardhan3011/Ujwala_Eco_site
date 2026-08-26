import { db } from '@/lib/db';
import { verifyAdminFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = verifyAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });

  try {
    const { data: reviews, error } = await db
      .from('reviews')
      .select('*, product:products(name, sku), user:profiles(name, email)')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const mapped = (reviews || []).map(r => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      isApproved: r.is_approved,
      createdAt: r.created_at,
      productName: (r.product as any)?.name || 'Unknown Product',
      productSku: (r.product as any)?.sku,
      userName: (r.user as any)?.name || 'Anonymous',
      userEmail: (r.user as any)?.email,
    }));

    return NextResponse.json({ reviews: mapped });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
