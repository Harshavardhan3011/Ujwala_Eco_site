/**
 * adminStorage.ts — SERVER-ONLY admin storage utility
 *
 * Uses the Supabase Secret Key (SUPABASE_SECRET_KEY) or the legacy
 * service-role key (SUPABASE_SERVICE_ROLE_KEY) to bypass Storage RLS
 * for trusted server-side admin writes.
 *
 * Key precedence (checked in order):
 *   1. SUPABASE_SECRET_KEY    — new Supabase naming (sb_secret_...)
 *   2. SUPABASE_SERVICE_ROLE_KEY — legacy naming (eyJ...)
 *
 * ⚠️  This file must NEVER be imported into a 'use client' component.
 *     The secret key must NEVER reach the browser or be prefixed NEXT_PUBLIC_.
 *
 * Architecture:
 *   Admin browser → /api/admin/upload (server route) → adminUploadFile() → Supabase Storage
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/**
 * Resolve the privileged Supabase key.
 * Prefer the new SUPABASE_SECRET_KEY (sb_secret_...) introduced in newer Supabase
 * dashboard versions; fall back to legacy SUPABASE_SERVICE_ROLE_KEY (eyJ...).
 */
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||  
  '';

/** Maximum allowed upload size: 5 MB */
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** Allowed image MIME types */
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

/** Extension map from MIME type */
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/** Known storage buckets */
const ALLOWED_BUCKETS = new Set([
  'products',
  'openings',
  'trusts',
  'founder',
  'site-images',
]);

// ---------------------------------------------------------------------------
// Singleton service-role client (created once per process)
// ---------------------------------------------------------------------------

let _adminClient: SupabaseClient | null = null;

/**
 * Returns a Supabase client authenticated as the service role.
 * The service role bypasses all RLS policies — use only in trusted server routes.
 *
 * Throws if SUPABASE_SERVICE_ROLE_KEY is not configured.
 */
export function getAdminStorageClient(): SupabaseClient {
  if (!SUPABASE_URL) {
    throw new Error('[adminStorage] NEXT_PUBLIC_SUPABASE_URL is not configured.');
  }
  if (!SERVICE_ROLE_KEY) {
    throw new Error(
      '[adminStorage] Supabase privileged key is not configured.\n' +
      'Add one of these to your .env.local (server-side only, NEVER with NEXT_PUBLIC_ prefix):\n' +
      '  SUPABASE_SECRET_KEY=sb_secret_...   (new Supabase Dashboard → Settings → API Keys)\n' +
      '  SUPABASE_SERVICE_ROLE_KEY=eyJ...    (legacy Dashboard → Project Settings → API)'
    );
  }

  if (!_adminClient) {
    _adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return _adminClient;
}

// ---------------------------------------------------------------------------
// Upload result types
// ---------------------------------------------------------------------------

export interface AdminUploadResult {
  /** Public URL of the uploaded file in Supabase Storage */
  publicUrl: string;
  /** Storage path (bucket-relative): e.g. "1720000000000_abc123.jpg" */
  storagePath: string;
  /** The bucket the file was uploaded to */
  bucket: string;
}

// ---------------------------------------------------------------------------
// Core upload function
// ---------------------------------------------------------------------------

/**
 * Validates and uploads a file to the specified Supabase Storage bucket
 * using the service-role key, which bypasses Storage RLS.
 *
 * Validation performed:
 *   1. Bucket is in the known-allowed list
 *   2. MIME type is an allowed image type
 *   3. File size ≤ MAX_FILE_SIZE_BYTES (5 MB)
 *   4. Generates a safe, unique filename (no user-supplied names reach storage)
 *
 * @param file   - The File/Blob from the request FormData
 * @param bucket - Target storage bucket name (must be in ALLOWED_BUCKETS)
 * @returns AdminUploadResult with the public URL and storage path
 * @throws Error with an admin-safe message on validation or upload failure
 */
export async function adminUploadFile(
  file: File,
  bucket: string = 'products'
): Promise<AdminUploadResult> {
  // 1. Validate bucket
  if (!ALLOWED_BUCKETS.has(bucket)) {
    throw new Error(
      `Invalid storage bucket "${bucket}". Allowed buckets: ${Array.from(ALLOWED_BUCKETS).join(', ')}.`
    );
  }

  // 2. Validate MIME type
  const mimeType = file.type || 'application/octet-stream';
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error(
      `Invalid file type "${mimeType}". Only JPEG, PNG, WebP, and GIF images are allowed.`
    );
  }

  // 3. Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `File is too large (${sizeMB} MB). Maximum allowed size is 5 MB.`
    );
  }

  // 4. Generate a safe, unique filename — never use the user-supplied filename directly
  const ext = MIME_TO_EXT[mimeType] ?? 'jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const safeFilename = `${timestamp}_${random}.${ext}`;

  // 5. Read file bytes
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 6. Upload using service-role client
  let supabase: SupabaseClient;
  try {
    supabase = getAdminStorageClient();
  } catch (configErr: any) {
    // Configuration error — log technical detail, throw admin-safe message
    console.error('[adminStorage] Client configuration error:', configErr.message);
    throw new Error(
      'Image upload failed: Storage service is not properly configured. ' +
      'Please contact the administrator.'
    );
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(safeFilename, buffer, {
      contentType: mimeType,
      upsert: false, // avoid accidental overwrites; filenames are unique
    });

  if (error) {
    // Log full technical error server-side only
    console.error(
      `[adminStorage] Storage upload failed — bucket="${bucket}" file="${safeFilename}":`,
      error.message
    );
    // Return an admin-friendly error, not the raw Supabase message
    throw new Error(
      'Image upload failed. Please check your storage permissions or contact the administrator.'
    );
  }

  // 7. Build the public URL
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(safeFilename);

  return {
    publicUrl: urlData.publicUrl,
    storagePath: data.path,
    bucket,
  };
}

