import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { CompetitorExtractor } from '@/lib/utils/competitor-extractor'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export async function GET(request: Request) {
  // Extract brandId from URL
  const url = new URL(request.url)
  const brandId = url.pathname.split('/')[3] // Extracts brandId from /api/brands/[brandId]/competitors

  try {
    const supabase = createServiceClient()
    if (!brandId) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 })
    }

    // Get user from Clerk
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to this brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id, account_id')
      .eq('id', brandId)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Check user access to the account
    const { data: accountAccess, error: accessError } = await supabase
      .from('account_users')
      .select('id')
      .eq('account_id', brand.account_id)
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('is_active', true)
      .single()

    if (accessError || !accountAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch competitors for this brand
    const { data: competitors, error: competitorsError } = await supabase
      .from('competitors')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })

    if (competitorsError) {
      console.error('Error fetching competitors:', competitorsError)
      return NextResponse.json({ error: 'Failed to fetch competitors' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      competitors: competitors || []
    })

  } catch (error) {
    console.error('Error in GET /api/brands/[brandId]/competitors:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  // Extract brandId from URL
  const url = new URL(request.url)
  const brandId = url.pathname.split('/')[3] // Extracts brandId from /api/brands/[brandId]/competitors

  try {
    const supabase = createServiceClient()
    if (!brandId) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 })
    }
    const body = await request.json()

    // Get user from Clerk
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: competitor creation
    const limited = applyRateLimit(request as any, 'competitors:create', RATE_LIMITS.write, currentUser.clerkUserId)
    if (limited) return limited

    // Verify user has access to this brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id, account_id')
      .eq('id', brandId)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Check user access to the account
    const { data: accountAccess, error: accessError } = await supabase
      .from('account_users')
      .select('id')
      .eq('account_id', brand.account_id)
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('is_active', true)
      .single()

    if (accessError || !accountAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check competitor quota before creation
    const { data: quotaAllowed, error: quotaError } = await supabase.rpc('can_add_competitor', {
      p_brand_id: brandId
    })

    if (quotaError) {
      console.error('Error checking competitor quota:', quotaError)
      return NextResponse.json({ error: 'Failed to check competitor quota' }, { status: 500 })
    }

    if (!quotaAllowed) {
      // Get quota details for error message
      const { data: quota } = await supabase
        .from('brand_quotas')
        .select('max_competitors, current_competitors_count')
        .eq('brand_id', brandId)
        .single()
      
      // Get plan info from the brand's account subscription
      const { data: brand } = await supabase.from('brands').select('account_id').eq('id', brandId).single()
      const { data: planInfo } = brand?.account_id
        ? await supabase.rpc('get_account_subscription_quotas', { p_account_id: brand.account_id })
        : { data: null }
      const p = planInfo?.[0]

      const maxCompetitors = quota?.max_competitors || 0
      return NextResponse.json({ 
        error: `Competitor limit reached. Your plan allows ${maxCompetitors} competitor${maxCompetitors !== 1 ? 's' : ''} per brand. Upgrade your plan to add more competitors.`,
        quota_exceeded: true,
        max_competitors: maxCompetitors,
        current_count: quota?.current_competitors_count || 0,
        plan_name: p?.plan_name || null,
        plan_tier: p?.plan_tier || null,
      }, { status: 403 })
    }

    // Validate required fields
    // Validate required fields and normalize inputs
    if (!body.competitor_name || !String(body.competitor_name).trim()) {
      return NextResponse.json({ error: 'Competitor name is required' }, { status: 400 })
    }

    const nameTrim = String(body.competitor_name).trim()
    const nameKey = nameTrim.toLowerCase()
    const domainRaw = body.competitor_domain ? String(body.competitor_domain).trim() : null
    const normalizeDomain = (d: string | null) => {
      if (!d) return null
      return d.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase()
    }
    const domainNormalized = normalizeDomain(domainRaw)

    // Check if competitor already exists for this brand (case-insensitive by name or by domain)
    let existingCompetitor: any = null
    try {
      if (domainNormalized) {
        // Use OR to match either a case-insensitive name or exact domain
        const orQuery = `brand_id.eq.${brandId},(competitor_name.ilike.${nameTrim.replace(/\*/g, '')})`
        // We'll perform two checks: by domain, then by name ilike
        const { data: byDomain } = await supabase
          .from('competitors')
          .select('*')
          .eq('brand_id', brandId)
          .eq('competitor_domain', domainNormalized)
          .limit(1)

        if (byDomain && byDomain.length > 0) existingCompetitor = byDomain[0]
      }

      if (!existingCompetitor) {
        const { data: byName } = await supabase
          .from('competitors')
          .select('*')
          .eq('brand_id', brandId)
          .ilike('competitor_name', nameTrim)
          .limit(1)

        if (byName && byName.length > 0) existingCompetitor = byName[0]
      }
    } catch (checkError) {
      console.warn('Error checking for existing competitor (non-fatal):', checkError)
    }

    if (existingCompetitor) {
      // Return the existing record rather than erroring to make creation idempotent
      return NextResponse.json({ success: true, competitor: existingCompetitor }, { status: 200 })
    }

    // Create new competitor (deprecated metric columns removed — now derived from daily_brand_metrics)
    const { data: newCompetitor, error: createError } = await supabase
      .from('competitors')
      .insert({
        brand_id: brandId,
        account_id: brand.account_id,
        competitor_name: body.competitor_name,
        competitor_domain: body.competitor_domain || null,
        competitor_category: body.competitor_category || null,
        is_direct_competitor: body.is_direct_competitor ?? true,
      })
      .select('*')
      .single()

    if (createError) {
      console.error('Error creating competitor:', createError)
      return NextResponse.json({ error: 'Failed to create competitor' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      competitor: newCompetitor
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/brands/[brandId]/competitors:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}