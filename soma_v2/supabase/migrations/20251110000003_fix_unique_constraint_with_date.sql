-- Fix unique constraint to allow daily re-analysis of the same responses
-- The current constraint blocks Nov 10 data because Nov 9 data uses the same response_id + prompt_id + brand_name
-- Solution: Add a date column and include it in the constraint

-- Step 1: Add a date-only column for the analysis date
ALTER TABLE response_analysis 
ADD COLUMN IF NOT EXISTS analysis_date DATE;

-- Step 2: Populate the new column from existing created_at values
UPDATE response_analysis 
SET analysis_date = DATE(created_at)
WHERE analysis_date IS NULL;

-- Step 3: Set default for new records
ALTER TABLE response_analysis 
ALTER COLUMN analysis_date SET DEFAULT CURRENT_DATE;

-- Step 4: Make it NOT NULL
ALTER TABLE response_analysis 
ALTER COLUMN analysis_date SET NOT NULL;

-- Step 5: Drop the old unique index
DROP INDEX IF EXISTS idx_response_analysis_unique;

-- Step 6: Create new unique index including the date
CREATE UNIQUE INDEX idx_response_analysis_unique 
  ON response_analysis(response_id, prompt_id, brand_name, analysis_date);

COMMENT ON INDEX idx_response_analysis_unique IS 
  'Ensures one analysis record per response-prompt-brand-date combination. Allows daily re-analysis of the same responses for time-series metrics.';

-- Step 7: Create index on analysis_date for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_response_analysis_date 
  ON response_analysis(analysis_date DESC);

COMMENT ON COLUMN response_analysis.analysis_date IS 
  'Date (without time) when the analysis was performed. Used for daily aggregations and time-series metrics.';
