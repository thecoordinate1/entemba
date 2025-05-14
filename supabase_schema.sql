-- Helper function to automatically update 'updated_at' timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger and function if they exist, for idempotency
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Function to insert a new vendor when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public -- Ensures 'auth.uid()' and other functions are available
AS $$
BEGIN
  INSERT INTO public.vendors (id, display_name, email, avatar_url)
  VALUES (
    NEW.id, -- Supabase user ID
    NEW.raw_user_meta_data->>'display_name', -- Fetches 'display_name' from user_metadata
    NEW.raw_user_meta_data->>'email',         -- Fetches 'email' from user_metadata
    NEW.raw_user_meta_data->>'avatar_url'    -- Fetches 'avatar_url' from user_metadata if present
  );
  RETURN NEW;
END;
$$;

-- Trigger to call the function when a new user signs up
CREATE TRIGGER create_public_vendor_for_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- VENDORS Table (for vendor-specific public profiles)
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL, -- Made NOT NULL and ensuring trigger populates it
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.vendors IS 'Stores public profile information for vendors, linked to auth.users.';
-- Trigger for vendors updated_at
DROP TRIGGER IF EXISTS handle_vendors_updated_at ON public.vendors;
CREATE TRIGGER handle_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
CREATE INDEX IF NOT EXISTS idx_vendors_email ON public.vendors(email);

-- STORES Table
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Link to the vendor/user who owns the store
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    logo_url TEXT,
    data_ai_hint TEXT, -- For AI-generated logo hints or Unsplash search for logo
    status TEXT NOT NULL DEFAULT 'Inactive', -- e.g., "Active", "Inactive", "Maintenance"
    category TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.stores IS 'Stores information about each vendor storefront.';
-- Optional: Consider ENUM type for status: CREATE TYPE store_status AS ENUM ('Active', 'Inactive', 'Maintenance'); and then status store_status NOT NULL
-- Trigger for stores updated_at
DROP TRIGGER IF EXISTS handle_stores_updated_at ON public.stores;
CREATE TRIGGER handle_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON public.stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_category ON public.stores(category);

-- SOCIAL_LINKS Table
CREATE TABLE IF NOT EXISTS public.social_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- e.g., "Instagram", "Facebook", "Twitter", "TikTok", "LinkedIn", "Other"
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.social_links IS 'Stores social media links for each store.';
-- Optional: Consider ENUM type for platform
CREATE INDEX IF NOT EXISTS idx_social_links_store_id ON public.social_links(store_id);

-- PRODUCTS Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL, -- Assuming 2 decimal places for price
    order_price DECIMAL(10, 2),    -- Price for orders, can be different from display price
    stock INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Draft', -- e.g., "Active", "Draft", "Archived"
    description TEXT,
    full_description TEXT NOT NULL,
    sku TEXT, -- Should be unique per store, consider a composite unique constraint or handle in application logic
    tags TEXT[], -- Array of text tags
    weight_kg DECIMAL(7, 3), -- Weight in kilograms, e.g., 1234.567 kg
    dimensions_cm JSONB, -- e.g., {"length": 10, "width": 10, "height": 10} in cm
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.products IS 'Contains all product listings for stores.';
-- Optional: Consider ENUM type for status
-- Optional: Add UNIQUE constraint for (store_id, sku) if SKU must be unique per store:
-- ALTER TABLE public.products ADD CONSTRAINT unique_store_sku UNIQUE (store_id, sku);
-- Trigger for products updated_at
DROP TRIGGER IF EXISTS handle_products_updated_at ON public.products;
CREATE TRIGGER handle_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_tags ON public.products USING GIN (tags); -- For array searching

-- PRODUCT_IMAGES Table
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL, -- URL from Supabase Storage
    data_ai_hint TEXT, -- For AI-generated image hints or Unsplash search
    display_order INTEGER DEFAULT 0, -- For image display order on product page
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.product_images IS 'Stores multiple images for each product.';
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);

-- CUSTOMERS Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional: if customers can also be authenticated users
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    data_ai_hint_avatar TEXT,
    status TEXT NOT NULL DEFAULT 'Active', -- e.g., "Active", "Inactive", "Blocked"
    joined_date DATE DEFAULT current_date NOT NULL,
    last_order_date DATE,
    total_spent DECIMAL(12, 2) DEFAULT 0.00,
    total_orders INTEGER DEFAULT 0,
    tags TEXT[],
    -- Address fields
    address_street TEXT,
    address_city TEXT,
    address_state_province TEXT,
    address_zip_postal_code TEXT,
    address_country TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.customers IS 'Stores information about customers making purchases.';
-- Optional: Consider ENUM for status
-- Trigger for customers updated_at
DROP TRIGGER IF EXISTS handle_customers_updated_at ON public.customers;
CREATE TRIGGER handle_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);


-- ORDERS Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL, -- Link to customer record
    customer_name TEXT NOT NULL, -- Snapshot or if customer_id is NULL
    customer_email TEXT NOT NULL, -- Snapshot or if customer_id is NULL
    order_date TIMESTAMPTZ DEFAULT now() NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending', -- e.g., "Pending", "Processing", "Shipped", "Delivered", "Cancelled"
    shipping_address TEXT NOT NULL,
    billing_address TEXT NOT NULL,
    shipping_method TEXT,
    payment_method TEXT,
    tracking_number TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.orders IS 'Stores order information placed by customers.';
-- Optional: Consider ENUM type for status
-- Trigger for orders updated_at
DROP TRIGGER IF EXISTS handle_orders_updated_at ON public.orders;
CREATE TRIGGER handle_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- ORDER_ITEMS Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL, -- Product can be deleted, so allow SET NULL or handle differently
    product_name_snapshot TEXT NOT NULL, -- Snapshot of product name at time of order
    quantity INTEGER NOT NULL,
    price_per_unit_snapshot DECIMAL(10, 2) NOT NULL, -- Snapshot of price at time of order
    product_image_url_snapshot TEXT, -- Snapshot of main image URL
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.order_items IS 'Details each item within an order.';
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- Enable pgcrypto extension if not already enabled (for gen_random_uuid())
-- Usually enabled by default on Supabase, but good to be aware.
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;
