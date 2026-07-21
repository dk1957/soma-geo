-- Fix Brand Contexts RLS Policies
-- Created: 2025-09-03
-- Purpose: Fix RLS policy violations for brand_contexts table and ensure proper data isolation

-- First, check if brand_contexts table exists and create it if not
CREATE TABLE IF NOT EXISTS brand_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL,
  context_text TEXT NOT NULL,
  similarity_score FLOAT,
  metadata JSONB DEFAULT '{}',
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on brand_contexts if not already enabled
ALTER TABLE brand_contexts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can access brand contexts from their accounts" ON brand_contexts;
DROP POLICY IF EXISTS "Service can access all brand contexts" ON brand_contexts;

-- Add account_id, brand_id and user_id columns to brand_contexts if they don't exist
-- This must be done BEFORE creating policies that use these columns.
ALTER TABLE brand_contexts 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create comprehensive RLS policy for brand_contexts
CREATE POLICY "Users can access brand contexts from their accounts" ON brand_contexts
    FOR ALL USING (
        -- Direct user ownership
        auth.uid() = user_id
        OR
        -- Account membership
        account_id IS NOT NULL AND account_id IN (
            SELECT account_id FROM account_users WHERE user_id = auth.uid() AND is_active = true
        )
        OR
        -- Brand ownership through account
        brand_id IS NOT NULL AND brand_id IN (
            SELECT b.id FROM brands b
            JOIN account_users au ON au.account_id = b.account_id
            WHERE au.user_id = auth.uid() AND au.is_active = true
        )
    );

-- Service role policy for brand_contexts
CREATE POLICY "Service can access all brand contexts" ON brand_contexts
    FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_brand_contexts_account_id ON brand_contexts(account_id);
CREATE INDEX IF NOT EXISTS idx_brand_contexts_brand_id ON brand_contexts(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_contexts_brand_name ON brand_contexts(brand_name);
CREATE INDEX IF NOT EXISTS idx_brand_contexts_user_id ON brand_contexts(user_id);

-- Grant necessary permissions
GRANT ALL ON brand_contexts TO service_role;
GRANT ALL ON brand_contexts TO authenticated;

-- Also fix any missing RLS policies for related tables
-- Ensure citations table has proper RLS
CREATE TABLE IF NOT EXISTS citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID REFERENCES llm_responses(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  url TEXT,
  excerpt TEXT,
  relevance_score FLOAT,
  metadata JSONB DEFAULT '{}',
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on citations
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;

-- Add account_id to citations if not exists
ALTER TABLE citations ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;

-- Drop and recreate citations policies
DROP POLICY IF EXISTS "Users can access citations from their accounts" ON citations;
DROP POLICY IF EXISTS "Service can access all citations" ON citations;

CREATE POLICY "Users can access citations from their accounts" ON citations
    FOR ALL USING (
        account_id IS NOT NULL AND account_id IN (
            SELECT account_id FROM account_users WHERE user_id = auth.uid() AND is_active = true
        )
        OR
        response_id IN (
            SELECT lr.id FROM llm_responses lr
            JOIN llm_simulations ls ON ls.id = lr.simulation_id
            WHERE ls.account_id IN (
                SELECT account_id FROM account_users WHERE user_id = auth.uid() AND is_active = true
            )
        )
    );

CREATE POLICY "Service can access all citations" ON citations
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions for citations
GRANT ALL ON citations TO service_role;
GRANT ALL ON citations TO authenticated;

-- Create indexes for citations
CREATE INDEX IF NOT EXISTS idx_citations_account_id ON citations(account_id);
CREATE INDEX IF NOT EXISTS idx_citations_response_id ON citations(response_id);

-- Ensure all tables have updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers if they don't exist
DROP TRIGGER IF EXISTS update_brand_contexts_updated_at ON brand_contexts;
CREATE TRIGGER update_brand_contexts_updated_at
    BEFORE UPDATE ON brand_contexts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();