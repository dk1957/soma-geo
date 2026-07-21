-- =====================================================
-- COMPREHENSIVE SOMA GEO PLATFORM DATABASE SCHEMA
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- CORE USER & WORKSPACE MANAGEMENT
-- =====================================================

-- Enhanced profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  region text CHECK (region IN ('africa', 'europe', 'middle_east', 'north_america', 'asia_pacific', 'latin_america')),
  timezone text DEFAULT 'UTC',
  language_preference text DEFAULT 'en',
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  onboarding_completed boolean DEFAULT false,
  preferences jsonb DEFAULT '{}',
  usage_stats jsonb DEFAULT '{}',
  last_active_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Accounts table for agencies and in-house teams
CREATE TABLE public.accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('agency', 'in_house')),
  description text,
  logo_url text,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_size text CHECK (company_size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
  industry text,
  settings jsonb DEFAULT '{}',
  billing_plan text DEFAULT 'free' CHECK (billing_plan IN ('free', 'basic', 'pro', 'enterprise')),
  billing_status text DEFAULT 'active' CHECK (billing_status IN ('active', 'past_due', 'canceled', 'trialing')),
  trial_ends_at timestamp with time zone,
  subscription_id text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Account members with roles
CREATE TABLE public.account_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'account_manager', 'member', 'viewer')),
  permissions jsonb DEFAULT '{}',
  invited_by uuid REFERENCES auth.users(id),
  invitation_token text,
  invitation_sent_at timestamp with time zone,
  joined_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(account_id, user_id)
);

-- Brands table for client brands (agencies) or own brands (in-house)
CREATE TABLE public.brands (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  logo_url text,
  industry text,
  brand_type text DEFAULT 'client' CHECK (brand_type IN ('client', 'own')),
  primary_domain text,
  contact_info jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(account_id, slug)
);

-- Brand managers assignment (many-to-many)
CREATE TABLE public.brand_managers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'manager' CHECK (role IN ('primary_manager', 'manager', 'collaborator')),
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(brand_id, user_id)
);

-- Workspaces with enhanced brand relationship
CREATE TABLE public.workspaces (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  is_default boolean DEFAULT false,
  settings jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(account_id, slug)
);

-- Workspace members with roles (inherited from account + workspace-specific)
CREATE TABLE public.workspace_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'editor', 'viewer', 'brand_manager')),
  permissions jsonb DEFAULT '{}',
  invited_by uuid REFERENCES auth.users(id),
  invitation_token text,
  invitation_sent_at timestamp with time zone,
  joined_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- =====================================================
-- SITE & CONTENT MANAGEMENT
-- =====================================================

-- Sites/domains to monitor (now linked to brands via workspaces)
CREATE TABLE public.sites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  domain text NOT NULL,
  description text,
  industry text,
  target_regions text[] DEFAULT '{}',
  target_languages text[] DEFAULT '{"en"}',
  sitemap_url text,
  robots_txt_url text,
  gsc_connected boolean DEFAULT false,
  gsc_property_url text,
  analytics_connected boolean DEFAULT false,
  analytics_property_id text,
  is_active boolean DEFAULT true,
  last_crawled_at timestamp with time zone,
  crawl_status text DEFAULT 'pending' CHECK (crawl_status IN ('pending', 'crawling', 'completed', 'failed')),
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Content pages/URLs
CREATE TABLE public.content_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  url text NOT NULL,
  title text,
  meta_description text,
  content_type text DEFAULT 'webpage' CHECK (content_type IN ('webpage', 'blog', 'product', 'service', 'about', 'contact')),
  word_count integer,
  readability_score decimal,
  content_hash text,
  last_modified timestamp with time zone,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft', 'archived')),
  seo_score decimal,
  geo_score decimal,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(site_id, url)
);

-- Keywords and topics tracking (now linked to accounts for reusability)
CREATE TABLE public.keywords (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  keyword text NOT NULL,
  search_volume integer,
  competition_level text CHECK (competition_level IN ('low', 'medium', 'high')),
  intent_type text CHECK (intent_type IN ('informational', 'navigational', 'transactional', 'commercial')),
  difficulty_score decimal,
  trends_data jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(account_id, keyword)
);

