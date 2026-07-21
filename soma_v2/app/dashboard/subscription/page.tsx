// ============================================================================
// SUBSCRIPTION PAGE - View subscription details and manage plan
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBrand } from '@/lib/contexts/brand-context';
import { useAccountSubscription, useSubscriptionPlans } from '@/hooks/use-subscription';
import { SubscriptionPlans } from '@/components/subscription/subscription-plans';
import { QuotaUsage } from '@/components/subscription/quota-usage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/layout/notification-toast';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  ArrowUpRight,
  RotateCcw,
  Shield,
  Zap,
  X,
} from 'lucide-react';
import type { BillingCycle } from '@/lib/types/subscription';

export default function SubscriptionPage() {
  const router = useRouter();
  const { currentAccount, currentBrand, isLoading: brandLoading } = useBrand();
  const { subscription, quotas, loading, error, refresh } = useAccountSubscription(currentAccount?.id || null);
  const { plans } = useSubscriptionPlans();
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [renewingPlan, setRenewingPlan] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('refresh') === 'true') {
      window.history.replaceState({}, '', '/dashboard/subscription');
      refresh();
    }
  }, [refresh]);

  const handlePlanChange = async (plan: any, billingCycle: BillingCycle) => {
    if (!currentAccount?.id) {
      addToast({ type: 'error', title: 'Error', message: 'No account selected. Please refresh the page.' });
      return;
    }
    setChangingPlan(true);
    router.push(`/dashboard/subscription/checkout?planId=${plan.id}&billingCycle=${billingCycle}`);
  };

  const handleManageBilling = async () => {
    if (!currentAccount?.id) return;
    setOpeningPortal(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: currentAccount.id }),
      });
      const result = await response.json();
      if (result.url) {
        window.location.href = result.url;
      } else {
        throw new Error(result.error || 'Failed to open billing portal');
      }
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error', message: error.message || 'Could not open billing portal.' });
      setOpeningPortal(false);
    }
  };

  const handleRenewPlan = () => {
    if (!subscription) return;
    setRenewingPlan(true);
    router.push(`/dashboard/subscription/checkout?planId=${subscription.plan_id}&billingCycle=${subscription.billing_cycle}`);
  };

  // Loading
  if (brandLoading || loading) {
    return (
      <div className="container mx-auto px-6 py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Subscription & Billing</h1>
            <p className="text-muted-foreground">Manage your plan, usage, and payment method</p>
          </div>
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Loading subscription...</p>
          </div>
        </div>
      </div>
    );
  }

  // No subscription
  if (!brandLoading && !loading && (!subscription || !quotas)) {
    return (
      <div className="container mx-auto px-6 py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Subscription & Billing</h1>
            <p className="text-muted-foreground">Manage your plan, usage, and payment method</p>
          </div>

        <div className="rounded-xl border border-orange-200 dark:border-orange-800/50 bg-orange-50/50 dark:bg-orange-950/10 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-2.5">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 dark:text-orange-100">No Active Subscription</h3>
              <p className="text-sm text-orange-800/80 dark:text-orange-200/70 mt-1">
                {error || 'Choose a plan to unlock AI visibility tracking, competitor monitoring, and brand optimization.'}
              </p>
              <Button onClick={() => setShowPlanSelection(true)} className="mt-4" size="sm">
                <Zap className="h-4 w-4 mr-1.5" />
                Get Started
              </Button>
            </div>
          </div>
        </div>

          {showPlanSelection && (
            <PlanSelectionModal
              currentPlanId={undefined}
              onSelectPlan={handlePlanChange}
              isChangingPlan={changingPlan}
              onClose={() => setShowPlanSelection(false)}
            />
          )}
        </div>
      </div>
    );
  }

  const daysUntilRenewal = Math.ceil(
    (new Date(subscription.current_period_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const effectiveStatus = ['active', 'trialing'].includes(subscription.status) && daysUntilRenewal <= 0
    ? 'expired'
    : subscription.status;

  const isExpired = effectiveStatus === 'expired';
  const isPastDue = effectiveStatus === 'past_due';
  const isActive = effectiveStatus === 'active';
  const isTrial = effectiveStatus === 'trialing';

  const billingLabel = {
    monthly: 'month',
    quarterly: '3 months',
    biannual: '6 months',
    annual: 'year',
    biennial: '2 years',
  }[subscription.billing_cycle] || subscription.billing_cycle;

  const planPrice = (() => {
    if (!plans.length) return null;
    const currentPlan = plans.find(p => p.id === subscription.plan_id);
    if (!currentPlan) return null;
    switch (subscription.billing_cycle) {
      case 'monthly': return currentPlan.monthly_price_usd;
      case 'quarterly': return currentPlan.quarterly_price_usd;
      case 'biannual': return currentPlan.biannual_price_usd;
      case 'annual': return currentPlan.annual_price_usd;
      case 'biennial': return currentPlan.biennial_price_usd;
      default: return currentPlan.monthly_price_usd;
    }
  })();

  return (
    <div className="container mx-auto px-6 py-6">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subscription & Billing</h1>
          <p className="text-muted-foreground">Manage your plan, usage, and payment method</p>
        </div>
        {subscription.stripe_subscription_id && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleManageBilling}
            disabled={openingPortal}
            className="hidden sm:flex"
          >
            {openingPortal ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-1.5 h-4 w-4" />}
            Manage in Stripe
          </Button>
        )}
      </div>

      {/* ─── Expired / Past Due Banner ─── */}
      {(isExpired || isPastDue) && (
        <div className={`rounded-xl border p-5 mb-6 ${
          isExpired 
            ? 'border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/10' 
            : 'border-orange-200 dark:border-orange-800/50 bg-orange-50/50 dark:bg-orange-950/10'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className={`rounded-full p-2.5 self-start ${
              isExpired 
                ? 'bg-red-100 dark:bg-red-900/30' 
                : 'bg-orange-100 dark:bg-orange-900/30'
            }`}>
              <AlertCircle className={`h-5 w-5 ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold ${isExpired ? 'text-red-900 dark:text-red-100' : 'text-orange-900 dark:text-orange-100'}`}>
                {isExpired ? 'Your subscription has expired' : 'Payment issue — action required'}
              </h3>
              <p className={`text-sm mt-0.5 ${isExpired ? 'text-red-800/80 dark:text-red-200/70' : 'text-orange-800/80 dark:text-orange-200/70'}`}>
                {isExpired
                  ? 'Renew now to restore access to AI visibility tracking and competitor monitoring.'
                  : 'Please update your payment method to avoid service interruption.'}
              </p>
            </div>
            <div className="flex gap-2 self-start sm:self-center">
              {isExpired && (
                <Button size="sm" onClick={handleRenewPlan} disabled={renewingPlan}>
                  {renewingPlan ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-1.5" />}
                  {renewingPlan ? 'Redirecting...' : 'Renew Plan'}
                </Button>
              )}
              <Button size="sm" variant={isExpired ? 'outline' : 'default'} onClick={() => setShowPlanSelection(true)}>
                <ArrowUpRight className="h-4 w-4 mr-1.5" />
                {isExpired ? 'Change Plan' : 'Update Payment'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Plan Overview Card ─── */}
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            {/* Left: Plan Info */}
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <h2 className="text-xl font-semibold capitalize">{quotas.plan_name} Plan</h2>
                    <StatusBadge status={effectiveStatus} />
                  </div>
                  {planPrice ? (
                    <p className="text-sm text-muted-foreground">
                      <span className="text-lg font-semibold text-foreground">${planPrice}</span>
                      <span className="text-muted-foreground">/{billingLabel}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground capitalize">{subscription.billing_cycle} billing</p>
                  )}
                </div>
              </div>

              {/* Key details */}
              <div className="grid grid-cols-2 gap-4 mt-5">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Billing Period</p>
                  <p className="text-sm font-medium">
                    {new Date(subscription.current_period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' — '}
                    {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  {isActive && daysUntilRenewal > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {subscription.auto_renew ? 'Renews' : 'Expires'} in {daysUntilRenewal} day{daysUntilRenewal !== 1 ? 's' : ''}
                    </p>
                  )}
                  {isExpired && (
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-0.5">
                      Expired {Math.abs(daysUntilRenewal)} day{Math.abs(daysUntilRenewal) !== 1 ? 's' : ''} ago
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Auto-Renewal</p>
                  <div className="flex items-center gap-1.5">
                    {subscription.auto_renew ? (
                      <>
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-sm font-medium">Enabled</span>
                      </>
                    ) : (
                      <>
                        <div className="h-2 w-2 rounded-full bg-gray-400" />
                        <span className="text-sm font-medium">Disabled</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mt-6">
                {!isExpired && (
                  <Button variant="outline" size="sm" onClick={() => setShowPlanSelection(true)}>
                    <ArrowUpRight className="h-3.5 w-3.5 mr-1.5" />
                    Upgrade Plan
                  </Button>
                )}
                {subscription.stripe_subscription_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManageBilling}
                    disabled={openingPortal}
                    className="sm:hidden"
                  >
                    {openingPortal ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="mr-1.5 h-3.5 w-3.5" />}
                    Billing Portal
                  </Button>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="hidden lg:block w-px bg-border" />
            <Separator className="lg:hidden" />

            {/* Right: Included */}
            <div className="flex-1 p-6 bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">What's Included</p>
              <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                <FeatureItem label={`${quotas.max_brands} ${quotas.max_brands === 1 ? 'Brand' : 'Brands'}`} />
                <FeatureItem label={`${quotas.max_prompts_per_brand} Prompts / brand`} />
                <FeatureItem label={`${quotas.max_competitors_per_brand} Competitors / brand`} />
                <FeatureItem label={`${quotas.max_team_members} Team members`} />
                <FeatureItem label={`${quotas.max_model_platforms} AI platforms`} />
                <FeatureItem label={`${quotas.max_locales_per_prompt} Locales / prompt`} />
                {quotas.features.api_access && <FeatureItem label="API Access" />}
                {quotas.features.white_label && <FeatureItem label="White Label" />}
                {quotas.features.priority_support && <FeatureItem label="Priority Support" />}
                {quotas.features.advanced_analytics && <FeatureItem label="Advanced Analytics" />}
                {quotas.features.competitor_tracking && <FeatureItem label="Competitor Tracking" />}
                {quotas.features.export_reports && <FeatureItem label="Export Reports" />}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Usage ─── */}
      {currentBrand && (
        <Card className="border border-gray-200 shadow-none bg-white overflow-hidden">
          <CardContent className="p-6">
            <QuotaUsage brandId={currentBrand.id} accountId={currentAccount?.id} />
          </CardContent>
        </Card>
      )}

      {/* ─── Security footer ─── */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-4">
        <Shield className="h-3.5 w-3.5" />
        <span>Payments secured by Stripe. Cancel or change plans at any time.</span>
      </div>

      {/* ─── Plan Selection Modal ─── */}
      {showPlanSelection && (
        <PlanSelectionModal
          currentPlanId={subscription.plan_id}
          currentStatus={subscription.status}
          onSelectPlan={handlePlanChange}
          isChangingPlan={changingPlan}
          onClose={() => setShowPlanSelection(false)}
        />
      )}
      </div>
    </div>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    active: { label: 'Active', className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800' },
    trialing: { label: 'Trial', className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800' },
    past_due: { label: 'Past Due', className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800' },
    canceled: { label: 'Canceled', className: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700' },
    expired: { label: 'Expired', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800' },
  };
  const { label, className } = config[status] || config.canceled;
  return <Badge variant="outline" className={`text-[11px] font-medium ${className}`}>{label}</Badge>;
}

function FeatureItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500 flex-shrink-0" />
      <span className="text-foreground/90">{label}</span>
    </div>
  );
}

function PlanSelectionModal({
  currentPlanId,
  currentStatus,
  onSelectPlan,
  isChangingPlan,
  onClose,
}: {
  currentPlanId?: string;
  currentStatus?: string;
  onSelectPlan: (plan: any, billingCycle: BillingCycle) => void;
  isChangingPlan: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-7xl max-h-[95vh] overflow-y-auto rounded-xl bg-background border">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Choose a Plan</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Upgrade or change your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-6">
          <SubscriptionPlans
            currentPlanId={currentPlanId}
            currentStatus={currentStatus}
            onSelectPlan={onSelectPlan}
            showComparison={false}
            isChangingPlan={isChangingPlan}
          />
        </div>
      </div>
    </div>
  );
}
