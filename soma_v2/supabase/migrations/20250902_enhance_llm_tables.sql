-- LLM Simulations Tables Migration - Compatible with Existing Schema
-- Created: 2025-09-02
-- Purpose: Add missing fields to existing tables for enhanced LLM analysis

-- Add missing fields to llm_simulations table if they don't exist
DO $$ 
BEGIN
    -- Add simulation_id field for external reference if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'llm_simulations' AND column_name = 'simulation_id') THEN
        ALTER TABLE llm_simulations ADD COLUMN simulation_id TEXT UNIQUE;
        CREATE INDEX IF NOT EXISTS idx_llm_simulations_simulation_id ON llm_simulations(simulation_id);
    END IF;

    -- Add brand fields if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'llm_simulations' AND column_name = 'brand_name') THEN
        ALTER TABLE llm_simulations ADD COLUMN brand_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'llm_simulations' AND column_name = 'brand_website') THEN
        ALTER TABLE llm_simulations ADD COLUMN brand_website TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'llm_simulations' AND column_name = 'brand_category') THEN
        ALTER TABLE llm_simulations ADD COLUMN brand_category TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'llm_simulations' AND column_name = 'target_markets') THEN
        ALTER TABLE llm_simulations ADD COLUMN target_markets TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'llm_simulations' AND column_name = 'products_services') THEN
        ALTER TABLE llm_simulations ADD COLUMN products_services TEXT;
    END IF;

    -- Add progress fields if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'llm_simulations' AND column_name = 'progress_percentage') THEN
        ALTER TABLE llm_simulations ADD COLUMN progress_percentage INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'llm_simulations' AND column_name = 'running_jobs') THEN
        ALTER TABLE llm_simulations ADD COLUMN running_jobs INTEGER DEFAULT 0;
    END IF;

    -- Add completion timestamp if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'llm_simulations' AND column_name = 'completed_at') THEN
        ALTER TABLE llm_simulations ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;

    -- Add total cost field if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'llm_simulations' AND column_name = 'total_cost') THEN
        ALTER TABLE llm_simulations ADD COLUMN total_cost DECIMAL(10,4) DEFAULT 0.00;
    END IF;
END $$;

-- Add missing fields to llm_responses table for enhanced analysis
DO $$ 
BEGIN
    -- Add external simulation ID reference if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'llm_responses' AND column_name = 'external_simulation_id') THEN
        ALTER TABLE llm_responses ADD COLUMN external_simulation_id TEXT;
        CREATE INDEX IF NOT EXISTS idx_llm_responses_external_simulation_id ON llm_responses(external_simulation_id);
    END IF;

    -- Add brand mention tracking if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'llm_responses' AND column_name = 'brand_mentioned') THEN
        ALTER TABLE llm_responses ADD COLUMN brand_mentioned BOOLEAN DEFAULT FALSE;
        CREATE INDEX IF NOT EXISTS idx_llm_responses_brand_mentioned ON llm_responses(brand_mentioned);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'llm_responses' AND column_name = 'brand_mention_count') THEN
        ALTER TABLE llm_responses ADD COLUMN brand_mention_count INTEGER DEFAULT 0;
    END IF;

    -- Add competitor tracking if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'llm_responses' AND column_name = 'competitor_mentions') THEN
        ALTER TABLE llm_responses ADD COLUMN competitor_mentions TEXT[];
    END IF;

    -- Add analysis scores if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'llm_responses' AND column_name = 'sentiment_score') THEN
        ALTER TABLE llm_responses ADD COLUMN sentiment_score DECIMAL(3,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'llm_responses' AND column_name = 'relevance_score') THEN
        ALTER TABLE llm_responses ADD COLUMN relevance_score DECIMAL(3,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'llm_responses' AND column_name = 'quality_score') THEN
        ALTER TABLE llm_responses ADD COLUMN quality_score DECIMAL(3,2);
    END IF;

    -- Add sources field if it doesn't exist (separate from citations)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'llm_responses' AND column_name = 'sources') THEN
        ALTER TABLE llm_responses ADD COLUMN sources JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Add raw metadata field if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'llm_responses' AND column_name = 'raw_metadata') THEN
        ALTER TABLE llm_responses ADD COLUMN raw_metadata JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Ensure token count field exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'llm_responses' AND column_name = 'token_count') THEN
        ALTER TABLE llm_responses ADD COLUMN token_count INTEGER;
    END IF;
