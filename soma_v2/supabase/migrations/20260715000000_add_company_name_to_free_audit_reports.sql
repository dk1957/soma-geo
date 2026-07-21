-- Add company_name column to free_audit_reports
-- Used to store the parent company/organization name separately from brand_name
-- When user signs up, company_name is used for the account name (like normal onboarding)
ALTER TABLE free_audit_reports
ADD COLUMN IF NOT EXISTS company_name TEXT;

COMMENT ON COLUMN free_audit_reports.company_name IS 'Parent company name if different from brand_name. Used as account name on signup.';
