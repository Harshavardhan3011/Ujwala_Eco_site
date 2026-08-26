import { db } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getAuthFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const { id } = params;
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const { data: customOrder, error } = await db
      .from('custom_orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update custom order:', error);
      return NextResponse.json(
        { error: 'Failed to update custom order' },
        { status: 500 }
      );
    }

    if (!customOrder) {
      return NextResponse.json({ error: 'Custom order not found' }, { status: 404 });
    }

    return NextResponse.json({ customOrder });
  } catch (error) {
    console.error('Update custom order status error:', error);
    return NextResponse.json({ error: 'Failed to update custom order status' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getAuthFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const { id } = params;
    const { data: customOrder, error } = await db
      .from('custom_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !customOrder) {
      return NextResponse.json({ error: 'Custom order not found' }, { status: 404 });
    }

    return NextResponse.json({ customOrder });
  } catch (error) {
    console.error('Get custom order detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch custom order details' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getAuthFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const { id } = params;
    const { error } = await db.from('custom_orders').delete().eq('id', id);

    if (error) {
      console.error('Delete custom order error:', error);
      return NextResponse.json({ error: 'Failed to delete custom order' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Custom order deleted successfully' });
  } catch (error) {
    console.error('Delete custom order error:', error);
    return NextResponse.json({ error: 'Failed to delete custom order' }, { status: 500 });
  }
}
