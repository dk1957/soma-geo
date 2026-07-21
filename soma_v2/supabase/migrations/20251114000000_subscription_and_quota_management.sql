-- ============================================================================
-- SUBSCRIPTION AND QUOTA MANAGEMENT SYSTEM
-- Migration: 20251114000000_subscription_and_quota_management.sql
-- Purpose: Comprehensive subscription plans with quotas for brands, prompts, 
--          models, and competitors
-- ============================================================================

-- ============================================================================
-- 1. SUBSCRIPTION PLANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL UNIQUE,
  plan_slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('growth', 'pro', 'enterprise')),
  
  -- Pricing
  monthly_price_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
  quarterly_price_usd DECIMAL(10,2),
  biannual_price_usd DECIMAL(10,2),
  annual_price_usd DECIMAL(10,2),
  
  -- Quota Limits
  max_brands INTEGER NOT NULL DEFAULT 1,
  max_prompts_per_brand INTEGER NOT NULL DEFAULT 20,
  max_competitors_per_brand INTEGER NOT NULL DEFAULT 10,
  max_team_members INTEGER NOT NULL DEFAULT 5,
  
  -- Model Access (array of allowed model providers)
  allowed_models TEXT[] NOT NULL DEFAULT ARRAY['openai', 'anthropic', 'google']::TEXT[],
  max_model_platforms INTEGER NOT NULL DEFAULT 3,
  
  -- Geographic/Locale quotas
  max_locales_per_prompt INTEGER NOT NULL DEFAULT 1,
  allowed_regions TEXT[] NOT NULL DEFAULT ARRAY['global']::TEXT[],
  
  -- Feature Flags
  features JSONB DEFAULT jsonb_build_object(
    'api_access', false,
    'white_label', false,
    'custom_branding', false,
    'priority_support', false,
    'dedicated_account_manager', false,
    'advanced_analytics', false,
    'competitor_tracking', true,
    'sentiment_analysis', true,
    'export_reports', true,
    'scheduled_reports', false,
    'webhook_integrations', false,
    'sso_enabled', false
  ),
  
  -- Usage Limits
  monthly_simulation_limit INTEGER DEFAULT 1000,
  monthly_report_limit INTEGER DEFAULT 10,
  data_retention_months INTEGER DEFAULT 12,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_public BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_subscription_plans_tier ON subscription_plans(plan_tier);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active) WHERE is_active = true;
CREATE INDEX idx_subscription_plans_public ON subscription_plans(is_public) WHERE is_public = true;

-- ============================================================================
-- 2. ACCOUNT SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS account_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  
  -- Subscription Details
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'expired', 'paused')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'biannual', 'annual')),
  
  -- Dates
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  
  -- Billing
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  amount_paid DECIMAL(10,2),
  currency TEXT DEFAULT 'usd',
  
  -- Auto-renewal
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  next_billing_date TIMESTAMPTZ,
  
  -- Custom Quota Overrides (NULL means use plan defaults)
  custom_max_brands INTEGER,
  custom_max_prompts_per_brand INTEGER,
  custom_max_competitors_per_brand INTEGER,
  custom_max_team_members INTEGER,
  custom_max_model_platforms INTEGER,
  custom_allowed_models TEXT[],
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create unique partial index to ensure only one active subscription per account
CREATE UNIQUE INDEX idx_account_subscriptions_unique_active 
  ON account_subscriptions(account_id) 
  WHERE status IN ('active', 'trialing');

