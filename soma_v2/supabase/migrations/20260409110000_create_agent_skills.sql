-- Create agent_skills table for editable agent capabilities
-- Skills are capabilities that can be enabled/disabled per agent system

BEGIN;

CREATE TABLE IF NOT EXISTS public.agent_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_system text NOT NULL,         -- 'content' or 'analysis'
  skill_key text NOT NULL,            -- unique key within system
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_system, skill_key)
);

CREATE INDEX IF NOT EXISTS idx_agent_skills_system ON public.agent_skills(agent_system);

-- RLS
ALTER TABLE public.agent_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for agent skills"
  ON public.agent_skills FOR SELECT USING (true);

CREATE POLICY "Service role full access to agent skills"
  ON public.agent_skills FOR ALL USING (auth.role() = 'service_role');

-- Seed: Content Agent (MACO) skills
INSERT INTO agent_skills (agent_system, skill_key, name, description, is_enabled, sort_order) VALUES
  ('content', 'benchmark_query_gen', 'Benchmark Query Generation', 'Generates diverse evaluation queries from content context to test AI visibility across different search intents.', true, 1),
  ('content', 'rag_simulation', 'RAG Simulation', 'Simulates how AI search engines retrieve, process, and synthesize content into generated answers.', true, 2),
  ('content', 'six_dim_eval', '6-Dimension Evaluation', 'Scores content on citation prominence, attribution accuracy, faithfulness, key info coverage, semantic contribution, and answer dominance.', true, 3),
  ('content', 'weakness_diagnosis', 'Weakness Diagnosis', 'Identifies specific content areas that underperform in AI responses and diagnoses root causes.', true, 4),
  ('content', 'surgical_editing', 'Surgical Content Editing', 'Applies targeted edits that address specific weaknesses while preserving overall content integrity and brand voice.', true, 5),
  ('content', 'trajectory_analysis', 'Trajectory Analysis', 'Analyzes optimization history across iterations to detect plateaus, convergence, and select optimal versions.', true, 6)
ON CONFLICT (agent_system, skill_key) DO NOTHING;

-- Seed: Analysis Agent (ARIA) skills
INSERT INTO agent_skills (agent_system, skill_key, name, description, is_enabled, sort_order) VALUES
  ('analysis', 'brand_mention_detection', 'Brand Mention Detection', 'Identifies explicit brand name references and implicit mentions (product names, slogans, unique terms) across LLM responses.', true, 1),
  ('analysis', 'sentiment_classification', 'Sentiment Classification', 'Classifies sentiment toward each mentioned brand as positive, neutral, or negative with confidence scores.', true, 2),
  ('analysis', 'source_extraction', 'Source & Citation Extraction', 'Extracts URLs, publication names, author references, and citation contexts from AI-generated responses.', true, 3),
  ('analysis', 'competitive_positioning', 'Competitive Position Mapping', 'Maps where the target brand appears relative to competitors — first mentioned, recommended, compared, or footnoted.', true, 4),
  ('analysis', 'fact_extraction', 'Fact & Claim Extraction', 'Extracts verifiable facts, statistics, pricing claims, and key data points for ground truth comparison.', true, 5),
  ('analysis', 'visibility_scoring', 'Visibility Score Calculation', 'Calculates composite visibility metrics including mention frequency, position weighting, sentiment impact, and share-of-voice.', true, 6),
  ('analysis', 'quality_assessment', 'Response Quality Assessment', 'Evaluates response completeness, factual accuracy, source diversity, and relevance to the original query.', true, 7),
  ('analysis', 'trend_analysis', 'Trend Analysis', 'Detects patterns across multiple responses over time — improving/declining visibility, model-specific biases, seasonal shifts.', true, 8)
ON CONFLICT (agent_system, skill_key) DO NOTHING;

COMMIT;
