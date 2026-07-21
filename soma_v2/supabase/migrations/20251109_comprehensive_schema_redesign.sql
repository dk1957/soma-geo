-- ============================================================================
-- COMPREHENSIVE SCHEMA REDESIGN
-- ============================================================================
-- Date: 2025-11-09
-- Purpose: Complete schema redesign with response_analysis as single source of truth
-- 
-- Philosophy:
-- - Keep llm_simulation_responses as raw data storage
-- - Create response_analysis table to store detailed analysis from sim.ai workflow
-- - Build aggregated views and materialized views for dashboards and reports
-- - All metrics derived from response_analysis, no duplicate data
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP OLD TABLES AND VIEWS
-- ============================================================================

-- Drop old views first
DROP VIEW IF EXISTS brand_daily_analysis_latest CASCADE;
DROP VIEW IF EXISTS brand_daily_analysis_aggregated CASCADE;
DROP VIEW IF EXISTS brand_topic_analysis_latest CASCADE;
DROP VIEW IF EXISTS brand_source_analysis_latest CASCADE;
DROP MATERIALIZED VIEW IF EXISTS brand_metrics_latest CASCADE;

-- Drop old tables
DROP TABLE IF EXISTS brand_daily_analysis CASCADE;
DROP TABLE IF EXISTS brand_topic_analysis CASCADE;
DROP TABLE IF EXISTS brand_source_analysis CASCADE;
DROP TABLE IF EXISTS brand_metrics_timeseries CASCADE;
DROP TABLE IF EXISTS brand_performance_metrics CASCADE;
DROP TABLE IF EXISTS topic_brand_associations CASCADE;
DROP TABLE IF EXISTS prompt_performance_analysis CASCADE;
DROP TABLE IF EXISTS citation_domain_analysis CASCADE;
DROP TABLE IF EXISTS response_analysis CASCADE;

-- Drop old functions
DROP FUNCTION IF EXISTS calculate_brand_daily_metrics CASCADE;
DROP FUNCTION IF EXISTS refresh_brand_metrics_latest CASCADE;
DROP FUNCTION IF EXISTS update_brand_daily_analysis CASCADE;

COMMENT ON SCHEMA public IS 'Schema redesigned on 2025-11-09: Single source of truth in response_analysis';

-- ============================================================================
-- STEP 2: CREATE RESPONSE_ANALYSIS TABLE (Single Source of Truth)
-- ============================================================================
-- This table stores detailed analysis results from sim.ai workflow
-- One row per response per brand/competitor analyzed
-- All downstream metrics are derived from this table
-- ============================================================================

