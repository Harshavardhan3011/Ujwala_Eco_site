import { verifySuperAdminFromRequest } from '@/lib/auth';
import { executePrivilegedQueryOne, deleteAdminUserPrivileged } from '@/lib/serverDb';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const superadmin = verifySuperAdminFromRequest(req);
  if (!superadmin) {
    return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 });
  }

  const user = await executePrivilegedQueryOne(
    'SELECT id, name, email, phone, role, created_at, updated_at FROM public.profiles WHERE id = $1;',
    [params.id]
  );

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

    const targetUser = await executePrivilegedQueryOne(
      'SELECT id, role FROM public.profiles WHERE id = $1;',
      [id]
    );

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
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
  }
}
