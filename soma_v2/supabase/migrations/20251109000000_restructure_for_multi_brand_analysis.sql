-- ============================================================================
-- Multi-Brand Daily Analysis Schema Restructure
-- ============================================================================
-- Purpose: Enable comprehensive daily analysis for primary brand + all competitors
-- with proper benchmarking, topics, sources, and all GEO metrics
-- 
-- Key Changes:
-- 1. Rename "primary_brand_*" columns to brand-agnostic names
-- 2. Create brand_daily_analysis table for daily snapshots
-- 3. Create brand_topic_analysis table for topic tracking
-- 4. Create brand_source_analysis table for citation tracking
-- 5. Support multiple brands per response (primary + competitors)
-- ============================================================================

-- ============================================================================
-- STEP 1: Create new brand_daily_analysis table
-- ============================================================================
-- This table stores daily aggregated metrics for each brand (primary + competitors)
-- enabling easy benchmarking and trend analysis
-- ============================================================================

CREATE TABLE IF NOT EXISTS brand_daily_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  simulation_id UUID REFERENCES llm_simulations(id) ON DELETE CASCADE,
  
  -- Brand Info
  brand_name VARCHAR(255) NOT NULL,
  is_primary_brand BOOLEAN NOT NULL DEFAULT false,
  
  -- Time Dimension
  analysis_date DATE NOT NULL,
  analysis_period VARCHAR(20) DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
  
  -- Volume Metrics
  total_responses_analyzed INTEGER DEFAULT 0,
  total_prompts_analyzed INTEGER DEFAULT 0,
  total_models_tested INTEGER DEFAULT 0,
  
  -- Core GEO Metrics
  
  -- Mentions: Count of brand appearances
  total_mentions INTEGER DEFAULT 0,
  mention_rate NUMERIC(5,2) DEFAULT 0, -- (Responses with mentions / Total responses) × 100
  
  -- Brand Position: Where brand appears in responses
  avg_position NUMERIC(5,2), -- Average position when mentioned
  first_position_count INTEGER DEFAULT 0, -- Times mentioned first
  top_3_count INTEGER DEFAULT 0, -- Times in top 3
  top_5_count INTEGER DEFAULT 0, -- Times in top 5
  positions_array INTEGER[], -- All positions for detailed analysis
  
  -- Sentiment: Tone analysis
  avg_sentiment NUMERIC(3,2) DEFAULT 0, -- -1 to 1 scale
  positive_mention_count INTEGER DEFAULT 0, -- sentiment > 0.6
  neutral_mention_count INTEGER DEFAULT 0, -- sentiment 0.3 to 0.6
  negative_mention_count INTEGER DEFAULT 0, -- sentiment < 0.3
  sentiment_distribution JSONB DEFAULT '{"positive": 0, "neutral": 0, "negative": 0}'::jsonb,
  
  -- Share of Voice (gSOV): Brand's market share in AI responses
  share_of_voice NUMERIC(5,2) DEFAULT 0, -- (Brand mentions / Total brand mentions) × 100
  sov_vs_top_competitor NUMERIC(5,2) DEFAULT 0,
  
  -- Visibility Score: Fundamental presence metric
  visibility_score NUMERIC(5,2) DEFAULT 0, -- (Responses mentioning brand / Total responses) × 100
  
  -- Citation Rate: Source attribution
  total_citations INTEGER DEFAULT 0,
  citation_rate NUMERIC(5,2) DEFAULT 0, -- (Responses with citations / Responses with mentions) × 100
  direct_citations INTEGER DEFAULT 0, -- Explicit links
  formal_citations INTEGER DEFAULT 0, -- Named references
  avg_citations_per_mention NUMERIC(5,2) DEFAULT 0,
  
  -- Factual Consistency Rate
  factual_accuracy_score NUMERIC(5,2) DEFAULT 0, -- (Correct facts / Total facts) × 100
  total_factual_claims INTEGER DEFAULT 0,
  correct_factual_claims INTEGER DEFAULT 0,
  
  -- LLM Visibility Index (LVI): Composite score
  lvi_score NUMERIC(5,2) DEFAULT 0, -- 0-100 composite score
  lvi_visibility_component NUMERIC(5,2) DEFAULT 0, -- 30% weight
  lvi_citation_component NUMERIC(5,2) DEFAULT 0, -- 30% weight
  lvi_sentiment_component NUMERIC(5,2) DEFAULT 0, -- 20% weight
  lvi_position_component NUMERIC(5,2) DEFAULT 0, -- 20% weight
  
  -- Response Quality
  avg_response_completeness NUMERIC(5,2) DEFAULT 0,
  avg_response_length INTEGER DEFAULT 0,
  
  -- Model Performance Breakdown
  model_breakdown JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "gpt-4": {"mentions": 10, "avg_position": 2.3, "sentiment": 0.8, "citations": 5},
  --   "claude": {"mentions": 8, "avg_position": 3.1, "sentiment": 0.7, "citations": 4}
  -- }
  
  -- Competitive Context
  industry_rank INTEGER,
  rank_vs_previous_day INTEGER DEFAULT 0,
  competitive_threat_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
  
  -- Metadata
  data_quality_score NUMERIC(3,2) DEFAULT 1.0,
  sample_size INTEGER DEFAULT 0,
  calculation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_brand_daily_analysis UNIQUE(brand_id, competitor_id, analysis_date, simulation_id),
  CONSTRAINT valid_sentiment CHECK (avg_sentiment >= -1 AND avg_sentiment <= 1),
  CONSTRAINT valid_lvi CHECK (lvi_score >= 0 AND lvi_score <= 100),
  CONSTRAINT valid_percentages CHECK (
    mention_rate >= 0 AND mention_rate <= 100 AND
    share_of_voice >= 0 AND share_of_voice <= 100 AND
    visibility_score >= 0 AND visibility_score <= 100 AND
    citation_rate >= 0 AND citation_rate <= 100
  )
);

