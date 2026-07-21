-- Fix brand_reports report_type check constraint
-- Migration: 20251103000000_fix_brand_reports_constraint.sql

-- Drop the existing constraint
ALTER TABLE brand_reports DROP CONSTRAINT IF EXISTS brand_reports_report_type_check;

-- Add the updated constraint with all valid report types (both dash and underscore formats)
ALTER TABLE brand_reports ADD CONSTRAINT brand_reports_report_type_check 
CHECK (report_type IN (
    -- Dash format (original schema)
    'brand-visibility', 
    'brand-discoverability', 
    'brand-audit', 
    'brand-mentions', 
    'brand-competitors', 
    'sources-citations',
    -- Underscore format (existing data and new types)
    'brand_visibility',
    'brand_discoverability',
    'brand_audit',
    'brand_mentions',
    'brand_competitors',
    'sources_citations',
    'visibility_report_external',
    'enhanced_brand_visibility'
));

COMMENT ON CONSTRAINT brand_reports_report_type_check ON brand_reports IS 'Validates report type values supporting both dash and underscore formats';
