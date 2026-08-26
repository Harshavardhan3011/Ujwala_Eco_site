import { db } from '@/lib/db';
import { verifySuperAdminFromRequest } from '@/lib/auth';
import { upsertAdminProfilePrivileged, cleanupAuthUserPrivileged } from '@/lib/serverDb';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const superadmin = verifySuperAdminFromRequest(req);
  if (!superadmin) {
    return NextResponse.json({ error: 'Forbidden: Superadmin access required' }, { status: 403 });
  }

  try {
    const { data: users, error } = await db
      .from('profiles')
      .select('id, name, email, phone, role, created_at, updated_at')
      .in('role', ['admin', 'superadmin', 'ADMIN', 'SUPERADMIN'])
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch admin users' }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch admin users' }, { status: 500 });
  }
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

    const { data: authData, error: authError } = await db.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name,
          phone: phone || null,
          role: 'admin',
        },
      },
    });

    if (authError || !authData.user) {
      const errMsg = authError?.message?.includes('already registered')
        ? 'An account with this email already exists'
        : 'Unable to create administrator authentication account';
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    const newUserId = authData.user.id;

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
