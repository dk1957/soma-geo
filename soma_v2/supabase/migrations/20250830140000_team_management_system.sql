-- =====================================================
-- TEAM MANAGEMENT & INVITATION SYSTEM
-- =====================================================

-- Team invitations table for managing pending invites
CREATE TABLE public.team_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'account_manager', 'member', 'viewer')),
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_token text NOT NULL UNIQUE,
  workspace_ids uuid[] DEFAULT '{}',
  brand_ids uuid[] DEFAULT '{}',
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  expires_at timestamp with time zone NOT NULL,
  accepted_at timestamp with time zone,
  accepted_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(account_id, email, status) DEFERRABLE INITIALLY DEFERRED
);

-- Role permissions definitions
CREATE TABLE public.role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role text NOT NULL,
  resource text NOT NULL, -- e.g., 'accounts', 'brands', 'workspaces', 'team', 'billing'
  action text NOT NULL, -- e.g., 'create', 'read', 'update', 'delete', 'invite', 'manage'
  scope text DEFAULT 'own' CHECK (scope IN ('all', 'own', 'assigned', 'none')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  UNIQUE(role, resource, action)
);

-- User activity log for team management actions
CREATE TABLE public.team_activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_email text,
  action text NOT NULL, -- e.g., 'invited', 'joined', 'role_changed', 'removed', 'permissions_updated'
  resource_type text, -- e.g., 'account', 'brand', 'workspace'
  resource_id uuid,
  old_data jsonb,
  new_data jsonb,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Shareable invite links
CREATE TABLE public.invite_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('admin', 'account_manager', 'member', 'viewer')),
  workspace_ids uuid[] DEFAULT '{}',
  brand_ids uuid[] DEFAULT '{}',
  max_uses integer DEFAULT NULL, -- NULL = unlimited
  current_uses integer DEFAULT 0,
  expires_at timestamp with time zone NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Track invite link usage
CREATE TABLE public.invite_link_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_link_id uuid NOT NULL REFERENCES public.invite_links(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  ip_address inet,
  user_agent text,
  status text NOT NULL CHECK (status IN ('clicked', 'joined', 'failed')),
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add missing columns to existing tables for enhanced team management
ALTER TABLE public.account_users 
ADD COLUMN IF NOT EXISTS invited_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_activity_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{}';

ALTER TABLE public.workspace_users 
ADD COLUMN IF NOT EXISTS invited_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_activity_at timestamp with time zone DEFAULT now();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_team_invitations_account_id ON public.team_invitations(account_id);
CREATE INDEX idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX idx_team_invitations_token ON public.team_invitations(invite_token);
CREATE INDEX idx_team_invitations_status ON public.team_invitations(status);
CREATE INDEX idx_team_invitations_expires_at ON public.team_invitations(expires_at);

CREATE INDEX idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX idx_role_permissions_resource ON public.role_permissions(resource, action);

CREATE INDEX idx_team_activity_log_account_id ON public.team_activity_log(account_id);
CREATE INDEX idx_team_activity_log_actor_user_id ON public.team_activity_log(actor_user_id);
CREATE INDEX idx_team_activity_log_created_at ON public.team_activity_log(created_at);

CREATE INDEX idx_invite_links_account_id ON public.invite_links(account_id);
CREATE INDEX idx_invite_links_token ON public.invite_links(token);
CREATE INDEX idx_invite_links_expires_at ON public.invite_links(expires_at);

CREATE INDEX idx_invite_link_usage_link_id ON public.invite_link_usage(invite_link_id);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_link_usage ENABLE ROW LEVEL SECURITY;

-- Team invitations policies
CREATE POLICY "Users can view invitations for their accounts" ON public.team_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.account_users 
      WHERE account_users.account_id = team_invitations.account_id 
      AND account_users.user_id = auth.uid()
      AND account_users.is_active = true
      AND account_users.role IN ('owner', 'admin', 'account_manager')
    )
  );

