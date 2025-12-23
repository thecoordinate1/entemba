-- Create the vendors table
create table if not exists public.vendors (
  id uuid not null default auth.uid(),
  display_name text not null,
  email text null,
  avatar_url text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  bank_name text null,
  bank_account_name text null,
  bank_account_number text null,
  bank_branch_name text null,
  mobile_money_provider text null,
  mobile_money_number text null,
  mobile_money_name text null,
  constraint vendors_pkey primary key (id),
  constraint vendors_email_key unique (email),
  constraint vendors_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

-- Create the trigger function if it doesn't exist
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create the trigger
drop trigger if exists vendors_updated_at_trigger on public.vendors;
create trigger vendors_updated_at_trigger before update on public.vendors
for each row execute function update_updated_at_column();

-- Enable RLS (Recommended)
alter table public.vendors enable row level security;

-- Create policies (Optional but recommended defaults)
drop policy if exists "Vendors can view their own profile" on public.vendors;
create policy "Vendors can view their own profile"
on public.vendors for select
using ( auth.uid() = id );

drop policy if exists "Vendors can update their own profile" on public.vendors;
create policy "Vendors can update their own profile"
on public.vendors for update
using ( auth.uid() = id );

drop policy if exists "Vendors can insert their own profile" on public.vendors;
create policy "Vendors can insert their own profile"
on public.vendors for insert
with check ( auth.uid() = id );
