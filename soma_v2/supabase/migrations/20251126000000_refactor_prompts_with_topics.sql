-- ============================================================================
-- REFACTOR: Comprehensive Prompts System with Topics
-- ============================================================================
-- This migration introduces a topic-based organization system for prompts,
-- enabling users to cluster related prompts and get better AI suggestions.
-- 
-- Key changes:
-- 1. Create prompt_topics table for organizing prompts
-- 2. Add topic_id and tags to user_prompts
-- 3. Add prompt_type to distinguish intent types (what, who, how, vs, with_x)
-- 4. Add suggested_prompts table for AI-generated suggestions
-- 5. Create functions for topic-based prompt generation
-- ============================================================================

-- ============================================================================
-- 1. PROMPT TOPICS TABLE
-- ============================================================================
-- Topics create folder-like structures for organizing prompts by theme/product area

CREATE TABLE IF NOT EXISTS prompt_topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    
    -- Topic details
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1', -- Hex color for UI
    icon VARCHAR(50) DEFAULT 'folder', -- Icon name for UI
    
    -- Organization
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    prompt_count INTEGER DEFAULT 0, -- Denormalized for performance
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_topic_slug_per_brand UNIQUE (brand_id, slug),
    CONSTRAINT unique_topic_name_per_brand UNIQUE (brand_id, name)
);

-- Indexes
CREATE INDEX idx_prompt_topics_brand ON prompt_topics(brand_id);
CREATE INDEX idx_prompt_topics_account ON prompt_topics(account_id);
CREATE INDEX idx_prompt_topics_active ON prompt_topics(brand_id, is_active);

-- RLS
ALTER TABLE prompt_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view topics for their brands" ON prompt_topics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM account_users 
            WHERE account_users.account_id = prompt_topics.account_id 
            AND account_users.user_id = auth.uid() 
            AND account_users.is_active = true
        )
    );

CREATE POLICY "Users can manage topics for their brands" ON prompt_topics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM account_users 
            WHERE account_users.account_id = prompt_topics.account_id 
            AND account_users.user_id = auth.uid() 
            AND account_users.is_active = true
            AND account_users.role IN ('owner', 'admin', 'account_manager')
        )
    );

-- ============================================================================
-- 2. UPDATE USER_PROMPTS TABLE
-- ============================================================================

-- Add new columns to user_prompts if they don't exist
DO $$ 
BEGIN
    -- Add topic_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_prompts' AND column_name = 'topic_id') THEN
        ALTER TABLE user_prompts ADD COLUMN topic_id UUID REFERENCES prompt_topics(id) ON DELETE SET NULL;
    END IF;
    
    -- Add prompt_type for intent classification
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_prompts' AND column_name = 'prompt_type') THEN
        ALTER TABLE user_prompts ADD COLUMN prompt_type VARCHAR(20) DEFAULT 'general'
            CHECK (prompt_type IN ('what', 'who', 'how', 'why', 'compare', 'best', 'with_feature', 'general'));
    END IF;
    
    -- Add intent column (the core request)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_prompts' AND column_name = 'intent') THEN
        ALTER TABLE user_prompts ADD COLUMN intent TEXT;
    END IF;
    
    -- Add context column (specific constraints/situation)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_prompts' AND column_name = 'context') THEN
        ALTER TABLE user_prompts ADD COLUMN context TEXT;
    END IF;
    
    -- Add source column (how the prompt was created)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_prompts' AND column_name = 'source') THEN
        ALTER TABLE user_prompts ADD COLUMN source VARCHAR(30) DEFAULT 'manual'
            CHECK (source IN ('manual', 'suggestion', 'import', 'ai_generated', 'onboarding'));
    END IF;
    
    -- Add last_run_at for tracking execution
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_prompts' AND column_name = 'last_run_at') THEN
        ALTER TABLE user_prompts ADD COLUMN last_run_at TIMESTAMPTZ;
    END IF;
    
    -- Add run_count for analytics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_prompts' AND column_name = 'run_count') THEN
        ALTER TABLE user_prompts ADD COLUMN run_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_user_prompts_topic ON user_prompts(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_prompts_type ON user_prompts(brand_id, prompt_type);
CREATE INDEX IF NOT EXISTS idx_user_prompts_source ON user_prompts(brand_id, source);

-- ============================================================================
-- 3. SUGGESTED PROMPTS TABLE
-- ============================================================================
-- Stores AI-generated prompt suggestions before user accepts/rejects them

CREATE TABLE IF NOT EXISTS suggested_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES prompt_topics(id) ON DELETE SET NULL,
    
    -- Suggestion content
    prompt_text TEXT NOT NULL,
    prompt_type VARCHAR(50) DEFAULT 'general',
    intent TEXT,
    context TEXT,
    
    -- AI generation metadata
    generation_source VARCHAR(50) NOT NULL DEFAULT 'ai_engine', -- ai_engine, paa_research, competitor_analysis
    generation_metadata JSONB DEFAULT '{}',
    confidence_score DECIMAL(3,2) DEFAULT 0.80, -- 0-1 confidence in suggestion quality
    
    -- User interaction
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    accepted_prompt_id UUID REFERENCES user_prompts(id) ON DELETE SET NULL, -- Links to created prompt if accepted
    
    -- Organization
    suggested_topic_name VARCHAR(100), -- AI-suggested topic if no topic_id
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    reviewed_at TIMESTAMPTZ,
    
    -- Prevent duplicate suggestions
    CONSTRAINT unique_suggestion_per_brand UNIQUE (brand_id, prompt_text)
);

