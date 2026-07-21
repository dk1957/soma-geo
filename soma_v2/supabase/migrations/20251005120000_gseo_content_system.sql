-- GSEO Content Creation & Optimization System
-- Based on "Beyond Keywords: Driving Generative Search Engine Optimization with Content-Centric Agents" paper
-- Migration: 20251005120000_gseo_content_system.sql

-- ========================================
-- GSEO Content Table
-- ========================================
CREATE TABLE IF NOT EXISTS gseo_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
    
    -- Content metadata
    title TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('article', 'blog_post', 'whitepaper', 'guide', 'case_study', 'faq', 'landing_page')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'optimizing', 'reviewing', 'approved', 'published', 'archived')),
    
    -- Original content
    original_content TEXT NOT NULL,
    original_format TEXT DEFAULT 'markdown' CHECK (original_format IN ('markdown', 'html', 'plain_text')),
    
    -- Current optimized version
    optimized_content TEXT,
    optimization_version INTEGER DEFAULT 0,
    
    -- Source information
    source_type TEXT CHECK (source_type IN ('manual', 'upload', 'url', 'generated')),
    source_url TEXT,
    source_file_name TEXT,
    source_materials JSONB DEFAULT '[]', -- Array of docs, urls, pdfs used
    
    -- Guidelines for optimization
    target_audience TEXT,
    content_goals TEXT[] DEFAULT '{}',
    brand_voice JSONB DEFAULT '{}', -- {tone, style_guidelines, key_messages, avoid_terms}
    target_keywords TEXT[] DEFAULT '{}',
    target_platforms TEXT[] DEFAULT '{}', -- ['chatgpt', 'claude', 'gemini', 'perplexity']
    
    -- Optimization settings
    optimization_strategy TEXT DEFAULT 'comprehensive' CHECK (optimization_strategy IN ('conservative', 'balanced', 'aggressive', 'comprehensive')),
    max_iterations INTEGER DEFAULT 10,
    current_iteration INTEGER DEFAULT 0,
    
    -- Best version selection
    selected_version_id UUID, -- Reference to gseo_optimization_history
    selection_reason TEXT,
    
    -- Publishing
    published_url TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- GSEO Optimization History
-- ========================================
CREATE TABLE IF NOT EXISTS gseo_optimization_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID REFERENCES gseo_content(id) ON DELETE CASCADE,
    
    -- Version tracking
    version_number INTEGER NOT NULL,
    iteration_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Content for this version
    content_text TEXT NOT NULL,
    content_format TEXT DEFAULT 'markdown',
    
    -- Changes made
    change_summary TEXT,
    change_rationale TEXT,
    agent_suggestions TEXT[], -- Suggestions that led to this version
    modifications_applied JSONB DEFAULT '{}', -- Detailed change log
    
    -- Agent responsible
    optimizing_agent TEXT CHECK (optimizing_agent IN ('analyst', 'editor', 'manual', 'baseline')),
    baseline_method TEXT, -- If using baseline: 'fluent', 'technical_terms', etc.
    
    -- Quality before/after
    pre_optimization_score DECIMAL(5,2),
    post_optimization_score DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- GSEO Benchmarks
