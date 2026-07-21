-- Recreate account_api_tokens (was dropped during cleanup, still referenced by settings page)
-- Uses 'prefix' column and created_by stores clerk_id (text, not auth.users FK)

CREATE TABLE IF NOT EXISTS public.account_api_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  prefix text NOT NULL,
  permissions text[] DEFAULT '{}',
  rate_limit_per_hour integer DEFAULT 1000,
  rate_limit_per_day integer DEFAULT 10000,
  usage_count integer DEFAULT 0,
  last_used_at timestamptz,
  last_used_ip inet,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_account_api_tokens_account_id ON public.account_api_tokens(account_id);
CREATE INDEX IF NOT EXISTS idx_account_api_tokens_token_hash ON public.account_api_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_account_api_tokens_active ON public.account_api_tokens(is_active);

ALTER TABLE public.account_api_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to account_api_tokens"
  ON public.account_api_tokens FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Account owners and admins can manage API tokens"
  ON public.account_api_tokens FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.account_users
      WHERE account_users.account_id = account_api_tokens.account_id
      AND account_users.user_id = auth.uid()
      AND account_users.role IN ('owner', 'admin')
    )
  );

CREATE TRIGGER update_account_api_tokens_updated_at
  BEFORE UPDATE ON public.account_api_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.account_api_tokens IS 'API access tokens for enterprise integrations';
