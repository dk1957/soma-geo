-- Create LLM Submission Batches Table
-- Migration: 20250902000000_create_llm_submission_batches.sql
-- This table stores batch submissions from the MultiLLMSubmissionService

CREATE TABLE IF NOT EXISTS public.llm_submission_batches (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    
    -- Brand Context
    brand_name TEXT NOT NULL,
    business_category TEXT,
    markets TEXT[],
    
    -- Batch Metadata
    status TEXT CHECK (status IN ('in_progress', 'completed', 'failed')) DEFAULT 'in_progress',
    total_prompts INTEGER DEFAULT 0,
    successful_responses INTEGER DEFAULT 0,
    failed_submissions INTEGER DEFAULT 0,
    
    -- LLM Configuration
    llm_configs JSONB DEFAULT '[]',
    selected_llms TEXT[],
    
    -- Performance Metrics
    total_cost DECIMAL(10,6) DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    average_response_time INTEGER DEFAULT 0,
    processing_time INTEGER DEFAULT 0,
    
    -- Analysis Results
    aggregated_analysis JSONB DEFAULT '{}',
    batch_metrics JSONB DEFAULT '{}',
    platform_performance JSONB DEFAULT '{}',
    
    -- Raw Data
    responses_data JSONB DEFAULT '[]',
    failed_submissions_data JSONB DEFAULT '[]',
    expanded_prompts JSONB DEFAULT '[]',
    
    -- Timestamps
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create separate table for individual LLM responses
CREATE TABLE IF NOT EXISTS public.llm_responses (
    id TEXT PRIMARY KEY,
    batch_id TEXT REFERENCES llm_submission_batches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- LLM Details
    platform TEXT NOT NULL,
    model TEXT NOT NULL,
    
    -- Response Data
    raw_response TEXT,
    search_context JSONB DEFAULT '{}',
    analysis JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    -- Performance
    response_time INTEGER DEFAULT 0,
    token_usage JSONB DEFAULT '{}',
    cost DECIMAL(8,6) DEFAULT 0,
    
    -- Status
    success BOOLEAN DEFAULT false,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_llm_submission_batches_user_id ON llm_submission_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_submission_batches_account_id ON llm_submission_batches(account_id);
CREATE INDEX IF NOT EXISTS idx_llm_submission_batches_brand_name ON llm_submission_batches(brand_name);
CREATE INDEX IF NOT EXISTS idx_llm_submission_batches_status ON llm_submission_batches(status);
CREATE INDEX IF NOT EXISTS idx_llm_submission_batches_created_at ON llm_submission_batches(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_llm_responses_batch_id ON llm_responses(batch_id);
CREATE INDEX IF NOT EXISTS idx_llm_responses_user_id ON llm_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_responses_platform ON llm_responses(platform);
CREATE INDEX IF NOT EXISTS idx_llm_responses_success ON llm_responses(success);
CREATE INDEX IF NOT EXISTS idx_llm_responses_created_at ON llm_responses(created_at DESC);

-- RLS Policies
ALTER TABLE llm_submission_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_responses ENABLE ROW LEVEL SECURITY;

-- Policy for submission batches
CREATE POLICY "Users can access their own submission batches" ON llm_submission_batches
    FOR ALL USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM account_users au
            WHERE au.account_id = llm_submission_batches.account_id
            AND au.user_id = auth.uid()
            AND au.is_active = true
        )
    );

-- Policy for LLM responses
CREATE POLICY "Users can access their own LLM responses" ON llm_responses
    FOR ALL USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM llm_submission_batches lsb
            JOIN account_users au ON lsb.account_id = au.account_id
            WHERE lsb.id = llm_responses.batch_id
            AND au.user_id = auth.uid()
            AND au.is_active = true
        )
    );

-- Function to update batch status automatically
CREATE OR REPLACE FUNCTION update_batch_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update parent batch metrics when responses are inserted/updated
    UPDATE llm_submission_batches 
    SET 
        successful_responses = (
            SELECT COUNT(*) FROM llm_responses 
            WHERE batch_id = NEW.batch_id AND success = true
        ),
        failed_submissions = (
            SELECT COUNT(*) FROM llm_responses 
            WHERE batch_id = NEW.batch_id AND success = false
        ),
        total_cost = (
            SELECT COALESCE(SUM(cost), 0) FROM llm_responses 
            WHERE batch_id = NEW.batch_id
        ),
        updated_at = NOW()
    WHERE id = NEW.batch_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update batch metrics
CREATE TRIGGER trigger_update_batch_metrics
    AFTER INSERT OR UPDATE ON llm_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_batch_metrics();

-- Grant permissions
GRANT ALL ON llm_submission_batches TO authenticated;
GRANT ALL ON llm_responses TO authenticated;