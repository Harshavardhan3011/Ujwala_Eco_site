const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujkhgvhqofdbqwgahslc.supabase.co').replace(/\/$/, '');

/**
 * Returns a browser-accessible Supabase Storage URL for a given asset path or URL.
 * 
 * Supports:
 * - Full HTTP/HTTPS URLs (returned as is)
 * - Storage paths: 'products/b1.jpeg', 'openings/1.jpg', 'trusts/1.jpg'
 * - Legacy paths: '/bags/b1.jpeg', '/opening/1.jpg', '/Ujwala_Educational_&_Social_Trust/1.jpg'
 *
 * @param path - Asset path or full URL
 * @param bucket - Optional override bucket name (defaults to 'site-images' or path prefix)
 */
export function getStorageUrl(path: string | null | undefined, defaultFallback = '/placeholder-product.svg'): string {
  if (!path) return defaultFallback;

  // Return full HTTP/HTTPS URLs as is
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }

  // Clean leading slashes
  let cleanPath = path.replace(/^\/+/, '');

  // Convert legacy local paths to Supabase Storage structure
  if (cleanPath.startsWith('bags/')) {
    cleanPath = cleanPath.replace(/^bags\//, 'products/');
  } else if (cleanPath.startsWith('opening/')) {
    cleanPath = cleanPath.replace(/^opening\//, 'openings/');
  } else if (cleanPath.startsWith('Ujwala_Educational_&_Social_Trust/')) {
    cleanPath = cleanPath.replace(/^Ujwala_Educational_&_Social_Trust\//, 'trusts/');
  }

  // If cleanPath starts with products/, openings/, or trusts/
  // Format standard Supabase Storage Public URL:
  // URL: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
  const parts = cleanPath.split('/');
  const bucketName = parts[0]; // e.g. 'products', 'openings', 'trusts'

  // Standard public storage URL format
  return `${SUPABASE_URL}/storage/v1/object/public/${cleanPath}`;
}

export function getProductImageUrl(path: string | null | undefined): string {
  if (!path) return '/placeholder-product.svg';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  let clean = path.replace(/^\/+/, '');
  if (!clean.startsWith('products/')) {
    clean = `products/${clean.replace(/^bags\//, '')}`;
  }
  return getStorageUrl(clean);
}

export function getOpeningImageUrl(filename: string): string {
  const clean = filename.replace(/^\/+/, '').replace(/^opening\//, '');
  return getStorageUrl(`openings/${clean}`);
}

export function getTrustImageUrl(filename: string): string {
  const clean = filename.replace(/^\/+/, '').replace(/^Ujwala_Educational_&_Social_Trust\//, '');
  return getStorageUrl(`trusts/${clean}`);
}
