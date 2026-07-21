-- ============================================================
-- Migration: Drop duplicate indexes across non-AEO tables
-- Date: 2026-04-10
-- Purpose: Each duplicate wastes storage and slows every write.
--          The UNIQUE constraint already creates an identical index.
-- ============================================================

-- account_subscriptions: idx_account_subscriptions_stripe duplicates account_subscriptions_stripe_subscription_id_key
DROP INDEX IF EXISTS idx_account_subscriptions_stripe;

-- account_subscriptions: idx_account_subscriptions_unique_active duplicates idx_account_subscriptions_account (same leading column: account_id)
-- Keep the partial/filtered one if it exists, drop the plain duplicate
DROP INDEX IF EXISTS idx_account_subscriptions_account;

-- agent_configs: idx_agent_configs_agent_id duplicates agent_configs_agent_id_key
DROP INDEX IF EXISTS idx_agent_configs_agent_id;

-- brand_quotas: unique_brand_quota duplicates idx_brand_quotas_brand (same: brand_id)
-- Keep the UNIQUE constraint, drop the plain index
DROP INDEX IF EXISTS idx_brand_quotas_brand;

-- brand_reports: idx_brand_reports_type duplicates idx_brand_reports_report_type
DROP INDEX IF EXISTS idx_brand_reports_type;

-- countries: idx_countries_code duplicates countries_code_key (UNIQUE)
DROP INDEX IF EXISTS idx_countries_code;

-- external_brand_reports: idx_external_brand_reports_share_token duplicates external_brand_reports_share_token_key
DROP INDEX IF EXISTS idx_external_brand_reports_share_token;

-- external_report_email_captures: idx_email_captures_access_token duplicates external_report_email_captures_access_token_key
DROP INDEX IF EXISTS idx_email_captures_access_token;

-- free_audit_reports: idx_free_audit_token duplicates free_audit_reports_access_token_key
DROP INDEX IF EXISTS idx_free_audit_token;

-- profiles: profiles_clerk_id_key duplicates idx_profiles_clerk_id
DROP INDEX IF EXISTS idx_profiles_clerk_id;

-- profiles: idx_profiles_onboarding_completed_at duplicates idx_profiles_onboarding_completed
DROP INDEX IF EXISTS idx_profiles_onboarding_completed;

-- profiles: profiles_user_id_key duplicates idx_profiles_user_id
DROP INDEX IF EXISTS idx_profiles_user_id;

-- suggested_prompts: idx_suggested_prompts_status duplicates idx_suggested_prompts_pending (same columns: brand_id, status)
-- Keep the partial index (WHERE status = 'pending'), drop the unfiltered one
DROP INDEX IF EXISTS idx_suggested_prompts_status;

-- web_search_config: has 3 indexes on model_id — keep the UNIQUE, drop the other two
DROP INDEX IF EXISTS idx_web_search_config_model;
DROP INDEX IF EXISTS idx_web_search_config_model_id;