-- Create other indexes
CREATE INDEX idx_account_subscriptions_account ON account_subscriptions(account_id);
CREATE INDEX idx_account_subscriptions_plan ON account_subscriptions(plan_id);
CREATE INDEX idx_account_subscriptions_status ON account_subscriptions(status);
CREATE INDEX idx_account_subscriptions_end_date ON account_subscriptions(current_period_end) WHERE status = 'active';
CREATE INDEX idx_account_subscriptions_stripe ON account_subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- ============================================================================
-- 3. USAGE TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS account_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES account_subscriptions(id) ON DELETE SET NULL,
  
  -- Period tracking
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- Current Usage Counts
  brands_count INTEGER NOT NULL DEFAULT 0,
  prompts_count INTEGER NOT NULL DEFAULT 0,
  competitors_count INTEGER NOT NULL DEFAULT 0,
  team_members_count INTEGER NOT NULL DEFAULT 0,
  simulations_run INTEGER NOT NULL DEFAULT 0,
  reports_generated INTEGER NOT NULL DEFAULT 0,
  
  -- Model Platform Usage
  models_used JSONB DEFAULT '{}', -- {"openai": 150, "anthropic": 75, ...}
  locales_used TEXT[] DEFAULT '{}',
  
  -- Detailed breakdown by brand
  usage_by_brand JSONB DEFAULT '{}', -- {"brand_id": {"prompts": 10, "competitors": 5, ...}}
  
  -- Warnings
  warnings JSONB DEFAULT '[]', -- [{"type": "quota_exceeded", "resource": "prompts", ...}]
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one usage record per account per period
  CONSTRAINT unique_account_usage_period 
    UNIQUE (account_id, period_start, period_end)
);

-- Create indexes
CREATE INDEX idx_account_usage_account ON account_usage(account_id);
CREATE INDEX idx_account_usage_subscription ON account_usage(subscription_id);
CREATE INDEX idx_account_usage_period ON account_usage(period_start, period_end);
CREATE INDEX idx_account_usage_current ON account_usage(account_id, period_end);

-- ============================================================================
-- 4. SUBSCRIPTION HISTORY TABLE (Audit Trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES account_subscriptions(id) ON DELETE SET NULL,
  
  -- Event Details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', 'renewed', 'upgraded', 'downgraded', 
    'canceled', 'expired', 'paused', 'resumed', 
    'payment_failed', 'payment_succeeded', 'trial_started', 'trial_ended'
  )),
  event_data JSONB NOT NULL DEFAULT '{}',
  
  -- Changes
  previous_plan_id UUID REFERENCES subscription_plans(id),
  new_plan_id UUID REFERENCES subscription_plans(id),
  previous_status TEXT,
  new_status TEXT,
  
  -- Financial
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'usd',
  
  -- Metadata
  triggered_by UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_subscription_history_account ON subscription_history(account_id);
CREATE INDEX idx_subscription_history_subscription ON subscription_history(subscription_id);
CREATE INDEX idx_subscription_history_event_type ON subscription_history(event_type);
CREATE INDEX idx_subscription_history_created ON subscription_history(created_at DESC);

-- ============================================================================
-- 5. BRAND QUOTAS TABLE (Per-Brand Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS brand_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  
  -- Allocated Quotas
  max_prompts INTEGER NOT NULL,
  max_competitors INTEGER NOT NULL,
  max_model_platforms INTEGER NOT NULL,
  allowed_models TEXT[] NOT NULL,
  max_locales INTEGER NOT NULL,
  
  -- Current Usage
  current_prompts_count INTEGER NOT NULL DEFAULT 0,
  current_competitors_count INTEGER NOT NULL DEFAULT 0,
  current_models_count INTEGER NOT NULL DEFAULT 0,
  current_locales_count INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_brand_quota UNIQUE (brand_id)
);

-- Create indexes
CREATE INDEX idx_brand_quotas_brand ON brand_quotas(brand_id);
CREATE INDEX idx_brand_quotas_account ON brand_quotas(account_id);

-- ============================================================================
-- 6. INSERT DEFAULT PLANS
-- ============================================================================

