-- 1. CLEANUP: Delete orphaned products that reference non-existent stores
-- This resolves the "key is not present in table stores" error.
DELETE FROM public.products 
WHERE store_id IS NOT NULL 
AND store_id NOT IN (SELECT id FROM public.stores);

-- 2. APPLY CONSTRAINT: Now we can safely add the foreign key
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_store_id_fkey'
  ) THEN
    ALTER TABLE public.products 
    ADD CONSTRAINT products_store_id_fkey 
    FOREIGN KEY (store_id) 
    REFERENCES public.stores(id)
    ON DELETE CASCADE;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
