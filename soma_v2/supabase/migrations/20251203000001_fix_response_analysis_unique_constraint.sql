-- Fix the response_analysis unique constraint to properly handle:
-- 1. Multiple brands (primary + competitors) per response
-- 2. Daily re-analysis (same response can be analyzed multiple days)
-- 3. Upsert on conflict behavior

-- Step 1: Drop the existing index
DROP INDEX IF EXISTS idx_response_analysis_unique;

-- Step 2: Create new unique index that properly handles:
-- - response_id: the LLM response being analyzed
-- - brand_name: the brand being tracked (could be primary or competitor name)
-- - analysis_date: allows daily re-analysis
-- 
-- Note: We use brand_name instead of competitor_id because:
-- - Primary brand has competitor_id = NULL
-- - PostgreSQL's NULLS NOT DISTINCT would treat all NULLs as equal
-- - brand_name is always set and unique per analysis record
CREATE UNIQUE INDEX idx_response_analysis_unique 
  ON response_analysis(response_id, brand_name, analysis_date);

COMMENT ON INDEX idx_response_analysis_unique IS 
  'Ensures one analysis record per response-brand-date combination. Allows tracking multiple brands (primary + competitors) per response and daily re-analysis.';

-- Step 3: Update the upsert function to use the correct conflict columns
CREATE OR REPLACE FUNCTION upsert_response_analysis(
  analysis_records JSONB
)
RETURNS TABLE (
  inserted_count INTEGER,
  updated_count INTEGER,
  skipped_count INTEGER
) AS $$
DECLARE
  v_inserted INTEGER := 0;
  v_updated INTEGER := 0;
  v_skipped INTEGER := 0;
  v_record JSONB;
  v_exists BOOLEAN;
  v_analysis_date DATE;
