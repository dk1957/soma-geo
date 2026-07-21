-- ============================================================================
-- SUBSCRIPTION ENHANCEMENTS
-- 1. Function to expire subscriptions and deactivate overdue accounts
-- 2. Function to get accounts with expiring subscriptions (for reminders)
-- 3. Rate limit tracking table
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. RATE LIMIT TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS rate_limit_entries (
  key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_cleanup 
  ON rate_limit_entries(window_start);

-- Auto-cleanup old entries (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS VOID AS $$
BEGIN
  DELETE FROM rate_limit_entries 
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. EXPIRE SUBSCRIPTIONS FUNCTION
-- Called by cron to auto-expire overdue subscriptions
-- ============================================================================
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
      AND sub.auto_renew = false  -- Only expire non-auto-renewing
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

-- ============================================================================
-- 3. GET EXPIRING SUBSCRIPTIONS (For reminder emails)
-- Returns subscriptions expiring within N days
-- ============================================================================
CREATE OR REPLACE FUNCTION get_expiring_subscriptions(p_days_ahead INTEGER DEFAULT 7)
RETURNS TABLE (
  account_id UUID,
  account_name TEXT,
  owner_email TEXT,
  subscription_id UUID,
  plan_name TEXT,
  plan_tier TEXT,
  status TEXT,
  current_period_end TIMESTAMPTZ,
  days_remaining INTEGER,
  is_trial BOOLEAN,
  auto_renew BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id AS account_id,
    a.name AS account_name,
    COALESCE(
      (SELECT au.email FROM account_users au 
       WHERE au.account_id = a.id AND au.role = 'owner' 
       LIMIT 1),
      ''
    ) AS owner_email,
    sub.id AS subscription_id,
    sp.display_name AS plan_name,
    sp.plan_tier,
    sub.status,
    sub.current_period_end,
    EXTRACT(DAY FROM (sub.current_period_end - NOW()))::INTEGER AS days_remaining,
    (sub.status = 'trialing') AS is_trial,
    sub.auto_renew
  FROM account_subscriptions sub
  JOIN subscription_plans sp ON sub.plan_id = sp.id
  JOIN accounts a ON sub.account_id = a.id
  WHERE sub.status IN ('active', 'trialing')
    AND sub.current_period_end <= NOW() + (p_days_ahead || ' days')::INTERVAL
    AND sub.current_period_end > NOW()
  ORDER BY sub.current_period_end ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- 4. CHECK SUBSCRIPTION STATUS (For middleware/paywall)
-- Returns whether account has valid subscription
-- ============================================================================
CREATE OR REPLACE FUNCTION check_account_subscription_status(p_account_id UUID)
RETURNS TABLE (
  has_active_subscription BOOLEAN,
  subscription_status TEXT,
  plan_name TEXT,
  plan_tier TEXT,
  days_remaining INTEGER,
  is_trial BOOLEAN,
  features JSONB,
  current_period_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (sub.status IN ('active', 'trialing')) AS has_active_subscription,
    sub.status,
    sp.display_name AS plan_name,
    sp.plan_tier,
    GREATEST(0, EXTRACT(DAY FROM (sub.current_period_end - NOW()))::INTEGER) AS days_remaining,
    (sub.status = 'trialing') AS is_trial,
    sp.features,
    sub.current_period_end
  FROM account_subscriptions sub
  JOIN subscription_plans sp ON sub.plan_id = sp.id
  WHERE sub.account_id = p_account_id
  ORDER BY 
    CASE sub.status 
      WHEN 'active' THEN 1 
      WHEN 'trialing' THEN 2 
      ELSE 3 
    END,
    sub.current_period_end DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION expire_overdue_subscriptions() TO service_role;
GRANT EXECUTE ON FUNCTION get_expiring_subscriptions(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION check_account_subscription_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_account_subscription_status(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_rate_limits() TO service_role;

-- RLS for rate_limit_entries (service role only)
ALTER TABLE rate_limit_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON rate_limit_entries
  FOR ALL USING (true) WITH CHECK (true);

COMMIT;
