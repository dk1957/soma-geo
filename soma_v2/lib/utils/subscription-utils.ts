// ============================================================================
// SUBSCRIPTION UTILITIES - Client-Safe Helper Functions
// ============================================================================

import type { ModelProvider } from '@/lib/types/subscription';

/**
 * Format model provider name for display
 */
export function formatModelProviderName(provider: ModelProvider): string {
  const names: Record<ModelProvider, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic (Claude)',
    google: 'Google (Gemini)',
    meta: 'Meta (Llama)',
    xai: 'xAI (Grok)',
    perplexity: 'Perplexity',
  };
  return names[provider] || provider;
}

/**
 * Calculate percentage for progress bars
 */
export function calculateQuotaPercentage(current: number, max: number): number {
  if (max === 0) return 0;
  if (max === 999) return 0; // Unlimited
  return Math.min(100, Math.round((current / max) * 100));
}

/**
 * Get status color based on usage percentage
 */
export function getQuotaStatusColor(percentage: number): string {
  if (percentage >= 90) return 'destructive';
  if (percentage >= 75) return 'warning';
  return 'success';
}

/**
 * Format billing cycle for display
 */
export function formatBillingCycle(cycle: string): string {
  const cycles: Record<string, string> = {
    monthly: '1 Month',
    quarterly: '3 Months',
    biannual: '6 Months',
    annual: '12 Months',
    biennial: '24 Months',
  };
  return cycles[cycle] || cycle;
}

/**
 * Calculate discount for billing cycle
 */
export function getBillingCycleDiscount(cycle: string): number {
  const discounts: Record<string, number> = {
    monthly: 0,
    quarterly: 10,
    biannual: 15,
    annual: 20,
    biennial: 25,
  };
  return discounts[cycle] || 0;
}

/**
 * Get number of months in a billing cycle
 */
export function getCycleMonths(cycle: string): number {
  const months: Record<string, number> = {
    monthly: 1,
    quarterly: 3,
    biannual: 6,
    annual: 12,
    biennial: 24,
  };
  return months[cycle] || 1;
}

/**
 * Get billing period label (e.g. "month", "3 months", "year")
 */
export function getBillingPeriodLabel(cycle: string): string {
  const labels: Record<string, string> = {
    monthly: 'month',
    quarterly: '3 months',
    biannual: '6 months',
    annual: 'year',
    biennial: '2 years',
  };
  return labels[cycle] || cycle;
}