CREATE POLICY "Users can create invitations for their accounts" ON public.team_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.account_users 
      WHERE account_users.account_id = team_invitations.account_id 
      AND account_users.user_id = auth.uid()
      AND account_users.is_active = true
      AND account_users.role IN ('owner', 'admin', 'account_manager')
    )
  );

CREATE POLICY "Users can update invitations they created or account admins" ON public.team_invitations
  FOR UPDATE USING (
    invited_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.account_users 
      WHERE account_users.account_id = team_invitations.account_id 
      AND account_users.user_id = auth.uid()
      AND account_users.is_active = true
      AND account_users.role IN ('owner', 'admin')
    )
  );

-- Role permissions policies (read-only for most users)
CREATE POLICY "All authenticated users can view role permissions" ON public.role_permissions
  FOR SELECT TO authenticated USING (true);

-- Team activity log policies
CREATE POLICY "Users can view activity log for their accounts" ON public.team_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.account_users 
      WHERE account_users.account_id = team_activity_log.account_id 
      AND account_users.user_id = auth.uid()
      AND account_users.is_active = true
    )
  );

CREATE POLICY "Users can create activity log entries for their accounts" ON public.team_activity_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.account_users 
      WHERE account_users.account_id = team_activity_log.account_id 
      AND account_users.user_id = auth.uid()
      AND account_users.is_active = true
    )
  );

-- Invite links policies
CREATE POLICY "Users can view invite links for their accounts" ON public.invite_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.account_users 
      WHERE account_users.account_id = invite_links.account_id 
      AND account_users.user_id = auth.uid()
      AND account_users.is_active = true
      AND account_users.role IN ('owner', 'admin', 'account_manager')
    )
  );

CREATE POLICY "Users can create invite links for their accounts" ON public.invite_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.account_users 
      WHERE account_users.account_id = invite_links.account_id 
      AND account_users.user_id = auth.uid()
      AND account_users.is_active = true
      AND account_users.role IN ('owner', 'admin', 'account_manager')
    )
  );

-- =====================================================
-- FUNCTIONS FOR TEAM MANAGEMENT
-- =====================================================

-- Function to check user permissions
CREATE OR REPLACE FUNCTION public.check_user_permission(
  user_uuid uuid,
  account_uuid uuid,
  required_role text,
  resource text DEFAULT NULL,
  action text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  user_role text;
  has_permission boolean := false;
BEGIN
  -- Get user's role in the account
  SELECT role INTO user_role
  FROM public.account_users
  WHERE user_id = user_uuid 
  AND account_id = account_uuid 
  AND is_active = true;

  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  -- Owner and admin have all permissions
  IF user_role IN ('owner', 'admin') THEN
    RETURN true;
  END IF;

  -- Check specific role requirement
  IF required_role IS NOT NULL THEN
    -- Role hierarchy: owner > admin > account_manager > member > viewer
    CASE 
      WHEN required_role = 'viewer' THEN
        has_permission := user_role IN ('owner', 'admin', 'account_manager', 'member', 'viewer');
      WHEN required_role = 'member' THEN
        has_permission := user_role IN ('owner', 'admin', 'account_manager', 'member');
      WHEN required_role = 'account_manager' THEN
        has_permission := user_role IN ('owner', 'admin', 'account_manager');
      WHEN required_role = 'admin' THEN
        has_permission := user_role IN ('owner', 'admin');
      WHEN required_role = 'owner' THEN
        has_permission := user_role = 'owner';
      ELSE
        has_permission := false;
    END CASE;
  END IF;

  -- Check resource-specific permissions if provided
  IF resource IS NOT NULL AND action IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.role_permissions rp
      WHERE rp.role = user_role
      AND rp.resource = check_user_permission.resource
      AND rp.action = check_user_permission.action
      AND rp.scope != 'none'
    ) INTO has_permission;
  END IF;

  RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log team activity