-- Indexes
CREATE INDEX idx_suggested_prompts_brand ON suggested_prompts(brand_id);
CREATE INDEX idx_suggested_prompts_status ON suggested_prompts(brand_id, status);
CREATE INDEX idx_suggested_prompts_topic ON suggested_prompts(topic_id);
CREATE INDEX idx_suggested_prompts_pending ON suggested_prompts(brand_id, status) WHERE status = 'pending';

-- RLS
ALTER TABLE suggested_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view suggestions for their brands" ON suggested_prompts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM account_users 
            WHERE account_users.account_id = suggested_prompts.account_id 
            AND account_users.user_id = auth.uid() 
            AND account_users.is_active = true
        )
    );

CREATE POLICY "Users can manage suggestions for their brands" ON suggested_prompts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM account_users 
            WHERE account_users.account_id = suggested_prompts.account_id 
            AND account_users.user_id = auth.uid() 
            AND account_users.is_active = true
        )
    );

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Function to update topic prompt count
CREATE OR REPLACE FUNCTION update_topic_prompt_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update old topic count if changed
    IF TG_OP = 'UPDATE' AND OLD.topic_id IS DISTINCT FROM NEW.topic_id THEN
        IF OLD.topic_id IS NOT NULL THEN
            UPDATE prompt_topics SET prompt_count = prompt_count - 1, updated_at = NOW()
            WHERE id = OLD.topic_id;
        END IF;
    END IF;
    
    -- Update new topic count
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.topic_id IS DISTINCT FROM NEW.topic_id) THEN
        IF NEW.topic_id IS NOT NULL THEN
            UPDATE prompt_topics SET prompt_count = prompt_count + 1, updated_at = NOW()
            WHERE id = NEW.topic_id;
        END IF;
    END IF;
    
    -- Handle delete
    IF TG_OP = 'DELETE' THEN
        IF OLD.topic_id IS NOT NULL THEN
            UPDATE prompt_topics SET prompt_count = prompt_count - 1, updated_at = NOW()
            WHERE id = OLD.topic_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for topic count
DROP TRIGGER IF EXISTS trigger_update_topic_prompt_count ON user_prompts;
CREATE TRIGGER trigger_update_topic_prompt_count
    AFTER INSERT OR UPDATE OF topic_id OR DELETE ON user_prompts
    FOR EACH ROW EXECUTE FUNCTION update_topic_prompt_count();

