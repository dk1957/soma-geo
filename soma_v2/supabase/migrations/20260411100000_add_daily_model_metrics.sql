-- ============================================================================
-- daily_model_metrics — Model-Level Time Series
-- Tracks per-model performance metrics for each brand per day.
-- Used by AEOAggregatorService.storeModelMetrics()
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.daily_model_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  model_name varchar(100) NOT NULL,
  run_date date NOT NULL,

  -- Volume
  total_responses integer NOT NULL DEFAULT 0,
  responses_with_mention integer NOT NULL DEFAULT 0,

  -- Core metrics
  visibility_rate numeric(5,2) DEFAULT 0,
  citation_rate numeric(5,2) DEFAULT 0,
  recommendation_rate numeric(5,2) DEFAULT 0,
  avg_brand_rank numeric(4,2),
  avg_sentiment numeric(4,3) DEFAULT 0,
  lvi_score numeric(5,2) DEFAULT 0,
  share_of_voice numeric(5,2) DEFAULT 0,

  -- Counts
  total_citations integer NOT NULL DEFAULT 0,
  total_brand_mentions integer NOT NULL DEFAULT 0,

  -- Version guard
  metric_version integer NOT NULL DEFAULT 1,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Upsert key (matches onConflict in storeModelMetrics)
  UNIQUE (brand_id, model_name, run_date)
);

-- Indexes
CREATE INDEX idx_dmm_brand_date ON public.daily_model_metrics (brand_id, run_date DESC);
CREATE INDEX idx_dmm_model_date ON public.daily_model_metrics (model_name, run_date DESC);
CREATE INDEX idx_dmm_account    ON public.daily_model_metrics (account_id, run_date DESC);

-- RLS
ALTER TABLE public.daily_model_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read daily_model_metrics for their accounts"
  ON public.daily_model_metrics FOR SELECT USING (
    account_id IN (
      SELECT au.account_id FROM public.account_users au
      WHERE au.user_id = auth.uid() AND au.is_active = true
    )
  );

CREATE POLICY "Service role full access to daily_model_metrics"
  ON public.daily_model_metrics FOR ALL
  USING (auth.role() = 'service_role');

-- Auto-update updated_at
CREATE TRIGGER trg_daily_model_metrics_updated
  BEFORE UPDATE ON public.daily_model_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
