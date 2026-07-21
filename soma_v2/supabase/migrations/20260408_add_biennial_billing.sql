-- Add biennial (24-month) billing cycle support
-- ============================================

-- Add biennial pricing and Stripe columns to subscription_plans
ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS biennial_price_usd NUMERIC(10, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stripe_biennial_price_id TEXT DEFAULT NULL;

-- Update the billing_cycle CHECK constraint on account_subscriptions
-- Drop the old constraint and add the new one with 'biennial' included
ALTER TABLE account_subscriptions
  DROP CONSTRAINT IF EXISTS account_subscriptions_billing_cycle_check;

ALTER TABLE account_subscriptions
  ADD CONSTRAINT account_subscriptions_billing_cycle_check
  CHECK (billing_cycle IN ('monthly', 'quarterly', 'biannual', 'annual', 'biennial'));
