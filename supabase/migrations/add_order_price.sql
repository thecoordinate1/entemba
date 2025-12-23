-- Add order_price column to products if it doesn't exist
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS order_price numeric DEFAULT NULL;
