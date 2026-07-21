-- ============================================================================
-- Migration: Use pre-computed lvi_score in materialized view
-- ============================================================================
-- The response_analysis table now has a pre-computed lvi_score column (0-100)
-- calculated by the analysis engine v4.0. Update the materialized view to use
-- it directly instead of recomputing from component scores.
-- ============================================================================

BEGIN;

-- Recreate mv_daily_brand_model_metrics using the pre-computed lvi_score
DROP MATERIALIZED VIEW IF EXISTS mv_daily_brand_model_metrics CASCADE;

CREATE MATERIALIZED VIEW mv_daily_brand_model_metrics AS
SELECT
    CASE
        WHEN is_primary_brand = true THEN brand_id
        ELSE competitor_id
    END AS entity_id,
    brand_id AS primary_brand_id,
    competitor_id,
    brand_name,
    is_primary_brand,
    account_id,
    brand_id,
    model_name,
    analysis_date,

    -- Response counts
    count(DISTINCT response_id) AS total_responses,
    count(DISTINCT prompt_id)   AS total_prompts,
    count(*) FILTER (WHERE brand_mentioned = true) AS mention_count,
    count(*) AS total_analyses,

    -- Visibility score: avg of binary mentioned (0-1)
    avg(CASE WHEN brand_mentioned THEN 1.0 ELSE 0.0 END) AS avg_visibility_score,

    -- Citation counts
    sum(brand_citation_count) AS citation_count,
    sum((COALESCE(all_sources_in_response->>'total_sources','0'))::int) AS total_citations,

    -- Citation rate: brand citations / total sources per response
    avg(CASE
        WHEN (COALESCE(all_sources_in_response->>'total_sources','0'))::int > 0
        THEN brand_citation_count::numeric / (COALESCE(all_sources_in_response->>'total_sources','1'))::int::numeric
        ELSE 0
    END) AS avg_citation_rate,

    -- Sentiment (raw -1 to 1 average among mentioned responses)
    avg(brand_sentiment) FILTER (WHERE brand_mentioned = true) AS avg_sentiment_score,

    -- Sentiment distribution
    count(*) FILTER (WHERE brand_sentiment > 0.3)   AS positive_count,
    count(*) FILTER (WHERE brand_sentiment >= -0.3 AND brand_sentiment <= 0.3) AS neutral_count,
    count(*) FILTER (WHERE brand_sentiment < -0.3)  AS negative_count,

    -- Position quality: ordinal position 1=1.0, 11+=0.0
    avg(CASE
        WHEN brand_first_position IS NOT NULL AND brand_first_position > 0
        THEN GREATEST(0::numeric, 1.0 - (brand_first_position - 1)::numeric * 0.1)
        ELSE 0::numeric
    END) FILTER (WHERE brand_mentioned = true) AS avg_position_score,

    -- Raw position stats
    min(brand_first_position) FILTER (WHERE brand_first_position > 0) AS best_position,
    max(brand_first_position) FILTER (WHERE brand_first_position > 0) AS worst_position,
    avg(brand_first_position) FILTER (WHERE brand_first_position > 0) AS avg_raw_position,

    -- Share of voice
    avg(share_of_voice) AS avg_share_of_voice,

    -- LVI: Use pre-computed lvi_score from the analysis engine (0-100 scale)
    avg(COALESCE(lvi_score, 0)) AS avg_lvi_score,

    -- Factual accuracy
    sum(factual_claims_made)    AS total_factual_claims,
    sum(factual_claims_correct) AS correct_factual_claims,
    avg(factual_accuracy_rate)  AS factual_accuracy_pct,

    max(analyzed_at) AS last_analyzed,
    now() AS materialized_at

FROM response_analysis ra
GROUP BY
    CASE
        WHEN is_primary_brand = true THEN brand_id
        ELSE competitor_id
    END,
    brand_id, competitor_id, brand_name, is_primary_brand,
    account_id, model_name, analysis_date;

-- Recreate unique index for CONCURRENTLY refresh
CREATE UNIQUE INDEX idx_mv_daily_brand_model_uniq
    ON mv_daily_brand_model_metrics (entity_id, primary_brand_id, model_name, analysis_date);

-- Recreate enhanced_brand_metrics view (depends on the matview)
CREATE OR REPLACE VIEW enhanced_brand_metrics AS
SELECT
    entity_id       AS id,
    primary_brand_id AS brand_id,
    account_id,
    model_name,
    analysis_date   AS date,
    avg_lvi_score   AS llm_visibility_index,
    avg_share_of_voice AS generative_sov,
    mention_count   AS mention_frequency,
    citation_count,
    ((COALESCE(avg_sentiment_score, 0) + 1) / 2.0) * 100 AS ai_sentiment_score,
    avg_position_score AS position_quality_score,
    avg_visibility_score,
    avg_citation_rate,
    total_responses,
    total_prompts,
    best_position,
    worst_position,
    avg_raw_position,
    positive_count,
    neutral_count,
    negative_count,
    total_factual_claims,
    correct_factual_claims,
    factual_accuracy_pct,
    last_analyzed,
    materialized_at,
    NULL::uuid AS prompt_id
FROM mv_daily_brand_model_metrics;

-- Grant access
GRANT SELECT ON mv_daily_brand_model_metrics TO authenticated;
GRANT SELECT ON enhanced_brand_metrics TO authenticated;

-- Refresh the materialized view with current data
REFRESH MATERIALIZED VIEW mv_daily_brand_model_metrics;

COMMIT;
