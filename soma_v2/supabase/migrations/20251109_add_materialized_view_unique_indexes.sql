-- Add unique indexes to materialized views for concurrent refresh support
-- Migration: 20251109_add_materialized_view_unique_indexes.sql

-- Note: daily_brand_metrics already has idx_daily_brand_metrics_unique
-- The other 4 views need unique indexes to support REFRESH MATERIALIZED VIEW CONCURRENTLY

-- Unique index for brand_performance_summary
-- Unique per: account_brand_id + primary_brand_id + brand_competitor_id + period
CREATE UNIQUE INDEX idx_brand_performance_summary_unique 
ON brand_performance_summary (
  account_brand_id,
  COALESCE(primary_brand_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(brand_competitor_id, '00000000-0000-0000-0000-000000000000'::uuid),
  period
);

-- Unique index for topic_brand_matrix
-- Unique per: account_brand_id + primary_brand_id + brand_competitor_id + topic_name
CREATE UNIQUE INDEX idx_topic_brand_matrix_unique 
ON topic_brand_matrix (
  account_brand_id,
  COALESCE(primary_brand_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(brand_competitor_id, '00000000-0000-0000-0000-000000000000'::uuid),
  topic_name
);

-- Unique index for source_citation_analysis
-- Unique per: account_brand_id + primary_brand_id + brand_competitor_id + source_domain
CREATE UNIQUE INDEX idx_source_citation_analysis_unique 
ON source_citation_analysis (
  account_brand_id,
  COALESCE(primary_brand_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(brand_competitor_id, '00000000-0000-0000-0000-000000000000'::uuid),
  source_domain
);

-- Unique index for prompt_performance_analysis
-- Unique per: prompt_id + account_brand_id
CREATE UNIQUE INDEX idx_prompt_performance_analysis_unique 
ON prompt_performance_analysis (
  prompt_id,
  account_brand_id
);

COMMENT ON INDEX idx_brand_performance_summary_unique IS 
'Unique index to support concurrent refresh of brand_performance_summary materialized view';

COMMENT ON INDEX idx_topic_brand_matrix_unique IS 
'Unique index to support concurrent refresh of topic_brand_matrix materialized view';

COMMENT ON INDEX idx_source_citation_analysis_unique IS 
'Unique index to support concurrent refresh of source_citation_analysis materialized view';

COMMENT ON INDEX idx_prompt_performance_analysis_unique IS 
'Unique index to support concurrent refresh of prompt_performance_analysis materialized view';
