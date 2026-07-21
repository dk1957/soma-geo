-- ============================================================================
-- Brand Metrics Time Series Table
-- ============================================================================
-- Daily/hourly snapshots of brand performance for trend analysis
-- Used for: LVI trend chart, analytics chart with time-based filtering
-- Enables historical comparison and trend visualization
-- ============================================================================

CREATE TABLE IF NOT EXISTS brand_metrics_timeseries (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  simulation_id UUID REFERENCES llm_simulations(id) ON DELETE CASCADE,
  
  -- Brand Info
  brand_name VARCHAR(255) NOT NULL,
  is_primary_brand BOOLEAN NOT NULL DEFAULT false,
  
  -- Time Dimension
  snapshot_date DATE NOT NULL,
  snapshot_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  time_granularity VARCHAR(20) NOT NULL DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'
  
  -- Core Metrics (point-in-time)
  lvi_score NUMERIC(5,2) DEFAULT 0,
  mention_rate NUMERIC(5,2) DEFAULT 0,
  avg_sentiment NUMERIC(3,2) DEFAULT 0,
  avg_ranking NUMERIC(5,2),
  citation_rate NUMERIC(5,2) DEFAULT 0,
  share_of_voice NUMERIC(5,2) DEFAULT 0,
  
  -- Volume Metrics
  total_mentions INTEGER DEFAULT 0,
  total_responses INTEGER DEFAULT 0,
  total_citations INTEGER DEFAULT 0,
  
  -- Position Metrics
  top_3_count INTEGER DEFAULT 0,
  first_position_count INTEGER DEFAULT 0,
  
  -- Sentiment Breakdown
  positive_mentions INTEGER DEFAULT 0,
  neutral_mentions INTEGER DEFAULT 0,
  negative_mentions INTEGER DEFAULT 0,
  
  -- Model Performance
  models_analyzed TEXT[], -- List of models included in this snapshot
  model_metrics JSONB DEFAULT '{}'::jsonb, -- Per-model breakdown
  
  -- Competitive Metrics
  industry_rank INTEGER,
  competitors_analyzed INTEGER DEFAULT 0,
  
  -- Delta from Previous Period
  lvi_delta NUMERIC(5,2) DEFAULT 0,
  mention_rate_delta NUMERIC(5,2) DEFAULT 0,
  sentiment_delta NUMERIC(3,2) DEFAULT 0,
  ranking_delta NUMERIC(5,2) DEFAULT 0,
  rank_position_delta INTEGER DEFAULT 0,
  
  -- Data Quality
  responses_in_snapshot INTEGER DEFAULT 0, -- Number of responses used
  prompts_in_snapshot INTEGER DEFAULT 0,
  data_completeness NUMERIC(3,2) DEFAULT 1.0, -- 0-1
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one snapshot per brand per day (or hour)
  CONSTRAINT unique_brand_snapshot UNIQUE(brand_id, competitor_id, snapshot_date, time_granularity, simulation_id)
);

-- Indexes for time-series queries
CREATE INDEX idx_timeseries_brand ON brand_metrics_timeseries(brand_id);
CREATE INDEX idx_timeseries_account ON brand_metrics_timeseries(account_id);
CREATE INDEX idx_timeseries_simulation ON brand_metrics_timeseries(simulation_id);
CREATE INDEX idx_timeseries_competitor ON brand_metrics_timeseries(competitor_id);
CREATE INDEX idx_timeseries_date ON brand_metrics_timeseries(snapshot_date DESC);
CREATE INDEX idx_timeseries_timestamp ON brand_metrics_timeseries(snapshot_timestamp DESC);
CREATE INDEX idx_timeseries_brand_date ON brand_metrics_timeseries(brand_id, snapshot_date DESC);
CREATE INDEX idx_timeseries_account_date ON brand_metrics_timeseries(account_id, snapshot_date DESC);
CREATE INDEX idx_timeseries_primary_date ON brand_metrics_timeseries(is_primary_brand, snapshot_date DESC);
CREATE INDEX idx_timeseries_lvi ON brand_metrics_timeseries(lvi_score);
CREATE INDEX idx_timeseries_granularity ON brand_metrics_timeseries(time_granularity, snapshot_date DESC);

-- GIN index for JSONB
CREATE INDEX idx_timeseries_model_metrics_gin ON brand_metrics_timeseries USING gin(model_metrics);
CREATE INDEX idx_timeseries_models_analyzed_gin ON brand_metrics_timeseries USING gin(models_analyzed);

-- RLS Policies
ALTER TABLE brand_metrics_timeseries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view timeseries for their accounts"
  ON brand_metrics_timeseries FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert timeseries for their accounts"
  ON brand_metrics_timeseries FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Comments
COMMENT ON TABLE brand_metrics_timeseries IS 'Daily/hourly snapshots of brand performance metrics for trend analysis and charting';
COMMENT ON COLUMN brand_metrics_timeseries.snapshot_date IS 'Date of this snapshot (for daily granularity)';
COMMENT ON COLUMN brand_metrics_timeseries.time_granularity IS 'Time resolution: hourly, daily, or weekly';
COMMENT ON COLUMN brand_metrics_timeseries.lvi_delta IS 'Change in LVI score from previous snapshot';
COMMENT ON COLUMN brand_metrics_timeseries.data_completeness IS 'Quality indicator: 1.0 = full data, <1.0 = partial data';

-- ============================================================================
-- Materialized View: Latest Brand Metrics
-- ============================================================================
-- Provides fast access to most recent metrics without scanning full timeseries
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS brand_metrics_latest AS
SELECT DISTINCT ON (brand_id, competitor_id, is_primary_brand)
  *
FROM brand_metrics_timeseries
ORDER BY brand_id, competitor_id, is_primary_brand, snapshot_timestamp DESC;

-- Indexes on materialized view
CREATE UNIQUE INDEX idx_brand_metrics_latest_unique 
  ON brand_metrics_latest(brand_id, COALESCE(competitor_id, '00000000-0000-0000-0000-000000000000'::uuid), is_primary_brand);
CREATE INDEX idx_brand_metrics_latest_account ON brand_metrics_latest(account_id);
CREATE INDEX idx_brand_metrics_latest_lvi ON brand_metrics_latest(lvi_score DESC);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_brand_metrics_latest()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY brand_metrics_latest;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON MATERIALIZED VIEW brand_metrics_latest IS 'Latest metrics snapshot for each brand - refresh periodically';