-- Content optimization templates (account-level for sharing across brands)
CREATE TABLE public.optimization_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text,
  industry text,
  content_type text,
  template_data jsonb NOT NULL,
  usage_count integer DEFAULT 0,
  is_public boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =====================================================
-- AI & AUDIT SYSTEM
-- =====================================================

-- LLM providers and models
CREATE TABLE public.llm_providers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  api_endpoint text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  rate_limit_per_minute integer DEFAULT 60,
  cost_per_1k_tokens decimal,
  supported_models text[] DEFAULT '{}',
  capabilities jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Job processing system
CREATE TABLE public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('audit', 'optimization', 'monitoring', 'competitor_analysis', 'keyword_research')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  priority integer DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  payload jsonb NOT NULL,
  result jsonb,
  error_message text,
  progress_percentage integer DEFAULT 0,
  estimated_completion timestamp with time zone,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  timeout_seconds integer DEFAULT 300,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Audit reports
CREATE TABLE public.audits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  audit_type text NOT NULL CHECK (audit_type IN ('full_site', 'page_specific', 'keyword_focused', 'competitor_benchmark')),
  queries_analyzed text[] NOT NULL,
  models_used text[] NOT NULL,
  overall_score decimal,
  citation_rate decimal,
  visibility_score decimal,
  competitor_comparison jsonb DEFAULT '{}',
  recommendations jsonb DEFAULT '{}',
  detailed_results jsonb DEFAULT '{}',
  is_baseline boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- LLM query responses
CREATE TABLE public.llm_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id uuid REFERENCES public.audits(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  provider text NOT NULL,
  model text NOT NULL,
  query text NOT NULL,
  response text,
  response_metadata jsonb DEFAULT '{}',
  is_cited boolean DEFAULT false,
  citation_position integer,
  citation_context text,
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  confidence_score decimal,
  response_time_ms integer,
  tokens_used integer,
  cost decimal,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =====================================================
-- CONTENT OPTIMIZATION SYSTEM
-- =====================================================

-- Content optimizations
CREATE TABLE public.optimizations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  page_id uuid REFERENCES public.content_pages(id) ON DELETE SET NULL,
  target_keywords text[] NOT NULL,
  original_content text,
  optimized_content text,
  optimization_type text CHECK (optimization_type IN ('full_rewrite', 'enhancement', 'structure', 'schema')),
  changes_summary jsonb DEFAULT '{}',
  predicted_improvement jsonb DEFAULT '{}',
  ab_test_id uuid,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'published', 'archived')),
  published_at timestamp with time zone,
  performance_data jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- A/B testing system
CREATE TABLE public.ab_tests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  page_url text NOT NULL,
  control_version_id uuid REFERENCES public.optimizations(id),
  test_version_id uuid REFERENCES public.optimizations(id),
  traffic_split decimal DEFAULT 0.5,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed', 'cancelled')),
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  sample_size integer,
  confidence_level decimal DEFAULT 0.95,
  results jsonb DEFAULT '{}',
  winner text CHECK (winner IN ('control', 'test', 'inconclusive')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =====================================================
-- MONITORING & ANALYTICS
-- =====================================================

-- Citation tracking over time
CREATE TABLE public.citation_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  query text NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  is_cited boolean NOT NULL,
  citation_position integer,
  citation_context text,
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Performance metrics tracking
CREATE TABLE public.performance_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  page_id uuid REFERENCES public.content_pages(id) ON DELETE SET NULL,
  metric_type text NOT NULL CHECK (metric_type IN ('citation_rate', 'visibility_score', 'traffic', 'conversions', 'rankings')),
  metric_value decimal NOT NULL,
  comparison_period text CHECK (comparison_period IN ('day', 'week', 'month', 'quarter', 'year')),
  previous_value decimal,
  change_percentage decimal,
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Competitor analysis (account-level with brand filtering)
CREATE TABLE public.competitors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  name text NOT NULL,
  domain text NOT NULL,
  description text,
  industry text,
  is_active boolean DEFAULT true,
  last_analyzed_at timestamp with time zone,
  analysis_frequency text DEFAULT 'weekly' CHECK (analysis_frequency IN ('daily', 'weekly', 'monthly')),
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(account_id, domain)
);

