-- ============================================================================
-- Fix: Brand Quota Initialization for Accounts Without Subscriptions
-- ============================================================================
-- This migration fixes the issue where brand creation fails when an account
-- doesn't have an active subscription. The initialize_brand_quota function
-- now provides sensible defaults (free tier) when no subscription exists.
-- ============================================================================

-- Add a free trial plan if it doesn't exist
INSERT INTO subscription_plans (
  plan_name, plan_slug, display_name, description, plan_tier,
  monthly_price_usd, quarterly_price_usd, biannual_price_usd, annual_price_usd,
  max_brands, max_prompts_per_brand, max_competitors_per_brand, max_team_members,
  allowed_models, max_model_platforms, max_locales_per_prompt,
  features, monthly_simulation_limit, monthly_report_limit, sort_order, is_active
) VALUES (
  'free', 'free', 'Free Trial', 
  'Get started with Soma AI - limited features for evaluation',
  'free',
  0.00, 0.00, 0.00, 0.00,
  1, 5, 3, 1,
  ARRAY['openai']::TEXT[],
  1, 1,
  jsonb_build_object(
    'api_access', false,
    'white_label', false,
    'custom_branding', false,
    'priority_support', false,
    'dedicated_account_manager', false,
    'advanced_analytics', false,
    'competitor_tracking', true,
    'sentiment_analysis', false,
    'export_reports', false,
    'scheduled_reports', false,
    'webhook_integrations', false,
    'sso_enabled', false
  ),
  50, 5, 0
) ON CONFLICT (plan_name) DO NOTHING;

-- Update the initialize_brand_quota function to handle missing subscriptions
CREATE OR REPLACE FUNCTION initialize_brand_quota(p_brand_id UUID)
RETURNS VOID AS $$
DECLARE
  v_account_id UUID;
  v_quotas RECORD;
  -- Default values for free tier (when no subscription exists)
  v_default_max_prompts INTEGER := 5;
  v_default_max_competitors INTEGER := 3;
  v_default_max_model_platforms INTEGER := 1;
  v_default_allowed_models TEXT[] := ARRAY['openai']::TEXT[];
  v_default_max_locales INTEGER := 1;
BEGIN
  -- Get account_id
  SELECT account_id INTO v_account_id FROM brands WHERE id = p_brand_id;
  
  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'Brand % not found or has no account_id', p_brand_id;
  END IF;
  
  -- Get subscription quotas
  SELECT * INTO v_quotas FROM get_account_subscription_quotas(v_account_id);
  
  -- Insert or update brand quota with COALESCE to handle NULL values
  INSERT INTO brand_quotas (
    brand_id, account_id, 
    max_prompts, max_competitors, max_model_platforms, 
    allowed_models, max_locales
  ) VALUES (
    p_brand_id, v_account_id,
    COALESCE(v_quotas.max_prompts_per_brand, v_default_max_prompts), 
    COALESCE(v_quotas.max_competitors_per_brand, v_default_max_competitors),
    COALESCE(v_quotas.max_model_platforms, v_default_max_model_platforms),
    COALESCE(v_quotas.allowed_models, v_default_allowed_models),
    COALESCE(v_quotas.max_locales_per_prompt, v_default_max_locales)
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION initialize_brand_quota(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_brand_quota(UUID) TO service_role;

-- Add comment explaining the function
COMMENT ON FUNCTION initialize_brand_quota(UUID) IS 
'Initializes brand_quotas for a new brand. Uses subscription quotas if available, 
otherwise falls back to free tier defaults (5 prompts, 3 competitors, 1 model platform).';
