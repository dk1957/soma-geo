-- ============================================================
-- Migration: Security & performance fixes from architectural audit
-- Date: 2026-04-10
-- ============================================================

-- ─── 1. CRITICAL: response_drilldown view must use security_invoker ───
-- PG 17 supports security_invoker. Without it the view runs as the
-- owner (superuser) and bypasses RLS on response_data + llm_response_files.
-- Any authenticated user could see ALL accounts' data.

CREATE OR REPLACE VIEW response_drilldown
  WITH (security_invoker = true) AS
SELECT
  rd.id              AS response_data_id,
  rd.response_id,
  rd.brand_id,
  rd.account_id,
  r.prompt_id,
  r.model_name,
  r.run_id,

  rd.mentioned,
  rd.brand_rank,
  rd.brand_mention_count,
  rd.raw_sentiment,
  rd.is_primary_recommendation,
  rd.citation_count,
  rd.total_response_citations,
  rd.competitive_density,
  rd.co_mentioned_brands,

  CASE WHEN rd.mentioned THEN
    ROUND((
      (1.0 * 0.30)
      + (GREATEST(0, (1 - (rd.brand_rank - 1) * 0.2)) * 0.25)
      + (CASE WHEN rd.total_response_citations > 0
           THEN rd.citation_count::float / rd.total_response_citations
           ELSE 0 END * 0.25)
      + (((rd.raw_sentiment + 1) / 2.0) * 0.20)
    )::numeric * 100, 2)
  ELSE 0 END AS response_lvi,

  CASE WHEN rd.competitive_density > 0 THEN
    ROUND((
      rd.brand_mention_count::numeric
      / NULLIF(rd.competitive_density, 0)
    ) * 100, 2)
  ELSE NULL END AS response_sov,

  CASE
    WHEN NOT rd.mentioned                         THEN 'not_mentioned'
    WHEN rd.brand_rank = 1
     AND rd.is_primary_recommendation             THEN 'leader'
    WHEN rd.brand_rank <= 3                        THEN 'challenger'
    WHEN rd.brand_rank > 3                         THEN 'niche'
    ELSE 'neutral'
  END AS competitive_positioning

FROM response_data rd
JOIN llm_response_files r ON r.id = rd.response_id;

COMMENT ON VIEW response_drilldown IS
  'Per-response LVI, SOV, and competitive positioning computed on read. '
  'Uses security_invoker=true so RLS on base tables is enforced.';

-- ─── 2. HIGH: Enable RLS on runs ─────────────────────────────────────
-- runs already has a policy but RLS is disabled, so the policy is dead.
-- Any authenticated user can read ALL runs across ALL accounts.

ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

-- ─── 3. HIGH: Enable RLS on accounts ─────────────────────────────────
-- accounts has 4 policies defined but RLS disabled — policies are dead.

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- ─── 4. HIGH: Enable RLS on brands ───────────────────────────────────
-- brands has 6 policies defined but RLS disabled.

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- ─── 5. HIGH: Enable RLS on profiles ─────────────────────────────────
-- profiles has 7 policies defined but RLS disabled.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ─── 6. PERFORMANCE: Drop duplicate indexes (AEO tables) ─────────────
-- Each duplicate wastes storage and slows every INSERT/UPDATE.

-- daily_brand_metrics: idx_dbm_brand_date duplicates the UNIQUE constraint index
DROP INDEX IF EXISTS idx_dbm_brand_date;

-- domains: idx_domains_domain duplicates domains_domain_key (UNIQUE)
DROP INDEX IF EXISTS idx_domains_domain;

-- aeo_citations: idx_aeo_citations_response duplicates uq_aeo_citations_response_url
-- (both index response_id; the UNIQUE index covers response_id queries)
DROP INDEX IF EXISTS idx_aeo_citations_response;
