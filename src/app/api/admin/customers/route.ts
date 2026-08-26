import { db } from '@/lib/db';
import { verifyAdminFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = verifyAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });

  try {
    // Get customers with order counts
    const { data: profiles, error } = await db
      .from('profiles')
      .select('id, name, email, phone, role, created_at')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Get order counts per user
    const userIds = (profiles || []).map(p => p.id);
    const { data: orders } = await db
      .from('orders')
      .select('user_id')
      .in('user_id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']);

    const orderCounts: Record<string, number> = {};
    (orders || []).forEach(o => {
      orderCounts[o.user_id] = (orderCounts[o.user_id] || 0) + 1;
    });

    const customers = (profiles || []).map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      role: p.role,
      createdAt: p.created_at,
      orderCount: orderCounts[p.id] || 0,
    }));

    return NextResponse.json({ customers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
