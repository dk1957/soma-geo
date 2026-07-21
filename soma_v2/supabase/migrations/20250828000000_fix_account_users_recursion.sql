-- Fix for infinite recursion in account_users policies
-- This migration is designed to specifically resolve the infinite recursion error
-- in the policy for relation "account_users"
-- UPDATED: Now uses clerk_id for Clerk authentication instead of user_id

-- First, drop all existing policies on account_users to ensure clean slate
DROP POLICY IF EXISTS "Users can view account memberships they're part of" ON public.account_users;
DROP POLICY IF EXISTS "Users can view their own account memberships" ON public.account_users;
DROP POLICY IF EXISTS "Account admins can view all memberships in their account" ON public.account_users;
DROP POLICY IF EXISTS "Users can insert account memberships for accounts they own" ON public.account_users;
DROP POLICY IF EXISTS "Users can update their own account membership" ON public.account_users;
DROP POLICY IF EXISTS "Account owners can update any membership in their account" ON public.account_users;
DROP POLICY IF EXISTS "view_own_memberships" ON public.account_users;
DROP POLICY IF EXISTS "owners_view_all_memberships" ON public.account_users;
DROP POLICY IF EXISTS "owners_insert_members" ON public.account_users;
DROP POLICY IF EXISTS "update_own_membership" ON public.account_users;
DROP POLICY IF EXISTS "owners_update_any_membership" ON public.account_users;
DROP POLICY IF EXISTS "owners_delete_members" ON public.account_users;

-- Create completely non-recursive policies using clerk_id
-- 1. Users can always view their own memberships (by clerk_id from JWT)
CREATE POLICY "view_own_memberships" ON public.account_users
  FOR SELECT USING (clerk_id = (auth.jwt() ->> 'sub'));

-- 2. Account owners can view all memberships in their accounts
CREATE POLICY "owners_view_all_memberships" ON public.account_users
  FOR SELECT USING (
    account_id IN (
      SELECT id FROM public.accounts WHERE owner_clerk_id = (auth.jwt() ->> 'sub')
    )
  );

-- 3. Account owners can insert new members
CREATE POLICY "owners_insert_members" ON public.account_users
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT id FROM public.accounts WHERE owner_clerk_id = (auth.jwt() ->> 'sub')
    )
  );

-- 4. Users can update only their own membership status
CREATE POLICY "update_own_membership" ON public.account_users
  FOR UPDATE USING (clerk_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (clerk_id = (auth.jwt() ->> 'sub') AND role != 'owner'); -- Can't change own role to owner

-- 5. Account owners can update any membership in their accounts
CREATE POLICY "owners_update_any_membership" ON public.account_users
  FOR UPDATE USING (
    account_id IN (
      SELECT id FROM public.accounts WHERE owner_clerk_id = (auth.jwt() ->> 'sub')
    )
  );

-- 6. Account owners can delete members
CREATE POLICY "owners_delete_members" ON public.account_users
  FOR DELETE USING (
    account_id IN (
      SELECT id FROM public.accounts WHERE owner_clerk_id = (auth.jwt() ->> 'sub')
    ) AND
    clerk_id != (auth.jwt() ->> 'sub') -- Can't delete yourself
  );

-- Modify the trigger for account creation to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_account()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the account owner as the first account user with owner role
  -- Use SECURITY DEFINER to bypass RLS
  INSERT INTO public.account_users (account_id, user_id, role, joined_at, is_active)
  VALUES (NEW.id, NEW.owner_id, 'owner', now(), true)
  ON CONFLICT (account_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS on_account_created ON public.accounts;

CREATE TRIGGER on_account_created
  AFTER INSERT ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_account();