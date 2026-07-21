-- Rename brand_competitor_id to competitor_id and remove unused prompt columns
-- Migration: 20251109_rename_and_remove_columns.sql

-- ============================================================================
-- Step 1: Drop indexes and constraints that reference the columns
-- ============================================================================

-- Drop indexes on brand_competitor_id
DROP INDEX IF EXISTS idx_response_analysis_brand_competitor;
DROP INDEX IF EXISTS idx_response_analysis_account_brand_date;

-- Drop indexes on prompt_category
DROP INDEX IF EXISTS idx_response_analysis_prompt_category;

-- Drop unique constraint (will be recreated with new column name)
DROP INDEX IF EXISTS idx_response_analysis_unique;

-- Drop entity check constraint (will be recreated with new column name)
ALTER TABLE response_analysis DROP CONSTRAINT IF EXISTS entity_check;

-- ============================================================================
-- Step 2: Rename brand_competitor_id to competitor_id
-- ============================================================================

ALTER TABLE response_analysis 
  RENAME COLUMN brand_competitor_id TO competitor_id;

-- ============================================================================
-- Step 3: Remove prompt_category and prompt_intent columns
-- ============================================================================
-- Note: Using CASCADE because materialized views were already dropped

ALTER TABLE response_analysis 
  DROP COLUMN IF EXISTS prompt_category CASCADE,
  DROP COLUMN IF EXISTS prompt_intent CASCADE;

-- ============================================================================
-- Step 4: Recreate constraints with new column name
-- ============================================================================

-- Recreate entity check constraint
ALTER TABLE response_analysis ADD CONSTRAINT entity_check CHECK (
  (is_primary_brand = true AND primary_brand_id IS NOT NULL) OR
  (is_primary_brand = false AND competitor_id IS NOT NULL) OR
  (is_primary_brand = false AND primary_brand_id IS NULL AND competitor_id IS NULL)
);

COMMENT ON CONSTRAINT entity_check ON response_analysis IS 
'Ensures proper entity identification: primary brands have primary_brand_id, tracked competitors have competitor_id, discovered competitors have both NULL';

-- Recreate unique constraint with new column name
CREATE UNIQUE INDEX idx_response_analysis_unique 
  ON response_analysis(response_id, prompt_id, brand_name);

-- ============================================================================
-- Step 5: Recreate indexes with new column name
-- ============================================================================

CREATE INDEX idx_response_analysis_competitor ON response_analysis(competitor_id);
CREATE INDEX idx_response_analysis_account_brand_date ON response_analysis(account_id, brand_id, analyzed_at DESC);

-- ============================================================================
-- Step 6: Update comments
-- ============================================================================

COMMENT ON COLUMN response_analysis.competitor_id IS 'Competitor being analyzed (if competitor)';

-- ============================================================================
-- Step 7: Update materialized views to use new column name
-- ============================================================================

-- Refresh materialized views to rebuild with new column structure
-- Note: Views already reference brand_competitor_id, need to be recreated

-- Drop existing views
DROP MATERIALIZED VIEW IF EXISTS daily_brand_metrics CASCADE;
DROP MATERIALIZED VIEW IF EXISTS brand_performance_summary CASCADE;
DROP MATERIALIZED VIEW IF EXISTS topic_brand_matrix CASCADE;
DROP MATERIALIZED VIEW IF EXISTS source_citation_analysis CASCADE;
DROP MATERIALIZED VIEW IF EXISTS prompt_performance_analysis CASCADE;

