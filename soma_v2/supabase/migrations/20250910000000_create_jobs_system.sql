-- Jobs System Migration
-- Migration: 20250910000000_create_jobs_system.sql
-- Purpose: Create consolidated job-based system for prompt generation and testing

-- Drop existing redundant tables (we'll migrate data before dropping)
-- DROP TABLE IF EXISTS llm_test_results CASCADE;
-- DROP TABLE IF EXISTS llm_query_results CASCADE;
-- Note: Commented out for safety - migrate data first

-- 1. Jobs Table - Central job tracking
CREATE TABLE IF NOT EXISTS public.jobs (
  job_id TEXT PRIMARY KEY DEFAULT ('job_' || EXTRACT(EPOCH FROM NOW()) || '_' || substr(gen_random_uuid()::text, 1, 8)),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  job_category TEXT NOT NULL CHECK (job_category IN ('visibility', 'discoverability')),
  job_type TEXT NOT NULL CHECK (job_type IN ('prompt_generation', 'routine_monitoring', 'brand_audit', 'other')),
  model TEXT, -- E.g., 'perplexity/sonar' - optional for non-LLM jobs
  provider TEXT, -- LLM provider, optional if not LLM-based
  prompt TEXT, -- Original prompt/query, nullable for non-prompt jobs
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  total_tokens INTEGER, -- Total tokens used, nullable for non-LLM jobs
  cost_estimate DECIMAL(10, 6) DEFAULT 0, -- Cost tracking
  error_message TEXT, -- Error details if failed
  metadata JSONB DEFAULT '{}', -- Additional job configuration
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 2. Responses Table - Consolidated response storage
CREATE TABLE IF NOT EXISTS public.responses (
  response_id TEXT PRIMARY KEY DEFAULT ('res_' || EXTRACT(EPOCH FROM NOW()) || '_' || substr(gen_random_uuid()::text, 1, 8)),
  job_id TEXT NOT NULL REFERENCES public.jobs(job_id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  raw_content TEXT, -- Raw response JSON or audit output
  extracted_content TEXT, -- Cleaned content for analysis
  content_length INTEGER, -- Number of characters
  brand_mentions JSONB DEFAULT '[]', -- List of detected brands
  citations JSONB DEFAULT '[]', -- List of cited URLs
  sentiment DECIMAL(3,2), -- Optional sentiment score (-1.00 to 1.00)
  response_time_ms INTEGER, -- Response latency
  model_name TEXT, -- LLM model used
  confidence_score DECIMAL(5,3), -- 0.000 to 1.000
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Citations Table - Detailed citation tracking
CREATE TABLE IF NOT EXISTS public.citations (
  citation_id TEXT PRIMARY KEY DEFAULT ('cit_' || EXTRACT(EPOCH FROM NOW()) || '_' || substr(gen_random_uuid()::text, 1, 8)),
  response_id TEXT NOT NULL REFERENCES public.responses(response_id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  source_name TEXT, -- Domain or publisher
  source_type TEXT CHECK (source_type IN ('news', 'blog', 'govt', 'scientific', 'academic', 'social', 'company', 'directory', 'other')),
  excerpt TEXT, -- Optional snippet used by LLM
  relevance_score DECIMAL(5,3), -- relevance_score = (frequency_of_mention / total_mentions) * proximity_weight
  authority_score DECIMAL(5,2), -- Domain authority if available
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Brand Mentions Table - Detailed brand mention tracking
CREATE TABLE IF NOT EXISTS public.brand_mentions (
  brand_mention_id TEXT PRIMARY KEY DEFAULT ('bm_' || EXTRACT(EPOCH FROM NOW()) || '_' || substr(gen_random_uuid()::text, 1, 8)),
  response_id TEXT NOT NULL REFERENCES public.responses(response_id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL, -- Detected brand name
  sentiment DECIMAL(3,2), -- sentiment = sum(positive - negative)/total_mentions
  position INTEGER, -- Character offset in content
  context TEXT, -- Surrounding context of the mention
  mention_type TEXT CHECK (mention_type IN ('direct', 'indirect', 'competitor', 'related')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Metrics Table - Aggregated metrics and analytics
CREATE TABLE IF NOT EXISTS public.metrics (
  metric_id TEXT PRIMARY KEY DEFAULT ('met_' || EXTRACT(EPOCH FROM NOW()) || '_' || substr(gen_random_uuid()::text, 1, 8)),
  job_id TEXT NOT NULL REFERENCES public.jobs(job_id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  llm_visibility_index DECIMAL(5,2), -- sum(brand_mentions_count * model_weight)/total_models
  citation_count INTEGER DEFAULT 0, -- Number of citations
  brand_mentions_count INTEGER DEFAULT 0, -- Number of brand mentions
  excerpt_avg_length DECIMAL(8,2), -- sum(length_of_snippets)/number_of_snippets
  query_coverage DECIMAL(5,2), -- (number_of_queries_answered / total_queries) * 100
  model_name TEXT, -- Optional: per-model stats
  sentiment_avg DECIMAL(3,2), -- sum(sentiments)/count(sentiments)
  content_quality_score DECIMAL(5,2), -- Optional readability / clarity metric
  discoverability_score DECIMAL(5,2), -- Optional metric for audits
  response_time_avg INTEGER, -- Average response time
  confidence_avg DECIMAL(5,3), -- Average confidence score
  competitor_mentions_count INTEGER DEFAULT 0, -- Competitor mention tracking
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_account_brand ON public.jobs(account_id, brand_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_category_type ON public.jobs(job_category, job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_responses_job_id ON public.responses(job_id);
CREATE INDEX IF NOT EXISTS idx_responses_account_brand ON public.responses(account_id, brand_id);
CREATE INDEX IF NOT EXISTS idx_responses_created_at ON public.responses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_citations_response_id ON public.citations(response_id);
CREATE INDEX IF NOT EXISTS idx_citations_account_brand ON public.citations(account_id, brand_id);
CREATE INDEX IF NOT EXISTS idx_citations_url ON public.citations(url);
CREATE INDEX IF NOT EXISTS idx_citations_source_type ON public.citations(source_type);

CREATE INDEX IF NOT EXISTS idx_brand_mentions_response_id ON public.brand_mentions(response_id);
CREATE INDEX IF NOT EXISTS idx_brand_mentions_account_brand ON public.brand_mentions(account_id, brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_mentions_brand_name ON public.brand_mentions(brand_name);

CREATE INDEX IF NOT EXISTS idx_metrics_job_id ON public.metrics(job_id);
CREATE INDEX IF NOT EXISTS idx_metrics_account_brand ON public.metrics(account_id, brand_id);
CREATE INDEX IF NOT EXISTS idx_metrics_created_at ON public.metrics(created_at DESC);

-- Row Level Security
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access jobs for their accounts" ON public.jobs
  FOR ALL USING (
    account_id IN (
      SELECT account_id FROM public.account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can access responses for their accounts" ON public.responses
  FOR ALL USING (
    account_id IN (
      SELECT account_id FROM public.account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can access citations for their accounts" ON public.citations
  FOR ALL USING (
    account_id IN (
      SELECT account_id FROM public.account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can access brand mentions for their accounts" ON public.brand_mentions
  FOR ALL USING (
    account_id IN (
      SELECT account_id FROM public.account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can access metrics for their accounts" ON public.metrics
  FOR ALL USING (
    account_id IN (
      SELECT account_id FROM public.account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Comments for documentation
COMMENT ON TABLE public.jobs IS 'Central job tracking for visibility and discoverability analysis';
COMMENT ON TABLE public.responses IS 'Consolidated storage for all LLM responses and analysis outputs';
COMMENT ON TABLE public.citations IS 'Detailed tracking of citations found in responses';
COMMENT ON TABLE public.brand_mentions IS 'Detailed tracking of brand mentions found in responses';
COMMENT ON TABLE public.metrics IS 'Aggregated metrics and analytics for jobs';

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();