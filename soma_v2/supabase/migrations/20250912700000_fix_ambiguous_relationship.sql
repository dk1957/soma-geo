-- Fix ambiguous relationship between geo_analyses and responses
-- Migration: 20250912700000_fix_ambiguous_relationship.sql

-- Add unique constraint to response_id in geo_analyses to ensure one-to-one relationship
DO $$
BEGIN
    -- First, clean up any duplicate response_id entries if they exist
    -- We'll keep the most recently created record for each response_id
    WITH duplicates AS (
        SELECT response_id, MAX(created_at) as latest_created
        FROM geo_analyses
        WHERE response_id IS NOT NULL
        GROUP BY response_id
        HAVING COUNT(*) > 1
    )
    DELETE FROM geo_analyses ga
    WHERE EXISTS (
        SELECT 1 FROM duplicates d
        WHERE ga.response_id = d.response_id
        AND ga.created_at < d.latest_created
    );
    
    -- Add unique constraint to enforce one-to-one relationship
    ALTER TABLE geo_analyses
    ADD CONSTRAINT geo_analyses_response_id_unique UNIQUE (response_id);
    
    COMMENT ON CONSTRAINT geo_analyses_response_id_unique ON geo_analyses IS 'Ensures one-to-one relationship between analyses and responses';
    
    -- Update the foreign key in responses to explicitly reference the relationship
    -- This helps resolve ambiguous join issues
    ALTER TABLE responses
    DROP CONSTRAINT IF EXISTS responses_analysis_id_fkey;
    
    ALTER TABLE responses
    ADD CONSTRAINT responses_analysis_id_fkey 
    FOREIGN KEY (analysis_id) 
    REFERENCES geo_analyses(id) 
    ON DELETE SET NULL;
END
$$;