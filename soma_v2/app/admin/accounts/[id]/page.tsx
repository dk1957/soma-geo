import { createServiceClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { currentUser, clerkClient } from '@clerk/nextjs/server'
import { AccountDetailView } from './account-detail-view'
import { isAdminEmail, getEmailFromUser } from '@/lib/auth/admin'

export const dynamic = 'force-dynamic'

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: accountId } = await params

  const user = await getCurrentUser()
  if (!user) redirect('/signin?redirect_url=/admin')

  let userEmail = getEmailFromUser(user)
  if (!userEmail) {
    try {
      const clerkUserDirect = await currentUser()
      userEmail = clerkUserDirect?.emailAddresses?.[0]?.emailAddress?.toLowerCase() || ''
    } catch {}
  }

  if (!isAdminEmail(userEmail)) redirect('/dashboard')

  const supabase = createServiceClient()

  // Fetch account with ALL available data
  const { data: account, error } = await supabase
    .from('accounts')
    .select(`
      id,
      name,
      slug,
      created_at,
      updated_at,
      account_type,
      description,
      logo_url,
      company_size,
      industry,
      settings,
      billing_plan,
      billing_status,
      trial_ends_at,
      is_active,
      brands (
        id,
        name,
        slug,
        description,
        logo_url,
        industry,
        brand_type,
        primary_domain,
        brand_website,
        contact_info,
        is_active,
        created_at,
        updated_at,
        brand_category,
        brand_categories,
        target_markets,
        products_services,
        business_type,
        business_model,
        target_audience,
        primary_value,
        business_stage,
        known_competitors,
        company_name,
        company_website,
        company_location,
        selected_models,
        auto_run_paused,
        auto_run_paused_at,
        auto_run_pause_reason,
        runs (
          id,
          status,
          created_at,
          completed_at,
          total_cost,
          total_jobs,
          completed_jobs,
          failed_jobs,
          llm_response_files (
            id,
            model_name,
            cost_estimate,
            error_message,
            success,
            response_time_ms,
            token_usage,
            retry_count,
            created_at
          )
        )
      ),
      account_subscriptions (
        id,
        status,
        current_period_start,
        current_period_end,
        plan:subscription_plans (id, plan_name, display_name, monthly_price_usd, features),
        billing_cycle,
        auto_renew
      ),
      account_users (
        user_id,
        clerk_id,
        role,
        joined_at,
        is_active,
        created_at
      )
    `)
    .eq('id', accountId)
    .single()

  if (error || !account) {
    console.error('[Admin Account Detail] Error fetching account:', error, 'accountId:', accountId)
    notFound()
  }

  // Fetch profiles for users — try both user_id and clerk_id
  const accountUsers = account.account_users as any[]
  const userIds = accountUsers.map(au => au.user_id).filter(Boolean)
  const clerkIds = accountUsers.map(au => au.clerk_id).filter(Boolean)

  let profiles: any[] = []
  if (userIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('id, user_id, clerk_id, full_name, email, avatar_url, region, timezone, last_active_at, onboarding_completed, role, created_at')
      .in('user_id', userIds)
    if (data) profiles = data
  }
  // Also query by clerk_id for Clerk-only users
  const foundClerkIds = new Set(profiles.map(p => p.clerk_id).filter(Boolean))
  const missingClerkIds = clerkIds.filter((id: string) => !foundClerkIds.has(id))
  if (missingClerkIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('id, user_id, clerk_id, full_name, email, avatar_url, region, timezone, last_active_at, onboarding_completed, role, created_at')
      .in('clerk_id', missingClerkIds)
    if (data) profiles = [...profiles, ...data]
  }

  const profileByUserId = new Map(profiles.filter(p => p.user_id).map(p => [p.user_id, p]))
  const profileByClerkId = new Map(profiles.filter(p => p.clerk_id).map(p => [p.clerk_id, p]))

  // For users still missing, fetch from Clerk API
  const clerkUserMap = new Map<string, { email: string; name: string | null; imageUrl: string | null }>()
  const stillMissing = accountUsers.filter(au => {
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
            name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null,
            imageUrl: clerkUser.imageUrl || null
          })
        }
      } catch {}
    }))
  }

  // Format users
  const users = accountUsers.map((au: any) => {
    const profile = (au.user_id && profileByUserId.get(au.user_id)) || (au.clerk_id && profileByClerkId.get(au.clerk_id))
    const clerkFallback = au.clerk_id ? clerkUserMap.get(au.clerk_id) : null
    return {
      id: au.user_id || au.clerk_id,
      role: au.role,
      email: profile?.email || clerkFallback?.email || 'No email',
      name: profile?.full_name || profile?.email || clerkFallback?.name || clerkFallback?.email || 'No profile',
      avatar_url: profile?.avatar_url || clerkFallback?.imageUrl || null,
      joined_at: au.joined_at || au.created_at || null,
      is_active: au.is_active !== false,
      region: profile?.region || null,
      timezone: profile?.timezone || null,
      last_active_at: profile?.last_active_at || null,
      onboarding_completed: profile?.onboarding_completed || false,
      profile_role: profile?.role || null,
    }
  })

  // Format brands with run data
  let accountTotalCost = 0
  let totalRuns = 0
  let totalFailures = 0

  const brands = (account.brands || []).map((brand: any) => {
    const runs = (brand.runs || []).sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    totalRuns += runs.length
    const failed = runs.filter((s: any) => s.status === 'failed')
    totalFailures += failed.length

    const lastRun = runs[0]
    const lastStatus = lastRun?.status || null

    // Collect all errors from recent runs (last 5)
    const recentErrors: { date: string; error: string; run_id: string }[] = []
    runs.slice(0, 5).forEach((sim: any) => {
      if (sim.status === 'failed') {
        const errorResponses = (sim.llm_response_files || []).filter((r: any) => r.error_message)
        errorResponses.forEach((r: any) => {
          recentErrors.push({
            date: r.created_at || sim.created_at,
            error: r.error_message,
            run_id: sim.id,
          })
        })
      }
    })

    const lastError = recentErrors[0]?.error || null

    let brandTotalCost = 0
    const modelUsage: Record<string, { count: number; cost: number; avg_response_ms: number; total_tokens: number; errors: number }> = {}
    let totalResponseTimeMs = 0
    let totalResponses = 0
    let totalRetries = 0
    let totalTokens = 0

    // Run history (last 10 for diagnostics)
    const runHistory = runs.slice(0, 10).map((sim: any) => {
      const responses = sim.llm_response_files || []
      const successCount = responses.filter((r: any) => r.success).length
      const failCount = responses.filter((r: any) => !r.success).length
      // Calculate duration from created_at → completed_at
      const durationMs = sim.completed_at && sim.created_at
        ? new Date(sim.completed_at).getTime() - new Date(sim.created_at).getTime()
        : null
      // Calculate avg response time from individual responses
      const respTimes = responses.map((r: any) => Number(r.response_time_ms || 0)).filter((t: number) => t > 0)
      const avgRespMs = respTimes.length > 0 ? Math.round(respTimes.reduce((a: number, b: number) => a + b, 0) / respTimes.length) : null
      return {
        id: sim.id,
        status: sim.status,
        created_at: sim.created_at,
        completed_at: sim.completed_at,
        total_cost: Number(sim.total_cost || 0),
        total_jobs: sim.total_jobs || 0,
        completed_jobs: sim.completed_jobs || 0,
        failed_jobs: sim.failed_jobs || 0,
        duration_ms: durationMs,
        avg_response_ms: avgRespMs,
        response_count: responses.length,
        success_count: successCount,
        fail_count: failCount,
      }
    })

    runs.forEach((sim: any) => {
      brandTotalCost += Number(sim.total_cost || 0)
      const responses = sim.llm_response_files || []
      responses.forEach((resp: any) => {
        const modelName = resp.model_name || 'unknown'
        const cost = Number(resp.cost_estimate || 0)
        const respTime = Number(resp.response_time_ms || 0)
        const tokens = resp.token_usage ? (Number(resp.token_usage.total_tokens || 0) || Number(resp.token_usage.input_tokens || 0) + Number(resp.token_usage.output_tokens || 0)) : 0

        if (!modelUsage[modelName]) modelUsage[modelName] = { count: 0, cost: 0, avg_response_ms: 0, total_tokens: 0, errors: 0 }
        modelUsage[modelName].count++
        modelUsage[modelName].cost += cost
        modelUsage[modelName].total_tokens += tokens
        if (!resp.success) modelUsage[modelName].errors++

        totalResponseTimeMs += respTime
        totalResponses++
        totalRetries += Number(resp.retry_count || 0)
        totalTokens += tokens
      })
    })

    // Calculate avg response time per model
    Object.values(modelUsage).forEach((usage: any) => {
      // approximate: total_time / count isn't perfect, but good enough
    })

    accountTotalCost += brandTotalCost

    return {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      logo_url: brand.logo_url,
      industry: brand.industry,
      brand_type: brand.brand_type,
      is_active: brand.is_active !== false,
      created_at: brand.created_at,
      updated_at: brand.updated_at,
      // Business context
      primary_domain: brand.primary_domain,
      brand_website: brand.brand_website,
      brand_category: brand.brand_category,
      brand_categories: brand.brand_categories,
      target_markets: brand.target_markets,
      products_services: brand.products_services,
      business_type: brand.business_type,
      business_model: brand.business_model,
      target_audience: brand.target_audience,
      primary_value: brand.primary_value,
      business_stage: brand.business_stage,
      known_competitors: brand.known_competitors,
      company_name: brand.company_name,
      company_website: brand.company_website,
      company_location: brand.company_location,
      contact_info: brand.contact_info,
      selected_models: brand.selected_models,
      // Auto-run
      auto_run_paused: brand.auto_run_paused || false,
      auto_run_paused_at: brand.auto_run_paused_at,
      auto_run_pause_reason: brand.auto_run_pause_reason,
      // Diagnostics
      last_run: lastRun?.created_at || null,
      last_status: lastStatus,
      has_recent_failure: lastStatus === 'failed' && lastRun &&
        (Date.now() - new Date(lastRun.created_at).getTime()) < 86400000,
      total_failures: failed.length,
      last_error: lastError,
      recent_errors: recentErrors,
      total_cost: brandTotalCost,
      model_usage: modelUsage,
      run_count: runs.length,
      run_history: runHistory,
      avg_response_time_ms: totalResponses > 0 ? Math.round(totalResponseTimeMs / totalResponses) : 0,
      total_responses: totalResponses,
      total_retries: totalRetries,
      total_tokens: totalTokens,
    }
  })

  // Subscription
  const sub = (account.account_subscriptions as any)?.[0] || null
  const planData = sub?.plan
  const plan = (Array.isArray(planData) ? planData[0] : planData) as any
  const subscription = sub ? {
    id: sub.id,
    plan_id: plan?.id,
    plan_name: plan?.display_name || 'Unknown Plan',
    price: plan?.monthly_price_usd || 0,
    status: sub.status,
    start_date: sub.current_period_start,
    end_date: sub.current_period_end,
    auto_renew: sub.auto_renew,
    billing_cycle: sub.billing_cycle,
    features: plan?.features || null,
    max_brands: plan?.max_brands ?? null,
    max_prompts_per_brand: plan?.max_prompts_per_brand ?? null,
    max_competitors_per_brand: plan?.max_competitors_per_brand ?? null,
  } : null

  // Fetch subscription plans for management
  const { data: subscriptionPlans } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('monthly_price_usd', { ascending: true })

  const accountData = {
    id: account.id,
    name: account.name,
    slug: (account as any).slug || null,
    created_at: account.created_at,
    updated_at: (account as any).updated_at || null,
    account_type: (account as any).account_type || null,
    description: (account as any).description || null,
    logo_url: (account as any).logo_url || null,
    company_size: (account as any).company_size || null,
    industry: (account as any).industry || null,
    billing_plan: (account as any).billing_plan || null,
    billing_status: (account as any).billing_status || null,
    trial_ends_at: (account as any).trial_ends_at || null,
    is_active: (account as any).is_active !== false,
    total_cost: accountTotalCost,
    total_runs: totalRuns,
    total_failures: totalFailures,
    subscription,
    users,
    brands,
  }

  return (
    <AccountDetailView
      account={accountData}
      subscriptionPlans={subscriptionPlans || []}
      userEmail={userEmail || undefined}
    />
  )
}
