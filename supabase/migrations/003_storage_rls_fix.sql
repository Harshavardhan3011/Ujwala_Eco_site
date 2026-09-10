-- ============================================================================
-- 003_storage_rls_fix.sql
--
-- Adds a public-READ RLS policy for Supabase Storage buckets so that
-- images uploaded by the admin are publicly accessible via their public URLs.
--
-- Write access (INSERT/UPDATE/DELETE on storage.objects) remains blocked
-- for the anon key.  All admin uploads go through the service-role key
-- server-side (src/lib/adminStorage.ts), which bypasses RLS entirely.
--
-- This migration is idempotent: policies are created only if they don't exist.
-- ============================================================================

-- Enable RLS on storage.objects if it isn't already (Supabase enables it by
-- default, but we make it explicit so the migration is self-contained).
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Public read policy — one per bucket
--
-- Allows anyone (including unauthenticated visitors) to GET/download objects
-- from the listed public buckets.  This is required for product images,
-- category images, etc. to load on the public-facing website.
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  -- products bucket
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Public read: products'
  ) THEN
    CREATE POLICY "Public read: products"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'products');
  END IF;

  -- openings bucket
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Public read: openings'
  ) THEN
    CREATE POLICY "Public read: openings"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'openings');
  END IF;

  -- trusts bucket
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Public read: trusts'
  ) THEN
    CREATE POLICY "Public read: trusts"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'trusts');
  END IF;

  -- founder bucket
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Public read: founder'
  ) THEN
    CREATE POLICY "Public read: founder"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'founder');
  END IF;

  -- site-images bucket
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Public read: site-images'
  ) THEN
    CREATE POLICY "Public read: site-images"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'site-images');
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- NOTE: No INSERT / UPDATE / DELETE policies are added here.
--
-- Admin writes are performed server-side using SUPABASE_SERVICE_ROLE_KEY,
-- which bypasses RLS entirely.  Granting write access via policy would be
-- unnecessary and would open the door to unauthenticated uploads.
-- ---------------------------------------------------------------------------
