-- Database Cleanup Script
-- Date: October 31, 2025
-- Purpose: Document tables and views removed during database cleanup
-- 
-- WARNING: This script is for reference only. DO NOT RUN IT as the cleanup has already been completed.
-- Running this script would fail as these objects no longer exist in the database.

-- =============================================================================
-- REMOVED DUPLICATE VIEWS
-- =============================================================================

-- DROP VIEW IF EXISTS latest_brand_metrics CASCADE;
-- DROP VIEW IF EXISTS latest_enhanced_metrics CASCADE;

-- =============================================================================
-- REMOVED ANALYTICS MATERIALIZED VIEWS
-- =============================================================================

-- DROP MATERIALIZED VIEW IF EXISTS analytics_hourly CASCADE;
-- DROP MATERIALIZED VIEW IF EXISTS analytics_daily CASCADE;
-- DROP MATERIALIZED VIEW IF EXISTS analytics_weekly CASCADE;

-- =============================================================================
-- REMOVED EMPTY TABLES (Large - >500KB)
-- =============================================================================

-- DROP TABLE IF EXISTS response_embeddings CASCADE;         -- 2.7 MB, 0 rows
-- DROP TABLE IF EXISTS query_pattern_vectors CASCADE;       -- 1.6 MB, 0 rows
-- DROP TABLE IF EXISTS analytics_events CASCADE;            -- 1.0 MB, 0 rows

-- =============================================================================
-- REMOVED EMPTY TABLES (Medium - 100KB-500KB)
-- =============================================================================

-- DROP TABLE IF EXISTS gseo_evaluations CASCADE;            -- 312 KB, 0 rows
-- DROP TABLE IF EXISTS enhanced_brand_metrics CASCADE;      -- 208 KB, 0 rows
-- DROP TABLE IF EXISTS onboarding_audits CASCADE;           -- 176 KB, 0 rows
-- DROP TABLE IF EXISTS query_performance CASCADE;           -- 160 KB, 0 rows
-- DROP TABLE IF EXISTS gseo_content CASCADE;                -- 152 KB, 0 rows
-- DROP TABLE IF EXISTS gseo_optimization_history CASCADE;   -- 152 KB, 0 rows
-- DROP TABLE IF EXISTS brand_llm_indices CASCADE;           -- 144 KB, 0 rows
-- DROP TABLE IF EXISTS competitor_intelligence CASCADE;     -- 144 KB, 0 rows
-- DROP TABLE IF EXISTS competitive_visibility_analysis CASCADE; -- 128 KB, 0 rows
-- DROP TABLE IF EXISTS action_items CASCADE;                -- 128 KB, 0 rows
-- DROP TABLE IF EXISTS platform_performance CASCADE;        -- 128 KB, 0 rows
-- DROP TABLE IF EXISTS foundational_metrics CASCADE;        -- 112 KB, 0 rows
-- DROP TABLE IF EXISTS brand_monitoring_config CASCADE;     -- 104 KB, 0 rows
-- DROP TABLE IF EXISTS gseo_optimization_sessions CASCADE;  -- 96 KB, 0 rows
-- DROP TABLE IF EXISTS daily_brand_metrics CASCADE;         -- 88 KB, 0 rows
-- DROP TABLE IF EXISTS geo_analyses CASCADE;                -- 1.8 MB, 0 rows (with FKs)

-- =============================================================================
-- REMOVED EMPTY TABLES (Small - <100KB)
-- =============================================================================

