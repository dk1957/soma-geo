-- Add brand_categories array field to support multi-select categories
-- Keep brand_category for backward compatibility

ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS brand_categories text[] DEFAULT '{}';

-- Add index for the new array field
CREATE INDEX IF NOT EXISTS idx_brands_brand_categories ON public.brands USING GIN(brand_categories);

-- Add comment for documentation
COMMENT ON COLUMN public.brands.brand_categories IS 'Array of brand categories for multi-select support (marketing_advertising, technology_software, etc.)';

-- Function to migrate existing single categories to array format
-- This ensures backward compatibility while allowing multi-select
CREATE OR REPLACE FUNCTION migrate_brand_category_to_array()
RETURNS void AS $$
BEGIN
  -- Update brands that have brand_category but empty brand_categories
  UPDATE public.brands 
  SET brand_categories = ARRAY[brand_category]
  WHERE brand_category IS NOT NULL 
    AND brand_category != ''
    AND (brand_categories IS NULL OR array_length(brand_categories, 1) IS NULL);
    
  -- Log the migration
  RAISE NOTICE 'Migrated % brands from single category to array format', 
    (SELECT COUNT(*) FROM public.brands WHERE brand_category IS NOT NULL AND brand_category != '');
END;
$$ LANGUAGE plpgsql;

-- Run the migration
SELECT migrate_brand_category_to_array();

-- Drop the migration function as it's only needed once
DROP FUNCTION migrate_brand_category_to_array();