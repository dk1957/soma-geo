import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'

export const dynamic = 'force-dynamic'

// GET /api/admin/crm/dashboard - CRM dashboard metrics and recent activity
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Parallel fetch all dashboard data
    const [
      contactStats,
      recentSignups,
      recentTrials,
      pipelineData,
      campaignStats,
      recentActivities,
      contactsBySource,
      topProspects,
    ] = await Promise.all([
      // Contact stats
      getContactStats(supabase),
      // Recent signups (from accounts table)
      getRecentSignups(supabase, thirtyDaysAgo),
      // Recent trials (from account_subscriptions)
      getRecentTrials(supabase, thirtyDaysAgo),
      // Pipeline summary
      getPipelineSummary(supabase),
      // Campaign stats
      getCampaignStats(supabase, thirtyDaysAgo),
      // Recent activities
      supabase.from('crm_activities')
        .select('*, contact:crm_contacts(id, full_name, email, company_name)')
        .order('created_at', { ascending: false })
        .limit(20),
      // Contacts by source
      getContactsBySource(supabase),
      // Top prospects by score
      supabase.from('crm_contacts')
        .select('id, full_name, email, company_name, company_domain, lead_score, lead_status, contact_type, visibility_score, estimated_mrr, created_at')
        .order('lead_score', { ascending: false })
        .limit(10),
    ])

    return NextResponse.json({
      success: true,
      stats: contactStats,
      recentSignups: recentSignups,
      recentTrials: recentTrials,
      pipeline: pipelineData,
      campaigns: campaignStats,
      recentActivities: recentActivities.data || [],
      contactsBySource,
      topProspects: topProspects.data || [],
    })
  } catch (error) {
    console.error('Error in GET /api/admin/crm/dashboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/crm/dashboard - Sync existing accounts/trials into CRM contacts
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const supabase = createServiceClient()
    const body = await request.json()

    if (body.action === 'sync_accounts') {
      return await syncAccountsToCRM(supabase)
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Error in POST /api/admin/crm/dashboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── Helper functions ──────────────────────────────────────────────────────────

async function getContactStats(supabase: ReturnType<typeof createServiceClient>) {
  const [total, prospects, leads, customers, churned, newThisWeek, newThisMonth] = await Promise.all([
    supabase.from('crm_contacts').select('*', { count: 'exact', head: true }),
    supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).eq('contact_type', 'prospect'),
    supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).eq('contact_type', 'lead'),
    supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).eq('contact_type', 'customer'),
    supabase.from('crm_contacts').select('*', { count: 'exact', head: true }).eq('contact_type', 'churned'),
    supabase.from('crm_contacts').select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('crm_contacts').select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  return {
    total: total.count || 0,
    prospects: prospects.count || 0,
    leads: leads.count || 0,
    customers: customers.count || 0,
    churned: churned.count || 0,
    newThisWeek: newThisWeek.count || 0,
    newThisMonth: newThisMonth.count || 0,
  }
}

async function getRecentSignups(supabase: ReturnType<typeof createServiceClient>, since: string) {
  const { data } = await supabase
    .from('accounts')
    .select(`
      id,
      name,
      created_at,
      industry,
      company_size,
      billing_plan,
      billing_status,
      account_users(user_id, clerk_id, role),
      account_subscriptions(id, status, plan:subscription_plans(display_name))
    `)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(50)

  // Enrich with profile emails
  const accountUserIds = (data || []).flatMap(a => (a.account_users || []).map((u: any) => u.user_id).filter(Boolean))
  const clerkIds = (data || []).flatMap(a => (a.account_users || []).map((u: any) => u.clerk_id).filter(Boolean))

  let profiles: any[] = []
  if (accountUserIds.length > 0) {
    const { data: p } = await supabase.from('profiles').select('user_id, clerk_id, email, full_name').in('user_id', accountUserIds)
    if (p) profiles = p
  }
  if (clerkIds.length > 0) {
    const existing = new Set(profiles.map(p => p.clerk_id).filter(Boolean))
    const missing = clerkIds.filter((id: string) => !existing.has(id))
    if (missing.length > 0) {
      const { data: p } = await supabase.from('profiles').select('user_id, clerk_id, email, full_name').in('clerk_id', missing)
      if (p) profiles = [...profiles, ...p]
    }
  }

  const profileMap = new Map<string, any>()
  for (const p of profiles) {
    if (p.user_id) profileMap.set(p.user_id, p)
    if (p.clerk_id) profileMap.set(p.clerk_id, p)
  }

  return (data || []).map(account => {
    const user = account.account_users?.[0]
    const profile = user ? (profileMap.get(user.user_id) || profileMap.get(user.clerk_id)) : null
    const sub = (account as any).account_subscriptions?.[0]
    return {
      id: account.id,
      name: account.name,
      created_at: account.created_at,
      industry: account.industry,
      company_size: account.company_size,
      billing_plan: account.billing_plan,
      billing_status: account.billing_status,
      email: profile?.email || null,
      full_name: profile?.full_name || null,
      subscription_status: sub?.status || null,
      plan_name: sub?.plan?.display_name || sub?.plan?.[0]?.display_name || null,
    }
  })
}

async function getRecentTrials(supabase: ReturnType<typeof createServiceClient>, since: string) {
  const { data } = await supabase
    .from('account_subscriptions')
    .select(`
      id,
      status,
      current_period_start,
      current_period_end,
      created_at,
      billing_cycle,
      account:accounts(id, name, industry, company_size),
      plan:subscription_plans(display_name, plan_tier)
    `)
    .eq('status', 'trialing')
    .order('created_at', { ascending: false })
    .limit(50)

  return data || []
}

async function getPipelineSummary(supabase: ReturnType<typeof createServiceClient>) {
  const { data: deals } = await supabase
    .from('crm_deals')
    .select('stage, deal_value, probability')

  const stages = ['discovery', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']
  const pipeline: Record<string, { count: number; value: number; weighted: number }> = {}
  let totalWeighted = 0

  for (const stage of stages) {
    const stageDeals = (deals || []).filter(d => d.stage === stage)
    const value = stageDeals.reduce((s, d) => s + (d.deal_value || 0), 0)
    const weighted = stageDeals.reduce((s, d) => s + ((d.deal_value || 0) * (d.probability || 0) / 100), 0)
    pipeline[stage] = { count: stageDeals.length, value, weighted }
    if (!['closed_won', 'closed_lost'].includes(stage)) totalWeighted += weighted
  }

  return { stages: pipeline, totalWeightedPipeline: totalWeighted }
}

async function getCampaignStats(supabase: ReturnType<typeof createServiceClient>, since: string) {
  const { data } = await supabase
    .from('crm_campaigns')
    .select('id, status, total_sent, total_delivered, total_opened, total_clicked, campaign_type')

  const total = data?.length || 0
  const sent = data?.filter(c => c.status === 'sent').length || 0
  const totalEmailsSent = data?.reduce((s, c) => s + (c.total_sent || 0), 0) || 0
  const totalOpened = data?.reduce((s, c) => s + (c.total_opened || 0), 0) || 0

  return { total, sent, totalEmailsSent, totalOpened }
}

async function getContactsBySource(supabase: ReturnType<typeof createServiceClient>) {
  const sources = ['manual', 'free_audit', 'signup', 'trial', 'research', 'referral', 'inbound', 'outbound']
  const results: Record<string, number> = {}

  for (const source of sources) {
    const { count } = await supabase
      .from('crm_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('lead_source', source)
    results[source] = count || 0
  }

  return results
}

async function syncAccountsToCRM(supabase: ReturnType<typeof createServiceClient>) {
  // Get all accounts that don't have a matching CRM contact
  const { data: accounts } = await supabase
    .from('accounts')
    .select(`
      id, name, industry, company_size, created_at, billing_plan, billing_status,
      account_subscriptions(status, plan:subscription_plans(display_name)),
      account_users(user_id, clerk_id)
    `)
    .order('created_at', { ascending: false })

  if (!accounts) return NextResponse.json({ success: true, synced: 0 })

  // Get existing CRM contacts by account_id
  const { data: existingContacts } = await supabase
    .from('crm_contacts')
    .select('account_id')
    .not('account_id', 'is', null)

  const existingAccountIds = new Set((existingContacts || []).map(c => c.account_id))

  let synced = 0
  for (const account of accounts) {
    if (existingAccountIds.has(account.id)) continue

    // Get user email from profiles
    const userId = account.account_users?.[0]?.user_id
    const clerkId = account.account_users?.[0]?.clerk_id
    let email = null
    let fullName = null

    if (userId) {
      const { data: profile } = await supabase.from('profiles').select('email, full_name').eq('user_id', userId).single()
      email = profile?.email
      fullName = profile?.full_name
    } else if (clerkId) {
      const { data: profile } = await supabase.from('profiles').select('email, full_name').eq('clerk_id', clerkId).single()
      email = profile?.email
      fullName = profile?.full_name
    }

    const sub = (account as any).account_subscriptions?.[0]
    const isTrialing = sub?.status === 'trialing'
    const isActive = sub?.status === 'active'

    await supabase.from('crm_contacts').insert({
      email,
      full_name: fullName,
      company_name: account.name,
      company_industry: account.industry,
      company_size: account.company_size,
      contact_type: isActive ? 'customer' : isTrialing ? 'lead' : 'prospect',
      lead_source: isTrialing ? 'trial' : 'signup',
      lead_status: isActive ? 'closed_won' : isTrialing ? 'qualified' : 'new',
      lead_score: isActive ? 80 : isTrialing ? 60 : 20,
      account_id: account.id,
    })
    synced++
  }

  return NextResponse.json({ success: true, synced })
}