-- ========================================
CREATE TABLE IF NOT EXISTS gseo_benchmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID REFERENCES gseo_content(id) ON DELETE CASCADE,
    
    -- Query information
    query_text TEXT NOT NULL,
    query_intent TEXT CHECK (query_intent IN ('learning', 'research', 'entertainment', 'comparison', 'purchase')),
    answer_type TEXT CHECK (answer_type IN ('fact', 'explanation', 'list', 'comparison', 'guide')),
    
    -- Retrieval context
    retrieved_documents JSONB DEFAULT '[]', -- URLs and snippets of retrieved docs
    document_count INTEGER DEFAULT 0,
    source_rank_position INTEGER, -- Where our content ranks in retrieval
    
    -- Expected keywords/topics
    expected_topics TEXT[] DEFAULT '{}',
    expected_entities TEXT[] DEFAULT '{}',
    
    -- Generation settings
    generation_platform TEXT DEFAULT 'chatgpt' CHECK (generation_platform IN ('chatgpt', 'claude', 'gemini', 'perplexity', 'llama')),
    generation_model TEXT,
    generation_temperature DECIMAL(3,2) DEFAULT 0.7,
    
    -- Quality metrics
    relevance_score DECIMAL(3,1), -- How relevant is this query to the content?
    difficulty_score DECIMAL(3,1), -- How hard to rank for this query?
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- GSEO Evaluations
-- ========================================
CREATE TABLE IF NOT EXISTS gseo_evaluations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID REFERENCES gseo_content(id) ON DELETE CASCADE,
    history_id UUID REFERENCES gseo_optimization_history(id) ON DELETE CASCADE,
    benchmark_id UUID REFERENCES gseo_benchmarks(id) ON DELETE CASCADE,
    
    -- Evaluation timestamp
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    evaluator_model TEXT, -- LLM model used for evaluation
    
    -- Six core dimensions (scores 0-10)
    -- Attribution Mechanics
    citation_prominence DECIMAL(3,1) DEFAULT 0, -- CP: Is source credited visibly?
    citation_prominence_justification TEXT,
    
    -- Content Fidelity
    attribution_accuracy DECIMAL(3,1) DEFAULT 0, -- AA: Are citations accurate?
    attribution_accuracy_justification TEXT,
    
    faithfulness DECIMAL(3,1) DEFAULT 0, -- FA: Is original meaning preserved?
    faithfulness_justification TEXT,
    
    -- Semantic Dominance
    key_info_coverage DECIMAL(3,1) DEFAULT 0, -- KC: Are key facts included?
    key_info_coverage_justification TEXT,
    
    semantic_contribution DECIMAL(3,1) DEFAULT 0, -- SC: How much did source shape answer?
    semantic_contribution_justification TEXT,
    
    answer_dominance DECIMAL(3,1) DEFAULT 0, -- AD: Overall influence on final answer?
    answer_dominance_justification TEXT,
    
    -- Aggregate scores
    overall_score DECIMAL(5,2), -- Average of all dimensions
    attribution_mechanics_score DECIMAL(4,2), -- CP average
    content_fidelity_score DECIMAL(4,2), -- (AA + FA) / 2
    semantic_dominance_score DECIMAL(4,2), -- (KC + SC + AD) / 3
    
    -- Generated answer for this evaluation
    generated_answer TEXT,
    sources_cited JSONB DEFAULT '[]', -- Array of all sources cited in answer
    
    -- Performance against benchmark
    query_text TEXT, -- From benchmark
    retrieval_context JSONB DEFAULT '[]', -- Documents retrieved for this query
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- GSEO Benchmarks
-- ========================================
CREATE TABLE IF NOT EXISTS gseo_benchmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID REFERENCES gseo_content(id) ON DELETE CASCADE,
    
    -- Query information
    query_text TEXT NOT NULL,
    query_intent TEXT CHECK (query_intent IN ('learning', 'research', 'entertainment', 'comparison', 'purchase')),
    answer_type TEXT CHECK (answer_type IN ('fact', 'explanation', 'list', 'comparison', 'guide')),
    
    -- Retrieval context
    retrieved_documents JSONB DEFAULT '[]', -- URLs and snippets of retrieved docs
    document_count INTEGER DEFAULT 0,
    source_rank_position INTEGER, -- Where our content ranks in retrieval
    
    -- Expected keywords/topics
    expected_topics TEXT[] DEFAULT '{}',
    expected_entities TEXT[] DEFAULT '{}',
    
    -- Generation settings
    generation_platform TEXT DEFAULT 'chatgpt' CHECK (generation_platform IN ('chatgpt', 'claude', 'gemini', 'perplexity', 'llama')),
    generation_model TEXT,
    generation_temperature DECIMAL(3,2) DEFAULT 0.7,
    
    -- Quality metrics
    relevance_score DECIMAL(3,1), -- How relevant is this query to the content?
    difficulty_score DECIMAL(3,1), -- How hard to rank for this query?
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- GSEO Optimization Sessions
-- ========================================
CREATE TABLE IF NOT EXISTS gseo_optimization_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID REFERENCES gseo_content(id) ON DELETE CASCADE,
    
    -- Session metadata
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    session_status TEXT DEFAULT 'active' CHECK (session_status IN ('active', 'completed', 'paused', 'failed')),
    
    -- Agent coordination
    active_agent TEXT, -- Current agent working
    agent_workflow TEXT[] DEFAULT '{}', -- Sequence of agent actions
    
    -- Iteration tracking
    current_iteration INTEGER DEFAULT 0,
    max_iterations INTEGER DEFAULT 10,
    iteration_log JSONB DEFAULT '[]', -- Detailed log of each iteration
    
    -- Performance tracking
    initial_score DECIMAL(5,2),
    current_score DECIMAL(5,2),
    best_score DECIMAL(5,2),
    best_version_id UUID REFERENCES gseo_optimization_history(id),
    
    -- Convergence tracking
    score_improvements DECIMAL(5,2)[] DEFAULT '{}',
    plateau_detected BOOLEAN DEFAULT FALSE,
    plateau_iterations INTEGER DEFAULT 0,
    
    -- Resource usage
    total_llm_calls INTEGER DEFAULT 0,
    total_tokens_used INTEGER DEFAULT 0,
    total_cost DECIMAL(10,6) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- Indexes for Performance
