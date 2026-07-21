-- Fix unique indexes for materialized views to support concurrent refresh
-- Migration: 20251109_fix_materialized_view_unique_indexes.sql
-- Issue: Cannot use COALESCE or WHERE clauses in unique indexes for concurrent refresh

-- ============================================================================
-- Fix daily_brand_metrics unique index
-- ============================================================================

-- Drop the existing index with COALESCE
DROP INDEX IF EXISTS idx_daily_brand_metrics_unique;

-- Create a simple unique index without expressions
-- This means we need to ensure data quality: each row must have unique combination
CREATE UNIQUE INDEX idx_daily_brand_metrics_unique 
ON daily_brand_metrics (
  account_brand_id,
  primary_brand_id,
  brand_competitor_id,
  metric_date
);

-- ============================================================================
-- Fix brand_performance_summary unique index
-- ============================================================================

DROP INDEX IF EXISTS idx_brand_performance_summary_unique;

CREATE UNIQUE INDEX idx_brand_performance_summary_unique 
ON brand_performance_summary (
  account_brand_id,
  primary_brand_id,
  brand_competitor_id,
  period
);

-- ============================================================================
-- Fix topic_brand_matrix unique index
-- ============================================================================

DROP INDEX IF EXISTS idx_topic_brand_matrix_unique;

CREATE UNIQUE INDEX idx_topic_brand_matrix_unique 
ON topic_brand_matrix (
  account_brand_id,
  primary_brand_id,
  brand_competitor_id,
  topic_name
);

-- ============================================================================
-- Fix source_citation_analysis unique index
-- ============================================================================

DROP INDEX IF EXISTS idx_source_citation_analysis_unique;

CREATE UNIQUE INDEX idx_source_citation_analysis_unique 
ON source_citation_analysis (
  account_brand_id,
  primary_brand_id,
  brand_competitor_id,
  source_domain
);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON INDEX idx_daily_brand_metrics_unique IS 
'Simple unique index (no expressions) to support concurrent refresh of daily_brand_metrics';

COMMENT ON INDEX idx_brand_performance_summary_unique IS 
'Simple unique index (no expressions) to support concurrent refresh of brand_performance_summary';

COMMENT ON INDEX idx_topic_brand_matrix_unique IS 
'Simple unique index (no expressions) to support concurrent refresh of topic_brand_matrix';

COMMENT ON INDEX idx_source_citation_analysis_unique IS 
'Simple unique index (no expressions) to support concurrent refresh of source_citation_analysis';