-- Competitor performance data
CREATE TABLE public.competitor_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_id uuid NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  query text NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  citation_rate decimal,
  average_position decimal,
  sentiment_score decimal,
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- =====================================================
-- SOCIAL MEDIA & MENTIONS
-- =====================================================

-- Social media sources
CREATE TABLE public.social_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('reddit', 'twitter', 'facebook', 'linkedin', 'youtube', 'tiktok', 'instagram')),
  api_endpoint text,
  rate_limits jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  credentials_configured boolean DEFAULT false,
  last_sync_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Brand mentions from social media (brand-specific)
CREATE TABLE public.mentions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  source_platform text NOT NULL,
  source_url text NOT NULL,
  title text,
  content text,
  author text,
  author_handle text,
  engagement_metrics jsonb DEFAULT '{}',
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score decimal,
  influence_score decimal,
  reach_estimate integer,
  mentioned_at timestamp with time zone,
  discovered_at timestamp with time zone NOT NULL DEFAULT now(),
  is_processed boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  UNIQUE(source_url, brand_id)
);

-- =====================================================
-- NOTIFICATIONS & ALERTS
-- =====================================================

-- Notification settings (user + account level)
CREATE TABLE public.notification_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  email_enabled boolean DEFAULT true,
  push_enabled boolean DEFAULT true,
  slack_enabled boolean DEFAULT false,
  frequency text DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'hourly', 'daily', 'weekly')),
  event_types text[] DEFAULT '{}',
  quiet_hours_start time,
  quiet_hours_end time,
  timezone text DEFAULT 'UTC',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, account_id, brand_id)
);

-- Alerts and notifications (account/brand context)
CREATE TABLE public.alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('citation_drop', 'citation_spike', 'competitor_gain', 'keyword_opportunity', 'system_alert')),
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  action_url text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =====================================================
-- INTEGRATIONS & API MANAGEMENT
-- =====================================================

-- Third-party integrations (account-level)
CREATE TABLE public.integrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('google_search_console', 'google_analytics', 'wordpress', 'shopify', 'slack', 'discord')),
  name text NOT NULL,
  configuration jsonb NOT NULL DEFAULT '{}',
  credentials jsonb DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'expired')),
  last_sync_at timestamp with time zone,
  sync_frequency text DEFAULT 'daily' CHECK (sync_frequency IN ('realtime', 'hourly', 'daily', 'weekly')),
  error_message text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(account_id, type, brand_id)
);

-- API keys and access tokens (account-level)
CREATE TABLE public.api_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  permissions text[] DEFAULT '{}',
  rate_limit_per_hour integer DEFAULT 1000,
  usage_count integer DEFAULT 0,
  last_used_at timestamp with time zone,
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(key_hash)
);

-- =====================================================
-- BILLING & USAGE TRACKING
-- =====================================================

-- Usage tracking (account-level)
CREATE TABLE public.usage_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  feature text NOT NULL,
  action text NOT NULL,
  resource_id uuid,
  quantity integer DEFAULT 1,
  cost decimal DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  recorded_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Billing events (account-level)
CREATE TABLE public.billing_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('subscription_created', 'subscription_updated', 'subscription_cancelled', 'payment_succeeded', 'payment_failed', 'invoice_created')),
  stripe_event_id text,
  amount_cents integer,
  currency text DEFAULT 'usd',
  plan_id text,
  event_data jsonb DEFAULT '{}',
  processed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =====================================================
-- SEARCH & KNOWLEDGE BASE
-- =====================================================

