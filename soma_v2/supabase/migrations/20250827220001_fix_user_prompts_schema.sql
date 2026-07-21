-- Drop the existing user_prompts table and recreate with correct schema
DROP TABLE IF EXISTS user_prompts CASCADE;

-- Create table for storing user-generated or AI-generated prompts
CREATE TABLE user_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    prompt_id VARCHAR(255) NOT NULL,
    prompt_text TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    priority INTEGER NOT NULL DEFAULT 1,
    rationale TEXT,
    is_selected BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_prompts_account_id ON user_prompts(account_id);
CREATE INDEX idx_user_prompts_selected ON user_prompts(account_id, is_selected);
CREATE INDEX idx_user_prompts_category ON user_prompts(account_id, category);

-- Set up RLS (Row Level Security)
ALTER TABLE user_prompts ENABLE ROW LEVEL SECURITY;

-- Create policies for user_prompts following the existing pattern
CREATE POLICY "Users can view prompts for their accounts" ON user_prompts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM account_users 
            WHERE account_users.account_id = user_prompts.account_id 
            AND account_users.user_id = auth.uid() 
            AND account_users.is_active = true
        )
    );

CREATE POLICY "Users can insert prompts for their accounts" ON user_prompts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM account_users 
            WHERE account_users.account_id = user_prompts.account_id 
            AND account_users.user_id = auth.uid() 
            AND account_users.is_active = true
        )
    );

CREATE POLICY "Users can update prompts for their accounts" ON user_prompts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM account_users 
            WHERE account_users.account_id = user_prompts.account_id 
            AND account_users.user_id = auth.uid() 
            AND account_users.is_active = true
        )
    );

CREATE POLICY "Users can delete prompts for their accounts" ON user_prompts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM account_users 
            WHERE account_users.account_id = user_prompts.account_id 
            AND account_users.user_id = auth.uid() 
            AND account_users.is_active = true
        )
    );

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_prompts_updated_at 
    BEFORE UPDATE ON user_prompts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();