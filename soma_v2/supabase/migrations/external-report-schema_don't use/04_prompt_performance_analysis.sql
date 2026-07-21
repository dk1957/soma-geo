-- ============================================================================
-- Prompt Performance Analysis Table
-- ============================================================================
-- Aggregated metrics per prompt showing brand and competitor performance
-- Used for: Prompt-by-prompt analysis section, identifying opportunities/gaps
-- Enables filtering by prompt to see competitive landscape per query
-- ============================================================================

CREATE TABLE IF NOT EXISTS prompt_performance_analysis (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES user_prompts(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  simulation_id UUID REFERENCES llm_simulations(id) ON DELETE CASCADE,
  
  -- Prompt Info
  prompt_text TEXT NOT NULL,
  prompt_category VARCHAR(100),
  prompt_intent VARCHAR(100), -- 'transactional', 'informational', 'navigational'
  
  -- Analysis Period
  metric_period VARCHAR(20) NOT NULL DEFAULT '30d',
  period_start_date TIMESTAMP WITH TIME ZONE,
  period_end_date TIMESTAMP WITH TIME ZONE,
  
  -- Overall Metrics
  total_responses INTEGER DEFAULT 0,
  total_models_tested INTEGER DEFAULT 0,
  models_list TEXT[], -- List of models that processed this prompt
  
  -- Primary Brand Performance
  primary_brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  primary_brand_name VARCHAR(255) NOT NULL,
  primary_brand_mentioned BOOLEAN DEFAULT false,
  primary_brand_mention_count INTEGER DEFAULT 0,
  primary_brand_mention_rate NUMERIC(5,2) DEFAULT 0, -- % of responses
  primary_brand_avg_position NUMERIC(5,2),
  primary_brand_best_position INTEGER,
  primary_brand_sentiment NUMERIC(3,2) DEFAULT 0,
  primary_brand_citations INTEGER DEFAULT 0,
  primary_brand_lvi NUMERIC(5,2) DEFAULT 0,
  
  -- Competitive Landscape
  total_brands_mentioned INTEGER DEFAULT 0,
  unique_brands_mentioned TEXT[], -- All brands mentioned in responses
  competitor_mention_count INTEGER DEFAULT 0,
  primary_brand_sov NUMERIC(5,2) DEFAULT 0, -- Share of voice for this prompt
  
  -- Top Competitor Performance (for this specific prompt)
  top_competitor_name VARCHAR(255),
  top_competitor_id UUID REFERENCES competitors(id) ON DELETE SET NULL,
  top_competitor_mentions INTEGER DEFAULT 0,
  top_competitor_avg_position NUMERIC(5,2),
  top_competitor_sentiment NUMERIC(3,2) DEFAULT 0,
  
  -- Gap Analysis
  visibility_gap NUMERIC(5,2) DEFAULT 0, -- Difference from top competitor
  is_opportunity BOOLEAN DEFAULT false, -- True if brand not mentioned but competitors are
  is_strength BOOLEAN DEFAULT false, -- True if brand dominates this prompt
  is_threat BOOLEAN DEFAULT false, -- True if competitors significantly outperform
  opportunity_score NUMERIC(5,2) DEFAULT 0, -- 0-100, revenue potential
  
  -- Model Breakdown
  model_performance JSONB DEFAULT '{}'::jsonb, 
  -- {
  --   "gpt-4": {
  --     "primary_brand_mentioned": true,
  --     "primary_brand_position": 2,
  --     "competitors_mentioned": ["Competitor A", "Competitor B"],
  --     "winner": "Competitor A"
  --   },
  --   ...
  -- }
  
  -- Response Quality
  avg_response_length INTEGER DEFAULT 0, -- Words
  avg_response_completeness NUMERIC(5,2) DEFAULT 0,
  citation_density NUMERIC(5,2) DEFAULT 0, -- Citations per response
  
  -- Topics Associated
  primary_topics TEXT[], -- Main topics in responses to this prompt
  topic_relevance JSONB DEFAULT '{}'::jsonb, -- {"topic": relevance_score}
  
  -- Performance Trends
  mention_rate_trend VARCHAR(20), -- 'improving', 'declining', 'stable'
  sentiment_trend VARCHAR(20),
  position_trend VARCHAR(20),
  
  -- Strategic Classification
  strategic_priority VARCHAR(20), -- 'high', 'medium', 'low'
  action_required VARCHAR(50), -- 'create_content', 'optimize_existing', 'monitor', 'maintain'
  estimated_impact NUMERIC(10,2), -- Estimated revenue/traffic impact
  
  -- Metadata
  last_analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analysis_confidence NUMERIC(3,2) DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint
  CONSTRAINT unique_prompt_period_simulation UNIQUE(prompt_id, metric_period, simulation_id)
);

-- Indexes
CREATE INDEX idx_prompt_perf_prompt ON prompt_performance_analysis(prompt_id);
CREATE INDEX idx_prompt_perf_account ON prompt_performance_analysis(account_id);
CREATE INDEX idx_prompt_perf_simulation ON prompt_performance_analysis(simulation_id);
CREATE INDEX idx_prompt_perf_brand ON prompt_performance_analysis(primary_brand_id);
CREATE INDEX idx_prompt_perf_competitor ON prompt_performance_analysis(top_competitor_id);
CREATE INDEX idx_prompt_perf_category ON prompt_performance_analysis(prompt_category);
CREATE INDEX idx_prompt_perf_intent ON prompt_performance_analysis(prompt_intent);
CREATE INDEX idx_prompt_perf_period ON prompt_performance_analysis(metric_period, period_end_date DESC);
CREATE INDEX idx_prompt_perf_mention_rate ON prompt_performance_analysis(primary_brand_mention_rate DESC);
CREATE INDEX idx_prompt_perf_lvi ON prompt_performance_analysis(primary_brand_lvi DESC);
CREATE INDEX idx_prompt_perf_opportunity ON prompt_performance_analysis(is_opportunity, opportunity_score DESC);
CREATE INDEX idx_prompt_perf_strength ON prompt_performance_analysis(is_strength);
CREATE INDEX idx_prompt_perf_threat ON prompt_performance_analysis(is_threat);
CREATE INDEX idx_prompt_perf_priority ON prompt_performance_analysis(strategic_priority, opportunity_score DESC);
CREATE INDEX idx_prompt_perf_action ON prompt_performance_analysis(action_required);

-- GIN indexes
CREATE INDEX idx_prompt_perf_models_gin ON prompt_performance_analysis USING gin(models_list);
CREATE INDEX idx_prompt_perf_brands_gin ON prompt_performance_analysis USING gin(unique_brands_mentioned);
CREATE INDEX idx_prompt_perf_topics_gin ON prompt_performance_analysis USING gin(primary_topics);
CREATE INDEX idx_prompt_perf_model_breakdown_gin ON prompt_performance_analysis USING gin(model_performance);
CREATE INDEX idx_prompt_perf_topic_relevance_gin ON prompt_performance_analysis USING gin(topic_relevance);

-- RLS Policies
ALTER TABLE prompt_performance_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view prompt analysis for their accounts"
  ON prompt_performance_analysis FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert prompt analysis for their accounts"
  ON prompt_performance_analysis FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update prompt analysis for their accounts"
  ON prompt_performance_analysis FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Trigger
CREATE TRIGGER prompt_performance_analysis_updated_at
  BEFORE UPDATE ON prompt_performance_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE prompt_performance_analysis IS 'Aggregated performance metrics per prompt showing brand vs competitor performance';
COMMENT ON COLUMN prompt_performance_analysis.is_opportunity IS 'True if competitors mentioned but primary brand is not - indicates content gap';
COMMENT ON COLUMN prompt_performance_analysis.is_strength IS 'True if primary brand dominates this prompt (top position, high SOV)';
COMMENT ON COLUMN prompt_performance_analysis.is_threat IS 'True if competitors significantly outperform primary brand';
COMMENT ON COLUMN prompt_performance_analysis.opportunity_score IS 'Revenue/impact potential score (0-100)';
COMMENT ON COLUMN prompt_performance_analysis.strategic_priority IS 'Business priority: high, medium, or low';
COMMENT ON COLUMN prompt_performance_analysis.action_required IS 'Recommended action: create_content, optimize_existing, monitor, maintain';
