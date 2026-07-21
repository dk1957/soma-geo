-- =====================================================
-- ENHANCED SCHEMA FOR VisiAI PRO - PRD REQUIREMENTS
-- =====================================================

-- Add EMEA-specific locales and locale support
CREATE TYPE public.locale_code AS ENUM (
  'en-GB', 'en-ZA', 'fr-FR', 'fr-MA', 'de-DE', 'it-IT', 
  'es-ES', 'nl-NL', 'sv-SE', 'no-NO', 'ar-AE', 'ar-SA', 
  'he-IL', 'tr-TR', 'en-US'
);

-- Add industry categories
CREATE TYPE public.industry_type AS ENUM (
  'technology', 'healthcare', 'finance', 'retail', 'manufacturing',
  'automotive', 'real_estate', 'education', 'media', 'consulting',
  'legal', 'hospitality', 'energy', 'agriculture', 'other'
);

-- Add LLM platforms
CREATE TYPE public.llm_platform AS ENUM (
  'chatgpt', 'claude', 'perplexity', 'gemini', 'copilot', 'blended'
);

-- Enhance brands table with locale and EMEA support
ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS locales locale_code[] DEFAULT '{"en-GB"}',
ADD COLUMN IF NOT EXISTS target_markets text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS industry_category industry_type,
ADD COLUMN IF NOT EXISTS entity_aliases text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Europe/London',
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS business_model text CHECK (business_model IN ('b2b', 'b2c', 'b2b2c', 'marketplace')),
ADD COLUMN IF NOT EXISTS company_size text CHECK (company_size IN ('startup', 'small', 'medium', 'large', 'enterprise'));

-- Products table for brand products/services
CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  sku text,
  name text NOT NULL,
  description text,
  category text,
  price_range text,
  locale locale_code NOT NULL DEFAULT 'en-GB',
  target_markets text[] DEFAULT '{}',
  keywords text[] DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(brand_id, sku, locale)
);

-- Knowledge graph entities for semantic understanding
CREATE TABLE IF NOT EXISTS public.knowledge_entities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('brand', 'product', 'topic', 'person', 'organization', 'location')),
  name text NOT NULL,
  canonical_name text NOT NULL,
  synonyms text[] DEFAULT '{}',
  aliases text[] DEFAULT '{}',
  locales locale_code[] DEFAULT '{"en-GB"}',
  confidence_score decimal DEFAULT 1.0,
  embedding vector(1536),
  metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Knowledge graph relations
CREATE TABLE IF NOT EXISTS public.knowledge_relations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_entity_id uuid NOT NULL REFERENCES public.knowledge_entities(id) ON DELETE CASCADE,
  to_entity_id uuid NOT NULL REFERENCES public.knowledge_entities(id) ON DELETE CASCADE,
  relation_type text NOT NULL CHECK (relation_type IN ('competes_with', 'mentions', 'belongs_to', 'similar_to', 'part_of', 'owns')),
  strength decimal DEFAULT 1.0,
  confidence decimal DEFAULT 1.0,
  locale locale_code,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(from_entity_id, to_entity_id, relation_type, locale)
);

-- Enhanced query bank with locales and weighting
CREATE TABLE IF NOT EXISTS public.query_bank (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  text text NOT NULL,
  locale locale_code NOT NULL DEFAULT 'en-GB',
  category text,
  intent_type text CHECK (intent_type IN ('informational', 'navigational', 'transactional', 'commercial')),
  weight decimal DEFAULT 1.0,
  topic text,
  industry industry_type,
  custom boolean DEFAULT false,
  search_volume integer,
  difficulty_score decimal,
  seasonal_pattern jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(account_id, text, locale)
);

-- LDI (LLM Discoverability Index) snapshots for tracking
CREATE TABLE IF NOT EXISTS public.ldi_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  locale locale_code NOT NULL DEFAULT 'en-GB',
  platform llm_platform NOT NULL DEFAULT 'blended',
  score decimal NOT NULL,
  coverage_score decimal,
  position_score decimal,
  citation_score decimal,
  answer_presence_score decimal,
  queries_tested integer NOT NULL,
  queries_found integer NOT NULL,
  metadata jsonb DEFAULT '{}',
  recorded_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enhanced mentions table with locale and sentiment
