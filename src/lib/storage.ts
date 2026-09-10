const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujkhgvhqofdbqwgahslc.supabase.co').replace(/\/$/, '');

/**
 * Resolves a browser-accessible Supabase Storage public URL.
 *
 * Handles all input formats safely:
 *   - Full https:// URLs → returned as-is (no double-URL construction)
 *   - Local /bags/ or /opening/ paths → normalized to matching bucket paths
 *   - Bare filenames → placed in the 'products' bucket by default
 *   - Two-argument form: getStorageUrl(bucket, filename)
 *     - If `filename` is already a full URL, returns it as-is
 *
 * Known buckets: 'founder', 'products', 'openings', 'trusts', 'site-images'
 */
export function getStorageUrl(bucketOrPath: string, filename?: string): string {
  if (!bucketOrPath) return '/placeholder-product.svg';

  // ── Fast-path: first argument is already a full URL ─────────────────────
  if (
    bucketOrPath.startsWith('http://') ||
    bucketOrPath.startsWith('https://') ||
    bucketOrPath.startsWith('data:')
  ) {
    return bucketOrPath;
  }

  let bucket = 'products';
  let path = bucketOrPath;

  if (filename !== undefined) {
    // ── Two-argument form: getStorageUrl(bucket, filename) ───────────────
    // Guard: if `filename` is already a full URL, return it directly.
    // This happens when the DB stores the complete publicUrl (e.g. after an
    // adminUploadFile() call) and the caller still passes a bucket name.
    if (
      filename.startsWith('http://') ||
      filename.startsWith('https://') ||
      filename.startsWith('data:')
    ) {
      return filename;
    }
    bucket = bucketOrPath;
    path = filename;
  } else {
    // ── Single-argument form: getStorageUrl(path) ────────────────────────
    let clean = bucketOrPath.replace(/^\/+/, '');

    // Normalize legacy local public-folder paths → bucket paths
    if (clean.startsWith('bags/')) {
      clean = clean.replace(/^bags\//, 'products/');
    } else if (clean.startsWith('opening/')) {
      clean = clean.replace(/^opening\//, 'openings/');
    } else if (clean.startsWith('Ujwala _Educational_&_Social_Trust/')) {
      clean = clean.replace(/^Ujwala _Educational_&_Social_Trust\//, 'trusts/');
    } else if (clean.startsWith('uploads/')) {
      clean = clean.replace(/^uploads\//, 'products/');
    }

    const parts = clean.split('/');
    if (['founder', 'products', 'openings', 'trusts', 'site-images'].includes(parts[0])) {
      bucket = parts[0];
      path = parts.slice(1).join('/');
    } else {
      bucket = 'products';
      path = clean;
    }
  }

  const cleanFilename = path.replace(/^\/+/, '');
  if (!cleanFilename) return '/placeholder-product.svg';

  // Canonical Supabase public storage URL:
  // https://<project>.supabase.co/storage/v1/object/public/<bucket>/<filename>
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${cleanFilename}`;
}

export function getFounderImageUrl(filename = 'founder-suguna.jpeg'): string {
  return getStorageUrl('founder', filename);
}

export function getProductImageUrl(filename: string): string {
  return getStorageUrl('products', filename.replace(/^products\//, '').replace(/^bags\//, ''));
}

export function getOpeningImageUrl(filename: string): string {
  return getStorageUrl('openings', filename.replace(/^openings\//, '').replace(/^opening\//, ''));
}

export function getTrustImageUrl(filename: string): string {
  return getStorageUrl('trusts', filename.replace(/^trusts\//, '').replace(/^Ujwala _Educational_&_Social_Trust\//, ''));
}
