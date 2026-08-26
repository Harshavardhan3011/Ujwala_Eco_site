import { db } from '@/lib/db';
import { verifyAdminFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = verifyAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const bucket = searchParams.get('bucket') || 'products';

  const { data, error } = await db.storage.from(bucket).list();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ files: data });
}

export async function POST(req: NextRequest) {
  const admin = verifyAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || 'products';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { data, error } = await db.storage.from(bucket).upload(filename, buffer, {
      contentType: file.type,
      upsert: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: publicUrlData } = db.storage.from(bucket).getPublicUrl(filename);
    return NextResponse.json({ imageUrl: publicUrlData.publicUrl, path: data.path }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
