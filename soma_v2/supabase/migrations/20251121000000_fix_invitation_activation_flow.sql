-- Fix invitation acceptance to properly track acceptance vs activation
-- Invitation flow:
-- 1. pending -> accepted (when user creates account)
-- 2. accepted -> user made active in account_users (when they first login)

-- Drop the existing function
DROP FUNCTION IF EXISTS public.accept_team_invitation(text, uuid);

-- Recreate with proper acceptance tracking
CREATE OR REPLACE FUNCTION public.accept_team_invitation(
  invitation_token text,
  accepting_user_uuid uuid,
  mark_active boolean DEFAULT false
)
RETURNS jsonb AS $$
DECLARE
  invitation RECORD;
  existing_user RECORD;
  result jsonb;
BEGIN
  -- Get the invitation
  SELECT * INTO invitation
  FROM public.team_invitations
  WHERE invite_token = invitation_token
  AND status = 'pending'
  AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired invitation'
    );
  END IF;

  -- Check if user is already a member
  SELECT * INTO existing_user
  FROM public.account_users
  WHERE account_id = invitation.account_id
  AND user_id = accepting_user_uuid;

  IF FOUND AND existing_user.is_active THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User is already a member of this account'
    );
  END IF;

  -- Ensure user profile exists with onboarding marked as completed
  -- Invited users inherit from the organization they're joining
  INSERT INTO public.profiles (
    user_id,
    email,
    full_name,
    onboarding_status,
    onboarding_completed_at,
    onboarding_step,
    created_at,
    updated_at
  )
  SELECT
    accepting_user_uuid,
    (SELECT email FROM auth.users WHERE id = accepting_user_uuid),
    (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = accepting_user_uuid),
    'completed',
    now(),
    6,
    now(),
    now()
  ON CONFLICT (user_id) 
  DO UPDATE SET
    onboarding_status = 'completed',
    onboarding_completed_at = COALESCE(profiles.onboarding_completed_at, now()),
    onboarding_step = 6,
    updated_at = now();

  -- Add user to account
  -- Initially set is_active based on mark_active parameter
  -- During signup: is_active = false (just accepted, not logged in yet)
  -- During first login: is_active = true (activated)
  IF existing_user.user_id IS NULL THEN
    INSERT INTO public.account_users (
      account_id,
      user_id,
      role,
      invited_by,
      invited_at,
      joined_at,
      is_active
    ) VALUES (
      invitation.account_id,
      accepting_user_uuid,
      invitation.role,
      invitation.invited_by,
      invitation.created_at,
      CASE WHEN mark_active THEN now() ELSE NULL END,
      mark_active
    );
  ELSE
    UPDATE public.account_users
    SET 
      role = invitation.role,
      is_active = mark_active,
      joined_at = CASE WHEN mark_active THEN now() ELSE joined_at END
    WHERE account_id = invitation.account_id
    AND user_id = accepting_user_uuid;
  END IF;

  -- Add to specified workspaces
  IF array_length(invitation.workspace_ids, 1) > 0 THEN
    INSERT INTO public.workspace_users (workspace_id, user_id, role, invited_by, invited_at, joined_at, is_active)
    SELECT 
      ws_id,
      accepting_user_uuid,
      CASE 
        WHEN invitation.role IN ('owner', 'admin') THEN 'admin'
        WHEN invitation.role = 'account_manager' THEN 'editor'
        ELSE 'viewer'
      END,
      invitation.invited_by,
      invitation.created_at,
      CASE WHEN mark_active THEN now() ELSE NULL END,
      mark_active
    FROM unnest(invitation.workspace_ids) AS ws_id
    ON CONFLICT (workspace_id, user_id) 
    DO UPDATE SET 
      role = EXCLUDED.role,
      is_active = mark_active,
      joined_at = CASE WHEN mark_active THEN now() ELSE workspace_users.joined_at END;
  END IF;

  -- Add to specified brands as manager
  IF array_length(invitation.brand_ids, 1) > 0 THEN
    INSERT INTO public.brand_managers (brand_id, user_id, role, assigned_by, assigned_at, is_active)
    SELECT 
      brand_id,
      accepting_user_uuid,
      CASE 
        WHEN invitation.role IN ('owner', 'admin') THEN 'primary_manager'
        ELSE 'manager'
      END,
      invitation.invited_by,
      now(),
      mark_active
    FROM unnest(invitation.brand_ids) AS brand_id
    ON CONFLICT (brand_id, user_id) 
    DO UPDATE SET 
      role = EXCLUDED.role,
      is_active = mark_active,
      assigned_at = now();
  END IF;

  -- Mark invitation as accepted
  UPDATE public.team_invitations
  SET 
    status = 'accepted',
    accepted_at = now(),
    accepted_by = accepting_user_uuid,
    updated_at = now()
  WHERE id = invitation.id;

  -- Log the activity
  PERFORM public.log_team_activity(
    invitation.account_id,
    accepting_user_uuid,
    CASE WHEN mark_active THEN 'joined' ELSE 'accepted_invitation' END,
    accepting_user_uuid,
    invitation.email,
    'account',
    invitation.account_id,
    jsonb_build_object('invitation_id', invitation.id, 'mark_active', mark_active),
    jsonb_build_object('role', invitation.role, 'accepted_at', now())
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', CASE WHEN mark_active THEN 'Successfully joined the team' ELSE 'Invitation accepted - please log in to activate' END,
    'account_id', invitation.account_id,
    'role', invitation.role,
    'is_active', mark_active
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.accept_team_invitation TO authenticated;

-- Create function to activate user (called on first login after accepting invitation)
CREATE OR REPLACE FUNCTION public.activate_invited_user(
  user_uuid uuid,
  account_uuid uuid
)
RETURNS jsonb AS $$
DECLARE
  updated_rows INTEGER;
BEGIN
  -- Ensure user profile exists with onboarding marked as completed
  INSERT INTO public.profiles (
    user_id,
    email,
    full_name,
    onboarding_status,
    onboarding_completed_at,
    onboarding_step,
    created_at,
    updated_at
  )
  SELECT
    user_uuid,
    (SELECT email FROM auth.users WHERE id = user_uuid),
    (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = user_uuid),
    'completed',
    now(),
    6,
    now(),
    now()
  ON CONFLICT (user_id) 
  DO UPDATE SET
    onboarding_status = 'completed',
    onboarding_completed_at = COALESCE(profiles.onboarding_completed_at, now()),
    onboarding_step = 6,
    updated_at = now();

  -- Update account_users to mark as active
  UPDATE public.account_users
  SET 
    is_active = true,
    joined_at = COALESCE(joined_at, now()),
    last_activity_at = now()
  WHERE user_id = user_uuid
  AND account_id = account_uuid
  AND is_active = false;
  
  GET DIAGNOSTICS updated_rows = ROW_COUNT;

  IF updated_rows = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found or already active'
    );
  END IF;

  -- Log the activation
  PERFORM public.log_team_activity(
    account_uuid,
    user_uuid,
    'activated',
    user_uuid,
    (SELECT email FROM auth.users WHERE id = user_uuid),
    'account',
    account_uuid,
    jsonb_build_object('activation_time', now()),
    jsonb_build_object('status', 'active')
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'User activated successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.activate_invited_user TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.accept_team_invitation IS 'Accept team invitation and optionally mark user as active (for OAuth/magic link) or inactive (for email/password signup requiring first login)';
COMMENT ON FUNCTION public.activate_invited_user IS 'Activate an invited user when they first log in after accepting invitation';
