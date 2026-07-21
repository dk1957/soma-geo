-- Enhanced Ground Truth Collections System
-- Created: 2025-09-08
-- Purpose: Improve ground truth data collection with proper brand/account relationships and LDI calculation support

-- First, add missing foreign key relationships to existing ground_truth_collections table
ALTER TABLE ground_truth_collections 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;

-- Update existing records to populate account_id and brand_id based on user_id and brand_name
UPDATE ground_truth_collections 
SET 
  account_id = COALESCE(ground_truth_collections.account_id, (
    SELECT b.account_id 
    FROM brands b
    JOIN account_users au ON au.account_id = b.account_id
    WHERE au.user_id = ground_truth_collections.user_id 
    AND LOWER(b.name) = LOWER(ground_truth_collections.brand_name)
    LIMIT 1
  )),
  brand_id = COALESCE(ground_truth_collections.brand_id, (
    SELECT b.id 
    FROM brands b
    JOIN account_users au ON au.account_id = b.account_id
    WHERE au.user_id = ground_truth_collections.user_id 
    AND LOWER(b.name) = LOWER(ground_truth_collections.brand_name)
    LIMIT 1
  ))
WHERE account_id IS NULL OR brand_id IS NULL;

-- Add workspace_id for multi-workspace brands
UPDATE ground_truth_collections 
SET workspace_id = (
  SELECT w.id 
  FROM workspaces w
  WHERE w.brand_id = ground_truth_collections.brand_id
  AND w.is_default = true
  LIMIT 1
)
WHERE workspace_id IS NULL AND brand_id IS NOT NULL;

-- Add enhanced columns for better analytics and LDI calculation support
ALTER TABLE ground_truth_collections 
ADD COLUMN IF NOT EXISTS collection_type TEXT DEFAULT 'comprehensive' CHECK (collection_type IN ('quick', 'comprehensive', 'periodic')),
ADD COLUMN IF NOT EXISTS competitor_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS source_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS ldi_input_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS keywords_extracted TEXT[],
ADD COLUMN IF NOT EXISTS competitors_discovered TEXT[];

-- Create improved indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ground_truth_collections_account_brand 
ON ground_truth_collections(account_id, brand_id);

CREATE INDEX IF NOT EXISTS idx_ground_truth_collections_processing_status 
ON ground_truth_collections(processing_status, created_at);

CREATE INDEX IF NOT EXISTS idx_ground_truth_collections_type_status 
ON ground_truth_collections(collection_type, processing_status);

