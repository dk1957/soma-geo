-- Enhanced Responses Table Migration
-- Migration: 20250910000001_enhance_responses_table.sql
-- Purpose: Add additional metadata columns to responses table for Jobs system integration

-- Add new metadata columns to responses table
ALTER TABLE public.responses 
ADD COLUMN IF NOT EXISTS context TEXT, -- Query context information
ADD COLUMN IF NOT EXISTS intent_type TEXT CHECK (intent_type IN ('discovery', 'research', 'comparison', 'purchase', 'support', 'informational', 'commercial', 'transactional', 'navigational')),
ADD COLUMN IF NOT EXISTS query_style TEXT CHECK (query_style IN ('conversational', 'formal', 'casual', 'technical', 'question', 'search_query')),
ADD COLUMN IF NOT EXISTS user_persona TEXT, -- Target user persona description
ADD COLUMN IF NOT EXISTS expected_brand_mention TEXT CHECK (expected_brand_mention IN ('direct', 'indirect', 'competitor', 'related', 'none')),
ADD COLUMN IF NOT EXISTS processing_metadata JSONB DEFAULT '{}', -- Flexible processing information
ADD COLUMN IF NOT EXISTS response_format TEXT CHECK (response_format IN ('text', 'json', 'structured', 'list', 'paragraph')),
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS market TEXT, -- Geographic market context
ADD COLUMN IF NOT EXISTS business_category TEXT, -- Business/industry category
ADD COLUMN IF NOT EXISTS prompt_id TEXT, -- Reference to original prompt
ADD COLUMN IF NOT EXISTS simulation_metadata JSONB DEFAULT '{}', -- Simulation-specific data
ADD COLUMN IF NOT EXISTS quality_score DECIMAL(5,3), -- Overall response quality (0.000 to 1.000)
ADD COLUMN IF NOT EXISTS relevance_score DECIMAL(5,3), -- Relevance to brand/query (0.000 to 1.000)
ADD COLUMN IF NOT EXISTS authenticity_score DECIMAL(5,3), -- How authentic/natural the response is (0.000 to 1.000)
ADD COLUMN IF NOT EXISTS commercial_intent DECIMAL(5,3), -- Commercial intent score (0.000 to 1.000)
ADD COLUMN IF NOT EXISTS error_message TEXT, -- Error details if response failed
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0, -- Number of retries attempted
ADD COLUMN IF NOT EXISTS source_endpoint TEXT, -- API endpoint that generated this response
ADD COLUMN IF NOT EXISTS user_feedback JSONB DEFAULT '{}', -- User ratings/feedback
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'; -- Flexible tagging system

-- Add index for common query patterns
CREATE INDEX IF NOT EXISTS idx_responses_job_id ON public.responses(job_id);
CREATE INDEX IF NOT EXISTS idx_responses_intent_type ON public.responses(intent_type);
CREATE INDEX IF NOT EXISTS idx_responses_quality_score ON public.responses(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_responses_created_at ON public.responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_responses_brand_account ON public.responses(brand_id, account_id);
CREATE INDEX IF NOT EXISTS idx_responses_source_endpoint ON public.responses(source_endpoint);

-- Add comments for documentation
COMMENT ON COLUMN public.responses.context IS 'Query context information and background';
COMMENT ON COLUMN public.responses.intent_type IS 'Type of user intent (discovery, research, comparison, etc.)';
COMMENT ON COLUMN public.responses.query_style IS 'Style of the query (conversational, formal, etc.)';
COMMENT ON COLUMN public.responses.user_persona IS 'Target user persona description';
COMMENT ON COLUMN public.responses.expected_brand_mention IS 'Expected type of brand mention in response';
COMMENT ON COLUMN public.responses.processing_metadata IS 'Flexible JSON for processing information';
COMMENT ON COLUMN public.responses.simulation_metadata IS 'Simulation-specific metadata and parameters';
COMMENT ON COLUMN public.responses.quality_score IS 'Overall response quality score (0.000 to 1.000)';
COMMENT ON COLUMN public.responses.relevance_score IS 'Relevance to brand/query (0.000 to 1.000)';
COMMENT ON COLUMN public.responses.authenticity_score IS 'How authentic/natural the response is (0.000 to 1.000)';
COMMENT ON COLUMN public.responses.commercial_intent IS 'Commercial intent score (0.000 to 1.000)';
COMMENT ON COLUMN public.responses.source_endpoint IS 'API endpoint that generated this response';
COMMENT ON COLUMN public.responses.tags IS 'Flexible tagging system for categorization';

-- Update RLS policies to include new columns
DROP POLICY IF EXISTS "Users can only see responses from their account" ON public.responses;
CREATE POLICY "Users can only see responses from their account" ON public.responses
    FOR ALL USING (
        account_id IN (
            SELECT account_id 
            FROM public.account_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- Add policy for service accounts (for background processing)
CREATE POLICY "Service accounts can access all responses" ON public.responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 
            FROM auth.users 
            WHERE auth.uid() = id 
            AND raw_user_meta_data->>'role' = 'service'
        )
    );