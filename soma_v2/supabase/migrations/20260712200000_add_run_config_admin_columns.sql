-- Add missing admin UI columns to run_config
-- These support the Post-Run Analysis, Cost Controls, and Model Fallback settings

ALTER TABLE run_config
  ADD COLUMN IF NOT EXISTS fallback_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS rate_limit_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_cost_per_run NUMERIC(8,2) DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS daily_cost_limit NUMERIC(8,2) DEFAULT 50.00,
  ADD COLUMN IF NOT EXISTS auto_analysis_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS longitudinal_analysis_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS deduplication_window_hours INTEGER DEFAULT 24 CHECK (deduplication_window_hours >= 1 AND deduplication_window_hours <= 168),
  ADD COLUMN IF NOT EXISTS force_rerun_allowed BOOLEAN DEFAULT false;
