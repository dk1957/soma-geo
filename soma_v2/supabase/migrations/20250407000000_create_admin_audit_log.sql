-- Admin audit log table for tracking all admin actions
-- This provides accountability and forensic capability

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  admin_email text NOT NULL,
  target_id text,
  target_type text,
  metadata jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for querying by admin
CREATE INDEX idx_admin_audit_log_admin_email ON public.admin_audit_log(admin_email);

-- Index for querying by action type
CREATE INDEX idx_admin_audit_log_action ON public.admin_audit_log(action);

-- Index for querying by target
CREATE INDEX idx_admin_audit_log_target ON public.admin_audit_log(target_id, target_type);

-- Index for time-range queries
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);

-- RLS: only service_role can write, no one reads via client
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- No RLS policies = table is locked down to service_role only
-- This prevents any authenticated user from reading or tampering with audit logs