-- Function to accept a suggestion and create a prompt
CREATE OR REPLACE FUNCTION accept_prompt_suggestion(
    p_suggestion_id UUID,
    p_topic_id UUID DEFAULT NULL,
    p_locale_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_suggestion suggested_prompts%ROWTYPE;
    v_new_prompt_id UUID;
BEGIN
    -- Get the suggestion
    SELECT * INTO v_suggestion FROM suggested_prompts WHERE id = p_suggestion_id;
    
    IF v_suggestion IS NULL THEN
        RAISE EXCEPTION 'Suggestion not found';
    END IF;
    
    IF v_suggestion.status != 'pending' THEN
        RAISE EXCEPTION 'Suggestion already processed';
    END IF;
    
    -- Create the prompt
    INSERT INTO user_prompts (
        account_id, brand_id, topic_id, prompt_text, prompt_type,
        intent, context, source, is_selected, locale
    ) VALUES (
        v_suggestion.account_id,
        v_suggestion.brand_id,
        COALESCE(p_topic_id, v_suggestion.topic_id),
        v_suggestion.prompt_text,
        v_suggestion.prompt_type,
        v_suggestion.intent,
        v_suggestion.context,
        'suggestion',
        true,
        p_locale_id
    )
    RETURNING id INTO v_new_prompt_id;
    
    -- Update the suggestion
    UPDATE suggested_prompts SET
        status = 'accepted',
        accepted_prompt_id = v_new_prompt_id,
        reviewed_at = NOW()
    WHERE id = p_suggestion_id;
    
    RETURN v_new_prompt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a suggestion
CREATE OR REPLACE FUNCTION reject_prompt_suggestion(p_suggestion_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE suggested_prompts SET
        status = 'rejected',
        reviewed_at = NOW()
    WHERE id = p_suggestion_id AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate slug from topic name
CREATE OR REPLACE FUNCTION generate_topic_slug(p_name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(regexp_replace(trim(p_name), '[^a-zA-Z0-9]+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. DEFAULT TOPIC TEMPLATES
-- ============================================================================
-- These are suggested topic categories that users can start with

CREATE TABLE IF NOT EXISTS default_topic_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'folder',
    color VARCHAR(7) DEFAULT '#6366f1',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Insert default templates
INSERT INTO default_topic_templates (name, description, icon, color, sort_order) VALUES
    ('Product Features', 'Prompts about specific product capabilities and features', 'package', '#3b82f6', 1),
    ('Pricing & Plans', 'Prompts comparing pricing, plans, and value propositions', 'dollar-sign', '#10b981', 2),
    ('Competitors', 'Prompts comparing against specific competitors', 'users', '#f59e0b', 3),
    ('Use Cases', 'Prompts about specific use cases and applications', 'briefcase', '#8b5cf6', 4),
    ('Industry Trends', 'Prompts about market trends and industry developments', 'trending-up', '#ec4899', 5),
    ('Customer Support', 'Prompts about support, reliability, and service quality', 'headphones', '#06b6d4', 6),
    ('Integration & Tech', 'Prompts about integrations, APIs, and technical capabilities', 'code', '#64748b', 7),
    ('Reviews & Reputation', 'Prompts seeking reviews, ratings, and reputation info', 'star', '#eab308', 8)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. GRANTS AND PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION accept_prompt_suggestion(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_prompt_suggestion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_topic_slug(TEXT) TO authenticated;

-- ============================================================================
-- 7. COMMENTS
-- ============================================================================

COMMENT ON TABLE prompt_topics IS 'Organizes prompts into topics/folders for better management and AI suggestions';
COMMENT ON TABLE suggested_prompts IS 'Stores AI-generated prompt suggestions before user review';
COMMENT ON TABLE default_topic_templates IS 'Pre-defined topic templates that users can use as starting points';

COMMENT ON COLUMN user_prompts.prompt_type IS 'The question type: what, who, how, why, compare, best, with_feature, general';
COMMENT ON COLUMN user_prompts.intent IS 'The core request - what the user wants to know';
COMMENT ON COLUMN user_prompts.context IS 'Specific constraints or situation details that shape the response';
COMMENT ON COLUMN user_prompts.source IS 'How the prompt was created: manual, suggestion, import, ai_generated, onboarding';

COMMENT ON FUNCTION accept_prompt_suggestion IS 'Converts a pending suggestion into an active prompt';
COMMENT ON FUNCTION reject_prompt_suggestion IS 'Marks a suggestion as rejected so it wont be shown again';