CREATE OR REPLACE FUNCTION public.log_team_activity(
  account_uuid uuid,
  actor_uuid uuid,
  activity_action text,
  target_user_uuid uuid DEFAULT NULL,
  target_email_param text DEFAULT NULL,
  resource_type_param text DEFAULT NULL,
  resource_uuid uuid DEFAULT NULL,
  old_data_param jsonb DEFAULT NULL,
  new_data_param jsonb DEFAULT NULL,
  metadata_param jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  activity_id uuid;
BEGIN
  INSERT INTO public.team_activity_log (
    account_id,
    actor_user_id,
    target_user_id,
    target_email,
    action,
    resource_type,
    resource_id,
    old_data,
    new_data,
    metadata
  ) VALUES (
    account_uuid,
    actor_uuid,
    target_user_uuid,
    target_email_param,
    activity_action,
    resource_type_param,
    resource_uuid,
    old_data_param,
    new_data_param,
    metadata_param
  ) RETURNING id INTO activity_id;

  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept team invitation
CREATE OR REPLACE FUNCTION public.accept_team_invitation(
  invitation_token text,
  accepting_user_uuid uuid
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
      now(),
      true
    );
  ELSE
    UPDATE public.account_users
    SET 
      role = invitation.role,
      is_active = true,
      joined_at = now()
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
      now(),
      true
    FROM unnest(invitation.workspace_ids) AS ws_id
    ON CONFLICT (workspace_id, user_id) 
    DO UPDATE SET 
      role = EXCLUDED.role,
      is_active = true,
      joined_at = now();
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
      true
    FROM unnest(invitation.brand_ids) AS brand_id
    ON CONFLICT (brand_id, user_id) 
    DO UPDATE SET 
      role = EXCLUDED.role,
      is_active = true,
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
    'joined',
    accepting_user_uuid,
    invitation.email,
    'account',
    invitation.account_id,
    jsonb_build_object('invitation_id', invitation.id),
    jsonb_build_object('role', invitation.role, 'joined_at', now())
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Successfully joined the team',
    'account_id', invitation.account_id,
    'role', invitation.role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get team members with details
CREATE OR REPLACE FUNCTION public.get_account_team_members(account_uuid uuid)
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  avatar_url text,
  account_role text,
  permissions jsonb,
  joined_at timestamp with time zone,
  last_activity_at timestamp with time zone,
  invited_by_name text,
  workspaces jsonb,
  brands jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.user_id,
    p.email,
    p.full_name,
    p.avatar_url,
    au.role,
    au.permissions,
    au.joined_at,
    au.last_activity_at,
    inviter.full_name as invited_by_name,
    
    -- Workspaces with roles
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', w.id,
          'name', w.name,
          'role', wu.role,
          'is_active', wu.is_active
        )
      )
      FROM public.workspace_users wu
      JOIN public.workspaces w ON wu.workspace_id = w.id
      WHERE wu.user_id = au.user_id 
      AND w.account_id = account_uuid),
      '[]'::jsonb
    ) as workspaces,
    
    -- Brands with roles
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', b.id,
          'name', b.name,
          'role', bm.role,
          'is_active', bm.is_active
        )
      )
      FROM public.brand_managers bm
      JOIN public.brands b ON bm.brand_id = b.id
      WHERE bm.user_id = au.user_id 
      AND b.account_id = account_uuid),
      '[]'::jsonb
    ) as brands
    
  FROM public.account_users au
  JOIN public.profiles p ON au.user_id = p.user_id
  LEFT JOIN public.profiles inviter ON au.invited_by = inviter.user_id
  WHERE au.account_id = account_uuid
  AND au.is_active = true
  ORDER BY 
    CASE au.role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'account_manager' THEN 3
      WHEN 'member' THEN 4
      WHEN 'viewer' THEN 5
    END,
    au.joined_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired invitations
CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS integer AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.team_invitations
  SET 
    status = 'expired',
    updated_at = now()
  WHERE status = 'pending'
  AND expires_at < now();

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DEFAULT ROLE PERMISSIONS
-- =====================================================

INSERT INTO public.role_permissions (role, resource, action, scope) VALUES
-- Owner permissions (all access)
('owner', 'accounts', 'create', 'all'),
('owner', 'accounts', 'read', 'all'),
('owner', 'accounts', 'update', 'all'),
('owner', 'accounts', 'delete', 'all'),
('owner', 'team', 'invite', 'all'),
('owner', 'team', 'manage', 'all'),
('owner', 'team', 'remove', 'all'),
('owner', 'brands', 'create', 'all'),
('owner', 'brands', 'read', 'all'),
('owner', 'brands', 'update', 'all'),
('owner', 'brands', 'delete', 'all'),
('owner', 'workspaces', 'create', 'all'),
('owner', 'workspaces', 'read', 'all'),
('owner', 'workspaces', 'update', 'all'),
('owner', 'workspaces', 'delete', 'all'),
('owner', 'billing', 'read', 'all'),
('owner', 'billing', 'update', 'all'),

-- Admin permissions (most access except billing and account deletion)
('admin', 'accounts', 'read', 'all'),
('admin', 'accounts', 'update', 'own'),
('admin', 'team', 'invite', 'all'),
('admin', 'team', 'manage', 'all'),
('admin', 'team', 'remove', 'all'),
('admin', 'brands', 'create', 'all'),
('admin', 'brands', 'read', 'all'),
('admin', 'brands', 'update', 'all'),
('admin', 'brands', 'delete', 'all'),
('admin', 'workspaces', 'create', 'all'),
('admin', 'workspaces', 'read', 'all'),
('admin', 'workspaces', 'update', 'all'),
('admin', 'workspaces', 'delete', 'all'),
('admin', 'billing', 'read', 'all'),

-- Account Manager permissions (brand and team management)
('account_manager', 'accounts', 'read', 'own'),
('account_manager', 'team', 'invite', 'all'),
('account_manager', 'team', 'manage', 'assigned'),
('account_manager', 'brands', 'read', 'all'),
('account_manager', 'brands', 'update', 'assigned'),
('account_manager', 'workspaces', 'read', 'all'),
('account_manager', 'workspaces', 'update', 'assigned'),

-- Member permissions (standard user)
('member', 'accounts', 'read', 'own'),
('member', 'brands', 'read', 'assigned'),
('member', 'brands', 'update', 'assigned'),
('member', 'workspaces', 'read', 'assigned'),
('member', 'workspaces', 'update', 'assigned'),

-- Viewer permissions (read-only)
('viewer', 'accounts', 'read', 'own'),
('viewer', 'brands', 'read', 'assigned'),
('viewer', 'workspaces', 'read', 'assigned')

ON CONFLICT (role, resource, action) DO NOTHING;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update team_invitations updated_at
CREATE TRIGGER update_team_invitations_updated_at 
  BEFORE UPDATE ON public.team_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invite_links_updated_at 
  BEFORE UPDATE ON public.invite_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.check_user_permission TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_team_activity TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_team_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_account_team_members TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_invitations TO authenticated;

-- Comments
COMMENT ON TABLE public.team_invitations IS 'Pending team invitations with expiration and token-based acceptance';
COMMENT ON TABLE public.role_permissions IS 'Define what actions each role can perform on different resources';
COMMENT ON TABLE public.team_activity_log IS 'Audit log of all team management activities';
COMMENT ON TABLE public.invite_links IS 'Shareable invite links with usage tracking';
COMMENT ON FUNCTION public.check_user_permission IS 'Check if user has specific permissions in an account';
COMMENT ON FUNCTION public.accept_team_invitation IS 'Process team invitation acceptance and setup user access';