-- ============================================================================
-- Add pipeline observability columns to `runs` table
-- ============================================================================
-- Purpose: Track the post-run extraction → aggregation → insights → broadcast
-- pipeline with per-step status, timing, verification, and error details.
-- This makes every pipeline execution fully auditable from the admin dashboard.
-- ============================================================================

BEGIN;

-- Pipeline-level status: quick filter/sort without parsing JSONB
ALTER TABLE public.runs
  ADD COLUMN IF NOT EXISTS pipeline_status varchar(20) NOT NULL DEFAULT 'pending'
    CHECK (pipeline_status IN ('pending', 'running', 'completed', 'partial', 'failed', 'skipped'));

-- Full step-by-step report as structured JSONB
-- Schema: { status, started_at, completed_at, duration_ms, steps: [...], verification: {...} }
ALTER TABLE public.runs
  ADD COLUMN IF NOT EXISTS pipeline_report jsonb;

-- Timestamps for the pipeline phase specifically
ALTER TABLE public.runs
  ADD COLUMN IF NOT EXISTS pipeline_started_at timestamptz;

ALTER TABLE public.runs
  ADD COLUMN IF NOT EXISTS pipeline_completed_at timestamptz;

-- Index for filtering runs by pipeline outcome
CREATE INDEX IF NOT EXISTS idx_runs_pipeline_status
  ON public.runs (pipeline_status)
  WHERE pipeline_status IN ('failed', 'partial');

-- Composite index for admin queries: latest runs per brand with pipeline info
CREATE INDEX IF NOT EXISTS idx_runs_brand_pipeline
  ON public.runs (brand_id, created_at DESC)
  INCLUDE (pipeline_status);

COMMENT ON COLUMN public.runs.pipeline_status IS 'Overall pipeline outcome: pending → running → completed | partial | failed | skipped';
COMMENT ON COLUMN public.runs.pipeline_report IS 'Full step-by-step pipeline report with timing, results, errors, and verification';
COMMENT ON COLUMN public.runs.pipeline_started_at IS 'When the extraction pipeline started';
COMMENT ON COLUMN public.runs.pipeline_completed_at IS 'When the extraction pipeline finished (success or failure)';

COMMIT;
