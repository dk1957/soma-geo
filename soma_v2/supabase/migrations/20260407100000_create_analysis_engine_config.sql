-- Analysis Engine Configuration Table
-- Stores the model, prompts, and metric definitions used by the response analysis engine.
-- Admins can tweak prompts and metrics without code changes.

CREATE TABLE IF NOT EXISTS analysis_engine_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(50) UNIQUE NOT NULL DEFAULT 'default',
  
  -- Model settings
  analysis_model VARCHAR(100) NOT NULL DEFAULT 'google/gemini-2.5-flash',
  temperature NUMERIC(3,2) NOT NULL DEFAULT 0.1,
  concurrency INTEGER NOT NULL DEFAULT 3,
  max_retries INTEGER NOT NULL DEFAULT 3,
  hybrid_mode BOOLEAN NOT NULL DEFAULT true,
  
  -- Prompt templates (use {{variable}} placeholders)
  system_prompt TEXT NOT NULL,
  user_prompt TEXT NOT NULL,
  
  -- Dynamic metric definitions (JSONB array)
  metric_definitions JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Versioning
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Audit
  updated_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analysis_engine_config_active
  ON analysis_engine_config(config_key) WHERE is_active = true;

ALTER TABLE analysis_engine_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY analysis_engine_config_service_all
  ON analysis_engine_config FOR ALL
  USING (true) WITH CHECK (true);
