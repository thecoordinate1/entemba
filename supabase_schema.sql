
-- Enable pgcrypto extension if not already enabled (for gen_random_uuid())
-- You might need to run this separately in the Supabase SQL editor if it causes issues in a single script run.
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper function to update 'updated_at' column
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Users Table (public user profiles, references auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for auto-updating 'updated_at' on users table
CREATE TRIGGER set_users_timestamp
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- 2. Stores Table
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  logo_url TEXT,
  data_ai_hint TEXT,
  status TEXT NOT NULL, -- Consider using an ENUM type for 'Active', 'Inactive', 'Maintenance'
  category TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for auto-updating 'updated_at' on stores table
CREATE TRIGGER set_stores_timestamp
BEFORE UPDATE ON public.stores
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- 3. Social Links Table
CREATE TABLE IF NOT EXISTS public.social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL, -- Consider ENUM: 'Instagram', 'Facebook', 'Twitter', 'TikTok', 'LinkedIn', 'Other'
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  order_price NUMERIC(10, 2),
  stock INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL, -- Consider ENUM: 'Active', 'Draft', 'Archived'
  description TEXT,
  full_description TEXT NOT NULL,
  sku TEXT,
  tags TEXT[],
  weight_kg NUMERIC(8, 3),
  dimensions_cm JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (store_id, sku) -- SKU should be unique per store
);

-- Trigger for auto-updating 'updated_at' on products table
CREATE TRIGGER set_products_timestamp
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- 5. Product Images Table
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  data_ai_hint TEXT,
  "order" INTEGER DEFAULT 0, -- "order" is a reserved keyword, quoted
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  order_date TIMESTAMPTZ DEFAULT NOW(),
  total_amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL, -- Consider ENUM: 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'
  shipping_address TEXT NOT NULL,
  billing_address TEXT NOT NULL,
  shipping_method TEXT,
  payment_method TEXT,
  tracking_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for auto-updating 'updated_at' on orders table
CREATE TRIGGER set_orders_timestamp
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- 7. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL, -- Product can be deleted, keep order item
  product_name_snapshot TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price_per_unit_snapshot NUMERIC(10, 2) NOT NULL,
  product_image_url_snapshot TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: Add indexes for frequently queried columns, for example:
-- CREATE INDEX IF NOT EXISTS idx_stores_user_id ON public.stores(user_id);
-- CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
-- CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
-- CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
-- CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
-- CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
-- CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

COMMENT ON COLUMN public.product_images."order" IS 'Order for image display, lower numbers show first.';
COMMENT ON COLUMN public.products.sku IS 'Stock Keeping Unit, should be unique within a store.';
COMMENT ON COLUMN public.products.tags IS 'Array of text tags for product filtering/search.';
COMMENT ON COLUMN public.products.weight_kg IS 'Product weight in kilograms.';
COMMENT ON COLUMN public.products.dimensions_cm IS 'Product dimensions (length, width, height) in centimeters, stored as JSONB e.g., {"length": 10, "width": 10, "height": 10}.';
COMMENT ON COLUMN public.order_items.product_id IS 'Reference to the product. Can be NULL if product is deleted.';
COMMENT ON COLUMN public.order_items.product_name_snapshot IS 'Snapshot of product name at time of order.';
COMMENT ON COLUMN public.order_items.price_per_unit_snapshot IS 'Snapshot of price per unit at time of order.';
COMMENT ON COLUMN public.order_items.product_image_url_snapshot IS 'Snapshot of main product image URL at time of order.';

