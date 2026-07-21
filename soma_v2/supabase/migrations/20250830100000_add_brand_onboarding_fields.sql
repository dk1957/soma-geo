-- Add additional brand fields from onboarding form
-- These fields will be populated during onboarding and used for future regeneration

ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS brand_category text,
ADD COLUMN IF NOT EXISTS target_markets text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS products_services text,
ADD COLUMN IF NOT EXISTS business_type text CHECK (business_type IN ('brand', 'business', 'product', 'organization')),
ADD COLUMN IF NOT EXISTS business_model text CHECK (business_model IN ('b2b', 'b2c', 'b2b2c', 'marketplace', 'other')),
ADD COLUMN IF NOT EXISTS target_audience text,
ADD COLUMN IF NOT EXISTS primary_value text,
ADD COLUMN IF NOT EXISTS business_stage text CHECK (business_stage IN ('startup', 'growth', 'established', 'enterprise')),
ADD COLUMN IF NOT EXISTS known_competitors text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS brand_website text;

-- Add indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_brands_brand_category ON public.brands(brand_category);
CREATE INDEX IF NOT EXISTS idx_brands_target_markets ON public.brands USING GIN(target_markets);
CREATE INDEX IF NOT EXISTS idx_brands_business_type ON public.brands(business_type);
CREATE INDEX IF NOT EXISTS idx_brands_business_model ON public.brands(business_model);
CREATE INDEX IF NOT EXISTS idx_brands_business_stage ON public.brands(business_stage);

-- Add comments for documentation
COMMENT ON COLUMN public.brands.brand_category IS 'Brand category from onboarding dropdown (food_beverage, fashion_apparel, etc.)';
COMMENT ON COLUMN public.brands.target_markets IS 'Array of market codes where brand operates (za, us, uk, etc.)';
COMMENT ON COLUMN public.brands.products_services IS 'Description of what the brand offers from onboarding';
COMMENT ON COLUMN public.brands.business_type IS 'Type of business (brand, business, product, organization)';
COMMENT ON COLUMN public.brands.business_model IS 'Business model (b2b, b2c, b2b2c, marketplace, other)';
COMMENT ON COLUMN public.brands.target_audience IS 'Description of target audience';
COMMENT ON COLUMN public.brands.primary_value IS 'Primary value proposition';
COMMENT ON COLUMN public.brands.business_stage IS 'Business maturity stage';
COMMENT ON COLUMN public.brands.known_competitors IS 'Array of known competitor names';
COMMENT ON COLUMN public.brands.brand_website IS 'Specific brand website (may differ from primary_domain)';