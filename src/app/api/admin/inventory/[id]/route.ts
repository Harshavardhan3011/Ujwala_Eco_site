import { db } from '@/lib/db';
import { verifyAdminFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = verifyAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });

  try {
    const { stockQuantity } = await req.json();
    if (stockQuantity === undefined || stockQuantity < 0) {
      return NextResponse.json({ error: 'Invalid stock quantity' }, { status: 400 });
    }

    const { data, error } = await db
      .from('products')
      .update({ stock_quantity: Number(stockQuantity) })
      .eq('id', params.id)
      .select('id, name, sku, stock_quantity')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ product: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
