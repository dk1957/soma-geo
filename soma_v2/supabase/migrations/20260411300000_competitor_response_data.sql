-- ============================================================================
-- Migration: Competitor response_data decoupling
-- ============================================================================
-- Problem: Competitors were being auto-created as brand entries in the brands
-- table so their response_data could reference a valid brand_id FK. This
-- polluted the brands table and made competitors appear as real brands.
--
-- Solution: Add competitor_id to response_data so competitor analysis results
-- can reference the competitors table directly. Create daily_competitor_metrics
-- table for aggregated competitor performance data.
-- ============================================================================

-- 1. Add competitor_id to response_data
ALTER TABLE response_data ADD COLUMN IF NOT EXISTS competitor_id uuid REFERENCES competitors(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_response_data_competitor ON response_data(competitor_id) WHERE competitor_id IS NOT NULL;

-- 2. Replace the old unique constraint with partial indexes
ALTER TABLE response_data DROP CONSTRAINT IF EXISTS response_data_response_id_brand_id_key;

-- Primary brand rows (competitor_id IS NULL): one per (response_id, brand_id)
CREATE UNIQUE INDEX IF NOT EXISTS response_data_unique_brand 
  ON response_data(response_id, brand_id) WHERE competitor_id IS NULL;

-- Competitor rows: one per (response_id, competitor_id)
CREATE UNIQUE INDEX IF NOT EXISTS response_data_unique_competitor 
  ON response_data(response_id, competitor_id) WHERE competitor_id IS NOT NULL;

-- 3. Create daily_competitor_metrics table
CREATE TABLE IF NOT EXISTS daily_competitor_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id uuid NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  competitor_name text NOT NULL,
  run_date date NOT NULL,
  total_responses int DEFAULT 0,
  responses_with_mention int DEFAULT 0,
  visibility_rate numeric(5,2) DEFAULT 0,
  citation_rate numeric(5,2) DEFAULT 0,
  recommendation_rate numeric(5,2) DEFAULT 0,
  avg_brand_rank numeric(5,2) DEFAULT 0,
  avg_sentiment numeric(5,3) DEFAULT 0,
  lvi_score numeric(5,2) DEFAULT 0,
  share_of_voice numeric(5,2) DEFAULT 0,
  total_citations int DEFAULT 0,
  total_brand_mentions int DEFAULT 0,
  metric_version int DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(competitor_id, run_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_competitor_metrics_brand ON daily_competitor_metrics(brand_id, run_date);
CREATE INDEX IF NOT EXISTS idx_daily_competitor_metrics_account ON daily_competitor_metrics(account_id);

ALTER TABLE daily_competitor_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to daily_competitor_metrics"
  ON daily_competitor_metrics FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can read daily_competitor_metrics for their accounts" 
  ON daily_competitor_metrics FOR SELECT USING (
    account_id IN (
      SELECT au.account_id FROM account_users au 
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

CREATE TRIGGER update_daily_competitor_metrics_updated_at
  BEFORE UPDATE ON daily_competitor_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE daily_competitor_metrics IS 'Daily aggregated metrics for competitors — same structure as daily_brand_metrics but keyed by competitor_id';
