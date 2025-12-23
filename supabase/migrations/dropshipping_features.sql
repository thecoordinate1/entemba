-- Add supplier functionality to vendors
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS is_supplier boolean DEFAULT false;

-- Add dropshipping fields to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_dropshippable boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS supplier_product_id uuid REFERENCES public.products(id),
ADD COLUMN IF NOT EXISTS supplier_price numeric;

-- Index for performance when searching for dropshippable products
CREATE INDEX IF NOT EXISTS idx_products_is_dropshippable ON public.products(is_dropshippable);
CREATE INDEX IF NOT EXISTS idx_products_supplier_product_id ON public.products(supplier_product_id);
