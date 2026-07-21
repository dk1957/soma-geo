// ============================================================================
// SUBSCRIPTION SERVICE - Client and Server Helper Functions
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import type {
  SubscriptionPlan,
  AccountSubscription,
  SubscriptionQuotas,
  BrandQuota,
  QuotaCheck,
  PricingCalculation,
  BillingCycle,
  ModelProvider,
  SubscriptionChangePreview,
} from '@/lib/types/subscription';

/**
 * Get all available subscription plans
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .eq('is_public', true)
    .order('sort_order', { ascending: true });
  
  if (error) {
    console.error('Error fetching subscription plans:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Get a specific subscription plan by slug
 */
export async function getSubscriptionPlanBySlug(slug: string): Promise<SubscriptionPlan | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('plan_slug', slug)
    .eq('is_active', true)
    .single();
  
  if (error) {
    console.error('Error fetching subscription plan:', error);
    return null;
  }
  
  return data;
}

/**
 * Get account's active subscription with quotas
 */
export async function getAccountSubscription(accountId: string): Promise<SubscriptionQuotas | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('get_account_subscription_quotas', {
    p_account_id: accountId,
  });
  
  if (error) {
    console.error('Error fetching account subscription:', error);
    return null;
  }
  
  return data?.[0] || null;
}

/**
 * Get full subscription details with plan information
 */
export async function getFullSubscriptionDetails(accountId: string): Promise<(AccountSubscription & { plan: SubscriptionPlan }) | null> {
  const supabase = await createClient();
  
  // First try to find an active/trialing subscription
  const { data, error } = await supabase
    .from('account_subscriptions')
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .eq('account_id', accountId)
    .in('status', ['active', 'trialing'])
    .order('current_period_end', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching full subscription:', error);
    return null;
  }

  // If no active sub found, get the most recent one (expired/canceled)
  // so the subscription page can still show details
  if (!data) {
    const { data: recentSub } = await supabase
      .from('account_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('account_id', accountId)
      .order('current_period_end', { ascending: false })
      .limit(1)
      .maybeSingle();
    return recentSub;
  }
  
  return data;
}

/**
 * Get brand quota information
 */
export async function getBrandQuota(brandId: string): Promise<BrandQuota | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('brand_quotas')
    .select('*')
    .eq('brand_id', brandId)
    .single();
  
  if (error) {
    console.error('Error fetching brand quota:', error);
    return null;
  }
  
  return data;
}

/**
 * Check if account can create a new brand
 */
export async function canCreateBrand(accountId: string): Promise<QuotaCheck> {
  const supabase = await createClient();
  
  const { data: canCreate, error } = await supabase.rpc('can_create_brand', {
    p_account_id: accountId,
  });
  
  if (error) {
    console.error('Error checking brand quota:', error);
    return {
      allowed: false,
      current: 0,
      max: 0,
      remaining: 0,
      message: 'Error checking quota',
    };
  }
  
  // Get current counts
  const quotas = await getAccountSubscription(accountId);
  const { count: currentBrands } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', accountId)
    .eq('is_active', true);
  
  const max = quotas?.max_brands || 0;
  const current = currentBrands || 0;
  
  return {
    allowed: canCreate as boolean,
    current,
    max,
    remaining: Math.max(0, max - current),
    message: canCreate ? undefined : `Brand limit reached (${max} max)`,
    plan_name: quotas?.plan_name,
    plan_tier: quotas?.plan_tier,
  };
}

/**
 * Check if brand can add a new prompt
 */
export async function canAddPrompt(brandId: string): Promise<QuotaCheck> {
  const supabase = await createClient();
  
  const { data: canAdd, error } = await supabase.rpc('can_add_prompt', {
    p_brand_id: brandId,
  });
  
  if (error) {
    console.error('Error checking prompt quota:', error);
    return {
      allowed: false,
      current: 0,
      max: 0,
      remaining: 0,
      message: 'Error checking quota',
    };
  }
  
  // Get current counts
  const quota = await getBrandQuota(brandId);

  // Get plan info from account subscription
  let plan_name: string | undefined;
  let plan_tier: string | undefined;
  if (quota?.account_id) {
    const accountQuotas = await getAccountSubscription(quota.account_id);
    plan_name = accountQuotas?.plan_name;
    plan_tier = accountQuotas?.plan_tier;
  }
  
  return {
    allowed: canAdd as boolean,
    current: quota?.current_prompts_count || 0,
    max: quota?.max_prompts || 0,
    remaining: Math.max(0, (quota?.max_prompts || 0) - (quota?.current_prompts_count || 0)),
    message: canAdd ? undefined : `Prompt limit reached (${quota?.max_prompts} max)`,
    plan_name,
    plan_tier,
  };
}

