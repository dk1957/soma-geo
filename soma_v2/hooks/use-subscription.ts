// ============================================================================
// SUBSCRIPTION HOOKS - Client-side React hooks
// ============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  SubscriptionPlan,
  AccountSubscription,
  SubscriptionQuotas,
  BrandQuota,
  QuotaCheck,
  ModelProvider,
  SubscriptionChangePreview,
} from '@/lib/types/subscription';

/**
 * Hook to fetch subscription plans
 */
export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch('/api/accounts/subscriptions/plans');
        const data = await response.json();
        
        if (data.success) {
          setPlans(data.plans);
        } else {
          setError(data.error || 'Failed to fetch plans');
        }
      } catch (err) {
        setError('Network error fetching plans');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPlans();
  }, []);

  return { plans, loading, error };
}

/**
 * Hook to fetch and manage account subscription
 */
export function useAccountSubscription(accountId: string | null) {
  const [subscription, setSubscription] = useState<AccountSubscription | null>(null);
  const [quotas, setQuotas] = useState<SubscriptionQuotas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accountId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/accounts/subscriptions/current?account_id=${accountId}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setSubscription(data.subscription);
        setQuotas(data.quotas);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch subscription');
      }
    } catch (err) {
      setError('Network error fetching subscription');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { subscription, quotas, loading, error, refresh };
}

/**
 * Hook to check quota for creating/adding resources
 */
export function useQuotaCheck(
  resourceType: 'brand' | 'prompt' | 'competitor' | 'model',
  accountId?: string,
  brandId?: string,
  modelProvider?: ModelProvider
) {
  const [quotaCheck, setQuotaCheck] = useState<QuotaCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        resource_type: resourceType,
      });
      
      if (accountId) params.append('account_id', accountId);
      if (brandId) params.append('brand_id', brandId);
      if (modelProvider) params.append('model_provider', modelProvider);
      
      const response = await fetch(`/api/accounts/subscriptions/quota/check?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setQuotaCheck(data.quota);
        setError(null);
      } else {
        setError(data.error || 'Failed to check quota');
      }
    } catch (err) {
      setError('Network error checking quota');
    } finally {
      setLoading(false);
    }
  }, [resourceType, accountId, brandId, modelProvider]);

  useEffect(() => {
    // Only check if we have the required IDs
    const hasRequiredIds = 
      (resourceType === 'brand' && accountId) ||
      ((resourceType === 'prompt' || resourceType === 'competitor') && brandId) ||
      (resourceType === 'model' && brandId && modelProvider);
    
    if (hasRequiredIds) {
      check();
    } else {
      setLoading(false);
    }
  }, [check, resourceType, accountId, brandId, modelProvider]);

  return { quotaCheck, loading, error, recheck: check };
}

/**
 * Hook to fetch brand quota
 */
export function useBrandQuota(brandId: string | null) {
  const [quota, setQuota] = useState<BrandQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!brandId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/accounts/subscriptions/brand-quota?brand_id=${brandId}`);
      const data = await response.json();
      
      if (data.success) {
        setQuota(data.quota);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch quota');
      }
    } catch (err) {
      setError('Network error fetching quota');
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { quota, loading, error, refresh };
}

/**
 * Hook to preview subscription plan changes
 */
export function useSubscriptionPreview(accountId: string | null, newPlanSlug: string | null) {
  const [preview, setPreview] = useState<SubscriptionChangePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreview = useCallback(async () => {
    if (!accountId || !newPlanSlug) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(
        `/api/accounts/subscriptions/preview-change?account_id=${accountId}&new_plan=${newPlanSlug}`
      );
      const data = await response.json();
      
      if (data.success) {
        setPreview(data.preview);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch preview');
      }
    } catch (err) {
      setError('Network error fetching preview');
    } finally {
      setLoading(false);
    }
  }, [accountId, newPlanSlug]);

  useEffect(() => {
    if (accountId && newPlanSlug) {
      fetchPreview();
    }
  }, [fetchPreview, accountId, newPlanSlug]);

  return { preview, loading, error, refresh: fetchPreview };
}

/**
 * Hook to check if a specific action is allowed based on quotas
 */
export function useCanPerformAction(
  action: 'create_brand' | 'add_prompt' | 'add_competitor' | 'use_model',
  accountId?: string,
  brandId?: string,
  modelProvider?: ModelProvider
) {
  const resourceTypeMap = {
    create_brand: 'brand',
    add_prompt: 'prompt',
    add_competitor: 'competitor',
    use_model: 'model',
  } as const;

  const { quotaCheck, loading, error, recheck } = useQuotaCheck(
    resourceTypeMap[action],
    accountId,
    brandId,
    modelProvider
  );

  return {
    canPerform: quotaCheck?.allowed ?? false,
    reason: quotaCheck?.message,
    current: quotaCheck?.current ?? 0,
    max: quotaCheck?.max ?? 0,
    remaining: quotaCheck?.remaining ?? 0,
    planName: quotaCheck?.plan_name,
    planTier: quotaCheck?.plan_tier,
    loading,
    error,
    recheck,
  };
}

/**
 * Hook for quota progress calculations
 */
export function useQuotaProgress(quota: BrandQuota | null) {
  if (!quota) {
    return {
      prompts: { used: 0, max: 0, percent: 0 },
      competitors: { used: 0, max: 0, percent: 0 },
      models: { used: 0, max: 0, percent: 0 },
      locales: { used: 0, max: 0, percent: 0 },
    };
  }

  const calculateProgress = (used: number, max: number) => ({
    used,
    max,
    percent: max > 0 ? Math.round((used / max) * 100) : 0,
  });

  return {
    prompts: calculateProgress(quota.current_prompts_count, quota.max_prompts),
    competitors: calculateProgress(quota.current_competitors_count, quota.max_competitors),
    models: calculateProgress(quota.current_models_count, quota.max_model_platforms),
    locales: calculateProgress(quota.current_locales_count, quota.max_locales),
  };
}
