-- Supabase Vendor Table Queries

-- =======================
-- READ Operations
-- =======================

-- Get a specific vendor by their ID (which is the auth.uid())
SELECT
    id,
    display_name,
    email,
    avatar_url,
    created_at,
    updated_at
FROM
    public.vendors
WHERE
    id = 'your_vendor_id'; -- Replace 'your_vendor_id' with the actual UUID of the vendor


-- Get all vendors (less common for a vendor dashboard, but useful for admin purposes)
SELECT
    id,
    display_name,
    email,
    avatar_url,
    created_at,
    updated_at
FROM
    public.vendors;

-- =======================
-- UPDATE Operations
-- =======================

-- Update a vendor's details
-- Note: The updated_at field should be automatically updated by the trigger `handle_updated_at`.
-- If you want to explicitly set it, you can include `updated_at = now()`.
UPDATE
    public.vendors
SET
    display_name = 'New Display Name',
    avatar_url = 'https://example.com/new_avatar.png',
    email = 'new.email@example.com' -- Ensure this email is unique if changed
WHERE
    id = 'your_vendor_id'; -- Replace 'your_vendor_id' with the actual UUID of the vendor


-- =======================
-- CREATE Operations
-- =======================
-- Vendor creation is handled by the `handle_new_user` trigger function in `supabase_schema.sql`.
-- This function inserts into `public.vendors` after a new user signs up in `auth.users`.
-- Data like `display_name` and `email` for the `vendors` table are sourced from `NEW.raw_user_meta_data`
-- which you provide during the `supabase.auth.signUp()` call in `authService.ts`.
--
-- Example of data passed during signUp in authService.ts:
-- options: {
--   data: {
--     display_name: displayName,
--     email: email, // This is used by the trigger for the vendors.email column
--   }
-- }
--
-- Therefore, direct `INSERT INTO public.vendors` queries are typically not run from the application.


-- =======================
-- DELETE Operations
-- =======================
-- Vendor deletion should primarily be managed through Supabase Auth.
-- Deleting a user from `auth.users` will cascade and delete the corresponding
-- record in `public.vendors` due to the `ON DELETE CASCADE` constraint
-- on the `vendors.id` foreign key.
--
-- Example (performed via Supabase client library or dashboard, not direct SQL usually for security):
-- Supabase client: await supabase.auth.admin.deleteUser('user_id_to_delete')
--
-- If you absolutely needed to delete only the vendors record (leaving the auth.users record),
-- which is generally NOT recommended as it would break data integrity:
-- DELETE FROM public.vendors WHERE id = 'your_vendor_id'; -- Use with extreme caution.

