-- Add missing columns to free_audit_reports
-- These are used by the free audit API insert
ALTER TABLE free_audit_reports
ADD COLUMN IF NOT EXISTS brand_categories TEXT[] DEFAULT '{}';

ALTER TABLE free_audit_reports
ADD COLUMN IF NOT EXISTS brand_industry TEXT;

ALTER TABLE free_audit_reports
ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';

ALTER TABLE free_audit_reports
ADD COLUMN IF NOT EXISTS target_markets TEXT[] DEFAULT '{}';
