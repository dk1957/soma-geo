-- Create upsert function for response_analysis to handle daily updates
-- This allows the same analysis to be re-run without constraint violations

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
BEGIN
  -- Loop through each record in the array
  FOR v_record IN SELECT jsonb_array_elements(analysis_records)
  LOOP
    -- Check if record exists
    SELECT EXISTS(
      SELECT 1 FROM response_analysis
      WHERE response_id = (v_record->>'response_id')::UUID
        AND prompt_id = (v_record->>'prompt_id')::UUID
        AND brand_name = v_record->>'brand_name'
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
      created_at
    ) VALUES (
      (v_record->>'response_id')::UUID,
      (v_record->>'simulation_id')::UUID,
      (v_record->>'account_id')::UUID,
      (v_record->>'brand_id')::UUID,
      (v_record->>'primary_brand_id')::UUID,
      (v_record->>'competitor_id')::UUID,
      v_record->>'brand_name',
      (v_record->>'is_primary_brand')::BOOLEAN,
      (v_record->>'prompt_id')::UUID,
      v_record->>'prompt_text',
      v_record->>'model_name',
      v_record->>'model_provider',
      (v_record->>'brand_mentioned')::BOOLEAN,
      (v_record->>'brand_mention_count')::INTEGER,
      (v_record->>'total_brands_mentioned')::INTEGER,
      (v_record->>'total_brand_mentions')::INTEGER,
      (v_record->'brand_positions')::JSONB,
      (v_record->>'brand_first_position')::INTEGER,
      (v_record->>'brand_avg_position')::NUMERIC,
      (v_record->>'brand_sentiment')::NUMERIC,
      v_record->>'sentiment_category',
      (v_record->>'sentiment_confidence')::NUMERIC,
      v_record->>'sentiment_context',
      (v_record->>'brand_cited')::BOOLEAN,
      (v_record->>'brand_citation_count')::INTEGER,
      v_record->>'citation_type',
      (v_record->'sources_cited')::JSONB,
      (v_record->'topics_covered')::JSONB,
      (v_record->>'factual_claims_made')::INTEGER,
      (v_record->>'factual_claims_correct')::INTEGER,
      (v_record->>'factual_accuracy_rate')::NUMERIC,
      (v_record->'factual_issues')::JSONB,
      (v_record->>'response_completeness')::NUMERIC,
      (v_record->>'response_word_count')::INTEGER,
      (v_record->>'response_contains_urls')::BOOLEAN,
      (v_record->>'response_contains_images')::BOOLEAN,
      (v_record->'competitors_mentioned')::JSONB,
      v_record->>'competitive_positioning',
      (v_record->>'share_of_voice')::NUMERIC,
      (v_record->>'analysis_confidence')::NUMERIC,
      v_record->>'analysis_method',
      v_record->>'analysis_version',
      (v_record->>'analyzed_at')::TIMESTAMPTZ,
      COALESCE((v_record->>'created_at')::TIMESTAMPTZ, NOW())
    )
    ON CONFLICT (response_id, prompt_id, brand_name)
    DO UPDATE SET
      -- Update with latest analysis data
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

COMMENT ON FUNCTION upsert_response_analysis IS 'Upserts response analysis records, handling duplicates gracefully. Input: JSONB array of analysis records. Returns: counts of inserted, updated, and skipped records. Use this instead of direct INSERT to avoid unique constraint violations when re-running daily analysis.';