-- ========================================
CREATE INDEX IF NOT EXISTS idx_gseo_content_brand_id ON gseo_content(brand_id);
CREATE INDEX IF NOT EXISTS idx_gseo_content_user_id ON gseo_content(user_id);
CREATE INDEX IF NOT EXISTS idx_gseo_content_status ON gseo_content(status);
CREATE INDEX IF NOT EXISTS idx_gseo_content_created_at ON gseo_content(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gseo_history_content_id ON gseo_optimization_history(content_id);
CREATE INDEX IF NOT EXISTS idx_gseo_history_version ON gseo_optimization_history(version_number);

CREATE INDEX IF NOT EXISTS idx_gseo_eval_content_id ON gseo_evaluations(content_id);
CREATE INDEX IF NOT EXISTS idx_gseo_eval_history_id ON gseo_evaluations(history_id);
CREATE INDEX IF NOT EXISTS idx_gseo_eval_benchmark_id ON gseo_evaluations(benchmark_id);
CREATE INDEX IF NOT EXISTS idx_gseo_eval_overall_score ON gseo_evaluations(overall_score DESC);

CREATE INDEX IF NOT EXISTS idx_gseo_bench_content_id ON gseo_benchmarks(content_id);
CREATE INDEX IF NOT EXISTS idx_gseo_bench_platform ON gseo_benchmarks(generation_platform);

CREATE INDEX IF NOT EXISTS idx_gseo_sessions_content_id ON gseo_optimization_sessions(content_id);
CREATE INDEX IF NOT EXISTS idx_gseo_sessions_status ON gseo_optimization_sessions(session_status);

-- ========================================
-- Row Level Security (RLS) Policies
-- ========================================
ALTER TABLE gseo_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE gseo_optimization_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE gseo_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gseo_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE gseo_optimization_sessions ENABLE ROW LEVEL SECURITY;

-- GSEO Content Policies
CREATE POLICY "Users can view content for their brands" ON gseo_content
    FOR SELECT USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

CREATE POLICY "Users can create content for their brands" ON gseo_content
    FOR INSERT WITH CHECK (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

CREATE POLICY "Users can update content for their brands" ON gseo_content
    FOR UPDATE USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

CREATE POLICY "Users can delete content for their brands" ON gseo_content
    FOR DELETE USING (
        brand_id IN (
            SELECT b.id FROM brands b
            JOIN accounts a ON b.account_id = a.id
            JOIN account_users au ON a.id = au.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

-- Optimization History Policies
CREATE POLICY "Users can view optimization history for their content" ON gseo_optimization_history
    FOR SELECT USING (
        content_id IN (
            SELECT id FROM gseo_content
            WHERE brand_id IN (
                SELECT b.id FROM brands b
                JOIN accounts a ON b.account_id = a.id
                JOIN account_users au ON a.id = au.account_id
                WHERE au.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "System can insert optimization history" ON gseo_optimization_history
    FOR INSERT WITH CHECK (true);

-- Evaluation Policies
CREATE POLICY "Users can view evaluations for their content" ON gseo_evaluations
    FOR SELECT USING (
        content_id IN (
            SELECT id FROM gseo_content
            WHERE brand_id IN (
                SELECT b.id FROM brands b
                JOIN accounts a ON b.account_id = a.id
                JOIN account_users au ON a.id = au.account_id
                WHERE au.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "System can insert evaluations" ON gseo_evaluations
    FOR INSERT WITH CHECK (true);

-- Benchmark Policies
CREATE POLICY "Users can view benchmarks for their content" ON gseo_benchmarks
    FOR SELECT USING (
        content_id IN (
            SELECT id FROM gseo_content
            WHERE brand_id IN (
                SELECT b.id FROM brands b
                JOIN accounts a ON b.account_id = a.id
                JOIN account_users au ON a.id = au.account_id
                WHERE au.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "System can manage benchmarks" ON gseo_benchmarks
    FOR ALL USING (true);

-- Session Policies
CREATE POLICY "Users can view sessions for their content" ON gseo_optimization_sessions
    FOR SELECT USING (
        content_id IN (
            SELECT id FROM gseo_content
            WHERE brand_id IN (
                SELECT b.id FROM brands b
                JOIN accounts a ON b.account_id = a.id
                JOIN account_users au ON a.id = au.account_id
                WHERE au.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "System can manage sessions" ON gseo_optimization_sessions
    FOR ALL USING (true);

-- ========================================
-- Helper Functions
-- ========================================

-- Calculate Mean Influence Score (MIS) for a content piece
CREATE OR REPLACE FUNCTION calculate_mis(p_content_id UUID, p_dimension TEXT)
RETURNS DECIMAL(4,2) AS $$
DECLARE
    v_score DECIMAL(4,2);
BEGIN
    SELECT AVG(
        CASE p_dimension
            WHEN 'cp' THEN citation_prominence
            WHEN 'aa' THEN attribution_accuracy
            WHEN 'fa' THEN faithfulness
            WHEN 'kc' THEN key_info_coverage
            WHEN 'sc' THEN semantic_contribution
            WHEN 'ad' THEN answer_dominance
            WHEN 'overall' THEN overall_score
            ELSE 0
        END
    )
    INTO v_score
    FROM gseo_evaluations
    WHERE content_id = p_content_id;
    
    RETURN COALESCE(v_score, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate Influence Success Rate (ISR) for a content piece
CREATE OR REPLACE FUNCTION calculate_isr(p_content_id UUID, p_dimension TEXT, p_threshold DECIMAL DEFAULT 7.0)
RETURNS DECIMAL(4,2) AS $$
DECLARE
    v_total INTEGER;
    v_success INTEGER;
    v_rate DECIMAL(4,2);
BEGIN
    SELECT COUNT(*) INTO v_total
    FROM gseo_evaluations
    WHERE content_id = p_content_id;
    
    IF v_total = 0 THEN
        RETURN 0;
    END IF;
    
    SELECT COUNT(*) INTO v_success
    FROM gseo_evaluations
    WHERE content_id = p_content_id
    AND (
        CASE p_dimension
            WHEN 'cp' THEN citation_prominence >= p_threshold
            WHEN 'aa' THEN attribution_accuracy >= p_threshold
            WHEN 'fa' THEN faithfulness >= p_threshold
            WHEN 'kc' THEN key_info_coverage >= p_threshold
            WHEN 'sc' THEN semantic_contribution >= p_threshold
            WHEN 'ad' THEN answer_dominance >= p_threshold
            WHEN 'overall' THEN overall_score >= p_threshold
            ELSE FALSE
        END
    );
    
    v_rate := (v_success::DECIMAL / v_total::DECIMAL) * 100;
    RETURN v_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get optimization progress summary
CREATE OR REPLACE FUNCTION get_optimization_summary(p_content_id UUID)
RETURNS TABLE (
    total_iterations INTEGER,
    current_score DECIMAL(5,2),
    best_score DECIMAL(5,2),
    improvement_percentage DECIMAL(5,2),
    plateau_status BOOLEAN,
    estimated_completion TEXT
) AS $$
DECLARE
    v_initial_score DECIMAL(5,2);
    v_current_score DECIMAL(5,2);
    v_best_score DECIMAL(5,2);
    v_iterations INTEGER;
    v_max_iterations INTEGER;
BEGIN
    SELECT 
        s.initial_score,
        s.current_score,
        s.best_score,
        s.current_iteration,
        s.max_iterations,
        s.plateau_detected
    INTO 
        v_initial_score,
        v_current_score,
        v_best_score,
        v_iterations,
        v_max_iterations,
        plateau_status
    FROM gseo_optimization_sessions s
    WHERE s.content_id = p_content_id
    AND s.session_status = 'active'
    ORDER BY s.session_start DESC
    LIMIT 1;
    
    RETURN QUERY SELECT
        v_iterations,
        v_current_score,
        v_best_score,
        CASE 
            WHEN v_initial_score > 0 THEN
                ((v_best_score - v_initial_score) / v_initial_score) * 100
            ELSE 0
        END,
        plateau_status,
        CASE
            WHEN v_iterations >= v_max_iterations THEN 'Completed'
            WHEN plateau_status THEN 'Plateaued - May complete early'
            ELSE CONCAT('~', (v_max_iterations - v_iterations)::TEXT, ' iterations remaining')
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Comments for Documentation
-- ========================================
COMMENT ON TABLE gseo_content IS 'Main content pieces being optimized for generative search engines';
COMMENT ON TABLE gseo_optimization_history IS 'Version history of content optimizations with agent actions';
COMMENT ON TABLE gseo_evaluations IS 'Multi-dimensional evaluations of content influence on AI-generated answers';
COMMENT ON TABLE gseo_benchmarks IS 'Query-content pairs for content-centric evaluation';
COMMENT ON TABLE gseo_optimization_sessions IS 'Active optimization sessions tracking agent workflows and progress';

COMMENT ON COLUMN gseo_evaluations.citation_prominence IS 'CP: Visibility and clarity of citation (0-10)';
COMMENT ON COLUMN gseo_evaluations.attribution_accuracy IS 'AA: Accuracy of attributed claims (0-10)';
COMMENT ON COLUMN gseo_evaluations.faithfulness IS 'FA: Preservation of original meaning (0-10)';
COMMENT ON COLUMN gseo_evaluations.key_info_coverage IS 'KC: Coverage of key information points (0-10)';
COMMENT ON COLUMN gseo_evaluations.semantic_contribution IS 'SC: Transfer of core ideas to answer (0-10)';
COMMENT ON COLUMN gseo_evaluations.answer_dominance IS 'AD: Overall influence on final answer (0-10)';
