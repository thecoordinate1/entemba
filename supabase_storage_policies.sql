-- Helper function to check if the currently authenticated user owns a store
-- Drop the function first with CASCADE to remove dependent policies, then recreate.
DROP FUNCTION IF EXISTS public.is_store_owner(UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.is_store_owner(store_id_param UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.stores s
    WHERE s.id = store_id_param AND s.vendor_id = auth.uid() -- Check vendor_id
  );
$$;
COMMENT ON FUNCTION public.is_store_owner(UUID) IS 'Checks if the authenticated user is the owner of the given store_id.';

-- Grant execute permission on the function to the authenticated role
GRANT EXECUTE ON FUNCTION public.is_store_owner(UUID) TO authenticated;

-- ---------------------------------
-- RLS Policies for 'user-avatars' bucket
-- ---------------------------------

-- Drop existing policies before creating new ones
DROP POLICY IF EXISTS "Users can select their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can insert their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- 1. Users can view their own avatar and public avatars (if any)
CREATE POLICY "Users can select their own avatars"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid -- Path is {user_id}/filename.ext
    -- OR (storage.object_metadata ->> 'is_public')::boolean = true -- If you add public avatars concept
  );

-- 2. Users can upload their own avatar
CREATE POLICY "Users can insert their own avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid -- Path is {user_id}/filename.ext
    -- Optional: Check file size, type etc. here if needed in the policy
    -- AND (storage.object_metadata ->> 'size')::bigint < 1048576 -- Example: Max 1MB
  );

-- 3. Users can update their own avatar
CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid
  )
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid
  );

-- 4. Users can delete their own avatar
CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid
  );

-- ---------------------------------
-- RLS Policies for 'store-logos' bucket
-- Path convention: {user_id_owning_the_store}/{store_id}/<filename>
-- ---------------------------------

-- Drop existing policies before creating new ones
DROP POLICY IF EXISTS "Public can select store logos" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can insert logos for their stores" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can update logos for their stores" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can delete logos for their stores" ON storage.objects;


-- 1. Public can view store logos (assuming logos are generally public)
CREATE POLICY "Public can select store logos"
  ON storage.objects FOR SELECT TO public -- Or 'anon, authenticated'
  USING (
    bucket_id = 'store-logos'
  );

-- 2. Authenticated users can upload logos for stores they own
-- Path is {user_id_of_store_owner}/{store_id}/filename.ext
CREATE POLICY "Store owners can insert logos for their stores"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'store-logos'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid -- First segment is user_id, must match uploader
    AND public.is_store_owner(((storage.foldername(name))[2])::uuid) -- Second segment is store_id, check ownership
  );

-- 3. Authenticated users can update logos for stores they own
CREATE POLICY "Store owners can update logos for their stores"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'store-logos'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid
    AND public.is_store_owner(((storage.foldername(name))[2])::uuid)
  )
  WITH CHECK ( -- Redundant for USING but good practice for clarity
    bucket_id = 'store-logos'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid
    AND public.is_store_owner(((storage.foldername(name))[2])::uuid)
  );

-- 4. Authenticated users can delete logos for stores they own
CREATE POLICY "Store owners can delete logos for their stores"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'store-logos'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid
    AND public.is_store_owner(((storage.foldername(name))[2])::uuid)
  );


-- ---------------------------------
-- RLS Policies for 'product-images' bucket
-- Path convention: {user_id_owning_the_store}/{store_id}/<product_id_or_other_subfolders>/<filename>
-- ---------------------------------

-- Drop existing policies before creating new ones
DROP POLICY IF EXISTS "Public can select product images" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can insert product images for their stores" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can update product images for their stores" ON storage.objects;
DROP POLICY IF EXISTS "Store owners can delete product images for their stores" ON storage.objects;


-- 1. Public can view product images (assuming images are generally public)
CREATE POLICY "Public can select product images"
  ON storage.objects FOR SELECT TO public -- Or 'anon, authenticated'
  USING (
    bucket_id = 'product-images'
  );

-- 2. Authenticated users can upload product images for stores they own
CREATE POLICY "Store owners can insert product images for their stores"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid -- First segment is user_id, must match uploader
    AND public.is_store_owner(((storage.foldername(name))[2])::uuid) -- Second segment is store_id, check ownership
  );

-- 3. Authenticated users can update product images for stores they own
CREATE POLICY "Store owners can update product images for their stores"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid
    AND public.is_store_owner(((storage.foldername(name))[2])::uuid)
  )
   WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid
    AND public.is_store_owner(((storage.foldername(name))[2])::uuid)
  );

-- 4. Authenticated users can delete product images for stores they own
CREATE POLICY "Store owners can delete product images for their stores"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND auth.uid() = ((storage.foldername(name))[1])::uuid
    AND public.is_store_owner(((storage.foldername(name))[2])::uuid)
  );

-- Enable RLS on buckets if not already enabled via UI
-- This is more of a reminder as it's typically done in UI or initial bucket creation.
-- ALTER BUCKET "user-avatars" ENABLE ROW LEVEL SECURITY;
-- ALTER BUCKET "store-logos" ENABLE ROW LEVEL SECURITY;
-- ALTER BUCKET "product-images" ENABLE ROW LEVEL SECURITY;
