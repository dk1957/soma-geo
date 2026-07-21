-- Fix brand view policies to avoid infinite recursion
-- This allows invited users to see brands in their organization

-- Drop problematic policies with nested subqueries
DROP POLICY IF EXISTS "Users can view brands in accounts they own or belong to" ON brands;
DROP POLICY IF EXISTS brand_access_via_account_users ON brands;
DROP POLICY IF EXISTS brand_view_simple ON brands;

-- Create a SECURITY DEFINER function to check account access
-- This bypasses RLS when checking account_users, preventing recursion
CREATE OR REPLACE FUNCTION user_has_account_access(p_account_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM account_users 
    WHERE user_id = auth.uid() 
    AND account_id = p_account_id 
    AND is_active = true
  );
$$;

-- Create policy using the function
CREATE POLICY brand_view_with_account_access ON brands
FOR SELECT
TO public
USING (
  current_setting('role'::text) = 'service_role'::text
  OR
  user_has_account_access(account_id)
);

-- Add comment for documentation
COMMENT ON FUNCTION user_has_account_access(uuid) IS 
'Checks if the current user has access to an account. Uses SECURITY DEFINER to bypass RLS and prevent recursion.';

COMMENT ON POLICY brand_view_with_account_access ON brands IS 
'Allows users to view brands in accounts they have access to. Uses SECURITY DEFINER function to avoid RLS recursion.';
