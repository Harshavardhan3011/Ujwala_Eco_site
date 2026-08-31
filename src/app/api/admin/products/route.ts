import { verifyAdminFromRequest } from '@/lib/auth';
import { executePrivilegedQuery, adminCreateProduct } from '@/lib/serverDb';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = verifyAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
  }

  try {
    const products = await executePrivilegedQuery(`
      SELECT 
        p.*,
        row_to_json(c.*) as category,
        COALESCE((SELECT json_agg(pi.*) FROM public.product_images pi WHERE pi.product_id = p.id ORDER BY pi.display_order ASC), '[]'::json) as images
      FROM public.products p
      LEFT JOIN public.categories c ON c.id = p.category_id
      ORDER BY p.created_at DESC;
    `);

    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = verifyAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { images, ...productData } = body;

    const product = await adminCreateProduct(productData, images);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}