-- Indexes for brand_daily_analysis
CREATE INDEX idx_brand_daily_brand ON brand_daily_analysis(brand_id);
CREATE INDEX idx_brand_daily_competitor ON brand_daily_analysis(competitor_id);
CREATE INDEX idx_brand_daily_account ON brand_daily_analysis(account_id);
CREATE INDEX idx_brand_daily_date ON brand_daily_analysis(analysis_date DESC);
CREATE INDEX idx_brand_daily_brand_date ON brand_daily_analysis(brand_id, analysis_date DESC);
CREATE INDEX idx_brand_daily_lvi ON brand_daily_analysis(lvi_score DESC);
CREATE INDEX idx_brand_daily_mentions ON brand_daily_analysis(total_mentions DESC);
CREATE INDEX idx_brand_daily_sov ON brand_daily_analysis(share_of_voice DESC);
CREATE INDEX idx_brand_daily_primary ON brand_daily_analysis(is_primary_brand, account_id);
CREATE INDEX idx_brand_daily_model_breakdown_gin ON brand_daily_analysis USING gin(model_breakdown);

-- RLS Policies
ALTER TABLE brand_daily_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view daily analysis for their accounts"
  ON brand_daily_analysis FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert daily analysis for their accounts"
  ON brand_daily_analysis FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update daily analysis for their accounts"
  ON brand_daily_analysis FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