-- Growth Plan (Base/Starter)
INSERT INTO subscription_plans (
  plan_name, plan_slug, display_name, description, plan_tier,
  monthly_price_usd, quarterly_price_usd, biannual_price_usd, annual_price_usd,
  max_brands, max_prompts_per_brand, max_competitors_per_brand, max_team_members,
  allowed_models, max_model_platforms, max_locales_per_prompt,
  features, monthly_simulation_limit, monthly_report_limit, sort_order
) VALUES (
  'growth', 'growth', 'Growth', 
  'Perfect for growing businesses starting their AI visibility journey',
  'growth',
  99.00, 267.00, 495.00, 950.00,
  1, 20, 10, 3,
  ARRAY['openai', 'anthropic', 'google']::TEXT[],
  3, 1,
  jsonb_build_object(
    'api_access', false,
    'white_label', false,
    'custom_branding', false,
    'priority_support', false,
    'dedicated_account_manager', false,
    'advanced_analytics', true,
    'competitor_tracking', true,
    'sentiment_analysis', true,
    'export_reports', true,
    'scheduled_reports', false,
    'webhook_integrations', false,
    'sso_enabled', false
  ),
  500, 10, 1
) ON CONFLICT (plan_name) DO NOTHING;

-- Pro Plan (Mid-tier)
INSERT INTO subscription_plans (
  plan_name, plan_slug, display_name, description, plan_tier,
  monthly_price_usd, quarterly_price_usd, biannual_price_usd, annual_price_usd,
  max_brands, max_prompts_per_brand, max_competitors_per_brand, max_team_members,
  allowed_models, max_model_platforms, max_locales_per_prompt,
  features, monthly_simulation_limit, monthly_report_limit, sort_order
) VALUES (
  'pro', 'pro', 'Pro', 
  'Advanced features for agencies and teams managing multiple brands',
  'pro',
  299.00, 807.00, 1495.00, 2870.00,
  5, 50, 25, 10,
  ARRAY['openai', 'anthropic', 'google', 'perplexity', 'xai']::TEXT[],
  5, 3,
  jsonb_build_object(
    'api_access', true,
    'white_label', true,
    'custom_branding', true,
    'priority_support', true,
    'dedicated_account_manager', false,
    'advanced_analytics', true,
    'competitor_tracking', true,
    'sentiment_analysis', true,
    'export_reports', true,
    'scheduled_reports', true,
    'webhook_integrations', true,
    'sso_enabled', false
  ),
  2500, 50, 2
) ON CONFLICT (plan_name) DO NOTHING;

