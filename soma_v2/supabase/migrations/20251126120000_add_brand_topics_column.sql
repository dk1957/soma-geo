-- Add brand_topics column to brands table
-- This replaces the products_services text field with a more structured topics array

ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS brand_topics text[] DEFAULT '{}';

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_brands_brand_topics ON public.brands USING GIN(brand_topics);

-- Add comment for documentation
COMMENT ON COLUMN public.brands.brand_topics IS 'Array of topics the brand wants to monitor for AI visibility';
