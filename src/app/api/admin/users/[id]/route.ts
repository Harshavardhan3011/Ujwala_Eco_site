import { verifySuperAdminFromRequest } from '@/lib/auth';
import { executePrivilegedQuery, executePrivilegedQueryOne, deleteAdminUserPrivileged } from '@/lib/serverDb';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const superadmin = verifySuperAdminFromRequest(req);
  if (!superadmin) {
    return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 });
  }

  const { id } = params;
  const user = await executePrivilegedQueryOne(
    'SELECT id, name, email, phone, role, created_at, updated_at FROM public.profiles WHERE id = $1;',
    [id]
  );

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const superadmin = verifySuperAdminFromRequest(req);
  if (!superadmin) {
    return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 });
  }

  try {
    const { id } = params;
    const body = await req.json();
    const { name, phone, role } = body;

    // Fetch existing target profile
    const targetUser = await executePrivilegedQueryOne(
      'SELECT id, role, email FROM public.profiles WHERE id = $1;',
      [id]
    );

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Superadmin Protection: If attempting to change role away from superadmin
    if (targetUser.role?.toLowerCase() === 'superadmin' && role && role.toLowerCase() !== 'superadmin') {
      const superadminCountRes = await executePrivilegedQueryOne(
        "SELECT COUNT(*)::int as count FROM public.profiles WHERE LOWER(role) = 'superadmin';"
      );

      if ((superadminCountRes?.count || 0) <= 1) {
        return NextResponse.json(
          { error: 'Action blocked: Cannot demote or alter the role of the final superadmin account.' },
          { status: 400 }
        );
      }
    }

    const clauses: string[] = [];
    const paramsList: any[] = [];
    let idx = 1;

    if (name !== undefined) { clauses.push(`name = $${idx++}`); paramsList.push(name); }
    if (phone !== undefined) { clauses.push(`phone = $${idx++}`); paramsList.push(phone); }
    if (role !== undefined) {
      const normalizedRole = role.toLowerCase();
      if (!['admin', 'superadmin', 'customer'].includes(normalizedRole)) {
        return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 });
      }
      clauses.push(`role = $${idx++}`);
      paramsList.push(normalizedRole);
    }
    clauses.push(`updated_at = NOW()`);
    paramsList.push(id);

    const updatedUser = await executePrivilegedQueryOne(
      `UPDATE public.profiles SET ${clauses.join(', ')} WHERE id = $${idx} RETURNING id, name, email, phone, role, created_at, updated_at;`,
      paramsList
    );

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const superadmin = verifySuperAdminFromRequest(req);
  if (!superadmin) {
    return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 });
  }

  try {
    const { id } = params;

    // Fetch target user
    const targetUser = await executePrivilegedQueryOne(
      'SELECT id, role FROM public.profiles WHERE id = $1;',
      [id]
    );

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Superadmin Protection: Cannot delete the last superadmin
    if (targetUser.role?.toLowerCase() === 'superadmin') {
      const countRes = await executePrivilegedQueryOne(
        "SELECT COUNT(*)::int as count FROM public.profiles WHERE LOWER(role) = 'superadmin';"
      );

      if ((countRes?.count || 0) <= 1) {
        return NextResponse.json(
          { error: 'Action blocked: Cannot delete the final superadmin account.' },
          { status: 400 }
        );
      }
    }

    const delRes = await deleteAdminUserPrivileged(id);
    if (!delRes.success) {
      return NextResponse.json({ error: delRes.error || 'Failed to delete administrator user' }, { status: 500 });
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
  }
}