BEGIN
  -- Loop through each record in the array
  FOR v_record IN SELECT jsonb_array_elements(analysis_records)
  LOOP
    -- Determine analysis date from analyzed_at or use current date
    v_analysis_date := COALESCE(
      DATE((v_record->>'analyzed_at')::TIMESTAMPTZ),
      CURRENT_DATE
    );
    
    -- Check if record exists for this response + brand + date
    SELECT EXISTS(
      SELECT 1 FROM response_analysis
      WHERE response_id = (v_record->>'response_id')
        AND brand_name = v_record->>'brand_name'
        AND analysis_date = v_analysis_date
    ) INTO v_exists;
    
    -- Attempt to insert or update based on unique constraint
    INSERT INTO response_analysis (
      response_id,
      simulation_id,
      account_id,
      brand_id,
      primary_brand_id,
      competitor_id,
      brand_name,
      is_primary_brand,
      prompt_id,
      prompt_text,
      model_name,
      model_provider,
      brand_mentioned,
      brand_mention_count,
      total_brands_mentioned,
      total_brand_mentions,
      brand_positions,
      brand_first_position,
      brand_avg_position,
      brand_sentiment,
      sentiment_category,
      sentiment_confidence,
      sentiment_context,
      brand_cited,
      brand_citation_count,
      citation_type,
      sources_cited,
      topics_covered,
      factual_claims_made,
      factual_claims_correct,
      factual_accuracy_rate,
      factual_issues,
      response_completeness,
      response_word_count,
      response_contains_urls,
      response_contains_images,
      competitors_mentioned,
      competitive_positioning,
      share_of_voice,
      analysis_confidence,
      analysis_method,
      analysis_version,
      analyzed_at,
      analysis_date,
      created_at
    ) VALUES (
      v_record->>'response_id',
      v_record->>'simulation_id',
      (v_record->>'account_id')::UUID,
      (v_record->>'brand_id')::UUID,
      (v_record->>'primary_brand_id')::UUID,
      (v_record->>'competitor_id')::UUID,
      v_record->>'brand_name',
      COALESCE((v_record->>'is_primary_brand')::BOOLEAN, false),
      v_record->>'prompt_id',
      v_record->>'prompt_text',
      v_record->>'model_name',
      v_record->>'model_provider',
      COALESCE((v_record->>'brand_mentioned')::BOOLEAN, false),
      COALESCE((v_record->>'brand_mention_count')::INTEGER, 0),
      COALESCE((v_record->>'total_brands_mentioned')::INTEGER, 0),
      COALESCE((v_record->>'total_brand_mentions')::INTEGER, 0),
      COALESCE((v_record->'brand_positions')::JSONB, '[]'::JSONB),
      (v_record->>'brand_first_position')::INTEGER,
      (v_record->>'brand_avg_position')::NUMERIC,
      COALESCE((v_record->>'brand_sentiment')::NUMERIC, 0),
      COALESCE(v_record->>'sentiment_category', 'neutral'),
      COALESCE((v_record->>'sentiment_confidence')::NUMERIC, 0),
      v_record->>'sentiment_context',
      COALESCE((v_record->>'brand_cited')::BOOLEAN, false),
      COALESCE((v_record->>'brand_citation_count')::INTEGER, 0),
      v_record->>'citation_type',
      COALESCE((v_record->'sources_cited')::JSONB, '[]'::JSONB),
      COALESCE((v_record->'topics_covered')::JSONB, '[]'::JSONB),
      COALESCE((v_record->>'factual_claims_made')::INTEGER, 0),
      COALESCE((v_record->>'factual_claims_correct')::INTEGER, 0),
      COALESCE((v_record->>'factual_accuracy_rate')::NUMERIC, 0),
      COALESCE((v_record->'factual_issues')::JSONB, '[]'::JSONB),
      (v_record->>'response_completeness')::NUMERIC,
      (v_record->>'response_word_count')::INTEGER,
      (v_record->>'response_contains_urls')::BOOLEAN,
      (v_record->>'response_contains_images')::BOOLEAN,
      COALESCE((v_record->'competitors_mentioned')::JSONB, '[]'::JSONB),
      COALESCE(v_record->>'competitive_positioning', 'not_mentioned'),
      COALESCE((v_record->>'share_of_voice')::NUMERIC, 0),
      COALESCE((v_record->>'analysis_confidence')::NUMERIC, 0),
      COALESCE(v_record->>'analysis_method', 'sim_ai_workflow'),
      COALESCE(v_record->>'analysis_version', '2.1'),
      COALESCE((v_record->>'analyzed_at')::TIMESTAMPTZ, NOW()),
      v_analysis_date,
      COALESCE((v_record->>'created_at')::TIMESTAMPTZ, NOW())
    )
    ON CONFLICT (response_id, brand_name, analysis_date)
    DO UPDATE SET
      -- Update with latest analysis data
      simulation_id = EXCLUDED.simulation_id,
      primary_brand_id = EXCLUDED.primary_brand_id,
      competitor_id = EXCLUDED.competitor_id,
      is_primary_brand = EXCLUDED.is_primary_brand,
      brand_mentioned = EXCLUDED.brand_mentioned,
      brand_mention_count = EXCLUDED.brand_mention_count,
      total_brands_mentioned = EXCLUDED.total_brands_mentioned,
      total_brand_mentions = EXCLUDED.total_brand_mentions,
      brand_positions = EXCLUDED.brand_positions,
      brand_first_position = EXCLUDED.brand_first_position,
      brand_avg_position = EXCLUDED.brand_avg_position,
      brand_sentiment = EXCLUDED.brand_sentiment,
      sentiment_category = EXCLUDED.sentiment_category,
      sentiment_confidence = EXCLUDED.sentiment_confidence,
      sentiment_context = EXCLUDED.sentiment_context,
      brand_cited = EXCLUDED.brand_cited,
      brand_citation_count = EXCLUDED.brand_citation_count,
      citation_type = EXCLUDED.citation_type,
      sources_cited = EXCLUDED.sources_cited,
      topics_covered = EXCLUDED.topics_covered,
      factual_claims_made = EXCLUDED.factual_claims_made,
      factual_claims_correct = EXCLUDED.factual_claims_correct,
      factual_accuracy_rate = EXCLUDED.factual_accuracy_rate,
      factual_issues = EXCLUDED.factual_issues,
      response_completeness = EXCLUDED.response_completeness,
      response_word_count = EXCLUDED.response_word_count,
      response_contains_urls = EXCLUDED.response_contains_urls,
      response_contains_images = EXCLUDED.response_contains_images,
      competitors_mentioned = EXCLUDED.competitors_mentioned,
      competitive_positioning = EXCLUDED.competitive_positioning,
      share_of_voice = EXCLUDED.share_of_voice,
      analysis_confidence = EXCLUDED.analysis_confidence,
      analysis_method = EXCLUDED.analysis_method,
      analysis_version = EXCLUDED.analysis_version,
      analyzed_at = EXCLUDED.analyzed_at,
      updated_at = NOW();
    
    -- Track if this was an insert or update
    IF v_exists THEN
      v_updated := v_updated + 1;
    ELSE
      v_inserted := v_inserted + 1;
    END IF;
    
  END LOOP;
  
  RETURN QUERY SELECT v_inserted, v_updated, v_skipped;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION upsert_response_analysis TO authenticated, service_role, anon;

COMMENT ON FUNCTION upsert_response_analysis IS 'Upserts response analysis records, handling duplicates gracefully. Unique key: (response_id, brand_name, analysis_date). Input: JSONB array of analysis records. Returns: counts of inserted, updated, and skipped records.';
