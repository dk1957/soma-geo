-- Migration: Add purpose/category columns to group models and prompts by application area
-- Purpose categories: query_run, analysis, prompt_generation, content, insights

-- ============================================
-- Add purpose column to llm_model_configs
-- ============================================
ALTER TABLE public.llm_model_configs
  ADD COLUMN IF NOT EXISTS purpose text NOT NULL DEFAULT 'query_run'
    CHECK (purpose IN ('query_run', 'analysis', 'prompt_generation', 'content', 'insights'));

-- Add is_default_onboarding flag for query_run models (best model for onboarding)
ALTER TABLE public.llm_model_configs
  ADD COLUMN IF NOT EXISTS is_default_onboarding boolean NOT NULL DEFAULT false;

-- Add fallback_priority for models that support fallback ordering (lower = tried first)
ALTER TABLE public.llm_model_configs
  ADD COLUMN IF NOT EXISTS fallback_priority integer DEFAULT NULL;

-- Index on purpose for grouped queries
CREATE INDEX IF NOT EXISTS idx_llm_model_configs_purpose ON public.llm_model_configs(purpose);

-- Ensure only one default onboarding model
CREATE UNIQUE INDEX IF NOT EXISTS idx_llm_model_configs_default_onboarding
  ON public.llm_model_configs(is_default_onboarding) WHERE is_default_onboarding = true;

-- Set existing models to query_run purpose (they are all consumer-run models)
UPDATE public.llm_model_configs SET purpose = 'query_run' WHERE purpose IS NULL OR purpose = 'query_run';