CREATE TABLE response_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ============================================================================
  -- IDENTITY & RELATIONSHIPS
  -- ============================================================================
  response_id TEXT NOT NULL, -- References llm_simulation_responses(id)
  simulation_id TEXT NOT NULL,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  
  -- Analyzed entity (primary brand OR competitor)
  primary_brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  brand_competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,
  brand_name VARCHAR(255) NOT NULL,
  is_primary_brand BOOLEAN NOT NULL DEFAULT false,
  
  -- ============================================================================
  -- PROMPT & MODEL CONTEXT
  -- ============================================================================
  prompt_id TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  prompt_category VARCHAR(100), -- 'product_search', 'comparison', 'how_to', etc.
  prompt_intent VARCHAR(50), -- 'informational', 'transactional', 'navigational'
  
  model_name TEXT NOT NULL,
  model_provider TEXT NOT NULL,
  
  -- ============================================================================
  -- CORE VISIBILITY METRICS
  -- ============================================================================
  
  -- Mentions: Brand appearance counts
  brand_mentioned BOOLEAN NOT NULL DEFAULT false,
  brand_mention_count INTEGER DEFAULT 0, -- Times brand appeared in this response
  total_brands_mentioned INTEGER DEFAULT 0, -- All brands in this response
  
  -- Position: Where brand appears
  brand_positions INTEGER[] DEFAULT '{}', -- All positions where brand appeared [1, 5, 12]
  brand_first_position INTEGER, -- First position (NULL if not mentioned)
  brand_avg_position NUMERIC(5,2), -- Average position
  
  -- ============================================================================
  -- SENTIMENT ANALYSIS
  -- ============================================================================
  brand_sentiment NUMERIC(3,2) DEFAULT 0, -- -1 to 1 scale
  sentiment_category VARCHAR(20), -- 'positive', 'neutral', 'negative'
  sentiment_confidence NUMERIC(3,2) DEFAULT 0, -- 0 to 1
  sentiment_context TEXT, -- Why this sentiment was assigned
  
  -- ============================================================================
  -- CITATIONS & SOURCES
  -- ============================================================================
  brand_cited BOOLEAN DEFAULT false,
  brand_citation_count INTEGER DEFAULT 0, -- Times brand's sources were cited
  citation_type VARCHAR(50), -- 'direct_link', 'formal_citation', 'inline_mention', 'none'
  
  -- Array of source objects cited for this brand
  sources_cited JSONB DEFAULT '[]'::jsonb,
  -- [
  --   {
  --     "domain": "example.com",
  --     "url": "https://example.com/article",
  --     "title": "Article Title",
  --     "type": "owned|competitor|industry|news|academic",
  --     "position": 1,
  --     "context": "Cited in paragraph 2 about pricing"
  --   }
  -- ]
  
  -- ============================================================================
  -- TOPIC ANALYSIS
  -- ============================================================================
  topics_covered JSONB DEFAULT '[]'::jsonb,
  -- [
  --   {
  --     "name": "pricing",
  --     "category": "product_feature",
  --     "relevance": 0.95,
  --     "sentiment": 0.8,
  --     "context": "Discussed competitive pricing"
  --   }
  -- ]
  
  -- ============================================================================
  -- FACTUAL ACCURACY
  -- ============================================================================
  factual_claims_made INTEGER DEFAULT 0,
  factual_claims_correct INTEGER DEFAULT 0,
  factual_accuracy_rate NUMERIC(5,2) DEFAULT 0, -- Percentage (0-100)
  factual_issues JSONB DEFAULT '[]'::jsonb,
  -- [
  --   {
  --     "claim": "Price is $99",
  --     "correct_value": "$149",
  --     "severity": "high|medium|low"
  --   }
  -- ]
  
  -- ============================================================================
  -- RESPONSE QUALITY
  -- ============================================================================
  response_completeness NUMERIC(5,2) DEFAULT 0, -- 0-100, how complete the answer was
  response_word_count INTEGER,
  response_contains_urls BOOLEAN DEFAULT false,
  response_contains_images BOOLEAN DEFAULT false,
  
  -- ============================================================================
  -- COMPETITIVE CONTEXT
  -- ============================================================================
  competitors_mentioned TEXT[], -- Other brands mentioned in same response
  competitive_positioning VARCHAR(50), -- 'leader', 'challenger', 'niche', 'not_mentioned'
  share_of_voice NUMERIC(5,2), -- % of mentions for this brand in this response
  
  -- ============================================================================
  -- METADATA & QUALITY
  -- ============================================================================
  analysis_confidence NUMERIC(3,2) DEFAULT 1.0, -- 0-1, confidence in analysis
  analysis_method VARCHAR(50) DEFAULT 'sim_ai_workflow', -- 'sim_ai_workflow', 'manual', 'batch'
  analysis_version VARCHAR(20), -- Track workflow version
  
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- ============================================================================
  -- CONSTRAINTS
  -- ============================================================================
  CONSTRAINT valid_sentiment CHECK (brand_sentiment >= -1 AND brand_sentiment <= 1),
  CONSTRAINT valid_percentages CHECK (
    share_of_voice >= 0 AND share_of_voice <= 100 AND
    factual_accuracy_rate >= 0 AND factual_accuracy_rate <= 100 AND
    response_completeness >= 0 AND response_completeness <= 100
  ),
  CONSTRAINT entity_check CHECK (
    (primary_brand_id IS NOT NULL AND brand_competitor_id IS NULL) OR
    (primary_brand_id IS NULL AND brand_competitor_id IS NOT NULL)
  )
);

