-- Create onboarding_audits table to store comprehensive audit data
CREATE TABLE IF NOT EXISTS onboarding_audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name TEXT NOT NULL,
  website TEXT,
  target_markets TEXT[],
  industry TEXT,
  audit_results JSONB NOT NULL,
  extracted_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create competitors table for structured competitor data
CREATE TABLE IF NOT EXISTS competitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID REFERENCES onboarding_audits(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  ldi_score DECIMAL(5,2),
  mentions INTEGER DEFAULT 0,
  market_share DECIMAL(5,2),
  industry TEXT,
  strengths TEXT[],
  weaknesses TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mentions table for AI platform mentions
CREATE TABLE IF NOT EXISTS ai_mentions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID REFERENCES onboarding_audits(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- chatgpt, claude, gemini, perplexity
  mention_text TEXT NOT NULL,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  source_url TEXT,
  citation_quality TEXT CHECK (citation_quality IN ('primary', 'secondary', 'tertiary')),
  visibility_rank INTEGER,
  mentioned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rankings table for query performance tracking
CREATE TABLE IF NOT EXISTS ai_rankings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID REFERENCES onboarding_audits(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  query TEXT NOT NULL,
  position INTEGER,
  ldi_score DECIMAL(5,2),
  competitors_ahead INTEGER DEFAULT 0,
  improvement_opportunity TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sources table for citation source analysis
CREATE TABLE IF NOT EXISTS citation_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID REFERENCES onboarding_audits(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  title TEXT,
  url TEXT,
  authority_score DECIMAL(5,2),
  citation_count INTEGER DEFAULT 0,
  platforms TEXT[], -- which AI platforms cite this source
  content_type TEXT, -- article, news, review, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create opportunities table for optimization recommendations
CREATE TABLE IF NOT EXISTS optimization_opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID REFERENCES onboarding_audits(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- content_gap, competitor_gap, optimization
  description TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  impact_score DECIMAL(5,2),
  effort_required TEXT CHECK (effort_required IN ('low', 'medium', 'high')),
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_audits_brand_name ON onboarding_audits(brand_name);
CREATE INDEX IF NOT EXISTS idx_onboarding_audits_created_at ON onboarding_audits(created_at);
CREATE INDEX IF NOT EXISTS idx_competitors_audit_id ON competitors(audit_id);
CREATE INDEX IF NOT EXISTS idx_mentions_audit_id ON ai_mentions(audit_id);
CREATE INDEX IF NOT EXISTS idx_mentions_platform ON ai_mentions(platform);
CREATE INDEX IF NOT EXISTS idx_rankings_audit_id ON ai_rankings(audit_id);
CREATE INDEX IF NOT EXISTS idx_rankings_platform ON ai_rankings(platform);
CREATE INDEX IF NOT EXISTS idx_sources_audit_id ON citation_sources(audit_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_audit_id ON optimization_opportunities(audit_id);

-- Enable RLS (Row Level Security)
ALTER TABLE onboarding_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE citation_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_opportunities ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated access
CREATE POLICY "Users can view their own audit data" ON onboarding_audits
  FOR SELECT USING (true); -- For now, allow all authenticated users

CREATE POLICY "Users can insert audit data" ON onboarding_audits
  FOR INSERT WITH CHECK (true);

-- Policies for related tables
CREATE POLICY "Users can view competitors" ON competitors
  FOR SELECT USING (true);

CREATE POLICY "Users can insert competitors" ON competitors
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view mentions" ON ai_mentions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert mentions" ON ai_mentions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view rankings" ON ai_rankings
  FOR SELECT USING (true);

CREATE POLICY "Users can insert rankings" ON ai_rankings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view sources" ON citation_sources
  FOR SELECT USING (true);

CREATE POLICY "Users can insert sources" ON citation_sources
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view opportunities" ON optimization_opportunities
  FOR SELECT USING (true);

CREATE POLICY "Users can insert opportunities" ON optimization_opportunities
  FOR INSERT WITH CHECK (true);