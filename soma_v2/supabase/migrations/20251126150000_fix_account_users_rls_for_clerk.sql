-- Migration: Update RLS policies for account_users to support Clerk authentication

-- 1. Drop existing select policy if it exists
DROP POLICY IF EXISTS "Allow authenticated users to read their own account memberships" ON public.account_users;
DROP POLICY IF EXISTS "Allow users to read their own account memberships" ON public.account_users;
DROP POLICY IF EXISTS "Enable read access for authenticated users to their own memberships" ON public.account_users;


-- 2. Create a new SELECT policy that checks for clerk_id
CREATE POLICY "Allow users to read their own account memberships"
ON public.account_users
FOR SELECT
TO authenticated
USING (
  -- The user's clerk_id from the JWT must match the clerk_id in the row
  (auth.jwt() ->> 'sub') = clerk_id
);

-- 3. Ensure RLS is enabled on the table
ALTER TABLE public.account_users ENABLE ROW LEVEL SECURITY;

-- 4. Grant usage on schema to authenticated role (should already be there but good to ensure)
GRANT USAGE ON SCHEMA public TO authenticated;

-- 5. Grant select on the table to the authenticated role
GRANT SELECT ON TABLE public.account_users TO authenticated;
GRANT SELECT ON TABLE public.accounts TO authenticated; -- Also need to be able to read the related account

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
