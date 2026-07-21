-- Migration: Update account-related RPC functions to use clerk_id instead of UUID user_id
-- This aligns the database functions with the Clerk authentication migration

-- ============================================
-- 1. Update create_account_with_owner function
-- ============================================
DROP FUNCTION IF EXISTS public.create_account_with_owner(text, text, text, uuid, text, text);

CREATE OR REPLACE FUNCTION public.create_account_with_owner(
  p_name text,
  p_slug text,
  p_account_type text,
  p_owner_id text,  -- Changed from UUID to TEXT for Clerk user ID
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
  -- Create the account with owner_clerk_id
  INSERT INTO public.accounts (
    name,
    slug,
    account_type,
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
    p_owner_id,  -- Store in owner_clerk_id column
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
    -- If there's an error, return an error object
    RETURN jsonb_build_object(
      'error', true,
      'message', SQLERRM,
      'code', SQLSTATE
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_account_with_owner(text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_account_with_owner(text, text, text, text, text, text) TO service_role;

-- ============================================
-- 2. Update add_account_member function
-- ============================================
DROP FUNCTION IF EXISTS public.add_account_member(uuid, uuid, text, uuid);

CREATE OR REPLACE FUNCTION public.add_account_member(
  p_account_id uuid,
  p_clerk_id text,  -- Changed from UUID to TEXT for Clerk user ID
  p_role text DEFAULT 'member',
  p_invited_by text DEFAULT NULL  -- Changed from UUID to TEXT for Clerk user ID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_record jsonb;
BEGIN
  -- Insert the account member
  INSERT INTO public.account_users (
    account_id,
    clerk_id,
    role,
    joined_at,
    is_active
  ) VALUES (
    p_account_id,
    p_clerk_id,
    p_role,
    now(),
    true
  )
  ON CONFLICT (account_id, clerk_id) DO UPDATE 
  SET role = EXCLUDED.role, is_active = true;

  -- Return the member record
  SELECT jsonb_build_object(
    'id', au.id,
    'account_id', au.account_id,
    'clerk_id', au.clerk_id,
    'role', au.role,
    'is_active', au.is_active,
    'joined_at', au.joined_at
  ) INTO member_record
  FROM public.account_users au
  WHERE au.account_id = p_account_id AND au.clerk_id = p_clerk_id;

  RETURN member_record;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', true,
      'message', SQLERRM,
      'code', SQLSTATE
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.add_account_member(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_account_member(uuid, text, text, text) TO service_role;

-- ============================================
-- 3. Update create_external_brand_report function  
-- ============================================
DROP FUNCTION IF EXISTS public.create_external_brand_report(uuid, jsonb, text, timestamp with time zone, uuid);

CREATE OR REPLACE FUNCTION public.create_external_brand_report(
  p_source_report_id uuid,
  p_report_data jsonb,
  p_brand_name text,
  p_expires_at timestamp with time zone DEFAULT NULL,
  p_clerk_id text DEFAULT NULL  -- Changed from UUID to TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_access_token text;
  v_report_id uuid;
  v_result jsonb;
BEGIN
  -- Generate unique access token
  v_access_token := encode(gen_random_bytes(32), 'hex');
  
  -- Create the external report
  INSERT INTO public.external_brand_reports (
    source_report_id,
    report_data,
    brand_name,
    access_token,
    expires_at,
    clerk_id,
    created_at
  ) VALUES (
    p_source_report_id,
    p_report_data,
    p_brand_name,
    v_access_token,
    COALESCE(p_expires_at, now() + interval '30 days'),
    p_clerk_id,
    now()
  )
  RETURNING id INTO v_report_id;

  -- Return the result
  v_result := jsonb_build_object(
    'id', v_report_id,
    'access_token', v_access_token,
    'expires_at', COALESCE(p_expires_at, now() + interval '30 days'),
    'public_url', '/reports/public/' || v_access_token
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', true,
      'message', SQLERRM,
      'code', SQLSTATE
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_external_brand_report(uuid, jsonb, text, timestamp with time zone, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_external_brand_report(uuid, jsonb, text, timestamp with time zone, text) TO service_role;

-- ============================================
-- 4. Add unique constraint for clerk_id in account_users if not exists
-- ============================================
DO $$
BEGIN
  -- Check if the constraint exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'account_users_account_id_clerk_id_key'
  ) THEN
    -- Create unique constraint for account_id + clerk_id
    ALTER TABLE public.account_users 
    ADD CONSTRAINT account_users_account_id_clerk_id_key 
    UNIQUE (account_id, clerk_id);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create unique constraint: %', SQLERRM;
END;
$$;

-- ============================================
-- 5. Add comments for documentation
-- ============================================
COMMENT ON FUNCTION public.create_account_with_owner(text, text, text, text, text, text) IS 
'Create a new account with owner. Uses Clerk user ID (text) instead of Supabase UUID.';

COMMENT ON FUNCTION public.add_account_member(uuid, text, text, text) IS 
'Add a member to an account. Uses Clerk user ID (text) instead of Supabase UUID.';

COMMENT ON FUNCTION public.create_external_brand_report(uuid, jsonb, text, timestamp with time zone, text) IS 
'Create an external shareable brand report. Uses Clerk user ID (text) for owner reference.';
