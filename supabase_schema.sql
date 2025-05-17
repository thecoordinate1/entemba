-- Enable pgcrypto extension if not already enabled
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
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Vendors Table (as per your provided definition with email TEXT NULL)
CREATE TABLE IF NOT EXISTS public.vendors (
  id uuid not null default auth.uid (),
  display_name text not null,
  email text null,
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
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE, -- Renamed from user_id
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
COMMENT ON TABLE public.stores IS 'Stores information about vendor storefronts. vendor_id links to public.vendors.';
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

-- RLS Policies for public.stores table
-- Ensure RLS is enabled for the 'stores' table in your Supabase dashboard.
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can insert their own stores" ON public.stores;
CREATE POLICY "Vendors can insert their own stores"
  ON public.stores
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = vendor_id); -- Ensure this checks against vendor_id

DROP POLICY IF EXISTS "Vendors can view their own stores" ON public.stores;
CREATE POLICY "Vendors can view their own stores"
  ON public.stores
  FOR SELECT
  TO authenticated
  USING (auth.uid() = vendor_id); -- Ensure this checks against vendor_id

DROP POLICY IF EXISTS "Vendors can update their own stores" ON public.stores;
CREATE POLICY "Vendors can update their own stores"
  ON public.stores
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = vendor_id) -- Check current owner for update eligibility
  WITH CHECK (auth.uid() = vendor_id); -- Ensure vendor_id is not changed to someone else's

DROP POLICY IF EXISTS "Vendors can delete their own stores" ON public.stores;
CREATE POLICY "Vendors can delete their own stores"
  ON public.stores
  FOR DELETE
  TO authenticated
  USING (auth.uid() = vendor_id); -- Ensure this checks against vendor_id


-- Grant usage on public schema to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on tables to authenticated role (RLS will further restrict)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;

-- Allow execution of helper functions
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated; -- Only authenticated users trigger this via auth

-- Enable RLS for other tables if not already enabled (examples)
-- ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
-- Define policies for products, orders, etc., ensuring they check store_id and then vendor_id of the store.
-- Example product policies:
-- CREATE POLICY "Vendors can manage products in their own stores" ON public.products
--   FOR ALL TO authenticated USING (
--     store_id IN (SELECT id FROM public.stores WHERE vendor_id = auth.uid())
--   ) WITH CHECK (
--     store_id IN (SELECT id FROM public.stores WHERE vendor_id = auth.uid())
--   );

```