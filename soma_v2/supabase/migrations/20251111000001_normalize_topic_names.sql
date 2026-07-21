-- Create function to normalize and clean topic names
-- Combines similar topics and filters out irrelevant ones for beverage brands

CREATE OR REPLACE FUNCTION normalize_topic_name(topic_text TEXT)
RETURNS TEXT AS $$
DECLARE
  normalized TEXT;
BEGIN
  normalized := LOWER(TRIM(topic_text));
  
  -- Normalize flavor-related topics
  IF normalized IN ('flavor variety', 'flavor diversity', 'flavor varieties', 'flavor offering', 'diverse flavor profiles', 'flavor options') THEN
    RETURN 'flavor variety';
  ELSIF normalized IN ('exotic flavors', 'exotic flavor', 'unique flavors') THEN
    RETURN 'exotic flavors';
  ELSIF normalized = 'flavor' THEN
    RETURN 'flavor quality';
    
  -- Normalize availability topics
  ELSIF normalized IN ('availability', 'product availability', 'widespread availability', 'global availability', 'market availability') THEN
    RETURN 'availability';
    
  -- Normalize affordability topics
  ELSIF normalized IN ('affordability', 'affordable pricing', 'value pricing', 'competitive pricing') THEN
    RETURN 'affordability';
    
  -- Normalize product offering topics
  ELSIF normalized IN ('product offering', 'product variety', 'product range', 'product details') THEN
    RETURN 'product range';
    
  -- Normalize market presence topics
  ELSIF normalized IN ('market presence', 'market leadership', 'market position', 'market dominance') THEN
    RETURN 'market presence';
    
  -- Normalize brand reputation topics
  ELSIF normalized IN ('brand reputation', 'brand recognition', 'brand image', 'brand strength') THEN
    RETURN 'brand reputation';
    
  -- Normalize quality topics
  ELSIF normalized IN ('quality', 'product quality', 'superior quality', 'premium quality') THEN
    RETURN 'product quality';
    
  -- Normalize packaging topics
  ELSIF normalized IN ('packaging', 'bottle size', 'package sizes', 'packaging options') THEN
    RETURN 'packaging';
    
  -- Normalize health topics
  ELSIF normalized IN ('health/sugar content', 'sugar content', 'health concerns', 'nutritional value') THEN
    RETURN 'health & ingredients';
    
  -- Normalize production topics
  ELSIF normalized IN ('local production', 'manufacturing', 'production capacity', 'locally produced') THEN
    RETURN 'local production';
    
  -- Keep other relevant beverage industry topics as-is
  ELSIF normalized IN (
    'refreshing taste',
    'carbonation',
    'taste profile',
    'awards and recognition',
    'award recognition',
    'award-winning flavors',
    'bulk purchase options',
    'consistent supply',
    'distribution network',
    'suitability for parties',
    'event suitability',
    'global appeal',
    'global popularity',
    'innovation',
    'sustainability',
    'customer loyalty',
    'tradition',
    'heritage'
  ) THEN
    RETURN normalized;
    
  -- Filter out generic/irrelevant topics
  ELSIF normalized IN (
    'brand association',
    'brand ownership',
    'brand origin/history',
    'company information',
    'website',
    'contact information'
  ) THEN
    RETURN NULL; -- Will be filtered out
    
  ELSE
    -- Return original for other topics
    RETURN normalized;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update the topic matrix function to use normalization
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
  WITH topic_data AS (
    -- Extract individual topics from JSONB array
    SELECT 
      ra.brand_name,
      normalize_topic_name(topic->>'name') as normalized_topic,
      (topic->>'relevance')::NUMERIC as relevance,
      (topic->>'sentiment')::NUMERIC as sentiment
    FROM response_analysis ra,
    LATERAL jsonb_array_elements(ra.topics_covered) AS topic
    WHERE ra.account_id = p_account_id
      AND ra.analysis_date >= p_start_date
      AND ra.analysis_date <= p_end_date
      AND ra.topics_covered IS NOT NULL
      AND jsonb_array_length(ra.topics_covered) > 0
      AND (topic->>'relevance')::NUMERIC > p_min_relevance
  )
  SELECT 
    td.normalized_topic::VARCHAR(255) as topic_name,
    td.brand_name::VARCHAR(255),
    COUNT(*)::INTEGER as mention_count,
    ROUND(AVG(td.relevance), 2) as avg_relevance,
    ROUND(AVG(td.sentiment), 2) as avg_sentiment
  FROM topic_data td
  WHERE td.normalized_topic IS NOT NULL  -- Filter out NULL topics
  GROUP BY td.normalized_topic, td.brand_name
  HAVING COUNT(*) > 0
  ORDER BY td.normalized_topic, mention_count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comments
COMMENT ON FUNCTION normalize_topic_name IS 'Normalizes topic names by combining similar topics and filtering irrelevant ones for beverage industry';
COMMENT ON FUNCTION get_topic_brand_matrix IS 'Generates normalized topic-brand matrix with combined similar topics and filtered irrelevant topics';
