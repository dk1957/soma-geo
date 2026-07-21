"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreditCard, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface QuotaUsageWidgetProps {
  accountId?: string
  brandId?: string
  variant?: 'compact' | 'full'
}

interface QuotaData {
  brands: { current: number; max: number }
  prompts: { current: number; max: number }
  competitors: { current: number; max: number }
  subscription: {
    plan_name: string
    status: string
    current_period_end: string
  }
}

export function QuotaUsageWidget({ accountId, brandId, variant = 'compact' }: QuotaUsageWidgetProps) {
  const [quota, setQuota] = useState<QuotaData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchQuota = async () => {
      if (!accountId) return
      
      try {
        const url = brandId 
          ? `/api/accounts/subscriptions/brand-quota?brand_id=${brandId}`
          : `/api/accounts/subscriptions/current?account_id=${accountId}`
        
        const response = await fetch(url)
        const result = await response.json()
        
        if (result.success) {
          if (brandId) {
            // Brand-specific quota
            setQuota({
              brands: { current: 0, max: 0 },
              prompts: { 
                current: result.data.current_prompts_count,
                max: result.data.max_prompts
              },
              competitors: {
                current: result.data.current_competitors_count,
                max: result.data.max_competitors
              },
              subscription: result.data.subscription
            })
          } else {
            // Account-level quota - use quotas and subscription from API response
            const quotas = result.quotas || {}
            const subscription = result.subscription || {}
            
            setQuota({
              brands: {
                current: quotas.current_brands_count || 0,
                max: quotas.max_brands || 0
              },
              prompts: {
                current: quotas.total_prompts_count || 0,
                max: quotas.max_prompts_per_brand || 0
              },
              competitors: {
                current: quotas.total_competitors_count || 0,
                max: quotas.max_competitors_per_brand || 0
              },
              subscription: {
                plan_name: subscription.plan_name || quotas.plan_name || 'Unknown',
                status: subscription.status || 'inactive',
                current_period_end: subscription.current_period_end || new Date().toISOString()
              }
            })
          }
        }
      } catch (error) {
        console.error('Error fetching quota:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuota()
  }, [accountId, brandId])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-2 bg-muted rounded"></div>
            <div className="h-2 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!quota) return null

  const getPercentage = (current: number, max: number) => {
    if (max === 0) return 0
    if (max === 999) return 0 // Unlimited
    return (current / max) * 100
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-destructive'
    if (percentage >= 75) return 'text-amber-600'
    return 'text-green-600'
  }

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 90) return <AlertCircle className="h-4 w-4" />
    if (percentage >= 75) return <TrendingUp className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }

  if (variant === 'compact') {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <Badge variant="outline">{quota.subscription.plan_name}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!brandId && quota.brands.max > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Brands</span>
                <span className={getStatusColor(getPercentage(quota.brands.current, quota.brands.max))}>
                  {quota.brands.current} / {quota.brands.max === 999 ? '∞' : quota.brands.max}
                </span>
              </div>
              {quota.brands.max !== 999 && (
                <Progress value={getPercentage(quota.brands.current, quota.brands.max)} className="h-1.5" />
              )}
            </div>
          )}
          
          {quota.prompts.max > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Prompts {brandId ? '' : '(per brand)'}</span>
                <span className={getStatusColor(getPercentage(quota.prompts.current, quota.prompts.max))}>
                  {quota.prompts.current} / {quota.prompts.max === 999 ? '∞' : quota.prompts.max}
                </span>
              </div>
              {quota.prompts.max !== 999 && (
                <Progress value={getPercentage(quota.prompts.current, quota.prompts.max)} className="h-1.5" />
              )}
            </div>
          )}
          
          {quota.competitors.max > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Competitors {brandId ? '' : '(per brand)'}</span>
                <span className={getStatusColor(getPercentage(quota.competitors.current, quota.competitors.max))}>
                  {quota.competitors.current} / {quota.competitors.max === 999 ? '∞' : quota.competitors.max}
                </span>
              </div>
              {quota.competitors.max !== 999 && (
                <Progress value={getPercentage(quota.competitors.current, quota.competitors.max)} className="h-1.5" />
              )}
            </div>
          )}
          
          <Link href="/dashboard/subscription" className="block pt-2">
            <Button variant="outline" size="sm" className="w-full">
              <CreditCard className="h-3 w-3 mr-2" />
              Manage Subscription
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Full variant
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Current Usage</CardTitle>
            <CardDescription>
              Plan: <Badge variant="outline" className="ml-2">{quota.subscription.plan_name}</Badge>
            </CardDescription>
          </div>
          <Link href="/dashboard/subscription">
            <Button variant="outline" size="sm">
              <CreditCard className="h-4 w-4 mr-2" />
              Manage
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!brandId && quota.brands.max > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(getPercentage(quota.brands.current, quota.brands.max))}
                <span className="font-medium">Brands</span>
              </div>
              <span className={`text-sm font-medium ${getStatusColor(getPercentage(quota.brands.current, quota.brands.max))}`}>
                {quota.brands.current} / {quota.brands.max === 999 ? '∞' : quota.brands.max}
              </span>
            </div>
            {quota.brands.max !== 999 && (
              <Progress value={getPercentage(quota.brands.current, quota.brands.max)} className="h-2" />
            )}
            <p className="text-xs text-muted-foreground">
              {quota.brands.max === 999 
                ? 'Unlimited brands' 
                : quota.brands.current > quota.brands.max
                  ? `Over limit by ${quota.brands.current - quota.brands.max} (grandfathered)`
                  : `${quota.brands.max - quota.brands.current} brands remaining`
              }
            </p>
          </div>
        )}
        
        {quota.prompts.max > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(getPercentage(quota.prompts.current, quota.prompts.max))}
                <span className="font-medium">Prompts {brandId ? '' : '(total across brands)'}</span>
              </div>
              <span className={`text-sm font-medium ${getStatusColor(getPercentage(quota.prompts.current, quota.prompts.max))}`}>
                {quota.prompts.current} / {quota.prompts.max === 999 ? '∞' : quota.prompts.max}
              </span>
            </div>
            {quota.prompts.max !== 999 && (
              <Progress value={getPercentage(quota.prompts.current, quota.prompts.max)} className="h-2" />
            )}
            <p className="text-xs text-muted-foreground">
              {quota.prompts.max === 999 
                ? 'Unlimited prompts' 
                : quota.prompts.current > quota.prompts.max
                  ? `Over limit by ${quota.prompts.current - quota.prompts.max}`
                  : brandId 
                    ? `${quota.prompts.max - quota.prompts.current} prompts remaining`
                    : `Up to ${quota.prompts.max} prompts per brand`
              }
            </p>
          </div>
        )}
        
        {quota.competitors.max > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(getPercentage(quota.competitors.current, quota.competitors.max))}
                <span className="font-medium">Competitors {brandId ? '' : '(total across brands)'}</span>
              </div>
              <span className={`text-sm font-medium ${getStatusColor(getPercentage(quota.competitors.current, quota.competitors.max))}`}>
                {quota.competitors.current} / {quota.competitors.max === 999 ? '∞' : quota.competitors.max}
              </span>
            </div>
            {quota.competitors.max !== 999 && (
              <Progress value={getPercentage(quota.competitors.current, quota.competitors.max)} className="h-2" />
            )}
            <p className="text-xs text-muted-foreground">
              {quota.competitors.max === 999 
                ? 'Unlimited competitors' 
                : quota.competitors.current > quota.competitors.max
                  ? `Over limit by ${quota.competitors.current - quota.competitors.max}`
                  : brandId 
                    ? `${quota.competitors.max - quota.competitors.current} competitors remaining`
                    : `Up to ${quota.competitors.max} competitors per brand`
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
