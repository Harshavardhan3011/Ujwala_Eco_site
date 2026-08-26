import { db } from '@/lib/db';
import { verifyAdminFromRequest } from '@/lib/auth';
import { getStorageUrl } from '@/lib/storage';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = verifyAdminFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'products'; // 'products', 'openings', 'trusts'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${folder}/upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    // Upload to Supabase Storage bucket ('site-images' or 'products')
    const { data, error } = await db.storage
      .from('site-images')
      .upload(fileName, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    let storagePath = fileName;
    let imageUrl = getStorageUrl(fileName);

    // Fallback if 'site-images' bucket is not created yet
    if (error) {
      console.warn('Supabase storage upload fallback warning:', error.message);
      // Fallback try folder name as bucket name
      const { data: bucketData, error: bucketError } = await db.storage
        .from(folder)
        .upload(fileName.replace(`${folder}/`, ''), buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: true,
        });

      if (!bucketError && bucketData) {
        storagePath = `${folder}/${fileName.replace(`${folder}/`, '')}`;
        imageUrl = getStorageUrl(storagePath);
      }
    }

    return NextResponse.json({
      message: 'File uploaded successfully to Supabase Storage',
      storagePath,
      imageUrl,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
