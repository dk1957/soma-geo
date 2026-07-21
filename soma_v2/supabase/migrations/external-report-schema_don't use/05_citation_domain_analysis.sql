-- ============================================================================
-- Citation Domain Analysis Table
-- ============================================================================
-- Aggregates citation data by domain to show which sources are most influential
-- Used for: Sources & Citations section, publisher opportunity analysis
-- ============================================================================

CREATE TABLE IF NOT EXISTS citation_domain_analysis (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  simulation_id UUID REFERENCES llm_simulations(id) ON DELETE CASCADE,
  
  -- Domain Info
  domain VARCHAR(255) NOT NULL,
  domain_type VARCHAR(50), -- 'your-brand', 'competitor', 'industry', 'news-media', 'academic', 'reference'
  full_url TEXT,
  page_title TEXT,
  
  -- Associated Brand/Competitor
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,
  
  -- Usage Metrics
  total_citations INTEGER DEFAULT 0,
  unique_responses_citing INTEGER DEFAULT 0, -- How many responses cited this domain
  used_percentage NUMERIC(5,2) DEFAULT 0, -- % of total responses that cite this domain
  avg_citations_per_response NUMERIC(5,2) DEFAULT 0,
  
  -- Position Metrics
  avg_citation_position INTEGER, -- Where in response citations appear
  first_citation_count INTEGER DEFAULT 0, -- Times it was the first citation
  
  -- Authority Metrics
  trust_score NUMERIC(3,2), -- 0-1, domain authority
  is_authoritative BOOLEAN DEFAULT false,
  citation_quality_score NUMERIC(5,2) DEFAULT 0, -- 0-100
  
  -- Context Analysis
  citation_contexts JSONB DEFAULT '[]'::jsonb, -- Sample citation contexts
  associated_topics TEXT[], -- Topics when this domain is cited
  associated_brands TEXT[], -- Brands mentioned when citing this domain
  
  -- Model Breakdown
  models_using_source TEXT[], -- Which models cite this source
  model_usage JSONB DEFAULT '{}'::jsonb, -- {"gpt-4": 15, "claude": 12, ...}
  
  -- Competitive Analysis
  cites_primary_brand BOOLEAN DEFAULT false,
  cites_competitors BOOLEAN DEFAULT false,
  competitive_advantage VARCHAR(50), -- 'exclusive', 'shared', 'competitor-only'
  
  -- Time Period
  metric_period VARCHAR(20) NOT NULL DEFAULT '30d',
  period_start_date TIMESTAMP WITH TIME ZONE,
  period_end_date TIMESTAMP WITH TIME ZONE,
  
  -- Trends
  usage_trend VARCHAR(20), -- 'increasing', 'decreasing', 'stable'
  citation_count_change INTEGER DEFAULT 0,
  
  -- Opportunity Analysis
  is_target_publisher BOOLEAN DEFAULT false, -- True if high-value publishing opportunity
  estimated_reach INTEGER, -- Estimated audience reach
  partnership_opportunity_score NUMERIC(5,2) DEFAULT 0, -- 0-100
  
  -- Metadata
  last_analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint
  CONSTRAINT unique_domain_period_simulation UNIQUE(domain, metric_period, simulation_id)
);

-- Indexes
CREATE INDEX idx_citation_domain_account ON citation_domain_analysis(account_id);
CREATE INDEX idx_citation_domain_simulation ON citation_domain_analysis(simulation_id);
CREATE INDEX idx_citation_domain_brand ON citation_domain_analysis(brand_id);
CREATE INDEX idx_citation_domain_competitor ON citation_domain_analysis(competitor_id);
CREATE INDEX idx_citation_domain_name ON citation_domain_analysis(domain);
CREATE INDEX idx_citation_domain_type ON citation_domain_analysis(domain_type);
CREATE INDEX idx_citation_domain_citations ON citation_domain_analysis(total_citations DESC);
CREATE INDEX idx_citation_domain_usage ON citation_domain_analysis(used_percentage DESC);
CREATE INDEX idx_citation_domain_period ON citation_domain_analysis(metric_period, period_end_date DESC);
CREATE INDEX idx_citation_domain_authoritative ON citation_domain_analysis(is_authoritative, trust_score DESC);
CREATE INDEX idx_citation_domain_target ON citation_domain_analysis(is_target_publisher, partnership_opportunity_score DESC);

-- GIN indexes
CREATE INDEX idx_citation_domain_topics_gin ON citation_domain_analysis USING gin(associated_topics);
CREATE INDEX idx_citation_domain_brands_gin ON citation_domain_analysis USING gin(associated_brands);
CREATE INDEX idx_citation_domain_models_gin ON citation_domain_analysis USING gin(models_using_source);
CREATE INDEX idx_citation_domain_contexts_gin ON citation_domain_analysis USING gin(citation_contexts);
CREATE INDEX idx_citation_domain_model_usage_gin ON citation_domain_analysis USING gin(model_usage);

-- RLS Policies
ALTER TABLE citation_domain_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view citation analysis for their accounts"
  ON citation_domain_analysis FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert citation analysis for their accounts"
  ON citation_domain_analysis FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update citation analysis for their accounts"
  ON citation_domain_analysis FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Trigger
CREATE TRIGGER citation_domain_analysis_updated_at
  BEFORE UPDATE ON citation_domain_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE citation_domain_analysis IS 'Aggregated citation metrics by domain for source analysis and publisher opportunities';
COMMENT ON COLUMN citation_domain_analysis.used_percentage IS 'Percentage of all responses that cite this domain (0-100)';
COMMENT ON COLUMN citation_domain_analysis.domain_type IS 'Classification: your-brand, competitor, industry, news-media, academic, reference';
COMMENT ON COLUMN citation_domain_analysis.competitive_advantage IS 'exclusive = only you cited, shared = you + competitors, competitor-only = only competitors';
COMMENT ON COLUMN citation_domain_analysis.is_target_publisher IS 'True if this is a high-value publisher for content partnerships';
