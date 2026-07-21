-- Fix Brand Contexts Data Flow Issues
-- Created: 2025-09-08
-- Purpose: Ensure brand_contexts table always includes account_id and brand_id during onboarding

-- First, let's ensure the brand_contexts table has all required columns
ALTER TABLE brand_contexts 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing brand_contexts records that may be missing account_id/brand_id
-- Match by user_id and brand_name to populate missing relationships
UPDATE brand_contexts 
SET 
  account_id = COALESCE(brand_contexts.account_id, (
    SELECT b.account_id 
    FROM brands b
    JOIN account_users au ON au.account_id = b.account_id
    WHERE au.user_id = brand_contexts.user_id 
    AND LOWER(b.name) = LOWER(brand_contexts.brand_name)
    LIMIT 1
  )),
  brand_id = COALESCE(brand_contexts.brand_id, (
    SELECT b.id 
    FROM brands b
    JOIN account_users au ON au.account_id = b.account_id
    WHERE au.user_id = brand_contexts.user_id 
    AND LOWER(b.name) = LOWER(brand_contexts.brand_name)
    LIMIT 1
  ))
WHERE account_id IS NULL OR brand_id IS NULL;

-- Create improved function to insert brand contexts with proper relationships
CREATE OR REPLACE FUNCTION insert_brand_context_with_relationships(
    p_user_id UUID,
    p_brand_name TEXT,
    p_context_text TEXT,
    p_similarity_score FLOAT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_account_id UUID;
    v_brand_id UUID;
    v_context_id UUID;
BEGIN
    -- Find the user's account and brand based on brand name
    SELECT 
        b.account_id,
        b.id
    INTO v_account_id, v_brand_id
    FROM brands b
    JOIN account_users au ON au.account_id = b.account_id
    WHERE au.user_id = p_user_id 
    AND au.is_active = true
    AND LOWER(b.name) = LOWER(p_brand_name)
    LIMIT 1;
    
    -- If no exact match, try to find any brand for this user (fallback)
    IF v_account_id IS NULL OR v_brand_id IS NULL THEN
        SELECT 
            b.account_id,
            b.id
        INTO v_account_id, v_brand_id
        FROM brands b
        JOIN account_users au ON au.account_id = b.account_id
        WHERE au.user_id = p_user_id 
        AND au.is_active = true
        ORDER BY b.created_at DESC
        LIMIT 1;
    END IF;
    
    -- If still no match, get user's primary account
    IF v_account_id IS NULL THEN
        SELECT account_id
        INTO v_account_id
        FROM account_users
        WHERE user_id = p_user_id 
        AND is_active = true
        ORDER BY created_at ASC
        LIMIT 1;
    END IF;
    
    -- Insert the brand context with proper relationships
    INSERT INTO brand_contexts (
        user_id,
        account_id,
        brand_id,
        brand_name,
        context_text,
        similarity_score,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        v_account_id,
        v_brand_id,
        p_brand_name,
        p_context_text,
        p_similarity_score,
        p_metadata,
        NOW(),
        NOW()
    ) RETURNING id INTO v_context_id;
    
    RETURN v_context_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to ensure ground truth data is linked to proper brand/account
CREATE OR REPLACE FUNCTION store_ground_truth_with_brand_context(
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
    p_questions_data JSONB
) RETURNS UUID AS $$
DECLARE
    v_account_id UUID;
    v_brand_id UUID;
    v_collection_id UUID;
BEGIN
    -- Find the user's account and brand
    SELECT 
        b.account_id,
        b.id
    INTO v_account_id, v_brand_id
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
            b.id
        INTO v_account_id, v_brand_id
        FROM brands b
        JOIN account_users au ON au.account_id = b.account_id
        WHERE au.user_id = p_user_id 
        AND au.is_active = true
        ORDER BY b.created_at DESC
        LIMIT 1;
    END IF;
    
    -- Insert ground truth collection with brand context
    INSERT INTO ground_truth_collections (
        user_id,
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
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
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
        NOW(),
        NOW()
    ) RETURNING id INTO v_collection_id;
    
    -- If we have brand context, also create a brand_context entry
    IF v_account_id IS NOT NULL AND v_brand_id IS NOT NULL THEN
        PERFORM insert_brand_context_with_relationships(
            p_user_id,
            p_brand_name,
            'Ground truth research data for ' || p_brand_name || ' including ' || p_total_questions || ' questions from ' || array_to_string(p_markets, ', '),
            p_quality_score::FLOAT / 100.0,  -- Convert quality score to similarity score
            jsonb_build_object(
                'source', 'ground_truth_research',
                'collection_id', v_collection_id,
                'total_questions', p_total_questions,
                'high_intent_questions', p_high_intent_questions,
                'quality_score', p_quality_score,
                'markets', p_markets
            )
        );
    END IF;
    
    RETURN v_collection_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add constraints to ensure data integrity
ALTER TABLE brand_contexts 
ADD CONSTRAINT brand_contexts_require_account_or_user 
CHECK (account_id IS NOT NULL OR user_id IS NOT NULL);

-- Add indexes for better performance on the key lookup operations
CREATE INDEX IF NOT EXISTS idx_brand_contexts_user_brand_name 
ON brand_contexts(user_id, LOWER(brand_name));

CREATE INDEX IF NOT EXISTS idx_brands_account_name 
ON brands(account_id, LOWER(name));

-- Grant permissions to the functions
GRANT EXECUTE ON FUNCTION insert_brand_context_with_relationships(UUID, TEXT, TEXT, FLOAT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION store_ground_truth_with_brand_context(UUID, TEXT, TEXT, TEXT[], INTEGER, INTEGER, INTEGER, JSONB, JSONB, TEXT[], JSONB) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION insert_brand_context_with_relationships IS 'Safely insert brand context with proper account_id and brand_id relationships';
COMMENT ON FUNCTION store_ground_truth_with_brand_context IS 'Store ground truth research data with proper brand context relationships';

-- Update existing RLS policies to be more permissive for service operations
CREATE POLICY "Service role can manage all brand contexts" ON brand_contexts
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Create view for easier brand context queries with full relationships
CREATE OR REPLACE VIEW brand_contexts_with_relationships AS
SELECT 
    bc.*,
    a.name as account_name,
    a.slug as account_slug,
    b.name as brand_name_verified,
    b.slug as brand_slug,
    b.brand_type,
    b.industry as brand_industry
FROM brand_contexts bc
LEFT JOIN accounts a ON a.id = bc.account_id
LEFT JOIN brands b ON b.id = bc.brand_id;

COMMENT ON VIEW brand_contexts_with_relationships IS 'Brand contexts with full account and brand relationship data';

-- Grant view access
GRANT SELECT ON brand_contexts_with_relationships TO authenticated;