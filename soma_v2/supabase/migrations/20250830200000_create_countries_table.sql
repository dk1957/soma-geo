-- Create countries reference table for consistent country data across the app

-- Create countries table
CREATE TABLE IF NOT EXISTS public.countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE, -- Two-letter country code (e.g., 'za', 'ng')
  name text NOT NULL, -- Full country name (e.g., 'South Africa', 'Nigeria') 
  flag_emoji text, -- Flag emoji (e.g., '🇿🇦', '🇳🇬')
  region text NOT NULL, -- Geographic region (e.g., 'Africa', 'Europe')
  sub_region text, -- Sub-region if applicable (e.g., 'Southern Africa', 'West Africa')
  is_active boolean NOT NULL DEFAULT true, -- Whether this country is available for selection
  sort_order integer DEFAULT 0, -- For ordering in dropdowns
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_countries_code ON public.countries(code);
CREATE INDEX IF NOT EXISTS idx_countries_region ON public.countries(region);
CREATE INDEX IF NOT EXISTS idx_countries_active ON public.countries(is_active);
CREATE INDEX IF NOT EXISTS idx_countries_sort_order ON public.countries(sort_order, name);

-- Add RLS policies
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read countries (this is reference data)
CREATE POLICY "Countries are viewable by everyone" ON public.countries
  FOR SELECT USING (true);

-- Only service role can modify countries
CREATE POLICY "Countries are manageable by service role only" ON public.countries
  FOR ALL USING (auth.role() = 'service_role');

