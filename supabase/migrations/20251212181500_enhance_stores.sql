-- Create ENUM for store status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE store_status AS ENUM ('Active', 'Inactive', 'Maintenance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the stores table with enhanced schema if it doesn't exist
CREATE TABLE IF NOT EXISTS public.stores (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    vendor_id uuid NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    logo_url text NULL,
    banner_url text NULL,
    data_ai_hint text NULL,
    status store_status NOT NULL DEFAULT 'Inactive'::store_status,
    categories text[] NOT NULL DEFAULT '{}',
    location text NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    pickup_latitude numeric NULL,
    pickup_longitude numeric NULL,
    contact_phone text NULL,
    contact_email text NULL,
    contact_website text NULL,
    settings jsonb DEFAULT '{}'::jsonb,
    slug text NULL UNIQUE,
    is_verified boolean NOT NULL DEFAULT false,
    commission_rate numeric NULL, -- Override global platform fee percentage (e.g. 5.0 for 5%)
    average_rating numeric NOT NULL DEFAULT 0.0,
    review_count integer NOT NULL DEFAULT 0,
    CONSTRAINT stores_pkey PRIMARY KEY (id),
    CONSTRAINT stores_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES vendors (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stores_vendor_id ON public.stores USING btree (vendor_id);
CREATE INDEX IF NOT EXISTS idx_stores_status ON public.stores USING btree (status);

-- Add update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS stores_updated_at_trigger ON public.stores;
CREATE TRIGGER stores_updated_at_trigger BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migration Logic for Existing Table (if relevant)
-- If the table exists with 'text' columns, we might want to migrate them. 
-- However, since the user provided a create script, we assume this is the primary definition.
-- The following blocks are safety measures if valid 'text' data exists.

DO $$ 
BEGIN
    -- Enhance 'status' column to ENUM if it is text
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'status' AND data_type = 'text') THEN
        -- CRITICAL: We must drop this policy because it uses the 'status' column. 
        -- We cannot change the column type while a policy depends on it.
        EXECUTE 'DROP POLICY IF EXISTS "Public can view active stores" ON public.stores';
        EXECUTE 'DROP POLICY IF EXISTS "Public can view social links of active stores" ON public.social_links';
        EXECUTE 'DROP POLICY IF EXISTS "Public can view active products" ON public.products';
        EXECUTE 'DROP POLICY IF EXISTS "Public can view product images of active products" ON public.product_images';

        ALTER TABLE public.stores ALTER COLUMN status DROP DEFAULT;
        
        ALTER TABLE public.stores 
        ALTER COLUMN status TYPE store_status 
        USING (CASE 
            WHEN status = 'Active' THEN 'Active'::store_status 
            WHEN status = 'Inactive' THEN 'Inactive'::store_status 
            ELSE 'Inactive'::store_status 
        END);
        
        ALTER TABLE public.stores ALTER COLUMN status SET DEFAULT 'Inactive'::store_status;
    END IF;

    -- Enhance 'categories' column to text[] if it is text
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'categories' AND data_type = 'text') THEN
        ALTER TABLE public.stores ALTER COLUMN categories DROP DEFAULT;

        -- Attempt to parse assuming it might be JSON string or comma separated
        ALTER TABLE public.stores 
        ALTER COLUMN categories TYPE text[] 
        USING (
            CASE 
                WHEN categories IS NULL OR categories = '' THEN '{}'::text[]
                ELSE string_to_array(translate(categories, '[]"', ''), ',')
            END
        );
        
        ALTER TABLE public.stores ALTER COLUMN categories SET DEFAULT '{}';
    END IF;

    -- Add generic columns if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'contact_email') THEN
        ALTER TABLE public.stores ADD COLUMN contact_email text NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'contact_website') THEN
        ALTER TABLE public.stores ADD COLUMN contact_website text NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'settings') THEN
        ALTER TABLE public.stores ADD COLUMN settings jsonb DEFAULT '{}'::jsonb;
    END IF;


     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'banner_url') THEN
        ALTER TABLE public.stores ADD COLUMN banner_url text NULL;
    END IF;

     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'slug') THEN
        ALTER TABLE public.stores ADD COLUMN slug text NULL UNIQUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'is_verified') THEN
        ALTER TABLE public.stores ADD COLUMN is_verified boolean NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'commission_rate') THEN
        ALTER TABLE public.stores ADD COLUMN commission_rate numeric NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'average_rating') THEN
        ALTER TABLE public.stores ADD COLUMN average_rating numeric NOT NULL DEFAULT 0.0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'review_count') THEN
        ALTER TABLE public.stores ADD COLUMN review_count integer NOT NULL DEFAULT 0;
    END IF;

END $$;

-- Recreate policy with the new ENUM type
DROP POLICY IF EXISTS "Public can view active stores" ON public.stores;
CREATE POLICY "Public can view active stores" ON public.stores FOR SELECT USING (status = 'Active'::store_status);

DROP POLICY IF EXISTS "Public can view social links of active stores" ON public.social_links;
CREATE POLICY "Public can view social links of active stores" ON public.social_links FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.stores 
        WHERE stores.id = social_links.store_id 
        AND stores.status = 'Active'::store_status
    )
);

DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.stores 
        WHERE stores.id = products.store_id 
        AND stores.status = 'Active'::store_status
    )
);

DROP POLICY IF EXISTS "Public can view product images of active products" ON public.product_images;
CREATE POLICY "Public can view product images of active products" ON public.product_images FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.products
        JOIN public.stores ON products.store_id = stores.id
        WHERE products.id = product_images.product_id
        AND stores.status = 'Active'::store_status
    )
);
