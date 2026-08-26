import { db } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getAuthFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let query = db.from('orders').select(`
      *,
      items:order_items(*),
      payment:payments(*),
      user:profiles(name, email, phone)
    `);

    if (isUuid) {
      query = query.or(`id.eq.${id},order_number.eq.${id}`);
    } else {
      query = query.eq('order_number', id);
    }

    const { data: orders, error } = await query;
    if (error || !orders || orders.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orders[0];

    // Authorization check
    if (session.role !== 'ADMIN' && order.user_id !== session.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json({ error: 'Failed to fetch order details' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getAuthFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const { id } = params;
    const { orderStatus, paymentStatus } = await req.json();

    const updatePayload: any = {};
    if (orderStatus) updatePayload.order_status = orderStatus;
    if (paymentStatus) updatePayload.payment_status = paymentStatus;
    updatePayload.updated_at = new Date().toISOString();

    const { data: order, error } = await db.from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select('*, items:order_items(*), payment:payments(*)')
      .single();

    if (error) throw error;

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Update order status error:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