COMMENT ON TABLE brand_daily_analysis IS 'Daily aggregated GEO metrics for all brands (primary + competitors) enabling benchmarking';
COMMENT ON COLUMN brand_daily_analysis.mention_rate IS 'Percentage of responses where brand was mentioned (0-100)';
COMMENT ON COLUMN brand_daily_analysis.visibility_score IS 'Fundamental presence metric: (Responses with brand / Total) × 100';
COMMENT ON COLUMN brand_daily_analysis.share_of_voice IS 'Market share in AI: (Brand mentions / Total brand mentions) × 100';
COMMENT ON COLUMN brand_daily_analysis.lvi_score IS 'Composite LVI: (Visibility*0.3) + (Citation*0.3) + (Sentiment*0.2) + (Position*0.2)';
COMMENT ON COLUMN brand_daily_analysis.citation_rate IS 'Percentage of mentions with source attribution (0-100)';
COMMENT ON COLUMN brand_daily_analysis.factual_accuracy_score IS 'Percentage of correct factual claims (0-100)';

-- ============================================================================
-- STEP 2: Create brand_topic_analysis table
-- ============================================================================
-- Tracks topic associations for each brand with usage frequency
-- ============================================================================

CREATE TABLE IF NOT EXISTS brand_topic_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  simulation_id UUID REFERENCES llm_simulations(id) ON DELETE CASCADE,
  
  -- Brand Info
  brand_name VARCHAR(255) NOT NULL,
  is_primary_brand BOOLEAN NOT NULL DEFAULT false,
  
  -- Topic Info
  topic_name VARCHAR(255) NOT NULL,
  topic_category VARCHAR(100), -- 'product', 'feature', 'use-case', 'industry'
  topic_keywords TEXT[],
  
  -- Time Dimension
  analysis_date DATE NOT NULL,
  analysis_period VARCHAR(20) DEFAULT 'daily',
  
  -- Usage Metrics
  mention_count INTEGER DEFAULT 0, -- Times topic+brand appeared together
  co_occurrence_rate NUMERIC(5,2) DEFAULT 0, -- % of brand mentions with this topic
  usage_frequency NUMERIC(5,2) DEFAULT 0, -- Overall usage frequency
  
  -- Context Analysis
  relevance_score NUMERIC(5,2) DEFAULT 0, -- 0-100, topic-brand association strength
  avg_sentiment_when_mentioned NUMERIC(3,2) DEFAULT 0,
  positive_context_count INTEGER DEFAULT 0,
  negative_context_count INTEGER DEFAULT 0,
  neutral_context_count INTEGER DEFAULT 0,
  
  -- Competitive Context
  unique_to_brand BOOLEAN DEFAULT false,
  shared_with_competitors TEXT[],
  competitive_advantage_score NUMERIC(5,2) DEFAULT 0,
  
  -- Position Analysis
  avg_position_when_mentioned NUMERIC(5,2),
  appears_in_intro_count INTEGER DEFAULT 0,
  appears_in_conclusion_count INTEGER DEFAULT 0,
  
  -- Sample Data
  sample_contexts JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  total_responses_analyzed INTEGER DEFAULT 0,
  confidence_score NUMERIC(3,2) DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_brand_topic_daily UNIQUE(brand_id, competitor_id, topic_name, analysis_date, simulation_id)
);

-- Indexes
CREATE INDEX idx_brand_topic_brand ON brand_topic_analysis(brand_id);
CREATE INDEX idx_brand_topic_competitor ON brand_topic_analysis(competitor_id);
CREATE INDEX idx_brand_topic_account ON brand_topic_analysis(account_id);
CREATE INDEX idx_brand_topic_date ON brand_topic_analysis(analysis_date DESC);
CREATE INDEX idx_brand_topic_name ON brand_topic_analysis(topic_name);
CREATE INDEX idx_brand_topic_relevance ON brand_topic_analysis(relevance_score DESC);
CREATE INDEX idx_brand_topic_usage ON brand_topic_analysis(usage_frequency DESC);
CREATE INDEX idx_brand_topic_keywords_gin ON brand_topic_analysis USING gin(topic_keywords);
CREATE INDEX idx_brand_topic_shared_gin ON brand_topic_analysis USING gin(shared_with_competitors);

