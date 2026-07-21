-- =====================================================
-- ENTERPRISE ACCOUNT & PROFILE ENHANCEMENTS
-- Migration: 20250829000000_enterprise_account_enhancements.sql
-- =====================================================

-- Add enhanced settings to accounts table
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS enhanced_settings jsonb DEFAULT '{
  "timezone": "UTC",
  "default_language": "en",
  "date_format": "MM/DD/YYYY",
  "features_enabled": [],
  "api_access_enabled": false,
  "white_label_enabled": false,
  "sso_enabled": false,
  "session_timeout_minutes": 480,
  "allowed_integrations": ["google_search_console", "google_analytics"],
  "webhook_endpoints": [],
  "brand_colors": {
    "primary": "#3B82F6",
    "secondary": "#64748B", 
    "accent": "#06B6D4"
  },
  "usage_limits": {
    "max_brands": 5,
    "max_sites_per_brand": 10,
    "max_team_members": 10,
    "monthly_audit_limit": 100
  },
  "data_retention": {
    "audit_data_months": 12,
    "usage_logs_months": 6,
    "security_events_months": 24
  },
  "integrations": {
    "slack_workspace": "",
    "webhook_secret": "",
    "api_rate_limits": {
      "requests_per_hour": 1000,
      "requests_per_day": 10000
    }
  }
}';

-- Add billing contact information
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS billing_contact jsonb DEFAULT '{
  "name": "",
  "email": "",
  "company": "",
  "tax_id": "",
  "address": {
    "line1": "",
    "line2": "",
    "city": "",
    "state": "",
    "postal_code": "",
    "country": ""
  }
}';

-- Add Stripe customer ID for billing
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS default_payment_method text;

-- Add usage tracking fields
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS current_usage jsonb DEFAULT '{
  "brands": 0,
  "sites": 0,
  "team_members": 0,
  "audits_this_month": 0
}';

-- Enhance profiles table with enterprise features
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS enhanced_preferences jsonb DEFAULT '{
  "theme": "light",
  "dashboard_layout": "standard",
  "default_view": "dashboard",
  "notification_preferences": {
    "email_enabled": true,
    "push_enabled": true,
    "sms_enabled": false,
    "digest_frequency": "daily",
    "job_completion": true,
    "audit_results": true,
    "optimization_ready": true,
    "system_maintenance": false,
    "quiet_hours_start": null,
    "quiet_hours_end": null,
    "quiet_days": []
  }
}';

-- Add user statistics tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS usage_statistics jsonb DEFAULT '{
  "total_audits_run": 0,
  "total_optimizations_created": 0,
  "favorite_features": [],
  "last_login_ip": "",
  "login_count": 0
}';

-- Create account audit log table for compliance
CREATE TABLE IF NOT EXISTS public.account_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource_type text NOT NULL CHECK (resource_type IN ('account', 'member', 'brand', 'billing', 'settings', 'integration')),
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create enhanced notifications table for account-level notifications
CREATE TABLE IF NOT EXISTS public.account_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('billing', 'security', 'team', 'system', 'compliance')),
  title text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  
  -- Targeting
  target_roles text[] DEFAULT '{}',
  target_users uuid[] DEFAULT '{}',
  
  -- Actions
  action_required boolean DEFAULT false,
  action_url text,
  expires_at timestamp with time zone,
  
  -- Tracking
  created_by uuid REFERENCES auth.users(id),
  read_by uuid[] DEFAULT '{}',
  dismissed_by uuid[] DEFAULT '{}',
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user notifications table (separate from account notifications)
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  
  type text NOT NULL CHECK (type IN ('job', 'audit', 'optimization', 'mention', 'personal')),
  title text NOT NULL,
  message text NOT NULL,
  
  -- Personal context
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  
  -- Actions
  action_url text,
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create billing events table for detailed billing tracking
CREATE TABLE IF NOT EXISTS public.enhanced_billing_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'subscription_created', 'subscription_updated', 'subscription_cancelled',
    'payment_succeeded', 'payment_failed', 'payment_refunded',
    'invoice_created', 'invoice_paid', 'invoice_failed',
    'trial_started', 'trial_extended', 'trial_ended',
    'plan_upgraded', 'plan_downgraded'
  )),
  
  -- Stripe integration
  stripe_event_id text UNIQUE,
  stripe_invoice_id text,
  stripe_subscription_id text,
  
  -- Financial data
  amount_cents integer,
  currency text DEFAULT 'usd',
  plan_id text,
  
  -- Event details
  event_data jsonb DEFAULT '{}',
  processed_at timestamp with time zone DEFAULT now(),
  
  -- Metadata
  created_by uuid REFERENCES auth.users(id),
  notes text,
  
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create API access tokens table for enterprise API access
CREATE TABLE IF NOT EXISTS public.account_api_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  token_prefix text NOT NULL,
  
  -- Permissions
  permissions text[] DEFAULT '{}',
  scopes text[] DEFAULT '{}',
  
  -- Usage limits
  rate_limit_per_hour integer DEFAULT 1000,
  rate_limit_per_day integer DEFAULT 10000,
  
  -- Usage tracking
  usage_count integer DEFAULT 0,
  last_used_at timestamp with time zone,
  last_used_ip inet,
  
  -- Lifecycle
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  
  -- Audit
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create security events table for audit and compliance
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  event_type text NOT NULL CHECK (event_type IN (
    'login_success', 'login_failure', 'logout',
    'password_change', 'email_change', 'profile_update',
    'api_key_created', 'api_key_deleted', 'api_key_used',
    'suspicious_activity', 'account_locked', 'account_unlocked',
    'permission_granted', 'permission_revoked'
  )),
  
  -- Context
  ip_address inet,
  user_agent text,
  location jsonb, -- Geolocation data
  
  -- Details
  details jsonb DEFAULT '{}',
  risk_score integer CHECK (risk_score BETWEEN 0 AND 100),
  
  -- Actions taken
  action_taken text,
  resolved_at timestamp with time zone,
  resolved_by uuid REFERENCES auth.users(id),
  
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_account_audit_log_account_id ON public.account_audit_log(account_id);
CREATE INDEX IF NOT EXISTS idx_account_audit_log_created_at ON public.account_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_account_audit_log_user_id ON public.account_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_account_audit_log_action ON public.account_audit_log(action);

