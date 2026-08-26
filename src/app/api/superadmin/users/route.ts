import { db } from '@/lib/db';
import { verifySuperAdminFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const superadmin = verifySuperAdminFromRequest(req);
  if (!superadmin) {
    return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 });
  }

  try {
    const { data: users, error } = await db
      .from('profiles')
      .select('id, name, email, phone, role, created_at, updated_at')
      .in('role', ['admin', 'superadmin', 'ADMIN', 'SUPERADMIN'])
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch admin users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const superadmin = verifySuperAdminFromRequest(req);
  if (!superadmin) {
    return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 });
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

    // 1. Create auth user via Supabase Auth API
    const { data: authData, error: authError } = await db.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name,
          phone: phone || null,
          role: 'admin', // ALWAYS assigned 'admin', never superadmin
        },
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const user = authData.user;
    if (!user) {
      return NextResponse.json({ error: 'Failed to create admin auth user' }, { status: 500 });
    }

    // 2. Ensure profile in public.profiles is assigned role = 'admin'
    const { data: profile, error: profileErr } = await db.from('profiles').upsert({
      id: user.id,
      name,
      email: cleanEmail,
      phone: phone || null,
      role: 'admin', // Server explicitly assigns admin role
      updated_at: new Date().toISOString(),
    }).select('id, name, email, phone, role, created_at').single();

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Admin account created successfully',
      user: profile,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create admin error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create admin user' }, { status: 500 });
  }
}
