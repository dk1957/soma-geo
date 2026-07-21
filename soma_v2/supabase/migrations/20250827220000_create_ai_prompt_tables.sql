-- Create table for storing user-generated or AI-generated prompts
CREATE TABLE user_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt_id VARCHAR(255) NOT NULL,
    prompt_text TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    priority INTEGER NOT NULL DEFAULT 1,
    rationale TEXT,
    is_selected BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for storing LLM responses
CREATE TABLE llm_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt_id VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    prompt_text TEXT NOT NULL,
    response_text TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    analysis JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for storing SEO insights and research data
CREATE TABLE seo_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    source VARCHAR(100) NOT NULL,
    priority INTEGER NOT NULL DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    is_processed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_prompts_user_id ON user_prompts(user_id);
CREATE INDEX idx_user_prompts_selected ON user_prompts(user_id, is_selected);
CREATE INDEX idx_llm_responses_user_id ON llm_responses(user_id);
CREATE INDEX idx_llm_responses_provider ON llm_responses(provider);
CREATE INDEX idx_seo_insights_user_id ON seo_insights(user_id);
CREATE INDEX idx_seo_insights_type ON seo_insights(insight_type);

-- Set up RLS (Row Level Security)
ALTER TABLE user_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_insights ENABLE ROW LEVEL SECURITY;

-- Create policies for user_prompts
CREATE POLICY "Users can view their own prompts" ON user_prompts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompts" ON user_prompts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompts" ON user_prompts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompts" ON user_prompts
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for llm_responses
CREATE POLICY "Users can view their own responses" ON llm_responses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert responses" ON llm_responses
    FOR INSERT WITH CHECK (true);

-- Create policies for seo_insights
CREATE POLICY "Users can view their own insights" ON seo_insights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert insights" ON seo_insights
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service can update insights" ON seo_insights
    FOR UPDATE USING (true);