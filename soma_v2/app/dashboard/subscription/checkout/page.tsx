'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBrand } from '@/lib/contexts/brand-context';
import { useSubscriptionPlans } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/layout/notification-toast';
import { ArrowLeft, Check, CreditCard, ShieldCheck, Loader2 } from 'lucide-react';
import { formatBillingCycle, getBillingCycleDiscount, getBillingPeriodLabel } from '@/lib/utils/subscription-utils';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentAccount } = useBrand();
  const { plans, loading: plansLoading } = useSubscriptionPlans();
  const { addToast } = useToast();
  
  const planId = searchParams.get('planId');
  const billingCycle = searchParams.get('billingCycle') as 'monthly' | 'quarterly' | 'biannual' | 'annual' | 'biennial';
  
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  useEffect(() => {
    if (plans.length > 0 && planId) {
      const plan = plans.find(p => p.id === planId);
      if (plan) {
        setSelectedPlan(plan);
      } else {
        addToast({
          type: 'error',
          title: 'Invalid Plan',
          message: 'The selected plan could not be found.',
        });
        router.push('/dashboard/subscription');
      }
    }
  }, [plans, planId, router, addToast]);

  const calculatePrice = () => {
    if (!selectedPlan || !billingCycle) return 0;
    
    switch (billingCycle) {
      case 'monthly':
        return selectedPlan.monthly_price_usd;
      case 'quarterly':
        return selectedPlan.quarterly_price_usd || selectedPlan.monthly_price_usd * 3;
      case 'biannual':
        return selectedPlan.biannual_price_usd || selectedPlan.monthly_price_usd * 6;
      case 'annual':
        return selectedPlan.annual_price_usd || selectedPlan.monthly_price_usd * 12;
      case 'biennial':
        return selectedPlan.biennial_price_usd || selectedPlan.monthly_price_usd * 24;
      default:
        return 0;
    }
  };

  const handleConfirmPayment = async () => {
    if (!currentAccount?.id || !selectedPlan) return;
    
    setProcessing(true);
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: currentAccount.id,
          plan_id: selectedPlan.id,
          billing_cycle: billingCycle,
        }),
      });
      
      const result = await response.json();
      
      if (result.url) {
        // Redirect to Stripe Checkout
        window.location.href = result.url;
      } else {
        throw new Error(result.error || 'Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      addToast({
        type: 'error',
        title: 'Checkout Failed',
        message: error.message || 'An error occurred. Please try again.',
      });
      setProcessing(false);
    }
  };

  if (plansLoading || !selectedPlan) {
    return (
      <div className="container mx-auto px-6 py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
            <p className="text-muted-foreground">Review your subscription details and confirm payment</p>
          </div>
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Loading checkout details...</p>
          </div>
        </div>
      </div>
    );
  }

  const price = calculatePrice();
  const discount = getBillingCycleDiscount(billingCycle);
  const monthlyEquivalent = billingCycle !== 'monthly'
    ? price / ({ monthly: 1, quarterly: 3, biannual: 6, annual: 12, biennial: 24 }[billingCycle] || 1)
    : null;

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="mx-auto max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center">
          <button
            onClick={() => router.back()}
            disabled={processing}
            className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Plans
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Complete your purchase</h1>
          <p className="mt-2 text-gray-500">You&apos;re one step away from unlocking {selectedPlan.display_name}</p>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          {/* Plan Header */}
          <div className="bg-black px-8 py-6 text-center">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">{selectedPlan.display_name} Plan</p>
            <div className="mt-3 flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold text-white">${Math.round(monthlyEquivalent ?? price)}</span>
              <span className="text-lg text-gray-400">/mo</span>
            </div>
            {monthlyEquivalent && (
              <p className="mt-2 text-sm text-gray-400">
                Billed as ${price.toFixed(2)} / {getBillingPeriodLabel(billingCycle)}
              </p>
            )}
            {discount > 0 && (
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#FF760D]/20 px-3 py-1 text-sm font-medium text-[#FF760D]">
                <Check className="h-3.5 w-3.5" />
                Saving {discount}% with {formatBillingCycle(billingCycle).toLowerCase()} billing
              </span>
            )}
          </div>

          {/* Order Details */}
          <div className="px-8 py-6 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium text-gray-900">${price.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Tax</span>
              <span className="text-gray-500">Calculated at checkout</span>
            </div>
            <div className="h-px bg-gray-200" />
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-gray-900">Total due today</span>
              <span className="text-2xl font-bold text-gray-900">${price.toFixed(2)}</span>
            </div>
          </div>

          {/* CTA */}
          <div className="px-8 pb-8">
            <button
              onClick={handleConfirmPayment}
              disabled={processing}
              className="w-full rounded-xl bg-[#FF760D] px-6 py-4 text-base font-semibold text-white transition-all hover:bg-[#e5690b] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Redirecting to Stripe...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  Proceed to Payment — ${price.toFixed(2)}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            <span>SSL Encrypted</span>
          </div>
          <div className="h-3 w-px bg-gray-300" />
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            <span>Powered by Stripe</span>
          </div>
          <div className="h-3 w-px bg-gray-300" />
          <span>Cancel anytime</span>
        </div>

        {/* Legal */}
        <p className="text-center text-xs text-gray-400 leading-relaxed">
          By proceeding, you agree to our Terms of Service and Privacy Policy.
          Your subscription will automatically renew unless canceled before the end of the billing period.
        </p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-6 py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
            <p className="text-muted-foreground">Review your subscription details and confirm payment</p>
          </div>
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
