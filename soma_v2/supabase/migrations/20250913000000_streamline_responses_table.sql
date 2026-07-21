-- Streamline Responses Table for LLM Simulation
-- Migration: 20250913000000_streamline_responses_table.sql
-- Purpose: Simplify responses table to focus on core LLM response data only

-- Create new simplified responses table
CREATE TABLE IF NOT EXISTS public.llm_simulation_responses (
  id TEXT PRIMARY KEY DEFAULT ('resp_' || EXTRACT(EPOCH FROM NOW()) || '_' || substr(gen_random_uuid()::text, 1, 8)),
  
  -- Core identifiers
  simulation_id TEXT NOT NULL,
  prompt_id TEXT NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  
  -- LLM details
  model_name TEXT NOT NULL, -- e.g., 'openai/gpt-4o-mini:online'
  model_provider TEXT NOT NULL, -- e.g., 'OpenRouter'
  
  -- Request/Response data
  prompt_text TEXT NOT NULL,
  raw_response TEXT NOT NULL, -- The actual response from the LLM
  
  -- Performance metrics
  response_time_ms INTEGER,
  token_usage JSONB DEFAULT '{}', -- {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
  cost_estimate DECIMAL(10, 6) DEFAULT 0,
  
  -- Status tracking
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Consumer behavior context
  consumer_behavior TEXT, -- 'search_and_synthesize', 'detailed_analysis', etc.
  system_prompt TEXT -- The system prompt used for this specific model
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_llm_simulation_responses_simulation_id ON public.llm_simulation_responses(simulation_id);
CREATE INDEX IF NOT EXISTS idx_llm_simulation_responses_account_brand ON public.llm_simulation_responses(account_id, brand_id);
CREATE INDEX IF NOT EXISTS idx_llm_simulation_responses_model ON public.llm_simulation_responses(model_name);
CREATE INDEX IF NOT EXISTS idx_llm_simulation_responses_success ON public.llm_simulation_responses(success);
CREATE INDEX IF NOT EXISTS idx_llm_simulation_responses_created_at ON public.llm_simulation_responses(created_at DESC);

-- Enable RLS
ALTER TABLE public.llm_simulation_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can access LLM responses for their accounts" ON public.llm_simulation_responses
  FOR ALL USING (
    account_id IN (
      SELECT account_id FROM public.account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Create simulations tracking table
CREATE TABLE IF NOT EXISTS public.llm_simulations (
  id TEXT PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  
  -- Simulation details
  prompt_count INTEGER NOT NULL DEFAULT 0,
  model_count INTEGER NOT NULL DEFAULT 0,
  total_jobs INTEGER NOT NULL DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  failed_jobs INTEGER DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  
  -- Metrics
  total_cost DECIMAL(10, 6) DEFAULT 0,
  average_response_time_ms INTEGER,
  
  -- Brand context
  brand_context JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for simulations
CREATE INDEX IF NOT EXISTS idx_llm_simulations_account_brand ON public.llm_simulations(account_id, brand_id);
CREATE INDEX IF NOT EXISTS idx_llm_simulations_status ON public.llm_simulations(status);
CREATE INDEX IF NOT EXISTS idx_llm_simulations_created_at ON public.llm_simulations(created_at DESC);

-- Enable RLS for simulations
ALTER TABLE public.llm_simulations ENABLE ROW LEVEL SECURITY;

-- RLS Policy for simulations
CREATE POLICY "Users can access LLM simulations for their accounts" ON public.llm_simulations
  FOR ALL USING (
    account_id IN (
      SELECT account_id FROM public.account_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Function to update simulation stats when responses are added
CREATE OR REPLACE FUNCTION update_simulation_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update completed/failed job counts and metrics
  UPDATE public.llm_simulations 
  SET 
    completed_jobs = (
      SELECT COUNT(*) FROM public.llm_simulation_responses 
      WHERE simulation_id = NEW.simulation_id AND success = true
    ),
    failed_jobs = (
      SELECT COUNT(*) FROM public.llm_simulation_responses 
      WHERE simulation_id = NEW.simulation_id AND success = false
    ),
    total_cost = (
      SELECT COALESCE(SUM(cost_estimate), 0) FROM public.llm_simulation_responses 
      WHERE simulation_id = NEW.simulation_id
    ),
    average_response_time_ms = (
      SELECT COALESCE(AVG(response_time_ms), 0)::INTEGER FROM public.llm_simulation_responses 
      WHERE simulation_id = NEW.simulation_id AND response_time_ms IS NOT NULL
    ),
    status = CASE 
      WHEN (
        SELECT COUNT(*) FROM public.llm_simulation_responses 
        WHERE simulation_id = NEW.simulation_id
      ) >= total_jobs THEN 'completed'
      ELSE status
    END,
    completed_at = CASE 
      WHEN (
        SELECT COUNT(*) FROM public.llm_simulation_responses 
        WHERE simulation_id = NEW.simulation_id
      ) >= total_jobs THEN NOW()
      ELSE completed_at
    END
  WHERE id = NEW.simulation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update simulation stats
CREATE TRIGGER update_simulation_stats_trigger
  AFTER INSERT ON public.llm_simulation_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_simulation_stats();

-- Comments for documentation
COMMENT ON TABLE public.llm_simulation_responses IS 'Streamlined storage for LLM simulation responses with focus on core response data';
COMMENT ON TABLE public.llm_simulations IS 'Tracking table for LLM simulation runs with aggregated metrics';

-- Migrate existing data if needed (commented out for safety)
-- INSERT INTO public.llm_simulation_responses (
--   simulation_id, prompt_id, user_id, account_id, brand_id, 
--   model_name, model_provider, prompt_text, raw_response,
--   response_time_ms, success, error_message, retry_count, created_at
-- )
-- SELECT 
--   'migrated_' || response_id as simulation_id,
--   job_id as prompt_id,
--   -- user_id, -- Need to map this from jobs table
--   account_id,
--   brand_id,
--   COALESCE(model_name, 'unknown') as model_name,
--   'OpenRouter' as model_provider,
--   COALESCE(extracted_content, raw_content, 'No content') as prompt_text,
--   COALESCE(raw_content, '') as raw_response,
--   NULL as response_time_ms,
--   true as success,
--   NULL as error_message,
--   0 as retry_count,
--   created_at
-- FROM public.responses
-- WHERE raw_content IS NOT NULL;