ALTER TABLE public.mentions 
ADD COLUMN IF NOT EXISTS locale locale_code DEFAULT 'en-GB',
ADD COLUMN IF NOT EXISTS market_region text,
ADD COLUMN IF NOT EXISTS entity_extracted jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS topics text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS influence_tier text CHECK (influence_tier IN ('micro', 'macro', 'mega', 'celebrity')),
ADD COLUMN IF NOT EXISTS engagement_rate decimal,
ADD COLUMN IF NOT EXISTS virality_score decimal;

-- Enhanced competitor analysis with locale support
ALTER TABLE public.competitors
ADD COLUMN IF NOT EXISTS target_locales locale_code[] DEFAULT '{"en-GB"}',
ADD COLUMN IF NOT EXISTS market_regions text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS business_model text,
ADD COLUMN IF NOT EXISTS estimated_revenue_range text,
ADD COLUMN IF NOT EXISTS employee_count_range text,
ADD COLUMN IF NOT EXISTS competitive_strength decimal DEFAULT 0.5;

-- Content documents for AEO and publishing
CREATE TABLE IF NOT EXISTS public.content_docs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text,
  content_type text CHECK (content_type IN ('FAQ', 'HowTo', 'Product', 'Article', 'Guide', 'Landing')),
  locale locale_code NOT NULL DEFAULT 'en-GB',
  target_keywords text[] DEFAULT '{}',
  target_queries uuid[] DEFAULT '{}',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'published', 'archived')),
  aeo_score decimal,
  readability_score decimal,
  seo_score decimal,
  structured_data jsonb DEFAULT '{}',
  meta_title text,
  meta_description text,
  slug text,
  published_url text,
  published_at timestamp with time zone,
  performance_metrics jsonb DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  reviewed_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Feed items for LLM publishing
CREATE TABLE IF NOT EXISTS public.feed_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doc_id uuid NOT NULL REFERENCES public.content_docs(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  locale locale_code NOT NULL DEFAULT 'en-GB',
  content_hash text NOT NULL,
  canonical_url text,
  chunk_index integer DEFAULT 0,
  chunk_content text NOT NULL,
  chunk_metadata jsonb DEFAULT '{}',
  license_type text DEFAULT 'all-rights-reserved',
  allow_training boolean DEFAULT false,
  allow_indexing boolean DEFAULT true,
  published_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  last_accessed timestamp with time zone,
  access_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Publishing configuration for ai.txt and sitemaps
CREATE TABLE IF NOT EXISTS public.publishing_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE,
  config_type text NOT NULL CHECK (config_type IN ('ai_txt', 'robots_txt', 'llm_sitemap', 'content_feed')),
  rules jsonb NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  last_generated timestamp with time zone,
  generation_url text,
  webhook_url text,
  auto_update boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(brand_id, site_id, config_type)
);

-- Enhanced alerts with locale and regional context
ALTER TABLE public.alerts
ADD COLUMN IF NOT EXISTS locale locale_code,
ADD COLUMN IF NOT EXISTS market_region text,
ADD COLUMN IF NOT EXISTS impact_score decimal DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS auto_resolve boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS escalation_level integer DEFAULT 1;

-- Automation workflows
CREATE TABLE IF NOT EXISTS public.automation_workflows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  workflow_type text CHECK (workflow_type IN ('monitoring', 'content_generation', 'publishing', 'optimization')),
  trigger_conditions jsonb NOT NULL DEFAULT '{}',
  actions jsonb NOT NULL DEFAULT '{}',
  schedule text, -- cron expression
  is_active boolean DEFAULT true,
  last_run timestamp with time zone,
  next_run timestamp with time zone,
  run_count integer DEFAULT 0,
  success_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ROI tracking and calculations
CREATE TABLE IF NOT EXISTS public.roi_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  metric_type text NOT NULL CHECK (metric_type IN ('ldi_improvement', 'citation_increase', 'traffic_attribution', 'conversion_attribution')),
  baseline_value decimal,
  current_value decimal,
  improvement_percentage decimal,
  attribution_confidence decimal DEFAULT 0.5,
  investment_amount decimal,
  return_amount decimal,
  roi_percentage decimal,
  time_period interval DEFAULT '30 days',
  locale locale_code DEFAULT 'en-GB',
  market_region text,
  metadata jsonb DEFAULT '{}',
  recorded_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enhanced integrations for EMEA compliance and regional services
