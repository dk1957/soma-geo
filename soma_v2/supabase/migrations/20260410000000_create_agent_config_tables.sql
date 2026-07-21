-- Migration: Create agent configuration tables
-- Description: Create tables for agent systems, sub-agents, and prompts management

-- Create agent_systems table
CREATE TABLE IF NOT EXISTS agent_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  codename TEXT NOT NULL UNIQUE,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agent_sub_agents table
CREATE TABLE IF NOT EXISTS agent_sub_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id UUID NOT NULL REFERENCES agent_systems(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  model TEXT,
  temperature NUMERIC(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 4096,
  skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(system_id, name)
);

-- Create agent_prompts table
CREATE TABLE IF NOT EXISTS agent_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id UUID NOT NULL REFERENCES agent_systems(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('system', 'user')),
  content TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(system_id, type)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_agent_sub_agents_system_id ON agent_sub_agents(system_id);
CREATE INDEX IF NOT EXISTS idx_agent_prompts_system_id ON agent_prompts(system_id);

-- Insert default agent systems (if they don't exist)
INSERT INTO agent_systems (name, codename, description, enabled)
VALUES 
  ('Content Agent', 'MACO', 'Multi-Agent Content Optimizer - Generates optimized content for AI search engines', true),
  ('Analysis Agent', 'ARIA', 'Analysis and Research Intelligence Agent - Analyzes brand mentions and reports', true)
ON CONFLICT (codename) DO NOTHING;

-- Create RLS policies (adjust based on your auth setup)
-- Note: Update these policies to match your authentication structure
ALTER TABLE agent_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sub_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_prompts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read agent systems and related data
CREATE POLICY "Allow authenticated users to read agent systems"
  ON agent_systems FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read sub-agents"
  ON agent_sub_agents FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read prompts"
  ON agent_prompts FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow admins to update (implement admin checking in application)
CREATE POLICY "Allow authenticated users to update agent systems"
  ON agent_systems FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update sub-agents"
  ON agent_sub_agents FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update prompts"
  ON agent_prompts FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert sub-agents"
  ON agent_sub_agents FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert prompts"
  ON agent_prompts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