-- Knowledge base for AI training (account-level with brand context)
CREATE TABLE public.knowledge_base (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  content_type text DEFAULT 'article' CHECK (content_type IN ('article', 'faq', 'guide', 'template', 'best_practice')),
  tags text[] DEFAULT '{}',
  category text,
  industry text,
  language text DEFAULT 'en',
  embedding vector(1536),
  quality_score decimal,
  usage_count integer DEFAULT 0,
  is_public boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Search queries and analytics (account-level)
CREATE TABLE public.search_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  query text NOT NULL,
  results_count integer,
  clicked_result_id uuid,
  search_type text CHECK (search_type IN ('knowledge_base', 'content', 'competitors', 'keywords')),
  response_time_ms integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Core entity indexes
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_region ON public.profiles(region);
CREATE INDEX idx_accounts_owner_id ON public.accounts(owner_id);
CREATE INDEX idx_accounts_account_type ON public.accounts(account_type);
CREATE INDEX idx_accounts_billing_plan ON public.accounts(billing_plan);
CREATE INDEX idx_account_users_account_id ON public.account_users(account_id);
CREATE INDEX idx_account_users_user_id ON public.account_users(user_id);
CREATE INDEX idx_brands_account_id ON public.brands(account_id);
CREATE INDEX idx_brands_brand_type ON public.brands(brand_type);
CREATE INDEX idx_brand_managers_brand_id ON public.brand_managers(brand_id);
CREATE INDEX idx_brand_managers_user_id ON public.brand_managers(user_id);
CREATE INDEX idx_workspaces_account_id ON public.workspaces(account_id);
CREATE INDEX idx_workspaces_brand_id ON public.workspaces(brand_id);
CREATE INDEX idx_workspace_users_workspace_id ON public.workspace_users(workspace_id);
CREATE INDEX idx_workspace_users_user_id ON public.workspace_users(user_id);

-- Site and content indexes
CREATE INDEX idx_sites_workspace_id ON public.sites(workspace_id);
CREATE INDEX idx_sites_brand_id ON public.sites(brand_id);
CREATE INDEX idx_sites_domain ON public.sites(domain);
CREATE INDEX idx_content_pages_site_id ON public.content_pages(site_id);
CREATE INDEX idx_content_pages_url ON public.content_pages(url);
CREATE INDEX idx_keywords_account_id ON public.keywords(account_id);
CREATE INDEX idx_keywords_brand_id ON public.keywords(brand_id);

-- Job and audit indexes
CREATE INDEX idx_jobs_workspace_id ON public.jobs(workspace_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_type ON public.jobs(type);
CREATE INDEX idx_jobs_created_at ON public.jobs(created_at);
CREATE INDEX idx_audits_site_id ON public.audits(site_id);
CREATE INDEX idx_audits_job_id ON public.audits(job_id);
CREATE INDEX idx_llm_responses_audit_id ON public.llm_responses(audit_id);
CREATE INDEX idx_llm_responses_provider_model ON public.llm_responses(provider, model);

-- Monitoring and analytics indexes
CREATE INDEX idx_citation_history_site_id ON public.citation_history(site_id);
CREATE INDEX idx_citation_history_recorded_at ON public.citation_history(recorded_at);
CREATE INDEX idx_citation_history_query ON public.citation_history(query);
CREATE INDEX idx_performance_metrics_site_id ON public.performance_metrics(site_id);
CREATE INDEX idx_performance_metrics_recorded_at ON public.performance_metrics(recorded_at);
CREATE INDEX idx_mentions_account_id ON public.mentions(account_id);
CREATE INDEX idx_mentions_brand_id ON public.mentions(brand_id);
CREATE INDEX idx_mentions_discovered_at ON public.mentions(discovered_at);
CREATE INDEX idx_competitors_account_id ON public.competitors(account_id);
CREATE INDEX idx_competitors_brand_id ON public.competitors(brand_id);

-- Full-text search indexes
CREATE INDEX idx_content_pages_title_gin ON public.content_pages USING gin(to_tsvector('english', title));
CREATE INDEX idx_mentions_content_gin ON public.mentions USING gin(to_tsvector('english', content));
CREATE INDEX idx_knowledge_base_content_gin ON public.knowledge_base USING gin(to_tsvector('english', content));

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Account policies
CREATE POLICY "Users can view accounts they belong to" ON public.accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.account_users 
      WHERE account_users.account_id = accounts.id 
      AND account_users.user_id = auth.uid()
      AND account_users.is_active = true
    )
  );