ALTER TABLE public.integrations
ADD COLUMN IF NOT EXISTS region_specific jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS compliance_status text CHECK (compliance_status IN ('compliant', 'non_compliant', 'pending', 'unknown')),
ADD COLUMN IF NOT EXISTS data_residency text,
ADD COLUMN IF NOT EXISTS gdpr_compliant boolean DEFAULT false;

-- Opportunity scoring and tracking
CREATE TABLE IF NOT EXISTS public.opportunities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  opportunity_type text NOT NULL CHECK (opportunity_type IN ('content_gap', 'competitor_weakness', 'keyword_opportunity', 'citation_opportunity')),
  title text NOT NULL,
  description text,
  potential_impact decimal,
  effort_required text CHECK (effort_required IN ('low', 'medium', 'high')),
  priority_score decimal,
  target_locale locale_code DEFAULT 'en-GB',
  target_queries text[] DEFAULT '{}',
  competitor_context jsonb DEFAULT '{}',
  recommended_actions jsonb DEFAULT '{}',
  status text DEFAULT 'identified' CHECK (status IN ('identified', 'in_progress', 'completed', 'dismissed')),
  assigned_to uuid REFERENCES auth.users(id),
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  impact_measured jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =====================================================
-- INDEXES FOR NEW TABLES
-- =====================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_locale ON public.products(locale);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- Knowledge entities indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_brand_id ON public.knowledge_entities(brand_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_account_id ON public.knowledge_entities(account_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_type ON public.knowledge_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_name ON public.knowledge_entities(canonical_name);
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_locales ON public.knowledge_entities USING gin(locales);

-- Knowledge relations indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_relations_from ON public.knowledge_relations(from_entity_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_relations_to ON public.knowledge_relations(to_entity_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_relations_type ON public.knowledge_relations(relation_type);

-- Query bank indexes
CREATE INDEX IF NOT EXISTS idx_query_bank_account_id ON public.query_bank(account_id);
CREATE INDEX IF NOT EXISTS idx_query_bank_brand_id ON public.query_bank(brand_id);
CREATE INDEX IF NOT EXISTS idx_query_bank_locale ON public.query_bank(locale);
CREATE INDEX IF NOT EXISTS idx_query_bank_category ON public.query_bank(category);
CREATE INDEX IF NOT EXISTS idx_query_bank_text_gin ON public.query_bank USING gin(to_tsvector('english', text));

-- LDI snapshots indexes
CREATE INDEX IF NOT EXISTS idx_ldi_snapshots_brand_id ON public.ldi_snapshots(brand_id);
CREATE INDEX IF NOT EXISTS idx_ldi_snapshots_locale ON public.ldi_snapshots(locale);
CREATE INDEX IF NOT EXISTS idx_ldi_snapshots_platform ON public.ldi_snapshots(platform);
CREATE INDEX IF NOT EXISTS idx_ldi_snapshots_recorded_at ON public.ldi_snapshots(recorded_at);
CREATE INDEX IF NOT EXISTS idx_ldi_snapshots_score ON public.ldi_snapshots(score);

-- Content docs indexes
CREATE INDEX IF NOT EXISTS idx_content_docs_brand_id ON public.content_docs(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_docs_workspace_id ON public.content_docs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_content_docs_locale ON public.content_docs(locale);
CREATE INDEX IF NOT EXISTS idx_content_docs_status ON public.content_docs(status);
CREATE INDEX IF NOT EXISTS idx_content_docs_published_at ON public.content_docs(published_at);

-- Feed items indexes
CREATE INDEX IF NOT EXISTS idx_feed_items_doc_id ON public.feed_items(doc_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_brand_id ON public.feed_items(brand_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_locale ON public.feed_items(locale);
CREATE INDEX IF NOT EXISTS idx_feed_items_published_at ON public.feed_items(published_at);

-- Publishing config indexes
CREATE INDEX IF NOT EXISTS idx_publishing_config_brand_id ON public.publishing_config(brand_id);
CREATE INDEX IF NOT EXISTS idx_publishing_config_site_id ON public.publishing_config(site_id);
CREATE INDEX IF NOT EXISTS idx_publishing_config_type ON public.publishing_config(config_type);

-- Automation workflows indexes
CREATE INDEX IF NOT EXISTS idx_automation_workflows_account_id ON public.automation_workflows(account_id);
CREATE INDEX IF NOT EXISTS idx_automation_workflows_brand_id ON public.automation_workflows(brand_id);
CREATE INDEX IF NOT EXISTS idx_automation_workflows_active ON public.automation_workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_workflows_next_run ON public.automation_workflows(next_run);

-- ROI metrics indexes
CREATE INDEX IF NOT EXISTS idx_roi_metrics_brand_id ON public.roi_metrics(brand_id);
CREATE INDEX IF NOT EXISTS idx_roi_metrics_recorded_at ON public.roi_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_roi_metrics_type ON public.roi_metrics(metric_type);

-- Opportunities indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_brand_id ON public.opportunities(brand_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON public.opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_priority ON public.opportunities(priority_score);
CREATE INDEX IF NOT EXISTS idx_opportunities_assigned_to ON public.opportunities(assigned_to);

-- =====================================================
-- ROW LEVEL SECURITY FOR NEW TABLES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ldi_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roi_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Users can access products for their brands" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.brands b
      JOIN public.account_users au ON b.account_id = au.account_id
      WHERE b.id = products.brand_id 
      AND au.user_id = auth.uid()
      AND au.is_active = true
    )
  );

-- Knowledge entities policies
CREATE POLICY "Users can access knowledge entities in their accounts" ON public.knowledge_entities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.account_users au
      WHERE au.account_id = knowledge_entities.account_id 
      AND au.user_id = auth.uid()
      AND au.is_active = true
    )
  );

-- Knowledge relations policies
CREATE POLICY "Users can access knowledge relations for their entities" ON public.knowledge_relations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.knowledge_entities ke
      JOIN public.account_users au ON ke.account_id = au.account_id
      WHERE (ke.id = knowledge_relations.from_entity_id OR ke.id = knowledge_relations.to_entity_id)
      AND au.user_id = auth.uid()
      AND au.is_active = true
    )
  );

-- Query bank policies
CREATE POLICY "Users can access query bank in their accounts" ON public.query_bank
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.account_users au
      WHERE au.account_id = query_bank.account_id 
      AND au.user_id = auth.uid()
      AND au.is_active = true
    )
  );

