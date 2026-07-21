-- Migration: Per-sub-agent prompts and skill flags
-- ================================================
-- Stores individual system/user prompts for each sub-agent
-- and per-sub-agent skill feature flags.
--
-- Sub-agent prompts use existing system_prompts table with
-- prompt_type = 'sub_agent_{sub_agent_id}' (e.g. 'sub_agent_analysis_brand_detector')
--
-- Skill flags use existing agent_skills table with a new sub_agent_id column.

BEGIN;

-- Add sub_agent_id column to agent_skills for per-sub-agent skill flags
ALTER TABLE agent_skills
  ADD COLUMN IF NOT EXISTS sub_agent_id TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Create index for looking up skills by sub-agent
CREATE INDEX IF NOT EXISTS idx_agent_skills_sub_agent_id
  ON agent_skills(sub_agent_id)
  WHERE sub_agent_id IS NOT NULL;

-- Seed per-sub-agent skill flags for the Analysis system
-- These map to the orchestrator's isSkillEnabled() checks
INSERT INTO agent_skills (agent_system, sub_agent_id, name, skill_key, description, is_enabled)
VALUES
  -- Brand Detector skills
  ('analysis', 'analysis_brand_detector', 'Brand Mention Detection', 'brand_mention_detection', 'Detect explicit and implicit brand mentions in LLM responses', true),
  ('analysis', 'analysis_brand_detector', 'Competitive Positioning', 'competitive_positioning', 'Analyze relative brand positioning and ranking', true),
  -- Sentiment Analyzer skills
  ('analysis', 'analysis_sentiment', 'Sentiment Classification', 'sentiment_classification', 'Classify brand sentiment from -1.0 to 1.0', true),
  -- Citation Extractor skills
  ('analysis', 'analysis_citation', 'Source Extraction', 'source_extraction', 'Extract URLs, domains, and citation references', true),
  ('analysis', 'analysis_citation', 'Source Classification', 'source_classification', 'Classify source types (owned, competitor, news, etc.)', true),
  -- Topic Extractor skills
  ('analysis', 'analysis_topic', 'Fact Extraction', 'fact_extraction', 'Extract semantic topics and themes', true),
  ('analysis', 'analysis_topic', 'Trend Analysis', 'trend_analysis', 'Identify emerging trends and patterns', true),
  -- Content Agent (MACO) sub-agent skills
  ('content', 'maco_evaluator', 'GSEO Scoring', 'gseo_scoring', 'Score content across 6 GSEO dimensions', true),
  ('content', 'maco_analyst', 'Weakness Analysis', 'weakness_analysis', 'Diagnose content performance weaknesses', true),
  ('content', 'maco_editor', 'Content Optimization', 'content_optimization', 'Implement content revisions based on analysis', true),
  ('content', 'maco_selector', 'Iteration Selection', 'iteration_selection', 'Select best performing content iteration', true)
ON CONFLICT DO NOTHING;

COMMIT;
