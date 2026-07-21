// ============================================================================
// SUBSCRIPTION PLANS COMPONENT
// Displays available subscription plans with quota comparison
// ============================================================================

'use client';

import { useState } from 'react';
import { Check, X, Zap, Crown, Building2, Loader2 } from 'lucide-react';
import { useSubscriptionPlans } from '@/hooks/use-subscription';
import type { SubscriptionPlan, BillingCycle } from '@/lib/types/subscription';

interface SubscriptionPlansProps {
  currentPlanId?: string;
  currentStatus?: string;
  onSelectPlan?: (plan: SubscriptionPlan, billingCycle: BillingCycle) => void;
  showComparison?: boolean;
  isChangingPlan?: boolean;
}

export function SubscriptionPlans({
  currentPlanId,
  currentStatus,
  onSelectPlan,
  showComparison = true,
  isChangingPlan = false,
}: SubscriptionPlansProps) {
  const { plans, loading, error } = useSubscriptionPlans();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  const calculatePrice = (plan: SubscriptionPlan) => {
    switch (billingCycle) {
      case 'monthly':
        return plan.monthly_price_usd;
      case 'quarterly':
        return plan.quarterly_price_usd || plan.monthly_price_usd * 3;
      case 'biannual':
        return plan.biannual_price_usd || plan.monthly_price_usd * 6;
      case 'annual':
        return plan.annual_price_usd || plan.monthly_price_usd * 12;
      case 'biennial':
        return plan.biennial_price_usd || plan.monthly_price_usd * 24;
    }
  };

  const cycleMonths: Record<BillingCycle, number> = {
    monthly: 1,
    quarterly: 3,
    biannual: 6,
    annual: 12,
    biennial: 24,
  };

  const calculateMonthlyEquivalent = (plan: SubscriptionPlan) => {
    const price = calculatePrice(plan);
    return price / cycleMonths[billingCycle];
  };

  const calculateSavings = (plan: SubscriptionPlan) => {
    if (billingCycle === 'monthly') return 0;
    const monthlyPrice = plan.monthly_price_usd;
    const actualPrice = calculatePrice(plan);
    const months = cycleMonths[billingCycle];
    return (monthlyPrice * months) - actualPrice;
  };

  const getPlanIcon = (tier: string) => {
    switch (tier) {
      case 'growth':
        return <Zap className="h-6 w-6" />;
      case 'pro':
        return <Crown className="h-6 w-6" />;
      case 'enterprise':
        return <Building2 className="h-6 w-6" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-4">
        <div className="inline-flex rounded-lg border border-border bg-muted p-1">
          {(['monthly', 'quarterly', 'biannual', 'annual', 'biennial'] as BillingCycle[]).map((cycle) => {
            const months = cycleMonths[cycle];
            const savingsPct = plans[0] && months > 1
              ? Math.round(((plans[0].monthly_price_usd * months - calculatePrice(plans[0])) / (plans[0].monthly_price_usd * months)) * 100)
              : 0;
            return (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === cycle
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background'
                }`}
              >
                {months} {months === 1 ? 'mo' : 'mo'}
                {savingsPct > 0 && (
                  <span className="ml-1 text-xs text-green-600 dark:text-green-400">
                    -{savingsPct}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const price = calculatePrice(plan);
          const monthlyEquivalent = calculateMonthlyEquivalent(plan);
          const savings = calculateSavings(plan);
          const isCurrentPlan = plan.id === currentPlanId;
          const isTrialing = currentStatus === 'trialing';
          const isDisabled = isCurrentPlan && !isTrialing;
          const isPopular = plan.plan_tier === 'pro';

          return (
            <div
              key={plan.id}
              className={`relative rounded-lg border-2 p-6 shadow-sm transition-all hover:shadow-md ${
                isCurrentPlan
                  ? 'border-primary bg-primary/5'
                  : isPopular
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm ${
                    isTrialing ? 'bg-orange-500' : 'bg-green-600'
                  }`}>
                    {isTrialing ? 'Trial' : 'Current Plan'}
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="mb-4 flex items-center gap-3">
                <div className={`rounded-lg p-2 ${
                  plan.plan_tier === 'growth' ? 'bg-blue-100 text-blue-600' :
                  plan.plan_tier === 'pro' ? 'bg-purple-100 text-purple-600' :
                  'bg-amber-100 text-amber-600'
                }`}>
                  {getPlanIcon(plan.plan_tier)}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{plan.display_name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
              </div>

              {/* Pricing */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">${Math.round(monthlyEquivalent)}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                {billingCycle !== 'monthly' && (
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      Billed every {cycleMonths[billingCycle]} months at ${price}
                    </p>
                    {savings > 0 && (
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        Save ${Math.round(savings)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Brands</span>
                  <span className="font-semibold">{plan.max_brands === 999 ? 'Unlimited' : plan.max_brands}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Prompts/brand</span>
                  <span className="font-semibold">{plan.max_prompts_per_brand === 999 ? 'Unlimited' : plan.max_prompts_per_brand}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Competitors/brand</span>
                  <span className="font-semibold">{plan.max_competitors_per_brand === 999 ? 'Unlimited' : plan.max_competitors_per_brand}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Team members</span>
                  <span className="font-semibold">{plan.max_team_members === 999 ? 'Unlimited' : plan.max_team_members}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">AI models</span>
                  <span className="font-semibold">{plan.max_model_platforms === 999 ? 'All' : plan.max_model_platforms}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Runs/month</span>
                  <span className="font-semibold">
                    {plan.monthly_run_limit === 99999 ? 'Unlimited' : plan.monthly_run_limit?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Feature List */}
              <div className="mb-6 space-y-2 border-t pt-4">
                {plan.features.advanced_analytics && (
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Advanced Analytics</span>
                  </div>
                )}
                {plan.features.competitor_tracking && (
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Competitor Tracking</span>
                  </div>
                )}
                {plan.features.api_access ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>API Access</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span>API Access</span>
                  </div>
                )}
                {plan.features.white_label ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>White Label</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span>White Label</span>
                  </div>
                )}
                {plan.features.priority_support ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Priority Support</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span>Priority Support</span>
                  </div>
                )}
                {plan.features.dedicated_account_manager && (
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Dedicated Account Manager</span>
                  </div>
                )}
              </div>

              {/* CTA Button */}
              {onSelectPlan ? (
                <button
                  type="button"
                  onClick={() => {
                    if (isDisabled || isChangingPlan) return;
                    onSelectPlan(plan, billingCycle);
                  }}
                  disabled={isDisabled || isChangingPlan}
                  className={`w-full rounded-lg px-4 py-3 font-semibold transition-all relative z-10 flex items-center justify-center gap-2 ${
                    isDisabled || isChangingPlan
                      ? 'cursor-not-allowed bg-muted text-muted-foreground'
                      : isCurrentPlan && isTrialing
                      ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm hover:shadow cursor-pointer'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow cursor-pointer'
                  }`}
                >
                  {isChangingPlan && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isDisabled ? 'Current Plan' : isChangingPlan ? 'Redirecting...' : isCurrentPlan && isTrialing ? 'Subscribe Now' : 'Select Plan'}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Comparison Table (Optional) */}
      {showComparison && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Feature</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="px-4 py-3 text-center text-sm font-semibold">
                    {plan.display_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-4 py-3 text-sm font-medium">Monthly Price</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-4 py-3 text-center text-sm">
                    ${plan.monthly_price_usd}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium">Brands</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-4 py-3 text-center text-sm">
                    {plan.max_brands === 999 ? '∞' : plan.max_brands}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium">Prompts per Brand</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-4 py-3 text-center text-sm">
                    {plan.max_prompts_per_brand === 999 ? '∞' : plan.max_prompts_per_brand}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium">Competitors per Brand</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-4 py-3 text-center text-sm">
                    {plan.max_competitors_per_brand === 999 ? '∞' : plan.max_competitors_per_brand}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium">Team Members</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-4 py-3 text-center text-sm">
                    {plan.max_team_members === 999 ? '∞' : plan.max_team_members}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium">AI Model Platforms</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-4 py-3 text-center text-sm">
                    {plan.max_model_platforms === 999 ? 'All' : plan.max_model_platforms}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
