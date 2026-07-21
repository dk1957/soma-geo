-- Migration: Create brand_reports records for existing onboarding audit data
-- Date: 2025-09-07

-- Insert brand_reports records for existing audit_results that don't have corresponding reports
INSERT INTO brand_reports (
    user_id,
    account_id, 
    brand_id,
    audit_id,
    title,
    description,
    report_type,
    status,
    source,
    auto_generated,
    overall_score,
    visibility_score,
    raw_data,
    generated_at,
    created_at
)
SELECT 
    ar.user_id,
    ar.account_id,
    b.id as brand_id,
    ar.id as audit_id,
    ar.brand_name || ' - AI Discoverability Analysis' as title,
    'Comprehensive AI visibility audit report generated from onboarding analysis on ' || ar.created_at::date::text as description,
    'brand_audit' as report_type,
    'completed' as status,
    'onboarding_audit' as source,
    true as auto_generated,
    ar.ldi_score as overall_score,
    ar.visibility_score,
    ar.audit_data as raw_data,
    ar.created_at as generated_at,
    ar.created_at
FROM audit_results ar
JOIN brands b ON (b.name = ar.brand_name AND b.account_id = ar.account_id)
WHERE ar.audit_data IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM brand_reports br 
      WHERE br.audit_id = ar.id
  );

-- Output the results
SELECT 
    'Created brand_reports record for: ' || ar.brand_name as message,
    br.id as report_id,
    br.title,
    br.source,
    br.created_at
FROM audit_results ar
JOIN brands b ON (b.name = ar.brand_name AND b.account_id = ar.account_id)
JOIN brand_reports br ON (br.audit_id = ar.id)
WHERE ar.audit_data IS NOT NULL;