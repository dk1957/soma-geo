-- ============================================================================
-- FIX: expire_overdue_subscriptions() should also expire auto-renew subs
-- that are past their period end, since there is no payment processor
-- to actually process the renewal. Without this fix, auto-renew subs
-- stay "active" forever even after their period ends.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION expire_overdue_subscriptions()
RETURNS TABLE (
  account_id UUID,
  account_name TEXT,
  subscription_id UUID,
  plan_name TEXT,
  expired_at TIMESTAMPTZ,
  was_trial BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH expired AS (
    UPDATE account_subscriptions sub
    SET 
      status = 'expired',
      ended_at = NOW(),
      updated_at = NOW()
    FROM subscription_plans sp, accounts a
    WHERE sub.plan_id = sp.id
      AND sub.account_id = a.id
      AND sub.status IN ('active', 'trialing')
      AND sub.current_period_end < NOW()
    RETURNING 
      sub.account_id,
      a.name AS account_name,
      sub.id AS subscription_id,
      sp.display_name AS plan_name,
      NOW() AS expired_at,
      (sub.status = 'trialing') AS was_trial
  )
  SELECT * FROM expired;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
