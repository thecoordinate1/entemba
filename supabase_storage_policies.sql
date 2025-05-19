-- IMPORTANT: If you are still getting errors about being unable to drop 'is_store_owner'
-- due to dependent policies, try running the following command *by itself* first:
--
--   DROP FUNCTION IF EXISTS public.is_store_owner(UUID) CASCADE;
--
-- If that standalone command succeeds, then run the rest of this script.

-- Drop all potentially dependent policies first to be safe.
-- Policies for user-avatars bucket
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;

-- Policies for store-logos bucket
DROP POLICY IF EXISTS "Store owners can insert logos for their stores" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can update logos for their stores" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can delete logos for their stores" ON storage.objects;
DROP POLICY IF EXISTS "Store logos are publicly readable" ON storage.objects;

-- Policies for product-images bucket
DROP POLICY IF EXISTS "Store owners can insert product images for their stores" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can update product images for their stores" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can delete product images for their stores" ON storage.objects;
DROP POLICY IF EXISTS "Product images are publicly readable" ON storage.objects;

-- Drop the function itself, with CASCADE to handle any remaining dependent policies.
-- This is the line that the HINT from PostgreSQL refers to.
DROP FUNCTION IF EXISTS public.is_store_owner(UUID) CASCADE;

-- Helper function to check if the current user owns a store
CREATE OR REPLACE FUNCTION public.is_store_owner(store_id_param UUID)
  RETURNS BOOLEAN
  LANGUAGE sql
  SECURITY DEFINER -- Important for checking ownership against auth.uid()
  AS $$
    SELECT EXISTS (
      SELECT 1
      FROM public.stores s
      WHERE s.id = store_id_param AND s.vendor_id = auth.uid() -- Ensures vendor_id is checked
    );
$$;
COMMENT ON FUNCTION public.is_store_owner(UUID) IS 'Checks if the currently authenticated user is the owner of the given store_id.';
GRANT EXECUTE ON FUNCTION public.is_store_owner(UUID) TO authenticated;


-- Policies for user-avatars bucket (hyphenated name)
-- Path: user-avatars/{user_id}/{filename}
-- 1. Allow public read access for avatars
CREATE POLICY "Avatars are publicly readable"
  ON storage.objects FOR SELECT
  TO public -- Or anon if you prefer unauthenticated reads
  USING ( bucket_id = 'user-avatars' );

-- 2. Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid -- Path segment 1 is user_id
  );

-- 3. Allow authenticated users to update their own avatars
CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid
  );

-- 4. Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid
  );


-- Policies for store-logos bucket (hyphenated name)
-- Path: store-logos/{user_id}/{store_id}/{filename}
-- Note: user_id in the path here is the vendor's auth.uid(), store_id is the store's UUID.
-- 1. Allow public read access for store logos
CREATE POLICY "Store logos are publicly readable"
  ON storage.objects FOR SELECT
  TO public -- Or anon
  USING ( bucket_id = 'store-logos' );

-- 2. Allow store owners to insert logos for their stores
CREATE POLICY "Store owners can insert logos for their stores"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'store-logos'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid -- Vendor ID from path segment 1
    AND public.is_store_owner(((storage.foldername(name))[2])::uuid) -- Store ID from path segment 2, checked by function
  );

-- 3. Allow store owners to update logos for their stores
CREATE POLICY "Store owners can update logos for their stores"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'store-logos'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid
    AND public.is_store_owner(((storage.foldername(name))[2])::uuid)
  );

-- 4. Allow store owners to delete logos for their stores
CREATE POLICY "Store owners can delete logos for their stores"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'store-logos'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid
    AND public.is_store_owner(((storage.foldername(name))[2])::uuid)
  );


-- Policies for product-images bucket (hyphenated name)
-- Path: product-images/{user_id}/{store_id}/{product_id_or_other_subfolder}/{filename}
-- 1. Allow public read access for product images
CREATE POLICY "Product images are publicly readable"
  ON storage.objects FOR SELECT
  TO public -- Or anon
  USING ( bucket_id = 'product-images' );

-- 2. Allow store owners to insert product images for their stores
CREATE POLICY "Store owners can insert product images for their stores"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid -- Vendor ID from path segment 1
    AND public.is_store_owner(((storage.foldername(name))[2])::uuid) -- Store ID from path segment 2
  );

-- 3. Allow store owners to update product images for their stores (typically by deleting and re-uploading, or overwriting)
CREATE POLICY "Store owners can update product images for their stores"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid
    AND public.is_store_owner(((storage.foldername(name))[2])::uuid)
  );

-- 4. Allow store owners to delete product images for their stores
CREATE POLICY "Store owners can delete product images for their stores"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid
    AND public.is_store_owner(((storage.foldername(name))[2])::uuid)
  );

SELECT 1; -- To make this a change for the AI
