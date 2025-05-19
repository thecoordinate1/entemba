-- Helper function to check if the current user owns the store
-- Ensure this function exists and the authenticated role has execute permission.
-- DROP FUNCTION IF EXISTS public.is_store_owner(UUID) CASCADE; -- Use CASCADE if other objects depend on it
DROP FUNCTION IF EXISTS public.is_store_owner(UUID);

CREATE OR REPLACE FUNCTION public.is_store_owner(store_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Important for accessing tables RLS might otherwise restrict
AS $$
BEGIN
  -- Check if a store exists with the given id and is owned by the current authenticated user
  RETURN EXISTS (
    SELECT 1
    FROM public.stores s
    WHERE s.id = store_id_param AND s.vendor_id = auth.uid() -- s.id is UUID, store_id_param is UUID. s.vendor_id is UUID, auth.uid() is UUID.
  );
END;
$$;

COMMENT ON FUNCTION public.is_store_owner(UUID) IS 'Checks if the currently authenticated user is the owner of the specified store ID.';

-- Grant execute permission on the helper function to the authenticated role
GRANT EXECUTE ON FUNCTION public.is_store_owner(UUID) TO authenticated;


-- RLS Policies for 'user-avatars' bucket
-- Assumes avatar path is: {user_id}/<filename>

-- SELECT (Read): Allow public read access to all avatars
DROP POLICY IF EXISTS "Allow public read access to avatars" ON storage.objects;
CREATE POLICY "Allow public read access to avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-avatars');

-- INSERT: Allow authenticated users to upload to their own folder
DROP POLICY IF EXISTS "Users can manage their own avatars" ON storage.objects;
CREATE POLICY "Users can manage their own avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid -- Cast path segment to UUID for comparison
  );

-- UPDATE: Allow authenticated users to update files in their own folder
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid -- Cast path segment to UUID for comparison
  );

-- DELETE: Allow authenticated users to delete files from their own folder
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid -- Cast path segment to UUID for comparison
  );


-- RLS Policies for 'store-logos' bucket
-- Assumes logo path is: {user_id}/{store_id}/<filename>

-- SELECT (Read): Allow public read access to all store logos
DROP POLICY IF EXISTS "Allow public read access to store logos" ON storage.objects;
CREATE POLICY "Allow public read access to store logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-logos');

-- INSERT: Allow authenticated users to upload if they are the owner of the store path segment
DROP POLICY IF EXISTS "Vendors can upload to their own store logo folder" ON storage.objects;
CREATE POLICY "Vendors can upload to their own store logo folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'store-logos'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid -- Path segment 1 (user_id) cast to uuid
    AND public.is_store_owner(((storage.foldername(name))[2])::uuid) -- Path segment 2 (store_id) cast to uuid
  );

-- UPDATE: Allow authenticated users to update if they own the store path segment
DROP POLICY IF EXISTS "Vendors can update their own store logos" ON storage.objects;
CREATE POLICY "Vendors can update their own store logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'store-logos'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid -- Path segment 1 (user_id) cast to uuid
    AND public.is_store_owner(((storage.foldername(name))[2])::uuid) -- Path segment 2 (store_id) cast to uuid
  );

-- DELETE: Allow authenticated users to delete if they own the store path segment
DROP POLICY IF EXISTS "Vendors can delete their own store logos" ON storage.objects;
CREATE POLICY "Vendors can delete their own store logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'store-logos'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid -- Path segment 1 (user_id) cast to uuid
    AND public.is_store_owner(((storage.foldername(name))[2])::uuid) -- Path segment 2 (store_id) cast to uuid
  );


-- RLS Policies for 'product-images' bucket
-- Assumes product image path is: {store_id}/<product_id_or_other_path>/<filename>

-- SELECT (Read): Allow public read access to all product images
DROP POLICY IF EXISTS "Allow public read access to product images" ON storage.objects;
CREATE POLICY "Allow public read access to product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- INSERT: Allow authenticated users to upload if they own the store_id in the path
DROP POLICY IF EXISTS "Vendors can upload product images for their own stores" ON storage.objects;
CREATE POLICY "Vendors can upload product images for their own stores"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_store_owner(((storage.foldername(name))[1])::uuid) -- Expects store_id as first path segment, cast to uuid
  );

-- UPDATE: Allow authenticated users to update if they own the store_id in the path
DROP POLICY IF EXISTS "Vendors can update product images for their own stores" ON storage.objects;
CREATE POLICY "Vendors can update product images for their own stores"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.is_store_owner(((storage.foldername(name))[1])::uuid) -- Expects store_id as first path segment, cast to uuid
  );

-- DELETE: Allow authenticated users to delete if they own the store_id in the path
DROP POLICY IF EXISTS "Vendors can delete product images for their own stores" ON storage.objects;
CREATE POLICY "Vendors can delete product images for their own stores"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.is_store_owner(((storage.foldername(name))[1])::uuid) -- Expects store_id as first path segment, cast to uuid
  );

-- Note: Remember to enable RLS on each bucket in the Supabase UI for these policies to take effect.
