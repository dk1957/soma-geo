-- Migration: Update handle_new_account trigger to support Clerk users
-- The trigger should not add account_users here since the RPC function already does it

DROP TRIGGER IF EXISTS on_account_created ON public.accounts;
DROP FUNCTION IF EXISTS public.handle_new_account();

CREATE OR REPLACE FUNCTION public.handle_new_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Note: For Clerk users, the RPC function create_account_with_owner already handles
  -- adding the account_users record. For legacy Supabase users with owner_id UUID,
  -- we still add them here as a fallback.
  
  IF NEW.owner_id IS NOT NULL THEN
    -- Legacy Supabase user with owner_id UUID
    INSERT INTO public.account_users (account_id, user_id, role, joined_at, is_active)
    VALUES (NEW.id, NEW.owner_id, 'owner', now(), true)
    ON CONFLICT (account_id, user_id) DO NOTHING;
  END IF;
  
  -- For Clerk users (owner_id is NULL, owner_clerk_id is set),
  -- the account_users record is already created by create_account_with_owner RPC
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_account_created
AFTER INSERT ON public.accounts
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_account();

COMMENT ON FUNCTION public.handle_new_account() IS
'Trigger function to handle account creation. For Clerk users, account_users is already created by the RPC. For legacy Supabase users with owner_id, this adds the account_users record.';
