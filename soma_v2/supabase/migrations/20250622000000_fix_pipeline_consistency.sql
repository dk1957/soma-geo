-- ============================================================================
-- Migration: Fix Data Pipeline Consistency
-- ============================================================================
-- Fixes:
-- 1. Remove spurious +10 offset from LVI calculation in mv_daily_brand_model_metrics
-- 2. Fix enhanced_brand_metrics view: rename domain_authority_score → position_quality_score
--    and convert sentiment from raw (-1,1) to 0-100 scale
-- 3. Standardize LVI formula across matview and application code
-- ============================================================================

BEGIN;

-- 1. Recreate mv_daily_brand_model_metrics with corrected LVI formula
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

    -- LVI: Canonical formula (NO +10 offset)
    -- LVI = (Visibility*100*0.3) + (CitationRate*100*0.3) + (SentimentNorm*100*0.2) + (Position*100*0.2)
    -- Range: 0-100
    avg(
        (CASE WHEN brand_mentioned THEN 1.0 ELSE 0.0 END * 100 * 0.3)
      + (CASE
            WHEN (COALESCE(all_sources_in_response->>'total_sources','0'))::int > 0
            THEN brand_citation_count::numeric / (COALESCE(all_sources_in_response->>'total_sources','1'))::int::numeric
            ELSE 0
         END * 100 * 0.3)
      + (((COALESCE(brand_sentiment, 0) + 1) / 2.0) * 100 * 0.2)
      + (CASE
            WHEN brand_first_position IS NOT NULL AND brand_first_position > 0
            THEN GREATEST(0::numeric, 1.0 - (brand_first_position - 1)::numeric * 0.1)
            ELSE 0::numeric
         END * 100 * 0.2)
    ) AS avg_lvi_score,

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

-- 2. Recreate enhanced_brand_metrics view with fixes:
--    a) Rename domain_authority_score → position_quality_score (semantic accuracy)
--    b) Convert sentiment from raw (-1,1) to 0-100 scale (dashboard expects 0-100)
DROP VIEW IF EXISTS enhanced_brand_metrics;

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
    -- Convert sentiment from raw (-1..1) to 0-100 scale for dashboard consumption
    ((COALESCE(avg_sentiment_score, 0) + 1) / 2.0) * 100 AS ai_sentiment_score,
    -- Correctly named: position quality, NOT domain authority
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

COMMIT;
