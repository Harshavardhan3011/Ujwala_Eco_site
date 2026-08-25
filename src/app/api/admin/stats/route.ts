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

    const totalOrders = await db.order.count();
    const pendingOrders = await db.order.count({ where: { orderStatus: 'PENDING' } });
    const completedOrders = await db.order.count({ where: { orderStatus: 'DELIVERED' } });
    
    const paidOrders = await db.order.findMany({
      where: { paymentStatus: 'PAID' },
      select: { totalAmount: true },
    });
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const totalCustomers = await db.user.count({ where: { role: 'CUSTOMER' } });
    const totalProducts = await db.product.count();
    const lowStockProducts = await db.product.count({ where: { stockQuantity: { lte: 10 } } });

    const recentOrders = await db.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({
      stats: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue,
        totalCustomers,
        totalProducts,
        lowStockProducts,
      },
      recentOrders,
    });
  } catch (error) {
    console.error('Fetch admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
