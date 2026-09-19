/**
 * /api/upload — General upload endpoint (also requires admin auth).
 *
 * This endpoint mirrors /api/admin/upload but lives outside the /admin namespace.
 * It is kept for backward compatibility with any callers that use this path.
 *
 * All uploads are routed through the service-role Supabase client (adminStorage)
 * so Storage RLS never blocks legitimate admin writes.
 */
import { verifyAdminFromRequest } from '@/lib/auth';
import { adminUploadFile } from '@/lib/adminStorage';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 1. Require admin session — this endpoint is not public
  const session = verifyAdminFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
  }

  try {
    // 2. Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    // The original route accepted a 'folder' param and mapped it to a bucket.
    // We preserve that behaviour: 'folder' becomes the bucket name.
    const bucket = (formData.get('bucket') as string)
      || (formData.get('folder') as string)
      || 'products';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 3. Validate & upload via service-role client
    const result = await adminUploadFile(file, bucket);

    return NextResponse.json({
      message: 'File uploaded successfully to Supabase Storage',
      storagePath: result.storagePath,
      imageUrl: result.publicUrl,
    });
  } catch (error: any) {
    // adminUploadFile logs the real Supabase error server-side.
    // Return the sanitised, admin-facing message here.
    console.error('[/api/upload POST] Upload error:', error.message);

    // Detect missing service key — return 503 with clear setup instructions
    const isConfigError =
      error.message?.includes('not configured') ||
      error.message?.includes('privileged key') ||
      error.message?.includes('service_role');

    if (isConfigError) {
      return NextResponse.json(
        {
          error:
            'Image upload is not configured. Add your Supabase Secret Key to fix this:\n' +
            '  1. Go to: Supabase Dashboard → Settings → API Keys → Secret key\n' +
            '  2. Copy the key (starts with sb_secret_...)\n' +
            '  3. Add to .env.local: SUPABASE_SECRET_KEY=sb_secret_...\n' +
            '  4. Also add to Vercel → Project → Settings → Environment Variables',
          setupRequired: true,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Image upload failed. Please check your storage permissions or contact the administrator.' },
      { status: 500 }
    );
  }
}
