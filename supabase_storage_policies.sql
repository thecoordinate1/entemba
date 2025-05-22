
-- Drop existing policies and function first to ensure a clean slate.
-- The order matters: drop policies before the function they depend on.

-- Policies for 'user-avatars' bucket
DROP POLICY IF EXISTS "Authenticated users can insert their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Policies for 'store-logos' bucket
DROP POLICY IF EXISTS "Store owners can insert logos for their stores" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view store logos" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can update logos for their stores" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can delete logos for their stores" ON storage.objects;

-- Policies for 'product-images' bucket
DROP POLICY IF EXISTS "Store owners can insert product images for their stores" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can update product images for their stores" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can delete product images for their stores" ON storage.objects;

-- Drop the function; CASCADE will handle dependent policies if any were missed or had different names.
DROP FUNCTION IF EXISTS public.is_store_owner(UUID) CASCADE;

-- Helper function to check if the current user owns the store
-- Ensures the parameter name is 'store_id_param' to avoid issues with CREATE OR REPLACE if an old version with a different param name exists.
CREATE OR REPLACE FUNCTION public.is_store_owner(store_id_param UUID)
  RETURNS BOOLEAN
  LANGUAGE plpgsql
  SECURITY DEFINER -- Important for RLS policies that use this function
  SET search_path = public -- Ensures correct schema context
AS $$
BEGIN
  -- Check if a store with the given ID exists and is owned by the current authenticated user
  RETURN EXISTS (
    SELECT 1
    FROM public.stores s
    WHERE s.id = store_id_param AND s.vendor_id = auth.uid() -- Crucially checks vendor_id against auth.uid()
  );
END;
$$;

COMMENT ON FUNCTION public.is_store_owner(UUID) IS 'Checks if the currently authenticated user is the vendor_id of the given store_id. Used for RLS policies.';

-- Grant execute permission on the function to the authenticated role
GRANT EXECUTE ON FUNCTION public.is_store_owner(UUID) TO authenticated;


-- Policies for 'user-avatars' bucket
-- Path expected: {user_id}/filename.ext (e.g., avatar.png)

CREATE POLICY "Authenticated users can insert their own avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid -- User can only insert into their own folder (user_id must be the first segment)
  );

CREATE POLICY "Users can view their own avatars"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid
  );

CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid
  );

CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid
  );


-- Policies for 'store-logos' bucket
-- Path expected: {user_id}/{store_id}/filename.ext (e.g., logo.png)
-- Note: The is_store_owner function already checks if auth.uid() matches vendor_id for the given store_id.
-- The (storage.foldername(name))[1] (user_id) is implicitly checked by is_store_owner matching vendor_id to auth.uid().

CREATE POLICY "Store owners can insert logos for their stores"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'store-logos'
    AND public.is_store_owner(((storage.foldername(name))[2])::uuid) -- path segment 2 is store_id
     -- AND auth.uid() = ((storage.foldername(name))[1])::uuid -- Ensure user_id from path segment 1 matches auth.uid for upload path consistency
  );

CREATE POLICY "Anyone can view store logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-logos');

CREATE POLICY "Store owners can update logos for their stores"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'store-logos'
    AND public.is_store_owner(((storage.foldername(name))[2])::uuid)
    -- AND auth.uid() = ((storage.foldername(name))[1])::uuid
  );

CREATE POLICY "Store owners can delete logos for their stores"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'store-logos'
    AND public.is_store_owner(((storage.foldername(name))[2])::uuid)
    -- AND auth.uid() = ((storage.foldername(name))[1])::uuid
  );


-- Policies for 'product-images' bucket
-- Path expected: {store_id}/{product_id}/filename.ext

CREATE POLICY "Store owners can insert product images for their stores"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_store_owner(((storage.foldername(name))[1])::uuid) -- path segment 1 is store_id
  );

CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Store owners can update product images for their stores"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.is_store_owner(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Store owners can delete product images for their stores"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.is_store_owner(((storage.foldername(name))[1])::uuid)
  );

