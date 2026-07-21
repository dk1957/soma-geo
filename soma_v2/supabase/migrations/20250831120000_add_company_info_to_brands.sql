-- Add company information fields to brands table
-- These fields will store information about the company/agency that owns the brand

ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT,
ADD COLUMN IF NOT EXISTS company_location TEXT;

-- Add index for better performance when querying by company
CREATE INDEX IF NOT EXISTS idx_brands_company_name ON public.brands(company_name);
CREATE INDEX IF NOT EXISTS idx_brands_company_location ON public.brands(company_location);

-- Update existing brands to use account name as company name
UPDATE public.brands 
SET company_name = accounts.name,
    company_location = COALESCE(profiles.region, 'unknown')
FROM public.accounts
LEFT JOIN public.profiles ON accounts.owner_id = profiles.user_id
WHERE public.brands.account_id = accounts.id 
AND public.brands.company_name IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.brands.company_name IS 'Name of the company/agency that owns this brand';
COMMENT ON COLUMN public.brands.company_website IS 'Website of the company/agency that owns this brand';
COMMENT ON COLUMN public.brands.company_location IS 'Location/country code of the company/agency that owns this brand';