-- ============================================================
-- Soma AI Database Schema Cleanup & Fix Migration
-- Date: 2025-06-21
-- ============================================================
-- Summary:
--   1. Create enhanced_metrics TABLE (was phantom - metrics-calculator writes here)
--   2. Create enhanced_brand_metrics VIEW (maps matview to dashboard APIs)
--   3. Drop 10 empty/superseded tables
--   4. Create 10 critical tables that API routes query but didn't exist
--   5. Add missing indexes
--   6. Refresh all materialized views
-- ============================================================

BEGIN;

-- ============================================================
-- PART 1: Create enhanced_metrics TABLE
-- Used by: lib/services/metrics-calculator.ts (storeEnhancedMetrics)
-- ============================================================
CREATE TABLE IF NOT EXISTS enhanced_metrics (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id        uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  account_id      uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  simulation_id   uuid REFERENCES llm_simulations(id) ON DELETE SET NULL,
  lvi_score                numeric(5,2) DEFAULT 0,
  visibility_index         numeric(5,2) DEFAULT 0,
  share_of_voice           numeric(5,2) DEFAULT 0,
  citation_count           integer DEFAULT 0,
  citation_quality_score   numeric(5,2) DEFAULT 0,
  brand_mention_frequency  numeric(5,2) DEFAULT 0,
  sentiment_score          numeric(5,2) DEFAULT 0,
  position_quality_score   numeric(5,2) DEFAULT 0,
  competitive_ranking      numeric(5,2) DEFAULT 0,
  response_coverage_rate   numeric(5,2) DEFAULT 0,
  query_alignment_score    numeric(5,2) DEFAULT 0,
  authority_score          numeric(5,2) DEFAULT 0,
  consistency_score        numeric(5,2) DEFAULT 0,
  discoverability_score    numeric(5,2) DEFAULT 0,
  recommendation_rate      numeric(5,2) DEFAULT 0,
  negative_mention_rate    numeric(5,2) DEFAULT 0,
  comparative_advantage    numeric(5,2) DEFAULT 0,
  market_presence_score    numeric(5,2) DEFAULT 0,
  trend_momentum           numeric(5,2) DEFAULT 0,
  metrics_vector           jsonb,
  benchmark_vector         jsonb,
  calculation_method       jsonb DEFAULT '{}'::jsonb,
  confidence_score         numeric(3,2) DEFAULT 1.0,
  data_quality_score       numeric(3,2) DEFAULT 0,
  sample_size              integer DEFAULT 0,
  calculated_at            timestamptz DEFAULT now(),
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now(),
  CONSTRAINT enhanced_metrics_brand_sim_unique UNIQUE (brand_id, simulation_id)
);

