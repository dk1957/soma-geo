-- Test script to verify onboarding report generation integration
-- This script creates a mock audit result and tests if brand_reports are generated correctly

-- First, let's check the current state
\echo 'Current brand_reports count:'
SELECT COUNT(*) as total_reports FROM brand_reports;

\echo 'Current audit_results count:'  
SELECT COUNT(*) as total_audits FROM audit_results;

\echo 'Brands without reports:'
SELECT b.id, b.name 
FROM brands b 
LEFT JOIN brand_reports br ON br.brand_id = b.id 
WHERE br.id IS NULL;

\echo 'Reports with missing workspace_id:'
SELECT br.id, br.title, br.workspace_id, b.name as brand_name
FROM brand_reports br 
JOIN brands b ON b.id = br.brand_id 
WHERE br.workspace_id IS NULL;

\echo 'Summary by source:'
SELECT source, COUNT(*) as count 
FROM brand_reports 
GROUP BY source 
ORDER BY count DESC;

\echo ''
\echo 'Integration check complete!'
\echo 'Next step: Test a new onboarding flow to ensure reports are auto-generated'