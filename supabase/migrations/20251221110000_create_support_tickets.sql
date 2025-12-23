-- Create support_tickets table
create table if not exists support_tickets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  subject text not null,
  message text not null,
  category text check (category in ('technical', 'billing', 'feature_request', 'other')) not null,
  status text check (status in ('open', 'in_progress', 'resolved', 'closed')) default 'open',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists support_tickets_user_id_idx on support_tickets(user_id);

-- RLS
alter table support_tickets enable row level security;

-- Users can view their own tickets
create policy "Users can view their own tickets"
  on support_tickets for select
  using ( auth.uid() = user_id );

-- Users can insert their own tickets
create policy "Users can insert their own tickets"
  on support_tickets for insert
  with check ( auth.uid() = user_id );