-- Enterprise Plan
INSERT INTO subscription_plans (
  plan_name, plan_slug, display_name, description, plan_tier,
  monthly_price_usd, quarterly_price_usd, biannual_price_usd, annual_price_usd,
  max_brands, max_prompts_per_brand, max_competitors_per_brand, max_team_members,
  allowed_models, max_model_platforms, max_locales_per_prompt,
  features, monthly_simulation_limit, monthly_report_limit, sort_order
) VALUES (
  'enterprise', 'enterprise', 'Enterprise', 
  'Custom solution for large organizations with unlimited needs',
  'enterprise',
  999.00, 2697.00, 4995.00, 9590.00,
  999, 999, 999, 999,
  ARRAY['openai', 'anthropic', 'google', 'perplexity', 'xai', 'meta']::TEXT[],
  999, 999,
  jsonb_build_object(
    'api_access', true,
    'white_label', true,
    'custom_branding', true,
    'priority_support', true,
    'dedicated_account_manager', true,
    'advanced_analytics', true,
    'competitor_tracking', true,
    'sentiment_analysis', true,
    'export_reports', true,
    'scheduled_reports', true,
    'webhook_integrations', true,
    'sso_enabled', true
  ),
  99999, 999, 3
) ON CONFLICT (plan_name) DO NOTHING;

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to get account's active subscription with quotas
CREATE OR REPLACE FUNCTION get_account_subscription_quotas(p_account_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  plan_name TEXT,
  plan_tier TEXT,
  status TEXT,
  max_brands INTEGER,
  max_prompts_per_brand INTEGER,
  max_competitors_per_brand INTEGER,
  max_team_members INTEGER,
  max_model_platforms INTEGER,
  allowed_models TEXT[],
  max_locales_per_prompt INTEGER,
  features JSONB,
  current_period_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    asub.id,
    sp.plan_name,
    sp.plan_tier,
    asub.status,
    COALESCE(asub.custom_max_brands, sp.max_brands),
    COALESCE(asub.custom_max_prompts_per_brand, sp.max_prompts_per_brand),
    COALESCE(asub.custom_max_competitors_per_brand, sp.max_competitors_per_brand),
    COALESCE(asub.custom_max_team_members, sp.max_team_members),
    COALESCE(asub.custom_max_model_platforms, sp.max_model_platforms),
    COALESCE(asub.custom_allowed_models, sp.allowed_models),
    sp.max_locales_per_prompt,
    sp.features,
    asub.current_period_end
  FROM account_subscriptions asub
  JOIN subscription_plans sp ON asub.plan_id = sp.id
  WHERE asub.account_id = p_account_id
    AND asub.status IN ('active', 'trialing')
  ORDER BY asub.current_period_end DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if account can create a brand
CREATE OR REPLACE FUNCTION can_create_brand(p_account_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_max_brands INTEGER;
  v_current_brands INTEGER;
BEGIN
  -- Get max brands from subscription
  SELECT max_brands INTO v_max_brands
  FROM get_account_subscription_quotas(p_account_id);
  
  IF v_max_brands IS NULL THEN
    RETURN false; -- No active subscription
  END IF;
  
  -- Get current brand count
  SELECT COUNT(*) INTO v_current_brands
  FROM brands
  WHERE account_id = p_account_id AND is_active = true;
  
  RETURN v_current_brands < v_max_brands;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if brand can add a prompt
CREATE OR REPLACE FUNCTION can_add_prompt(p_brand_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_account_id UUID;
  v_max_prompts INTEGER;
  v_current_prompts INTEGER;
BEGIN
  -- Get account_id and quota
  SELECT b.account_id, bq.max_prompts, bq.current_prompts_count
  INTO v_account_id, v_max_prompts, v_current_prompts
  FROM brands b
  LEFT JOIN brand_quotas bq ON b.id = bq.brand_id
  WHERE b.id = p_brand_id;
  
  IF v_max_prompts IS NULL THEN
    -- Initialize quota if not exists
    PERFORM initialize_brand_quota(p_brand_id);
    SELECT max_prompts, current_prompts_count INTO v_max_prompts, v_current_prompts
    FROM brand_quotas WHERE brand_id = p_brand_id;
  END IF;
  
  RETURN v_current_prompts < v_max_prompts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if brand can add a competitor
CREATE OR REPLACE FUNCTION can_add_competitor(p_brand_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_max_competitors INTEGER;
  v_current_competitors INTEGER;
BEGIN
  SELECT bq.max_competitors, bq.current_competitors_count
  INTO v_max_competitors, v_current_competitors
  FROM brand_quotas bq
  WHERE bq.brand_id = p_brand_id;
  
  IF v_max_competitors IS NULL THEN
    PERFORM initialize_brand_quota(p_brand_id);
    SELECT max_competitors, current_competitors_count INTO v_max_competitors, v_current_competitors
    FROM brand_quotas WHERE brand_id = p_brand_id;
  END IF;
  
  RETURN v_current_competitors < v_max_competitors;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to initialize brand quota from subscription
CREATE OR REPLACE FUNCTION initialize_brand_quota(p_brand_id UUID)
RETURNS VOID AS $$
DECLARE
  v_account_id UUID;
  v_quotas RECORD;
BEGIN
  -- Get account_id
  SELECT account_id INTO v_account_id FROM brands WHERE id = p_brand_id;
  
  -- Get subscription quotas
  SELECT * INTO v_quotas FROM get_account_subscription_quotas(v_account_id);
  
  -- Insert or update brand quota
  INSERT INTO brand_quotas (
    brand_id, account_id, 
    max_prompts, max_competitors, max_model_platforms, 
    allowed_models, max_locales
  ) VALUES (
    p_brand_id, v_account_id,
    v_quotas.max_prompts_per_brand, 
    v_quotas.max_competitors_per_brand,
    v_quotas.max_model_platforms,
    v_quotas.allowed_models,
    v_quotas.max_locales_per_prompt
  )
  ON CONFLICT (brand_id) DO UPDATE SET
    max_prompts = EXCLUDED.max_prompts,
    max_competitors = EXCLUDED.max_competitors,
    max_model_platforms = EXCLUDED.max_model_platforms,
    allowed_models = EXCLUDED.allowed_models,
    max_locales = EXCLUDED.max_locales,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update usage counts
CREATE OR REPLACE FUNCTION update_brand_usage_count(
  p_brand_id UUID,
  p_resource_type TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  CASE p_resource_type
    WHEN 'prompt' THEN
      UPDATE brand_quotas SET current_prompts_count = current_prompts_count + p_increment
      WHERE brand_id = p_brand_id;
    WHEN 'competitor' THEN
      UPDATE brand_quotas SET current_competitors_count = current_competitors_count + p_increment
      WHERE brand_id = p_brand_id;
    WHEN 'model' THEN
      UPDATE brand_quotas SET current_models_count = current_models_count + p_increment
      WHERE brand_id = p_brand_id;
    WHEN 'locale' THEN
      UPDATE brand_quotas SET current_locales_count = current_locales_count + p_increment
      WHERE brand_id = p_brand_id;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. TRIGGERS
-- ============================================================================

-- Trigger to initialize brand quota when brand is created
CREATE OR REPLACE FUNCTION trigger_initialize_brand_quota()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM initialize_brand_quota(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brands_initialize_quota
  AFTER INSERT ON brands
  FOR EACH ROW
  EXECUTE FUNCTION trigger_initialize_brand_quota();

-- Trigger to update prompt count
CREATE OR REPLACE FUNCTION trigger_update_prompt_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM update_brand_usage_count(NEW.brand_id, 'prompt', 1);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_brand_usage_count(OLD.brand_id, 'prompt', -1);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_prompts_update_quota
  AFTER INSERT OR DELETE ON user_prompts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_prompt_count();

-- Trigger to update competitor count
CREATE OR REPLACE FUNCTION trigger_update_competitor_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM update_brand_usage_count(NEW.brand_id, 'competitor', 1);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_brand_usage_count(OLD.brand_id, 'competitor', -1);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER competitors_update_quota
  AFTER INSERT OR DELETE ON competitors
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_competitor_count();

-- Trigger to log subscription changes
CREATE OR REPLACE FUNCTION trigger_log_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO subscription_history (
      account_id, subscription_id, event_type, event_data,
      new_plan_id, new_status
    ) VALUES (
      NEW.account_id, NEW.id, 'created', jsonb_build_object('subscription_id', NEW.id),
      NEW.plan_id, NEW.status
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO subscription_history (
        account_id, subscription_id, event_type, event_data,
        previous_status, new_status, previous_plan_id, new_plan_id
      ) VALUES (
        NEW.account_id, NEW.id, 
        CASE 
          WHEN NEW.status = 'canceled' THEN 'canceled'
          WHEN NEW.status = 'expired' THEN 'expired'
          WHEN OLD.status = 'trialing' AND NEW.status = 'active' THEN 'trial_ended'
          ELSE 'status_changed'
        END,
        jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status),
        OLD.status, NEW.status, OLD.plan_id, NEW.plan_id
      );
    END IF;
    
    IF OLD.plan_id != NEW.plan_id THEN
      INSERT INTO subscription_history (
        account_id, subscription_id, event_type, event_data,
        previous_plan_id, new_plan_id
      ) VALUES (
        NEW.account_id, NEW.id,
        CASE
          WHEN (SELECT sort_order FROM subscription_plans WHERE id = NEW.plan_id) > 
               (SELECT sort_order FROM subscription_plans WHERE id = OLD.plan_id)
          THEN 'upgraded'
          ELSE 'downgraded'
        END,
        jsonb_build_object('old_plan_id', OLD.plan_id, 'new_plan_id', NEW.plan_id),
        OLD.plan_id, NEW.plan_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER account_subscriptions_log_changes
  AFTER INSERT OR UPDATE ON account_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_subscription_change();

-- Trigger for updated_at timestamps
CREATE TRIGGER subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER account_subscriptions_updated_at
  BEFORE UPDATE ON account_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER brand_quotas_updated_at
  BEFORE UPDATE ON brand_quotas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER account_usage_updated_at
  BEFORE UPDATE ON account_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_quotas ENABLE ROW LEVEL SECURITY;

-- Subscription Plans: Public read, service role write
CREATE POLICY "Plans viewable by everyone" ON subscription_plans
  FOR SELECT USING (is_public = true OR auth.role() = 'service_role');

CREATE POLICY "Plans manageable by service role only" ON subscription_plans
  FOR ALL USING (auth.role() = 'service_role');

-- Account Subscriptions: Account owners and members can view
CREATE POLICY "Users can view their account subscriptions" ON account_subscriptions
  FOR SELECT USING (
    account_id IN (
      SELECT au.account_id FROM account_users au
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Service role can manage subscriptions" ON account_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Account Usage: Account owners and members can view
CREATE POLICY "Users can view their account usage" ON account_usage
  FOR SELECT USING (
    account_id IN (
      SELECT au.account_id FROM account_users au
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Service role can manage usage" ON account_usage
  FOR ALL USING (auth.role() = 'service_role');

-- Subscription History: Account owners can view
CREATE POLICY "Users can view their subscription history" ON subscription_history
  FOR SELECT USING (
    account_id IN (
      SELECT au.account_id FROM account_users au
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Service role can manage history" ON subscription_history
  FOR ALL USING (auth.role() = 'service_role');

-- Brand Quotas: Brand users can view
CREATE POLICY "Users can view brand quotas" ON brand_quotas
  FOR SELECT USING (
    brand_id IN (
      SELECT b.id FROM brands b
      JOIN account_users au ON b.account_id = au.account_id
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Service role can manage brand quotas" ON brand_quotas
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 10. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON subscription_plans TO authenticated, anon;
GRANT SELECT ON account_subscriptions TO authenticated;
GRANT SELECT ON account_usage TO authenticated;
GRANT SELECT ON subscription_history TO authenticated;
GRANT SELECT ON brand_quotas TO authenticated;

GRANT ALL ON subscription_plans TO service_role;
GRANT ALL ON account_subscriptions TO service_role;
GRANT ALL ON account_usage TO service_role;
GRANT ALL ON subscription_history TO service_role;
GRANT ALL ON brand_quotas TO service_role;

GRANT EXECUTE ON FUNCTION get_account_subscription_quotas TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION can_create_brand TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION can_add_prompt TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION can_add_competitor TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION initialize_brand_quota TO service_role;
GRANT EXECUTE ON FUNCTION update_brand_usage_count TO service_role;

-- ============================================================================
-- 11. COMMENTS
-- ============================================================================

COMMENT ON TABLE subscription_plans IS 'Defines available subscription plans with quotas and features';
COMMENT ON TABLE account_subscriptions IS 'Tracks active and historical subscriptions for accounts';
COMMENT ON TABLE account_usage IS 'Tracks usage metrics per billing period';
COMMENT ON TABLE subscription_history IS 'Audit trail of all subscription changes';
COMMENT ON TABLE brand_quotas IS 'Per-brand quota allocations and current usage';

COMMENT ON FUNCTION get_account_subscription_quotas IS 'Returns active subscription quotas for an account';
COMMENT ON FUNCTION can_create_brand IS 'Checks if account has quota to create another brand';
COMMENT ON FUNCTION can_add_prompt IS 'Checks if brand has quota to add another prompt';
COMMENT ON FUNCTION can_add_competitor IS 'Checks if brand has quota to add another competitor';
COMMENT ON FUNCTION initialize_brand_quota IS 'Initializes quota tracking for a new brand';
COMMENT ON FUNCTION update_brand_usage_count IS 'Updates usage counts for brand resources';