-- Recreate daily_brand_metrics with competitor_id
CREATE MATERIALIZED VIEW daily_brand_metrics AS
SELECT
  brand_id,
  primary_brand_id,
  competitor_id,
  brand_name,
  is_primary_brand,
  account_id,
  DATE(analyzed_at) as metric_date,
  COUNT(DISTINCT response_id) as total_responses,
  COUNT(DISTINCT prompt_id) as total_prompts,
  COUNT(DISTINCT model_name) as total_models,
  COUNT(*) FILTER (WHERE brand_mentioned) as mention_count,
  ROUND((COUNT(*) FILTER (WHERE brand_mentioned)::NUMERIC / COUNT(*)::NUMERIC * 100), 2) as mention_rate,
  ROUND(AVG(brand_first_position) FILTER (WHERE brand_first_position IS NOT NULL), 2) as avg_position,
  COUNT(*) FILTER (WHERE brand_first_position = 1) as first_position_count,
  COUNT(*) FILTER (WHERE brand_first_position <= 3) as top_3_count,
  COUNT(*) FILTER (WHERE brand_first_position <= 5) as top_5_count,
  MIN(brand_first_position) as best_position,
  MAX(brand_first_position) as worst_position,
  ROUND(AVG(brand_sentiment) FILTER (WHERE brand_mentioned), 3) as avg_sentiment,
  COUNT(*) FILTER (WHERE sentiment_category = 'positive') as positive_count,
  COUNT(*) FILTER (WHERE sentiment_category = 'neutral') as neutral_count,
  COUNT(*) FILTER (WHERE sentiment_category = 'negative') as negative_count,
  COUNT(*) FILTER (WHERE brand_cited) as citation_count,
  ROUND((COUNT(*) FILTER (WHERE brand_cited)::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE brand_mentioned), 0)::NUMERIC * 100), 2) as citation_rate,
  SUM(brand_citation_count) as total_citations,
  ROUND(AVG(share_of_voice) FILTER (WHERE brand_mentioned), 2) as avg_share_of_voice,
  ROUND(AVG(factual_accuracy_rate) FILTER (WHERE factual_claims_made > 0), 2) as avg_factual_accuracy,
  SUM(factual_claims_made) as total_factual_claims,
  SUM(factual_claims_correct) as correct_factual_claims,
  ROUND(AVG(response_completeness), 2) as avg_completeness,
  ROUND(AVG(response_word_count), 0)::INTEGER as avg_word_count,
  MAX(analyzed_at) as last_updated,
  NOW() as materialized_at
FROM response_analysis
GROUP BY
  brand_id, primary_brand_id, competitor_id,
  brand_name, is_primary_brand, account_id, DATE(analyzed_at);

CREATE UNIQUE INDEX idx_daily_brand_metrics_unique ON daily_brand_metrics(
  brand_id, primary_brand_id, competitor_id, metric_date
);
CREATE INDEX idx_daily_brand_metrics_date ON daily_brand_metrics(metric_date DESC);
CREATE INDEX idx_daily_brand_metrics_brand ON daily_brand_metrics(brand_id, metric_date DESC);
CREATE INDEX idx_daily_brand_metrics_account ON daily_brand_metrics(account_id, metric_date DESC);
CREATE INDEX idx_daily_brand_metrics_primary ON daily_brand_metrics(is_primary_brand, account_id);

