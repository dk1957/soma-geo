-- ============================================================
-- Migration: response_drilldown view
-- Date: 2026-04-10
-- Purpose: Computed per-response LVI, SOV, and competitive
--          positioning — derived on read, never stored.
--          Formula changes = ALTER VIEW, no data migration.
-- ============================================================

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

  -- Facts (already stored in response_data)
  rd.mentioned,
  rd.brand_rank,
  rd.brand_mention_count,
  rd.raw_sentiment,
  rd.is_primary_recommendation,
  rd.citation_count,
  rd.total_response_citations,
  rd.competitive_density,
  rd.co_mentioned_brands,

  -- Computed on read — formula changes cost nothing
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

  -- Competitive positioning label (derived, not stored)
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

-- Grant read access through RLS on the underlying tables.
-- Views inherit the RLS policies of their base tables when
-- queried by non-superuser roles, so no separate policy needed.
COMMENT ON VIEW response_drilldown IS
  'Per-response LVI, SOV, and competitive positioning computed on read. '
  'Formula changes = ALTER VIEW, no migration or historical data rewrite.';