-- LDI snapshots policies
CREATE POLICY "Users can access LDI snapshots for their brands" ON public.ldi_snapshots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.brands b
      JOIN public.account_users au ON b.account_id = au.account_id
      WHERE b.id = ldi_snapshots.brand_id 
      AND au.user_id = auth.uid()
      AND au.is_active = true
    )
  );

-- Content docs policies
CREATE POLICY "Users can access content docs for their brands" ON public.content_docs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.brands b
      JOIN public.account_users au ON b.account_id = au.account_id
      WHERE b.id = content_docs.brand_id 
      AND au.user_id = auth.uid()
      AND au.is_active = true
    )
  );

-- Feed items policies
CREATE POLICY "Users can access feed items for their brands" ON public.feed_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.brands b
      JOIN public.account_users au ON b.account_id = au.account_id
      WHERE b.id = feed_items.brand_id 
      AND au.user_id = auth.uid()
      AND au.is_active = true
    )
  );

-- Publishing config policies
CREATE POLICY "Users can access publishing config for their brands" ON public.publishing_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.brands b
      JOIN public.account_users au ON b.account_id = au.account_id
      WHERE b.id = publishing_config.brand_id 
      AND au.user_id = auth.uid()
      AND au.is_active = true
    )
  );

-- Automation workflows policies
CREATE POLICY "Users can access automation workflows in their accounts" ON public.automation_workflows
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.account_users au
      WHERE au.account_id = automation_workflows.account_id 
      AND au.user_id = auth.uid()
      AND au.is_active = true
    )
  );

-- ROI metrics policies
CREATE POLICY "Users can access ROI metrics for their brands" ON public.roi_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.brands b
      JOIN public.account_users au ON b.account_id = au.account_id
      WHERE b.id = roi_metrics.brand_id 
      AND au.user_id = auth.uid()
      AND au.is_active = true
    )
  );

-- Opportunities policies
CREATE POLICY "Users can access opportunities for their brands" ON public.opportunities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.brands b
      JOIN public.account_users au ON b.account_id = au.account_id
      WHERE b.id = opportunities.brand_id 
      AND au.user_id = auth.uid()
      AND au.is_active = true
    )
  );

-- =====================================================
-- TRIGGERS FOR NEW TABLES
-- =====================================================

