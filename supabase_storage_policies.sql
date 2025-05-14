-- Helper function to check if the currently authenticated user owns a specific store.
-- This function assumes your 'stores' table has a 'user_id' column referencing 'auth.users.id'.
CREATE OR REPLACE FUNCTION is_store_owner(store_id_to_check uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.stores s
    WHERE s.id = store_id_to_check AND s.user_id = auth.uid()
  );
END;
$$;

--
-- Policies for 'user-avatars' bucket
-- Files are expected to be in a folder named after the user's ID, e.g., '{user_id}/avatar.png'
--

-- Allow public read access to all avatars
CREATE POLICY "Allow public read access to user avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'user-avatars' );

-- Allow authenticated users to upload their own avatar
-- Assumes files are uploaded to a path like: user-avatars/{user_id}/filename.ext
CREATE POLICY "Allow authenticated user to upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text -- Checks if the first folder in the path is the user's ID
);

-- Allow authenticated users to update/replace their own avatar
CREATE POLICY "Allow authenticated user to update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'user-avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatar
CREATE POLICY "Allow authenticated user to delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);


--
-- Policies for 'store-logos' bucket
-- Files are expected to be in a folder named after the store's ID, e.g., 'store-logos/{store_id}/logo.png'
--

-- Allow public read access to all store logos
CREATE POLICY "Allow public read access to store logos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'store-logos' );

-- Allow store owners to upload a logo for their store
-- Assumes files are uploaded to a path like: store-logos/{store_id}/filename.ext
CREATE POLICY "Allow store owner to upload logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'store-logos' AND
  auth.role() = 'authenticated' AND
  is_store_owner((storage.foldername(name))[1]::uuid) -- Checks if the user owns the store ID in the path
);

-- Allow store owners to update the logo for their store
CREATE POLICY "Allow store owner to update logo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'store-logos' AND
  auth.role() = 'authenticated' AND
  is_store_owner((storage.foldername(name))[1]::uuid)
)
WITH CHECK (
  bucket_id = 'store-logos' AND
  auth.role() = 'authenticated' AND
  is_store_owner((storage.foldername(name))[1]::uuid)
);

-- Allow store owners to delete the logo for their store
CREATE POLICY "Allow store owner to delete logo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'store-logos' AND
  auth.role() = 'authenticated' AND
  is_store_owner((storage.foldername(name))[1]::uuid)
);


--
-- Policies for 'product-images' bucket
-- Files are expected to be in a folder structure like: 'product-images/{store_id}/{product_id}/image.png'
-- or 'product-images/{store_id}/any_filename.png'
-- The policy primarily checks ownership of the top-level {store_id} folder.
--

-- Allow public read access to all product images
CREATE POLICY "Allow public read access to product images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- Allow store owners to upload product images for their store
CREATE POLICY "Allow store owner to upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated' AND
  is_store_owner((storage.foldername(name))[1]::uuid) -- Checks ownership of the store_id part of the path
);

-- Allow store owners to update product images for their store
CREATE POLICY "Allow store owner to update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated' AND
  is_store_owner((storage.foldername(name))[1]::uuid)
)
WITH CHECK (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated' AND
  is_store_owner((storage.foldername(name))[1]::uuid)
);

-- Allow store owners to delete product images for their store
CREATE POLICY "Allow store owner to delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated' AND
  is_store_owner((storage.foldername(name))[1]::uuid)
);

-- Note: For more granular control (e.g., ensuring a user can only manage images
-- for a *specific product* they own, rather than any product in a store they own),
-- your application logic before the upload would typically verify product ownership,
-- or you'd use more complex policies possibly involving metadata or more nested path checks if needed.
-- The current policy for product-images allows a store owner to manage any image within their store's top-level folder in this bucket.
