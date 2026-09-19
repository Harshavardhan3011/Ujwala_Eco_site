import { NextResponse } from 'next/server';
import { executePrivilegedQuery } from '@/lib/serverDb';

export const dynamic = 'force-dynamic';

/** Strip everything except digits and sanitise to international format (no + prefix). */
function sanitiseNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  // If it starts with 0 (local Indian format), replace with 91
  if (digits.startsWith('0') && digits.length === 11) {
    return `91${digits.slice(1)}`;
  }
  // If it's a 10-digit Indian number without country code
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

export async function GET() {
  try {
    // 1. Try site_settings table
    const rows = await executePrivilegedQuery(
      `SELECT value FROM public.site_settings WHERE key = 'whatsapp_number' LIMIT 1;`
    );

    const rawNumber =
      (rows[0] as any)?.value ||
      process.env.OWNER_WHATSAPP_NUMBER ||
      '919849530536';

    const whatsappNumber = sanitiseNumber(rawNumber);

    return NextResponse.json({ whatsappNumber });
  } catch (err: any) {
    // Fallback to env / default if DB is unavailable
    const fallback = sanitiseNumber(
      process.env.OWNER_WHATSAPP_NUMBER || '919849530536'
    );
    return NextResponse.json({ whatsappNumber: fallback });
  }
}
