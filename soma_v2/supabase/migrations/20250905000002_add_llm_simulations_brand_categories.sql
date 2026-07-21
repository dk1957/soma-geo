-- Add brand_categories array field to llm_simulations table for multi-select support

DO $$ 
BEGIN
    -- Add brand_categories column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'llm_simulations' AND column_name = 'brand_categories') THEN
        ALTER TABLE llm_simulations ADD COLUMN brand_categories TEXT[];
        CREATE INDEX IF NOT EXISTS idx_llm_simulations_brand_categories ON llm_simulations USING GIN(brand_categories);
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN llm_simulations.brand_categories IS 'Array of brand categories for multi-select support (marketing_advertising, technology_software, etc.)';