-- Recreate brand_performance_summary with competitor_id
CREATE MATERIALIZED VIEW brand_performance_summary AS
WITH period_metrics AS (
  SELECT
    brand_id, primary_brand_id, competitor_id,
    brand_name, is_primary_brand, account_id, '7d' as period,
    COUNT(DISTINCT response_id) as total_responses,
    COUNT(DISTINCT prompt_id) as total_prompts,
    ROUND((COUNT(*) FILTER (WHERE brand_mentioned)::NUMERIC / COUNT(*)::NUMERIC * 100), 2) as mention_rate,
    ROUND(AVG(brand_first_position) FILTER (WHERE brand_first_position IS NOT NULL), 2) as avg_position,
    ROUND(AVG(brand_sentiment) FILTER (WHERE brand_mentioned), 3) as avg_sentiment,
    ROUND((COUNT(*) FILTER (WHERE brand_cited)::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE brand_mentioned), 0)::NUMERIC * 100), 2) as citation_rate,
    ROUND(AVG(share_of_voice) FILTER (WHERE brand_mentioned), 2) as share_of_voice,
    COUNT(*) FILTER (WHERE brand_mentioned) as mention_count,
    COUNT(*) FILTER (WHERE brand_first_position = 1) as first_position_count,
    COUNT(*) FILTER (WHERE brand_cited) as citation_count,
    MAX(analyzed_at) as last_updated
  FROM response_analysis
  WHERE analyzed_at >= NOW() - INTERVAL '7 days'
  GROUP BY 1,2,3,4,5,6
  UNION ALL
  SELECT
    brand_id, primary_brand_id, competitor_id,
    brand_name, is_primary_brand, account_id, '30d' as period,
    COUNT(DISTINCT response_id), COUNT(DISTINCT prompt_id),
    ROUND((COUNT(*) FILTER (WHERE brand_mentioned)::NUMERIC / COUNT(*)::NUMERIC * 100), 2),
    ROUND(AVG(brand_first_position) FILTER (WHERE brand_first_position IS NOT NULL), 2),
    ROUND(AVG(brand_sentiment) FILTER (WHERE brand_mentioned), 3),
    ROUND((COUNT(*) FILTER (WHERE brand_cited)::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE brand_mentioned), 0)::NUMERIC * 100), 2),
    ROUND(AVG(share_of_voice) FILTER (WHERE brand_mentioned), 2),
    COUNT(*) FILTER (WHERE brand_mentioned),
    COUNT(*) FILTER (WHERE brand_first_position = 1),
    COUNT(*) FILTER (WHERE brand_cited),
    MAX(analyzed_at)
  FROM response_analysis
  WHERE analyzed_at >= NOW() - INTERVAL '30 days'
  GROUP BY 1,2,3,4,5,6
  UNION ALL
  SELECT
    brand_id, primary_brand_id, competitor_id,
    brand_name, is_primary_brand, account_id, '90d' as period,
    COUNT(DISTINCT response_id), COUNT(DISTINCT prompt_id),
    ROUND((COUNT(*) FILTER (WHERE brand_mentioned)::NUMERIC / COUNT(*)::NUMERIC * 100), 2),
    ROUND(AVG(brand_first_position) FILTER (WHERE brand_first_position IS NOT NULL), 2),
    ROUND(AVG(brand_sentiment) FILTER (WHERE brand_mentioned), 3),
    ROUND((COUNT(*) FILTER (WHERE brand_cited)::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE brand_mentioned), 0)::NUMERIC * 100), 2),
    ROUND(AVG(share_of_voice) FILTER (WHERE brand_mentioned), 2),
    COUNT(*) FILTER (WHERE brand_mentioned),
    COUNT(*) FILTER (WHERE brand_first_position = 1),
    COUNT(*) FILTER (WHERE brand_cited),
    MAX(analyzed_at)
  FROM response_analysis
  WHERE analyzed_at >= NOW() - INTERVAL '90 days'
  GROUP BY 1,2,3,4,5,6
)
SELECT *, calculate_lvi_score(mention_rate, citation_rate, avg_sentiment, avg_position) as lvi_score,
  NOW() as materialized_at
FROM period_metrics;

CREATE UNIQUE INDEX idx_brand_performance_summary_unique 
  ON brand_performance_summary (brand_id, primary_brand_id, competitor_id, period);
CREATE INDEX idx_brand_perf_summary_brand_period ON brand_performance_summary(brand_id, period);
CREATE INDEX idx_brand_perf_summary_account ON brand_performance_summary(account_id, period);
CREATE INDEX idx_brand_perf_summary_primary ON brand_performance_summary(is_primary_brand, account_id);
CREATE INDEX idx_brand_perf_summary_lvi ON brand_performance_summary(lvi_score DESC);