-- RLS Policies
ALTER TABLE brand_topic_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view topic analysis for their accounts"
  ON brand_topic_analysis FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert topic analysis for their accounts"
  ON brand_topic_analysis FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update topic analysis for their accounts"
  ON brand_topic_analysis FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

COMMENT ON TABLE brand_topic_analysis IS 'Daily topic associations for all brands with usage frequency and competitive context';

-- ============================================================================
-- STEP 3: Create brand_source_analysis table
-- ============================================================================
-- Tracks source citations for each brand (domain-level analysis)
-- ============================================================================

CREATE TABLE IF NOT EXISTS brand_source_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  simulation_id UUID REFERENCES llm_simulations(id) ON DELETE CASCADE,
  
  -- Brand Info
  brand_name VARCHAR(255) NOT NULL,
  is_primary_brand BOOLEAN NOT NULL DEFAULT false,
  
  -- Source Info
  source_domain VARCHAR(255) NOT NULL,
  source_url TEXT,
  source_title TEXT,
  source_type VARCHAR(50), -- 'owned', 'competitor', 'industry', 'news', 'academic', 'social'
  
  -- Time Dimension
  analysis_date DATE NOT NULL,
  analysis_period VARCHAR(20) DEFAULT 'daily',
  
  -- Usage Metrics
  total_citations INTEGER DEFAULT 0,
  unique_responses_citing INTEGER DEFAULT 0,
  usage_frequency NUMERIC(5,2) DEFAULT 0, -- % of responses citing this source
  avg_citations_per_response NUMERIC(5,2) DEFAULT 0,
  
  -- Position Metrics
  avg_citation_position NUMERIC(5,2), -- Where in response citations appear
  first_citation_count INTEGER DEFAULT 0,
  positions_array INTEGER[],
  
  -- Citation Types
  direct_citation_count INTEGER DEFAULT 0, -- Explicit links
  formal_citation_count INTEGER DEFAULT 0, -- Named references
  inline_mention_count INTEGER DEFAULT 0, -- Text mentions without links
  
  -- Authority Metrics
  trust_score NUMERIC(3,2) DEFAULT 0, -- 0-1, domain authority
  is_authoritative BOOLEAN DEFAULT false,
  citation_quality_score NUMERIC(5,2) DEFAULT 0,
  
  -- Context Analysis
  associated_topics TEXT[],
  avg_sentiment_when_cited NUMERIC(3,2) DEFAULT 0,
  
  -- Competitive Context
  cites_brand_exclusively BOOLEAN DEFAULT false,
  also_cites_competitors TEXT[],
  competitive_advantage VARCHAR(50), -- 'exclusive', 'shared', 'disadvantage'
  
  -- Model Breakdown
  model_usage JSONB DEFAULT '{}'::jsonb,
  -- {"gpt-4": 15, "claude": 12, ...}
  
  -- Opportunity Analysis
  is_target_publisher BOOLEAN DEFAULT false,
  partnership_opportunity_score NUMERIC(5,2) DEFAULT 0,
  estimated_reach INTEGER,
  
  -- Sample Data
  sample_contexts JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  total_responses_analyzed INTEGER DEFAULT 0,
  confidence_score NUMERIC(3,2) DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_brand_source_daily UNIQUE(brand_id, competitor_id, source_domain, analysis_date, simulation_id)
);

-- Indexes
CREATE INDEX idx_brand_source_brand ON brand_source_analysis(brand_id);
CREATE INDEX idx_brand_source_competitor ON brand_source_analysis(competitor_id);
CREATE INDEX idx_brand_source_account ON brand_source_analysis(account_id);
CREATE INDEX idx_brand_source_date ON brand_source_analysis(analysis_date DESC);
CREATE INDEX idx_brand_source_domain ON brand_source_analysis(source_domain);
CREATE INDEX idx_brand_source_citations ON brand_source_analysis(total_citations DESC);
CREATE INDEX idx_brand_source_usage ON brand_source_analysis(usage_frequency DESC);
CREATE INDEX idx_brand_source_authoritative ON brand_source_analysis(is_authoritative, trust_score DESC);
CREATE INDEX idx_brand_source_topics_gin ON brand_source_analysis USING gin(associated_topics);
CREATE INDEX idx_brand_source_model_usage_gin ON brand_source_analysis USING gin(model_usage);

