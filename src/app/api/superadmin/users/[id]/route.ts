import { verifySuperAdminFromRequest } from '@/lib/auth';
import { deleteAdminUserPrivileged, getServiceRoleClient } from '@/lib/serverDb';
import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export const dynamic = 'force-dynamic';

const dbUrl = process.env.SUPABASE_DB_URL;

async function getProfilePrivileged(id: string) {
  const serviceClient = getServiceRoleClient();
  if (serviceClient) {
    const { data } = await serviceClient.from('profiles').select('id, name, email, phone, role, created_at, updated_at').eq('id', id).single();
    if (data) return data;
  }

  if (dbUrl) {
    const pgClient = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    try {
      await pgClient.connect();
      const res = await pgClient.query('SELECT id, name, email, phone, role, created_at, updated_at FROM public.profiles WHERE id = $1', [id]);
      await pgClient.end();
      return res.rows[0] || null;
    } catch {
      try { await pgClient.end(); } catch {}
    }
  }
  return null;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const superadmin = verifySuperAdminFromRequest(req);
  if (!superadmin) {
    return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 });
  }

  const user = await getProfilePrivileged(params.id);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const superadmin = verifySuperAdminFromRequest(req);
  if (!superadmin) {
    return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 });
  }

  try {
    const { id } = params;

    const targetUser = await getProfilePrivileged(id);
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    if (targetUser.role?.toLowerCase() === 'superadmin') {
      return NextResponse.json(
        { error: 'Action blocked: Superadmin accounts cannot be removed via API.' },
        { status: 400 }
      );
    }

    const delRes = await deleteAdminUserPrivileged(id);
    if (!delRes.success) {
      return NextResponse.json({ error: delRes.error || 'Failed to delete administrator user' }, { status: 500 });
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
