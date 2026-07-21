// Types for the new Jobs system architecture
// File: /lib/types/jobs.ts

export type JobCategory = 'visibility' | 'discoverability';
export type JobType = 'prompt_generation' | 'prompt_analysis' | 'routine_monitoring' | 'brand_audit' | 'onboarding_research' | 'onboarding_prompts' | 'other';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';
export type SourceType = 'news' | 'blog' | 'govt' | 'scientific' | 'academic' | 'social' | 'company' | 'directory' | 'other';
export type MentionType = 'direct' | 'indirect' | 'competitor' | 'related';

export interface Job {
  job_id: string;
  account_id: string;
  brand_id: string | null; // Allow null during onboarding
  job_category: JobCategory;
  job_type: JobType;
  model?: string;
  provider?: string;
  prompt?: string;
  prompts_json?: any[]; // Structured prompts with IDs
  status: JobStatus;
  total_tokens?: number;
  cost_estimate?: number;
  error_message?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface JobCreateRequest {
  account_id: string;
  brand_id: string | null; // Allow null during onboarding
  job_category: JobCategory;
  job_type: JobType;
  model?: string;
  provider?: string;
  prompt?: string; // Can store either text or JSON string
  metadata?: Record<string, any>;
}

export interface Response {
  response_id: string;
  job_id: string;
  account_id: string;
  brand_id: string | null; // Allow null during onboarding
  raw_content?: string;
  extracted_content?: string;
  content_length?: number;
  brand_mentions?: BrandMentionSummary[];
  citations?: CitationSummary[];
  sentiment?: number;
  response_time_ms?: number;
  model_name?: string;
  confidence_score?: number;
  created_at: string;
}

export interface ResponseCreateRequest {
  job_id: string;
  account_id: string;
  brand_id: string | null; // Allow null during onboarding
  raw_content?: string;
  extracted_content?: string;
  model_name?: string;
  response_time_ms?: number;
  confidence_score?: number;
  // Enhanced metadata fields
  context?: string;
  intent_type?: string;
  query_style?: string;
  user_persona?: string;
  expected_brand_mention?: string;
  processing_metadata?: Record<string, any>;
  response_format?: string;
  language?: string;
  market?: string;
  business_category?: string;
  prompt_id?: string;
  run_metadata?: Record<string, any>;
  quality_score?: number;
  relevance_score?: number;
  authenticity_score?: number;
  commercial_intent?: number;
  error_message?: string;
  retry_count?: number;
  source_endpoint?: string;
  user_feedback?: Record<string, any>;
  tags?: string[];
}

export interface Citation {
  citation_id: string;
  response_id: string;
  account_id: string;
  brand_id: string | null; // Allow null during onboarding
  url: string;
  source_name?: string;
  source_type?: SourceType;
  excerpt?: string;
  relevance_score?: number;
  authority_score?: number;
  created_at: string;
}

export interface CitationCreateRequest {
  response_id: string;
  account_id: string;
  brand_id: string | null; // Allow null during onboarding
  url: string;
  source_name?: string;
  source_type?: SourceType;
  excerpt?: string;
  relevance_score?: number;
  authority_score?: number;
}

export interface CitationSummary {
  url: string;
  source_name?: string;
  source_type?: SourceType;
  relevance_score?: number;
}

export interface BrandMention {
  brand_mention_id: string;
  response_id: string;
  account_id: string;
  brand_id: string | null; // Allow null during onboarding
  brand_name: string;
  sentiment?: number;
  position?: number;
  context?: string;
  mention_type?: MentionType;
  created_at: string;
}

export interface BrandMentionCreateRequest {
  response_id: string;
  account_id: string;
  brand_id: string | null; // Allow null during onboarding
  brand_name: string;
  sentiment?: number;
  position?: number;
  context?: string;
  mention_type?: MentionType;
}

export interface BrandMentionSummary {
  brand_name: string;
  sentiment?: number;
  mention_type?: MentionType;
  count?: number;
}

export interface Metric {
  metric_id: string;
  job_id: string;
  account_id: string;
  brand_id: string | null; // Allow null during onboarding
  llm_visibility_index?: number;
  citation_count: number;
  brand_mentions_count: number;
  excerpt_avg_length?: number;
  query_coverage?: number;
  model_name?: string;
  sentiment_avg?: number;
  content_quality_score?: number;
  discoverability_score?: number;
  response_time_avg?: number;
  confidence_avg?: number;
  competitor_mentions_count: number;
  created_at: string;
}

export interface MetricCreateRequest {
  job_id: string;
  account_id: string;
  brand_id: string | null; // Allow null during onboarding
  model_name?: string;
  llm_visibility_index?: number;
  citation_count?: number;
  brand_mentions_count?: number;
  excerpt_avg_length?: number;
  query_coverage?: number;
  sentiment_avg?: number;
  content_quality_score?: number;
  discoverability_score?: number;
  response_time_avg?: number;
  confidence_avg?: number;
  competitor_mentions_count?: number;
}

// Analysis and processing types
export interface JobAnalysisResult {
  job: Job;
  responses: Response[];
  citations: Citation[];
  brand_mentions: BrandMention[];
  metrics: Metric[];
}

export interface VisibilityAnalysisConfig {
  models: string[];
  prompts: string[];
  competitors?: string[];
  analysis_depth: 'basic' | 'detailed' | 'comprehensive';
}

export interface DiscoverabilityAnalysisConfig {
  audit_type: 'basic' | 'technical' | 'full';
  include_competitor_analysis: boolean;
  check_structured_data: boolean;
  analyze_content_quality: boolean;
}

export interface JobExecutionConfig {
  max_retries: number;
  timeout_ms: number;
  parallel_requests: number;
  cache_results: boolean;
}

// Dashboard and UI types
export interface JobSummary {
  job_id: string;
  job_category: JobCategory;
  job_type: JobType;
  status: JobStatus;
  created_at: string;
  completed_at?: string;
  total_responses: number;
  total_citations: number;
  total_brand_mentions: number;
  avg_sentiment?: number;
  visibility_index?: number;
}

export interface DashboardMetrics {
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  avg_visibility_index: number;
  trend_visibility: number; // percentage change
  total_citations: number;
  trend_citations: number;
  total_brand_mentions: number;
  trend_mentions: number;
  avg_sentiment: number;
  trend_sentiment: number;
}

// API Response types
export interface JobsApiResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
}

export interface JobDetailsApiResponse {
  job: Job;
  responses: Response[];
  metrics: Metric;
  summary: {
    total_responses: number;
    avg_response_time: number;
    total_citations: number;
    total_brand_mentions: number;
    sentiment_distribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
}

// Error types
export interface JobError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}