CREATE POLICY "Account owners can update their accounts" ON public.accounts
  FOR UPDATE USING (auth.uid() = owner_id);

-- Account users policies
CREATE POLICY "Users can view account memberships they're part of" ON public.account_users
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.account_users au 
      WHERE au.account_id = account_users.account_id 
      AND au.user_id = auth.uid() 
      AND au.role IN ('owner', 'admin')
    )
  );

-- Brand policies
CREATE POLICY "Users can view brands in their accounts" ON public.brands
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.account_users 
      WHERE account_users.account_id = brands.account_id 
      AND account_users.user_id = auth.uid()
      AND account_users.is_active = true
    )
  );

-- Brand manager policies
CREATE POLICY "Users can view brand assignments they're involved in" ON public.brand_managers
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.brands b
      JOIN public.account_users au ON b.account_id = au.account_id
      WHERE b.id = brand_managers.brand_id
      AND au.user_id = auth.uid()
      AND au.role IN ('owner', 'admin')
    )
  );

-- Workspace policies
CREATE POLICY "Users can view workspaces they have access to" ON public.workspaces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_users 
      WHERE workspace_users.workspace_id = workspaces.id 
      AND workspace_users.user_id = auth.uid()
      AND workspace_users.is_active = true
    ) OR
    EXISTS (
      SELECT 1 FROM public.account_users 
      WHERE account_users.account_id = workspaces.account_id 
      AND account_users.user_id = auth.uid()
      AND account_users.is_active = true
    )
  );

-- Workspace users policies
CREATE POLICY "Users can view workspace memberships they're part of" ON public.workspace_users
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.workspace_users wu 
      WHERE wu.workspace_id = workspace_users.workspace_id 
      AND wu.user_id = auth.uid() 
      AND wu.role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.workspaces w
      JOIN public.account_users au ON w.account_id = au.account_id
      WHERE w.id = workspace_users.workspace_id
      AND au.user_id = auth.uid()
      AND au.role IN ('owner', 'admin')
    )
  );

-- Sites policies
CREATE POLICY "Users can view sites in their workspaces" ON public.sites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_users wu
      JOIN public.workspaces w ON wu.workspace_id = w.id
      WHERE w.id = sites.workspace_id 
      AND wu.user_id = auth.uid()
      AND wu.is_active = true
    ) OR
    EXISTS (
      SELECT 1 FROM public.workspaces w
      JOIN public.account_users au ON w.account_id = au.account_id
      WHERE w.id = sites.workspace_id
      AND au.user_id = auth.uid()
      AND au.is_active = true
    )
  );

-- Jobs policies
CREATE POLICY "Users can view jobs in their workspaces" ON public.jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_users wu
      JOIN public.workspaces w ON wu.workspace_id = w.id
      WHERE w.id = jobs.workspace_id 
      AND wu.user_id = auth.uid()
      AND wu.is_active = true
    ) OR
    EXISTS (
      SELECT 1 FROM public.workspaces w
      JOIN public.account_users au ON w.account_id = au.account_id
      WHERE w.id = jobs.workspace_id
      AND au.user_id = auth.uid()
      AND au.is_active = true
    )
  );

-- Generic account-based policies for other tables
CREATE POLICY "Users can access keywords in their accounts" ON public.keywords
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.account_users 
      WHERE account_users.account_id = keywords.account_id 
      AND account_users.user_id = auth.uid()
      AND account_users.is_active = true
    )
  );

CREATE POLICY "Users can access competitors in their accounts" ON public.competitors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.account_users 
      WHERE account_users.account_id = competitors.account_id 
      AND account_users.user_id = auth.uid()
      AND account_users.is_active = true
    )
  );