/**
 * Check if brand can add a new competitor
 */
export async function canAddCompetitor(brandId: string): Promise<QuotaCheck> {
  const supabase = await createClient();
  
  const { data: canAdd, error } = await supabase.rpc('can_add_competitor', {
    p_brand_id: brandId,
  });
  
  if (error) {
    console.error('Error checking competitor quota:', error);
    return {
      allowed: false,
      current: 0,
      max: 0,
      remaining: 0,
      message: 'Error checking quota',
    };
  }
  
  // Get current counts
  const quota = await getBrandQuota(brandId);

  // Get plan info from account subscription
  let cpPlanName: string | undefined;
  let cpPlanTier: string | undefined;
  if (quota?.account_id) {
    const accountQuotas = await getAccountSubscription(quota.account_id);
    cpPlanName = accountQuotas?.plan_name;
    cpPlanTier = accountQuotas?.plan_tier;
  }
  
  return {
    allowed: canAdd as boolean,
    current: quota?.current_competitors_count || 0,
    max: quota?.max_competitors || 0,
    remaining: Math.max(0, (quota?.max_competitors || 0) - (quota?.current_competitors_count || 0)),
    message: canAdd ? undefined : `Competitor limit reached (${quota?.max_competitors} max)`,
    plan_name: cpPlanName,
    plan_tier: cpPlanTier,
  };
}

/**
 * Check if brand can use a specific model provider
 */
export async function canUseModelProvider(
  brandId: string,
  provider: ModelProvider
): Promise<QuotaCheck> {
  const quota = await getBrandQuota(brandId);
  
  if (!quota) {
    return {
      allowed: false,
      current: 0,
      max: 0,
      remaining: 0,
      message: 'Brand quota not found',
    };
  }
  
  const allowed = quota.allowed_models.includes(provider);
  
  return {
    allowed,
    current: quota.current_models_count,
    max: quota.max_model_platforms,
    remaining: Math.max(0, quota.max_model_platforms - quota.current_models_count),
    message: allowed ? undefined : `Model provider ${provider} not included in your plan`,
  };
}

/**
 * Calculate pricing for different billing cycles
 */
export function calculatePricing(
  plan: SubscriptionPlan,
  billingCycle: BillingCycle
): PricingCalculation {
  let price: number;
  let discountPercent = 0;
  
  switch (billingCycle) {
    case 'monthly':
      price = plan.monthly_price_usd;
      break;
    case 'quarterly':
      price = plan.quarterly_price_usd || plan.monthly_price_usd * 3;
      discountPercent = ((plan.monthly_price_usd * 3 - price) / (plan.monthly_price_usd * 3)) * 100;
      break;
    case 'biannual':
      price = plan.biannual_price_usd || plan.monthly_price_usd * 6;
      discountPercent = ((plan.monthly_price_usd * 6 - price) / (plan.monthly_price_usd * 6)) * 100;
      break;
    case 'annual':
      price = plan.annual_price_usd || plan.monthly_price_usd * 12;
      discountPercent = ((plan.monthly_price_usd * 12 - price) / (plan.monthly_price_usd * 12)) * 100;
      break;
    case 'biennial':
      price = plan.biennial_price_usd || plan.monthly_price_usd * 24;
      discountPercent = ((plan.monthly_price_usd * 24 - price) / (plan.monthly_price_usd * 24)) * 100;
      break;
  }
  
  const monthlyEquivalent = billingCycle === 'monthly' ? price : price / getCycleMonths(billingCycle);
  const savings = (plan.monthly_price_usd - monthlyEquivalent) * getCycleMonths(billingCycle);
  
  return {
    plan,
    billing_cycle: billingCycle,
    price,
    discount_percent: Math.round(discountPercent * 100) / 100,
    monthly_equivalent: Math.round(monthlyEquivalent * 100) / 100,
    savings: Math.round(savings * 100) / 100,
  };
}

/**
 * Get number of months in a billing cycle
 */
function getCycleMonths(cycle: BillingCycle): number {
  switch (cycle) {
    case 'monthly': return 1;
    case 'quarterly': return 3;
    case 'biannual': return 6;
    case 'annual': return 12;
    case 'biennial': return 24;
  }
}

/**
 * Preview subscription plan change
 */
