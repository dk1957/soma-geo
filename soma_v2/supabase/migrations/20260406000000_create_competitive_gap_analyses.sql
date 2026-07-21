-- Competitive gap analysis results storage
-- Stores snapshots of competitive gap analysis so we can track progress/decline over time

CREATE TABLE IF NOT EXISTS competitive_gap_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  
  -- Summary metrics
  total_queries INTEGER NOT NULL DEFAULT 0,
  brand_visible_in INTEGER NOT NULL DEFAULT 0,
  gap_count INTEGER NOT NULL DEFAULT 0,
  visibility_rate INTEGER NOT NULL DEFAULT 0,
  
  -- Brand info at time of analysis
  brand_domain TEXT,
  
  -- Full results stored as JSONB for flexibility
  gap_queries JSONB NOT NULL DEFAULT '[]',
  visible_queries JSONB NOT NULL DEFAULT '[]',
  top_competitors JSONB NOT NULL DEFAULT '[]',
  search_queries_used JSONB NOT NULL DEFAULT '[]',
  
  -- Metadata
  primary_market TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for quick lookups by brand and time
CREATE INDEX IF NOT EXISTS idx_competitive_gap_brand_created 
  ON competitive_gap_analyses(brand_id, created_at DESC);

-- Rate limiting: prevent running too frequently
COMMENT ON TABLE competitive_gap_analyses IS 
  'Stores competitive gap analysis snapshots for tracking brand search visibility over time';
