import { db } from '@/lib/db';
import { verifyAdminFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = verifyAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });

  try {
    const { data: products, error } = await db
      .from('products')
      .select('id, name, sku, stock_quantity, min_order_quantity, category:categories(name), images:product_images(image_url)')
      .order('stock_quantity', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const inventory = (products || []).map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stockQuantity: p.stock_quantity,
      minOrderQuantity: p.min_order_quantity,
      category: (p.category as any)?.name || '—',
      imageUrl: (p.images as any[])?.[0]?.image_url || null,
      status: p.stock_quantity === 0 ? 'OUT_OF_STOCK' : p.stock_quantity <= 10 ? 'LOW_STOCK' : 'IN_STOCK',
    }));

    return NextResponse.json({ inventory });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