CREATE POLICY "Users can access mentions for their brands" ON public.mentions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.account_users 
      WHERE account_users.account_id = mentions.account_id 
      AND account_users.user_id = auth.uid()
      AND account_users.is_active = true
    )
  );

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for tables with updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON public.sites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_pages_updated_at BEFORE UPDATE ON public.content_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_optimization_templates_updated_at BEFORE UPDATE ON public.optimization_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_optimizations_updated_at BEFORE UPDATE ON public.optimizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ab_tests_updated_at BEFORE UPDATE ON public.ab_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON public.knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Insert default LLM providers
INSERT INTO public.llm_providers (name, supported_models, capabilities) VALUES
('Groq', ARRAY['llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768'], '{"speed": "high", "cost": "low"}'),
('OpenAI', ARRAY['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'], '{"quality": "high", "reasoning": "excellent"}'),
('Anthropic', ARRAY['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'], '{"safety": "high", "reasoning": "excellent"}'),
('Google', ARRAY['gemini-pro', 'gemini-pro-vision'], '{"multimodal": true, "search": "integrated"}'),
('Perplexity', ARRAY['pplx-7b-online', 'pplx-70b-online'], '{"search": "real-time", "citations": "automatic"}');

-- Insert default social sources
INSERT INTO public.social_sources (name, platform) VALUES
('Reddit', 'reddit'),
('Twitter/X', 'twitter'),
('LinkedIn', 'linkedin'),
('Facebook', 'facebook'),
('YouTube', 'youtube');

-- Insert default optimization templates
INSERT INTO public.optimization_templates (name, description, category, template_data, is_public) VALUES
('E-commerce Product Page', 'Optimized template for product pages with rich snippets', 'E-commerce', '{"sections": ["product_specs", "reviews", "comparisons", "faqs"]}', true),
('Blog Post Template', 'SEO and GEO optimized blog post structure', 'Content Marketing', '{"sections": ["introduction", "main_content", "expert_quotes", "statistics", "conclusion"]}', true),
('Service Page Template', 'Template for service-based businesses', 'Services', '{"sections": ["service_overview", "benefits", "process", "pricing", "testimonials"]}', true);

-- =====================================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- =====================================================

