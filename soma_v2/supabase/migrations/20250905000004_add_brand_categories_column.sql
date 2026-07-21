-- Add brand_categories column to support multi-select categories
-- This supports the new multi-select brand categorization system

-- Add the new column
ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS brand_categories TEXT[];

-- Add comment explaining the column
COMMENT ON COLUMN public.brands.brand_categories IS 'Multi-select business categories for enhanced brand classification';

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_brands_categories 
ON public.brands USING GIN (brand_categories);

-- Update existing brands to populate brand_categories from brand_category
UPDATE public.brands 
SET brand_categories = ARRAY[brand_category]
WHERE brand_categories IS NULL 
  AND brand_category IS NOT NULL 
  AND brand_category != '';

-- Add constraint to ensure at least one category is always present
ALTER TABLE public.brands 
ADD CONSTRAINT check_brand_has_category 
CHECK (
  (brand_category IS NOT NULL AND brand_category != '') 
  OR 
  (brand_categories IS NOT NULL AND array_length(brand_categories, 1) > 0)
);

-- Log the migration
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count
    FROM public.brands 
    WHERE brand_categories IS NOT NULL;
    
    RAISE NOTICE 'Migration completed: % brands now have brand_categories populated', updated_count;
END $$;