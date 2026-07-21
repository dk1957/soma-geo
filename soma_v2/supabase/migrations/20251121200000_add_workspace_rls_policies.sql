-- Add RLS policies for workspaces table to allow invited users access
-- Issue: Workspaces had no RLS policies, blocking all queries by default

-- Enable RLS on workspaces if not already enabled
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (defensive)
DROP POLICY IF EXISTS "Users can view workspaces in their accounts" ON workspaces;
DROP POLICY IF EXISTS "Account members can manage workspaces" ON workspaces;

-- Policy: Users can view workspaces from accounts they belong to
CREATE POLICY "Users can view workspaces in their accounts" ON workspaces
FOR SELECT
USING (
  account_id IN (
    SELECT account_id 
    FROM account_users 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- Policy: Account owners and admins can insert/update/delete workspaces
CREATE POLICY "Account members can manage workspaces" ON workspaces
FOR ALL
USING (
  account_id IN (
    SELECT account_id 
    FROM account_users 
    WHERE user_id = auth.uid() 
    AND is_active = true
    AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  account_id IN (
    SELECT account_id 
    FROM account_users 
    WHERE user_id = auth.uid() 
    AND is_active = true
    AND role IN ('owner', 'admin')
  )
);

-- Update accept_team_invitation to automatically add users to ALL workspaces in account
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

  -- Add to ALL workspaces in the account (not just specified ones)
  -- This ensures invited users have access to all brands
  INSERT INTO public.workspace_users (workspace_id, user_id, role, invited_by, invited_at, joined_at, is_active)
  SELECT 
    w.id,
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
  FROM workspaces w
  WHERE w.account_id = invitation.account_id
  ON CONFLICT (workspace_id, user_id) 
  DO UPDATE SET 
    role = EXCLUDED.role,
    is_active = mark_active,
    joined_at = CASE WHEN mark_active THEN now() ELSE workspace_users.joined_at END;

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

GRANT EXECUTE ON FUNCTION public.accept_team_invitation TO authenticated;

-- Backfill: Add existing invited users to all workspaces in their account
INSERT INTO public.workspace_users (workspace_id, user_id, role, invited_by, invited_at, joined_at, is_active)
SELECT 
  w.id as workspace_id,
  au.user_id,
  CASE 
    WHEN au.role IN ('owner', 'admin') THEN 'admin'
    WHEN au.role = 'account_manager' THEN 'editor'
    ELSE 'viewer'
  END as role,
  au.invited_by,
  au.invited_at,
  au.joined_at,
  au.is_active
FROM account_users au
CROSS JOIN workspaces w
WHERE w.account_id = au.account_id
  AND au.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM workspace_users wu 
    WHERE wu.workspace_id = w.id 
    AND wu.user_id = au.user_id
  )
ON CONFLICT (workspace_id, user_id) DO NOTHING;