-- Recreate topic_brand_matrix with competitor_id
CREATE MATERIALIZED VIEW topic_brand_matrix AS
SELECT
  brand_id, primary_brand_id, competitor_id,
  brand_name, is_primary_brand, account_id,
  topic->>'name' as topic_name,
  topic->>'category' as topic_category,
  '30d' as period,
  COUNT(*) as mention_count,
  ROUND(AVG((topic->>'relevance')::NUMERIC), 3) as avg_relevance,
  ROUND(AVG((topic->>'sentiment')::NUMERIC), 3) as avg_sentiment,
  ROUND((COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM response_analysis ra2 
    WHERE ra2.brand_id = response_analysis.brand_id 
    AND ra2.is_primary_brand = response_analysis.is_primary_brand
    AND ra2.analyzed_at >= NOW() - INTERVAL '30 days') * 100), 2) as occurrence_rate,
  BOOL_OR(NOT EXISTS (
    SELECT 1 FROM response_analysis ra3
    WHERE ra3.response_id = response_analysis.response_id
    AND ra3.id != response_analysis.id
    AND ra3.topics_covered @> jsonb_build_array(topic)
  )) as unique_to_brand,
  MAX(analyzed_at) as last_seen,
  NOW() as materialized_at
FROM response_analysis
CROSS JOIN LATERAL jsonb_array_elements(topics_covered) as topic
WHERE analyzed_at >= NOW() - INTERVAL '30 days' AND brand_mentioned = true
GROUP BY 1,2,3,4,5,6,7,8;

CREATE UNIQUE INDEX idx_topic_brand_matrix_unique 
  ON topic_brand_matrix (brand_id, primary_brand_id, competitor_id, topic_name);
CREATE INDEX idx_topic_matrix_brand ON topic_brand_matrix(brand_id, topic_name);
CREATE INDEX idx_topic_matrix_account ON topic_brand_matrix(account_id);
CREATE INDEX idx_topic_matrix_relevance ON topic_brand_matrix(avg_relevance DESC);
CREATE INDEX idx_topic_matrix_mentions ON topic_brand_matrix(mention_count DESC);

-- Recreate source_citation_analysis with competitor_id
CREATE MATERIALIZED VIEW source_citation_analysis AS
SELECT
  brand_id, primary_brand_id, competitor_id,
  brand_name, is_primary_brand, account_id,
  source->>'domain' as source_domain,
  source->>'type' as source_type,
  '30d' as period,
  COUNT(*) as citation_count,
  COUNT(DISTINCT response_id) as responses_citing,
  ROUND((COUNT(DISTINCT response_id)::NUMERIC / (SELECT COUNT(DISTINCT response_id) FROM response_analysis ra2 
    WHERE ra2.brand_id = response_analysis.brand_id 
    AND ra2.is_primary_brand = response_analysis.is_primary_brand
    AND ra2.analyzed_at >= NOW() - INTERVAL '30 days') * 100), 2) as usage_frequency,
  ROUND(AVG((source->>'position')::INTEGER), 2) as avg_citation_position,
  COUNT(*) FILTER (WHERE (source->>'position')::INTEGER = 1) as first_citation_count,
  BOOL_OR(NOT EXISTS (
    SELECT 1 FROM response_analysis ra3
    WHERE ra3.response_id = response_analysis.response_id
    AND ra3.id != response_analysis.id
    AND ra3.sources_cited @> jsonb_build_array(source)
  )) as cites_brand_exclusively,
  array_agg(DISTINCT source->>'context') FILTER (WHERE source->>'context' IS NOT NULL) as sample_contexts,
  MAX(analyzed_at) as last_cited,
  NOW() as materialized_at
FROM response_analysis
CROSS JOIN LATERAL jsonb_array_elements(sources_cited) as source
WHERE analyzed_at >= NOW() - INTERVAL '30 days' AND brand_cited = true
GROUP BY 1,2,3,4,5,6,7,8;

CREATE UNIQUE INDEX idx_source_citation_analysis_unique 
  ON source_citation_analysis (brand_id, primary_brand_id, competitor_id, source_domain);
CREATE INDEX idx_source_citation_brand ON source_citation_analysis(brand_id, source_domain);
CREATE INDEX idx_source_citation_account ON source_citation_analysis(account_id);
CREATE INDEX idx_source_citation_count ON source_citation_analysis(citation_count DESC);
CREATE INDEX idx_source_citation_usage ON source_citation_analysis(usage_frequency DESC);

