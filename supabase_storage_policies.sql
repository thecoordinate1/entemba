
-- Helper function to check store ownership for RLS policies
-- DROPS the function first to handle potential signature changes (like parameter names)
DROP FUNCTION IF EXISTS public.is_store_owner(UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.is_store_owner(store_id_param UUID) -- Changed parameter name here
RETURNS BOOLEAN AS $$
DECLARE
  is_owner BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.stores s
    WHERE s.id = store_id_param AND s.vendor_id = auth.uid() -- And used it here
  ) INTO is_owner;
  RETURN is_owner;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_store_owner(UUID) IS 'Checks if the currently authenticated user is the owner of the given store ID. Uses vendor_id from stores table.';

-- Grant execute permission on the helper function to authenticated users
GRANT EXECUTE ON FUNCTION public.is_store_owner(UUID) TO authenticated;

--
-- Policies for 'user-avatars' bucket
--
-- 1. Allow public read access for avatars
DROP POLICY IF EXISTS "Allow public read access for user avatars" ON storage.objects;
CREATE POLICY "Allow public read access for user avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-avatars');

-- 2. Allow authenticated users to upload to their own avatar folder
DROP POLICY IF EXISTS "Allow authenticated user to upload their own avatar" ON storage.objects;
CREATE POLICY "Allow authenticated user to upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND auth.uid() = (storage.foldername(name))[1] -- Path should be {user_id}/filename.ext
  );

-- 3. Allow authenticated users to update their own avatar
DROP POLICY IF EXISTS "Allow authenticated user to update their own avatar" ON storage.objects;
CREATE POLICY "Allow authenticated user to update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND auth.uid() = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND auth.uid() = (storage.foldername(name))[1]
  );

-- 4. Allow authenticated users to delete their own avatar
DROP POLICY IF EXISTS "Allow authenticated user to delete their own avatar" ON storage.objects;
CREATE POLICY "Allow authenticated user to delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND auth.uid() = (storage.foldername(name))[1]
  );


--
-- Policies for 'store-logos' bucket
-- Assumes file path structure: {user_id_of_vendor}/{store_id}/logo_filename.ext
--
-- 1. Allow public read access for store logos
DROP POLICY IF EXISTS "Allow public read access for store logos" ON storage.objects;
CREATE POLICY "Allow public read access for store logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-logos');

-- 2. Allow store owners to upload/update/delete their store's logo
DROP POLICY IF EXISTS "Allow store owner to manage their store logo" ON storage.objects;
CREATE POLICY "Allow store owner to manage their store logo"
  ON storage.objects FOR ALL -- Covers INSERT, UPDATE, DELETE
  TO authenticated
  USING (
    bucket_id = 'store-logos'
    AND public.is_store_owner((storage.foldername(name))[2]::UUID) -- Second segment is store_id
  )
  WITH CHECK (
    bucket_id = 'store-logos'
    AND public.is_store_owner((storage.foldername(name))[2]::UUID)
    AND auth.uid() = (storage.foldername(name))[1]::UUID -- First segment is user_id (vendor_id)
  );


--
-- Policies for 'product-images' bucket
-- Assumes file path structure: {store_id}/<any_subfolder_or_filename>
--
-- 1. Allow public read access for product images
DROP POLICY IF EXISTS "Allow public read access for product images" ON storage.objects;
CREATE POLICY "Allow public read access for product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- 2. Allow store owners to manage images for their products
-- Path: {store_id}/product_id/image_filename.ext (example)
-- The RLS checks based on the top-level store_id folder.
DROP POLICY IF EXISTS "Allow store owner to manage their product images" ON storage.objects;
CREATE POLICY "Allow store owner to manage their product images"
  ON storage.objects FOR ALL -- Covers INSERT, UPDATE, DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.is_store_owner((storage.foldername(name))[1]::UUID) -- First segment is store_id
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_store_owner((storage.foldername(name))[1]::UUID)
  );