-- Insert initial country data
INSERT INTO public.countries (code, name, flag_emoji, region, sub_region, sort_order) VALUES
  -- Africa (prioritized countries first)
  ('za', 'South Africa', '🇿🇦', 'Africa', 'Southern Africa', 1),
  ('ng', 'Nigeria', '🇳🇬', 'Africa', 'West Africa', 2),
  ('ke', 'Kenya', '🇰🇪', 'Africa', 'East Africa', 3),
  ('gh', 'Ghana', '🇬🇭', 'Africa', 'West Africa', 4),
  ('eg', 'Egypt', '🇪🇬', 'Africa', 'North Africa', 5),
  ('ma', 'Morocco', '🇲🇦', 'Africa', 'North Africa', 6),
  ('et', 'Ethiopia', '🇪🇹', 'Africa', 'East Africa', 7),
  ('tz', 'Tanzania', '🇹🇿', 'Africa', 'East Africa', 8),
  ('ug', 'Uganda', '🇺🇬', 'Africa', 'East Africa', 9),
  ('dz', 'Algeria', '🇩🇿', 'Africa', 'North Africa', 10),
  ('tn', 'Tunisia', '🇹🇳', 'Africa', 'North Africa', 11),
  ('zw', 'Zimbabwe', '🇿🇼', 'Africa', 'Southern Africa', 12),
  ('bw', 'Botswana', '🇧🇼', 'Africa', 'Southern Africa', 13),
  ('na', 'Namibia', '🇳🇦', 'Africa', 'Southern Africa', 14),
  ('rw', 'Rwanda', '🇷🇼', 'Africa', 'East Africa', 15),
  ('zm', 'Zambia', '🇿🇲', 'Africa', 'Southern Africa', 16),
  ('ao', 'Angola', '🇦🇴', 'Africa', 'Southern Africa', 17),
  ('mz', 'Mozambique', '🇲🇿', 'Africa', 'Southern Africa', 18),
  ('mg', 'Madagascar', '🇲🇬', 'Africa', 'East Africa', 19),
  ('cm', 'Cameroon', '🇨🇲', 'Africa', 'Central Africa', 20),
  ('ci', 'Ivory Coast', '🇨🇮', 'Africa', 'West Africa', 21),
  ('sn', 'Senegal', '🇸🇳', 'Africa', 'West Africa', 22),
  ('ml', 'Mali', '🇲🇱', 'Africa', 'West Africa', 23),
  ('bf', 'Burkina Faso', '🇧🇫', 'Africa', 'West Africa', 24),
  ('ne', 'Niger', '🇳🇪', 'Africa', 'West Africa', 25),
  ('td', 'Chad', '🇹🇩', 'Africa', 'Central Africa', 26),
  ('ly', 'Libya', '🇱🇾', 'Africa', 'North Africa', 27),
  ('sd', 'Sudan', '🇸🇩', 'Africa', 'North Africa', 28),
  ('cd', 'DR Congo', '🇨🇩', 'Africa', 'Central Africa', 29),

  -- Middle East
  ('ae', 'UAE', '🇦🇪', 'Middle East', 'Gulf States', 100),
  ('sa', 'Saudi Arabia', '🇸🇦', 'Middle East', 'Gulf States', 101),
  ('qa', 'Qatar', '🇶🇦', 'Middle East', 'Gulf States', 102),
  ('kw', 'Kuwait', '🇰🇼', 'Middle East', 'Gulf States', 103),
  ('bh', 'Bahrain', '🇧🇭', 'Middle East', 'Gulf States', 104),
  ('om', 'Oman', '🇴🇲', 'Middle East', 'Gulf States', 105),
  ('jo', 'Jordan', '🇯🇴', 'Middle East', 'Levant', 106),
  ('lb', 'Lebanon', '🇱🇧', 'Middle East', 'Levant', 107),
  ('sy', 'Syria', '🇸🇾', 'Middle East', 'Levant', 108),
  ('iq', 'Iraq', '🇮🇶', 'Middle East', 'Middle East', 109),
  ('ir', 'Iran', '🇮🇷', 'Middle East', 'Middle East', 110),
  ('tr', 'Turkey', '🇹🇷', 'Middle East', 'Middle East', 111),
  ('il', 'Israel', '🇮🇱', 'Middle East', 'Levant', 112),
  ('ps', 'Palestine', '🇵🇸', 'Middle East', 'Levant', 113),

  -- Major World Countries (high priority)
  ('us', 'United States', '🇺🇸', 'Americas', 'North America', 200),
  ('gb', 'United Kingdom', '🇬🇧', 'Europe', 'Western Europe', 201),
  ('de', 'Germany', '🇩🇪', 'Europe', 'Western Europe', 202),
  ('fr', 'France', '🇫🇷', 'Europe', 'Western Europe', 203),
  ('ca', 'Canada', '🇨🇦', 'Americas', 'North America', 204),
  ('au', 'Australia', '🇦🇺', 'Oceania', 'Oceania', 205),

  -- Other European Countries
  ('it', 'Italy', '🇮🇹', 'Europe', 'Southern Europe', 300),
  ('es', 'Spain', '🇪🇸', 'Europe', 'Southern Europe', 301),
  ('nl', 'Netherlands', '🇳🇱', 'Europe', 'Western Europe', 302),
  ('ch', 'Switzerland', '🇨🇭', 'Europe', 'Western Europe', 303),
  ('se', 'Sweden', '🇸🇪', 'Europe', 'Northern Europe', 304),
  ('no', 'Norway', '🇳🇴', 'Europe', 'Northern Europe', 305),
  ('dk', 'Denmark', '🇩🇰', 'Europe', 'Northern Europe', 306),
  ('fi', 'Finland', '🇫🇮', 'Europe', 'Northern Europe', 307),
  ('be', 'Belgium', '🇧🇪', 'Europe', 'Western Europe', 308),
  ('at', 'Austria', '🇦🇹', 'Europe', 'Western Europe', 309),
  ('pt', 'Portugal', '🇵🇹', 'Europe', 'Southern Europe', 310),
  ('ie', 'Ireland', '🇮🇪', 'Europe', 'Western Europe', 311),
  ('ru', 'Russia', '🇷🇺', 'Europe', 'Eastern Europe', 312),

  -- Asia
  ('jp', 'Japan', '🇯🇵', 'Asia', 'East Asia', 400),
  ('cn', 'China', '🇨🇳', 'Asia', 'East Asia', 401),
  ('in', 'India', '🇮🇳', 'Asia', 'South Asia', 402),
  ('kr', 'South Korea', '🇰🇷', 'Asia', 'East Asia', 403),
  ('sg', 'Singapore', '🇸🇬', 'Asia', 'Southeast Asia', 404),

  -- Americas
  ('br', 'Brazil', '🇧🇷', 'Americas', 'South America', 500),
  ('mx', 'Mexico', '🇲🇽', 'Americas', 'North America', 501),
  
  -- Oceania
  ('nz', 'New Zealand', '🇳🇿', 'Oceania', 'Oceania', 600)

ON CONFLICT (code) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE public.countries IS 'Reference table for countries used throughout the application';
COMMENT ON COLUMN public.countries.code IS 'Two-letter country code (ISO 3166-1 alpha-2)';
COMMENT ON COLUMN public.countries.name IS 'Full country name in English';
COMMENT ON COLUMN public.countries.flag_emoji IS 'Unicode flag emoji for the country';
COMMENT ON COLUMN public.countries.region IS 'Geographic region (Africa, Europe, Asia, Americas, Middle East, Oceania)';
COMMENT ON COLUMN public.countries.sub_region IS 'More specific geographic sub-region';
COMMENT ON COLUMN public.countries.sort_order IS 'Lower numbers appear first in lists - used for prioritizing key markets';