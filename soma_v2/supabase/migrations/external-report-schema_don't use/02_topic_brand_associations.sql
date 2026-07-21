-- ============================================================================
-- Topic-Brand Associations Table
-- ============================================================================
-- Stores aggregated topic associations for brands across all responses
-- Used for: Brand-topic heatmap, competitive topic analysis
-- This replaces individual topic_insights with aggregated data
-- ============================================================================

CREATE TABLE IF NOT EXISTS topic_brand_associations (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  simulation_id UUID REFERENCES llm_simulations(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,
  
  -- Brand Info
  brand_name VARCHAR(255) NOT NULL,
  is_primary_brand BOOLEAN NOT NULL DEFAULT false,
  
  -- Topic Info
  topic_name VARCHAR(255) NOT NULL,
  topic_category VARCHAR(100), -- 'product', 'feature', 'use-case', 'industry', etc.
  topic_keywords TEXT[], -- Related keywords/synonyms
  
  -- Association Metrics
  mention_count INTEGER DEFAULT 0, -- Times this topic appeared with this brand
  co_occurrence_rate NUMERIC(5,2) DEFAULT 0, -- % of brand mentions that include this topic
  relevance_score NUMERIC(5,2) DEFAULT 0, -- 0-100, how strongly associated
  
  -- Context Analysis
  positive_context_count INTEGER DEFAULT 0, -- Times mentioned in positive context
  negative_context_count INTEGER DEFAULT 0,
  neutral_context_count INTEGER DEFAULT 0,
  avg_sentiment_when_mentioned NUMERIC(3,2) DEFAULT 0, -- -1 to 1
  
  -- Competitive Context
  unique_to_brand BOOLEAN DEFAULT false, -- True if only this brand mentioned with topic
  shared_with_competitors TEXT[], -- Other brands also mentioned with this topic
  competitive_advantage_score NUMERIC(5,2) DEFAULT 0, -- 0-100, exclusivity measure
  
  -- Position Analysis
  avg_position_when_mentioned NUMERIC(5,2), -- Where in response topic+brand appear
  appears_in_intro BOOLEAN DEFAULT false, -- First paragraph
  appears_in_conclusion BOOLEAN DEFAULT false, -- Last paragraph
  
  -- Model Breakdown
  model_breakdown JSONB DEFAULT '{}'::jsonb, -- { "gpt-4": 15, "claude": 12, ... }
  
  -- Time Period
  metric_period VARCHAR(20) NOT NULL DEFAULT '30d',
  period_start_date TIMESTAMP WITH TIME ZONE,
  period_end_date TIMESTAMP WITH TIME ZONE,
  
  -- Trend Analysis
  mention_count_change INTEGER DEFAULT 0, -- Change vs previous period
  relevance_change NUMERIC(5,2) DEFAULT 0,
  trend_direction VARCHAR(20), -- 'growing', 'declining', 'stable'
  
  -- Sample Contexts (for UI display)
  sample_contexts JSONB DEFAULT '[]'::jsonb, -- Array of example sentences
  
  -- Metadata
  total_responses_analyzed INTEGER DEFAULT 0,
  confidence_score NUMERIC(3,2) DEFAULT 1.0,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint
  CONSTRAINT unique_topic_brand_period UNIQUE(brand_name, topic_name, metric_period, simulation_id)
);

-- Indexes
CREATE INDEX idx_topic_brand_account ON topic_brand_associations(account_id);
CREATE INDEX idx_topic_brand_simulation ON topic_brand_associations(simulation_id);
CREATE INDEX idx_topic_brand_brand_id ON topic_brand_associations(brand_id);
CREATE INDEX idx_topic_brand_competitor_id ON topic_brand_associations(competitor_id);
CREATE INDEX idx_topic_brand_name ON topic_brand_associations(brand_name);
CREATE INDEX idx_topic_brand_topic ON topic_brand_associations(topic_name);
CREATE INDEX idx_topic_brand_relevance ON topic_brand_associations(relevance_score DESC);
CREATE INDEX idx_topic_brand_mentions ON topic_brand_associations(mention_count DESC);
CREATE INDEX idx_topic_brand_period ON topic_brand_associations(metric_period, period_end_date DESC);
CREATE INDEX idx_topic_brand_primary ON topic_brand_associations(is_primary_brand, account_id);
CREATE INDEX idx_topic_brand_category ON topic_brand_associations(topic_category);

-- GIN indexes for arrays and JSONB
CREATE INDEX idx_topic_brand_keywords_gin ON topic_brand_associations USING gin(topic_keywords);
CREATE INDEX idx_topic_brand_shared_gin ON topic_brand_associations USING gin(shared_with_competitors);
CREATE INDEX idx_topic_brand_model_breakdown_gin ON topic_brand_associations USING gin(model_breakdown);
CREATE INDEX idx_topic_brand_samples_gin ON topic_brand_associations USING gin(sample_contexts);

-- RLS Policies
ALTER TABLE topic_brand_associations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view topic associations for their accounts"
  ON topic_brand_associations FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert topic associations for their accounts"
  ON topic_brand_associations FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update topic associations for their accounts"
  ON topic_brand_associations FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Trigger
CREATE TRIGGER topic_brand_associations_updated_at
  BEFORE UPDATE ON topic_brand_associations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE topic_brand_associations IS 'Aggregated topic associations for brands and competitors used in heatmap analysis';
COMMENT ON COLUMN topic_brand_associations.co_occurrence_rate IS 'Percentage of brand mentions that include this topic (0-100)';
COMMENT ON COLUMN topic_brand_associations.relevance_score IS 'Overall strength of brand-topic association (0-100)';
COMMENT ON COLUMN topic_brand_associations.competitive_advantage_score IS 'Measures topic exclusivity to brand vs competitors (0-100)';
