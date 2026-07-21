-- ============================================================================
-- SUBSCRIPTION SYSTEM - EXISTING ACCOUNTS MIGRATION
-- ============================================================================
-- This script assigns subscriptions to existing accounts and initializes quotas

DO $$
DECLARE
  v_growth_plan_id UUID;
  v_account RECORD;
  v_brand RECORD;
BEGIN
  -- Get the Growth plan ID
  SELECT id INTO v_growth_plan_id 
  FROM subscription_plans 
  WHERE plan_name = 'growth';

  IF v_growth_plan_id IS NULL THEN
    RAISE EXCEPTION 'Growth plan not found. Please run the main subscription migration first.';
  END IF;

  -- Assign Growth plan to all existing accounts that don't have a subscription
  FOR v_account IN 
    SELECT id FROM accounts 
    WHERE id NOT IN (
      SELECT account_id FROM account_subscriptions WHERE status IN ('active', 'trialing')
    )
  LOOP
    -- Create subscription for account (30-day trial)
    INSERT INTO account_subscriptions (
      account_id,
      plan_id,
      status,
      billing_cycle,
      current_period_start,
      current_period_end,
      trial_start,
      trial_end,
      auto_renew
    ) VALUES (
      v_account.id,
      v_growth_plan_id,
      'trialing',
      'monthly',
      NOW(),
      NOW() + INTERVAL '30 days',
      NOW(),
      NOW() + INTERVAL '30 days',
      true
    );

    RAISE NOTICE 'Created trial subscription for account: %', v_account.id;
  END LOOP;

  -- Initialize brand quotas for all existing brands that don't have quotas
  FOR v_brand IN 
    SELECT id FROM brands 
    WHERE id NOT IN (SELECT brand_id FROM brand_quotas)
  LOOP
    PERFORM initialize_brand_quota(v_brand.id);
    RAISE NOTICE 'Initialized quota for brand: %', v_brand.id;
  END LOOP;

  RAISE NOTICE 'Migration complete! All accounts have been assigned trial subscriptions.';
END $$;

-- Update usage counts for all existing brands
DO $$
DECLARE
  v_brand RECORD;
  v_prompt_count INTEGER;
  v_competitor_count INTEGER;
BEGIN
  FOR v_brand IN SELECT id FROM brands
  LOOP
    -- Count existing prompts
    SELECT COUNT(*) INTO v_prompt_count
    FROM user_prompts
    WHERE brand_id = v_brand.id;

    -- Count existing competitors
    SELECT COUNT(*) INTO v_competitor_count
    FROM competitors
    WHERE brand_id = v_brand.id;

    -- Update brand quota with actual counts
    UPDATE brand_quotas
    SET 
      current_prompts_count = v_prompt_count,
      current_competitors_count = v_competitor_count,
      updated_at = NOW()
    WHERE brand_id = v_brand.id;

    RAISE NOTICE 'Updated usage for brand %: % prompts, % competitors', 
      v_brand.id, v_prompt_count, v_competitor_count;
  END LOOP;

  RAISE NOTICE 'All brand usage counts updated!';
END $$;
