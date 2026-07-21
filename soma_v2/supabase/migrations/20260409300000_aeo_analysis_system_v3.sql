-- ============================================================================
-- AEO Analysis System v3 — Schema Migration
-- ============================================================================
-- Date: 2026-04-09
-- Purpose: Implement the 3-layer pipeline architecture:
--   Layer 1: responses (immutable event log)
--   Layer 2: response_data + citations (extracted facts)
--   Layer 3: daily_brand_metrics + daily_prompt_metrics (scored aggregates)
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 0: Drop old materialized views and tables that conflict
-- ============================================================================

-- Drop old materialized views that will be replaced by proper tables
DROP MATERIALIZED VIEW IF EXISTS daily_brand_metrics CASCADE;
DROP MATERIALIZED VIEW IF EXISTS topic_brand_matrix CASCADE;
DROP MATERIALIZED VIEW IF EXISTS source_citation_analysis CASCADE;
DROP MATERIALIZED VIEW IF EXISTS prompt_performance_analysis CASCADE;
DROP MATERIALIZED VIEW IF EXISTS brand_performance_summary CASCADE;

-- Drop functions that reference the old views
DROP FUNCTION IF EXISTS refresh_all_report_views() CASCADE;

-- Drop old response_analysis table (replaced by response_data)
DROP TABLE IF EXISTS response_analysis CASCADE;

-- ============================================================================
-- STEP 1: Enrich llm_response_files → functions as the "responses" layer
-- ============================================================================
-- llm_response_files already has: id, simulation_id (= run_id), prompt_id,
-- profile_id, account_id, brand_id, model_name, model_provider, storage_path,
-- prompt_text, response_preview, word_count, response_time_ms, token_usage,
-- cost_estimate, success, error_message, created_at.
--
-- We add the extraction pipeline fields.
-- ============================================================================

ALTER TABLE public.llm_response_files
  ADD COLUMN IF NOT EXISTS extraction_status varchar(20) NOT NULL DEFAULT 'pending'
    CHECK (extraction_status IN ('pending', 'processing', 'complete', 'failed')),
  ADD COLUMN IF NOT EXISTS extraction_error text,
  ADD COLUMN IF NOT EXISTS input_tokens integer,
  ADD COLUMN IF NOT EXISTS output_tokens integer;

COMMENT ON COLUMN public.llm_response_files.extraction_status IS 'Pipeline status: pending → processing → complete | failed';
COMMENT ON COLUMN public.llm_response_files.extraction_error IS 'Error message if extraction failed — enables retry targeting';
COMMENT ON COLUMN public.llm_response_files.input_tokens IS 'Prompt tokens for cost auditing (extracted from token_usage JSONB)';
COMMENT ON COLUMN public.llm_response_files.output_tokens IS 'Completion tokens for model efficiency analysis (extracted from token_usage JSONB)';

-- Back-fill input_tokens / output_tokens from the existing JSONB column
UPDATE public.llm_response_files
SET
  input_tokens  = COALESCE((token_usage->>'prompt_tokens')::int, 0),
  output_tokens = COALESCE((token_usage->>'completion_tokens')::int, 0)
WHERE input_tokens IS NULL;

-- Partial index: only incomplete extractions — agent pickup query
CREATE INDEX IF NOT EXISTS idx_lrf_extraction_pending
  ON public.llm_response_files (extraction_status)
  WHERE extraction_status IN ('pending', 'failed');

-- Index for brand + date trend queries
CREATE INDEX IF NOT EXISTS idx_lrf_brand_created
  ON public.llm_response_files (brand_id, created_at DESC);

-- Unique constraint to prevent duplicate processing (simulation_id = run_id)
-- Already exists: UNIQUE(simulation_id, prompt_id, model_name)

-- ============================================================================
-- STEP 2: Create response_data — Extracted Atomic Facts
-- ============================================================================
-- One row per brand (primary or competitor) per response.
-- No computed scores — only what the extraction agent observed.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.response_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to response
  response_id uuid NOT NULL REFERENCES public.llm_response_files(id) ON DELETE CASCADE,

  -- Which brand this row is about (primary OR competitor)
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,

  -- Account for RLS
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,

  -- Core facts
  mentioned boolean NOT NULL DEFAULT false,
  brand_rank integer,                          -- 1 = first brand named. NULL if not mentioned
  brand_mention_count integer NOT NULL DEFAULT 0,
  co_mentioned_brands text[] DEFAULT '{}',     -- other brand names in this response
  competitive_density integer DEFAULT 0,       -- COUNT(DISTINCT brands) in response

  -- Sentiment
  raw_sentiment numeric(4,3),                  -- -1.000 to 1.000
  sentiment_signals text[] DEFAULT '{}',       -- top driving words

  -- Citations
  citation_count integer NOT NULL DEFAULT 0,
  total_response_citations integer NOT NULL DEFAULT 0,

  -- Recommendation
  is_primary_recommendation boolean NOT NULL DEFAULT false,

  -- Extraction metadata
  extraction_model varchar(50),
  extraction_version integer NOT NULL DEFAULT 1,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Prevent duplicate extraction rows
  UNIQUE (response_id, brand_id)
);