-- Recreate prompt_performance_analysis (no changes needed, doesn't use brand_competitor_id or removed columns)
CREATE MATERIALIZED VIEW prompt_performance_analysis AS
WITH prompt_brands AS (
  SELECT
    prompt_id, prompt_text, brand_id, account_id,
    MAX(CASE WHEN is_primary_brand THEN brand_name END) as primary_brand_name,
    COUNT(*) FILTER (WHERE is_primary_brand) as primary_responses,
    BOOL_OR(brand_mentioned AND is_primary_brand) as primary_mentioned,
    ROUND(AVG(brand_first_position) FILTER (WHERE is_primary_brand AND brand_mentioned), 2) as primary_avg_position,
    ROUND(AVG(brand_sentiment) FILTER (WHERE is_primary_brand AND brand_mentioned), 3) as primary_sentiment,
    ROUND(AVG(share_of_voice) FILTER (WHERE is_primary_brand AND brand_mentioned), 2) as primary_sov,
    COUNT(DISTINCT competitor_id) as competitors_count,
    array_agg(DISTINCT brand_name) FILTER (WHERE NOT is_primary_brand AND brand_mentioned) as competitors_mentioned,
    MIN(brand_first_position) FILTER (WHERE NOT is_primary_brand AND brand_mentioned) as best_competitor_position,
    CASE
      WHEN NOT BOOL_OR(brand_mentioned AND is_primary_brand) 
           AND COUNT(*) FILTER (WHERE NOT is_primary_brand AND brand_mentioned) > 0
        THEN 'opportunity'
      WHEN BOOL_OR(brand_mentioned AND is_primary_brand)
           AND (SELECT AVG(brand_first_position) FROM response_analysis ra_sub 
                WHERE ra_sub.prompt_id = response_analysis.prompt_id 
                AND ra_sub.is_primary_brand AND ra_sub.brand_mentioned) <= 3
        THEN 'strength'
      WHEN BOOL_OR(brand_mentioned AND is_primary_brand)
        THEN 'threat'
      ELSE 'neutral'
    END as strategic_classification,
    MAX(analyzed_at) as last_analyzed
  FROM response_analysis
  WHERE analyzed_at >= NOW() - INTERVAL '30 days'
  GROUP BY prompt_id, prompt_text, brand_id, account_id
)
SELECT *,
  CASE
    WHEN strategic_classification = 'opportunity' THEN LEAST(100, 50 + (competitors_count * 10))
    WHEN strategic_classification = 'threat' THEN GREATEST(0, 50 - (primary_avg_position * 5))
    WHEN strategic_classification = 'strength' THEN GREATEST(70, 100 - (primary_avg_position * 10))
    ELSE 30
  END as opportunity_score,
  '30d' as period,
  NOW() as materialized_at
FROM prompt_brands;

CREATE UNIQUE INDEX idx_prompt_performance_analysis_unique 
  ON prompt_performance_analysis (prompt_id, brand_id);
CREATE INDEX idx_prompt_perf_brand ON prompt_performance_analysis(brand_id);
CREATE INDEX idx_prompt_perf_account ON prompt_performance_analysis(account_id);
CREATE INDEX idx_prompt_perf_classification ON prompt_performance_analysis(strategic_classification);
CREATE INDEX idx_prompt_perf_opportunity ON prompt_performance_analysis(opportunity_score DESC);

-- ============================================================================
-- Update view comments
-- ============================================================================

COMMENT ON MATERIALIZED VIEW daily_brand_metrics IS 'Daily aggregated metrics per brand/competitor. Refresh hourly or after new analysis.';
COMMENT ON MATERIALIZED VIEW brand_performance_summary IS 'Brand performance metrics for 7d, 30d, 90d rolling periods with LVI scores';
COMMENT ON MATERIALIZED VIEW topic_brand_matrix IS 'Topic associations per brand for heatmap visualization (30d period)';
COMMENT ON MATERIALIZED VIEW source_citation_analysis IS 'Source and citation metrics per brand (30d period)';
COMMENT ON MATERIALIZED VIEW prompt_performance_analysis IS 'Prompt performance with strategic classifications (30d period)';
