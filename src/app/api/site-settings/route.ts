import { verifyAdminFromRequest } from '@/lib/auth';
import { adminGetSiteSettings, adminUpsertSiteSetting } from '@/lib/serverDb';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settingsList = await adminGetSiteSettings();

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
    const session = verifyAdminFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const { settings } = await req.json();

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Settings object is required' }, { status: 400 });
    }

    for (const [key, value] of Object.entries(settings)) {
      await adminUpsertSiteSetting(key, String(value));
    }

    return NextResponse.json({ message: 'Site settings updated successfully' });
  } catch (error: any) {
    console.error('Update site settings error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update site settings' }, { status: 500 });
  }
}
