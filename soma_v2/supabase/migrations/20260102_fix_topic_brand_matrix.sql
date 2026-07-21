-- Fix topic_brand_matrix materialized view to avoid duplicate key issues
-- The original view had GROUP BY including columns that could vary for the same (unique_brand_id, topic_name, model_name, account_id)

DROP MATERIALIZED VIEW IF EXISTS topic_brand_matrix;

CREATE MATERIALIZED VIEW topic_brand_matrix AS
SELECT 
  COALESCE(ra.competitor_id, ra.primary_brand_id) AS unique_brand_id,
  (array_agg(ra.primary_brand_id ORDER BY ra.analyzed_at DESC))[1] AS primary_brand_id,
  (array_agg(ra.competitor_id ORDER BY ra.analyzed_at DESC))[1] AS competitor_id,
  MAX(ra.brand_name) AS brand_name,
  BOOL_OR(ra.is_primary_brand) AS is_primary_brand,
  ra.account_id,
  ra.model_name,
  topic.value ->> 'name' AS topic_name,
  MAX(topic.value ->> 'category') AS topic_category,
  '30d'::text AS period,
  COUNT(*) AS mention_count,
  ROUND(AVG((topic.value ->> 'relevance')::numeric), 3) AS avg_relevance,
  ROUND(AVG((topic.value ->> 'sentiment')::numeric), 3) AS avg_sentiment,
  NULL::numeric AS occurrence_rate,
  MAX(ra.analyzed_at) AS last_seen,
  NOW() AS materialized_at
FROM response_analysis ra
CROSS JOIN LATERAL jsonb_array_elements(ra.topics_covered) AS topic(value)
WHERE ra.analyzed_at >= NOW() - INTERVAL '30 days'
  AND ra.brand_mentioned = true
GROUP BY 
  COALESCE(ra.competitor_id, ra.primary_brand_id),
  ra.account_id,
  ra.model_name,
  topic.value ->> 'name';

-- Create indexes
CREATE UNIQUE INDEX topic_brand_matrix_unique_idx 
  ON topic_brand_matrix (unique_brand_id, topic_name, model_name, account_id);

CREATE INDEX topic_brand_matrix_account_idx 
  ON topic_brand_matrix (account_id);

CREATE INDEX topic_brand_matrix_brand_idx 
  ON topic_brand_matrix (unique_brand_id);

CREATE INDEX topic_brand_matrix_topic_idx 
  ON topic_brand_matrix (topic_name);

-- Grant permissions
GRANT SELECT ON topic_brand_matrix TO authenticated;
GRANT SELECT ON topic_brand_matrix TO anon;
