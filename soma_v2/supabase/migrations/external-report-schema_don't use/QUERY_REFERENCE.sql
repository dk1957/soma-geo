-- ============================================================================
-- External Report SQL Query Reference
-- ============================================================================
-- Ready-to-use SQL queries for populating each section of the external report
-- Copy these into your TypeScript/API code
-- ============================================================================

-- ============================================================================
-- 1. FILTERS & DATE RANGE
-- ============================================================================
-- Get available date ranges for filtering
SELECT 
  MIN(snapshot_date) as earliest_date,
  MAX(snapshot_date) as latest_date,
  COUNT(DISTINCT snapshot_date) as total_days
FROM brand_metrics_timeseries
WHERE account_id = $accountId
  AND brand_id = $brandId;

-- ============================================================================
-- 2. STATS CARDS (5 Key Metrics)
-- ============================================================================
SELECT 
  ROUND(mention_rate, 1) as mention_rate,
  ROUND(avg_sentiment_score * 100, 0) as sentiment_score,  -- Convert -1..1 to 0..100
  ROUND(avg_ranking_position, 1) as avg_ranking,
  total_citations,
  ROUND(lvi_score, 1) as lvi
FROM brand_performance_metrics
WHERE account_id = $accountId
  AND brand_id = $brandId
  AND is_primary_brand = true
  AND metric_period = $period  -- '7d', '30d', '90d'
LIMIT 1;

-- Get trends (change from previous period)
SELECT 
  mention_rate_change,
  sentiment_change,
  ranking_change,
  lvi_change
FROM brand_performance_metrics
WHERE account_id = $accountId
  AND brand_id = $brandId
  AND is_primary_brand = true
  AND metric_period = $period
LIMIT 1;

-- ============================================================================
-- 3. LVI TREND CHART
-- ============================================================================
SELECT 
  TO_CHAR(snapshot_date, 'Mon DD') as date,
  ROUND(lvi_score, 1) as lvi,
  ROUND(mention_rate, 1) as mention_rate,
  ROUND(avg_sentiment * 100, 0) as sentiment
FROM brand_metrics_timeseries
WHERE account_id = $accountId
  AND brand_id = $brandId
  AND is_primary_brand = true
  AND snapshot_date >= NOW() - INTERVAL $period  -- '7 days', '30 days', '90 days'
  AND time_granularity = 'daily'
ORDER BY snapshot_date ASC;

-- ============================================================================
-- 4. INDUSTRY RANKINGS TABLE
-- ============================================================================
SELECT 
  bpm.brand_name as brand,
  bpm.is_primary_brand as "isYourBrand",
  ROW_NUMBER() OVER (ORDER BY bpm.lvi_score DESC, bpm.mention_rate DESC) as position,
  bpm.rank_change as "positionChange",
  ROUND(bpm.avg_sentiment_score * 100, 0) as sentiment,
  ROUND(bpm.sentiment_change, 1) as "sentimentChange",
  ROUND(bpm.mention_rate, 1) as visibility,
  ROUND(bpm.mention_rate_change, 1) as "visibilityChange",
  ROUND(bpm.lvi_score, 1) as lvi
FROM brand_performance_metrics bpm
WHERE bpm.account_id = $accountId
  AND bpm.metric_period = $period
  AND (bpm.brand_id = $brandId OR bpm.competitor_id IN (
    SELECT id FROM competitors WHERE brand_id = $brandId
  ))
ORDER BY position ASC
LIMIT 10;

-- Alternative: Use industry_rank if calculated
SELECT 
  brand_name as brand,
  is_primary_brand as "isYourBrand",
  industry_rank as position,
  rank_change as "positionChange",
  ROUND(avg_sentiment_score * 100, 0) as sentiment,
  ROUND(sentiment_change, 1) as "sentimentChange",
  ROUND(mention_rate, 1) as visibility,
  ROUND(mention_rate_change, 1) as "visibilityChange"
FROM brand_performance_metrics
WHERE account_id = $accountId
  AND metric_period = $period
ORDER BY industry_rank ASC
LIMIT 10;

-- ============================================================================
-- 5. BRAND-TOPIC HEATMAP
-- ============================================================================
-- Get all unique topics
SELECT DISTINCT topic_name
FROM topic_brand_associations
WHERE account_id = $accountId
  AND metric_period = $period
ORDER BY topic_name;

-- Get brand-topic matrix
SELECT 
  tba.brand_name as brand,
  tba.is_primary_brand as "isYourBrand",
  jsonb_object_agg(
    tba.topic_name, 
    ROUND(tba.relevance_score, 1)
  ) as topics
FROM topic_brand_associations tba
WHERE tba.account_id = $accountId
  AND tba.metric_period = $period
GROUP BY tba.brand_name, tba.is_primary_brand
ORDER BY tba.is_primary_brand DESC, tba.brand_name;