-- Enhanced function to store ground truth data with full brand context
CREATE OR REPLACE FUNCTION store_enhanced_ground_truth_collection(
    p_user_id UUID,
    p_brand_name TEXT,
    p_business_category TEXT,
    p_business_categories TEXT[] DEFAULT NULL,
    p_markets TEXT[],
    p_total_questions INTEGER,
    p_high_intent_questions INTEGER,
    p_quality_score INTEGER,
    p_market_breakdown JSONB,
    p_intent_breakdown JSONB,
    p_top_sources TEXT[],
    p_questions_data JSONB,
    p_collection_type TEXT DEFAULT 'comprehensive',
    p_competitor_data JSONB DEFAULT '{}',
    p_source_metadata JSONB DEFAULT '{}',
    p_keywords_extracted TEXT[] DEFAULT '{}',
    p_competitors_discovered TEXT[] DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_account_id UUID;
    v_brand_id UUID;
    v_workspace_id UUID;
    v_collection_id UUID;
BEGIN
    -- Find the user's account and brand
    SELECT 
        b.account_id,
        b.id,
        (SELECT w.id FROM workspaces w WHERE w.brand_id = b.id AND w.is_default = true LIMIT 1)
    INTO v_account_id, v_brand_id, v_workspace_id
    FROM brands b
    JOIN account_users au ON au.account_id = b.account_id
    WHERE au.user_id = p_user_id 
    AND au.is_active = true
    AND LOWER(b.name) = LOWER(p_brand_name)
    LIMIT 1;
    
    -- Fallback to any brand for this user
    IF v_account_id IS NULL OR v_brand_id IS NULL THEN
        SELECT 
            b.account_id,
            b.id,
            (SELECT w.id FROM workspaces w WHERE w.brand_id = b.id AND w.is_default = true LIMIT 1)
        INTO v_account_id, v_brand_id, v_workspace_id
        FROM brands b
        JOIN account_users au ON au.account_id = b.account_id
        WHERE au.user_id = p_user_id 
        AND au.is_active = true
        ORDER BY b.created_at DESC
        LIMIT 1;
    END IF;
    
    -- If still no brand, get user's primary account (for onboarding cases)
    IF v_account_id IS NULL THEN
        SELECT account_id
        INTO v_account_id
        FROM account_users
        WHERE user_id = p_user_id 
        AND is_active = true
        ORDER BY created_at ASC
        LIMIT 1;
    END IF;
    
    -- Insert enhanced ground truth collection
    INSERT INTO ground_truth_collections (
        user_id,
        account_id,
        brand_id,
        workspace_id,
        brand_name,
        business_category,
        markets,
        total_questions,
        high_intent_questions,
        quality_score,
        market_breakdown,
        intent_breakdown,
        top_sources,
        questions_data,
        collection_type,
        competitor_data,
        source_metadata,
        processing_status,
        keywords_extracted,
        competitors_discovered,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        v_account_id,
        v_brand_id,
        v_workspace_id,
        p_brand_name,
        p_business_category,
        p_markets,
        p_total_questions,
        p_high_intent_questions,
        p_quality_score,
        p_market_breakdown,
        p_intent_breakdown,
        p_top_sources,
        p_questions_data,
        p_collection_type,
        p_competitor_data,
        p_source_metadata,
        'completed', -- Mark as completed since we have the data
        p_keywords_extracted,
        p_competitors_discovered,
        NOW(),
        NOW()
    ) RETURNING id INTO v_collection_id;
    
    -- If we have brand context, create/update brand_context entry for this research
    IF v_account_id IS NOT NULL AND v_brand_id IS NOT NULL THEN
        PERFORM insert_brand_context_with_relationships(
            p_user_id,
            p_brand_name,
            'Ground truth research data for ' || p_brand_name || ' including ' || p_total_questions || ' questions from ' || array_to_string(p_markets, ', ') || '. Quality score: ' || p_quality_score || '/100',
            p_quality_score::FLOAT / 100.0,  -- Convert quality score to similarity score
            jsonb_build_object(
                'source', 'ground_truth_research',
                'collection_id', v_collection_id,
                'collection_type', p_collection_type,
                'total_questions', p_total_questions,
                'high_intent_questions', p_high_intent_questions,
                'quality_score', p_quality_score,
                'markets', p_markets,
                'competitors_discovered', p_competitors_discovered,
                'keywords_extracted', p_keywords_extracted,
                'created_at', NOW()
            )
        );
    END IF;
    
    -- Update LDI input flag if this is for LDI calculation
    IF p_collection_type = 'comprehensive' OR p_collection_type = 'periodic' THEN
        UPDATE ground_truth_collections 
        SET ldi_input_generated = TRUE
        WHERE id = v_collection_id;
    END IF;
    
    RETURN v_collection_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get ground truth data for LDI calculation
CREATE OR REPLACE FUNCTION get_ground_truth_for_ldi_calculation(
    p_brand_id UUID,
    p_account_id UUID DEFAULT NULL,
    p_days_back INTEGER DEFAULT 30
) RETURNS TABLE (
    collection_id UUID,
    brand_name TEXT,
    total_questions INTEGER,
    high_intent_questions INTEGER,
    quality_score INTEGER,
    questions_data JSONB,
    keywords_extracted TEXT[],
    competitors_discovered TEXT[],
    markets TEXT[],
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gtc.id,
        gtc.brand_name,
        gtc.total_questions,
        gtc.high_intent_questions,
        gtc.quality_score,
        gtc.questions_data,
        gtc.keywords_extracted,
        gtc.competitors_discovered,
        gtc.markets,
        gtc.created_at
    FROM ground_truth_collections gtc
    WHERE gtc.brand_id = p_brand_id
    AND (p_account_id IS NULL OR gtc.account_id = p_account_id)
    AND gtc.processing_status = 'completed'
    AND gtc.created_at >= NOW() - INTERVAL '1 day' * p_days_back
    AND gtc.ldi_input_generated = TRUE
    ORDER BY gtc.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for easier querying of ground truth data with full brand context
CREATE OR REPLACE VIEW ground_truth_collections_with_context AS
SELECT 
    gtc.*,
    a.name as account_name,
    a.slug as account_slug,
    b.name as brand_name_verified,
    b.slug as brand_slug,
    b.brand_type,
    b.industry as brand_industry,
    w.name as workspace_name,
    w.slug as workspace_slug
FROM ground_truth_collections gtc
LEFT JOIN accounts a ON a.id = gtc.account_id
LEFT JOIN brands b ON b.id = gtc.brand_id
LEFT JOIN workspaces w ON w.id = gtc.workspace_id;

-- Create function to clean up old ground truth collections (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_ground_truth_collections(
    p_retention_days INTEGER DEFAULT 90
) RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM ground_truth_collections
    WHERE created_at < NOW() - INTERVAL '1 day' * p_retention_days
    AND processing_status = 'completed'
    AND ldi_input_generated = FALSE; -- Keep LDI input data longer
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add constraints and policies
ALTER TABLE ground_truth_collections 
ADD CONSTRAINT ground_truth_collections_require_user_and_brand 
CHECK (user_id IS NOT NULL AND brand_name IS NOT NULL);

-- Update RLS policies to include account/brand access
DROP POLICY IF EXISTS "Users can view own ground truth collections" ON ground_truth_collections;
CREATE POLICY "Users can view ground truth collections with access" ON ground_truth_collections
    FOR SELECT USING (
        auth.uid() = user_id 
        OR 
        account_id IN (
            SELECT au.account_id FROM account_users au 
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

DROP POLICY IF EXISTS "Users can insert own ground truth collections" ON ground_truth_collections;
CREATE POLICY "Users can insert ground truth collections with access" ON ground_truth_collections
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND 
        (account_id IS NULL OR account_id IN (
            SELECT au.account_id FROM account_users au 
            WHERE au.user_id = auth.uid() AND au.is_active = true
        ))
    );

-- Service role policy for automated operations
CREATE POLICY "Service role can manage all ground truth collections" ON ground_truth_collections
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Grant permissions
GRANT EXECUTE ON FUNCTION store_enhanced_ground_truth_collection(UUID, TEXT, TEXT, TEXT[], TEXT[], INTEGER, INTEGER, INTEGER, JSONB, JSONB, TEXT[], JSONB, TEXT, JSONB, JSONB, TEXT[], TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ground_truth_for_ldi_calculation(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_ground_truth_collections(INTEGER) TO service_role;
GRANT SELECT ON ground_truth_collections_with_context TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE ground_truth_collections IS 'Enhanced ground truth research data with proper brand/account relationships for LDI calculation';
COMMENT ON FUNCTION store_enhanced_ground_truth_collection IS 'Store ground truth research data with full brand context and LDI support';
COMMENT ON FUNCTION get_ground_truth_for_ldi_calculation IS 'Retrieve ground truth data for calculating LLM Discoverability Index';
COMMENT ON VIEW ground_truth_collections_with_context IS 'Ground truth collections with full brand, account, and workspace context';

-- Add retention job scheduling comment
COMMENT ON FUNCTION cleanup_old_ground_truth_collections IS 'Cleanup old ground truth collections - schedule to run weekly via pg_cron';