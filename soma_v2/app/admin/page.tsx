import { createServiceClient } from '@/lib/supabase/server'
import { AdminView } from './admin-view'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { currentUser, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isAdminEmail, getEmailFromUser } from '@/lib/auth/admin'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  // Get current user from our helper
  const user = await getCurrentUser()

  if (!user) {
    redirect('/signin?redirect_url=/admin')
  }

  // Get email - try multiple sources for reliability
  let userEmail = getEmailFromUser(user)
  
  // If still no email, try fetching directly from Clerk
  if (!userEmail) {
    try {
      const clerkUserDirect = await currentUser()
      userEmail = clerkUserDirect?.emailAddresses?.[0]?.emailAddress?.toLowerCase() || ''
    } catch {}
  }

  if (!isAdminEmail(userEmail)) {
    redirect('/dashboard')
  }

  const supabase = createServiceClient()

  // Fetch all accounts with related data (exclude system account used for provisional free audits)
  const SYSTEM_ACCOUNT_ID = 'a0000000-0000-4000-a000-000000000001'
  const { data: accounts, error: accountsError } = await supabase
    .from('accounts')
    .select(`
      id,
      name,
      created_at,
      brands (
        id, 
        name,
        auto_run_paused,
        auto_run_paused_at,
        auto_run_pause_reason,
        primary_domain,
        brand_categories,
        target_markets,
        products_services,
        target_audience,
        known_competitors,
        runs (
          id,
          status,
          created_at,
          total_cost,
          llm_response_files (
            id,
            model_name,
            cost_estimate,
            error_message,
            success,
            created_at
          )
        )
      ),
      account_subscriptions (
        id,
        status,
        current_period_start,
        current_period_end,
        plan:subscription_plans (id, display_name, monthly_price_usd),
        billing_cycle,
        auto_renew
      ),
      account_users (
        user_id,
        clerk_id,
        role
      )
    `)
    .neq('id', SYSTEM_ACCOUNT_ID)
    .order('created_at', { ascending: false })

  if (accountsError) {
    console.error('Error fetching accounts:', accountsError)
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-md">
        Error loading accounts: {accountsError.message}
      </div>
    )
  }

  // Fetch profiles for all users found in accounts
  // Collect both user_ids (Supabase auth) and clerk_ids (Clerk auth)
  const allAccountUsers = accounts.flatMap(a => a.account_users)
  const userIds = allAccountUsers.map((au: any) => au.user_id).filter(Boolean)
  const clerkIds = allAccountUsers.map((au: any) => au.clerk_id).filter(Boolean)
  
  let profiles: any[] = []
  // Query profiles by user_id
  if (userIds.length > 0) {
    const { data, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_id, clerk_id, full_name, email')
      .in('user_id', userIds)
    if (!profilesError && data) profiles = data
  }
  // Also query profiles by clerk_id for Clerk-only users
  const foundUserIds = new Set(profiles.map(p => p.user_id).filter(Boolean))
  const foundClerkIds = new Set(profiles.map(p => p.clerk_id).filter(Boolean))
  const missingClerkIds = clerkIds.filter((id: string) => !foundClerkIds.has(id))
  if (missingClerkIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('id, user_id, clerk_id, full_name, email')
      .in('clerk_id', missingClerkIds)
    if (data) profiles = [...profiles, ...data]
  }

  // Create lookup maps: user_id -> profile AND clerk_id -> profile
  const profileByUserId = new Map(profiles.filter(p => p.user_id).map(p => [p.user_id, p]))
  const profileByClerkId = new Map(profiles.filter(p => p.clerk_id).map(p => [p.clerk_id, p]))

  // For users still missing, fetch from Clerk API
  const clerkUserMap = new Map<string, { email: string; name: string | null }>()
  const stillMissing = allAccountUsers.filter((au: any) => {
    if (au.user_id && profileByUserId.has(au.user_id)) return false
    if (au.clerk_id && profileByClerkId.has(au.clerk_id)) return false
    return true
  })
  if (stillMissing.length > 0) {
    const clerk = await clerkClient()
    await Promise.all(stillMissing.map(async (au: any) => {
      const clerkId = au.clerk_id
      if (!clerkId) return
      try {
        const clerkUser = await clerk.users.getUser(clerkId)
        if (clerkUser) {
          clerkUserMap.set(clerkId, {
            email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
            name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null
          })
        }
      } catch {}
    }))
  }

  // Calculate Global Metrics
  let totalBrands = 0
  let totalUsers = 0
  let activeSubscriptions = 0
  let mrr = 0
  let totalRuns = 0
  let failedRunsCount = 0
  let totalApiCost = 0

  // Process and format the data
  const formattedAccounts = accounts.map(account => {
    // Get subscription details - handle both array and object format
    const subscriptionData = account.account_subscriptions?.[0] || null
    const subscription = subscriptionData as any
    // Get plan - it might be an array or object depending on the relationship
    const planData = subscription?.plan
    const plan = (Array.isArray(planData) ? planData[0] : planData) as { id?: string; display_name?: string; monthly_price_usd?: number } | null
    
    // Update metrics
    totalUsers += account.account_users.length
    totalBrands += account.brands.length
    
    if (subscription?.status === 'active') {
      activeSubscriptions++
      const price = plan?.monthly_price_usd || 0
      // Adjust for billing cycle if needed, but monthly_price_usd is usually the base
      mrr += Number(price)
    }

    // Get users with profile info (try user_id lookup, then clerk_id lookup, then Clerk API)
    const users = account.account_users.map((au: any) => {
      const profile = (au.user_id && profileByUserId.get(au.user_id)) || (au.clerk_id && profileByClerkId.get(au.clerk_id))
      const clerkFallback = au.clerk_id ? clerkUserMap.get(au.clerk_id) : null
      return {
        id: au.user_id || au.clerk_id,
        role: au.role,
        email: profile?.email || clerkFallback?.email || 'Unknown',
        name: profile?.full_name || profile?.email || clerkFallback?.name || clerkFallback?.email || 'Unknown'
      }
    })

    // Track account-level cost
    let accountTotalCost = 0

    // Process brands and check for issues
    const brands = account.brands.map((brand: any) => {
      const runs = brand.runs || []
      totalRuns += runs.length
      const failed = runs.filter((s: any) => s.status === 'failed')
      failedRunsCount += failed.length
      
      // Sort by date desc to get most recent first
      runs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      const lastRun = runs[0]
      // Use the most recent run's status
      const lastStatus = lastRun?.status || null
      
      const recentFailure = lastStatus === 'failed' && lastRun && 
        (new Date().getTime() - new Date(lastRun.created_at).getTime()) < 24 * 60 * 60 * 1000 // Last 24h

      // Find error message from failed run responses (most recent first)
      let lastError = null
      if (lastStatus === 'failed' && lastRun) {
        const errorResponse = lastRun.llm_response_files?.find((r: any) => r.error_message)
        lastError = errorResponse?.error_message || null
      }

      // Calculate total cost for this brand from all runs
      let brandTotalCost = 0
      const modelUsage: Record<string, { count: number; cost: number }> = {}
      
      runs.forEach((sim: any) => {
        // Add run-level cost
        brandTotalCost += Number(sim.total_cost || 0)
        
        // Track per-model usage from responses
        const responses = sim.llm_response_files || []
        responses.forEach((resp: any) => {
          const modelName = resp.model_name || 'unknown'
          const cost = Number(resp.cost_estimate || 0)
          
          if (!modelUsage[modelName]) {
            modelUsage[modelName] = { count: 0, cost: 0 }
          }
          modelUsage[modelName].count++
          modelUsage[modelName].cost += cost
        })
      })
      
      accountTotalCost += brandTotalCost
      totalApiCost += brandTotalCost

      return {
        id: brand.id,
        name: brand.name,
        last_run: lastRun?.created_at || null,
        last_status: lastStatus,
        has_recent_failure: recentFailure,
        total_failures: failed.length,
        last_error: lastError,
        total_cost: brandTotalCost,
        model_usage: modelUsage,
        run_count: runs.length,
        auto_run_paused: brand.auto_run_paused || false,
        auto_run_paused_at: brand.auto_run_paused_at,
        auto_run_pause_reason: brand.auto_run_pause_reason,
        primary_domain: brand.primary_domain,
        brand_categories: brand.brand_categories,
        target_markets: brand.target_markets,
        products_services: brand.products_services,
        target_audience: brand.target_audience,
        known_competitors: brand.known_competitors
      }
    })

    // Determine overall account status/issues
    const hasSubscriptionIssue = subscription?.status === 'past_due' || subscription?.status === 'canceled' || subscription?.status === 'expired'
    const hasRunIssues = brands.some(b => b.has_recent_failure)
    
    return {
      id: account.id,
      name: account.name,
      created_at: account.created_at,
      total_cost: accountTotalCost,
      subscription: subscription ? {
        id: subscription.id,
        plan_id: plan?.id,
        plan_name: plan?.display_name || 'Unknown Plan',
        price: plan?.monthly_price_usd || 0,
        status: subscription.status,
        start_date: subscription.current_period_start,
        end_date: subscription.current_period_end,
        auto_renew: subscription.auto_renew,
        billing_cycle: subscription.billing_cycle
      } : null,
      users,
      brands,
      issues: {
        subscription: hasSubscriptionIssue,
        run: hasRunIssues
      }
    }
  })

  // Fetch subscription plans
  const { data: subscriptionPlans } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('monthly_price_usd', { ascending: true })

  const metrics = {
    totalAccounts: accounts.length,
    totalBrands,
    totalUsers,
    activeSubscriptions,
    mrr,
    totalApiCost,
    runHealth: totalRuns > 0 ? ((totalRuns - failedRunsCount) / totalRuns) * 100 : 100
  }

  return <AdminView accounts={formattedAccounts} metrics={metrics} subscriptionPlans={subscriptionPlans || []} userEmail={userEmail || undefined} />
}
