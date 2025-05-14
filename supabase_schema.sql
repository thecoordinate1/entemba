-- Helper function to automatically update 'updated_at' timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- USERS (Vendors) Table - Stores public profile information for authenticated users (vendors)
-- This table is linked to auth.users
-- The 'id' column references auth.users.id and is the primary key.
CREATE TABLE public.vendors (
    id UUID PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, -- Made NOT NULL, sourced from raw_user_meta_data by trigger
    avatar_url TEXT,             -- For profile picture
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Trigger for vendors table to update 'updated_at' timestamp
CREATE TRIGGER handle_vendors_updated_at
BEFORE UPDATE ON public.vendors
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Function to be called by a trigger when a new user signs up in auth.users
-- This function inserts a corresponding record into the public.vendors table.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public -- Essential for accessing auth.users metadata
AS $$
BEGIN
  INSERT INTO public.vendors (id, display_name, email, avatar_url)
  VALUES (
    NEW.id, -- The user's ID from auth.users
    NEW.raw_user_meta_data->>'display_name', -- Vendor's display name from metadata provided at signup
    NEW.raw_user_meta_data->>'email', -- Vendor's email from metadata provided at signup
    NEW.raw_user_meta_data->>'avatar_url' -- Optional: avatar URL from metadata
  );
  RETURN NEW;
END;
$$;

-- Trigger that calls handle_new_user AFTER a new user is inserted into auth.users
CREATE TRIGGER create_public_vendor_for_user
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- STORES Table
CREATE TABLE public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE, -- Link to the vendor who owns the store
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    logo_url TEXT,
    data_ai_hint TEXT, -- For AI-generated logo suggestions or image search for logo
    status TEXT NOT NULL DEFAULT 'Inactive', -- e.g., "Active", "Inactive", "Maintenance"
    category TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_stores_user_id ON public.stores(user_id);
-- Consider ENUM for status: CREATE TYPE store_status AS ENUM ('Active', 'Inactive', 'Maintenance'); and use store_status for status column.

-- Trigger for stores table
CREATE TRIGGER handle_stores_updated_at
BEFORE UPDATE ON public.stores
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- SOCIAL_LINKS Table
CREATE TABLE public.social_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- e.g., "Instagram", "Facebook", "Twitter", "TikTok", "LinkedIn"
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_social_links_store_id ON public.social_links(store_id);
-- Consider ENUM for platform

-- PRODUCTS Table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL, -- Assuming 10 digits, 2 decimal places
    order_price DECIMAL(10, 2),    -- Price for manual orders, can be nullable
    stock INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Draft', -- e.g., "Active", "Draft", "Archived"
    description TEXT, -- Short description
    full_description TEXT NOT NULL, -- Detailed description
    sku TEXT, -- Nullable, should be unique per store if used. Add UNIQUE constraint if needed: UNIQUE(store_id, sku)
    tags TEXT[], -- Array of text tags
    weight_kg DECIMAL(10, 3), -- Weight in kilograms, nullable
    dimensions_cm JSONB, -- e.g., {"length": 10, "width": 10, "height": 10}, nullable
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_products_store_id ON public.products(store_id);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_status ON public.products(status);
-- Consider ENUM for status

-- Trigger for products table
CREATE TRIGGER handle_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- PRODUCT_IMAGES Table
CREATE TABLE public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    data_ai_hint TEXT, -- For AI search for similar images or alt text generation
    display_order INTEGER DEFAULT 0, -- For image display order
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_product_images_product_id ON public.product_images(product_id);

-- CUSTOMERS Table - For customers managed by vendors
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional: if customers can also be authenticated users
    name TEXT NOT NULL,
    email TEXT UNIQUE, -- Make email unique, can be nullable if not always provided
    phone TEXT,
    avatar_url TEXT,
    data_ai_hint_avatar TEXT,
    status TEXT DEFAULT 'Active' NOT NULL, -- e.g., 'Active', 'Inactive', 'Blocked'
    tags TEXT[],
    -- Address fields
    address_street TEXT,
    address_city TEXT,
    address_state_province TEXT,
    address_zip_postal_code TEXT,
    address_country TEXT,
    -- Metrics (potentially managed by triggers or aggregated queries, not directly on customer record if they are store-specific)
    -- total_spent DECIMAL(10, 2) DEFAULT 0.00,
    -- total_orders INTEGER DEFAULT 0,
    joined_date DATE DEFAULT CURRENT_DATE NOT NULL,
    -- last_order_date DATE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_customers_email ON public.customers(email);
CREATE INDEX idx_customers_name ON public.customers(name); -- If searching by name is common
-- Consider ENUM for status

-- Trigger for customers table
CREATE TRIGGER handle_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();


-- ORDERS Table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL, -- Link to a customer record if available
    customer_name TEXT NOT NULL, -- Snapshot or if customer_id is null
    customer_email TEXT NOT NULL, -- Snapshot or if customer_id is null
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
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_orders_store_id ON public.orders(store_id);
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
-- Consider ENUM for status

-- Trigger for orders table
CREATE TRIGGER handle_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- ORDER_ITEMS Table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL, -- Product can be deleted, so allow NULL or handle differently
    product_name_snapshot TEXT NOT NULL, -- Snapshot of product name at time of order
    quantity INTEGER NOT NULL,
    price_per_unit_snapshot DECIMAL(10, 2) NOT NULL, -- Snapshot of price at time of order
    product_image_url_snapshot TEXT, -- Snapshot of main image URL
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);

