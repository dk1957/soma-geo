-- Dynamic Topic Normalization and Filtering
-- Uses string similarity and pattern matching for any brand/industry
-- Works as a SaaS solution for diverse user bases

-- Enable pg_trgm extension for similarity matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Function to normalize similar topic names dynamically
CREATE OR REPLACE FUNCTION normalize_topic_name(topic_name TEXT)
RETURNS TEXT AS $$
DECLARE
  normalized TEXT;
BEGIN
  -- Convert to lowercase and trim
  normalized := lower(trim(topic_name));
  
  -- Remove common suffixes that don't change meaning
  normalized := regexp_replace(normalized, '\s+(offering|offerings)$', '', 'g');
  normalized := regexp_replace(normalized, '\s+(option|options|choice|choices)$', ' range', 'g');
  
  -- Consolidate variety/diversity terminology
  normalized := regexp_replace(normalized, '\s+(variety|varieties|diversity|range)$', ' variety', 'g');
  normalized := regexp_replace(normalized, '^diverse\s+', '', 'g');
  
  -- Remove redundant brand/product prefixes
  normalized := regexp_replace(normalized, '^(product|brand)\s+', '', 'g');
  
  -- Standardize availability terms
  normalized := regexp_replace(normalized, '(widespread|global|local|regional)\s+availability', 'availability', 'g');
  
  -- Standardize pricing terms
  normalized := regexp_replace(normalized, 'affordable\s+pricing', 'affordability', 'g');
  normalized := regexp_replace(normalized, 'value\s+for\s+money', 'value proposition', 'g');
  
  -- Standardize plural forms (but keep some plurals that are meaningful)
  -- Only singularize at the end of phrases
  normalized := regexp_replace(normalized, '(flavor|product|feature|package)s$', '\1', 'g');
  
  -- Clean up whitespace
  normalized := regexp_replace(normalized, '\s{2,}', ' ', 'g');
  normalized := trim(normalized);
  
  RETURN normalized;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if topic is relevant and not noise
CREATE OR REPLACE FUNCTION is_relevant_topic(
  topic_name TEXT,
  topic_category TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Exclude overly generic or meta topics
  IF topic_name ~ '(^the |^a |^an |^general$|^misc$|^other$|^various$|^unspecified$)' THEN
    RETURN FALSE;
  END IF;
  
  -- Exclude topics that are too short (likely acronyms or noise)
  IF length(trim(topic_name)) < 3 THEN
    RETURN FALSE;
  END IF;
  
  -- Exclude non-business topics
  IF topic_name ~ '(^test|^demo|^sample|^placeholder)' THEN
    RETURN FALSE;
  END IF;
  
  -- Include all topics with business-relevant categories
  IF topic_category IN (
    'product_feature',
    'pricing_value', 
    'reputation',
    'operations',
    'business_strategy',
    'market_position',
    'quality',
    'distribution',
    'customer_service',
    'innovation',
    'sustainability',
    'marketing',
    'brand_positioning',
    'competitive_advantage'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Default: include (better to include than exclude real topics)
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Updated topic-brand matrix function with dynamic normalization
CREATE OR REPLACE FUNCTION get_topic_brand_matrix(
  p_account_id UUID,
  p_brand_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_min_relevance NUMERIC DEFAULT 0.5
)
RETURNS TABLE (
  topic_name VARCHAR(255),
  brand_name VARCHAR(255),
  mention_count INTEGER,
  avg_relevance NUMERIC,
  avg_sentiment NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH brand_filter AS (
    -- Get primary brand name and competitor names from competitors table
    SELECT b.name as brand_name
    FROM brands b
    WHERE b.id = p_brand_id
    UNION ALL
    SELECT c.competitor_name::text as brand_name
    FROM competitors c
    WHERE c.brand_id = p_brand_id
      AND c.account_id = p_account_id
  ),
  topic_data AS (
    -- Extract individual topics from JSONB array with filtering
    -- Guard: CASE WHEN prevents jsonb_array_elements from receiving scalar null
    SELECT 
      ra.brand_name,
      normalize_topic_name(topic->>'name') as normalized_topic,
      topic->>'name' as original_topic,
      topic->>'category' as category,
      (topic->>'relevance')::NUMERIC as relevance,
      (topic->>'sentiment')::NUMERIC as sentiment
    FROM response_analysis ra
    INNER JOIN brand_filter bf ON lower(ra.brand_name) = lower(bf.brand_name),
    LATERAL jsonb_array_elements(
      CASE WHEN ra.topics_covered IS NOT NULL
                AND jsonb_typeof(ra.topics_covered) = 'array'
                AND jsonb_array_length(ra.topics_covered) > 0
           THEN ra.topics_covered
           ELSE '[]'::jsonb
      END
    ) AS topic
    WHERE ra.account_id = p_account_id
      AND ra.brand_id = p_brand_id
      AND ra.analysis_date >= p_start_date
      AND ra.analysis_date <= p_end_date
      AND (topic->>'relevance')::NUMERIC > p_min_relevance
      AND is_relevant_topic(topic->>'name', topic->>'category')
  ),
  aggregated_topics AS (
    -- Group by normalized topic name to consolidate similar topics
    SELECT 
      td.normalized_topic,
      td.brand_name,
      COUNT(*) as mention_count,
      AVG(td.relevance) as avg_relevance,
      AVG(td.sentiment) as avg_sentiment
    FROM topic_data td
    GROUP BY td.normalized_topic, td.brand_name
    HAVING COUNT(*) > 0
  ),
  ranked_topics AS (
    -- Rank topics by total mentions across all brands to filter noise
    SELECT 
      at.*,
      SUM(at.mention_count) OVER (PARTITION BY at.normalized_topic) as total_mentions
    FROM aggregated_topics at
  )
  SELECT 
    rt.normalized_topic::VARCHAR(255) as topic_name,
    rt.brand_name::VARCHAR(255),
    rt.mention_count::INTEGER,
    ROUND(rt.avg_relevance, 2) as avg_relevance,
    ROUND(rt.avg_sentiment, 2) as avg_sentiment
  FROM ranked_topics rt
  WHERE rt.total_mentions >= 2  -- Filter out one-off noise topics
  ORDER BY rt.normalized_topic, rt.mention_count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION normalize_topic_name(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION normalize_topic_name(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION is_relevant_topic(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_relevant_topic(TEXT, TEXT) TO service_role;

-- Update existing function permissions
REVOKE EXECUTE ON FUNCTION get_topic_brand_matrix(UUID, UUID, DATE, DATE, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_topic_brand_matrix(UUID, UUID, DATE, DATE, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION get_topic_brand_matrix(UUID, UUID, DATE, DATE, NUMERIC) TO service_role;

-- Comments
COMMENT ON FUNCTION normalize_topic_name IS 'Dynamically normalizes topic names using pattern matching and text processing. Works for any industry/brand without hardcoded mappings.';
COMMENT ON FUNCTION is_relevant_topic IS 'Filters irrelevant topics based on category and name patterns. Removes noise while keeping business-relevant topics across all industries.';
COMMENT ON FUNCTION get_topic_brand_matrix IS 'Generates topic-brand matrix with dynamic normalization and relevance filtering. SaaS-ready for diverse user bases and industries.';