-- Products triggers
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Knowledge entities triggers
CREATE TRIGGER update_knowledge_entities_updated_at BEFORE UPDATE ON public.knowledge_entities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Content docs triggers
CREATE TRIGGER update_content_docs_updated_at BEFORE UPDATE ON public.content_docs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Publishing config triggers
CREATE TRIGGER update_publishing_config_updated_at BEFORE UPDATE ON public.publishing_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Automation workflows triggers
CREATE TRIGGER update_automation_workflows_updated_at BEFORE UPDATE ON public.automation_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Opportunities triggers
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ENHANCED FUNCTIONS FOR PRD FEATURES
-- =====================================================

-- Function to calculate LDI score
CREATE OR REPLACE FUNCTION public.calculate_ldi_score(
  brand_uuid uuid,
  locale_param locale_code DEFAULT 'en-GB',
  platform_param llm_platform DEFAULT 'blended',
  time_period interval DEFAULT '7 days'::interval
)
RETURNS decimal AS $$
DECLARE
  total_queries integer;
  found_queries integer;
  total_weighted_score decimal := 0;
  total_weight decimal := 0;
  ldi_score decimal;
  query_record RECORD;
BEGIN
  -- Get all queries for the brand and locale
  FOR query_record IN
    SELECT qb.text, qb.weight, ch.is_cited, ch.citation_position, ch.sentiment
    FROM public.query_bank qb
    LEFT JOIN public.citation_history ch ON qb.text = ch.query
    LEFT JOIN public.sites s ON ch.site_id = s.id
    WHERE qb.locale = locale_param
    AND (qb.brand_id = brand_uuid OR qb.brand_id IS NULL)
    AND (s.brand_id = brand_uuid OR s.brand_id IS NULL)
    AND (platform_param = 'blended' OR ch.provider = platform_param::text)
    AND (ch.recorded_at IS NULL OR ch.recorded_at >= (now() - time_period))
  LOOP
    total_weight := total_weight + COALESCE(query_record.weight, 1.0);
    
    IF query_record.is_cited THEN
      -- Weight by position (higher position = lower score)
      DECLARE
        position_weight decimal := CASE 
          WHEN query_record.citation_position <= 3 THEN 1.0
          WHEN query_record.citation_position <= 5 THEN 0.8
          WHEN query_record.citation_position <= 10 THEN 0.6
          ELSE 0.4
        END;
        
        sentiment_bonus decimal := CASE 
          WHEN query_record.sentiment = 'positive' THEN 1.2
          WHEN query_record.sentiment = 'neutral' THEN 1.0
          ELSE 0.8
        END;
      BEGIN
        total_weighted_score := total_weighted_score + 
          (query_record.weight * position_weight * sentiment_bonus);
      END;
    END IF;
  END LOOP;
  
  IF total_weight > 0 THEN
    ldi_score := (total_weighted_score / total_weight) * 100;
  ELSE
    ldi_score := 0;
  END IF;
  
  -- Store the calculated LDI score
  INSERT INTO public.ldi_snapshots (
    brand_id, locale, platform, score, queries_tested, queries_found, recorded_at
  ) VALUES (
    brand_uuid, locale_param, platform_param, ldi_score, 
    total_weight::integer, total_weighted_score::integer, now()
  );
  
  RETURN ROUND(ldi_score, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get competitor share of answers
CREATE OR REPLACE FUNCTION public.get_competitor_share_of_answers(
  brand_uuid uuid,
  topic_param text,
  locale_param locale_code DEFAULT 'en-GB',
  time_period interval DEFAULT '30 days'::interval
)
RETURNS TABLE (
  competitor_name text,
  share_percentage decimal,
  total_mentions integer,
  avg_position decimal
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.name,
    ROUND(
      (COUNT(cm.id)::decimal / 
       (SELECT COUNT(*) FROM public.competitor_metrics cm2 
        JOIN public.competitors c2 ON cm2.competitor_id = c2.id
        WHERE c2.account_id = (SELECT account_id FROM public.brands WHERE id = brand_uuid)
        AND cm2.recorded_at >= (now() - time_period))
      ) * 100, 2
    ) as share_percentage,
    COUNT(cm.id)::integer as total_mentions,
    ROUND(AVG(cm.average_position), 2) as avg_position
  FROM public.competitors c
  JOIN public.competitor_metrics cm ON c.id = cm.competitor_id
  WHERE c.account_id = (SELECT account_id FROM public.brands WHERE id = brand_uuid)
  AND cm.query ILIKE '%' || topic_param || '%'
  AND cm.recorded_at >= (now() - time_period)
  GROUP BY c.id, c.name
  ORDER BY share_percentage DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to identify content opportunities
CREATE OR REPLACE FUNCTION public.identify_content_opportunities(
  brand_uuid uuid,
  locale_param locale_code DEFAULT 'en-GB',
  limit_param integer DEFAULT 10
)
RETURNS TABLE (
  opportunity_id uuid,
  query_text text,
  gap_score decimal,
  competitor_advantage text,
  recommended_content_type text,
  estimated_impact decimal
) AS $$
BEGIN
  RETURN QUERY
  WITH competitor_performance AS (
    SELECT 
      ch.query,
      c.name as competitor_name,
      COUNT(*) as mentions,
      AVG(CASE WHEN ch.citation_position <= 3 THEN 1.0 ELSE 0.0 END) as top_3_rate
    FROM public.citation_history ch
    JOIN public.sites s ON ch.site_id = s.id
    JOIN public.competitors c ON s.domain = c.domain
    WHERE c.account_id = (SELECT account_id FROM public.brands WHERE id = brand_uuid)
    AND ch.recorded_at >= (now() - '30 days'::interval)
    GROUP BY ch.query, c.name
  ),
  brand_performance AS (
    SELECT 
      ch.query,
      COUNT(*) as mentions,
      AVG(CASE WHEN ch.citation_position <= 3 THEN 1.0 ELSE 0.0 END) as top_3_rate
    FROM public.citation_history ch
    JOIN public.sites s ON ch.site_id = s.id
    WHERE s.brand_id = brand_uuid
    AND ch.recorded_at >= (now() - '30 days'::interval)
    GROUP BY ch.query
  )
  SELECT 
    gen_random_uuid(),
    cp.query,
    ROUND((cp.top_3_rate - COALESCE(bp.top_3_rate, 0)) * 100, 2),
    cp.competitor_name,
    CASE 
      WHEN cp.query ILIKE '%how%' THEN 'HowTo'
      WHEN cp.query ILIKE '%what%' OR cp.query ILIKE '%why%' THEN 'FAQ'
      WHEN cp.query ILIKE '%best%' OR cp.query ILIKE '%review%' THEN 'Product'
      ELSE 'Article'
    END,
    ROUND(cp.top_3_rate * 10, 2) -- Simple impact estimation
  FROM competitor_performance cp
  LEFT JOIN brand_performance bp ON cp.query = bp.query
  WHERE (bp.query IS NULL OR cp.top_3_rate > bp.top_3_rate + 0.2)
  ORDER BY (cp.top_3_rate - COALESCE(bp.top_3_rate, 0)) DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate AEO schema
CREATE OR REPLACE FUNCTION public.generate_aeo_schema(
  doc_uuid uuid,
  schema_types text[] DEFAULT ARRAY['FAQPage']
)
RETURNS jsonb AS $$
DECLARE
  doc_record RECORD;
  schema_output jsonb := '{}';
  faq_schema jsonb;
  howto_schema jsonb;
  product_schema jsonb;
BEGIN
  -- Get document details
  SELECT * INTO doc_record FROM public.content_docs WHERE id = doc_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;
  
  -- Generate FAQ schema if requested
  IF 'FAQPage' = ANY(schema_types) AND doc_record.content_type = 'FAQ' THEN
    faq_schema := jsonb_build_object(
      '@context', 'https://schema.org',
      '@type', 'FAQPage',
      'mainEntity', jsonb_build_array()
    );
    schema_output := schema_output || jsonb_build_object('FAQPage', faq_schema);
  END IF;
  
  -- Generate HowTo schema if requested
  IF 'HowTo' = ANY(schema_types) AND doc_record.content_type = 'HowTo' THEN
    howto_schema := jsonb_build_object(
      '@context', 'https://schema.org',
      '@type', 'HowTo',
      'name', doc_record.title,
      'description', doc_record.meta_description,
      'step', jsonb_build_array()
    );
    schema_output := schema_output || jsonb_build_object('HowTo', howto_schema);
  END IF;
  
  -- Generate Product schema if requested
  IF 'Product' = ANY(schema_types) AND doc_record.content_type = 'Product' THEN
    product_schema := jsonb_build_object(
      '@context', 'https://schema.org',
      '@type', 'Product',
      'name', doc_record.title,
      'description', doc_record.meta_description
    );
    schema_output := schema_output || jsonb_build_object('Product', product_schema);
  END IF;
  
  -- Update document with generated schema
  UPDATE public.content_docs 
  SET structured_data = schema_output, updated_at = now()
  WHERE id = doc_uuid;
  
  RETURN schema_output;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DEFAULT DATA FOR EMEA MARKETS
-- =====================================================

-- Insert default query bank for EMEA markets
INSERT INTO public.query_bank (text, locale, category, intent_type, weight, topic, industry, custom) 
VALUES 
-- English queries
('What is the best [INDUSTRY] company in UK?', 'en-GB', 'comparison', 'commercial', 1.0, 'best_company', 'technology', false),
('How to choose [PRODUCT_TYPE] in Europe?', 'en-GB', 'guide', 'informational', 0.8, 'product_selection', 'technology', false),
('Top [SERVICE] providers in London', 'en-GB', 'listing', 'commercial', 0.9, 'local_services', 'technology', false),

-- German queries  
('Was ist das beste [INDUSTRY] Unternehmen in Deutschland?', 'de-DE', 'comparison', 'commercial', 1.0, 'best_company', 'technology', false),
('Wie wähle ich [PRODUCT_TYPE] in Europa?', 'de-DE', 'guide', 'informational', 0.8, 'product_selection', 'technology', false),

-- French queries
('Quelle est la meilleure entreprise [INDUSTRY] en France?', 'fr-FR', 'comparison', 'commercial', 1.0, 'best_company', 'technology', false),
('Comment choisir [PRODUCT_TYPE] en Europe?', 'fr-FR', 'guide', 'informational', 0.8, 'product_selection', 'technology', false),

-- Arabic queries
('ما هي أفضل شركة [INDUSTRY] في الإمارات؟', 'ar-AE', 'comparison', 'commercial', 1.0, 'best_company', 'technology', false),
('كيف أختار [PRODUCT_TYPE] في الشرق الأوسط؟', 'ar-AE', 'guide', 'informational', 0.8, 'product_selection', 'technology', false)

ON CONFLICT (account_id, text, locale) DO NOTHING;

-- Insert default automation workflows
INSERT INTO public.automation_workflows (account_id, name, description, workflow_type, trigger_conditions, actions)
SELECT 
  a.id,
  'Daily LDI Monitoring',
  'Automatically calculate and alert on LDI changes',
  'monitoring',
  '{"schedule": "0 9 * * *", "threshold": {"ldi_drop": 5}}',
  '{"calculate_ldi": true, "send_alert": true, "channels": ["email"]}'
FROM public.accounts a
WHERE a.account_type IN ('agency', 'in_house')
ON CONFLICT DO NOTHING;

-- Update existing LLM providers with EMEA focus
UPDATE public.llm_providers 
SET capabilities = capabilities || '{"regions": ["EU", "UK", "ME"], "languages": ["en", "de", "fr", "ar", "es", "it"]}'
WHERE name IN ('OpenAI', 'Anthropic', 'Google', 'Perplexity');

-- Grant permissions on new objects
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Comments for new tables
COMMENT ON TABLE public.products IS 'Brand products/services with locale and market targeting';
COMMENT ON TABLE public.knowledge_entities IS 'Knowledge graph entities for semantic understanding and brand context';
COMMENT ON TABLE public.knowledge_relations IS 'Relationships between knowledge graph entities';
COMMENT ON TABLE public.query_bank IS 'Bank of queries for testing LLM discoverability across locales';
COMMENT ON TABLE public.ldi_snapshots IS 'LLM Discoverability Index scores over time';
COMMENT ON TABLE public.content_docs IS 'Content documents for AEO optimization and publishing';
COMMENT ON TABLE public.feed_items IS 'Chunked content for LLM feeds and sitemaps';
COMMENT ON TABLE public.publishing_config IS 'Configuration for ai.txt, robots.txt, and LLM sitemaps';
COMMENT ON TABLE public.automation_workflows IS 'Automated workflows for monitoring, content, and optimization';
COMMENT ON TABLE public.roi_metrics IS 'ROI tracking and attribution for AI visibility improvements';
COMMENT ON TABLE public.opportunities IS 'Identified opportunities for content and optimization';