export async function previewSubscriptionChange(
  accountId: string,
  newPlanSlug: string
): Promise<SubscriptionChangePreview | null> {
  const currentSubscription = await getFullSubscriptionDetails(accountId);
  const newPlan = await getSubscriptionPlanBySlug(newPlanSlug);
  
  if (!currentSubscription || !newPlan) {
    return null;
  }
  
  const currentPlan = currentSubscription.plan;
  const priceDiff = newPlan.monthly_price_usd - currentPlan.monthly_price_usd;
  
  // Calculate prorated amount based on days remaining
  const now = new Date();
  const periodEnd = new Date(currentSubscription.current_period_end);
  const periodStart = new Date(currentSubscription.current_period_start);
  const totalDays = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
  const remainingDays = (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  const proratedAmount = (priceDiff * remainingDays) / totalDays;
  
  // Check for quota downgrades that might cause issues
  const warnings: string[] = [];
  const quotas = await getAccountSubscription(accountId);
  
  if (quotas) {
    if (quotas.max_brands > newPlan.max_brands) {
      warnings.push(`You currently have ${quotas.max_brands} brands, but the new plan only allows ${newPlan.max_brands}`);
    }
  }
  
  return {
    current_plan: currentPlan,
    new_plan: newPlan,
    price_difference: Math.round(priceDiff * 100) / 100,
    prorated_amount: Math.round(proratedAmount * 100) / 100,
    quota_changes: {
      brands: { current: currentPlan.max_brands, new: newPlan.max_brands },
      prompts_per_brand: { current: currentPlan.max_prompts_per_brand, new: newPlan.max_prompts_per_brand },
      competitors_per_brand: { current: currentPlan.max_competitors_per_brand, new: newPlan.max_competitors_per_brand },
      team_members: { current: currentPlan.max_team_members, new: newPlan.max_team_members },
      model_platforms: { current: currentPlan.max_model_platforms, new: newPlan.max_model_platforms },
    },
    effective_date: new Date().toISOString(),
    warnings,
  };
}

/**
 * Get subscription expiration warning
 */
export function getExpirationWarning(subscription: AccountSubscription | SubscriptionQuotas): {
  isExpiring: boolean;
  daysRemaining: number;
  severity: 'info' | 'warning' | 'error';
  message: string;
} | null {
  const now = new Date();
  const periodEnd = new Date('current_period_end' in subscription ? subscription.current_period_end : '');
  const daysRemaining = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysRemaining < 0) {
    return {
      isExpiring: true,
      daysRemaining: 0,
      severity: 'error',
      message: 'Your subscription has expired',
    };
  }
  
  if (daysRemaining <= 3) {
    return {
      isExpiring: true,
      daysRemaining,
      severity: 'error',
      message: `Your subscription expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
    };
  }
  
  if (daysRemaining <= 7) {
    return {
      isExpiring: true,
      daysRemaining,
      severity: 'warning',
      message: `Your subscription expires in ${daysRemaining} days`,
    };
  }
  
  if (daysRemaining <= 14) {
    return {
      isExpiring: true,
      daysRemaining,
      severity: 'info',
      message: `Your subscription renews in ${daysRemaining} days`,
    };
  }
  
  return null;
}

/**
 * Format model provider name for display
 */
export function formatModelProviderName(provider: ModelProvider): string {
  const names: Record<ModelProvider, string> = {
    openai: 'OpenAI (ChatGPT)',
    anthropic: 'Anthropic (Claude)',
    google: 'Google (Gemini)',
    perplexity: 'Perplexity',
    xai: 'xAI (Grok)',
    meta: 'Meta (Llama)',
  };
  return names[provider] || provider;
}

/**
 * Get recommended plan based on usage
 */
export async function getRecommendedPlan(accountId: string): Promise<{
  current: SubscriptionPlan | null;
  recommended: SubscriptionPlan | null;
  reason: string;
} | null> {
  const subscription = await getFullSubscriptionDetails(accountId);
  const plans = await getSubscriptionPlans();
  
  if (!subscription) {
    return {
      current: null,
      recommended: plans.find(p => p.plan_tier === 'growth') || null,
      reason: 'Start with Growth plan to get started',
    };
  }
  
  const currentPlan = subscription.plan;
  const quotas = await getAccountSubscription(accountId);
  
  if (!quotas) return null;
  
  // Check if user is hitting limits
  const supabase = await createClient();
  const { count: brandsCount } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', accountId)
    .eq('is_active', true);
  
  const utilizationPercent = ((brandsCount || 0) / quotas.max_brands) * 100;
  
  if (utilizationPercent >= 80 && currentPlan.plan_tier !== 'enterprise') {
    const nextTier = currentPlan.plan_tier === 'growth' ? 'pro' : 'enterprise';
    const recommended = plans.find(p => p.plan_tier === nextTier);
    
    return {
      current: currentPlan,
      recommended: recommended || null,
      reason: `You're using ${Math.round(utilizationPercent)}% of your brand limit. Consider upgrading for more capacity.`,
    };
  }
  
  return {
    current: currentPlan,
    recommended: null,
    reason: 'Your current plan meets your needs',
  };
}
