
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
DROP TRIGGER IF EXISTS create_public_vendor_for_user ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Vendors Table
-- Stores public profile information for authenticated users (vendors)
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL, -- Ensuring email is NOT NULL and UNIQUE
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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a vendor profile upon new user signup.';

-- Trigger to call handle_new_user on new user creation
-- This is CRUCIAL for populating the vendors table
CREATE TRIGGER create_public_vendor_for_user
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Stores Table
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE, -- Foreign key to public.vendors
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
    price DECIMAL NOT NULL,
    order_price DECIMAL, 
    stock INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Draft', 
    description TEXT,
    full_description TEXT NOT NULL,
    sku TEXT, 
    tags TEXT[], 
    weight_kg DECIMAL,
    dimensions_cm JSONB, 
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.products IS 'Stores product information for each store.';
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

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated; 
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres; -- Supabase handles trigger execution context

-- RLS Policies for public.vendors (example)
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Vendors can view their own profile" ON public.vendors;
CREATE POLICY "Vendors can view their own profile"
  ON public.vendors
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Vendors can update their own profile" ON public.vendors;
CREATE POLICY "Vendors can update their own profile"
  ON public.vendors
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
-- Note: INSERT to vendors is handled by the trigger. DELETE is handled by CASCADE from auth.users.

-- RLS Policies for public.stores (example)
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert their own stores" ON public.stores;
CREATE POLICY "Users can insert their own stores"
  ON public.stores
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own stores" ON public.stores;
CREATE POLICY "Users can view their own stores"
  ON public.stores
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own stores" ON public.stores;
CREATE POLICY "Users can update their own stores"
  ON public.stores
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own stores" ON public.stores;
CREATE POLICY "Users can delete their own stores"
  ON public.stores
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add similar RLS policies for products, orders, customers, etc., as needed.
-- Example for products:
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage products for their own stores" ON public.products;
CREATE POLICY "Users can manage products for their own stores"
    ON public.products
    FOR ALL
    TO authenticated
    USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()))
    WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage product images for their own stores" ON public.product_images;
CREATE POLICY "Users can manage product images for their own stores"
    ON public.product_images
    FOR ALL
    TO authenticated
    USING (product_id IN (SELECT id FROM public.products WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())))
    WITH CHECK (product_id IN (SELECT id FROM public.products WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())));
    
-- Example RLS for customers (assuming vendors manage their own customers and customers don't log in)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
-- If customers are linked to stores, RLS would be based on store ownership.
-- For now, allow authenticated (vendors) to manage all customers.
-- This would need refinement if customers were per-store or also users.
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON public.customers;
CREATE POLICY "Authenticated users can manage customers"
    ON public.customers
    FOR ALL
    TO authenticated
    USING (true) 
    WITH CHECK (true);


-- Example RLS for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage orders for their own stores" ON public.orders;
CREATE POLICY "Users can manage orders for their own stores"
    ON public.orders
    FOR ALL
    TO authenticated
    USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()))
    WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage order items for their own stores" ON public.order_items;
CREATE POLICY "Users can manage order items for their own stores"
    ON public.order_items
    FOR ALL
    TO authenticated
    USING (order_id IN (SELECT id FROM public.orders WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())))
    WITH CHECK (order_id IN (SELECT id FROM public.orders WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())));


-- Indexes (Optional, but recommended for performance on larger datasets)
CREATE INDEX IF NOT EXISTS idx_vendors_email ON public.vendors(email);
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON public.stores(user_id);
CREATE INDEX IF NOT EXISTS idx_social_links_store_id ON public.social_links(store_id);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_customers_email_customer ON public.customers(email); -- Renamed to avoid conflict if you have other email indexes

