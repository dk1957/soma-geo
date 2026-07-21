-- Fix entity_check constraint to allow discovered competitors
-- Date: 2025-11-09
-- Issue: Constraint was too strict - didn't allow for dynamically discovered competitors

-- Drop the old constraint
ALTER TABLE response_analysis DROP CONSTRAINT IF EXISTS entity_check;

-- Add new, more flexible constraint
-- Allows three scenarios:
-- 1. Primary brand: primary_brand_id IS NOT NULL, brand_competitor_id IS NULL, is_primary_brand = true
-- 2. Tracked competitor: primary_brand_id IS NULL, brand_competitor_id IS NOT NULL, is_primary_brand = false  
-- 3. Discovered competitor: primary_brand_id IS NULL, brand_competitor_id IS NULL, is_primary_brand = false
ALTER TABLE response_analysis ADD CONSTRAINT entity_check CHECK (
  (is_primary_brand = true AND primary_brand_id IS NOT NULL AND brand_competitor_id IS NULL) OR
  (is_primary_brand = false AND primary_brand_id IS NULL)
);

COMMENT ON CONSTRAINT entity_check ON response_analysis IS 
  'Ensures primary brands have primary_brand_id set, and competitors have at most one of the ID fields set';
