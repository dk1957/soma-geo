-- Migration: Drop metric tables and related functions
-- Context: brand_appearances, brand_daily_stats, and brand_sources are being
--          removed in preparation for a new metrics architecture redesign.
--          All 36 metric-related functions are also dropped (confirmed zero code references).

BEGIN;

-- ============================================================
-- 1. Drop 36 metric-related functions (all confirmed unused in codebase)
-- ============================================================
DROP FUNCTION IF EXISTS calculate_bvi_trend(uuid, uuid, integer);
DROP FUNCTION IF EXISTS calculate_citation_authority(text, text, boolean);
DROP FUNCTION IF EXISTS calculate_citation_rate(uuid, uuid, uuid, interval);
DROP FUNCTION IF EXISTS calculate_generative_sov(integer, integer);
DROP FUNCTION IF EXISTS calculate_isr(uuid, text, numeric);
DROP FUNCTION IF EXISTS calculate_ldi_score(uuid, text);
DROP FUNCTION IF EXISTS calculate_ldi_score(uuid, locale_code, llm_platform, interval);
DROP FUNCTION IF EXISTS calculate_llm_visibility_index(integer, numeric, integer, integer, numeric);
DROP FUNCTION IF EXISTS calculate_lvi_score(numeric, numeric, numeric, numeric);
DROP FUNCTION IF EXISTS calculate_lvi_score_v2(numeric, numeric, numeric, numeric);
DROP FUNCTION IF EXISTS calculate_mis(uuid, text);
DROP FUNCTION IF EXISTS calculate_platform_ldi(uuid, text);
DROP FUNCTION IF EXISTS calculate_position_score(integer, integer);
DROP FUNCTION IF EXISTS calculate_sap_score(uuid, uuid);
DROP FUNCTION IF EXISTS calculate_visibility_score(uuid);
DROP FUNCTION IF EXISTS compute_daily_stats(uuid, uuid, date);
DROP FUNCTION IF EXISTS create_ldi_snapshot(uuid, integer, jsonb, integer, integer, jsonb, jsonb, jsonb);
DROP FUNCTION IF EXISTS get_brand_analytics_summary(uuid, integer);
DROP FUNCTION IF EXISTS get_brand_performance_summary(uuid, integer);
DROP FUNCTION IF EXISTS get_competitive_comparison(uuid, text[], integer);
DROP FUNCTION IF EXISTS get_competitive_position(uuid);
DROP FUNCTION IF EXISTS get_competitive_positioning_trend(uuid, uuid, integer);
DROP FUNCTION IF EXISTS get_competitor_analysis(uuid, integer);
DROP FUNCTION IF EXISTS get_competitor_share_of_answers(uuid, text, locale_code, interval);
DROP FUNCTION IF EXISTS get_ground_truth_for_ldi_calculation(uuid, uuid, integer);
DROP FUNCTION IF EXISTS get_ldi_trends(uuid, integer);
DROP FUNCTION IF EXISTS get_model_performance_summary(integer);
DROP FUNCTION IF EXISTS get_optimization_opportunities(uuid, text);
DROP FUNCTION IF EXISTS get_optimization_summary(uuid);
DROP FUNCTION IF EXISTS get_platform_performance(uuid);
DROP FUNCTION IF EXISTS get_provider_performance(uuid, integer);
DROP FUNCTION IF EXISTS get_report_stats(uuid, text, boolean);
DROP FUNCTION IF EXISTS get_timeseries_data(uuid, integer, boolean);
DROP FUNCTION IF EXISTS get_top_queries(uuid, integer);
DROP FUNCTION IF EXISTS identify_citation_gaps(uuid, text, integer);
DROP FUNCTION IF EXISTS update_response_metrics();

-- ============================================================
-- 2. Drop the 3 metric tables
--    CASCADE handles FKs, indexes, RLS policies, triggers automatically
-- ============================================================
DROP TABLE IF EXISTS brand_appearances CASCADE;
DROP TABLE IF EXISTS brand_daily_stats CASCADE;
DROP TABLE IF EXISTS brand_sources CASCADE;

COMMIT;
