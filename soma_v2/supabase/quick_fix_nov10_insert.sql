-- Quick Fix: Manually set analysis_date for incoming Nov 10 records
-- Use this if your external system cannot be updated immediately

-- If you need to insert Nov 10 data WITHOUT modifying the external system,
-- you can temporarily disable the constraint, insert, then re-enable:

-- STEP 1: Drop the unique constraint temporarily
DROP INDEX IF EXISTS idx_response_analysis_unique;

-- STEP 2: Insert your Nov 10 data here
-- (Use your normal INSERT statement from the external system)
-- The data will be inserted with analysis_date = CURRENT_DATE (2025-11-10)

-- STEP 3: Recreate the unique constraint
CREATE UNIQUE INDEX idx_response_analysis_unique 
  ON response_analysis(response_id, prompt_id, brand_name, analysis_date);

-- IMPORTANT: This is a temporary workaround
-- The proper fix is to add analysis_date field to your data payload