CREATE INDEX IF NOT EXISTS idx_enhanced_metrics_brand ON enhanced_metrics (brand_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_metrics_account ON enhanced_metrics (account_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_metrics_calculated_at ON enhanced_metrics (calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_metrics_brand_calculated ON enhanced_metrics (brand_id, calculated_at DESC);

ALTER TABLE enhanced_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their enhanced metrics" ON enhanced_metrics FOR SELECT
  USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "System can insert enhanced metrics" ON enhanced_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update enhanced metrics" ON enhanced_metrics FOR UPDATE USING (true);

CREATE TRIGGER update_enhanced_metrics_updated_at
  BEFORE UPDATE ON enhanced_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- PART 2: Create enhanced_brand_metrics VIEW
-- Maps mv_daily_brand_model_metrics to the column names the dashboard APIs expect
-- ============================================================
CREATE OR REPLACE VIEW enhanced_brand_metrics AS
SELECT
  entity_id AS id, primary_brand_id AS brand_id, account_id, model_name,
  analysis_date AS date,
  avg_lvi_score AS llm_visibility_index,
  avg_share_of_voice AS generative_sov,
  mention_count AS mention_frequency,
  citation_count,
  avg_sentiment_score AS ai_sentiment_score,
  avg_position_score AS domain_authority_score,
  avg_visibility_score, avg_citation_rate,
  total_responses, total_prompts,
  best_position, worst_position, avg_raw_position,
  positive_count, neutral_count, negative_count,
  total_factual_claims, correct_factual_claims, factual_accuracy_pct,
  last_analyzed, materialized_at,
  NULL::uuid AS prompt_id
FROM mv_daily_brand_model_metrics;


-- ============================================================
-- PART 3: Drop 10 empty/superseded tables
-- All confirmed 0 rows, no active code references
-- ============================================================
DROP TABLE IF EXISTS topic_insights CASCADE;
DROP TABLE IF EXISTS system_configurations CASCADE;
DROP TABLE IF EXISTS content_freshness_audit CASCADE;
DROP TABLE IF EXISTS internationalization_audit CASCADE;
DROP TABLE IF EXISTS crawler_behavior_analysis CASCADE;
DROP TABLE IF EXISTS performance_audit CASCADE;
DROP TABLE IF EXISTS account_usage CASCADE;
DROP TABLE IF EXISTS source_urls CASCADE;
DROP TABLE IF EXISTS brand_metrics CASCADE;       -- 0 rows, superseded by brand_analysis_metrics
DROP TABLE IF EXISTS simulation_metrics CASCADE;  -- 1 row, superseded by materialized views


-- ============================================================
-- PART 4: Create 10 critical missing tables
-- ============================================================

-- 4a. daily_brand_metrics
CREATE TABLE IF NOT EXISTS daily_brand_metrics (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id               uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  account_id             uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  date                   date NOT NULL,
  is_primary_brand       boolean DEFAULT true,
  brand_visibility_index numeric DEFAULT 0,
  model_performance      jsonb DEFAULT '{}'::jsonb,
  competitive_metrics    jsonb DEFAULT '{}'::jsonb,
  citation_metrics       jsonb DEFAULT '{}'::jsonb,
  semantic_positioning   jsonb DEFAULT '{}'::jsonb,
  query_performance      jsonb DEFAULT '{}'::jsonb,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now(),
  UNIQUE (brand_id, account_id, date)
);
CREATE INDEX IF NOT EXISTS idx_daily_brand_metrics_brand ON daily_brand_metrics (brand_id);
CREATE INDEX IF NOT EXISTS idx_daily_brand_metrics_account ON daily_brand_metrics (account_id);
CREATE INDEX IF NOT EXISTS idx_daily_brand_metrics_date ON daily_brand_metrics (date DESC);
ALTER TABLE daily_brand_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view daily brand metrics" ON daily_brand_metrics FOR SELECT
  USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "System can insert daily brand metrics" ON daily_brand_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update daily brand metrics" ON daily_brand_metrics FOR UPDATE USING (true);

-- 4b. daily_brand_analytics
CREATE TABLE IF NOT EXISTS daily_brand_analytics (
  day                    date NOT NULL,
  brand_id               uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  account_id             uuid REFERENCES accounts(id) ON DELETE CASCADE,
  total_events           integer DEFAULT 0,
  unique_users           integer DEFAULT 0,
  onboarding_completions integer DEFAULT 0,
  audit_completions      integer DEFAULT 0,
  report_generations     integer DEFAULT 0,
  created_at             timestamptz DEFAULT now(),
  PRIMARY KEY (day, brand_id)
);
ALTER TABLE daily_brand_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view daily analytics" ON daily_brand_analytics FOR SELECT
  USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "System can manage daily analytics" ON daily_brand_analytics FOR ALL WITH CHECK (true);

-- 4c. hourly_brand_analytics
CREATE TABLE IF NOT EXISTS hourly_brand_analytics (
  hour                   timestamptz NOT NULL,
  brand_id               uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  account_id             uuid REFERENCES accounts(id) ON DELETE CASCADE,
  total_events           integer DEFAULT 0,
  unique_users           integer DEFAULT 0,
  onboarding_completions integer DEFAULT 0,
  audit_completions      integer DEFAULT 0,
  report_generations     integer DEFAULT 0,
  created_at             timestamptz DEFAULT now(),
  PRIMARY KEY (hour, brand_id)
);
ALTER TABLE hourly_brand_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view hourly analytics" ON hourly_brand_analytics FOR SELECT
  USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "System can manage hourly analytics" ON hourly_brand_analytics FOR ALL WITH CHECK (true);

-- 4d. competitor_analysis
CREATE TABLE IF NOT EXISTS competitor_analysis (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id                uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  competitor_name         text NOT NULL,
  competitor_mention_count integer DEFAULT 0,
  relative_prominence     numeric DEFAULT 0,
  sentiment_comparison    numeric DEFAULT 0,
  competitor_lvi_score    numeric DEFAULT 0,
  created_at              timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_brand ON competitor_analysis (brand_id, created_at DESC);
ALTER TABLE competitor_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view competitor analysis" ON competitor_analysis FOR SELECT
  USING (brand_id IN (SELECT b.id FROM brands b JOIN account_users au ON b.account_id = au.account_id WHERE au.user_id = auth.uid() AND au.is_active = true));
CREATE POLICY "System can manage competitor analysis" ON competitor_analysis FOR ALL WITH CHECK (true);

-- 4e. competitor_benchmarks
CREATE TABLE IF NOT EXISTS competitor_benchmarks (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id               uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  competitor_id          uuid REFERENCES competitors(id) ON DELETE SET NULL,
  competitor_brand_name  text,
  brand_score            numeric DEFAULT 0,
  competitor_score       numeric DEFAULT 0,
  platform               text DEFAULT 'all',
  category               text DEFAULT 'General',
  query_category         text,
  recorded_at            timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_competitor_benchmarks_brand ON competitor_benchmarks (brand_id, recorded_at DESC);
ALTER TABLE competitor_benchmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view benchmarks" ON competitor_benchmarks FOR SELECT
  USING (brand_id IN (SELECT b.id FROM brands b JOIN account_users au ON b.account_id = au.account_id WHERE au.user_id = auth.uid() AND au.is_active = true));
CREATE POLICY "System can manage benchmarks" ON competitor_benchmarks FOR ALL WITH CHECK (true);

-- 4f. geo_analyses
CREATE TABLE IF NOT EXISTS geo_analyses (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id              text,
  brand_id                   uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  account_id                 uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  response_id                uuid,
  model_name                 text NOT NULL,
  lvi_score                  numeric DEFAULT 0,
  brand_mention_count        integer DEFAULT 0,
  unique_brands_count        integer DEFAULT 0,
  avg_brand_sentiment        numeric DEFAULT 0,
  total_citations            integer DEFAULT 0,
  response_quality_score     numeric DEFAULT 0,
  competitive_pressure_score numeric DEFAULT 0,
  brand_mentions             jsonb DEFAULT '[]'::jsonb,
  competitor_mentions        jsonb DEFAULT '[]'::jsonb,
  citations                  jsonb DEFAULT '[]'::jsonb,
  processing_time_ms         integer DEFAULT 0,
  created_at                 timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_geo_analyses_brand ON geo_analyses (brand_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_geo_analyses_simulation ON geo_analyses (simulation_id);
ALTER TABLE geo_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view geo analyses" ON geo_analyses FOR SELECT
  USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "System can manage geo analyses" ON geo_analyses FOR ALL WITH CHECK (true);

-- 4g. llm_prompts
CREATE TABLE IF NOT EXISTS llm_prompts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id    uuid NOT NULL REFERENCES llm_simulations(id) ON DELETE CASCADE,
  user_id          text NOT NULL,
  account_id       uuid REFERENCES accounts(id) ON DELETE CASCADE,
  brand_id         uuid REFERENCES brands(id) ON DELETE CASCADE,
  brand_context_id uuid,
  prompt_text      text NOT NULL,
  intent_category  text DEFAULT 'general',
  priority         integer DEFAULT 1,
  rationale        text DEFAULT '',
  metadata         jsonb DEFAULT '{}'::jsonb,
  created_at       timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_llm_prompts_simulation ON llm_prompts (simulation_id);
CREATE INDEX IF NOT EXISTS idx_llm_prompts_brand ON llm_prompts (brand_id);
ALTER TABLE llm_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view llm prompts" ON llm_prompts FOR SELECT
  USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "System can manage llm prompts" ON llm_prompts FOR INSERT WITH CHECK (true);

-- 4h. onboarding_audits
CREATE TABLE IF NOT EXISTS onboarding_audits (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name      text,
  website         text,
  industry        text,
  target_markets  jsonb DEFAULT '[]'::jsonb,
  user_id         text,
  account_id      uuid REFERENCES accounts(id) ON DELETE CASCADE,
  brand_id        uuid REFERENCES brands(id) ON DELETE CASCADE,
  audit_results   jsonb DEFAULT '{}'::jsonb,
  extracted_data  jsonb DEFAULT '{}'::jsonb,
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_onboarding_audits_brand ON onboarding_audits (brand_id);
ALTER TABLE onboarding_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view onboarding audits" ON onboarding_audits FOR SELECT
  USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "System can manage onboarding audits" ON onboarding_audits FOR ALL WITH CHECK (true);

-- 4i. ground_truth_questions
CREATE TABLE IF NOT EXISTS ground_truth_questions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id   text NOT NULL,
  question   text NOT NULL,
  intent     text,
  source     text,
  score      numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ground_truth_questions_batch ON ground_truth_questions (batch_id, score DESC);
ALTER TABLE ground_truth_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "System can manage ground truth" ON ground_truth_questions FOR ALL WITH CHECK (true);
CREATE POLICY "Authenticated users can view ground truth" ON ground_truth_questions FOR SELECT USING (true);

-- 4j. llm_visibility_tracking
CREATE TABLE IF NOT EXISTS llm_visibility_tracking (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id   uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_llm_visibility_tracking_brand ON llm_visibility_tracking (brand_id);
ALTER TABLE llm_visibility_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view visibility tracking" ON llm_visibility_tracking FOR SELECT
  USING (brand_id IN (SELECT b.id FROM brands b JOIN account_users au ON b.account_id = au.account_id WHERE au.user_id = auth.uid() AND au.is_active = true));
CREATE POLICY "System can manage visibility tracking" ON llm_visibility_tracking FOR ALL WITH CHECK (true);


-- ============================================================
-- PART 5: Missing indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_daily_brand_analytics_account ON daily_brand_analytics (account_id, day DESC);
CREATE INDEX IF NOT EXISTS idx_hourly_brand_analytics_account ON hourly_brand_analytics (account_id, hour DESC);
CREATE INDEX IF NOT EXISTS idx_response_analysis_mentioned_brand ON response_analysis (brand_id, analysis_date DESC) WHERE brand_mentioned = true;
CREATE INDEX IF NOT EXISTS idx_brand_analysis_metrics_account_primary ON brand_analysis_metrics (account_id, is_primary_brand, created_at DESC) WHERE is_primary_brand = true;

-- Add unique index for concurrent refresh of prompt_performance_analysis matview
CREATE UNIQUE INDEX IF NOT EXISTS idx_prompt_perf_unique ON prompt_performance_analysis (prompt_id, model_name, account_brand_id);


COMMIT;

-- ============================================================
-- PART 6: Refresh materialized views (outside transaction)
-- ============================================================
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_brand_response_metrics;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_brand_model_metrics;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_brand_metrics_all_models;
REFRESH MATERIALIZED VIEW CONCURRENTLY brand_performance_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY prompt_performance_analysis;
REFRESH MATERIALIZED VIEW CONCURRENTLY source_citation_analysis;
REFRESH MATERIALIZED VIEW CONCURRENTLY topic_brand_matrix;