-- Alternative: Flat structure for easier frontend mapping
SELECT 
  brand_name as brand,
  is_primary_brand as "isYourBrand",
  topic_name as topic,
  ROUND(relevance_score, 1) as score,
  mention_count,
  ROUND(co_occurrence_rate, 1) as "coOccurrenceRate"
FROM topic_brand_associations
WHERE account_id = $accountId
  AND metric_period = $period
ORDER BY brand_name, relevance_score DESC;

-- ============================================================================
-- 6. PROMPT-BY-PROMPT ANALYSIS
-- ============================================================================
SELECT 
  ppa.prompt_id as "promptKey",
  ppa.prompt_text as "promptText",
  ppa.prompt_category as category,
  ppa.prompt_intent as intent,
  ppa.total_responses,
  ppa.total_models_tested as "totalModels",
  
  -- Primary brand performance
  ppa.primary_brand_mentioned as "brandMentioned",
  ppa.primary_brand_mention_count as "brandMentions",
  ROUND(ppa.primary_brand_mention_rate, 1) as "brandMentionRate",
  ROUND(ppa.primary_brand_avg_position, 1) as "brandAvgPosition",
  ppa.primary_brand_best_position as "brandBestPosition",
  ROUND(ppa.primary_brand_sentiment * 100, 0) as "brandSentiment",
  ppa.primary_brand_citations as "brandCitations",
  ROUND(ppa.primary_brand_lvi, 1) as "brandLVI",
  
  -- Competitive context
  ppa.top_competitor_name as "topCompetitor",
  ppa.top_competitor_mentions as "competitorMentions",
  ROUND(ppa.top_competitor_avg_position, 1) as "competitorAvgPosition",
  ROUND(ppa.visibility_gap, 1) as "visibilityGap",
  
  -- Classification
  ppa.is_opportunity as "isOpportunity",
  ppa.is_strength as "isStrength",
  ppa.is_threat as "isThreat",
  ROUND(ppa.opportunity_score, 0) as "opportunityScore",
  ppa.strategic_priority as "priority",
  ppa.action_required as "actionRequired",
  
  -- Per-model breakdown (JSONB)
  ppa.model_performance as "modelPerformance"
  
FROM prompt_performance_analysis ppa
WHERE ppa.account_id = $accountId
  AND ppa.primary_brand_id = $brandId
  AND ppa.metric_period = $period
ORDER BY 
  CASE 
    WHEN ppa.is_opportunity THEN 1
    WHEN ppa.is_threat THEN 2
    WHEN ppa.is_strength THEN 3
    ELSE 4
  END,
  ppa.opportunity_score DESC,
  ppa.primary_brand_lvi DESC;

-- Get detailed model-by-model responses for a specific prompt
SELECT 
  ra.model_name as model,
  ra.primary_brand_mentions > 0 as "brandMentioned",
  ra.primary_brand_first_position as rank,
  ROUND(ra.primary_brand_sentiment * 100, 0) as sentiment,
  ra.primary_brand_sources as citations,
  ra.brands_mentioned::jsonb as "mentionedBrands",
  lsr.raw_response as response
FROM response_analysis ra
JOIN llm_simulation_responses lsr ON lsr.id = ra.response_id
WHERE ra.prompt_id = $promptId
  AND ra.brand_id = $brandId
ORDER BY ra.model_name;

-- ============================================================================
-- 7. SOURCES & CITATIONS TABLE
-- ============================================================================
SELECT 
  cda.domain,
  cda.domain_type as type,
  ROUND(cda.used_percentage, 1) as "usedPercentage",
  ROUND(cda.avg_citations_per_response, 1) as "avgCitations",
  cda.total_citations as "totalCitations",
  cda.unique_responses_citing as "responsesUsing",
  cda.is_authoritative as "isAuthoritative",
  ROUND(cda.trust_score * 100, 0) as "trustScore",
  cda.is_target_publisher as "isTargetPublisher",
  ROUND(cda.partnership_opportunity_score, 0) as "partnershipScore",
  cda.associated_topics as topics,
  cda.associated_brands as brands
FROM citation_domain_analysis cda
WHERE cda.account_id = $accountId
  AND cda.metric_period = $period
ORDER BY cda.used_percentage DESC, cda.total_citations DESC
LIMIT $limit;  -- e.g., 10 or 20

-- Filter by domain type
SELECT 
  domain,
  ROUND(used_percentage, 1) as "usedPercentage",
  ROUND(avg_citations_per_response, 1) as "avgCitations"
FROM citation_domain_analysis
WHERE account_id = $accountId
  AND metric_period = $period
  AND domain_type = $domainType  -- 'your-brand', 'competitor', 'industry', 'news-media'
ORDER BY used_percentage DESC;