-- DROP TABLE IF EXISTS competitor_analysis CASCADE;         -- 80 KB, 0 rows
-- DROP TABLE IF EXISTS brand_content_sources CASCADE;       -- 80 KB, 0 rows
-- DROP TABLE IF EXISTS topical_performance CASCADE;         -- 80 KB, 0 rows
-- DROP TABLE IF EXISTS content_docs CASCADE;                -- 72 KB, 0 rows
-- DROP TABLE IF EXISTS source_analysis CASCADE;             -- 72 KB, 0 rows
-- DROP TABLE IF EXISTS ai_rankings CASCADE;                 -- 64 KB, 0 rows
-- DROP TABLE IF EXISTS competitive_analysis_vectors CASCADE; -- 64 KB, 0 rows
-- DROP TABLE IF EXISTS enhanced_metrics CASCADE;            -- 48 KB, 0 rows
-- DROP TABLE IF EXISTS account_api_tokens CASCADE;          -- 48 KB, 0 rows
-- DROP TABLE IF EXISTS enhanced_billing_events CASCADE;     -- 48 KB, 0 rows
-- DROP TABLE IF EXISTS notification_channels CASCADE;       -- 48 KB, 0 rows
-- DROP TABLE IF EXISTS report_sections CASCADE;             -- 48 KB, 0 rows
-- DROP TABLE IF EXISTS citations CASCADE;                   -- 48 KB, 0 rows
-- DROP TABLE IF EXISTS citation_analysis CASCADE;           -- 40 KB, 0 rows
-- DROP TABLE IF EXISTS metrics_calculation_jobs CASCADE;    -- 40 KB, 0 rows
-- DROP TABLE IF EXISTS metrics CASCADE;                     -- 40 KB, 0 rows
-- DROP TABLE IF EXISTS feed_items CASCADE;                  -- 40 KB, 0 rows
-- DROP TABLE IF EXISTS vector_similarity_searches CASCADE;  -- 40 KB, 0 rows
-- DROP TABLE IF EXISTS sites CASCADE;                       -- 40 KB, 0 rows
-- DROP TABLE IF EXISTS prompt_analyses CASCADE;             -- 40 KB, 0 rows
-- DROP TABLE IF EXISTS audits CASCADE;                      -- 32 KB, 0 rows
-- DROP TABLE IF EXISTS brand_mentions CASCADE;              -- 32 KB, 0 rows
-- DROP TABLE IF EXISTS gseo_benchmarks CASCADE;             -- 32 KB, 0 rows
-- DROP TABLE IF EXISTS analysis_batches CASCADE;            -- 32 KB, 0 rows
-- DROP TABLE IF EXISTS source_authorities CASCADE;          -- 24 KB, 0 rows
-- DROP TABLE IF EXISTS audit_reports CASCADE;               -- 16 KB, 0 rows
-- DROP TABLE IF EXISTS brand_intelligence_reports CASCADE;  -- 16 KB, 0 rows
-- DROP TABLE IF EXISTS audit_scores CASCADE;                -- 16 KB, 0 rows

-- =============================================================================
-- CASCADED DEPENDENCIES THAT WERE AUTOMATICALLY REMOVED
-- =============================================================================

-- Views removed with CASCADE:
--   - weekly_brand_metrics (depended on daily_brand_metrics)
--   - monthly_brand_metrics (depended on daily_brand_metrics)
--   - aggregated_brand_performance (depended on enhanced_brand_metrics)
--   - citation_gap_analysis (depended on citations)

-- Foreign key constraints removed with CASCADE:
--   - mentions_analysis_id_fkey (from geo_analyses)
--   - competitors_analysis_id_fkey (from geo_analyses)
--   - brand_analysis_metrics_geo_analysis_id_fkey (from geo_analyses)
--   - gseo_optimization_history_content_id_fkey (from gseo_content)
--   - user_prompts_audit_id_fkey (from onboarding_audits)
--   - feed_items_doc_id_fkey (from content_docs)
--   - audits_site_id_fkey (from sites)
--   - audit_scores_audit_report_id_fkey (from audit_reports)

-- Policies removed with CASCADE:
--   - Users can access feed items for their content docs (on feed_items)
--   - Users can view optimization history for their content (on gseo_optimization_history)

-- =============================================================================
-- CLEANUP SUMMARY
-- =============================================================================

-- Tables before: 77
-- Tables after: 30
-- Tables removed: 47 (61% reduction)
-- Views removed: 2
-- Materialized views removed: 3
-- Space freed: ~10+ MB
-- Final database size: ~10 MB

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Count remaining tables
-- SELECT COUNT(*) as total_tables 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- List remaining tables with sizes
-- SELECT 
--     t.table_name,
--     COALESCE(s.n_live_tup, 0) as row_count,
--     pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name))) as table_size
-- FROM information_schema.tables t
-- LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
-- WHERE t.table_schema = 'public' 
--   AND t.table_type = 'BASE TABLE'
-- ORDER BY pg_total_relation_size(quote_ident(t.table_name)) DESC;

-- Check remaining views
-- SELECT table_name, table_type 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
--   AND table_type IN ('VIEW');

-- Check remaining materialized views
-- SELECT schemaname, matviewname 
-- FROM pg_matviews 
-- WHERE schemaname = 'public';

-- =============================================================================
-- END OF SCRIPT
-- =============================================================================
