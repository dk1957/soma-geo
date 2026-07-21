-- ============================================================================
-- Free Audit Pipeline Provisioning
-- ============================================================================
-- Enables the free audit to use the same data pipeline as the dashboard:
--   LLM responses → llm_response_files → AEO extraction → aggregation
--
-- Architecture:
--   1. A system account holds provisional brands for free audits
--   2. At execute time, a provisional brand is created under the system account
--   3. Responses are stored in llm_response_files + Supabase Storage
--   4. Extraction + aggregation run immediately (same as dashboard pipeline)
--   5. On signup/claim, the brand is transferred to the user's real account
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Fix runs.profile_id FK
-- ============================================================================
-- The original schema had profile_id → auth.users(id), but the Clerk migration
-- means profiles.id ≠ auth.users.id. This FK has been silently failing.
-- Drop it and make nullable for provisional runs (no user yet).

ALTER TABLE runs
  DROP CONSTRAINT IF EXISTS runs_profile_id_fkey,
  ALTER COLUMN profile_id DROP NOT NULL;

COMMENT ON COLUMN runs.profile_id IS 'Profile UUID. Nullable for provisional free-audit runs.';

-- ============================================================================
-- STEP 2: Create system account for free audit provisioning
-- ============================================================================
-- A single well-known account that owns all provisional free-audit brands.
-- Brands are transferred to real accounts on signup.

INSERT INTO accounts (
  id, name, slug, account_type, owner_clerk_id, company_size, industry,
  billing_plan, billing_status, is_active
) VALUES (
  'a0000000-0000-4000-a000-000000000001',
  'Soma AI Free Audit System',
  'soma-free-audit-system',
  'in_house',
  'system_free_audit',
  'enterprise',
  'technology',
  'enterprise',
  'active',
  true
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 3: Add provisional tracking columns to free_audit_reports
-- ============================================================================

ALTER TABLE free_audit_reports
  ADD COLUMN IF NOT EXISTS provisional_brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS run_id TEXT;

CREATE INDEX IF NOT EXISTS idx_free_audit_provisional_brand
  ON free_audit_reports(provisional_brand_id) WHERE provisional_brand_id IS NOT NULL;

COMMENT ON COLUMN free_audit_reports.provisional_brand_id IS 'Brand created under system account during free audit. Transferred on claim.';
COMMENT ON COLUMN free_audit_reports.run_id IS 'LLM run ID for the free audit execution.';

-- ============================================================================
-- STEP 4: Brand transfer function
-- ============================================================================
-- Atomically transfers a brand and ALL associated data from one account to another.
-- Used when a free audit user signs up and claims their brand.

CREATE OR REPLACE FUNCTION transfer_brand_to_account(
  p_brand_id UUID,
  p_from_account_id UUID,
  p_to_account_id UUID,
  p_profile_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Transfer the brand itself
  UPDATE brands
    SET account_id = p_to_account_id, updated_at = now()
    WHERE id = p_brand_id AND account_id = p_from_account_id;

  -- 2. Transfer response files
  UPDATE llm_response_files
    SET account_id = p_to_account_id,
        profile_id = COALESCE(p_profile_id, profile_id)
    WHERE brand_id = p_brand_id AND account_id = p_from_account_id;

  -- 3. Transfer extracted response data
  UPDATE response_data
    SET account_id = p_to_account_id
    WHERE brand_id = p_brand_id AND account_id = p_from_account_id;

  -- 4. Transfer daily metrics
  UPDATE daily_brand_metrics
    SET account_id = p_to_account_id
    WHERE brand_id = p_brand_id AND account_id = p_from_account_id;

  UPDATE daily_competitor_metrics
    SET account_id = p_to_account_id
    WHERE brand_id = p_brand_id AND account_id = p_from_account_id;

  UPDATE daily_prompt_metrics
    SET account_id = p_to_account_id
    WHERE brand_id = p_brand_id AND account_id = p_from_account_id;

  -- 5. Transfer runs
  UPDATE runs
    SET account_id = p_to_account_id,
        profile_id = COALESCE(p_profile_id, profile_id)
    WHERE brand_id = p_brand_id AND account_id = p_from_account_id;

  -- 6. Transfer competitors
  UPDATE competitors
    SET account_id = p_to_account_id
    WHERE brand_id = p_brand_id AND account_id = p_from_account_id;

  -- 7. Transfer user prompts
  UPDATE user_prompts
    SET account_id = p_to_account_id
    WHERE brand_id = p_brand_id AND account_id = p_from_account_id;

  -- 8. Transfer citations
  UPDATE aeo_citations
    SET account_id = p_to_account_id
    WHERE brand_id = p_brand_id AND account_id = p_from_account_id;

  -- 9. Transfer topics
  UPDATE prompt_topics
    SET account_id = p_to_account_id
    WHERE brand_id = p_brand_id AND account_id = p_from_account_id;

  -- 10. Transfer strategic insights
  UPDATE strategic_insights
    SET account_id = p_to_account_id
    WHERE brand_id = p_brand_id AND account_id = p_from_account_id;
END;
$$;

GRANT EXECUTE ON FUNCTION transfer_brand_to_account(UUID, UUID, UUID, UUID) TO service_role;

COMMENT ON FUNCTION transfer_brand_to_account IS
  'Atomically transfers a brand and all associated pipeline data from one account to another. Used for free audit → signup conversion.';

-- ============================================================================
-- STEP 5: Cleanup function for unclaimed provisional brands
-- ============================================================================
-- Call from cron to remove provisional brands older than 30 days that were never claimed.

CREATE OR REPLACE FUNCTION cleanup_provisional_brands()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleaned INTEGER := 0;
  system_account_id UUID := 'a0000000-0000-4000-a000-000000000001';
BEGIN
  -- Delete brands under system account that are older than 30 days
  -- CASCADE will clean up response_data, llm_response_files, daily_*_metrics, etc.
  WITH deleted AS (
    DELETE FROM brands
    WHERE account_id = system_account_id
      AND created_at < now() - interval '30 days'
      AND id NOT IN (
        -- Don't delete brands linked to audit reports that have been claimed
        SELECT provisional_brand_id FROM free_audit_reports
        WHERE provisional_brand_id IS NOT NULL AND claimed_at IS NOT NULL
      )
    RETURNING id
  )
  SELECT count(*) INTO cleaned FROM deleted;

  RETURN cleaned;
END;
$$;

GRANT EXECUTE ON FUNCTION cleanup_provisional_brands() TO service_role;

COMMIT;
