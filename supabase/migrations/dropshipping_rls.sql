-- Enable RLS on products if not already enabled (usually is)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 1. Allow authenticated users to view products that are marked as dropshippable
-- This is essential for the Marketplace to function for other vendors
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'products' 
        AND policyname = 'View dropshippable products'
    ) THEN
        CREATE POLICY "View dropshippable products"
        ON public.products
        FOR SELECT
        TO authenticated
        USING (is_dropshippable = true AND status = 'Active');
    END IF;
END
$$;

-- 2. Allow authenticated users to view basic store info for these products
-- (Assuming 'stores' table might be restricted)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'stores' 
        AND policyname = 'View stores for marketplace'
    ) THEN
        CREATE POLICY "View stores for marketplace"
        ON public.stores
        FOR SELECT
        TO authenticated
        USING (true); -- Broad access for reading stores (names, logos)
    END IF;
END
$$;
