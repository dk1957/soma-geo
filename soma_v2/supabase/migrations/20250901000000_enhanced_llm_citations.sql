-- Enhanced LLM Test Results Schema for Citation Analysis
-- Migration: 20250901000000_enhanced_llm_citations.sql

-- Add citation analysis columns to llm_test_results
ALTER TABLE llm_test_results 
ADD COLUMN IF NOT EXISTS detailed_sources JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS competitor_ranking JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS citation_types JSONB DEFAULT '{"markdown": 0, "numbered": 0, "direct": 0, "inline": 0}',
ADD COLUMN IF NOT EXISTS source_domains TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS citation_authority_score INTEGER DEFAULT 0;

-- Create comprehensive citation tracking table
CREATE TABLE IF NOT EXISTS citation_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    audit_id UUID REFERENCES onboarding_audits(id) ON DELETE CASCADE,
    llm_test_result_id UUID REFERENCES llm_test_results(id) ON DELETE CASCADE,
    
    -- Citation Details
    citation_url TEXT,
    citation_title TEXT,
    citation_domain TEXT,
    citation_type TEXT CHECK (citation_type IN ('markdown', 'numbered', 'direct', 'inline')),
    
    -- Source Analysis
    source_authority_score INTEGER DEFAULT 0 CHECK (source_authority_score >= 0 AND source_authority_score <= 100),
    source_category TEXT, -- retail, community, expert, news, etc.
    is_brand_relevant BOOLEAN DEFAULT false,
    
    -- Context Analysis
    mention_context TEXT,
    mention_sentiment TEXT CHECK (mention_sentiment IN ('positive', 'negative', 'neutral')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create competitor mention tracking
CREATE TABLE IF NOT EXISTS competitor_mentions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    audit_id UUID REFERENCES onboarding_audits(id) ON DELETE CASCADE,
    llm_test_result_id UUID REFERENCES llm_test_results(id) ON DELETE CASCADE,
    
    -- Competitor Details
    competitor_name TEXT NOT NULL,
    mention_position INTEGER, -- rank if in a list
    mention_context TEXT,
    mention_sentiment TEXT CHECK (mention_sentiment IN ('positive', 'negative', 'neutral')),
    
    -- Analysis
    is_direct_competitor BOOLEAN DEFAULT false,
    competitive_advantage TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_citation_analysis_audit_id ON citation_analysis(audit_id);
CREATE INDEX IF NOT EXISTS idx_citation_analysis_domain ON citation_analysis(citation_domain);
CREATE INDEX IF NOT EXISTS idx_citation_analysis_authority ON citation_analysis(source_authority_score DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_mentions_audit_id ON competitor_mentions(audit_id);
CREATE INDEX IF NOT EXISTS idx_competitor_mentions_position ON competitor_mentions(mention_position);

-- RLS Policies
ALTER TABLE citation_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view citation analysis for their accounts" ON citation_analysis
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM onboarding_audits oa
            JOIN account_users au ON oa.account_id = au.account_id
            WHERE oa.id = citation_analysis.audit_id 
            AND au.user_id = auth.uid()
            AND au.is_active = true
        )
    );

CREATE POLICY "Users can view competitor mentions for their accounts" ON competitor_mentions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM onboarding_audits oa
            JOIN account_users au ON oa.account_id = au.account_id
            WHERE oa.id = competitor_mentions.audit_id 
            AND au.user_id = auth.uid()
            AND au.is_active = true
        )
    );

-- Function to calculate citation authority score
CREATE OR REPLACE FUNCTION calculate_citation_authority(
    domain TEXT,
    citation_type TEXT,
    is_brand_relevant BOOLEAN
) RETURNS INTEGER AS $$
DECLARE
    base_score INTEGER := 50;
    domain_bonus INTEGER := 0;
    type_bonus INTEGER := 0;
    relevance_bonus INTEGER := 0;
BEGIN
    -- Domain authority bonuses
    CASE 
        WHEN domain LIKE '%.edu%' THEN domain_bonus := 30;
        WHEN domain LIKE '%.gov%' THEN domain_bonus := 25;
        WHEN domain IN ('wikipedia.org', 'bbc.com', 'reuters.com', 'bloomberg.com') THEN domain_bonus := 20;
        WHEN domain IN ('quora.com', 'reddit.com') THEN domain_bonus := 10;
        WHEN domain LIKE '%amazon.%' OR domain LIKE '%walmart.%' THEN domain_bonus := 15;
        ELSE domain_bonus := 0;
    END CASE;
    
    -- Citation type bonuses
    CASE citation_type
        WHEN 'markdown' THEN type_bonus := 10;
        WHEN 'numbered' THEN type_bonus := 15;
        WHEN 'direct' THEN type_bonus := 5;
        WHEN 'inline' THEN type_bonus := 0;
        ELSE type_bonus := 0;
    END CASE;
    
    -- Brand relevance bonus
    IF is_brand_relevant THEN
        relevance_bonus := 10;
    END IF;
    
    RETURN LEAST(100, base_score + domain_bonus + type_bonus + relevance_bonus);
END;
$$ LANGUAGE plpgsql;

-- Function to store enhanced citation data
CREATE OR REPLACE FUNCTION store_enhanced_citations(
    p_audit_id UUID,
    p_llm_test_result_id UUID,
    p_citations JSONB,
    p_detailed_sources JSONB,
    p_competitor_ranking JSONB
) RETURNS VOID AS $$
DECLARE
    citation_item JSONB;
    source_item JSONB;
    competitor_item JSONB;
    authority_score INTEGER;
BEGIN
    -- Store detailed sources
    FOR source_item IN SELECT * FROM jsonb_array_elements(p_detailed_sources)
    LOOP
        authority_score := calculate_citation_authority(
            source_item->>'domain',
            source_item->>'citationType',
            true -- Assume brand relevant for detailed sources
        );
        
        INSERT INTO citation_analysis (
            audit_id,
            llm_test_result_id,
            citation_url,
            citation_title,
            citation_domain,
            citation_type,
            source_authority_score,
            is_brand_relevant
        ) VALUES (
            p_audit_id,
            p_llm_test_result_id,
            source_item->>'url',
            source_item->>'title',
            source_item->>'domain',
            source_item->>'citationType',
            authority_score,
            true
        );
    END LOOP;
    
    -- Store competitor mentions
    FOR competitor_item IN SELECT * FROM jsonb_array_elements(p_competitor_ranking)
    LOOP
        INSERT INTO competitor_mentions (
            audit_id,
            llm_test_result_id,
            competitor_name,
            mention_position,
            mention_context,
            mention_sentiment,
            is_direct_competitor
        ) VALUES (
            p_audit_id,
            p_llm_test_result_id,
            competitor_item->>'brand',
            (competitor_item->>'position')::INTEGER,
            competitor_item->>'context',
            competitor_item->>'sentiment',
            true -- Mark as direct competitor for now
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_citation_authority(TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION store_enhanced_citations(UUID, UUID, JSONB, JSONB, JSONB) TO authenticated;