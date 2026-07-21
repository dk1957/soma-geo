-- Add missing columns to ground_truth_collections table
-- Date: 2025-09-11 12:00:00
-- Purpose: Add business_categories and other missing columns referenced in the API

-- Add the missing business_categories column as an array
ALTER TABLE ground_truth_collections 
ADD COLUMN IF NOT EXISTS business_categories TEXT[];

-- Add missing metadata columns that are referenced in the API but not in the table
ALTER TABLE ground_truth_collections
ADD COLUMN IF NOT EXISTS products_services TEXT[],
ADD COLUMN IF NOT EXISTS competitors TEXT[],
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Update existing records to populate business_categories from business_category
UPDATE ground_truth_collections 
SET business_categories = ARRAY[business_category]
WHERE business_categories IS NULL AND business_category IS NOT NULL;

-- Add index for the new array column
CREATE INDEX IF NOT EXISTS idx_ground_truth_collections_business_categories 
ON ground_truth_collections USING gin(business_categories);

-- Add comments for the new columns
COMMENT ON COLUMN ground_truth_collections.business_categories IS 'Array of business categories (extends business_category for multi-category brands)';
COMMENT ON COLUMN ground_truth_collections.products_services IS 'Array of products and services offered by the brand';
COMMENT ON COLUMN ground_truth_collections.competitors IS 'Array of competitor names identified during research';
COMMENT ON COLUMN ground_truth_collections.website IS 'Brand website URL';
COMMENT ON COLUMN ground_truth_collections.metadata IS 'Additional metadata including collection source, timestamps, etc.';