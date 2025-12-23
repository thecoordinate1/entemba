-- Create reviews table
create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  store_id uuid references stores(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade,
  customer_name text default 'Anonymous',
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text,
  vendor_reply text,
  is_verified_purchase boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists reviews_store_id_idx on reviews(store_id);
create index if not exists reviews_product_id_idx on reviews(product_id);

-- RLS
alter table reviews enable row level security;

-- Vendors can view reviews for their stores
create policy "Vendors can view reviews for their stores"
  on reviews for select
  using ( store_id in (select id from stores where vendor_id = auth.uid()) );

-- Vendors can update (reply to) reviews for their stores
create policy "Vendors can reply to reviews for their stores"
  on reviews for update
  using ( store_id in (select id from stores where vendor_id = auth.uid()) );
  
-- Public can view reviews (optional, for marketplace)
create policy "Public can view reviews"
  on reviews for select
  using ( true );