-- RLS Policies
ALTER TABLE brand_source_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view source analysis for their accounts"
  ON brand_source_analysis FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert source analysis for their accounts"
  ON brand_source_analysis FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update source analysis for their accounts"
  ON brand_source_analysis FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

COMMENT ON TABLE brand_source_analysis IS 'Daily source/citation analysis for all brands with usage frequency and competitive context';

-- ============================================================================
-- STEP 4: Update response_analysis table (rename primary_brand_* columns)
-- ============================================================================
-- Make column names brand-agnostic since we analyze all brands
-- ============================================================================

-- Add new brand-agnostic columns
ALTER TABLE response_analysis ADD COLUMN IF NOT EXISTS analyzed_brand_id UUID REFERENCES brands(id) ON DELETE CASCADE;
ALTER TABLE response_analysis ADD COLUMN IF NOT EXISTS analyzed_brand_name VARCHAR(255);
ALTER TABLE response_analysis ADD COLUMN IF NOT EXISTS analyzed_competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE;
ALTER TABLE response_analysis ADD COLUMN IF NOT EXISTS is_analyzing_primary_brand BOOLEAN DEFAULT true;

-- Add new metric columns with brand-agnostic names
ALTER TABLE response_analysis ADD COLUMN IF NOT EXISTS brand_mentions INTEGER DEFAULT 0;
ALTER TABLE response_analysis ADD COLUMN IF NOT EXISTS brand_visibility_score NUMERIC(5,2) DEFAULT 0;
ALTER TABLE response_analysis ADD COLUMN IF NOT EXISTS brand_positions INTEGER[] DEFAULT '{}';
ALTER TABLE response_analysis ADD COLUMN IF NOT EXISTS brand_avg_position NUMERIC(5,2);
ALTER TABLE response_analysis ADD COLUMN IF NOT EXISTS brand_first_position INTEGER;
ALTER TABLE response_analysis ADD COLUMN IF NOT EXISTS brand_sentiment NUMERIC(3,2) DEFAULT 0;
ALTER TABLE response_analysis ADD COLUMN IF NOT EXISTS brand_in_lists INTEGER DEFAULT 0;
ALTER TABLE response_analysis ADD COLUMN IF NOT EXISTS brand_best_list_position INTEGER;
ALTER TABLE response_analysis ADD COLUMN IF NOT EXISTS brand_sources INTEGER DEFAULT 0;

-- Create index on new columns
CREATE INDEX IF NOT EXISTS idx_response_analysis_analyzed_brand ON response_analysis(analyzed_brand_id);
CREATE INDEX IF NOT EXISTS idx_response_analysis_analyzed_competitor ON response_analysis(analyzed_competitor_id);
CREATE INDEX IF NOT EXISTS idx_response_analysis_brand_mentions ON response_analysis(brand_mentions DESC);

-- Update existing data to use new columns (copy from primary_brand_* to brand_*)
UPDATE response_analysis 
SET 
  analyzed_brand_id = brand_id,
  analyzed_brand_name = primary_brand_name,
  is_analyzing_primary_brand = true,
  brand_mentions = primary_brand_mentions,
  brand_visibility_score = primary_brand_visibility_score,
  brand_positions = primary_brand_positions,
  brand_avg_position = primary_brand_avg_position,
  brand_first_position = primary_brand_first_position,
  brand_sentiment = primary_brand_sentiment,
  brand_in_lists = primary_brand_in_lists,
  brand_best_list_position = primary_brand_best_list_position,
  brand_sources = primary_brand_sources
