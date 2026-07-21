-- Create a function for safely adding members to accounts
-- This function bypasses RLS policies using SECURITY DEFINER

CREATE OR REPLACE FUNCTION public.add_account_member(
  p_account_id uuid,
  p_user_id uuid,
  p_role text DEFAULT 'member'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Insert the account user
  INSERT INTO public.account_users (
    account_id,
    user_id,
    role,
    joined_at,
    is_active
  ) VALUES (
    p_account_id,
    p_user_id,
    p_role,
    now(),
    true
  )
  ON CONFLICT (account_id, user_id) 
  DO UPDATE SET 
    role = p_role,
    is_active = true
  RETURNING to_jsonb(*) INTO result;

  RETURN result;
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
GRANT EXECUTE ON FUNCTION public.add_account_member(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_account_member(uuid, uuid, text) TO service_role;