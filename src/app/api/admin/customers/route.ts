import { verifyAdminFromRequest } from '@/lib/auth';
import { executePrivilegedQuery } from '@/lib/serverDb';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = verifyAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });

  try {
    const customers = await executePrivilegedQuery(`
      SELECT 
        p.id, p.name, p.email, p.phone, p.role, p.created_at,
        COALESCE((SELECT COUNT(*)::int FROM public.orders o WHERE o.user_id = p.id), 0) as "orderCount"
      FROM public.profiles p
      WHERE LOWER(p.role) = 'customer'
      ORDER BY p.created_at DESC;
    `);

    return NextResponse.json({ customers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch customers' }, { status: 500 });
  }
}
