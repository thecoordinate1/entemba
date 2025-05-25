-- Enable pgcrypto extension if not already enabled
-- You might need to run this separately if you don't have permissions
-- or if it's not enabled by default in your project.
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to automatically update 'updated_at' timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger and function for idempotency (handle_new_user)
-- The CASCADE will also drop the trigger if it depends on the function.
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
-- Explicitly drop the trigger if it exists separately
DROP TRIGGER IF EXISTS create_public_vendor_for_user ON auth.users;


-- Vendors Table (formerly user_profiles)
-- Stores public profile information for authenticated users (vendors)
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    email TEXT NULL UNIQUE, -- Kept as NULL based on user's last definition
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.vendors IS 'Stores public profile information for vendors, linked to auth.users.';
-- Trigger for vendors updated_at
DROP TRIGGER IF EXISTS vendors_updated_at_trigger ON public.vendors;
CREATE TRIGGER vendors_updated_at_trigger
BEFORE UPDATE ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create a vendor profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.vendors (id, display_name, email, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'email',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates/updates a vendor profile upon new user signup, sourcing data from auth.users and its raw_user_meta_data.';

-- Trigger to call handle_new_user on new user creation
CREATE TRIGGER create_public_vendor_for_user
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Stores Table
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    logo_url TEXT,
    data_ai_hint TEXT,
    status TEXT NOT NULL DEFAULT 'Inactive',
    category TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.stores IS 'Stores information about vendor storefronts.';
-- Trigger for stores updated_at
DROP TRIGGER IF EXISTS stores_updated_at_trigger ON public.stores;
CREATE TRIGGER stores_updated_at_trigger
BEFORE UPDATE ON public.stores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Social Links Table
CREATE TABLE IF NOT EXISTS public.social_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.social_links IS 'Stores social media links for each store.';

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    order_price NUMERIC(10, 2),
    stock INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Draft',
    description TEXT,
    full_description TEXT NOT NULL,
    sku TEXT,
    tags TEXT[],
    weight_kg NUMERIC(8, 3),
    dimensions_cm JSONB,
    average_rating NUMERIC(3, 2) DEFAULT 0.00 NOT NULL, -- Added for reviews
    review_count INTEGER DEFAULT 0 NOT NULL,            -- Added for reviews
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL, -- Ensured NOT NULL
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL  -- Ensured NOT NULL
);
COMMENT ON TABLE public.products IS 'Stores product information for each store.';
-- Optional: Unique constraint for SKU per store if not already managed by application logic
ALTER TABLE public.products ADD CONSTRAINT IF NOT EXISTS unique_store_sku UNIQUE (store_id, sku);
-- Trigger for products updated_at
DROP TRIGGER IF EXISTS products_updated_at_trigger ON public.products;
CREATE TRIGGER products_updated_at_trigger
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Product Images Table
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    data_ai_hint TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.product_images IS 'Stores images associated with products.';

-- Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    data_ai_hint_avatar TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    tags TEXT[],
    street_address TEXT,
    city TEXT,
    state_province TEXT,
    zip_postal_code TEXT,
    country TEXT,
    joined_date DATE DEFAULT CURRENT_DATE NOT NULL,
    last_order_date DATE,
    total_spent DECIMAL DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.customers IS 'Stores customer information.';
-- Trigger for customers updated_at
DROP TRIGGER IF EXISTS customers_updated_at_trigger ON public.customers;
CREATE TRIGGER customers_updated_at_trigger
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    order_date TIMESTAMPTZ DEFAULT now() NOT NULL,
    total_amount DECIMAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    shipping_address TEXT NOT NULL,
    billing_address TEXT NOT NULL,
    shipping_method TEXT,
    payment_method TEXT,
    tracking_number TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.orders IS 'Stores order information.';
-- Trigger for orders updated_at
DROP TRIGGER IF EXISTS orders_updated_at_trigger ON public.orders;
CREATE TRIGGER orders_updated_at_trigger
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name_snapshot TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price_per_unit_snapshot DECIMAL NOT NULL,
    product_image_url_snapshot TEXT,
    data_ai_hint_snapshot TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.order_items IS 'Stores individual items within an order.';

-- Grant usage on public schema to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant specific permissions. RLS will further restrict.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;


-- RLS Policies for stores table
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert their own stores" ON public.stores;
CREATE POLICY "Users can insert their own stores"
  ON public.stores
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = vendor_id);

DROP POLICY IF EXISTS "Users can view their own stores" ON public.stores;
CREATE POLICY "Users can view their own stores"
  ON public.stores
  FOR SELECT
  TO authenticated
  USING (auth.uid() = vendor_id);

DROP POLICY IF EXISTS "Users can update their own stores" ON public.stores;
CREATE POLICY "Users can update their own stores"
  ON public.stores
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = vendor_id)
  WITH CHECK (auth.uid() = vendor_id);

DROP POLICY IF EXISTS "Users can delete their own stores" ON public.stores;
CREATE POLICY "Users can delete their own stores"
  ON public.stores
  FOR DELETE
  TO authenticated
  USING (auth.uid() = vendor_id);


-- RLS Policies for products table (example)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage products for their own stores" ON public.products;
CREATE POLICY "Users can manage products for their own stores"
    ON public.products
    FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.vendor_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.vendor_id = auth.uid()));

-- RLS Policies for product_images table (example)
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage product images for products in their own stores" ON public.product_images;
CREATE POLICY "Users can manage product images for products in their own stores"
    ON public.product_images
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM public.products p
        JOIN public.stores s ON p.store_id = s.id
        WHERE p.id = product_id AND s.vendor_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1
        FROM public.products p
        JOIN public.stores s ON p.store_id = s.id
        WHERE p.id = product_id AND s.vendor_id = auth.uid()
    ));

-- RLS Policies for orders table (example)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage orders for their own stores" ON public.orders;
CREATE POLICY "Users can manage orders for their own stores"
    ON public.orders
    FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.vendor_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.vendor_id = auth.uid()));

-- RLS Policies for order_items table (example)
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage order items for orders in their own stores" ON public.order_items;
CREATE POLICY "Users can manage order items for orders in their own stores"
    ON public.order_items
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM public.orders o
        JOIN public.stores s ON o.store_id = s.id
        WHERE o.id = order_id AND s.vendor_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1
        FROM public.orders o
        JOIN public.stores s ON o.store_id = s.id
        WHERE o.id = order_id AND s.vendor_id = auth.uid()
    ));

-- RLS Policies for customers table (example - assuming customers are managed per vendor for now)
-- This policy might need adjustment based on whether customers are global or per store/vendor.
-- For now, allowing any authenticated vendor to manage customers. More specific policies might be needed.
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated vendors can manage customer records" ON public.customers;
CREATE POLICY "Authenticated vendors can manage customer records"
    ON public.customers
    FOR ALL
    TO authenticated
    USING (true) -- Or more specific logic if customers are tied to stores/vendors directly
    WITH CHECK (true);


-- Indexes (Optional, but recommended for performance on larger datasets)
-- CREATE INDEX IF NOT EXISTS idx_stores_vendor_id ON public.stores(vendor_id); -- Renamed from user_id
-- CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
-- CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
-- CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
-- CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
-- CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
-- CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
-- CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
-- CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

