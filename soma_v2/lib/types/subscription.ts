// ============================================================================
// SUBSCRIPTION AND QUOTA TYPE DEFINITIONS
// ============================================================================

export type PlanTier = 'growth' | 'pro' | 'enterprise';

export type SubscriptionStatus = 
  | 'active' 
  | 'trialing' 
  | 'past_due' 
  | 'canceled' 
  | 'expired' 
  | 'paused';

export type BillingCycle = 'monthly' | 'quarterly' | 'biannual' | 'annual' | 'biennial';

export type SubscriptionEventType =
  | 'created'
  | 'renewed'
  | 'upgraded'
  | 'downgraded'
  | 'canceled'
  | 'expired'
  | 'paused'
  | 'resumed'
  | 'payment_failed'
  | 'payment_succeeded'
  | 'trial_started'
  | 'trial_ended';

export type ModelProvider = 
  | 'openai' 
  | 'anthropic' 
  | 'google' 
  | 'perplexity' 
  | 'xai' 
  | 'meta';

export interface SubscriptionFeatures {
  api_access: boolean;
  white_label: boolean;
  custom_branding: boolean;
  priority_support: boolean;
  dedicated_account_manager: boolean;
  advanced_analytics: boolean;
  competitor_tracking: boolean;
  sentiment_analysis: boolean;
  export_reports: boolean;
  scheduled_reports: boolean;
  webhook_integrations: boolean;
  sso_enabled: boolean;
}

export interface SubscriptionPlan {
  id: string;
  plan_name: string;
  plan_slug: string;
  display_name: string;
  description: string | null;
  plan_tier: PlanTier;
  
  // Pricing
  monthly_price_usd: number;
  quarterly_price_usd: number | null;
  biannual_price_usd: number | null;
  annual_price_usd: number | null;
  biennial_price_usd: number | null;
  
  // Stripe Price IDs
  stripe_monthly_price_id: string | null;
  stripe_quarterly_price_id: string | null;
  stripe_biannual_price_id: string | null;
  stripe_annual_price_id: string | null;
  stripe_biennial_price_id: string | null;
  
  // Quota Limits
  max_brands: number;
  max_prompts_per_brand: number;
  max_competitors_per_brand: number;
  max_team_members: number;
  
  // Model Access
  allowed_models: ModelProvider[];
  max_model_platforms: number;
  
  // Geographic/Locale quotas
  max_locales_per_prompt: number;
  allowed_regions: string[];
  
  // Feature Flags
  features: SubscriptionFeatures;
  
  // Usage Limits
  monthly_run_limit: number | null;
  monthly_report_limit: number | null;
  data_retention_months: number | null;
  
  // Status
  is_active: boolean;
  is_public: boolean;
  sort_order: number | null;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface AccountSubscription {
  id: string;
  account_id: string;
  plan_id: string;
  
  // Subscription Details
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  
  // Dates
  current_period_start: string;
  current_period_end: string;
  trial_start: string | null;
  trial_end: string | null;
  canceled_at: string | null;
  ended_at: string | null;
  
  // Billing
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  amount_paid: number | null;
  currency: string;
  
  // Auto-renewal
  auto_renew: boolean;
  next_billing_date: string | null;
  
  // Custom Quota Overrides
  custom_max_brands: number | null;
  custom_max_prompts_per_brand: number | null;
  custom_max_competitors_per_brand: number | null;
  custom_max_team_members: number | null;
  custom_max_model_platforms: number | null;
  custom_allowed_models: ModelProvider[] | null;
  
  // Metadata
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Relations (optional)
  plan?: SubscriptionPlan;
}

export interface AccountUsage {
  id: string;
  account_id: string;
  subscription_id: string | null;
  
  // Period tracking
  period_start: string;
  period_end: string;
  
  // Current Usage Counts
  brands_count: number;
  prompts_count: number;
  competitors_count: number;
  team_members_count: number;
  runs_run: number;
  reports_generated: number;
  
  // Model Platform Usage
  models_used: Record<string, number>;
  locales_used: string[];
  
  // Detailed breakdown by brand
  usage_by_brand: Record<string, {
    prompts: number;
    competitors: number;
    runs: number;
    reports: number;
  }>;
  
  // Warnings
  warnings: Array<{
    type: string;
    resource: string;
    message: string;
    timestamp: string;
  }>;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface SubscriptionHistory {
  id: string;
  account_id: string;
  subscription_id: string | null;
  
  // Event Details
  event_type: SubscriptionEventType;
  event_data: Record<string, any>;
  
  // Changes
  previous_plan_id: string | null;
  new_plan_id: string | null;
  previous_status: SubscriptionStatus | null;
  new_status: SubscriptionStatus | null;
  
  // Financial
  amount: number | null;
  currency: string;
  
  // Metadata
  triggered_by: string | null;
  ip_address: string | null;
  user_agent: string | null;
  notes: string | null;
  created_at: string;
}

export interface BrandQuota {
  id: string;
  brand_id: string;
  account_id: string;
  
  // Allocated Quotas
  max_prompts: number;
  max_competitors: number;
  max_model_platforms: number;
  allowed_models: ModelProvider[];
  max_locales: number;
  
  // Current Usage
  current_prompts_count: number;
  current_competitors_count: number;
  current_models_count: number;
  current_locales_count: number;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface SubscriptionQuotas {
  subscription_id: string;
  plan_name: string;
  plan_tier: PlanTier;
  status: SubscriptionStatus;
  max_brands: number;
  max_prompts_per_brand: number;
  max_competitors_per_brand: number;
  max_team_members: number;
  max_model_platforms: number;
  allowed_models: ModelProvider[];
  max_locales_per_prompt: number;
  features: SubscriptionFeatures;
  current_period_end: string;
}

// Quota Check Response
export interface QuotaCheck {
  allowed: boolean;
  current: number;
  max: number;
  remaining: number;
  message?: string;
  plan_name?: string;
  plan_tier?: string;
}

// Pricing Calculator
export interface PricingCalculation {
  plan: SubscriptionPlan;
  billing_cycle: BillingCycle;
  price: number;
  discount_percent: number;
  monthly_equivalent: number;
  savings: number;
}

// Subscription Upgrade/Downgrade Preview
export interface SubscriptionChangePreview {
  current_plan: SubscriptionPlan;
  new_plan: SubscriptionPlan;
  price_difference: number;
  prorated_amount: number;
  quota_changes: {
    brands: { current: number; new: number };
    prompts_per_brand: { current: number; new: number };
    competitors_per_brand: { current: number; new: number };
    team_members: { current: number; new: number };
    model_platforms: { current: number; new: number };
  };
  effective_date: string;
  warnings: string[];
}