CREATE INDEX IF NOT EXISTS idx_account_notifications_account_id ON public.account_notifications(account_id);
CREATE INDEX IF NOT EXISTS idx_account_notifications_type ON public.account_notifications(type);
CREATE INDEX IF NOT EXISTS idx_account_notifications_severity ON public.account_notifications(severity);
CREATE INDEX IF NOT EXISTS idx_account_notifications_created_at ON public.account_notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_account_id ON public.user_notifications(account_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON public.user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON public.user_notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_enhanced_billing_events_account_id ON public.enhanced_billing_events(account_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_billing_events_type ON public.enhanced_billing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_enhanced_billing_events_stripe_event ON public.enhanced_billing_events(stripe_event_id);

CREATE INDEX IF NOT EXISTS idx_account_api_tokens_account_id ON public.account_api_tokens(account_id);
CREATE INDEX IF NOT EXISTS idx_account_api_tokens_token_hash ON public.account_api_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_account_api_tokens_active ON public.account_api_tokens(is_active);

CREATE INDEX IF NOT EXISTS idx_security_events_account_id ON public.security_events(account_id);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at);

-- Enable RLS on new tables
ALTER TABLE public.account_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for new tables

-- Account audit log policies
CREATE POLICY "Users can view audit logs for their accounts" ON public.account_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.account_users 
      WHERE account_users.account_id = account_audit_log.account_id 
      AND account_users.user_id = auth.uid()
      AND account_users.role IN ('owner', 'admin')
    )
  );

-- Account notifications policies  
CREATE POLICY "Users can view account notifications" ON public.account_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.account_users 
      WHERE account_users.account_id = account_notifications.account_id 
      AND account_users.user_id = auth.uid()
      AND account_users.is_active = true
      AND (
        account_users.role = ANY(account_notifications.target_roles) OR
        auth.uid() = ANY(account_notifications.target_users)
      )
    )
  );

CREATE POLICY "Users can update account notifications they can see" ON public.account_notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.account_users 
      WHERE account_users.account_id = account_notifications.account_id 
      AND account_users.user_id = auth.uid()
      AND account_users.is_active = true
      AND (
        account_users.role = ANY(account_notifications.target_roles) OR
        auth.uid() = ANY(account_notifications.target_users)
      )
    )
  );

-- User notifications policies
CREATE POLICY "Users can view their own notifications" ON public.user_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.user_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Billing events policies
CREATE POLICY "Account owners and admins can view billing events" ON public.enhanced_billing_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.account_users 
      WHERE account_users.account_id = enhanced_billing_events.account_id 
      AND account_users.user_id = auth.uid()
      AND account_users.role IN ('owner', 'admin')
    )
  );

-- API tokens policies
CREATE POLICY "Account owners and admins can manage API tokens" ON public.account_api_tokens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.account_users 
      WHERE account_users.account_id = account_api_tokens.account_id 
      AND account_users.user_id = auth.uid()
      AND account_users.role IN ('owner', 'admin')
    )
  );

