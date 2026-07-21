-- ============================================================================
-- Cleanup Duplicate Records Before Restoring Unique Constraints
-- ============================================================================
-- This removes duplicate records in all tables, keeping the most recent one
-- ============================================================================

-- Clean duplicates in brand_performance_metrics
-- Keep the most recent record (by updated_at) for each unique combination
WITH ranked_records AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY brand_id, metric_period, COALESCE(simulation_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(competitor_id, '00000000-0000-0000-0000-000000000000'::uuid)
      ORDER BY updated_at DESC, created_at DESC
    ) as rn
  FROM brand_performance_metrics
)
DELETE FROM brand_performance_metrics
WHERE id IN (
  SELECT id FROM ranked_records WHERE rn > 1
);

-- Clean duplicates in topic_brand_associations
WITH ranked_records AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY brand_name, topic_name, metric_period, COALESCE(simulation_id, '00000000-0000-0000-0000-000000000000'::uuid)
      ORDER BY updated_at DESC, created_at DESC
    ) as rn
  FROM topic_brand_associations
)
DELETE FROM topic_brand_associations
WHERE id IN (
  SELECT id FROM ranked_records WHERE rn > 1
);

-- Clean duplicates in brand_metrics_timeseries
WITH ranked_records AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY brand_id, COALESCE(competitor_id, '00000000-0000-0000-0000-000000000000'::uuid), snapshot_date, time_granularity, COALESCE(simulation_id, '00000000-0000-0000-0000-000000000000'::uuid)
      ORDER BY snapshot_timestamp DESC, created_at DESC
    ) as rn
  FROM brand_metrics_timeseries
)
DELETE FROM brand_metrics_timeseries
WHERE id IN (
  SELECT id FROM ranked_records WHERE rn > 1
);

-- Clean duplicates in prompt_performance_analysis
WITH ranked_records AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY prompt_id, metric_period, COALESCE(simulation_id, '00000000-0000-0000-0000-000000000000'::uuid)
      ORDER BY updated_at DESC, created_at DESC
    ) as rn
  FROM prompt_performance_analysis
)
DELETE FROM prompt_performance_analysis
WHERE id IN (
  SELECT id FROM ranked_records WHERE rn > 1
);

-- Clean duplicates in citation_domain_analysis
WITH ranked_records AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY domain, metric_period, COALESCE(simulation_id, '00000000-0000-0000-0000-000000000000'::uuid)
      ORDER BY updated_at DESC, created_at DESC
    ) as rn
  FROM citation_domain_analysis
)
DELETE FROM citation_domain_analysis
WHERE id IN (
  SELECT id FROM ranked_records WHERE rn > 1
);

-- Now restore unique constraints
ALTER TABLE brand_performance_metrics
  ADD CONSTRAINT unique_brand_period_simulation 
  UNIQUE(brand_id, metric_period, simulation_id, competitor_id);

ALTER TABLE topic_brand_associations
  ADD CONSTRAINT unique_topic_brand_period 
  UNIQUE(brand_name, topic_name, metric_period, simulation_id);

ALTER TABLE brand_metrics_timeseries
  ADD CONSTRAINT unique_brand_snapshot 
  UNIQUE(brand_id, competitor_id, snapshot_date, time_granularity, simulation_id);

ALTER TABLE prompt_performance_analysis
  ADD CONSTRAINT unique_prompt_period_simulation 
  UNIQUE(prompt_id, metric_period, simulation_id);

ALTER TABLE citation_domain_analysis
  ADD CONSTRAINT unique_domain_period_simulation 
  UNIQUE(domain, metric_period, simulation_id);

-- Log results
DO $$
BEGIN
  RAISE NOTICE 'Duplicate records cleaned and unique constraints restored successfully';
END $$;
