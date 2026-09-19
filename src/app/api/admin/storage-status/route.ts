/**
 * /api/admin/storage-status — Admin-only endpoint
 *
 * Returns whether the Supabase service-role key is configured.
 * Used by the admin site-settings page to show a configuration warning.
 *
 * Security: Only returns a boolean — never returns the key value itself.
 * Requires admin authentication.
 */
import { verifyAdminFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = verifyAdminFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
  }

  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const configured = secretKey.length > 10; // non-empty and not a placeholder

  return NextResponse.json({ configured });
}
