import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'ujwala_eco_products_secret_2026';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

async function verifyTokenEdge(token: string): Promise<TokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

function isSuperAdmin(role?: string): boolean {
  return role?.toLowerCase() === 'superadmin';
}

function isAdminOrSuperAdmin(role?: string): boolean {
  const r = role?.toLowerCase();
  return r === 'admin' || r === 'superadmin';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow login page for anyone
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // 2. Protect /admin/users route (SUPERADMIN ONLY)
  if (pathname.startsWith('/admin/users')) {
    const token =
      request.cookies.get('auth_token')?.value ||
      request.headers.get('Authorization')?.replace('Bearer ', '');
    const session = token ? await verifyTokenEdge(token) : null;

    if (!session || !isSuperAdmin(session.role)) {
      const redirectUrl = new URL(session ? '/admin' : '/admin/login', request.url);
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  // 3. Protect all other /admin routes (ADMIN or SUPERADMIN)
  if (pathname.startsWith('/admin')) {
    const token =
      request.cookies.get('auth_token')?.value ||
      request.headers.get('Authorization')?.replace('Bearer ', '');
    const session = token ? await verifyTokenEdge(token) : null;

    if (!session || !isAdminOrSuperAdmin(session.role)) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 4. Protect /api/admin/users API routes (SUPERADMIN ONLY)
  if (pathname.startsWith('/api/admin/users')) {
    const token =
      request.cookies.get('auth_token')?.value ||
      request.headers.get('Authorization')?.replace('Bearer ', '');
    const session = token ? await verifyTokenEdge(token) : null;

    if (!session || !isSuperAdmin(session.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Superadmin access required' },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  // 5. Protect all other /api/admin/* API routes (ADMIN or SUPERADMIN)
  if (pathname.startsWith('/api/admin/')) {
    const token =
      request.cookies.get('auth_token')?.value ||
      request.headers.get('Authorization')?.replace('Bearer ', '');
    const session = token ? await verifyTokenEdge(token) : null;

    if (!session || !isAdminOrSuperAdmin(session.role)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