-- Function to get user accounts and their role
CREATE OR REPLACE FUNCTION public.get_user_accounts(user_uuid uuid)
RETURNS TABLE (
  account_id uuid,
  account_name text,
  account_slug text,
  account_type text,
  user_role text,
  is_owner boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.slug,
    a.account_type,
    au.role,
    (a.owner_id = user_uuid)
  FROM public.accounts a
  JOIN public.account_users au ON a.id = au.account_id
  WHERE au.user_id = user_uuid AND au.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user brands (including managed brands)
CREATE OR REPLACE FUNCTION public.get_user_brands(user_uuid uuid, account_uuid uuid DEFAULT NULL)
RETURNS TABLE (
  brand_id uuid,
  brand_name text,
  brand_slug text,
  brand_type text,
  account_name text,
  manager_role text,
  primary_domain text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.slug,
    b.brand_type,
    a.name,
    COALESCE(bm.role, 'viewer'),
    b.primary_domain
  FROM public.brands b
  JOIN public.accounts a ON b.account_id = a.id
  JOIN public.account_users au ON a.id = au.account_id
  LEFT JOIN public.brand_managers bm ON b.id = bm.brand_id AND bm.user_id = user_uuid
  WHERE au.user_id = user_uuid 
  AND au.is_active = true
  AND (account_uuid IS NULL OR a.id = account_uuid)
  AND (bm.user_id IS NOT NULL OR au.role IN ('owner', 'admin'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user workspaces
CREATE OR REPLACE FUNCTION public.get_user_workspaces(user_uuid uuid, account_uuid uuid DEFAULT NULL)
RETURNS TABLE (
  workspace_id uuid,
  workspace_name text,
  workspace_slug text,
  brand_name text,
  account_name text,
  user_role text,
  is_default boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.name,
    w.slug,
    b.name,
    a.name,
    COALESCE(wu.role, 'viewer'),
    w.is_default
  FROM public.workspaces w
  JOIN public.brands b ON w.brand_id = b.id
  JOIN public.accounts a ON w.account_id = a.id
  LEFT JOIN public.workspace_users wu ON w.id = wu.workspace_id AND wu.user_id = user_uuid
  WHERE (
    wu.user_id = user_uuid OR 
    EXISTS (
      SELECT 1 FROM public.account_users au
      WHERE au.account_id = a.id AND au.user_id = user_uuid AND au.is_active = true
    )
  )
  AND (account_uuid IS NULL OR a.id = account_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate citation rate (updated for brand context)
CREATE OR REPLACE FUNCTION public.calculate_citation_rate(
  account_uuid uuid,
  brand_uuid uuid DEFAULT NULL,
  site_uuid uuid DEFAULT NULL,
  time_period interval DEFAULT '30 days'::interval
)
RETURNS decimal AS $$
DECLARE
  total_queries integer;
  cited_queries integer;
  citation_rate decimal;
BEGIN
  SELECT COUNT(DISTINCT ch.query) INTO total_queries
  FROM public.citation_history ch
  JOIN public.sites s ON ch.site_id = s.id
  JOIN public.brands b ON s.brand_id = b.id
  WHERE b.account_id = account_uuid
  AND (brand_uuid IS NULL OR b.id = brand_uuid)
  AND (site_uuid IS NULL OR s.id = site_uuid)
  AND ch.recorded_at >= (now() - time_period);

  SELECT COUNT(DISTINCT ch.query) INTO cited_queries
  FROM public.citation_history ch
  JOIN public.sites s ON ch.site_id = s.id
  JOIN public.brands b ON s.brand_id = b.id
  WHERE b.account_id = account_uuid
  AND (brand_uuid IS NULL OR b.id = brand_uuid)
  AND (site_uuid IS NULL OR s.id = site_uuid)
  AND ch.is_cited = true
  AND ch.recorded_at >= (now() - time_period);

  IF total_queries > 0 THEN
    citation_rate := (cited_queries::decimal / total_queries::decimal) * 100;
  ELSE
    citation_rate := 0;
  END IF;

  RETURN citation_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default workspace for new brand
CREATE OR REPLACE FUNCTION public.create_default_workspace_for_brand(
  brand_uuid uuid,
  workspace_name text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  new_workspace_id uuid;
  brand_record RECORD;
BEGIN
  -- Get brand info
  SELECT b.*, a.slug as account_slug 
  INTO brand_record
  FROM public.brands b
  JOIN public.accounts a ON b.account_id = a.id
  WHERE b.id = brand_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Brand not found';
  END IF;

  -- Create workspace
  INSERT INTO public.workspaces (
    account_id,
    brand_id,
    name,
    slug,
    description,
    is_default
  ) VALUES (
    brand_record.account_id,
    brand_uuid,
    COALESCE(workspace_name, brand_record.name || ' Workspace'),
    brand_record.slug || '-workspace',
    'Default workspace for ' || brand_record.name,
    true
  ) RETURNING id INTO new_workspace_id;

  RETURN new_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FINAL SETUP
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.profiles IS 'Extended user profiles with regional preferences and usage statistics';
COMMENT ON TABLE public.accounts IS 'Top-level accounts for agencies and in-house teams with billing';
COMMENT ON TABLE public.account_users IS 'Account membership and roles for users';
COMMENT ON TABLE public.brands IS 'Client brands (for agencies) or own brands (for in-house teams)';
COMMENT ON TABLE public.brand_managers IS 'Assignment of account managers to specific brands';
COMMENT ON TABLE public.workspaces IS 'Operational environments tied to specific brands';
COMMENT ON TABLE public.sites IS 'Websites/domains being monitored and optimized for brands';
COMMENT ON TABLE public.jobs IS 'Background job processing system for audits, optimizations, etc.';
COMMENT ON TABLE public.audits IS 'AI audit reports with citation analysis';
COMMENT ON TABLE public.llm_responses IS 'Individual LLM query responses and citations';
COMMENT ON TABLE public.optimizations IS 'Content optimization results and A/B tests';
COMMENT ON TABLE public.citation_history IS 'Historical citation data for trend analysis';
COMMENT ON TABLE public.mentions IS 'Brand mentions from social media and web sources';
COMMENT ON TABLE public.competitors IS 'Competitor tracking and analysis at account/brand level';
COMMENT ON TABLE public.knowledge_base IS 'AI training data and optimization templates';