WHERE analyzed_brand_id IS NULL;

-- Add comment explaining the restructure
COMMENT ON COLUMN response_analysis.analyzed_brand_id IS 'Brand being analyzed in this record (can be primary brand or competitor)';
COMMENT ON COLUMN response_analysis.is_analyzing_primary_brand IS 'TRUE if analyzing primary brand, FALSE if analyzing competitor';
COMMENT ON COLUMN response_analysis.brand_mentions IS 'Number of times the analyzed brand appears in response';
COMMENT ON COLUMN response_analysis.brand_visibility_score IS 'Visibility score for the analyzed brand (0-100)';

-- ============================================================================
-- STEP 5: Create helper function to populate daily analysis
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_brand_daily_metrics(
  p_account_id UUID,
  p_brand_id UUID,
  p_analysis_date DATE,
  p_simulation_id UUID DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_brand_name VARCHAR(255);
  v_total_responses INTEGER;
BEGIN
  -- Get brand name
  SELECT name INTO v_brand_name FROM brands WHERE id = p_brand_id;
  
  IF v_brand_name IS NULL THEN
    RAISE EXCEPTION 'Brand not found: %', p_brand_id;
  END IF;
  
  -- Get total responses for the day
  SELECT COUNT(DISTINCT ra.response_id) INTO v_total_responses
  FROM response_analysis ra
  WHERE ra.account_id = p_account_id
    AND ra.brand_id = p_brand_id
    AND DATE(ra.analyzed_at) = p_analysis_date
    AND (p_simulation_id IS NULL OR ra.simulation_id = p_simulation_id);
  
  IF v_total_responses = 0 THEN
    RAISE NOTICE 'No responses found for date %', p_analysis_date;
    RETURN;
  END IF;
  
  -- Calculate and insert daily metrics for primary brand
  INSERT INTO brand_daily_analysis (
    brand_id,
    account_id,
    simulation_id,
    brand_name,
    is_primary_brand,
    analysis_date,
    total_responses_analyzed,
    total_prompts_analyzed,
    total_mentions,
    mention_rate,
    avg_position,
    first_position_count,
    top_3_count,
    top_5_count,
    positions_array,
    avg_sentiment,
    positive_mention_count,
    neutral_mention_count,
    negative_mention_count,
    total_citations,
    citation_rate,
    avg_citations_per_mention,
    visibility_score,
    lvi_score,
    lvi_visibility_component,
    lvi_citation_component,
    lvi_sentiment_component,
    lvi_position_component,
    sample_size
  )
  SELECT
    p_brand_id,
    p_account_id,
    p_simulation_id,
    v_brand_name,
    true,
    p_analysis_date,
    COUNT(*),
    COUNT(DISTINCT prompt_id),
    SUM(COALESCE(primary_brand_mentions, 0)),
    ROUND((SUM(CASE WHEN COALESCE(primary_brand_mentions, 0) > 0 THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2),
    ROUND(AVG(NULLIF(primary_brand_avg_position, 0)), 2),
    SUM(CASE WHEN primary_brand_first_position = 1 THEN 1 ELSE 0 END),
    SUM(CASE WHEN primary_brand_first_position <= 3 THEN 1 ELSE 0 END),
    SUM(CASE WHEN primary_brand_first_position <= 5 THEN 1 ELSE 0 END),
    ARRAY_AGG(primary_brand_first_position) FILTER (WHERE primary_brand_first_position IS NOT NULL),
    ROUND(AVG(primary_brand_sentiment), 2),
    SUM(CASE WHEN primary_brand_sentiment > 0.6 THEN 1 ELSE 0 END),
    SUM(CASE WHEN primary_brand_sentiment >= 0.3 AND primary_brand_sentiment <= 0.6 THEN 1 ELSE 0 END),
    SUM(CASE WHEN primary_brand_sentiment < 0.3 THEN 1 ELSE 0 END),
    SUM(COALESCE(primary_brand_sources, 0)),
    ROUND((SUM(primary_brand_sources)::NUMERIC / NULLIF(SUM(primary_brand_mentions), 0) * 100), 2),
    ROUND(AVG(primary_brand_sources::NUMERIC / NULLIF(primary_brand_mentions, 1)), 2),
    ROUND((SUM(CASE WHEN primary_brand_mentions > 0 THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2),
    ROUND(AVG(llm_visibility_index), 2),
    ROUND(AVG(lvi_component_visibility), 2),
    ROUND(AVG(lvi_component_citation), 2),
    ROUND(AVG(lvi_component_sentiment), 2),
    ROUND(AVG(lvi_component_position), 2),
    COUNT(*)
  FROM response_analysis
  WHERE account_id = p_account_id
    AND brand_id = p_brand_id
    AND DATE(analyzed_at) = p_analysis_date
    AND (p_simulation_id IS NULL OR simulation_id = p_simulation_id)
  ON CONFLICT (brand_id, competitor_id, analysis_date, simulation_id)
  DO UPDATE SET
    total_responses_analyzed = EXCLUDED.total_responses_analyzed,
    total_prompts_analyzed = EXCLUDED.total_prompts_analyzed,
    total_mentions = EXCLUDED.total_mentions,
    mention_rate = EXCLUDED.mention_rate,
    avg_position = EXCLUDED.avg_position,
    first_position_count = EXCLUDED.first_position_count,
    top_3_count = EXCLUDED.top_3_count,
    top_5_count = EXCLUDED.top_5_count,
    positions_array = EXCLUDED.positions_array,
    avg_sentiment = EXCLUDED.avg_sentiment,
    positive_mention_count = EXCLUDED.positive_mention_count,
    neutral_mention_count = EXCLUDED.neutral_mention_count,
    negative_mention_count = EXCLUDED.negative_mention_count,
    total_citations = EXCLUDED.total_citations,
    citation_rate = EXCLUDED.citation_rate,
    avg_citations_per_mention = EXCLUDED.avg_citations_per_mention,
    visibility_score = EXCLUDED.visibility_score,
    lvi_score = EXCLUDED.lvi_score,
    lvi_visibility_component = EXCLUDED.lvi_visibility_component,
    lvi_citation_component = EXCLUDED.lvi_citation_component,
    lvi_sentiment_component = EXCLUDED.lvi_sentiment_component,
    lvi_position_component = EXCLUDED.lvi_position_component,
    sample_size = EXCLUDED.sample_size,
    updated_at = NOW();
  
  -- Calculate metrics for each competitor from brands_mentioned JSONB
  WITH competitor_daily_stats AS (
    SELECT
      comp.id as competitor_id,
      comp.competitor_name,
      COUNT(DISTINCT ra.response_id) as total_responses,
      COUNT(DISTINCT ra.prompt_id) as total_prompts,
      SUM((brand_elem->>'mentions')::int) as total_mentions,
      SUM(CASE WHEN (brand_elem->>'mentions')::int > 0 THEN 1 ELSE 0 END) as mention_count,
      AVG(
        CASE 
          WHEN jsonb_array_length(brand_elem->'positions') > 0 
          THEN (
            SELECT AVG(pos::text::int) 
            FROM jsonb_array_elements(brand_elem->'positions') pos
          )
          ELSE NULL
        END
      ) as avg_position,
      SUM(CASE 
        WHEN jsonb_array_length(brand_elem->'positions') > 0 AND
             (brand_elem->'positions'->0)::text::int = 1
        THEN 1 ELSE 0 
      END) as first_position_count,
      SUM(CASE 
        WHEN jsonb_array_length(brand_elem->'positions') > 0 AND
             (brand_elem->'positions'->0)::text::int <= 3
        THEN 1 ELSE 0 
      END) as top_3_count
    FROM response_analysis ra
    CROSS JOIN LATERAL jsonb_array_elements(ra.brands_mentioned) brand_elem
    JOIN competitors comp ON comp.competitor_name = brand_elem->>'name' AND comp.brand_id = p_brand_id
    WHERE ra.account_id = p_account_id
      AND ra.brand_id = p_brand_id
      AND DATE(ra.analyzed_at) = p_analysis_date
      AND (p_simulation_id IS NULL OR ra.simulation_id = p_simulation_id)
    GROUP BY comp.id, comp.competitor_name
  )
  INSERT INTO brand_daily_analysis (
    brand_id,
    competitor_id,
    account_id,
    simulation_id,
    brand_name,
    is_primary_brand,
    analysis_date,
    total_responses_analyzed,
    total_prompts_analyzed,
    total_mentions,
    mention_rate,
    avg_position,
    first_position_count,
    top_3_count,
    visibility_score,
    lvi_score,
    sample_size
  )
  SELECT
    p_brand_id,
    cds.competitor_id,
    p_account_id,
    p_simulation_id,
    cds.competitor_name,
    false,
    p_analysis_date,
    cds.total_responses,
    cds.total_prompts,
    cds.total_mentions,
    ROUND((cds.mention_count::NUMERIC / NULLIF(cds.total_responses, 0) * 100), 2),
    ROUND(cds.avg_position, 2),
    cds.first_position_count,
    cds.top_3_count,
    ROUND((cds.mention_count::NUMERIC / NULLIF(v_total_responses, 0) * 100), 2),
    ROUND((cds.mention_count::NUMERIC / NULLIF(v_total_responses, 0) * 60) + 
          ((100 - COALESCE(cds.avg_position, 100)) * 0.4), 2),
    cds.total_responses
  FROM competitor_daily_stats cds
  ON CONFLICT (brand_id, competitor_id, analysis_date, simulation_id)
  DO UPDATE SET
    total_responses_analyzed = EXCLUDED.total_responses_analyzed,
    total_prompts_analyzed = EXCLUDED.total_prompts_analyzed,
    total_mentions = EXCLUDED.total_mentions,
    mention_rate = EXCLUDED.mention_rate,
    avg_position = EXCLUDED.avg_position,
    first_position_count = EXCLUDED.first_position_count,
    top_3_count = EXCLUDED.top_3_count,
    visibility_score = EXCLUDED.visibility_score,
    lvi_score = EXCLUDED.lvi_score,
    sample_size = EXCLUDED.sample_size,
    updated_at = NOW();
    
  RAISE NOTICE 'Daily metrics calculated for brand % on date %', v_brand_name, p_analysis_date;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_brand_daily_metrics IS 'Calculate and store daily GEO metrics for primary brand and all competitors';

-- ============================================================================
-- Trigger to auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brand_daily_analysis_updated_at
  BEFORE UPDATE ON brand_daily_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER brand_topic_analysis_updated_at
  BEFORE UPDATE ON brand_topic_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER brand_source_analysis_updated_at
  BEFORE UPDATE ON brand_source_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '
  ============================================================================
  Multi-Brand Daily Analysis Schema Created Successfully
  ============================================================================
  
  New Tables:
  1. brand_daily_analysis - Daily metrics for all brands (primary + competitors)
  2. brand_topic_analysis - Topic tracking with usage frequency per brand
  3. brand_source_analysis - Citation tracking with usage frequency per brand
  
  Updated Tables:
  4. response_analysis - Added brand-agnostic columns
  
  New Functions:
  - calculate_brand_daily_metrics() - Calculate daily metrics for all brands
  
  Next Steps:
  1. Run calculate_brand_daily_metrics() for historical data
  2. Set up daily cron job to run analysis
  3. Update report queries to use new tables
  
  ============================================================================
  ';
END $$;