-- Add unique index (can't use COALESCE in UNIQUE constraint)
CREATE UNIQUE INDEX idx_response_analysis_unique 
  ON response_analysis(response_id, 
    COALESCE(primary_brand_id, '00000000-0000-0000-0000-000000000000'::uuid), 
    COALESCE(brand_competitor_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- ============================================================================
-- INDEXES FOR RESPONSE_ANALYSIS
-- ============================================================================

-- Core lookups
CREATE INDEX idx_response_analysis_response ON response_analysis(response_id);
CREATE INDEX idx_response_analysis_simulation ON response_analysis(simulation_id);
CREATE INDEX idx_response_analysis_account ON response_analysis(account_id);
CREATE INDEX idx_response_analysis_account_brand ON response_analysis(account_brand_id);
CREATE INDEX idx_response_analysis_primary_brand ON response_analysis(primary_brand_id);
CREATE INDEX idx_response_analysis_brand_competitor ON response_analysis(brand_competitor_id);

-- Time-based queries
CREATE INDEX idx_response_analysis_analyzed_at ON response_analysis(analyzed_at DESC);
CREATE INDEX idx_response_analysis_created_at ON response_analysis(created_at DESC);

-- Filtering
CREATE INDEX idx_response_analysis_mentioned ON response_analysis(brand_mentioned) WHERE brand_mentioned = true;
CREATE INDEX idx_response_analysis_primary ON response_analysis(is_primary_brand, account_id);
CREATE INDEX idx_response_analysis_model ON response_analysis(model_name);
CREATE INDEX idx_response_analysis_prompt_category ON response_analysis(prompt_category);
CREATE INDEX idx_response_analysis_sentiment ON response_analysis(sentiment_category);

-- JSONB indexes
CREATE INDEX idx_response_analysis_sources_gin ON response_analysis USING gin(sources_cited);
CREATE INDEX idx_response_analysis_topics_gin ON response_analysis USING gin(topics_covered);
CREATE INDEX idx_response_analysis_competitors_gin ON response_analysis USING gin(competitors_mentioned);

-- Composite indexes for common queries
CREATE INDEX idx_response_analysis_primary_brand_date ON response_analysis(primary_brand_id, analyzed_at DESC);
CREATE INDEX idx_response_analysis_account_brand_date ON response_analysis(account_id, account_brand_id, analyzed_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE response_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view response analysis for their accounts"
  ON response_analysis FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert response analysis for their accounts"
  ON response_analysis FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update response analysis for their accounts"
  ON response_analysis FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Service role has full access to response analysis"
  ON response_analysis FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER response_analysis_updated_at
  BEFORE UPDATE ON response_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE response_analysis IS 'Single source of truth for all response analysis data from sim.ai workflow. All metrics and reports are derived from this table.';
COMMENT ON COLUMN response_analysis.response_id IS 'Links to raw LLM response';
COMMENT ON COLUMN response_analysis.account_brand_id IS 'Account''s primary brand being tracked';
COMMENT ON COLUMN response_analysis.primary_brand_id IS 'Brand being analyzed (if primary brand)';
COMMENT ON COLUMN response_analysis.brand_competitor_id IS 'Competitor being analyzed (if competitor)';
COMMENT ON COLUMN response_analysis.brand_mention_count IS 'Number of times the brand appeared in this response';
COMMENT ON COLUMN response_analysis.brand_positions IS 'Array of all positions where brand was mentioned [1, 5, 12]';
COMMENT ON COLUMN response_analysis.brand_sentiment IS 'Sentiment score from -1 (negative) to 1 (positive)';
COMMENT ON COLUMN response_analysis.sources_cited IS 'Array of source objects with domain, URL, type, position, context';
COMMENT ON COLUMN response_analysis.topics_covered IS 'Array of topic objects with name, category, relevance, sentiment';
COMMENT ON COLUMN response_analysis.factual_accuracy_rate IS 'Percentage of factual claims that were correct (0-100)';
COMMENT ON COLUMN response_analysis.share_of_voice IS 'Percentage of brand mentions in this response (0-100)';

-- ============================================================================
-- STEP 3: CREATE AGGREGATION FUNCTIONS
-- ============================================================================

-- ============================================================================
-- FUNCTION: Calculate LVI Score
-- ============================================================================
-- LVI = (Visibility * 0.3) + (Citation Rate * 0.3) + (Sentiment * 0.2) + (Position * 0.2)
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_lvi_score(
  p_mention_rate NUMERIC,
  p_citation_rate NUMERIC,
  p_avg_sentiment NUMERIC,
  p_avg_position NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
  v_visibility_component NUMERIC;
  v_citation_component NUMERIC;
  v_sentiment_component NUMERIC;
  v_position_component NUMERIC;
BEGIN
  -- Normalize components to 0-100 scale
  v_visibility_component := COALESCE(p_mention_rate, 0); -- Already 0-100
  v_citation_component := COALESCE(p_citation_rate, 0); -- Already 0-100
  
  -- Sentiment: -1 to 1 → 0 to 100
  v_sentiment_component := ((COALESCE(p_avg_sentiment, 0) + 1) / 2) * 100;
  
  -- Position: Lower is better, normalize inversely
  -- Position 1 = 100, Position 10 = 10, Position 20+ = 0
  v_position_component := CASE 
    WHEN p_avg_position IS NULL THEN 0
    WHEN p_avg_position <= 1 THEN 100
    WHEN p_avg_position >= 20 THEN 0
    ELSE 100 - ((p_avg_position - 1) * 5.26) -- Linear scale
  END;
  
  -- Calculate weighted LVI
  RETURN ROUND(
    (v_visibility_component * 0.3) +
    (v_citation_component * 0.3) +
    (v_sentiment_component * 0.2) +
    (v_position_component * 0.2),
    2
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_lvi_score IS 'Calculate LLM Visibility Index: (Visibility*0.3) + (Citation*0.3) + (Sentiment*0.2) + (Position*0.2)';

-- ============================================================================
-- STEP 4: CREATE MATERIALIZED VIEWS FOR REPORTS
-- ============================================================================

-- ============================================================================
-- VIEW: Daily Brand Metrics (Aggregated by Day)
-- ============================================================================
-- Used for: Time series charts, trend analysis, daily snapshots
-- ============================================================================

CREATE MATERIALIZED VIEW daily_brand_metrics AS
SELECT
  -- Identity
  account_brand_id,
  primary_brand_id,
  brand_competitor_id,
  brand_name,
  is_primary_brand,
  account_id,
  
  -- Time dimension
  DATE(analyzed_at) as metric_date,
  
  -- Aggregated counts
  COUNT(DISTINCT response_id) as total_responses,
  COUNT(DISTINCT prompt_id) as total_prompts,
  COUNT(DISTINCT model_name) as total_models,
  
  -- Mention metrics
  COUNT(*) FILTER (WHERE brand_mentioned) as mention_count,
  ROUND((COUNT(*) FILTER (WHERE brand_mentioned)::NUMERIC / COUNT(*)::NUMERIC * 100), 2) as mention_rate,
  
  -- Position metrics
  ROUND(AVG(brand_first_position) FILTER (WHERE brand_first_position IS NOT NULL), 2) as avg_position,
  COUNT(*) FILTER (WHERE brand_first_position = 1) as first_position_count,
  COUNT(*) FILTER (WHERE brand_first_position <= 3) as top_3_count,
  COUNT(*) FILTER (WHERE brand_first_position <= 5) as top_5_count,
  MIN(brand_first_position) as best_position,
  MAX(brand_first_position) as worst_position,
  
  -- Sentiment metrics
  ROUND(AVG(brand_sentiment) FILTER (WHERE brand_mentioned), 3) as avg_sentiment,
  COUNT(*) FILTER (WHERE sentiment_category = 'positive') as positive_count,
  COUNT(*) FILTER (WHERE sentiment_category = 'neutral') as neutral_count,
  COUNT(*) FILTER (WHERE sentiment_category = 'negative') as negative_count,
  
  -- Citation metrics
  COUNT(*) FILTER (WHERE brand_cited) as citation_count,
  ROUND((COUNT(*) FILTER (WHERE brand_cited)::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE brand_mentioned), 0)::NUMERIC * 100), 2) as citation_rate,
  SUM(brand_citation_count) as total_citations,
  
  -- Share of voice
  ROUND(AVG(share_of_voice) FILTER (WHERE brand_mentioned), 2) as avg_share_of_voice,
  
  -- Factual accuracy
  ROUND(AVG(factual_accuracy_rate) FILTER (WHERE factual_claims_made > 0), 2) as avg_factual_accuracy,
  SUM(factual_claims_made) as total_factual_claims,
  SUM(factual_claims_correct) as correct_factual_claims,
  
  -- Response quality
  ROUND(AVG(response_completeness), 2) as avg_completeness,
  ROUND(AVG(response_word_count), 0)::INTEGER as avg_word_count,
  
  -- Metadata
  MAX(analyzed_at) as last_updated,
  NOW() as materialized_at
  
FROM response_analysis
GROUP BY
  account_brand_id,
  primary_brand_id,
  brand_competitor_id,
  brand_name,
  is_primary_brand,
  account_id,
  DATE(analyzed_at);

-- Create indexes on materialized view
CREATE UNIQUE INDEX idx_daily_brand_metrics_unique ON daily_brand_metrics(
  account_brand_id,
  COALESCE(primary_brand_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(brand_competitor_id, '00000000-0000-0000-0000-000000000000'::uuid),
  metric_date
);
CREATE INDEX idx_daily_brand_metrics_date ON daily_brand_metrics(metric_date DESC);
CREATE INDEX idx_daily_brand_metrics_brand ON daily_brand_metrics(account_brand_id, metric_date DESC);
CREATE INDEX idx_daily_brand_metrics_account ON daily_brand_metrics(account_id, metric_date DESC);
CREATE INDEX idx_daily_brand_metrics_primary ON daily_brand_metrics(is_primary_brand, account_id);

COMMENT ON MATERIALIZED VIEW daily_brand_metrics IS 'Daily aggregated metrics per brand/competitor. Refresh hourly or after new analysis.';

-- ============================================================================
-- VIEW: Brand Performance Summary (Rolling Periods)
-- ============================================================================
-- Used for: Dashboard stat cards, rankings, competitive analysis
-- ============================================================================

CREATE MATERIALIZED VIEW brand_performance_summary AS
WITH period_metrics AS (
  SELECT
    account_brand_id,
    primary_brand_id,
    brand_competitor_id,
    brand_name,
    is_primary_brand,
    account_id,
    
    -- Period indicators
    '7d' as period,
    COUNT(DISTINCT response_id) as total_responses,
    COUNT(DISTINCT prompt_id) as total_prompts,
    
    -- Core metrics
    ROUND((COUNT(*) FILTER (WHERE brand_mentioned)::NUMERIC / COUNT(*)::NUMERIC * 100), 2) as mention_rate,
    ROUND(AVG(brand_first_position) FILTER (WHERE brand_first_position IS NOT NULL), 2) as avg_position,
    ROUND(AVG(brand_sentiment) FILTER (WHERE brand_mentioned), 3) as avg_sentiment,
    ROUND((COUNT(*) FILTER (WHERE brand_cited)::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE brand_mentioned), 0)::NUMERIC * 100), 2) as citation_rate,
    ROUND(AVG(share_of_voice) FILTER (WHERE brand_mentioned), 2) as share_of_voice,
    
    -- Counts
    COUNT(*) FILTER (WHERE brand_mentioned) as mention_count,
    COUNT(*) FILTER (WHERE brand_first_position = 1) as first_position_count,
    COUNT(*) FILTER (WHERE brand_cited) as citation_count,
    
    MAX(analyzed_at) as last_updated
    
  FROM response_analysis
  WHERE analyzed_at >= NOW() - INTERVAL '7 days'
  GROUP BY 1,2,3,4,5,6
  
  UNION ALL
  
  SELECT
    account_brand_id,
    primary_brand_id,
    brand_competitor_id,
    brand_name,
    is_primary_brand,
    account_id,
    '30d' as period,
    COUNT(DISTINCT response_id),
    COUNT(DISTINCT prompt_id),
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
    account_brand_id,
    primary_brand_id,
    brand_competitor_id,
    brand_name,
    is_primary_brand,
    account_id,
    '90d' as period,
    COUNT(DISTINCT response_id),
    COUNT(DISTINCT prompt_id),
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
SELECT
  *,
  -- Calculate LVI score
  calculate_lvi_score(mention_rate, citation_rate, avg_sentiment, avg_position) as lvi_score,
  NOW() as materialized_at
FROM period_metrics;

-- Create indexes
CREATE INDEX idx_brand_perf_summary_brand_period ON brand_performance_summary(account_brand_id, period);
CREATE INDEX idx_brand_perf_summary_account ON brand_performance_summary(account_id, period);
CREATE INDEX idx_brand_perf_summary_primary ON brand_performance_summary(is_primary_brand, account_id);
CREATE INDEX idx_brand_perf_summary_lvi ON brand_performance_summary(lvi_score DESC);

COMMENT ON MATERIALIZED VIEW brand_performance_summary IS 'Brand performance metrics for 7d, 30d, 90d rolling periods with LVI scores';

-- ============================================================================
-- VIEW: Topic Brand Matrix
-- ============================================================================
-- Used for: Topic heatmap, competitive topic analysis
-- ============================================================================

CREATE MATERIALIZED VIEW topic_brand_matrix AS
SELECT
  account_brand_id,
  primary_brand_id,
  brand_competitor_id,
  brand_name,
  is_primary_brand,
  account_id,
  
  -- Extract topic from JSONB array
  topic->>'name' as topic_name,
  topic->>'category' as topic_category,
  
  -- Time period
  '30d' as period,
  
  -- Aggregations
  COUNT(*) as mention_count,
  ROUND(AVG((topic->>'relevance')::NUMERIC), 3) as avg_relevance,
  ROUND(AVG((topic->>'sentiment')::NUMERIC), 3) as avg_sentiment,
  ROUND((COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM response_analysis ra2 
    WHERE ra2.account_brand_id = response_analysis.account_brand_id 
    AND ra2.is_primary_brand = response_analysis.is_primary_brand
    AND ra2.analyzed_at >= NOW() - INTERVAL '30 days') * 100), 2) as occurrence_rate,
  
  -- Competitive context
  BOOL_OR(
    NOT EXISTS (
      SELECT 1 FROM response_analysis ra3
      WHERE ra3.response_id = response_analysis.response_id
      AND ra3.id != response_analysis.id
      AND ra3.topics_covered @> jsonb_build_array(topic)
    )
  ) as unique_to_brand,
  
  MAX(analyzed_at) as last_seen,
  NOW() as materialized_at
  
FROM response_analysis
CROSS JOIN LATERAL jsonb_array_elements(topics_covered) as topic
WHERE analyzed_at >= NOW() - INTERVAL '30 days'
  AND brand_mentioned = true
GROUP BY 1,2,3,4,5,6,7,8;

-- Create indexes
CREATE INDEX idx_topic_matrix_brand ON topic_brand_matrix(account_brand_id, topic_name);
CREATE INDEX idx_topic_matrix_account ON topic_brand_matrix(account_id);
CREATE INDEX idx_topic_matrix_relevance ON topic_brand_matrix(avg_relevance DESC);
CREATE INDEX idx_topic_matrix_mentions ON topic_brand_matrix(mention_count DESC);

COMMENT ON MATERIALIZED VIEW topic_brand_matrix IS 'Topic associations per brand for heatmap visualization (30d period)';

-- ============================================================================
-- VIEW: Source Citation Analysis
-- ============================================================================
-- Used for: Source/citation reporting, publisher opportunities
-- ============================================================================

CREATE MATERIALIZED VIEW source_citation_analysis AS
SELECT
  account_brand_id,
  primary_brand_id,
  brand_competitor_id,
  brand_name,
  is_primary_brand,
  account_id,
  
  -- Extract source from JSONB array
  source->>'domain' as source_domain,
  source->>'type' as source_type,
  
  -- Time period
  '30d' as period,
  
  -- Aggregations
  COUNT(*) as citation_count,
  COUNT(DISTINCT response_id) as responses_citing,
  ROUND((COUNT(DISTINCT response_id)::NUMERIC / (SELECT COUNT(DISTINCT response_id) FROM response_analysis ra2 
    WHERE ra2.account_brand_id = response_analysis.account_brand_id 
    AND ra2.is_primary_brand = response_analysis.is_primary_brand
    AND ra2.analyzed_at >= NOW() - INTERVAL '30 days') * 100), 2) as usage_frequency,
  
  -- Position metrics
  ROUND(AVG((source->>'position')::INTEGER), 2) as avg_citation_position,
  COUNT(*) FILTER (WHERE (source->>'position')::INTEGER = 1) as first_citation_count,
  
  -- Competitive analysis
  BOOL_OR(
    NOT EXISTS (
      SELECT 1 FROM response_analysis ra3
      WHERE ra3.response_id = response_analysis.response_id
      AND ra3.id != response_analysis.id
      AND ra3.sources_cited @> jsonb_build_array(source)
    )
  ) as cites_brand_exclusively,
  
  -- Sample contexts (collect all, limit in application layer)
  array_agg(DISTINCT source->>'context') FILTER (WHERE source->>'context' IS NOT NULL) as sample_contexts,
  
  MAX(analyzed_at) as last_cited,
  NOW() as materialized_at
  
FROM response_analysis
CROSS JOIN LATERAL jsonb_array_elements(sources_cited) as source
WHERE analyzed_at >= NOW() - INTERVAL '30 days'
  AND brand_cited = true
GROUP BY 1,2,3,4,5,6,7,8;

-- Create indexes
CREATE INDEX idx_source_citation_brand ON source_citation_analysis(account_brand_id, source_domain);
CREATE INDEX idx_source_citation_account ON source_citation_analysis(account_id);
CREATE INDEX idx_source_citation_count ON source_citation_analysis(citation_count DESC);
CREATE INDEX idx_source_citation_usage ON source_citation_analysis(usage_frequency DESC);

COMMENT ON MATERIALIZED VIEW source_citation_analysis IS 'Source and citation metrics per brand (30d period)';

-- ============================================================================
-- VIEW: Prompt Performance Analysis
-- ============================================================================
-- Used for: Prompt-by-prompt analysis, opportunity identification
-- ============================================================================

CREATE MATERIALIZED VIEW prompt_performance_analysis AS
WITH prompt_brands AS (
  SELECT
    prompt_id,
    prompt_text,
    prompt_category,
    prompt_intent,
    account_brand_id,
    account_id,
    
    -- Primary brand metrics
    MAX(CASE WHEN is_primary_brand THEN brand_name END) as primary_brand_name,
    COUNT(*) FILTER (WHERE is_primary_brand) as primary_responses,
    BOOL_OR(brand_mentioned AND is_primary_brand) as primary_mentioned,
    ROUND(AVG(brand_first_position) FILTER (WHERE is_primary_brand AND brand_mentioned), 2) as primary_avg_position,
    ROUND(AVG(brand_sentiment) FILTER (WHERE is_primary_brand AND brand_mentioned), 3) as primary_sentiment,
    ROUND(AVG(share_of_voice) FILTER (WHERE is_primary_brand AND brand_mentioned), 2) as primary_sov,
    
    -- Competitor metrics
    COUNT(DISTINCT brand_competitor_id) as competitors_count,
    array_agg(DISTINCT brand_name) FILTER (WHERE NOT is_primary_brand AND brand_mentioned) as competitors_mentioned,
    MIN(brand_first_position) FILTER (WHERE NOT is_primary_brand AND brand_mentioned) as best_competitor_position,
    
    -- Opportunity scoring
    CASE
      WHEN NOT BOOL_OR(brand_mentioned AND is_primary_brand) 
           AND COUNT(*) FILTER (WHERE NOT is_primary_brand AND brand_mentioned) > 0
        THEN 'opportunity' -- Competitors mentioned, we're not
      WHEN BOOL_OR(brand_mentioned AND is_primary_brand)
           AND (SELECT AVG(brand_first_position) FROM response_analysis ra_sub 
                WHERE ra_sub.prompt_id = response_analysis.prompt_id 
                AND ra_sub.is_primary_brand AND ra_sub.brand_mentioned) <= 3
        THEN 'strength' -- We're in top 3
      WHEN BOOL_OR(brand_mentioned AND is_primary_brand)
        THEN 'threat' -- Competitors may outrank us
      ELSE 'neutral'
    END as strategic_classification,
    
    MAX(analyzed_at) as last_analyzed
    
  FROM response_analysis
  WHERE analyzed_at >= NOW() - INTERVAL '30 days'
  GROUP BY prompt_id, prompt_text, prompt_category, prompt_intent, account_brand_id, account_id
)
SELECT
  *,
  -- Calculate opportunity score (0-100)
  CASE
    WHEN strategic_classification = 'opportunity' THEN 
      LEAST(100, 50 + (competitors_count * 10))
    WHEN strategic_classification = 'threat' THEN
      GREATEST(0, 50 - (primary_avg_position * 5))
    WHEN strategic_classification = 'strength' THEN
      GREATEST(70, 100 - (primary_avg_position * 10))
    ELSE 30
  END as opportunity_score,
  
  '30d' as period,
  NOW() as materialized_at
FROM prompt_brands;

-- Create indexes
CREATE INDEX idx_prompt_perf_brand ON prompt_performance_analysis(account_brand_id);
CREATE INDEX idx_prompt_perf_account ON prompt_performance_analysis(account_id);
CREATE INDEX idx_prompt_perf_classification ON prompt_performance_analysis(strategic_classification);
CREATE INDEX idx_prompt_perf_opportunity ON prompt_performance_analysis(opportunity_score DESC);

COMMENT ON MATERIALIZED VIEW prompt_performance_analysis IS 'Prompt-by-prompt performance with opportunities, threats, and strengths (30d period)';

-- ============================================================================
-- STEP 5: CREATE REFRESH FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_all_report_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_brand_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY brand_performance_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY topic_brand_matrix;
  REFRESH MATERIALIZED VIEW CONCURRENTLY source_citation_analysis;
  REFRESH MATERIALIZED VIEW CONCURRENTLY prompt_performance_analysis;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_all_report_views IS 'Refresh all materialized views for reports. Run after new analysis data is added.';

-- ============================================================================
-- STEP 6: CREATE API HELPER FUNCTIONS
-- ============================================================================

-- ============================================================================
-- FUNCTION: Get Report Stats
-- ============================================================================
CREATE OR REPLACE FUNCTION get_report_stats(
  p_brand_id UUID,
  p_period TEXT DEFAULT '30d',
  p_include_competitors BOOLEAN DEFAULT true
)
RETURNS TABLE (
  brand_name VARCHAR,
  is_primary BOOLEAN,
  mention_rate NUMERIC,
  avg_position NUMERIC,
  avg_sentiment NUMERIC,
  citation_rate NUMERIC,
  share_of_voice NUMERIC,
  lvi_score NUMERIC,
  total_responses BIGINT,
  mention_count BIGINT,
  first_position_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bps.brand_name,
    bps.is_primary_brand,
    bps.mention_rate,
    bps.avg_position,
    bps.avg_sentiment,
    bps.citation_rate,
    bps.share_of_voice,
    bps.lvi_score,
    bps.total_responses,
    bps.mention_count,
    bps.first_position_count
  FROM brand_performance_summary bps
  WHERE bps.account_brand_id = p_brand_id
    AND bps.period = p_period
    AND (p_include_competitors OR bps.is_primary_brand = true)
  ORDER BY bps.is_primary_brand DESC, bps.lvi_score DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_report_stats IS 'Get brand performance stats for report stat cards';

-- ============================================================================
-- FUNCTION: Get Industry Rankings
-- ============================================================================
CREATE OR REPLACE FUNCTION get_industry_rankings(
  p_brand_id UUID,
  p_period TEXT DEFAULT '30d',
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  rank INTEGER,
  brand_name VARCHAR,
  is_primary BOOLEAN,
  lvi_score NUMERIC,
  mention_rate NUMERIC,
  avg_position NUMERIC,
  avg_sentiment NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_brands AS (
    SELECT
      bps.brand_name,
      bps.is_primary_brand,
      bps.lvi_score,
      bps.mention_rate,
      bps.avg_position,
      bps.avg_sentiment,
      ROW_NUMBER() OVER (ORDER BY bps.lvi_score DESC) as rank_num
    FROM brand_performance_summary bps
    WHERE bps.account_brand_id = p_brand_id
      AND bps.period = p_period
  )
  SELECT
    rank_num::INTEGER,
    brand_name,
    is_primary_brand,
    lvi_score,
    mention_rate,
    avg_position,
    avg_sentiment
  FROM ranked_brands
  ORDER BY rank_num
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_industry_rankings IS 'Get industry rankings by LVI score';

-- ============================================================================
-- FUNCTION: Get Time Series Data
-- ============================================================================
CREATE OR REPLACE FUNCTION get_timeseries_data(
  p_brand_id UUID,
  p_days INTEGER DEFAULT 30,
  p_include_competitors BOOLEAN DEFAULT true
)
RETURNS TABLE (
  metric_date DATE,
  brand_name VARCHAR,
  is_primary BOOLEAN,
  mention_rate NUMERIC,
  avg_position NUMERIC,
  avg_sentiment NUMERIC,
  citation_rate NUMERIC,
  lvi_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dbm.metric_date,
    dbm.brand_name,
    dbm.is_primary_brand,
    dbm.mention_rate,
    dbm.avg_position,
    dbm.avg_sentiment,
    dbm.citation_rate,
    calculate_lvi_score(dbm.mention_rate, dbm.citation_rate, dbm.avg_sentiment, dbm.avg_position) as lvi_score
  FROM daily_brand_metrics dbm
  WHERE dbm.account_brand_id = p_brand_id
    AND dbm.metric_date >= CURRENT_DATE - p_days
    AND (p_include_competitors OR dbm.is_primary_brand = true)
  ORDER BY dbm.metric_date, dbm.is_primary_brand DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_timeseries_data IS 'Get daily time series data for charts';

-- ============================================================================
-- STEP 7: GRANT PERMISSIONS
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT ON response_analysis TO authenticated;
GRANT SELECT ON daily_brand_metrics TO authenticated;
GRANT SELECT ON brand_performance_summary TO authenticated;
GRANT SELECT ON topic_brand_matrix TO authenticated;
GRANT SELECT ON source_citation_analysis TO authenticated;
GRANT SELECT ON prompt_performance_analysis TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION calculate_lvi_score TO authenticated;
GRANT EXECUTE ON FUNCTION get_report_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_industry_rankings TO authenticated;
GRANT EXECUTE ON FUNCTION get_timeseries_data TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_all_report_views TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary:
-- ✅ Dropped all old analysis tables
-- ✅ Created response_analysis as single source of truth
-- ✅ Created materialized views for aggregated reporting
-- ✅ Created LVI calculation function
-- ✅ Created API helper functions for reports
-- ✅ Added proper indexes and RLS policies
-- 
-- Next steps:
-- 1. Set up cron job to refresh materialized views hourly
-- 2. Import analysis data from sim.ai workflow into response_analysis
-- 3. Test API endpoints with new schema
-- 4. Update frontend components to use new API structure
