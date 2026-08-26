import { db } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getAuthFromRequest(req);
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const { data: profile } = await db.from('profiles').select('*').eq('id', session.userId).single();
    const { data: addresses } = await db.from('addresses').select('*').eq('user_id', session.userId);

    if (!profile) {
      // Fallback to token payload session info
      return NextResponse.json({
        user: {
          id: session.userId,
          name: session.name,
          email: session.email,
          role: session.role,
          addresses: addresses || [],
        },
      });
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        addresses: addresses || [],
      },
    });
  } catch (error) {
    console.error('Fetch me error:', error);
    return NextResponse.json({ user: null });
  }
}
