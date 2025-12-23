-- Fix missing payout details for vendors
-- Syncs payout information from auth.users metadata to public.vendors table
-- This is necessary for users created before the full trigger logic was active or if the initial backfill missed these fields.

UPDATE public.vendors v
SET
    bank_name = COALESCE(v.bank_name, u.raw_user_meta_data->>'bank_name'),
    bank_account_name = COALESCE(v.bank_account_name, u.raw_user_meta_data->>'bank_account_name'),
    bank_account_number = COALESCE(v.bank_account_number, u.raw_user_meta_data->>'bank_account_number'),
    bank_branch_name = COALESCE(v.bank_branch_name, u.raw_user_meta_data->>'bank_branch_name'),
    mobile_money_provider = COALESCE(v.mobile_money_provider, u.raw_user_meta_data->>'mobile_money_provider'),
    mobile_money_number = COALESCE(v.mobile_money_number, u.raw_user_meta_data->>'mobile_money_number'),
    mobile_money_name = COALESCE(v.mobile_money_name, u.raw_user_meta_data->>'mobile_money_name')
FROM auth.users u
WHERE v.id = u.id;
