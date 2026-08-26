import { verifySuperAdminFromRequest } from '@/lib/auth';
import {
  getAdminUsersPrivileged,
  createAdminAuthUserPrivileged,
  upsertAdminProfilePrivileged,
  cleanupAuthUserPrivileged,
} from '@/lib/serverDb';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const superadmin = verifySuperAdminFromRequest(req);
  if (!superadmin) {
    return NextResponse.json({ error: 'Forbidden: Superadmin access required' }, { status: 403 });
  }

  const result = await getAdminUsersPrivileged();
  if (!result.success || !result.users) {
    return NextResponse.json({ error: 'Failed to fetch admin users' }, { status: 500 });
  }

  return NextResponse.json({ users: result.users });
}

export async function POST(req: NextRequest) {
  const superadmin = verifySuperAdminFromRequest(req);
  if (!superadmin) {
    return NextResponse.json({ error: 'Forbidden: Superadmin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, email, password, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Privileged server-side Auth user creation via Supabase Auth Admin API
    const authRes = await createAdminAuthUserPrivileged({
      email: cleanEmail,
      password,
      name,
      phone: phone || null,
    });

    if (!authRes.success || !authRes.userId) {
      return NextResponse.json(
        { error: authRes.error || 'Unable to create administrator authentication account' },
        { status: 400 }
      );
    }

    const newUserId = authRes.userId;

    // 2. Privileged server-side upsert on public.profiles to set role = 'admin' bypassing client RLS
    const profileRes = await upsertAdminProfilePrivileged({
      id: newUserId,
      name,
      email: cleanEmail,
      phone: phone || null,
    });

    if (!profileRes.success) {
      console.error('[ADMIN_CREATE] Privileged profile creation failed. Cleaning up auth user...');
      await cleanupAuthUserPrivileged(newUserId);
      return NextResponse.json(
        { error: 'Unable to create administrator. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Admin account created successfully',
        user: profileRes.profile,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[ADMIN_CREATE] Unexpected exception:', error?.message);
    return NextResponse.json(
      { error: 'Unable to create administrator. Please try again.' },
      { status: 500 }
    );
  }
}
