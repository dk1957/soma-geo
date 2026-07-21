-- Migration: Add response_analysis table
-- Date: 2025-11-03
-- Description: Create response_analysis table needed by brand reporting service

BEGIN;

-- Create response_analysis table if it doesn't exist
CREATE TABLE IF NOT EXISTS response_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES llm_simulations(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL,
  prompt_id UUID,
  response_text TEXT,
  
  -- LVI and scoring
  lvi_score DECIMAL(5,2) DEFAULT 0,
  brand_mention_count INTEGER DEFAULT 0,
  unique_brands_count INTEGER DEFAULT 0,
  
  -- Sentiment analysis
  avg_brand_sentiment DECIMAL(5,2) DEFAULT 0,
  sentiment_differential DECIMAL(5,2) DEFAULT 0,
  avg_competitor_sentiment DECIMAL(5,2) DEFAULT 0,
  
  -- Citations
  total_citations INTEGER DEFAULT 0,
  brand_citations INTEGER DEFAULT 0,
  
  -- Position and ranking
  rank_in_response INTEGER,
  confidence_score DECIMAL(5,2) DEFAULT 0,
  
  -- Metadata
  all_brands_mentioned TEXT[] DEFAULT '{}',
  competitor_brands TEXT[] DEFAULT '{}',
  processing_time_ms INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_response_analysis_brand_id ON response_analysis(brand_id);
CREATE INDEX IF NOT EXISTS idx_response_analysis_simulation_id ON response_analysis(simulation_id);
CREATE INDEX IF NOT EXISTS idx_response_analysis_model_name ON response_analysis(model_name);
CREATE INDEX IF NOT EXISTS idx_response_analysis_lvi_score ON response_analysis(lvi_score DESC);
CREATE INDEX IF NOT EXISTS idx_response_analysis_brand_lvi ON response_analysis(brand_id, lvi_score DESC);

-- Enable RLS
ALTER TABLE response_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "response_analysis_select_policy" ON response_analysis
  FOR SELECT USING (
    brand_id IN (
      SELECT b.id FROM brands b
      JOIN accounts a ON b.account_id = a.id
      JOIN account_users au ON a.id = au.account_id
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "response_analysis_insert_policy" ON response_analysis
  FOR INSERT WITH CHECK (
    brand_id IN (
      SELECT b.id FROM brands b
      JOIN accounts a ON b.account_id = a.id
      JOIN account_users au ON a.id = au.account_id
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "response_analysis_update_policy" ON response_analysis
  FOR UPDATE USING (
    brand_id IN (
      SELECT b.id FROM brands b
      JOIN accounts a ON b.account_id = a.id
      JOIN account_users au ON a.id = au.account_id
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "response_analysis_delete_policy" ON response_analysis
  FOR DELETE USING (
    brand_id IN (
      SELECT b.id FROM brands b
      JOIN accounts a ON b.account_id = a.id
      JOIN account_users au ON a.id = au.account_id
      WHERE au.user_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_response_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER response_analysis_updated_at_trigger
  BEFORE UPDATE ON response_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_response_analysis_updated_at();

COMMIT;