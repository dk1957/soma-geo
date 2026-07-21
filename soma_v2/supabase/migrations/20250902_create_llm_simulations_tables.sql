-- LLM Simulations Tables
-- Created: 2025-09-02
-- Purpose: Store LLM simulation responses and metadata for analysis

-- Table to store simulation runs
CREATE TABLE IF NOT EXISTS llm_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id TEXT UNIQUE NOT NULL, -- External simulation ID from service
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    brand_context_id UUID REFERENCES brand_contexts(id) ON DELETE SET NULL,
    brand_name TEXT NOT NULL,
    brand_website TEXT,
    brand_category TEXT,
    target_markets TEXT[],
    products_services TEXT,
    status TEXT NOT NULL DEFAULT 'running', -- running, completed, failed
    total_jobs INTEGER DEFAULT 0,
    completed_jobs INTEGER DEFAULT 0,
    failed_jobs INTEGER DEFAULT 0,
    running_jobs INTEGER DEFAULT 0,
    progress_percentage INTEGER DEFAULT 0,
    estimated_completion_time INTEGER, -- milliseconds
    actual_duration INTEGER, -- milliseconds
    total_cost DECIMAL(10,4) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to store individual LLM responses
CREATE TABLE IF NOT EXISTS llm_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id UUID REFERENCES llm_simulations(id) ON DELETE CASCADE,
    external_simulation_id TEXT NOT NULL, -- Reference to simulation service
    prompt_text TEXT NOT NULL,
    model_name TEXT NOT NULL, -- e.g., 'openai/chatgpt-4o-latest', 'anthropic/claude-3.5-sonnet'
    response_text TEXT NOT NULL,
    brand_mentioned BOOLEAN DEFAULT FALSE,
    brand_mention_count INTEGER DEFAULT 0,
    competitor_mentions TEXT[], -- Array of competitor names mentioned
    confidence_score DECIMAL(5,3), -- 0.000 to 1.000
    response_time_ms INTEGER, -- Response time in milliseconds
    token_count INTEGER,
    cost DECIMAL(8,4) DEFAULT 0.00,
    
    -- Citations and Sources
    citations JSONB DEFAULT '[]'::jsonb, -- Array of citation objects
    sources JSONB DEFAULT '[]'::jsonb, -- Array of source objects with URLs, titles, etc.
    
    -- Analysis metadata
    sentiment_score DECIMAL(3,2), -- -1.00 to 1.00
    relevance_score DECIMAL(3,2), -- 0.00 to 1.00
    quality_score DECIMAL(3,2), -- 0.00 to 1.00
    
    -- Raw metadata from the response
    raw_metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to store generated prompts for simulations
CREATE TABLE IF NOT EXISTS llm_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id UUID REFERENCES llm_simulations(id) ON DELETE CASCADE,
    external_simulation_id TEXT NOT NULL, -- External reference to simulation service
    prompt_text TEXT NOT NULL,
    prompt_type TEXT NOT NULL, -- e.g., 'brand_research', 'competitor_analysis', 'product_query'
    prompt_category TEXT, -- e.g., 'information_seeking', 'comparison', 'recommendation'
    target_keywords TEXT[],
    expected_brand_mention BOOLEAN DEFAULT FALSE,
    prompt_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to store analysis results and insights
CREATE TABLE IF NOT EXISTS llm_analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id UUID REFERENCES llm_simulations(id) ON DELETE CASCADE,
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_llm_simulations_user_id ON llm_simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_simulations_status ON llm_simulations(status);
CREATE INDEX IF NOT EXISTS idx_llm_simulations_created_at ON llm_simulations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_simulations_simulation_id ON llm_simulations(simulation_id);

CREATE INDEX IF NOT EXISTS idx_llm_responses_simulation_id ON llm_responses(simulation_id);
CREATE INDEX IF NOT EXISTS idx_llm_responses_external_simulation_id ON llm_responses(external_simulation_id);
CREATE INDEX IF NOT EXISTS idx_llm_responses_model_name ON llm_responses(model_name);
CREATE INDEX IF NOT EXISTS idx_llm_responses_brand_mentioned ON llm_responses(brand_mentioned);
CREATE INDEX IF NOT EXISTS idx_llm_responses_created_at ON llm_responses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_llm_prompts_simulation_id ON llm_prompts(simulation_id);
CREATE INDEX IF NOT EXISTS idx_llm_prompts_prompt_type ON llm_prompts(prompt_type);

CREATE INDEX IF NOT EXISTS idx_llm_analysis_simulation_id ON llm_analysis_results(simulation_id);
CREATE INDEX IF NOT EXISTS idx_llm_analysis_type ON llm_analysis_results(analysis_type);
CREATE INDEX IF NOT EXISTS idx_llm_analysis_analyzed_at ON llm_analysis_results(analyzed_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE llm_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_analysis_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own data
CREATE POLICY "Users can only access their own simulations" ON llm_simulations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access responses from their simulations" ON llm_responses
    FOR ALL USING (
        simulation_id IN (
            SELECT id FROM llm_simulations WHERE user_id = auth.uid()
        )
    );

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
GRANT ALL ON llm_simulations TO authenticated;
GRANT ALL ON llm_responses TO authenticated;
GRANT ALL ON llm_prompts TO authenticated;
GRANT ALL ON llm_analysis_results TO authenticated;

-- Add updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_llm_simulations_updated_at BEFORE UPDATE ON llm_simulations
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_llm_responses_updated_at BEFORE UPDATE ON llm_responses
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_llm_analysis_updated_at BEFORE UPDATE ON llm_analysis_results
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();