// ---------------------------------------------------------------------------
// List files in a bucket (for media library)
// ---------------------------------------------------------------------------

/**
 * Lists files in the specified bucket using the service-role client.
 *
 * @param bucket - Storage bucket name (must be in ALLOWED_BUCKETS)
 * @param folder - Optional subfolder path within the bucket
 */
export async function adminListFiles(
  bucket: string,
  folder?: string
): Promise<{ name: string; id: string | null; metadata: Record<string, any> }[]> {
  if (!ALLOWED_BUCKETS.has(bucket)) {
    throw new Error(`Invalid storage bucket "${bucket}".`);
  }

  const supabase = getAdminStorageClient();
  const { data, error } = await supabase.storage.from(bucket).list(folder);

  if (error) {
    console.error(`[adminStorage] List failed — bucket="${bucket}":`, error.message);
    throw new Error(
      'Image upload failed. Please check your storage permissions or contact the administrator.'
    );
  }

  return (data ?? []).map((f) => ({
    name: f.name,
    id: f.id ?? null,
    metadata: f.metadata ?? {},
  }));
}

// ---------------------------------------------------------------------------
// Delete a file from storage (for image replacement workflows)
// ---------------------------------------------------------------------------

/**
 * Deletes a single file from storage using the service-role client.
 * Safe to call even if the file does not exist (no-op).
 *
 * @param bucket   - Storage bucket name
 * @param filePath - Path within the bucket (e.g. "1720000000000_abc.jpg")
 */
export async function adminDeleteFile(bucket: string, filePath: string): Promise<void> {
  if (!ALLOWED_BUCKETS.has(bucket)) {
    console.warn(`[adminStorage] deleteFile: unknown bucket "${bucket}" — skipping`);
    return;
  }

  try {
    const supabase = getAdminStorageClient();
    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    if (error) {
      // Non-fatal: log and continue — old image will become orphaned but site stays up
      console.warn(
        `[adminStorage] Could not delete old file — bucket="${bucket}" path="${filePath}":`,
        error.message
      );
    }
  } catch (err: any) {
    console.warn('[adminStorage] deleteFile skipped due to config error:', err.message);
  }
}
