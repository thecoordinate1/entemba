
-- Helper function to update 'updated_at' columns
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enable pgcrypto for gen_random_uuid() if not already enabled
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Vendors Table (formerly user_profiles, for additional vendor-specific data not in auth.users)
-- This table links to auth.users and stores public profile information for vendors.
CREATE TABLE IF NOT EXISTS vendors (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE, -- Or use email from auth.users as primary display?
    display_name TEXT, -- More flexible than username for public display
    avatar_url TEXT,
    data_ai_hint_avatar TEXT, -- For AI-generated avatars for vendors if needed
    -- Add any other vendor-specific fields here (e.g., business name if different from display_name, contact info)
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger for 'vendors' table
DROP TRIGGER IF EXISTS set_timestamp_vendors ON vendors;
CREATE TRIGGER set_timestamp_vendors
BEFORE UPDATE ON vendors
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Stores Table
CREATE TABLE IF NOT EXISTS stores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- The vendor who owns this store
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    logo_url TEXT,
    data_ai_hint TEXT, -- For AI-generated logos
    status TEXT NOT NULL DEFAULT 'Inactive', -- e.g., Active, Inactive, Maintenance
    category TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger for 'stores' table
DROP TRIGGER IF EXISTS set_timestamp_stores ON stores;
CREATE TRIGGER set_timestamp_stores
BEFORE UPDATE ON stores
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Social Links Table (for stores)
CREATE TABLE IF NOT EXISTS social_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- e.g., Instagram, Facebook, Twitter, TikTok, LinkedIn, Other
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
    -- No updated_at needed if these are typically created and deleted, not updated. Add if updates are common.
);
-- Consider UNIQUE constraint on (store_id, platform)
-- CREATE UNIQUE INDEX IF NOT EXISTS social_links_store_id_platform_idx ON social_links(store_id, platform);


-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    order_price DECIMAL(10, 2), -- Price used for manual order creation, if different from listing price
    stock INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Draft', -- e.g., Active, Draft, Archived
    description TEXT, -- Short description for listings
    full_description TEXT NOT NULL, -- Detailed description for product page
    sku TEXT, -- Should be unique per store: CONSTRAINT sku_unique_per_store UNIQUE (store_id, sku)
    tags TEXT[],
    weight_kg DECIMAL(10, 3),
    dimensions_cm JSONB, -- e.g., {"length": 10, "width": 10, "height": 10}
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Add unique constraint for SKU per store if desired
-- ALTER TABLE products ADD CONSTRAINT products_store_id_sku_key UNIQUE (store_id, sku);

-- Trigger for 'products' table
DROP TRIGGER IF EXISTS set_timestamp_products ON products;
CREATE TRIGGER set_timestamp_products
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Product Images Table
CREATE TABLE IF NOT EXISTS product_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL, -- URL from Supabase Storage
    data_ai_hint TEXT, -- For searching stock images
    sort_order INT DEFAULT 0, -- For image display order
    created_at TIMESTAMPTZ DEFAULT now()
    -- No updated_at needed if these are typically created and deleted/reordered, not updated.
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    -- If customers can log in and have user_ids:
    -- customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, 
    customer_name TEXT NOT NULL, -- Snapshot, or link to a separate customers table
    customer_email TEXT NOT NULL, -- Snapshot, or link to a separate customers table
    order_date TIMESTAMPTZ DEFAULT now(),
    total_amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending', -- e.g., Pending, Processing, Shipped, Delivered, Cancelled
    shipping_address TEXT NOT NULL,
    billing_address TEXT NOT NULL,
    shipping_method TEXT,
    payment_method TEXT,
    tracking_number TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger for 'orders' table
DROP TRIGGER IF EXISTS set_timestamp_orders ON orders;
CREATE TRIGGER set_timestamp_orders
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE SET NULL, -- Product might be deleted later
    product_name_snapshot TEXT NOT NULL, -- Snapshot of product name at time of order
    quantity INT NOT NULL,
    price_per_unit_snapshot DECIMAL(10, 2) NOT NULL, -- Snapshot of price at time of order
    product_image_url_snapshot TEXT, -- Snapshot of main image URL
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Customers Table (for CRM-like features, distinct from auth.users)
CREATE TABLE IF NOT EXISTS customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- If customers can also be authenticated users, link to auth.users
    -- user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL, -- Ensure customer emails are unique if they are distinct entities
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'Active', -- e.g., Active, Inactive, Blocked
    tags TEXT[],
    avatar_url TEXT, -- URL from Supabase Storage or external
    data_ai_hint_avatar TEXT, -- For AI-generated avatars if needed
    total_spent DECIMAL(10, 2) DEFAULT 0.00,
    total_orders INT DEFAULT 0,
    joined_date DATE DEFAULT CURRENT_DATE,
    last_order_date DATE,
    -- Address fields (can be JSONB or individual columns for structured address)
    street TEXT,
    city TEXT,
    state_province TEXT, -- Renamed from 'state' to avoid SQL keyword conflicts
    zip_postal_code TEXT, -- Renamed from 'zip'
    country TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger for 'customers' table
DROP TRIGGER IF EXISTS set_timestamp_customers ON customers;
CREATE TRIGGER set_timestamp_customers
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();


-- Optional: Indexes for frequently queried columns
-- CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
-- CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
-- CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
-- CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
-- CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
-- CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);

-- RLS Policies (Examples - to be refined and enabled in Supabase dashboard)
-- Ensure RLS is enabled for all tables.

/*
-- Example RLS policy for stores: Users can only see their own stores.
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own stores" ON stores;
CREATE POLICY "Users can view their own stores"
ON stores FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own stores" ON stores;
CREATE POLICY "Users can manage their own stores"
ON stores FOR ALL -- covers INSERT, UPDATE, DELETE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Example RLS policy for products: Users can only manage products for stores they own.
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view products of their stores" ON products;
CREATE POLICY "Users can view products of their stores"
ON products FOR SELECT
USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage products of their stores" ON products;
CREATE POLICY "Users can manage products of their stores"
ON products FOR ALL
USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()))
WITH CHECK (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

-- Similar policies would be needed for orders, order_items, product_images, social_links, customers, and vendors.
-- For customers, RLS might be more complex depending on whether vendors can see all customers or only customers related to their store's orders.
*/
