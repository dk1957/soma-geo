-- ============================================================================
-- External Report Schema - Master Migration
-- ============================================================================
-- This migration creates all tables and functions needed for the external
-- brand visibility report analytics and visualizations.
--
-- Components:
-- 1. brand_performance_metrics - Aggregated metrics per brand
-- 2. topic_brand_associations - Topic-brand heatmap data
-- 3. brand_metrics_timeseries - Time-series data for trend charts
-- 4. prompt_performance_analysis - Per-prompt competitive analysis
-- 5. citation_domain_analysis - Source/citation analysis
-- 6. Helper functions for aggregation
--
-- Run this migration to set up the complete analytics infrastructure.
-- ============================================================================

\i 01_brand_performance_metrics.sql
\i 02_topic_brand_associations.sql
\i 03_brand_metrics_timeseries.sql
\i 04_prompt_performance_analysis.sql
\i 05_citation_domain_analysis.sql
\i 06_helper_functions.sql
