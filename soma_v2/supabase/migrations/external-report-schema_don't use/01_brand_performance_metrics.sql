-- ============================================================================
-- Brand Performance Metrics Table
-- ============================================================================
-- Aggregated performance metrics per brand across all prompts and models
-- Used for: Stats cards, industry rankings, competitive analysis
-- Updated: Periodically via aggregation job or materialized view refresh
-- ============================================================================

CREATE TABLE IF NOT EXISTS brand_performance_metrics (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  simulation_id UUID REFERENCES llm_simulations(id) ON DELETE CASCADE,
  
  -- Brand Info
  brand_name VARCHAR(255) NOT NULL,
  is_primary_brand BOOLEAN NOT NULL DEFAULT false,
  
  -- Time Period
  metric_period VARCHAR(20) NOT NULL DEFAULT '30d', -- '7d', '30d', '90d', 'all'
  period_start_date TIMESTAMP WITH TIME ZONE,
  period_end_date TIMESTAMP WITH TIME ZONE,
  
  -- Core Visibility Metrics
  total_prompts_analyzed INTEGER DEFAULT 0,
  total_responses_analyzed INTEGER DEFAULT 0,
  total_mentions INTEGER DEFAULT 0,
  mention_rate NUMERIC(5,2) DEFAULT 0, -- % of responses where brand was mentioned
  
  -- Ranking Metrics
  avg_ranking_position NUMERIC(5,2), -- Average position when mentioned (1 = first)
  top_3_mentions INTEGER DEFAULT 0, -- Count of times ranked in top 3
  top_5_mentions INTEGER DEFAULT 0,
  top_10_mentions INTEGER DEFAULT 0,
  first_position_count INTEGER DEFAULT 0, -- Times ranked #1
  
  -- Sentiment Metrics
  avg_sentiment_score NUMERIC(3,2) DEFAULT 0, -- -1 to 1
  positive_mentions INTEGER DEFAULT 0, -- sentiment > 0.6
  neutral_mentions INTEGER DEFAULT 0, -- sentiment 0.3 to 0.6
  negative_mentions INTEGER DEFAULT 0, -- sentiment < 0.3
  sentiment_distribution JSONB DEFAULT '{"positive": 0, "neutral": 0, "negative": 0}'::jsonb,
  
  -- Citation Metrics
  total_citations INTEGER DEFAULT 0,
  direct_citations INTEGER DEFAULT 0,
  citation_rate NUMERIC(5,2) DEFAULT 0, -- % of mentions with citations
  avg_citations_per_mention NUMERIC(5,2) DEFAULT 0,
  
  -- Share of Voice (SOV)
  share_of_voice NUMERIC(5,2) DEFAULT 0, -- % of total brand mentions in industry
  sov_vs_top_competitor NUMERIC(5,2) DEFAULT 0, -- Difference from #1 competitor
  
  -- LVI Score
  lvi_score NUMERIC(5,2) DEFAULT 0, -- LLM Visibility Index (0-100)
  lvi_visibility_component NUMERIC(5,2) DEFAULT 0,
  lvi_citation_component NUMERIC(5,2) DEFAULT 0,
  lvi_sentiment_component NUMERIC(5,2) DEFAULT 0,
  lvi_position_component NUMERIC(5,2) DEFAULT 0,
  
  -- Model Breakdown
  model_performance JSONB DEFAULT '{}'::jsonb, -- { "gpt-4": { "mentions": 10, "avg_rank": 2.3 }, ... }
  
  -- Trend Indicators
  mention_rate_change NUMERIC(5,2) DEFAULT 0, -- % change vs previous period
  sentiment_change NUMERIC(5,2) DEFAULT 0,
  lvi_change NUMERIC(5,2) DEFAULT 0,
  ranking_change NUMERIC(5,2) DEFAULT 0,
  trend_direction VARCHAR(20), -- 'improving', 'declining', 'stable'
  
  -- Competitive Positioning
  industry_rank INTEGER, -- Overall rank in industry (1 = best)
  rank_change INTEGER DEFAULT 0, -- Change from previous period (negative = improvement)
  visibility_percentile NUMERIC(5,2), -- Where brand falls vs all competitors (0-100)
  
  -- Metadata
  calculation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_quality_score NUMERIC(3,2) DEFAULT 1.0, -- 0-1, confidence in metrics
  sample_size INTEGER DEFAULT 0, -- Number of responses used for calculation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one metric record per brand per period per simulation
  CONSTRAINT unique_brand_period_simulation UNIQUE(brand_id, metric_period, simulation_id, competitor_id)
);

-- Indexes for performance
CREATE INDEX idx_brand_performance_brand ON brand_performance_metrics(brand_id);
CREATE INDEX idx_brand_performance_account ON brand_performance_metrics(account_id);
CREATE INDEX idx_brand_performance_simulation ON brand_performance_metrics(simulation_id);
CREATE INDEX idx_brand_performance_competitor ON brand_performance_metrics(competitor_id);
CREATE INDEX idx_brand_performance_period ON brand_performance_metrics(metric_period, period_end_date DESC);
CREATE INDEX idx_brand_performance_lvi ON brand_performance_metrics(lvi_score DESC);
CREATE INDEX idx_brand_performance_mention_rate ON brand_performance_metrics(mention_rate DESC);
CREATE INDEX idx_brand_performance_rank ON brand_performance_metrics(industry_rank);
CREATE INDEX idx_brand_performance_primary ON brand_performance_metrics(is_primary_brand, account_id);
CREATE INDEX idx_brand_performance_updated ON brand_performance_metrics(updated_at DESC);

-- GIN indexes for JSONB columns
CREATE INDEX idx_brand_performance_model_perf_gin ON brand_performance_metrics USING gin(model_performance);
CREATE INDEX idx_brand_performance_sentiment_dist_gin ON brand_performance_metrics USING gin(sentiment_distribution);

-- RLS Policies
ALTER TABLE brand_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view performance metrics for their accounts"
  ON brand_performance_metrics FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert performance metrics for their accounts"
  ON brand_performance_metrics FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update performance metrics for their accounts"
  ON brand_performance_metrics FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER brand_performance_metrics_updated_at
  BEFORE UPDATE ON brand_performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE brand_performance_metrics IS 'Aggregated performance metrics for brands and competitors across all analyzed prompts and models';
COMMENT ON COLUMN brand_performance_metrics.is_primary_brand IS 'True if this is the main brand being analyzed, false for competitors';
COMMENT ON COLUMN brand_performance_metrics.metric_period IS 'Time period for aggregation: 7d, 30d, 90d, or all';
COMMENT ON COLUMN brand_performance_metrics.mention_rate IS 'Percentage of responses where the brand was mentioned (0-100)';
COMMENT ON COLUMN brand_performance_metrics.lvi_score IS 'LLM Visibility Index: composite score of visibility, citations, sentiment, position (0-100)';
COMMENT ON COLUMN brand_performance_metrics.share_of_voice IS 'Percentage of total brand mentions in the industry (0-100)';