-- Security events policies
CREATE POLICY "Account owners and admins can view security events" ON public.security_events
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.account_users 
      WHERE account_users.account_id = security_events.account_id 
      AND account_users.user_id = auth.uid()
      AND account_users.role IN ('owner', 'admin')
    )
  );

-- Add triggers for updated_at columns
CREATE TRIGGER update_account_notifications_updated_at 
  BEFORE UPDATE ON public.account_notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_account_api_tokens_updated_at 
  BEFORE UPDATE ON public.account_api_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create functions for common operations

-- Function to log account actions for audit trail
CREATE OR REPLACE FUNCTION public.log_account_action(
  p_account_id uuid,
  p_user_id uuid,
  p_action text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO public.account_audit_log (
    account_id,
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    p_account_id,
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    inet_client_addr(),
    current_setting('application_name', true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create account notification
CREATE OR REPLACE FUNCTION public.create_account_notification(
  p_account_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_severity text DEFAULT 'info',
  p_target_roles text[] DEFAULT '{}',
  p_target_users uuid[] DEFAULT '{}',
  p_action_required boolean DEFAULT false,
  p_action_url text DEFAULT NULL,
  p_created_by uuid DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.account_notifications (
    account_id,
    type,
    title,
    message,
    severity,
    target_roles,
    target_users,
    action_required,
    action_url,
    created_by
  ) VALUES (
    p_account_id,
    p_type,
    p_title,
    p_message,
    p_severity,
    p_target_roles,
    p_target_users,
    p_action_required,
    p_action_url,
    p_created_by
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user notification
CREATE OR REPLACE FUNCTION public.create_user_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_account_id uuid DEFAULT NULL,
  p_brand_id uuid DEFAULT NULL,
  p_action_url text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
) RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.user_notifications (
    user_id,
    account_id,
    brand_id,
    type,
    title,
    message,
    action_url,
    metadata
  ) VALUES (
    p_user_id,
    p_account_id,
    p_brand_id,
    p_type,
    p_title,
    p_message,
    p_action_url,
    p_metadata
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update account usage statistics
CREATE OR REPLACE FUNCTION public.update_account_usage(
  p_account_id uuid,
  p_usage_type text,
  p_increment integer DEFAULT 1
) RETURNS void AS $$
DECLARE
  current_stats jsonb;
  updated_stats jsonb;
BEGIN
  -- Get current usage stats
  SELECT current_usage INTO current_stats
  FROM public.accounts
  WHERE id = p_account_id;
  
  -- Update the specific usage counter
  updated_stats := jsonb_set(
    current_stats,
    ARRAY[p_usage_type],
    to_jsonb((current_stats->>p_usage_type)::integer + p_increment)
  );
  
  -- Save updated stats
  UPDATE public.accounts
  SET current_usage = updated_stats,
      updated_at = now()
  WHERE id = p_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if account has reached usage limits
CREATE OR REPLACE FUNCTION public.check_account_usage_limit(
  p_account_id uuid,
  p_usage_type text
) RETURNS boolean AS $$
DECLARE
  current_usage integer;
  usage_limit integer;
  settings jsonb;
BEGIN
  -- Get current usage and limits
  SELECT 
    (current_usage->>p_usage_type)::integer,
    enhanced_settings
  INTO current_usage, settings
  FROM public.accounts
  WHERE id = p_account_id;
  
  -- Get the limit for this usage type
  usage_limit := (settings->'usage_limits'->p_usage_type)::integer;
  
  -- Return true if usage is within limits
  RETURN current_usage < usage_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.log_account_action TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_account_notification TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_notification TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_account_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_account_usage_limit TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.account_audit_log IS 'Audit trail for account-level changes and actions';
COMMENT ON TABLE public.account_notifications IS 'Account-level notifications for billing, security, and system events';
COMMENT ON TABLE public.user_notifications IS 'Personal notifications for individual users';
COMMENT ON TABLE public.enhanced_billing_events IS 'Detailed billing and subscription event tracking';
COMMENT ON TABLE public.account_api_tokens IS 'API access tokens for enterprise integrations';
COMMENT ON TABLE public.security_events IS 'Security event logging for compliance and monitoring';

COMMENT ON FUNCTION public.log_account_action IS 'Log account actions for audit compliance';
COMMENT ON FUNCTION public.create_account_notification IS 'Create account-level notifications';
COMMENT ON FUNCTION public.create_user_notification IS 'Create user-level notifications';
COMMENT ON FUNCTION public.update_account_usage IS 'Update account usage statistics';
COMMENT ON FUNCTION public.check_account_usage_limit IS 'Check if account usage is within limits';