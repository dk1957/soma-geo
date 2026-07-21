-- Populate account_id and brand_id in onboarding_audits table
-- Created: 2025-09-08 15:00:00
-- Purpose: Link onboarding audits to proper accounts and brands for better data flow

-- Update account_id based on user_id
UPDATE onboarding_audits 
SET account_id = (
  SELECT au.account_id 
  FROM account_users au 
  WHERE au.user_id = onboarding_audits.user_id 
  AND au.is_active = true
  ORDER BY au.created_at ASC
  LIMIT 1
)
WHERE account_id IS NULL AND user_id IS NOT NULL;

-- Update brand_id based on brand_name and account_id
UPDATE onboarding_audits 
SET brand_id = (
  SELECT b.id 
  FROM brands b 
  WHERE b.account_id = onboarding_audits.account_id 
  AND LOWER(b.name) = LOWER(onboarding_audits.brand_name)
  LIMIT 1
)
WHERE brand_id IS NULL AND account_id IS NOT NULL;

-- If no exact brand match, try to find brands in the same account
UPDATE onboarding_audits 
SET brand_id = (
  SELECT b.id 
  FROM brands b 
  WHERE b.account_id = onboarding_audits.account_id 
  ORDER BY b.created_at DESC
  LIMIT 1
)
WHERE brand_id IS NULL AND account_id IS NOT NULL;

-- Create function to automatically populate account_id and brand_id for new onboarding audits
CREATE OR REPLACE FUNCTION populate_onboarding_audit_relationships()
RETURNS TRIGGER AS $$
BEGIN
  -- Populate account_id if not provided
  IF NEW.account_id IS NULL AND NEW.user_id IS NOT NULL THEN
    SELECT au.account_id INTO NEW.account_id
    FROM account_users au 
    WHERE au.user_id = NEW.user_id 
    AND au.is_active = true
    ORDER BY au.created_at ASC
    LIMIT 1;
  END IF;
  
  -- Populate brand_id if not provided
  IF NEW.brand_id IS NULL AND NEW.account_id IS NOT NULL AND NEW.brand_name IS NOT NULL THEN
    -- First try exact brand name match
    SELECT b.id INTO NEW.brand_id
    FROM brands b 
    WHERE b.account_id = NEW.account_id 
    AND LOWER(b.name) = LOWER(NEW.brand_name)
    LIMIT 1;
    
    -- If no exact match, try partial match or create opportunity for manual linking
    IF NEW.brand_id IS NULL THEN
      SELECT b.id INTO NEW.brand_id
      FROM brands b 
      WHERE b.account_id = NEW.account_id 
      AND LOWER(b.name) ILIKE '%' || LOWER(NEW.brand_name) || '%'
      LIMIT 1;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically populate relationships on insert/update
DROP TRIGGER IF EXISTS populate_onboarding_audit_relationships_trigger ON onboarding_audits;
CREATE TRIGGER populate_onboarding_audit_relationships_trigger
  BEFORE INSERT OR UPDATE ON onboarding_audits
  FOR EACH ROW
  EXECUTE FUNCTION populate_onboarding_audit_relationships();

-- Add function to link existing ground truth collections to onboarding audits
CREATE OR REPLACE FUNCTION link_ground_truth_to_audits()
RETURNS INTEGER AS $$
DECLARE
  linked_count INTEGER := 0;
  audit_record RECORD;
  gtc_record RECORD;
BEGIN
  -- Loop through onboarding audits that have proper account/brand relationships
  FOR audit_record IN 
    SELECT id, user_id, account_id, brand_id, brand_name, created_at
    FROM onboarding_audits 
    WHERE account_id IS NOT NULL AND brand_id IS NOT NULL
  LOOP
    -- Find corresponding ground truth collections for the same user/brand
    FOR gtc_record IN
      SELECT id, brand_name, created_at
      FROM ground_truth_collections
      WHERE user_id = audit_record.user_id
      AND LOWER(brand_name) = LOWER(audit_record.brand_name)
      AND account_id IS NULL -- Only update unlinked records
    LOOP
      -- Update ground truth collection with audit relationships
      UPDATE ground_truth_collections
      SET 
        account_id = audit_record.account_id,
        brand_id = audit_record.brand_id,
        updated_at = NOW()
      WHERE id = gtc_record.id;
      
      linked_count := linked_count + 1;
    END LOOP;
  END LOOP;
  
  RETURN linked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the linking function to connect existing data
SELECT link_ground_truth_to_audits() as linked_collections;

-- Grant permissions
GRANT EXECUTE ON FUNCTION populate_onboarding_audit_relationships() TO authenticated;
GRANT EXECUTE ON FUNCTION link_ground_truth_to_audits() TO service_role;

-- Add comments
COMMENT ON FUNCTION populate_onboarding_audit_relationships IS 'Automatically populate account_id and brand_id for onboarding audits based on user relationships';
COMMENT ON FUNCTION link_ground_truth_to_audits IS 'Link existing ground truth collections to onboarding audits based on user and brand matching';