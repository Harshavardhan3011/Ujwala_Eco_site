import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'ujwala_eco_products_secret_2026';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function getAuthSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return null;
  return verifyToken(token);
}

export function getAuthFromRequest(req: NextRequest): TokenPayload | null {
  const token = req.cookies.get('auth_token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  return verifyToken(token);
}

export function verifyAdminFromRequest(req: NextRequest): TokenPayload | null {
  const session = getAuthFromRequest(req);
  if (!session || !session.role || session.role.toLowerCase() !== 'admin') {
    return null;
  }
  return session;
}
