-- Fix unique constraint to properly identify each brand analysis
-- The issue: Current constraint doesn't properly differentiate between different brands in the same response
-- Solution: Use response_id + prompt_id + brand_name as the unique identifier

-- Drop the old unique index
DROP INDEX IF EXISTS idx_response_analysis_unique;

-- Create new unique index based on response_id + prompt_id + brand_name
-- This allows multiple brands to be analyzed for the same response
CREATE UNIQUE INDEX idx_response_analysis_unique 
  ON response_analysis(response_id, prompt_id, brand_name);

COMMENT ON INDEX idx_response_analysis_unique IS 
  'Ensures one analysis record per response-prompt-brand combination. Allows multiple brands to be analyzed for the same response.';
