-- Add 'growth' to the billing_plan CHECK constraint on accounts
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_billing_plan_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_billing_plan_check
  CHECK (billing_plan IN ('free', 'basic', 'growth', 'pro', 'enterprise'));

-- Sync existing accounts: update billing_plan and billing_status from account_subscriptions
UPDATE accounts a
SET
  billing_plan = sp.plan_tier,
  billing_status = s.status,
  updated_at = now()
FROM account_subscriptions s
JOIN subscription_plans sp ON sp.id = s.plan_id
WHERE s.account_id = a.id
  AND s.status IN ('active', 'trialing');

-- Create trigger function to keep accounts.billing_plan in sync when subscriptions change
CREATE OR REPLACE FUNCTION sync_account_billing_from_subscription()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_tier TEXT;
BEGIN
  -- Get the plan tier for the new/updated subscription
  SELECT plan_tier INTO v_plan_tier
  FROM subscription_plans
  WHERE id = NEW.plan_id;

  -- Only sync for active/trialing subscriptions
  IF NEW.status IN ('active', 'trialing') THEN
    UPDATE accounts
    SET
      billing_plan = COALESCE(v_plan_tier, billing_plan),
      billing_status = NEW.status,
      updated_at = now()
    WHERE id = NEW.account_id;
  ELSIF NEW.status IN ('canceled', 'expired') THEN
    UPDATE accounts
    SET
      billing_plan = 'free',
      billing_status = NEW.status,
      updated_at = now()
    WHERE id = NEW.account_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to account_subscriptions
DROP TRIGGER IF EXISTS trg_sync_account_billing ON account_subscriptions;
CREATE TRIGGER trg_sync_account_billing
  AFTER INSERT OR UPDATE ON account_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_account_billing_from_subscription();
