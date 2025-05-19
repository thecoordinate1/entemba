-- Helper function to check if the current user owns a store
-- This needs to be created in your database schema (e.g., public)
-- DROP FUNCTION IF EXISTS public.is_store_owner(uuid); -- Drop if it exists to recreate
CREATE OR REPLACE FUNCTION public.is_store_owner(store_id_to_check UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Important for RLS to work correctly
AS $$
BEGIN
  -- Check if there's a store with the given store_id_to_check
  -- where the vendor_id matches the currently authenticated user's ID.
  RETURN EXISTS (
    SELECT 1
    FROM public.stores s -- Ensure this is your actual stores table
    WHERE s.id = store_id_to_check AND s.vendor_id = auth.uid() -- Check vendor_id
  );
END;
$$;

COMMENT ON FUNCTION public.is_store_owner(UUID) IS 'Checks if the currently authenticated user is the owner of the specified store ID by looking at the vendor_id.';

-- Grant EXECUTE permission on the function to the authenticated role
-- This allows RLS policies to call this function.
GRANT EXECUTE ON FUNCTION public.is_store_owner(UUID) TO authenticated;


-- Policies for 'user-avatars' bucket
-- Assumes avatars are stored with a path like: {user_id}/avatar.png

-- Allow public read access for user avatars
DROP POLICY IF EXISTS "Allow public read access for user avatars" ON storage.objects;
CREATE POLICY "Allow public read access for user avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-avatars');

-- Allow authenticated users to upload their own avatar
-- Path must be: {user_id}/<filename>
DROP POLICY IF EXISTS "Allow authenticated users to upload their own avatar" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload their own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND auth.uid() = (storage.foldername(name))[1] -- foldername[1] is the user_id segment
  );

-- Allow authenticated users to update their own avatar
DROP POLICY IF EXISTS "Allow authenticated users to update their own avatar" ON storage.objects;
CREATE POLICY "Allow authenticated users to update their own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND auth.uid() = (storage.foldername(name))[1]
  );

-- Allow authenticated users to delete their own avatar
DROP POLICY IF EXISTS "Allow authenticated users to delete their own avatar" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete their own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND auth.uid() = (storage.foldername(name))[1]
  );


-- Policies for 'store-logos' bucket
-- Assumes logos are stored with a path like: {user_id_of_vendor}/{store_id}/logo.png

-- Allow public read access for store logos
DROP POLICY IF EXISTS "Allow public read access for store logos" ON storage.objects;
CREATE POLICY "Allow public read access for store logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-logos');

-- Allow authenticated users to upload logos for stores they own
-- Path: {user_id}/{store_id}/<filename>
DROP POLICY IF EXISTS "Vendors can upload to their own store logo folder" ON storage.objects;
CREATE POLICY "Vendors can upload to their own store logo folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'store-logos'
    AND auth.uid() = (storage.foldername(name))[1] -- First segment is user_id (vendor_id)
    AND public.is_store_owner( ((storage.foldername(name))[2])::uuid ) -- Second segment is store_id, cast to UUID
  );

-- Allow authenticated users to update logos for stores they own
DROP POLICY IF EXISTS "Vendors can update their own store logo folder" ON storage.objects;
CREATE POLICY "Vendors can update their own store logo folder"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'store-logos'
    AND auth.uid() = (storage.foldername(name))[1]
    AND public.is_store_owner( ((storage.foldername(name))[2])::uuid )
  );

-- Allow authenticated users to delete logos for stores they own
DROP POLICY IF EXISTS "Vendors can delete their own store logo folder" ON storage.objects;
CREATE POLICY "Vendors can delete their own store logo folder"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'store-logos'
    AND auth.uid() = (storage.foldername(name))[1]
    AND public.is_store_owner( ((storage.foldername(name))[2])::uuid )
  );


-- Policies for 'product-images' bucket
-- Assumes product images are stored with a path like: {user_id_of_vendor}/{store_id}/<product_id_or_other_path>/image.png

-- Allow public read access for product images
DROP POLICY IF EXISTS "Allow public read access for product images" ON storage.objects;
CREATE POLICY "Allow public read access for product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Allow authenticated users to upload product images for stores they own
-- Path: {user_id}/{store_id}/<any_subfolder_or_filename>
DROP POLICY IF EXISTS "Vendors can upload product images to their own store folders" ON storage.objects;
CREATE POLICY "Vendors can upload product images to their own store folders"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid() = (storage.foldername(name))[1] -- First segment is user_id (vendor_id)
    AND public.is_store_owner( ((storage.foldername(name))[2])::uuid ) -- Second segment is store_id
  );

-- Allow authenticated users to update product images for stores they own
DROP POLICY IF EXISTS "Vendors can update product images in their own store folders" ON storage.objects;
CREATE POLICY "Vendors can update product images in their own store folders"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND auth.uid() = (storage.foldername(name))[1]
    AND public.is_store_owner( ((storage.foldername(name))[2])::uuid )
  );

-- Allow authenticated users to delete product images for stores they own
DROP POLICY IF EXISTS "Vendors can delete product images from their own store folders" ON storage.objects;
CREATE POLICY "Vendors can delete product images from their own store folders"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND auth.uid() = (storage.foldername(name))[1]
    AND public.is_store_owner( ((storage.foldername(name))[2])::uuid )
  );

-- Note: For product images, you might want more granular control based on product_id.
-- This would require storing product_id in the file path (e.g., user_id/store_id/product_id/image.png)
-- and modifying the public.is_store_owner function or creating a new one like public.is_product_owner.
-- The current policies allow a store owner to manage all images within their store's top-level folder in the 'product-images' bucket.

