import { db } from '@/lib/db';
import { verifyAdminFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = verifyAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
  }

  const { data: products, error } = await db.from('products').select('*, images:product_images(*), category:categories(*)');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const admin = verifyAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
  }

  const body = await req.json();
  const { data, error } = await db.from('products').insert(body).select().single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ product: data }, { status: 201 });
}
