-- Create coupons table
create table if not exists coupons (
  id uuid default gen_random_uuid() primary key,
  store_id uuid references stores(id) on delete cascade not null,
  code text not null,
  description text,
  discount_type text check (discount_type in ('percentage', 'fixed_amount')) not null,
  discount_value numeric not null,
  min_spend numeric default 0,
  usage_limit integer,
  used_count integer default 0,
  start_date timestamptz default now(),
  end_date timestamptz,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Ensure unique code per store
  unique(store_id, code)
);

-- Indexes for performance
create index if not exists coupons_store_id_idx on coupons(store_id);
create index if not exists coupons_code_idx on coupons(code);

-- RLS Policies
alter table coupons enable row level security;

-- Vendors can view their own coupons
create policy "Vendors can view their own, coupons"
  on coupons for select
  using ( store_id in (select id from stores where vendor_id = auth.uid()) );

-- Vendors can insert their own coupons
create policy "Vendors can insert their own coupons"
  on coupons for insert
  with check ( store_id in (select id from stores where vendor_id = auth.uid()) );

-- Vendors can update their own coupons
create policy "Vendors can update their own coupons"
  on coupons for update
  using ( store_id in (select id from stores where vendor_id = auth.uid()) );

-- Vendors can delete their own coupons
create policy "Vendors can delete their own coupons"
  on coupons for delete
  using ( store_id in (select id from stores where vendor_id = auth.uid()) );
