import { verifyAdminFromRequest } from '@/lib/auth';
import { executePrivilegedQueryOne } from '@/lib/serverDb';
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

    const updated = await executePrivilegedQueryOne(`
      UPDATE public.products
      SET stock_quantity = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING id, name, sku, stock_quantity;
    `, [Number(stockQuantity), params.id]);

    if (!updated) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update stock quantity' }, { status: 500 });
  }
}
