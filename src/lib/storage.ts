const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujkhgvhqofdbqwgahslc.supabase.co').replace(/\/$/, '');

/**
 * Resolves browser-accessible Supabase Storage URLs for assets in exact buckets:
 * - 'founder'
 * - 'products'
 * - 'openings'
 * - 'trusts'
 */
export function getStorageUrl(bucketOrPath: string, filename?: string): string {
  if (!bucketOrPath) return '/placeholder-product.svg';

  // Return full HTTP/HTTPS/data URLs as is
  if (bucketOrPath.startsWith('http://') || bucketOrPath.startsWith('https://') || bucketOrPath.startsWith('data:')) {
    return bucketOrPath;
  }

  let bucket = 'products';
  let path = bucketOrPath;

  if (filename) {
    bucket = bucketOrPath;
    path = filename;
  } else {
    let clean = bucketOrPath.replace(/^\/+/, '');
    
    // Normalize legacy paths
    if (clean.startsWith('bags/')) clean = clean.replace(/^bags\//, 'products/');
    else if (clean.startsWith('opening/')) clean = clean.replace(/^opening\//, 'openings/');
    else if (clean.startsWith('Ujwala _Educational_&_Social_Trust/')) clean = clean.replace(/^Ujwala _Educational_&_Social_Trust\//, 'trusts/');
    else if (clean.startsWith('uploads/')) clean = clean.replace(/^uploads\//, 'products/');

    const parts = clean.split('/');
    if (['founder', 'products', 'openings', 'trusts'].includes(parts[0])) {
      bucket = parts[0];
      path = parts.slice(1).join('/');
    } else {
      bucket = 'products';
      path = clean;
    }
  }

  const cleanFilename = path.replace(/^\/+/, '');

  // Exact Supabase Public Storage URL format:
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
