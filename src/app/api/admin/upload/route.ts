import { verifyAdminFromRequest } from '@/lib/auth';
import { adminUploadFile, adminListFiles } from '@/lib/adminStorage';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET /api/admin/upload?bucket=<name>
// Lists files in a storage bucket (for the Media Library page).
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const admin = verifyAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const bucket = searchParams.get('bucket') || 'products';

  try {
    const files = await adminListFiles(bucket);
    return NextResponse.json({ files });
  } catch (error: any) {
    // Log technical detail server-side; return a safe message to the client
    console.error('[/api/admin/upload GET] List error:', error.message);
    return NextResponse.json(
      { error: 'Could not list media files. Please check storage permissions or contact the administrator.' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/upload
// Uploads an image to Supabase Storage using the service-role key.
//
// Form fields:
//   file   — the image File to upload (required)
//   bucket — target bucket name, defaults to "products" (optional)
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  // 1. Verify admin session
  const admin = verifyAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
  }

  try {
    // 2. Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const bucket = (formData.get('bucket') as string) || 'products';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 3. Validate, upload via service-role client, get public URL
    const result = await adminUploadFile(file, bucket);

    return NextResponse.json(
      {
        imageUrl: result.publicUrl,
        path: result.storagePath,
        bucket: result.bucket,
      },
      { status: 201 }
    );
  } catch (error: any) {
    // adminUploadFile already logs the technical Supabase error server-side.
    console.error('[/api/admin/upload POST] Upload error:', error.message);

    const isConfigError =
      error.message?.includes('not configured') ||
      error.message?.includes('privileged key') ||
      error.message?.includes('service_role');

    if (isConfigError) {
      return NextResponse.json(
        {
          error:
            'Image upload is not configured. To fix:\n' +
            '1. Supabase Dashboard → Settings → API Keys → Secret key\n' +
            '2. Copy the key (sb_secret_...)\n' +
            '3. Add SUPABASE_SECRET_KEY=sb_secret_... to .env.local\n' +
            '4. Add to Vercel → Project → Settings → Environment Variables',
          setupRequired: true,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Image upload failed. Please check storage permissions.' },
      { status: 500 }
    );
  }
}
