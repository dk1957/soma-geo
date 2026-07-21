-- Fix Ground Truth Collection Function
-- Created: 2025-09-08 12:15:00
-- Purpose: Fix the function definition with proper default parameters

-- Drop and recreate the function with correct parameter defaults
DROP FUNCTION IF EXISTS store_enhanced_ground_truth_collection;

CREATE OR REPLACE FUNCTION store_enhanced_ground_truth_collection(
    p_user_id UUID,
    p_brand_name TEXT,
    p_business_category TEXT,
    p_markets TEXT[],
    p_total_questions INTEGER,
    p_high_intent_questions INTEGER,
    p_quality_score INTEGER,
    p_market_breakdown JSONB,
    p_intent_breakdown JSONB,
    p_top_sources TEXT[],
    p_questions_data JSONB,
    p_business_categories TEXT[] DEFAULT NULL,
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
        -- Check if insert_brand_context_with_relationships function exists
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'insert_brand_context_with_relationships') THEN
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

-- Grant permissions with correct signature
GRANT EXECUTE ON FUNCTION store_enhanced_ground_truth_collection(UUID, TEXT, TEXT, TEXT[], INTEGER, INTEGER, INTEGER, JSONB, JSONB, TEXT[], JSONB, TEXT[], TEXT, JSONB, JSONB, TEXT[], TEXT[]) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION store_enhanced_ground_truth_collection IS 'Store ground truth research data with full brand context and LDI support';