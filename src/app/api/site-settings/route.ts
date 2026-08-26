import { db } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: settingsList, error } = await db.from('site_settings').select('*');
    if (error) throw error;

    const settings: Record<string, string> = {};
    (settingsList || []).forEach((s: any) => {
      settings[s.key] = s.value;
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Fetch site settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch site settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = getAuthFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const { settings } = await req.json();

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Settings object is required' }, { status: 400 });
    }

    for (const [key, value] of Object.entries(settings)) {
      await db.from('site_settings').upsert({
        key,
        value: String(value),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });
    }

    return NextResponse.json({ message: 'Site settings updated successfully' });
  } catch (error) {
    console.error('Update site settings error:', error);
    return NextResponse.json({ error: 'Failed to update site settings' }, { status: 500 });
  }
}
