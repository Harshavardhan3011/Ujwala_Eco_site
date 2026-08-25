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

    const customOrder = await db.customOrder.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ customOrder });
  } catch (error) {
    console.error('Update custom order status error:', error);
    return NextResponse.json({ error: 'Failed to update custom order status' }, { status: 500 });
  }
}
