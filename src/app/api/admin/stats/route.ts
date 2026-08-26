import { db } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getAuthFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const { count: totalOrders } = await db.from('orders').select('*', { count: 'exact', head: true });
    const { count: pendingOrders } = await db.from('orders').select('*', { count: 'exact', head: true }).eq('order_status', 'PENDING');
    const { count: completedOrders } = await db.from('orders').select('*', { count: 'exact', head: true }).eq('order_status', 'DELIVERED');

    const { data: paidOrders } = await db.from('orders').select('total_amount').eq('payment_status', 'PAID');
    const totalRevenue = (paidOrders || []).reduce((sum, o) => sum + parseFloat(o.total_amount || '0'), 0);

    const { count: totalCustomers } = await db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'CUSTOMER');
    const { count: totalProducts } = await db.from('products').select('*', { count: 'exact', head: true });
    const { count: lowStockProducts } = await db.from('products').select('*', { count: 'exact', head: true }).lte('stock_quantity', 10);

    const { data: recentOrders } = await db.from('orders')
      .select('*, user:profiles(name, email)')
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      stats: {
        totalOrders: totalOrders || 0,
        pendingOrders: pendingOrders || 0,
        completedOrders: completedOrders || 0,
        totalRevenue,
        totalCustomers: totalCustomers || 0,
        totalProducts: totalProducts || 0,
        lowStockProducts: lowStockProducts || 0,
      },
      recentOrders: recentOrders || [],
    });
  } catch (error) {
    console.error('Fetch admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