-- Indexes
CREATE INDEX idx_response_data_response   ON public.response_data (response_id);
CREATE INDEX idx_response_data_brand_date ON public.response_data (brand_id, created_at DESC);
CREATE INDEX idx_response_data_account    ON public.response_data (account_id);
CREATE INDEX idx_response_data_mentioned  ON public.response_data (brand_id) WHERE mentioned = true;
CREATE INDEX idx_response_data_co_brands  ON public.response_data USING GIN (co_mentioned_brands);

-- RLS
ALTER TABLE public.response_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read response_data for their accounts"
  ON public.response_data FOR SELECT USING (
    account_id IN (
      SELECT au.account_id FROM public.account_users au
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Service role full access to response_data"
  ON public.response_data FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- STEP 3: Expand citations table
-- ============================================================================
-- The existing citations table (from 20250910000000_create_jobs_system.sql) has:
--   citation_id, response_id (TEXT FK → responses), account_id, brand_id,
--   url, source_name, source_type, excerpt, relevance_score, authority_score, created_at
--
-- We create a NEW aeo_citations table aligned with the v3 spec to avoid
-- breaking the old citations table used by the jobs system.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.aeo_citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to response
  response_id uuid NOT NULL REFERENCES public.llm_response_files(id) ON DELETE CASCADE,

  -- Account for RLS
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,

  -- Source identity
  domain varchar(255) NOT NULL,
  url text,
  page_title text,
  anchor_text text,

  -- Position
  citation_rank integer,                       -- ordinal position in response
  times_referenced integer NOT NULL DEFAULT 1,

  -- Classification
  source_type varchar(30) DEFAULT 'earned'
    CHECK (source_type IN ('owned', 'earned', 'competitor', 'news', 'paid', 'ugc', 'research', 'government', 'academic')),
  content_category varchar(30)
    CHECK (content_category IN ('news', 'blog', 'review', 'product', 'research', 'social', 'forum', 'directory')),

  -- Brand relevance
  benefits_brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  is_competitor_source boolean NOT NULL DEFAULT false,

  -- Authority
  domain_authority integer CHECK (domain_authority >= 0 AND domain_authority <= 100),
  is_high_authority boolean GENERATED ALWAYS AS (domain_authority >= 60) STORED,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_aeo_citations_response    ON public.aeo_citations (response_id);
CREATE INDEX idx_aeo_citations_domain      ON public.aeo_citations (domain);
CREATE INDEX idx_aeo_citations_brand       ON public.aeo_citations (benefits_brand_id, created_at DESC);
CREATE INDEX idx_aeo_citations_account     ON public.aeo_citations (account_id);
CREATE INDEX idx_aeo_citations_source_type ON public.aeo_citations (source_type);
CREATE INDEX idx_aeo_citations_authority   ON public.aeo_citations (domain_authority DESC)
  WHERE domain_authority IS NOT NULL;

-- RLS
ALTER TABLE public.aeo_citations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read aeo_citations for their accounts"
  ON public.aeo_citations FOR SELECT USING (
    account_id IN (
      SELECT au.account_id FROM public.account_users au
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Service role full access to aeo_citations"
  ON public.aeo_citations FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- STEP 4: daily_brand_metrics — Primary Time Series Table
-- ============================================================================
-- One row per brand per run date. Upserted by the daily aggregation job.
-- Dashboards read from this — never from response_data.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.daily_brand_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  run_date date NOT NULL,

  -- Volume
  total_responses integer NOT NULL DEFAULT 0,
  responses_with_mention integer NOT NULL DEFAULT 0,
  total_models_run integer NOT NULL DEFAULT 0,

  -- Core metrics
  visibility_rate numeric(5,2) DEFAULT 0,           -- (mention / total) × 100
  share_of_voice numeric(5,2) DEFAULT 0,             -- brand mentions / all brand mentions × 100
  avg_brand_rank numeric(4,2),                        -- lower = better
  avg_sentiment numeric(4,3) DEFAULT 0,
  citation_rate numeric(5,2) DEFAULT 0,               -- % responses with ≥1 citation
  lvi_score numeric(5,2) DEFAULT 0,                   -- composite — see LVI formula
  recommendation_rate numeric(5,2) DEFAULT 0,         -- % is_primary_recommendation

  -- Citation detail
  total_citations integer NOT NULL DEFAULT 0,
  unique_citing_domains integer NOT NULL DEFAULT 0,

  -- Context
  avg_competitive_density numeric(4,2) DEFAULT 0,

  -- Version guard for trend continuity
  metric_version integer NOT NULL DEFAULT 1,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Upsert key
  UNIQUE (brand_id, run_date)
);

-- Indexes
CREATE INDEX idx_dbm_brand_date ON public.daily_brand_metrics (brand_id, run_date DESC);
CREATE INDEX idx_dbm_account    ON public.daily_brand_metrics (account_id, run_date DESC);
CREATE INDEX idx_dbm_lvi        ON public.daily_brand_metrics (lvi_score DESC);

-- RLS
ALTER TABLE public.daily_brand_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read daily_brand_metrics for their accounts"
  ON public.daily_brand_metrics FOR SELECT USING (
    account_id IN (
      SELECT au.account_id FROM public.account_users au
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Service role full access to daily_brand_metrics"
  ON public.daily_brand_metrics FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- STEP 5: daily_prompt_metrics — Prompt-Level Time Series
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.daily_prompt_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  prompt_id uuid NOT NULL REFERENCES public.user_prompts(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  run_date date NOT NULL,

  -- Volume
  total_responses integer NOT NULL DEFAULT 0,

  -- Core metrics (same 5 as daily_brand_metrics, prompt-scoped)
  visibility_rate numeric(5,2) DEFAULT 0,
  share_of_voice numeric(5,2) DEFAULT 0,
  avg_brand_rank numeric(4,2),
  avg_sentiment numeric(4,3) DEFAULT 0,
  citation_rate numeric(5,2) DEFAULT 0,
  lvi_score numeric(5,2) DEFAULT 0,

  -- Prompt-specific
  model_consistency numeric(5,2) DEFAULT 0,     -- % models that agreed on mentioning brand
  best_performing_model varchar(100),
  avg_response_word_count integer DEFAULT 0,

  -- Version guard
  metric_version integer NOT NULL DEFAULT 1,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Upsert key
  UNIQUE (prompt_id, brand_id, run_date)
);

-- Indexes
CREATE INDEX idx_dpm_prompt_date ON public.daily_prompt_metrics (prompt_id, run_date DESC);
CREATE INDEX idx_dpm_brand_date  ON public.daily_prompt_metrics (brand_id, run_date DESC);
CREATE INDEX idx_dpm_account     ON public.daily_prompt_metrics (account_id, run_date DESC);

-- RLS
ALTER TABLE public.daily_prompt_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read daily_prompt_metrics for their accounts"
  ON public.daily_prompt_metrics FOR SELECT USING (
    account_id IN (
      SELECT au.account_id FROM public.account_users au
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Service role full access to daily_prompt_metrics"
  ON public.daily_prompt_metrics FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- STEP 6: Enhance competitors table — add linked_brand_id
-- ============================================================================
-- The competitors table (from comprehensive_schema.sql) has:
--   id, account_id, brand_id (the brand that considers this entity a competitor),
--   name, domain, description, industry, is_active, metadata, created_at
--
-- Add linked_brand_id so competitors can flow through the same pipeline as brands.
-- ============================================================================

-- Add linked_brand_id FK to the existing competitors table
ALTER TABLE public.competitors
  ADD COLUMN IF NOT EXISTS linked_brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.competitors.linked_brand_id IS
  'FK to brands — when set, the pipeline creates response_data rows for this competitor using the linked brand record. Enables full metrics tracking.';

CREATE INDEX IF NOT EXISTS idx_competitors_linked_brand
  ON public.competitors (linked_brand_id) WHERE linked_brand_id IS NOT NULL;

-- ============================================================================
-- STEP 7: Add aliases column to brands if not exists
-- ============================================================================
-- entity_aliases already exists from 20250828010000 migration.
-- Ensure it is usable by the extractor for brand resolution.
-- ============================================================================

-- entity_aliases already exists — just add comment
COMMENT ON COLUMN public.brands.entity_aliases IS
  'Alternative names/spellings/abbreviations the extractor uses for brand resolution';

-- ============================================================================
-- STEP 8: LVI config table for adjustable weights
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lvi_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  visibility_weight numeric(3,2) NOT NULL DEFAULT 0.30,
  rank_weight numeric(3,2) NOT NULL DEFAULT 0.25,
  citation_weight numeric(3,2) NOT NULL DEFAULT 0.25,
  sentiment_weight numeric(3,2) NOT NULL DEFAULT 0.20,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- One config per account (NULL = global default)
  UNIQUE (account_id)
);

-- Seed global default config
INSERT INTO public.lvi_config (account_id, visibility_weight, rank_weight, citation_weight, sentiment_weight, version)
VALUES (NULL, 0.30, 0.25, 0.25, 0.20, 1)
ON CONFLICT (account_id) DO NOTHING;

ALTER TABLE public.lvi_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read lvi_config"
  ON public.lvi_config FOR SELECT USING (true);

CREATE POLICY "Service role full access to lvi_config"
  ON public.lvi_config FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- STEP 9: Updated trigger for updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_daily_brand_metrics_updated
  BEFORE UPDATE ON public.daily_brand_metrics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_daily_prompt_metrics_updated
  BEFORE UPDATE ON public.daily_prompt_metrics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;
