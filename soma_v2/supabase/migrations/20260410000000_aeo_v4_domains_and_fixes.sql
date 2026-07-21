-- ============================================================================
-- AEO Analysis System v4 — Domains table + schema fixes
-- ============================================================================
-- Date: 2026-04-10
-- Addresses:
--   1. Create `domains` canonical source registry
--   2. Add `domain_id` FK to aeo_citations, deprecate inline domain attrs
--   3. Add `run_date` to runs table (backfill from created_at)
--   4. Add UNIQUE (response_id, url) to aeo_citations for dedup
--   5. Add `total_brand_mentions` to daily_brand_metrics
--   6. Add `is_branded` flag to user_prompts
--   7. Create `topics` table per ERD spec
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Create `domains` — canonical source registry
-- ============================================================================
-- Single source of truth for domain metadata. Citations reference this
-- instead of duplicating domain attributes on every row.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.domains (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain              varchar(255) NOT NULL UNIQUE,
  display_name        varchar(255),

  -- Classification (set on first sight, refined by enrichment)
  source_type         varchar(30),
  content_category    varchar(30),

  -- Authority (updated by async enrichment job)
  domain_authority    integer,
  is_high_authority   boolean GENERATED ALWAYS AS (domain_authority >= 60) STORED,

  -- Flags
  is_known_aggregator boolean NOT NULL DEFAULT false,
  is_social_platform  boolean NOT NULL DEFAULT false,

  -- Running totals (updated by aggregation job)
  total_citations     integer NOT NULL DEFAULT 0,
  first_seen_at       timestamptz,
  last_cited_at       timestamptz,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_domains_authority ON public.domains(domain_authority DESC);
CREATE INDEX IF NOT EXISTS idx_domains_type ON public.domains(source_type);
CREATE INDEX IF NOT EXISTS idx_domains_domain ON public.domains(domain);

COMMENT ON TABLE public.domains IS 'Canonical domain registry. Cited domains are resolved here; attributes live in one place.';

-- RLS for domains
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to domains"
  ON public.domains FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read domains"
  ON public.domains FOR SELECT
  TO authenticated
  USING (true);


-- ============================================================================
-- 2. Add domain_id FK to aeo_citations
-- ============================================================================
-- The extractor will resolve/create the domain row first, then write
-- the citation with domain_id. Old columns (domain varchar, source_type,
-- content_category, domain_authority, is_high_authority) are kept for
-- backward compat but will be deprecated in code.
-- ============================================================================

ALTER TABLE public.aeo_citations
  ADD COLUMN IF NOT EXISTS domain_id uuid REFERENCES public.domains(id);

CREATE INDEX IF NOT EXISTS idx_aeo_citations_domain_id ON public.aeo_citations(domain_id);

COMMENT ON COLUMN public.aeo_citations.domain_id IS 'FK to domains table. New citations should always set this.';


-- ============================================================================
-- 3. Add UNIQUE constraint on aeo_citations (response_id, url)
-- ============================================================================
-- Prevents duplicate citations when extractor re-runs on a response.
-- URL can be null (domain-only citations), so we use COALESCE.
-- ============================================================================

-- Drop existing duplicates first (keep the most recent)
DELETE FROM public.aeo_citations a
USING public.aeo_citations b
WHERE a.id < b.id
  AND a.response_id = b.response_id
  AND COALESCE(a.url, '') = COALESCE(b.url, '');

CREATE UNIQUE INDEX IF NOT EXISTS uq_aeo_citations_response_url
  ON public.aeo_citations(response_id, COALESCE(url, ''));


-- ============================================================================
-- 4. Add run_date to runs table
-- ============================================================================
-- Every aggregation query groups by date. This column makes it explicit
-- rather than relying on created_at::date which is timezone-fragile.
-- ============================================================================

ALTER TABLE public.runs
  ADD COLUMN IF NOT EXISTS run_date date;

-- Backfill from created_at
UPDATE public.runs
  SET run_date = created_at::date
  WHERE run_date IS NULL;

-- Set default for future rows and make NOT NULL
ALTER TABLE public.runs
  ALTER COLUMN run_date SET DEFAULT CURRENT_DATE;

-- Don't set NOT NULL yet in case there are in-flight runs
-- but add an index
CREATE INDEX IF NOT EXISTS idx_runs_run_date ON public.runs(run_date);


-- ============================================================================
-- 5. Add total_brand_mentions to daily_brand_metrics
-- ============================================================================
-- Raw sum of brand_mention_count from response_data. This is the SOV
-- numerator and makes the calculation auditable without re-deriving.
-- ============================================================================

ALTER TABLE public.daily_brand_metrics
  ADD COLUMN IF NOT EXISTS total_brand_mentions integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.daily_brand_metrics.total_brand_mentions IS 'Sum of brand_mention_count across all responses. SOV numerator.';


-- ============================================================================
-- 6. Add is_branded to user_prompts
-- ============================================================================
-- Distinguishes "What do you think about Soma AI?" (branded, is_branded=true)
-- from "Best GEO platforms?" (unbranded). Unbranded visibility is more valuable.
-- ============================================================================

ALTER TABLE public.user_prompts
  ADD COLUMN IF NOT EXISTS is_branded boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.user_prompts.is_branded IS 'Whether the prompt explicitly names the brand. Unbranded visibility is more valuable.';


-- ============================================================================
-- 7. Create topics table per ERD spec
-- ============================================================================
-- Extracted topics per response. Enables:
-- - Topic clustering ("what topics drive brand mentions?")
-- - Topic-level sentiment tracking
-- - Content gap analysis
-- - Topic drift monitoring over time
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.topics (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id         uuid NOT NULL REFERENCES public.llm_response_files(id) ON DELETE CASCADE,
  account_id          uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name                varchar(255) NOT NULL,
  category            varchar(100),
  relevance           numeric,           -- 0.0 to 1.0
  sentiment           numeric,           -- -1.0 to 1.0

  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_topics_response ON public.topics(response_id);
CREATE INDEX IF NOT EXISTS idx_topics_account ON public.topics(account_id);
CREATE INDEX IF NOT EXISTS idx_topics_name ON public.topics(name);
CREATE INDEX IF NOT EXISTS idx_topics_category ON public.topics(category);

COMMENT ON TABLE public.topics IS 'Extracted topics per LLM response. Enables topic-level analytics.';

-- RLS for topics
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to topics"
  ON public.topics FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Users can read topics for their accounts"
  ON public.topics FOR SELECT
  TO authenticated
  USING (account_id IN (
    SELECT account_id FROM public.account_users
    WHERE clerk_id = auth.jwt() ->> 'sub'
      AND is_active = true
  ));


COMMIT;
