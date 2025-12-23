-- Create notifications table
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  store_id uuid references stores(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text check (type in ('info', 'success', 'warning', 'error')) default 'info',
  is_read boolean default false,
  link text,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists notifications_user_id_idx on notifications(user_id);
create index if not exists notifications_is_read_idx on notifications(is_read);

-- RLS
alter table notifications enable row level security;

-- Users can view their own notifications
create policy "Users can view their own notifications"
  on notifications for select
  using ( auth.uid() = user_id );

-- Users can update (mark read) their own notifications
create policy "Users can update their own notifications"
  on notifications for update
  using ( auth.uid() = user_id );


-- TRIGGER FUNCTION: Notify Vendor on New Order
create or replace function notify_vendor_on_new_order()
returns trigger as $$
declare
  v_vendor_id uuid;
  v_customer_name text;
begin
  -- Get the vendor_id from the store
  select vendor_id into v_vendor_id
  from stores
  where id = NEW.store_id;

  -- Get customer name (optional, or use NEW.customer_name if available in orders table directly)
  -- Assuming customer_name is in orders table as per previous files
  v_customer_name := NEW.customer_name;

  if v_vendor_id is not null then
    insert into notifications (user_id, store_id, title, message, type, link)
    values (
      v_vendor_id,
      NEW.store_id,
      'New Order Received',
      coalesce(v_customer_name, 'A customer') || ' has placed a new order (' || NEW.total_amount || ' ZMW).',
      'success',
      '/orders?id=' || NEW.id
    );
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

-- DROP AND RECREATE TRIGGER
drop trigger if exists on_order_created on orders;
create trigger on_order_created
  after insert on orders
  for each row
  execute function notify_vendor_on_new_order();
