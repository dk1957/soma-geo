-- Fix missing RLS policies for brands and create missing tables
-- Date: 2025-09-06

-- Add missing RLS policies for brands table
CREATE POLICY "brand_update_by_account_members" ON public.brands
  FOR UPDATE USING (
    account_id IN (
      SELECT au.account_id 
      FROM public.account_users au
      WHERE au.user_id = auth.uid() 
      AND au.is_active = true
      AND au.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "brand_delete_by_account_owner" ON public.brands
  FOR DELETE USING (
    account_id IN (
      SELECT au.account_id 
      FROM public.account_users au
      WHERE au.user_id = auth.uid() 
      AND au.is_active = true
      AND au.role = 'owner'
    )
  );

-- Create missing account_api_tokens table
CREATE TABLE IF NOT EXISTS public.account_api_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  token_hash text NOT NULL,
  prefix text NOT NULL,
  permissions jsonb DEFAULT '{}',
  last_used_at timestamp with time zone,
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(account_id, name)
);

-- Add indexes for account_api_tokens
CREATE INDEX IF NOT EXISTS idx_account_api_tokens_account_id ON public.account_api_tokens(account_id);
CREATE INDEX IF NOT EXISTS idx_account_api_tokens_token_hash ON public.account_api_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_account_api_tokens_prefix ON public.account_api_tokens(prefix);

-- Add RLS policies for account_api_tokens
ALTER TABLE public.account_api_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "account_api_tokens_access_via_account" ON public.account_api_tokens
  FOR ALL USING (
    account_id IN (
      SELECT au.account_id 
      FROM public.account_users au
      WHERE au.user_id = auth.uid() 
      AND au.is_active = true
      AND au.role IN ('owner', 'admin')
    )
  );

-- Create missing enhanced_billing_events table
CREATE TABLE IF NOT EXISTS public.enhanced_billing_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  amount_cents integer,
  currency text DEFAULT 'USD',
  stripe_event_id text,
  status text DEFAULT 'pending',
  processed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add indexes for enhanced_billing_events
CREATE INDEX IF NOT EXISTS idx_enhanced_billing_events_account_id ON public.enhanced_billing_events(account_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_billing_events_event_type ON public.enhanced_billing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_enhanced_billing_events_status ON public.enhanced_billing_events(status);
CREATE INDEX IF NOT EXISTS idx_enhanced_billing_events_created_at ON public.enhanced_billing_events(created_at);

-- Add RLS policies for enhanced_billing_events
ALTER TABLE public.enhanced_billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enhanced_billing_events_access_via_account" ON public.enhanced_billing_events
  FOR ALL USING (
    account_id IN (
      SELECT au.account_id 
      FROM public.account_users au
      WHERE au.user_id = auth.uid() 
      AND au.is_active = true
      AND au.role IN ('owner', 'admin')
    )
  );

-- Add update triggers for timestamps
CREATE TRIGGER update_account_api_tokens_updated_at 
  BEFORE UPDATE ON public.account_api_tokens 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enhanced_billing_events_updated_at 
  BEFORE UPDATE ON public.enhanced_billing_events 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.account_api_tokens IS 'API tokens for account-level access';
COMMENT ON TABLE public.enhanced_billing_events IS 'Enhanced billing and usage events for accounts';

-- Log the migration
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Added missing RLS policies for brands and created missing tables';
END $$;