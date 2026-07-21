-- Migration: Make owner_id nullable in accounts table for Clerk migration
-- This allows accounts to be created with only owner_clerk_id

-- 1. Drop dependent views and policies that reference owner_id
DROP POLICY IF EXISTS "Users can create accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update accounts they own" ON public.accounts;
DROP POLICY IF EXISTS "Users can view accounts they own or belong to" ON public.accounts;

-- 2. Make owner_id nullable
ALTER TABLE public.accounts
ALTER COLUMN owner_id DROP NOT NULL;

-- 3. Recreate RLS policies with support for both owner_id (legacy) and owner_clerk_id (Clerk)
CREATE POLICY "Users can view accounts they own or belong to" ON public.accounts FOR SELECT
USING (
  ((auth.jwt() ->> 'sub') = owner_clerk_id)
  OR (EXISTS (
    SELECT 1 FROM account_users
    WHERE (account_users.account_id = accounts.id 
      AND account_users.clerk_id = (auth.jwt() ->> 'sub')
      AND account_users.is_active = true)
  ))
);

CREATE POLICY "service_role_full_access" ON public.accounts
USING (current_setting('role'::text) = 'service_role'::text);

-- 4. Update the create_account_with_owner function to handle NULL owner_id
DROP FUNCTION IF EXISTS public.create_account_with_owner(text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.create_account_with_owner(
  p_name text,
  p_slug text,
  p_account_type text,
  p_owner_id text,  -- Clerk user ID
  p_industry text DEFAULT NULL,
  p_company_size text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_account_id uuid;
  account_record jsonb;
BEGIN
  -- Create the account with owner_clerk_id, owner_id is NULL for Clerk users
  INSERT INTO public.accounts (
    name,
    slug,
    account_type,
    owner_id,  -- Set to NULL since we're using Clerk
    owner_clerk_id,
    industry,
    company_size,
    billing_plan,
    billing_status,
    trial_ends_at
  ) VALUES (
    p_name,
    p_slug,
    p_account_type,
    NULL,  -- owner_id is NULL for Clerk users
    p_owner_id,  -- Store Clerk ID in owner_clerk_id
    p_industry,
    p_company_size,
    'free',
    'trialing',
    now() + interval '14 days'
  )
  RETURNING id INTO new_account_id;

  -- Add the owner to account_users with clerk_id
  INSERT INTO public.account_users (
    account_id,
    clerk_id,
    role,
    joined_at,
    is_active
  ) VALUES (
    new_account_id,
    p_owner_id,
    'owner',
    now(),
    true
  )
  ON CONFLICT (account_id, clerk_id) DO NOTHING;

  -- Return the account data
  SELECT jsonb_build_object(
    'id', a.id,
    'name', a.name,
    'slug', a.slug,
    'account_type', a.account_type,
    'owner_clerk_id', a.owner_clerk_id,
    'billing_plan', a.billing_plan,
    'billing_status', a.billing_status,
    'trial_ends_at', a.trial_ends_at
  ) INTO account_record
  FROM public.accounts a
  WHERE a.id = new_account_id;

  RETURN account_record;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', true,
      'message', SQLERRM,
      'code', SQLSTATE
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_account_with_owner(text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_account_with_owner(text, text, text, text, text, text) TO service_role;

COMMENT ON FUNCTION public.create_account_with_owner(text, text, text, text, text, text) IS 
'Create a new account with Clerk owner. Sets owner_id to NULL and uses owner_clerk_id for identification.';
