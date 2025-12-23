-- Backfill missing vendors from auth.users
-- This ensures that users created before the trigger existed or where the trigger failed are added to the vendors table.

INSERT INTO public.vendors (id, email, display_name)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'display_name', email)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.vendors)
ON CONFLICT (id) DO NOTHING;
