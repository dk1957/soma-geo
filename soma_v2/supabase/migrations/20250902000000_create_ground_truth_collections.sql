-- Create ground_truth_collections table for storing ground truth research data
-- This table stores the output from the ground truth collector service

CREATE TABLE IF NOT EXISTS public.ground_truth_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Brand context information
  brand_name text NOT NULL,
  business_category text NOT NULL,
  markets text[] NOT NULL, -- Array of market names
  
  -- Collection statistics
  total_questions integer NOT NULL DEFAULT 0,
  high_intent_questions integer NOT NULL DEFAULT 0,
  quality_score integer NOT NULL DEFAULT 0, -- 0-100
  
  -- Analytics breakdowns (JSON)
  market_breakdown jsonb NOT NULL DEFAULT '{}', -- {"Senegal": 15, "Niger": 10}
  intent_breakdown jsonb NOT NULL DEFAULT '{}', -- {"commercial_solution": 20, "transactional_direct": 5}
  top_sources text[] NOT NULL DEFAULT '{}', -- ["PAA", "Reddit", "Quora"]
  
  -- Full questions data (JSON array)
  questions_data jsonb NOT NULL DEFAULT '[]',
  
  -- Metadata
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ground_truth_collections_user_id ON public.ground_truth_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_ground_truth_collections_brand_name ON public.ground_truth_collections(brand_name);
CREATE INDEX IF NOT EXISTS idx_ground_truth_collections_created_at ON public.ground_truth_collections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ground_truth_collections_quality_score ON public.ground_truth_collections(quality_score DESC);

-- Add GIN index for JSONB columns for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_ground_truth_collections_questions_data ON public.ground_truth_collections USING gin(questions_data);
CREATE INDEX IF NOT EXISTS idx_ground_truth_collections_market_breakdown ON public.ground_truth_collections USING gin(market_breakdown);

-- Add RLS policies
ALTER TABLE public.ground_truth_collections ENABLE ROW LEVEL SECURITY;

-- Users can only see their own ground truth collections
CREATE POLICY "Users can view own ground truth collections" ON public.ground_truth_collections
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own ground truth collections
CREATE POLICY "Users can insert own ground truth collections" ON public.ground_truth_collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own ground truth collections
CREATE POLICY "Users can update own ground truth collections" ON public.ground_truth_collections
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own ground truth collections
CREATE POLICY "Users can delete own ground truth collections" ON public.ground_truth_collections
  FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_ground_truth_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ground_truth_collections_updated_at
  BEFORE UPDATE ON public.ground_truth_collections
  FOR EACH ROW
  EXECUTE PROCEDURE update_ground_truth_collections_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.ground_truth_collections IS 'Stores ground truth research data collected for brands across different markets';
COMMENT ON COLUMN public.ground_truth_collections.brand_name IS 'Name of the brand being researched';
COMMENT ON COLUMN public.ground_truth_collections.business_category IS 'Business category/industry of the brand';
COMMENT ON COLUMN public.ground_truth_collections.markets IS 'Array of target markets/countries for the research';
COMMENT ON COLUMN public.ground_truth_collections.quality_score IS 'Quality score of the collected data (0-100)';
COMMENT ON COLUMN public.ground_truth_collections.questions_data IS 'Full array of collected questions with metadata';
COMMENT ON COLUMN public.ground_truth_collections.market_breakdown IS 'Number of questions per market';
COMMENT ON COLUMN public.ground_truth_collections.intent_breakdown IS 'Number of questions per intent category';