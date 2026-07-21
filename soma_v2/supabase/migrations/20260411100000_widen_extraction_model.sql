-- Widen extraction_model column to support AI agent model identifiers
-- e.g. 'ai-agents-v1/analysis_brand_detector+analysis_citation+analysis_sentiment+analysis_topic'
ALTER TABLE response_data ALTER COLUMN extraction_model TYPE varchar(200);

-- Expand content_category check to include 'documentation' and 'other' categories
ALTER TABLE aeo_citations DROP CONSTRAINT IF EXISTS aeo_citations_content_category_check;
ALTER TABLE aeo_citations ADD CONSTRAINT aeo_citations_content_category_check 
  CHECK (content_category = ANY(ARRAY['news','blog','review','product','research','social','forum','directory','documentation','other']));

-- Expand source_type check to include 'directory' and 'social' types
ALTER TABLE aeo_citations DROP CONSTRAINT IF EXISTS aeo_citations_source_type_check;
ALTER TABLE aeo_citations ADD CONSTRAINT aeo_citations_source_type_check
  CHECK (source_type = ANY(ARRAY['owned','earned','competitor','news','paid','ugc','research','government','academic','directory','social']));
