import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken, isSuperAdmin, isAdminOrSuperAdmin } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow login page for anyone
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // 2. Protect /admin/users route (SUPERADMIN ONLY)
  if (pathname.startsWith('/admin/users')) {
    const token = request.cookies.get('auth_token')?.value || request.headers.get('Authorization')?.replace('Bearer ', '');
    const session = token ? verifyToken(token) : null;

    if (!session || !isSuperAdmin(session.role)) {
      // If not superadmin, redirect to /admin or 403 response
      const redirectUrl = new URL(session ? '/admin' : '/admin/login', request.url);
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  // 3. Protect all other /admin routes (ADMIN or SUPERADMIN)
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth_token')?.value || request.headers.get('Authorization')?.replace('Bearer ', '');
    const session = token ? verifyToken(token) : null;

    if (!session || !isAdminOrSuperAdmin(session.role)) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 4. Protect /api/admin/users API routes (SUPERADMIN ONLY)
  if (pathname.startsWith('/api/admin/users')) {
    const token = request.cookies.get('auth_token')?.value || request.headers.get('Authorization')?.replace('Bearer ', '');
    const session = token ? verifyToken(token) : null;

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
    const token = request.cookies.get('auth_token')?.value || request.headers.get('Authorization')?.replace('Bearer ', '');
    const session = token ? verifyToken(token) : null;

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
