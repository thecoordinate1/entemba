-- Ensure delivery_code column exists
alter table orders
add column if not exists delivery_code text;

-- Function to generate a 6-digit code
create or replace function generate_delivery_code()
returns trigger as $$
begin
  if NEW.delivery_code is null then
    -- Generate a random 6-digit number. 
    -- floor(random() * 900000 + 100000) generates a number between 100000 and 999999
    NEW.delivery_code := floor(random() * 900000 + 100000)::text;
  end if;
  return NEW;
end;
$$ language plpgsql;

-- Trigger to assign code before insert
drop trigger if exists set_delivery_code on orders;
create trigger set_delivery_code
  before insert on orders
  for each row
  execute function generate_delivery_code();
