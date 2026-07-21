-- Create a database function to handle account creation with user assignment
-- This bypasses RLS policies by running with elevated privileges

CREATE OR REPLACE FUNCTION public.create_account_with_owner(
  p_name text,
  p_slug text,
  p_account_type text,
  p_owner_id uuid,
  p_industry text DEFAULT NULL,
  p_company_size text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_account_id uuid;
  account_record jsonb;
BEGIN
  -- Create the account
  INSERT INTO public.accounts (
    name,
    slug,
    account_type,
    owner_id,
    industry,
    company_size,
    billing_plan,
    billing_status,
    trial_ends_at
  ) VALUES (
    p_name,
    p_slug,
    p_account_type,
    p_owner_id,
    p_industry,
    p_company_size,
    'free',
    'trialing',
    now() + interval '14 days'
  )
  RETURNING id INTO new_account_id;

  -- Add the owner to account_users (this will be handled by trigger, but adding explicitly for safety)
  INSERT INTO public.account_users (
    account_id,
    user_id,
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
  ON CONFLICT (account_id, user_id) DO NOTHING;

  -- Return the account data
  SELECT to_jsonb(a.*) INTO account_record
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
GRANT EXECUTE ON FUNCTION public.create_account_with_owner(text, text, text, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_account_with_owner(text, text, text, uuid, text, text) TO service_role;