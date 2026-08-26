import { db } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Register user via Supabase Auth
    const { data: authData, error: authError } = await db.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name,
          phone: phone || null,
          role: 'CUSTOMER',
        },
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const user = authData.user;
    if (!user) {
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
    }

    // Ensure profile row exists in public.profiles
    const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single();

    const userRole = profile?.role || 'CUSTOMER';
    const userName = profile?.name || name;

    const token = signToken({
      userId: user.id,
      email: cleanEmail,
      role: userRole,
      name: userName,
    });

    const response = NextResponse.json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        name: userName,
        email: cleanEmail,
        role: userRole,
        phone: phone || null,
      },
      token,
    }, { status: 201 });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
