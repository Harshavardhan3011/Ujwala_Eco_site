import { verifyAdminFromRequest } from '@/lib/auth';
import { adminGetCustomOrders } from '@/lib/serverDb';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = verifyAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
  }

  try {
    const customOrders = await adminGetCustomOrders();
    return NextResponse.json({ customOrders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch custom orders' }, { status: 500 });
  }
}