-- ============================================================================
-- 8. KEY INSIGHTS & RECOMMENDATIONS
-- ============================================================================
-- This is typically generated programmatically, but here are helper queries:

-- Find high-opportunity prompts (not mentioned but competitors are)
SELECT 
  prompt_text,
  top_competitor_name,
  ROUND(opportunity_score, 0) as score,
  competitor_mention_count as "competitorMentions"
FROM prompt_performance_analysis
WHERE account_id = $accountId
  AND primary_brand_id = $brandId
  AND metric_period = $period
  AND is_opportunity = true
ORDER BY opportunity_score DESC
LIMIT 5;

-- Find strength prompts (dominating)
SELECT 
  prompt_text,
  ROUND(primary_brand_lvi, 1) as lvi,
  primary_brand_best_position as "bestRank"
FROM prompt_performance_analysis
WHERE account_id = $accountId
  AND primary_brand_id = $brandId
  AND metric_period = $period
  AND is_strength = true
ORDER BY primary_brand_lvi DESC
LIMIT 5;

-- Find threat prompts (competitors outperforming)
SELECT 
  prompt_text,
  top_competitor_name as threat,
  ROUND(visibility_gap, 1) as gap
FROM prompt_performance_analysis
WHERE account_id = $accountId
  AND primary_brand_id = $brandId
  AND metric_period = $period
  AND is_threat = true
ORDER BY visibility_gap DESC
LIMIT 5;

-- Find target publishers (high-value partnership opportunities)
SELECT 
  domain,
  domain_type,
  ROUND(used_percentage, 1) as usage,
  ROUND(partnership_opportunity_score, 0) as "partnershipScore"
FROM citation_domain_analysis
WHERE account_id = $accountId
  AND metric_period = $period
  AND is_target_publisher = true
ORDER BY partnership_opportunity_score DESC, used_percentage DESC
LIMIT 5;

-- ============================================================================
-- 9. COMPLETE REPORT DATA (Single Query)
-- ============================================================================
-- For generating a complete report in one query (using CTEs)

WITH stats AS (
  SELECT 
    mention_rate,
    avg_sentiment_score,
    avg_ranking_position,
    total_citations,
    lvi_score
  FROM brand_performance_metrics
  WHERE account_id = $accountId
    AND brand_id = $brandId
    AND is_primary_brand = true
    AND metric_period = $period
  LIMIT 1
),
rankings AS (
  SELECT jsonb_agg(
    jsonb_build_object(
      'brand', brand_name,
      'isYourBrand', is_primary_brand,
      'position', ROW_NUMBER() OVER (ORDER BY lvi_score DESC),
      'sentiment', ROUND(avg_sentiment_score * 100, 0),
      'visibility', ROUND(mention_rate, 1)
    )
  ) as data
  FROM brand_performance_metrics
  WHERE account_id = $accountId
    AND metric_period = $period
),
topics AS (
  SELECT jsonb_agg(
    jsonb_build_object(
      'brand', brand_name,
      'topics', (
        SELECT jsonb_object_agg(topic_name, ROUND(relevance_score, 1))
        FROM topic_brand_associations tba2
        WHERE tba2.brand_name = tba.brand_name
          AND tba2.account_id = $accountId
      )
    )
  ) as data
  FROM (SELECT DISTINCT brand_name FROM topic_brand_associations WHERE account_id = $accountId) tba
)
SELECT 
  (SELECT row_to_json(s) FROM stats s) as stats,
  (SELECT data FROM rankings) as industry_rankings,
  (SELECT data FROM topics) as brand_topics;

-- ============================================================================
-- 10. REFRESH METRICS (Maintenance)
-- ============================================================================
-- Call this after new responses are analyzed to update all metrics

SELECT refresh_external_report_metrics(
  p_account_id := $accountId,
  p_brand_id := $brandId,
  p_simulation_id := $simulationId  -- or NULL for all simulations
);

-- Refresh just one metric type
SELECT calculate_brand_performance_metrics($accountId, $brandId, NULL, '30d');
SELECT calculate_topic_brand_associations($accountId, $brandId, NULL, '30d');
SELECT calculate_prompt_performance($accountId, $brandId, NULL, '30d');
SELECT calculate_citation_domain_analysis($accountId, NULL, '30d');

-- ============================================================================
-- 11. PERFORMANCE MONITORING
-- ============================================================================
-- Check metric freshness
SELECT 
  metric_period,
  MAX(updated_at) as last_updated,
  COUNT(*) as record_count
FROM brand_performance_metrics
WHERE account_id = $accountId
GROUP BY metric_period;

-- Check data completeness
SELECT 
  AVG(data_quality_score) as avg_quality,
  AVG(sample_size) as avg_sample_size
FROM brand_performance_metrics
WHERE account_id = $accountId
  AND metric_period = $period;
