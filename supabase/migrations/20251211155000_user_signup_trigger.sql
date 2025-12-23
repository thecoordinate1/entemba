-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.vendors (
    id,
    email,
    display_name,
    avatar_url,
    bank_name,
    bank_account_name,
    bank_account_number,
    bank_branch_name,
    mobile_money_provider,
    mobile_money_number,
    mobile_money_name
  )
  values (
    new.id,
    new.email,
    -- Use specific cast to ensure text type, fallback to email if display_name missing
    coalesce(new.raw_user_meta_data->>'display_name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'bank_name',
    new.raw_user_meta_data->>'bank_account_name',
    new.raw_user_meta_data->>'bank_account_number',
    new.raw_user_meta_data->>'bank_branch_name',
    new.raw_user_meta_data->>'mobile_money_provider',
    new.raw_user_meta_data->>'mobile_money_number',
    new.raw_user_meta_data->>'mobile_money_name'
  );
  return new;
end;
$$;

-- Trigger to call the function on new user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
