-- ============================================================================
-- STRIPE INTEGRATION
-- 1. Add stripe_customer_id to accounts table
-- 2. Add stripe_price_id columns to subscription_plans
-- ============================================================================

BEGIN;

-- Add Stripe customer ID to accounts (one customer per org)
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_accounts_stripe_customer ON accounts(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Add Stripe price IDs for each billing cycle to subscription_plans
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS stripe_monthly_price_id TEXT;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS stripe_quarterly_price_id TEXT;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS stripe_biannual_price_id TEXT;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS stripe_annual_price_id TEXT;

COMMIT;
