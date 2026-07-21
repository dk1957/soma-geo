-- Create function to analyze source citations from response_analysis.sources_cited JSONB
-- This aggregates citation data by domain to show which sources AI models reference

CREATE OR REPLACE FUNCTION get_source_citation_analysis(
  p_brand_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  source_domain VARCHAR(255),
  source_type VARCHAR(50),
  total_citations INTEGER,
  unique_responses_citing INTEGER,
  usage_frequency NUMERIC,
  avg_citation_position NUMERIC,
  first_citation_count INTEGER,
  primary_brand_citations INTEGER,
  competitor_citations INTEGER,
  brands_citing TEXT[],
  is_authoritative BOOLEAN,
  trust_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH citation_data AS (
    -- Extract individual citations from JSONB array
    SELECT 
      ra.response_id,
      ra.brand_id,
      ra.brand_name,
      ra.is_primary_brand,
      ra.analysis_date,
      citation->>'domain' as domain,
      citation->>'type' as cite_type,
      (citation->>'position')::INTEGER as position,
      citation->>'url' as url,
      citation->>'title' as title
    FROM response_analysis ra,
    LATERAL jsonb_array_elements(ra.sources_cited) AS citation
    WHERE ra.account_id = (SELECT account_id FROM brands WHERE id = p_brand_id)
      AND ra.analysis_date >= p_start_date::DATE
      AND ra.analysis_date <= p_end_date::DATE
      AND ra.sources_cited IS NOT NULL
      AND jsonb_array_length(ra.sources_cited) > 0
  ),
  domain_stats AS (
    -- Aggregate by domain
    SELECT 
      cd.domain,
      cd.cite_type,
      COUNT(*) as total_cites,
      COUNT(DISTINCT cd.response_id) as unique_responses,
      COUNT(DISTINCT cd.response_id)::NUMERIC / NULLIF(
        (SELECT COUNT(DISTINCT response_id) 
         FROM response_analysis 
         WHERE account_id = (SELECT account_id FROM brands WHERE id = p_brand_id)
           AND analysis_date >= p_start_date::DATE
           AND analysis_date <= p_end_date::DATE
        ), 0
      ) as usage_freq,
      AVG(cd.position) as avg_pos,
      COUNT(*) FILTER (WHERE cd.position <= 3) as first_cite_count,
      COUNT(*) FILTER (WHERE cd.is_primary_brand = true) as primary_cites,
      COUNT(*) FILTER (WHERE cd.is_primary_brand = false) as competitor_cites,
      array_agg(DISTINCT cd.brand_name ORDER BY cd.brand_name) as citing_brands
    FROM citation_data cd
    GROUP BY cd.domain, cd.cite_type
  )
  SELECT 
    ds.domain::VARCHAR(255),
    ds.cite_type::VARCHAR(50),
    ds.total_cites::INTEGER,
    ds.unique_responses::INTEGER,
    ROUND(ds.usage_freq * 100, 2) as usage_frequency,
    ROUND(ds.avg_pos, 2) as avg_citation_position,
    ds.first_cite_count::INTEGER,
    ds.primary_cites::INTEGER,
    ds.competitor_cites::INTEGER,
    ds.citing_brands::TEXT[],
    (ds.usage_freq > 0.1 AND ds.avg_pos <= 5)::BOOLEAN as is_authoritative,
    ROUND(
      (ds.usage_freq * 50) + 
      (CASE WHEN ds.avg_pos <= 5 THEN 30 ELSE 10 END) + 
      (CASE WHEN ds.first_cite_count > 0 THEN 20 ELSE 0 END),
      2
    ) as trust_score
  FROM domain_stats ds
  WHERE ds.domain IS NOT NULL
  ORDER BY ds.total_cites DESC, ds.usage_freq DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_source_citation_analysis(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_source_citation_analysis(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, INTEGER) TO service_role;

-- Comment
COMMENT ON FUNCTION get_source_citation_analysis IS 'Analyzes source citations from response_analysis.sources_cited JSONB, aggregating by domain to show which sources AI models reference most frequently';
