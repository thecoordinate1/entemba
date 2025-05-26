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

-- Drop existing trigger and function for handle_new_user to ensure clean re-creation
-- The CASCADE will also drop the trigger if it depends on the function.
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
-- Explicitly drop the trigger if it exists separately
DROP TRIGGER IF EXISTS create_public_vendor_for_user ON auth.users;

-- Vendors Table
DROP TABLE IF EXISTS public.vendors CASCADE;
CREATE TABLE public.vendors (
  id uuid not null default auth.uid (),
  display_name text not null,
  email text null, -- As per your definition
  avatar_url text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint vendors_pkey primary key (id),
  constraint vendors_email_key unique (email),
  constraint vendors_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
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
DROP TABLE IF EXISTS public.stores CASCADE;
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
DROP TABLE IF EXISTS public.social_links CASCADE;
CREATE TABLE IF NOT EXISTS public.social_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.social_links IS 'Stores social media links for each store.';

-- Products Table
DROP TABLE IF EXISTS public.products CASCADE;
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    order_price DECIMAL(10,2),
    stock INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Draft',
    description TEXT,
    full_description TEXT NOT NULL,
    sku TEXT,
    tags TEXT[],
    weight_kg DECIMAL(8,3),
    dimensions_cm JSONB,
    average_rating NUMERIC(3, 2) DEFAULT 0.00 NOT NULL,
    review_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT products_store_id_sku_key UNIQUE (store_id, sku)
);
COMMENT ON TABLE public.products IS 'Stores product information for each store.';
-- Trigger for products updated_at
DROP TRIGGER IF EXISTS products_updated_at_trigger ON public.products;
CREATE TRIGGER products_updated_at_trigger
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Product Images Table
DROP TABLE IF EXISTS public.product_images CASCADE;
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
DROP TABLE IF EXISTS public.customers CASCADE;
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
DROP TABLE IF EXISTS public.orders CASCADE;
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    order_date TIMESTAMPTZ DEFAULT now() NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    shipping_address TEXT NOT NULL,
    billing_address TEXT NOT NULL,
    shipping_method TEXT,
    payment_method TEXT,
    tracking_number TEXT,
    shipping_latitude DECIMAL(9,6), -- Added for latitude
    shipping_longitude DECIMAL(9,6), -- Added for longitude
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.orders IS 'Stores order information, including shipping coordinates.';
-- Trigger for orders updated_at
DROP TRIGGER IF EXISTS orders_updated_at_trigger ON public.orders;
CREATE TRIGGER orders_updated_at_trigger
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Order Items Table
DROP TABLE IF EXISTS public.order_items CASCADE;
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name_snapshot TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price_per_unit_snapshot DECIMAL(10,2) NOT NULL,
    product_image_url_snapshot TEXT,
    data_ai_hint_snapshot TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.order_items IS 'Stores individual items within an order.';

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO anon, authenticated;

-- RLS Policies for stores
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stores_vendor_id ON public.stores(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_social_links_store_id ON public.social_links(store_id);
```