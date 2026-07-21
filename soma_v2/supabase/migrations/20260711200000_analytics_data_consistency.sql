-- ============================================================================
-- Analytics Data Consistency Migration
-- ============================================================================
-- PURPOSE: Production-ready analytics layer for BI export and dashboards
--
-- 1. Add daily_model_metrics table (per-model × brand × date breakdown)
-- 2. Drop stale views/functions that reference non-existent tables
-- 3. Add analytics_api_keys table for external BI access
-- 4. Add data export tracking
-- ============================================================================

-- ============================================================================
-- 1. daily_model_metrics: Per-Model Breakdown
-- ============================================================================
-- The existing daily_brand_metrics aggregates ACROSS models.
-- BI users need per-model granularity to compare ChatGPT vs Gemini vs Claude etc.

CREATE TABLE IF NOT EXISTS public.daily_model_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL,
  run_date DATE NOT NULL,

  -- Counts
  total_responses INTEGER NOT NULL DEFAULT 0,
  responses_with_mention INTEGER NOT NULL DEFAULT 0,

  -- Rates (0-100 scale)
  visibility_rate NUMERIC(7,2) NOT NULL DEFAULT 0,
  citation_rate NUMERIC(7,2) NOT NULL DEFAULT 0,
  recommendation_rate NUMERIC(7,2) NOT NULL DEFAULT 0,

  -- Scores
  avg_brand_rank NUMERIC(5,2),
  avg_sentiment NUMERIC(5,3) DEFAULT 0,
  lvi_score NUMERIC(7,2) NOT NULL DEFAULT 0,
  share_of_voice NUMERIC(7,2) NOT NULL DEFAULT 0,

  -- Citation details
  total_citations INTEGER NOT NULL DEFAULT 0,
  total_brand_mentions INTEGER NOT NULL DEFAULT 0,

  -- Versioning
  metric_version INTEGER NOT NULL DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One row per brand × model × date
  CONSTRAINT uq_daily_model_metrics UNIQUE (brand_id, model_name, run_date)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_daily_model_metrics_brand_date
  ON public.daily_model_metrics (brand_id, run_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_model_metrics_account
  ON public.daily_model_metrics (account_id, run_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_model_metrics_model
  ON public.daily_model_metrics (model_name, run_date DESC);

-- RLS
ALTER TABLE public.daily_model_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their account model metrics"
  ON public.daily_model_metrics FOR SELECT
  USING (
    account_id IN (
      SELECT au.account_id FROM public.account_users au
      WHERE au.clerk_id = auth.jwt() ->> 'sub'
      AND au.is_active = true
    )
  );

CREATE POLICY "Service role can manage model metrics"
  ON public.daily_model_metrics FOR ALL
  USING (true)
  WITH CHECK (true);

-- Updated_at trigger
CREATE TRIGGER set_daily_model_metrics_updated_at
  BEFORE UPDATE ON public.daily_model_metrics
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- 2. analytics_api_keys: External BI Access
-- ============================================================================
-- Allow users to generate API keys for connecting BI tools (Tableau, Looker, etc.)

CREATE TABLE IF NOT EXISTS public.analytics_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,           -- SHA-256 hash of the API key (never store plaintext)
  key_prefix TEXT NOT NULL,         -- First 8 chars for identification (e.g., "soma_k_ab")
  name TEXT NOT NULL,               -- User-given name (e.g., "Tableau Production")
  scopes TEXT[] NOT NULL DEFAULT ARRAY['analytics:read'],  -- Permissions
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL,         -- clerk_id of creator
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_api_keys_hash
  ON public.analytics_api_keys (key_hash) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_analytics_api_keys_account
  ON public.analytics_api_keys (account_id) WHERE is_active = true;

ALTER TABLE public.analytics_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their account API keys"
  ON public.analytics_api_keys FOR ALL
  USING (
    account_id IN (
      SELECT au.account_id FROM public.account_users au
      WHERE au.clerk_id = auth.jwt() ->> 'sub'
      AND au.is_active = true
      AND au.role IN ('owner', 'admin')
    )
  );


-- ============================================================================
-- 3. data_exports: Track export history for auditing
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  export_type TEXT NOT NULL,           -- 'brand_metrics', 'prompt_metrics', 'model_metrics', 'citations', 'responses', 'full'
  format TEXT NOT NULL DEFAULT 'csv',  -- 'csv', 'json', 'xlsx'
  filters JSONB DEFAULT '{}',          -- Date range, models, etc.
  row_count INTEGER,
  file_size_bytes BIGINT,
  initiated_by TEXT NOT NULL,          -- clerk_id or api_key_prefix
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_exports_account
  ON public.data_exports (account_id, created_at DESC);

ALTER TABLE public.data_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their account exports"
  ON public.data_exports FOR SELECT
  USING (
    account_id IN (
      SELECT au.account_id FROM public.account_users au
      WHERE au.clerk_id = auth.jwt() ->> 'sub'
      AND au.is_active = true
    )
  );

CREATE POLICY "Service role can manage exports"
  ON public.data_exports FOR ALL
  USING (true)
  WITH CHECK (true);


-- ============================================================================
-- 4. Drop stale views & functions
-- ============================================================================

-- enhanced_brand_metrics view references old matviews that were dropped
DROP VIEW IF EXISTS public.enhanced_brand_metrics CASCADE;

-- get_source_citation_analysis queries old response_analysis table
DROP FUNCTION IF EXISTS public.get_source_citation_analysis(UUID, INTEGER) CASCADE;

-- Stale functions from llm_monitoring_tables that reference llm_query_results
DROP FUNCTION IF EXISTS public.get_brand_monitoring_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_competitor_analysis(UUID, INTEGER) CASCADE;


-- ============================================================================
-- 5. Grants
-- ============================================================================

GRANT SELECT ON public.daily_model_metrics TO authenticated;
GRANT SELECT ON public.analytics_api_keys TO authenticated;
GRANT SELECT ON public.data_exports TO authenticated;