-- Grant usage on public schema to authenticated users (and anon if needed for public data)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant specific permissions on tables
-- For vendors table:
GRANT SELECT ON public.vendors TO authenticated; -- Allow vendors to see their own profile (RLS will restrict)
GRANT UPDATE (display_name, avatar_url) ON public.vendors TO authenticated; -- Allow vendors to update specific fields (RLS will restrict)

-- For stores table:
GRANT SELECT ON public.stores TO authenticated;
GRANT INSERT (user_id, name, description, logo_url, data_ai_hint, status, category, location) ON public.stores TO authenticated;
GRANT UPDATE (name, description, logo_url, data_ai_hint, status, category, location) ON public.stores TO authenticated;
GRANT DELETE ON public.stores TO authenticated;
-- Note: RLS policies are crucial for restricting these to the owner.

-- For social_links table:
GRANT SELECT ON public.social_links TO authenticated;
GRANT INSERT (store_id, platform, url) ON public.social_links TO authenticated;
GRANT UPDATE (platform, url) ON public.social_links TO authenticated;
GRANT DELETE ON public.social_links TO authenticated;

-- For products table:
GRANT SELECT ON public.products TO authenticated;
GRANT INSERT (store_id, name, category, price, order_price, stock, status, description, full_description, sku, tags, weight_kg, dimensions_cm) ON public.products TO authenticated;
GRANT UPDATE (name, category, price, order_price, stock, status, description, full_description, sku, tags, weight_kg, dimensions_cm) ON public.products TO authenticated;
GRANT DELETE ON public.products TO authenticated;

-- For product_images table:
GRANT SELECT ON public.product_images TO authenticated;
GRANT INSERT (product_id, image_url, data_ai_hint, display_order) ON public.product_images TO authenticated;
GRANT UPDATE (image_url, data_ai_hint, display_order) ON public.product_images TO authenticated;
GRANT DELETE ON public.product_images TO authenticated;

-- For customers table:
GRANT SELECT ON public.customers TO authenticated;
GRANT INSERT (name, email, phone, avatar_url, data_ai_hint_avatar, status, tags, address_street, address_city, address_state_province, address_zip_postal_code, address_country) ON public.customers TO authenticated;
GRANT UPDATE (name, email, phone, avatar_url, data_ai_hint_avatar, status, tags, address_street, address_city, address_state_province, address_zip_postal_code, address_country) ON public.customers TO authenticated;
GRANT DELETE ON public.customers TO authenticated;

-- For orders table:
GRANT SELECT ON public.orders TO authenticated;
GRANT INSERT (store_id, customer_id, customer_name, customer_email, total_amount, status, shipping_address, billing_address, shipping_method, payment_method, tracking_number) ON public.orders TO authenticated;
GRANT UPDATE (status, tracking_number, shipping_address, billing_address, shipping_method, payment_method) ON public.orders TO authenticated;
-- Deleting orders might be restricted or a soft delete. For now, allowing delete by authenticated (RLS will govern).
GRANT DELETE ON public.orders TO authenticated;

-- For order_items table:
GRANT SELECT ON public.order_items TO authenticated;
GRANT INSERT (order_id, product_id, product_name_snapshot, quantity, price_per_unit_snapshot, product_image_url_snapshot) ON public.order_items TO authenticated;
-- Updates to order_items are typically not allowed once an order is placed. If needed, add specific columns.
-- Deleting order_items directly might also be restricted.
GRANT DELETE ON public.order_items TO authenticated;


-- Allow anon role to read from public buckets if your RLS policies for storage permit it
-- These are general grants; RLS on storage buckets is the primary security mechanism for storage access.
GRANT SELECT ON storage.objects TO anon;
GRANT SELECT ON storage.buckets TO anon;

-- Allow authenticated users to manage their own files in storage (RLS will define specifics)
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.buckets TO authenticated; -- If they need to list buckets they have access to
