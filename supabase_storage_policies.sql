-- Helper function to check if the current user owns a store
-- Drop the function if it exists to ensure it's updated correctly
DROP FUNCTION IF EXISTS is_store_owner(uuid);

CREATE OR REPLACE FUNCTION is_store_owner(store_id_to_check uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Important for accessing tables RLS might otherwise restrict
SET search_path = public -- Explicitly set search path
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.stores s -- Alias the table
    WHERE s.id = store_id_to_check AND s.vendor_id = auth.uid() -- Changed user_id to vendor_id
  );
END;
$$;

COMMENT ON FUNCTION is_store_owner(uuid) IS 'Checks if the currently authenticated user is the owner of the specified store, by checking vendor_id.';

-- BUCKET: user-avatars
-- Policies for the 'user-avatars' bucket
-- Path convention: user-avatars/{user_id}/<filename>

-- Allow public read access for avatars
DROP POLICY IF EXISTS "Public read access for user avatars" ON storage.objects FOR SELECT;
CREATE POLICY "Public read access for user avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-avatars');

-- Allow authenticated users to upload their own avatar
DROP POLICY IF EXISTS "Authenticated users can upload their own avatar" ON storage.objects FOR INSERT;
CREATE POLICY "Authenticated users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1] -- Assumes folder name is user_id
    AND auth.uid() IS NOT NULL
  );

-- Allow authenticated users to update/delete their own avatar
DROP POLICY IF EXISTS "Authenticated users can update their own avatar" ON storage.objects FOR UPDATE;
CREATE POLICY "Authenticated users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Authenticated users can delete their own avatar" ON storage.objects FOR DELETE;
CREATE POLICY "Authenticated users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- BUCKET: store-logos
-- Policies for the 'store-logos' bucket
-- Path convention: store-logos/{store_id}/<filename> (Note: The uploader's auth.uid() will be checked against store ownership)

-- Allow public read access for store logos
DROP POLICY IF EXISTS "Public read access for store logos" ON storage.objects FOR SELECT;
CREATE POLICY "Public read access for store logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-logos');

-- Allow store owners to upload their store's logo
-- The (storage.foldername(name))[1] segment in the path is assumed to be the store_id
DROP POLICY IF EXISTS "Store owners can upload logos" ON storage.objects FOR INSERT;
CREATE POLICY "Store owners can upload logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'store-logos'
    AND is_store_owner((storage.foldername(name))[1]::uuid) -- Check if user owns the store_id in path
    AND auth.uid() IS NOT NULL
  );

-- Allow store owners to update/delete their store's logo
DROP POLICY IF EXISTS "Store owners can update logos" ON storage.objects FOR UPDATE;
CREATE POLICY "Store owners can update logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'store-logos'
    AND is_store_owner((storage.foldername(name))[1]::uuid)
  )
  WITH CHECK ( auth.uid() IS NOT NULL );


DROP POLICY IF EXISTS "Store owners can delete logos" ON storage.objects FOR DELETE;
CREATE POLICY "Store owners can delete logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'store-logos'
    AND is_store_owner((storage.foldername(name))[1]::uuid)
  );


-- BUCKET: product-images
-- Policies for the 'product-images' bucket
-- Path convention: product-images/{store_id}/<any_subfolder_or_filename>

-- Allow public read access for product images
DROP POLICY IF EXISTS "Public read access for product images" ON storage.objects FOR SELECT;
CREATE POLICY "Public read access for product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Allow store owners to upload product images for their store
-- The (storage.foldername(name))[1] segment in the path is assumed to be the store_id
DROP POLICY IF EXISTS "Store owners can upload product images" ON storage.objects FOR INSERT;
CREATE POLICY "Store owners can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND is_store_owner((storage.foldername(name))[1]::uuid) -- Check if user owns the store_id in path
    AND auth.uid() IS NOT NULL
  );

-- Allow store owners to update/delete product images for their store
DROP POLICY IF EXISTS "Store owners can update product images" ON storage.objects FOR UPDATE;
CREATE POLICY "Store owners can update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND is_store_owner((storage.foldername(name))[1]::uuid)
  )
  WITH CHECK ( auth.uid() IS NOT NULL );

DROP POLICY IF EXISTS "Store owners can delete product images" ON storage.objects FOR DELETE;
CREATE POLICY "Store owners can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND is_store_owner((storage.foldername(name))[1]::uuid)
  );
