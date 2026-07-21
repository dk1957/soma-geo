"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Crown, ArrowRight, CheckCircle, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

interface QuotaLimitDialogProps {
  open: boolean
  onClose: () => void
  resourceType: 'brand' | 'prompt' | 'competitor' | 'model' | 'team_member'
  currentCount: number
  maxCount: number
  planName?: string
  planTier?: string
}

const RESOURCE_CONFIG = {
  brand: {
    singular: 'brand',
    plural: 'brands',
    description: 'You\'ve reached the maximum number of brands for your current plan.',
    upgradeHint: 'Upgrade to track more brands across AI search engines.',
  },
  prompt: {
    singular: 'prompt',
    plural: 'prompts',
    description: 'You\'ve reached the maximum number of prompts for this brand.',
    upgradeHint: 'Upgrade to monitor more search queries and prompts.',
  },
  competitor: {
    singular: 'competitor',
    plural: 'competitors',
    description: 'You\'ve reached the maximum number of competitors for this brand.',
    upgradeHint: 'Upgrade to track more competitors and gain deeper insights.',
  },
  model: {
    singular: 'AI model',
    plural: 'AI models',
    description: 'You\'ve reached the maximum number of AI models for your plan.',
    upgradeHint: 'Upgrade to track your brand across all major AI platforms.',
  },
  team_member: {
    singular: 'team member',
    plural: 'team members',
    description: 'You\'ve reached the maximum team size for your current plan.',
    upgradeHint: 'Upgrade to invite more team members to collaborate.',
  },
}

export function QuotaLimitDialog({
  open,
  onClose,
  resourceType,
  currentCount,
  maxCount,
  planName,
  planTier,
}: QuotaLimitDialogProps) {
  const config = RESOURCE_CONFIG[resourceType]
  const percentage = maxCount > 0 ? Math.round((currentCount / maxCount) * 100) : 100

  const [upgradePlan, setUpgradePlan] = useState<{ name: string; slug: string } | null>(null)
  const [checkedPlans, setCheckedPlans] = useState(false)

  // Fetch available upgrade plans when dialog opens
  useEffect(() => {
    if (!open) {
      setCheckedPlans(false)
      setUpgradePlan(null)
      return
    }

    async function checkUpgradePlans() {
      try {
        const res = await fetch('/api/accounts/subscriptions/plans')
        const data = await res.json()
        if (data.success && data.plans?.length > 0) {
          // Plans are sorted by sort_order. Find the first plan with higher sort_order than current tier.
          const TIER_ORDER: Record<string, number> = { growth: 1, pro: 2, enterprise: 3 }
          const currentOrder = TIER_ORDER[planTier || ''] || 0

          const higherPlan = data.plans.find((p: any) => {
            const pOrder = TIER_ORDER[p.plan_tier] || 0
            return pOrder > currentOrder
          })

          setUpgradePlan(higherPlan ? { name: higherPlan.display_name, slug: higherPlan.plan_slug } : null)
        }
      } catch {
        // If fetch fails, fall through to contact CTA
      } finally {
        setCheckedPlans(true)
      }
    }

    checkUpgradePlans()
  }, [open, planTier])

  const hasUpgrade = !!upgradePlan
  const showContact = checkedPlans && !hasUpgrade

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center justify-center mb-3">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <DialogTitle className="text-center">
            {config.singular.charAt(0).toUpperCase() + config.singular.slice(1)} Limit Reached
          </DialogTitle>
          <DialogDescription className="text-center">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-3">
          {/* Progress indicator */}
          <div className="bg-zinc-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600">{config.plural.charAt(0).toUpperCase() + config.plural.slice(1)} used</span>
              <span className="font-medium text-zinc-900">{currentCount} of {maxCount}</span>
            </div>
            <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            {planName && (
              <p className="text-xs text-zinc-500 mt-1">
                Current plan: <span className="font-medium capitalize">{planName}</span>
              </p>
            )}
          </div>

          {/* Upgrade hint */}
          <p className="text-xs text-zinc-500 mt-3 text-center">
            {showContact
              ? 'You\'re on the highest available plan. Contact us for custom limits.'
              : config.upgradeHint}
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {showContact ? (
            <Button className="w-full" asChild>
              <a href="mailto:hello@withsoma.ai?subject=Plan%20Upgrade%20Request">
                <Mail className="h-4 w-4 mr-2" />
                Contact hello@withsoma.ai
              </a>
            </Button>
          ) : (
            <Button className="w-full" onClick={() => window.location.href = '/dashboard/subscription'}>
              <Crown className="h-4 w-4 mr-2" />
              {upgradePlan ? `Upgrade to ${upgradePlan.name}` : 'Upgrade Plan'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          <Button variant="outline" className="w-full" onClick={onClose}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Inline quota progress bar for embedding in forms/dialogs.
 * Shows usage with color coding and warning state.
 */
interface QuotaProgressProps {
  label: string
  current: number
  max: number
  className?: string
}

export function QuotaProgress({ label, current, max, className = '' }: QuotaProgressProps) {
  const percentage = max > 0 ? (current / max) * 100 : 0
  const isWarning = percentage >= 80
  const isFull = percentage >= 100

  const barColor = isFull
    ? 'bg-red-500'
    : isWarning
      ? 'bg-amber-500'
      : 'bg-emerald-500'

  const textColor = isFull
    ? 'text-red-600'
    : isWarning
      ? 'text-amber-600'
      : 'text-zinc-600'

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">{label}</span>
        <span className={`text-xs font-medium ${textColor}`}>
          {current}/{max}
          {isFull && (
            <span className="ml-1 inline-flex items-center">
              <AlertTriangle className="h-3 w-3 ml-0.5" />
            </span>
          )}
          {!isFull && percentage >= 80 && ' — almost full'}
        </span>
      </div>
      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}

/**
 * Success message shown after a resource is created when approaching limits.
 * Gentle nudge without being intrusive.
 */
interface QuotaNudgeProps {
  resourceType: 'brand' | 'prompt' | 'competitor' | 'model'
  currentCount: number
  maxCount: number
}

export function QuotaNudge({ resourceType, currentCount, maxCount }: QuotaNudgeProps) {
  const remaining = maxCount - currentCount
  const config = RESOURCE_CONFIG[resourceType]

  if (remaining > Math.ceil(maxCount * 0.2)) return null // Only show when >80% used

  if (remaining <= 0) {
    return (
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mt-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-amber-800 font-medium">No {config.plural} remaining</p>
          <p className="text-amber-700 text-xs mt-0.5">
            {config.upgradeHint}{' '}
            <button
              onClick={() => window.location.href = '/dashboard/subscription'}
              className="underline font-medium hover:text-amber-900"
            >
              View plans
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mt-3">
      <CheckCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="text-blue-800">
          {remaining} {remaining === 1 ? config.singular : config.plural} remaining on your plan
        </p>
        {remaining <= 2 && (
          <p className="text-blue-700 text-xs mt-0.5">
            Need more?{' '}
            <button
              onClick={() => window.location.href = '/dashboard/subscription'}
              className="underline font-medium hover:text-blue-900"
            >
              Upgrade your plan
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
