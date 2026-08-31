import { verifyAdminFromRequest } from '@/lib/auth';
import { executePrivilegedQuery } from '@/lib/serverDb';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = verifyAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });

  try {
    const products = await executePrivilegedQuery(`
      SELECT 
        p.id, p.name, p.sku, p.stock_quantity, p.min_order_quantity,
        (SELECT c.name FROM public.categories c WHERE c.id = p.category_id) as category_name,
        (SELECT pi.image_url FROM public.product_images pi WHERE pi.product_id = p.id ORDER BY pi.display_order ASC LIMIT 1) as image_url
      FROM public.products p
      ORDER BY p.stock_quantity ASC, p.name ASC;
    `);

    const inventory = (products || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stockQuantity: p.stock_quantity,
      minOrderQuantity: p.min_order_quantity,
      category: p.category_name || '—',
      imageUrl: p.image_url || null,
      status: p.stock_quantity === 0 ? 'OUT_OF_STOCK' : p.stock_quantity <= 10 ? 'LOW_STOCK' : 'IN_STOCK',
    }));

    return NextResponse.json({ inventory });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch inventory' }, { status: 500 });
  }
}
