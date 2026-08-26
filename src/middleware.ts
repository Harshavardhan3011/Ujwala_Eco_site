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

function isAdmin(role?: string): boolean {
  return role?.toLowerCase() === 'admin';
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

  // Helper to extract session token
  const token =
    request.cookies.get('auth_token')?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '');
  const session = token ? await verifyTokenEdge(token) : null;

  // 2. Protect /superadmin routes (SUPERADMIN ONLY)
  if (pathname.startsWith('/superadmin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    if (isAdmin(session.role)) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (!isSuperAdmin(session.role)) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  // 3. Protect /admin routes (ADMIN ONLY, SUPERADMIN REDIRECTS TO /superadmin)
  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    if (isSuperAdmin(session.role)) {
      return NextResponse.redirect(new URL('/superadmin', request.url));
    }
    if (!isAdmin(session.role)) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  // 4. Protect /api/superadmin/* and /api/admin/users* API routes (SUPERADMIN ONLY)
  if (pathname.startsWith('/api/superadmin') || pathname.startsWith('/api/admin/users')) {
    if (!session || !isSuperAdmin(session.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Superadmin access required' },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  // 5. Protect all operational /api/admin/* API routes (ADMIN or SUPERADMIN)
  if (pathname.startsWith('/api/admin/')) {
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
    '/superadmin/:path*',
    '/api/admin/:path*',
    '/api/superadmin/:path*',
  ],
};
