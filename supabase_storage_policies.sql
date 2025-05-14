
-- Helper function to check if the current authenticated user owns a specific store
-- This function assumes your 'stores' table is in the 'public' schema
-- and has a 'user_id' column that links to auth.uid().
CREATE OR REPLACE FUNCTION public.is_store_owner(store_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.stores s
    WHERE s.id = store_id_param AND s.user_id = auth.uid()
  );
$$;

-- Policies for 'user_avatars' bucket
-- Assumes avatar files are stored like: user_avatars/{user_id}/avatar.png

-- 1. Public read access for user avatars
CREATE POLICY "Public read access for user avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'user_avatars');

-- 2. Authenticated users can insert their own avatar
CREATE POLICY "Authenticated users can insert their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user_avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Authenticated users can update their own avatar
CREATE POLICY "Authenticated users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user_avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'user_avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Authenticated users can delete their own avatar
CREATE POLICY "Authenticated users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user_avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);


-- Policies for 'store_logos' bucket
-- Assumes logo files are stored like: store_logos/{store_id}/logo.png

-- 1. Public read access for store logos
CREATE POLICY "Public read access for store logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'store_logos');

-- 2. Store owners can insert logos for their stores
CREATE POLICY "Store owners can insert logos for their stores"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'store_logos' AND
  auth.role() = 'authenticated' AND
  public.is_store_owner(((storage.foldername(name))[1])::uuid)
);

-- 3. Store owners can update logos for their stores
CREATE POLICY "Store owners can update logos for their stores"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'store_logos' AND
  auth.role() = 'authenticated' AND
  public.is_store_owner(((storage.foldername(name))[1])::uuid)
)
WITH CHECK (
  bucket_id = 'store_logos' AND
  auth.role() = 'authenticated' AND
  public.is_store_owner(((storage.foldername(name))[1])::uuid)
);

-- 4. Store owners can delete logos for their stores
CREATE POLICY "Store owners can delete logos for their stores"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'store_logos' AND
  auth.role() = 'authenticated' AND
  public.is_store_owner(((storage.foldername(name))[1])::uuid)
);


-- Policies for 'product_images' bucket
-- Assumes product images are stored like: product_images/{store_id}/{product_id_or_other_subpath}/image.png

-- 1. Public read access for product images
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product_images');

-- 2. Store owners can insert product images for their stores
--    This policy checks ownership based on the {store_id} part of the path.
CREATE POLICY "Store owners can insert product images for their stores"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product_images' AND
  auth.role() = 'authenticated' AND
  public.is_store_owner(((storage.foldername(name))[1])::uuid)
);

-- 3. Store owners can update product images for their stores
CREATE POLICY "Store owners can update product images for their stores"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product_images' AND
  auth.role() = 'authenticated' AND
  public.is_store_owner(((storage.foldername(name))[1])::uuid)
)
WITH CHECK (
  bucket_id = 'product_images' AND
  auth.role() = 'authenticated' AND
  public.is_store_owner(((storage.foldername(name))[1])::uuid)
);

-- 4. Store owners can delete product images for their stores
CREATE POLICY "Store owners can delete product images for their stores"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product_images' AND
  auth.role() = 'authenticated' AND
  public.is_store_owner(((storage.foldername(name))[1])::uuid)
);

-- Example of how to grant all access to a specific role (e.g., service_role) if needed for admin tasks
-- This is usually not required for general user operations if policies above are sufficient.
-- CREATE POLICY "Allow full access to service_role"
-- ON storage.objects FOR ALL
-- USING (auth.role() = 'service_role')
-- WITH CHECK (auth.role() = 'service_role');
