import { db } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      console.log('LOGIN DIAGNOSTIC: Missing email or password');
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    console.log(`LOGIN DIAGNOSTIC: Attempting login for email=${cleanEmail}`);

    // Authenticate via Supabase Auth
    const { data: authData, error: authError } = await db.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (authError || !authData.user) {
      console.log(`LOGIN DIAGNOSTIC: Supabase auth failure - ${authError?.message || 'No user returned'}`);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = authData.user;
    console.log(`LOGIN DIAGNOSTIC: Supabase auth success - userId=${user.id}`);

    // Fetch user profile
    const { data: profile, error: profileError } = await db.from('profiles').select('*').eq('id', user.id).single();

    if (profileError) {
      console.log(`LOGIN DIAGNOSTIC: Profile fetch notice - ${profileError.message}`);
    }

    const role = profile?.role || 'customer';
    const name = profile?.name || user.user_metadata?.name || cleanEmail.split('@')[0];
    const phone = profile?.phone || user.user_metadata?.phone || null;

    console.log(`LOGIN DIAGNOSTIC: Profile retrieved - role=${role}`);

    const token = signToken({
      userId: user.id,
      email: cleanEmail,
      role,
      name,
    });

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name,
        email: cleanEmail,
        role,
        phone,
      },
      token,
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    console.log('LOGIN DIAGNOSTIC: Returning 200 success with auth_token cookie');
    return response;
  } catch (error: any) {
    console.error('LOGIN DIAGNOSTIC: Exception during login:', error.message);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
