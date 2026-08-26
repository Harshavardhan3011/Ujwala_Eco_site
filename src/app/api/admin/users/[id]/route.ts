import { db } from '@/lib/db';
import { verifySuperAdminFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const superadmin = verifySuperAdminFromRequest(req);
  if (!superadmin) {
    return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 });
  }

  const { id } = params;
  const { data: user, error } = await db
    .from('profiles')
    .select('id, name, email, phone, role, created_at, updated_at')
    .eq('id', id)
    .single();

  if (error || !user) {
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
    const { data: targetUser, error: fetchErr } = await db
      .from('profiles')
      .select('id, role, email')
      .eq('id', id)
      .single();

    if (fetchErr || !targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Superadmin Protection: If attempting to change role away from superadmin
    if (targetUser.role?.toLowerCase() === 'superadmin' && role && role.toLowerCase() !== 'superadmin') {
      const { count } = await db
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('role', ['superadmin', 'SUPERADMIN']);

      if ((count || 0) <= 1) {
        return NextResponse.json(
          { error: 'Action blocked: Cannot demote or alter the role of the final superadmin account.' },
          { status: 400 }
        );
      }
    }

    const updatePayload: any = {};
    if (name !== undefined) updatePayload.name = name;
    if (phone !== undefined) updatePayload.phone = phone;
    if (role !== undefined) {
      // Only allow assigning 'admin' or 'customer' via UI management
      const normalizedRole = role.toLowerCase();
      if (!['admin', 'superadmin', 'customer'].includes(normalizedRole)) {
        return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 });
      }
      updatePayload.role = normalizedRole;
    }
    updatePayload.updated_at = new Date().toISOString();

    const { data: updatedUser, error: updateErr } = await db
      .from('profiles')
      .update(updatePayload)
      .eq('id', id)
      .select('id, name, email, phone, role, created_at, updated_at')
      .single();

    if (updateErr) throw updateErr;

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
    const { data: targetUser, error: fetchErr } = await db
      .from('profiles')
      .select('id, role')
      .eq('id', id)
      .single();

    if (fetchErr || !targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Superadmin Protection: Cannot delete the last superadmin
    if (targetUser.role?.toLowerCase() === 'superadmin') {
      const { count } = await db
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('role', ['superadmin', 'SUPERADMIN']);

      if ((count || 0) <= 1) {
        return NextResponse.json(
          { error: 'Action blocked: Cannot delete the final superadmin account.' },
          { status: 400 }
        );
      }
    }

    const { error: deleteErr } = await db.from('profiles').delete().eq('id', id);
    if (deleteErr) throw deleteErr;

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
  }
}
