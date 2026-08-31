import { verifyAdminFromRequest } from '@/lib/auth';
import { executePrivilegedQueryOne, adminUpdateCustomOrder, adminDeleteCustomOrder } from '@/lib/serverDb';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = verifyAdminFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const { id } = params;
    const customOrder = await executePrivilegedQueryOne(
      'SELECT * FROM public.custom_orders WHERE id = $1;',
      [id]
    );

    if (!customOrder) {
      return NextResponse.json({ error: 'Custom order not found' }, { status: 404 });
    }

    return NextResponse.json({ customOrder });
  } catch (error: any) {
    console.error('Get custom order detail error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch custom order details' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = verifyAdminFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const { id } = params;
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const customOrder = await adminUpdateCustomOrder(id, status);

    if (!customOrder) {
      return NextResponse.json({ error: 'Custom order not found' }, { status: 404 });
    }

    return NextResponse.json({ customOrder });
  } catch (error: any) {
    console.error('Update custom order status error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update custom order status' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = verifyAdminFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const { id } = params;
    await adminDeleteCustomOrder(id);

    return NextResponse.json({ message: 'Custom order deleted successfully' });
  } catch (error: any) {
    console.error('Delete custom order error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete custom order' }, { status: 500 });
  }
}
