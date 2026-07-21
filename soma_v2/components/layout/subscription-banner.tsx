"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Clock, Crown, X, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useBrand } from "@/lib/contexts/brand-context"

type BannerType = 'expiring' | 'expired' | 'trial_ending' | 'past_due' | null

interface SubscriptionStatus {
  is_valid: boolean
  status: string
  days_remaining: number | null
  plan_name: string | null
  is_trial: boolean
}

export function SubscriptionBanner() {
  const { currentAccount } = useBrand()
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentAccount?.id) {
      setLoading(false)
      return
    }

    const cacheKey = `sub_status_${currentAccount.id}`
    
    // Check cache (5 min TTL)
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const { data, ts } = JSON.parse(cached)
        if (Date.now() - ts < 300_000) {
          setStatus(data)
          setLoading(false)
          return
        }
      }
    } catch {}

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/accounts/subscriptions/status?account_id=${currentAccount.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            setStatus(data.status)
            try {
              localStorage.setItem(cacheKey, JSON.stringify({ data: data.status, ts: Date.now() }))
            } catch {}
          }
        }
      } catch {
        // Fail silently
      } finally {
        setLoading(false)
      }
    }

    checkStatus()
  }, [currentAccount?.id])

  if (loading || dismissed || !status) return null

  let bannerType: BannerType = null
  // Show banner for various subscription states
  // Note: expired status is handled by the subscription page inline + PaywallOverlay
  if (status.status === 'past_due') {
    bannerType = 'past_due'
  } else if (status.is_trial && status.days_remaining != null && status.days_remaining <= 7) {
    bannerType = 'trial_ending'
  } else if (status.days_remaining != null && status.days_remaining <= 7 && status.days_remaining > 0) {
    bannerType = 'expiring'
  }

  if (!bannerType) return null

  const config = {
    expired: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />,
      message: 'Your subscription has expired. Upgrade now to restore access to all features.',
      cta: 'Upgrade Now',
      dismissible: false,
    },
    past_due: {
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-800',
      icon: <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />,
      message: 'Your payment is past due. Please update your billing information to avoid service interruption.',
      cta: 'Update Billing',
      dismissible: true,
    },
    trial_ending: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: <Clock className="h-4 w-4 text-blue-600 shrink-0" />,
      message: `Your free trial ends in ${status.days_remaining} day${status.days_remaining === 1 ? '' : 's'}. Subscribe to keep your data and continue tracking.`,
      cta: 'Choose a Plan',
      dismissible: true,
    },
    expiring: {
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-800',
      icon: <Clock className="h-4 w-4 text-amber-600 shrink-0" />,
      message: `Your ${status.plan_name || 'subscription'} plan renews in ${status.days_remaining} day${status.days_remaining === 1 ? '' : 's'}.`,
      cta: 'Manage Plan',
      dismissible: true,
    },
  }

  const cfg = config[bannerType]

  return (
    <div className={`border-b ${cfg.bg} px-4 py-2.5`}>
      <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {cfg.icon}
          <p className={`text-sm ${cfg.text}`}>{cfg.message}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant={bannerType === 'expired' ? 'default' : 'outline'}
            className="h-7 text-xs"
            onClick={() => window.location.href = '/dashboard/subscription'}
          >
            <Crown className="h-3 w-3 mr-1" />
            {cfg.cta}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
          {cfg.dismissible && (
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded hover:bg-black/5 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-zinc-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Paywall overlay for expired accounts.
 * Blocks dashboard content when subscription is expired.
 */
export function PaywallOverlay() {
  const { currentAccount } = useBrand()
  const [isExpired, setIsExpired] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''

  // Don't block subscription management pages — user must access them to renew
  const isSubscriptionPage = pathname.startsWith('/dashboard/subscription') || pathname.startsWith('/dashboard/settings')

  useEffect(() => {
    if (!currentAccount?.id || isSubscriptionPage) {
      setLoading(false)
      return
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/accounts/subscriptions/status?account_id=${currentAccount.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success && !data.status.is_valid && data.status.status === 'expired') {
            setIsExpired(true)
          }
        }
      } catch {} finally {
        setLoading(false)
      }
    }

    checkStatus()
  }, [currentAccount?.id, isSubscriptionPage])

  if (loading || !isExpired || dismissed) return null

  return (
    <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
      <div className="relative max-w-md mx-auto text-center p-8 bg-white rounded-xl border border-zinc-200">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-600"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-7 w-7 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-900 mb-2">Subscription Expired</h2>
        <p className="text-sm text-zinc-600 mb-6">
          Your subscription has expired and your account is currently inactive.
          Your data is safe — upgrade your plan to restore full access to your dashboard, 
          runs, and analytics.
        </p>
        <div className="flex flex-col gap-2">
          <Button onClick={() => window.location.href = '/dashboard/subscription'} className="w-full">
            <Crown className="h-4 w-4 mr-2" />
            View Plans & Upgrade
          </Button>
          <Button variant="outline" asChild className="w-full">
            <a href="mailto:hello@withsoma.ai?subject=Subscription%20Support">
            Contact Support
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