END $$;

-- Create the missing llm_prompts table
CREATE TABLE IF NOT EXISTS llm_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id TEXT NOT NULL, -- References llm_simulations.id (TEXT)
    prompt_text TEXT NOT NULL,
    prompt_type TEXT NOT NULL, -- e.g., 'brand_research', 'competitor_analysis', 'product_query'
    prompt_category TEXT, -- e.g., 'information_seeking', 'comparison', 'recommendation'
    target_keywords TEXT[],
    expected_brand_mention BOOLEAN DEFAULT FALSE,
    prompt_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for llm_prompts
CREATE INDEX IF NOT EXISTS idx_llm_prompts_simulation_id ON llm_prompts(simulation_id);
CREATE INDEX IF NOT EXISTS idx_llm_prompts_prompt_type ON llm_prompts(prompt_type);

-- Create the missing llm_analysis_results table
CREATE TABLE IF NOT EXISTS llm_analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id TEXT NOT NULL, -- References llm_simulations.id (TEXT)
    analysis_type TEXT NOT NULL, -- e.g., 'brand_visibility', 'competitor_analysis', 'share_of_voice'
    
    -- Aggregated metrics
    overall_ldi_score DECIMAL(5,2) DEFAULT 0.00,
    brand_mention_rate DECIMAL(5,4) DEFAULT 0.0000, -- Percentage as decimal
    average_confidence DECIMAL(5,3) DEFAULT 0.000,
    total_responses INTEGER DEFAULT 0,
    successful_responses INTEGER DEFAULT 0,
    
    -- Model performance breakdown
    model_performance JSONB DEFAULT '{}'::jsonb, -- Performance by model
    
    -- Competitor analysis
    competitor_mention_counts JSONB DEFAULT '{}'::jsonb, -- Competitor name -> count
    share_of_voice JSONB DEFAULT '{}'::jsonb, -- Brand vs competitors mention ratios
    
    -- Insights and recommendations
    insights JSONB DEFAULT '[]'::jsonb, -- Array of insight objects
    recommendations JSONB DEFAULT '[]'::jsonb, -- Array of recommendation objects
    
    -- Analysis metadata
    analysis_version TEXT DEFAULT '1.0',
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for llm_analysis_results
CREATE INDEX IF NOT EXISTS idx_llm_analysis_simulation_id ON llm_analysis_results(simulation_id);
CREATE INDEX IF NOT EXISTS idx_llm_analysis_type ON llm_analysis_results(analysis_type);
CREATE INDEX IF NOT EXISTS idx_llm_analysis_analyzed_at ON llm_analysis_results(analyzed_at DESC);

-- Enable Row Level Security (RLS) for new tables
ALTER TABLE llm_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_analysis_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
CREATE POLICY "Users can only access prompts from their simulations" ON llm_prompts
    FOR ALL USING (
        simulation_id IN (
            SELECT id FROM llm_simulations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can only access analysis from their simulations" ON llm_analysis_results
    FOR ALL USING (
        simulation_id IN (
            SELECT id FROM llm_simulations WHERE user_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT ALL ON llm_prompts TO authenticated;
GRANT ALL ON llm_analysis_results TO authenticated;

-- Add updated_at trigger for llm_analysis_results
CREATE TRIGGER update_llm_analysis_updated_at BEFORE UPDATE ON llm_analysis_results
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE llm_prompts IS 'Stores generated prompts used in LLM simulations';
COMMENT ON TABLE llm_analysis_results IS 'Stores aggregated analysis results from LLM simulations';
COMMENT ON COLUMN llm_simulations.simulation_id IS 'External simulation ID from LLM service';
COMMENT ON COLUMN llm_responses.external_simulation_id IS 'External simulation ID for correlation';
COMMENT ON COLUMN llm_responses.brand_mentioned IS 'Whether the brand was mentioned in the response';
COMMENT ON COLUMN llm_responses.brand_mention_count IS 'Number of times the brand was mentioned';
COMMENT ON COLUMN llm_responses.competitor_mentions IS 'Array of competitor names mentioned in response';