/**
 * API Route: Get Report Data
 * 
 * GET /api/reports/[id]/data
 * 
 * Returns comprehensive report data including:
 * - Stats (LVI, mentions, sentiment, rankings, citations)
 * - Timeseries data for charts
 * - Industry rankings
 * - Topic matrix
 * - Prompt performance (opportunities, threats, strengths)
 * - Source citations
 * - Metadata
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { getAccountTimezone, getDateInTimezone, formatDateInTimezone } from '@/lib/utils/timezone'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const t0 = Date.now()
  try {
    const params = await context.params
    
    const searchParams = request.nextUrl.searchParams
    const publicAccessToken = searchParams.get('public_access_token') || null
    const freeAuditToken = searchParams.get('free_audit_token') || null
    
    const supabase = createServiceClient()
    let isPublicAccess = false
    let brandId = params.id
    let clerkUserId: string | null = null
    
    // Check for free audit token access (unauthenticated free-audit report viewers)
    if (freeAuditToken) {
      if (!/^[a-f0-9]{64}$/.test(freeAuditToken)) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
      }
      const { data: auditReport } = await supabase
        .from('free_audit_reports')
        .select('id, provisional_brand_id')
        .eq('access_token', freeAuditToken)
        .eq('is_active', true)
        .eq('status', 'completed')
        .single()
      
      if (!auditReport?.provisional_brand_id) {
        return NextResponse.json({ error: 'Report not found or not ready' }, { status: 404 })
      }
      
      // Verify the requested brand_id matches the audit's provisional brand
      if (brandId !== auditReport.provisional_brand_id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
      
      isPublicAccess = true
    }
    // Check for public access via access token
    else if (publicAccessToken) {
      // Special case: authenticated user viewing shared report
      if (publicAccessToken === 'authenticated_user') {
        // Use regular auth - the user is already authenticated
        const user = await getCurrentUser()
        
        if (!user?.clerkUserId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        clerkUserId = user.clerkUserId
        // Continue with normal authenticated flow
        isPublicAccess = false
      } else {
        // Validate the access token and get the associated report
        const { data: emailCapture, error: captureError } = await supabase
          .from('external_report_email_captures')
          .select(`
            id,
            email,
            external_report_id,
            external_brand_reports!inner(
              id,
              brand_id,
              is_active,
              expires_at
            )
          `)
          .eq('access_token', publicAccessToken)
          .maybeSingle()
        
        if (captureError) {
          return NextResponse.json({ error: 'Invalid or expired access token' }, { status: 403 })
        }

        const externalReport = (emailCapture?.external_brand_reports as any) || null
        
        // Check if report is still active and not expired
        if (externalReport && !externalReport.is_active) {
          return NextResponse.json({ error: 'Report is no longer active' }, { status: 403 })
        }
      
        if (externalReport?.expires_at && new Date(externalReport.expires_at) < new Date()) {
          return NextResponse.json({ error: 'Report has expired' }, { status: 403 })
        }
        
        if (externalReport) {
          // Update last accessed time
          if (emailCapture) {
            await supabase
              .from('external_report_email_captures')
              .update({ last_accessed_at: new Date().toISOString() })
              .eq('id', emailCapture.id)
          }

          // Use the brand_id from the external report
          brandId = externalReport.brand_id
          isPublicAccess = true
        }
      }
      
      // If no email-capture record found, allow using the public `share_token` for reports
      if (!isPublicAccess) {
        const { data: sharedReport } = await supabase
          .from('external_brand_reports')
          .select('id, brand_id, is_active, requires_email_capture, expires_at')
          .eq('share_token', publicAccessToken)
          .maybeSingle()

        if (sharedReport) {
          if (!sharedReport.is_active) {
            return NextResponse.json({ error: 'Report is no longer active' }, { status: 403 })
          }
          if (sharedReport.expires_at && new Date(sharedReport.expires_at) < new Date()) {
            return NextResponse.json({ error: 'Report has expired' }, { status: 403 })
          }

          // If the report requires email capture, deny access via share token
          if (sharedReport.requires_email_capture) {
            return NextResponse.json({ error: 'Access requires email capture' }, { status: 403 })
          }

          brandId = sharedReport.brand_id
          isPublicAccess = true
        }
      }
    } else {
      // Regular authenticated user flow
      const user = await getCurrentUser()
      if (!user?.clerkUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      clerkUserId = user.clerkUserId
    }
    
    // Parse query parameters
    const period = searchParams.get('period') || 'all'
    const modelName = searchParams.get('model') || null
    const modelNames = searchParams.get('models')?.split(',').filter(Boolean) || null // Support multiple models
    const geography = searchParams.get('geography')?.split(',').filter(Boolean) || null // Geography filter
    const promptCategory = searchParams.get('category') || undefined
    const includeCompetitors = searchParams.get('includeCompetitors') === 'true'
    
    // Calculate date range from period
    const endDate = new Date().toISOString()
    let startDate: string
    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        break
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        break
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
        break
      case 'all':
        startDate = new Date(0).toISOString()
        break
      default:
        startDate = new Date(0).toISOString()
    }
    
    // Get brand and account info (including domain fields for source classification)
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id, name, slug, account_id, primary_domain, domain, brand_website, company_website')
      .eq('id', brandId)
      .single()
    
    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }
    
    // Verify user has access to this brand's account (skip for public access)
    if (!isPublicAccess && clerkUserId) {
      const { data: accountUser } = await supabase
        .from('account_users')
        .select('account_id')
        .eq('clerk_id', clerkUserId)
        .eq('account_id', brand.account_id)
        .eq('is_active', true)
        .single()
      
      if (!accountUser) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // ─── Resolve account timezone for consistent date boundaries ───
    const accountTz = await getAccountTimezone(supabase, brand.account_id)
    const todayInTz = getDateInTimezone(accountTz)
    
    const params_data = {
      accountId: brand.account_id,
      brandId: brand.id,
      startDate,
      endDate,
      modelName: modelNames && modelNames.length > 0 ? modelNames[0] : modelName, // Use first model if multiple
      modelNames, // Store all selected models for JS filtering
      geography, // Store geography for JS filtering
      promptCategory
    }
    
    // Check if data exists within the requested date range.
    // If not, expand to the actual data range so users always see their data.
    let effectiveStartDate = startDate
    let effectiveEndDate = endDate
    let effectivePeriod = period

    // ─── Expand date range to actual data if requested window is empty ───
    const { data: dateRange } = await supabase
      .from('daily_brand_metrics')
      .select('run_date')
      .eq('brand_id', brandId)
      .order('run_date', { ascending: true })
      .limit(1)
      .single()

    if (dateRange) {
      const dataStart = new Date(dateRange.run_date + 'T00:00:00Z')
      if (dataStart < new Date(effectiveStartDate)) {
        // Data exists before the requested window — keep requested
      }
      if (period !== 'all') {
        // Check if any data exists in the window (use timezone-aware today)
        const { count } = await supabase
          .from('daily_brand_metrics')
          .select('id', { count: 'exact', head: true })
          .eq('brand_id', brandId)
          .gte('run_date', effectiveStartDate.split('T')[0])
          .lte('run_date', todayInTz)

        if (!count || count === 0) {
          // No data in window — expand to all
          effectiveStartDate = new Date(0).toISOString()
          effectivePeriod = 'all'
        }
      }
    }

    const startDateStr = effectiveStartDate.split('T')[0]
    // Use the account timezone for the end date so that "today" matches
    // the same date the orchestrator/aggregator used for run_date.
    // Without this, a UTC endDate can be one day behind the user's local
    // date, causing the latest run_date to be excluded from queries.
    const endDateStr = todayInTz

    // ─── Phase 3: Parallel fetch of all independent data ───
    const [
      { data: brandMetrics },
      { data: competitorLinks },
      { data: brandResponseRows },
      { data: recentFiles },
      { data: modelRows },
      { data: promptMetricsData },
      { data: modelMetricsData },
      locationsResult,
    ] = await Promise.all([
      // Brand metrics
      supabase
        .from('daily_brand_metrics')
        .select('*')
        .eq('brand_id', brandId)
        .gte('run_date', startDateStr)
        .lte('run_date', endDateStr)
        .order('run_date', { ascending: false }),
      // Competitors
      supabase
        .from('competitors')
        .select('id, competitor_name, competitor_domain')
        .eq('brand_id', brandId),
      // Response IDs for scoping
      supabase
        .from('llm_response_files')
        .select('id')
        .eq('brand_id', brandId)
        .gte('created_at', effectiveStartDate)
        .lte('created_at', effectiveEndDate),
      // Recent chats
      supabase
        .from('llm_response_files')
        .select('id, prompt_id, prompt_text, model_name, model_provider, response_preview, created_at')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false })
        .limit(200),
      // Available models
      supabase
        .from('llm_response_files')
        .select('model_name')
        .eq('brand_id', brandId)
        .eq('extraction_status', 'complete'),
      // Prompt performance metrics
      supabase
        .from('daily_prompt_metrics')
        .select('prompt_id, lvi_score, visibility_rate, share_of_voice, avg_sentiment, avg_brand_rank, citation_rate, total_responses, best_performing_model, run_date')
        .eq('brand_id', brandId)
        .gte('run_date', startDateStr)
        .lte('run_date', endDateStr)
        .order('run_date', { ascending: false }),
      // Per-model metrics (for per-model timeseries breakdown)
      supabase
        .from('daily_model_metrics')
        .select('model_name, run_date, total_responses, responses_with_mention, visibility_rate, citation_rate, recommendation_rate, avg_brand_rank, avg_sentiment, lvi_score, share_of_voice, total_citations, total_brand_mentions')
        .eq('brand_id', brandId)
        .gte('run_date', startDateStr)
        .lte('run_date', endDateStr)
        .order('run_date', { ascending: false }),
      // Locations
      supabase
        .from('user_prompts')
        .select(`locale, country:countries(name)`)
        .eq('brand_id', brandId)
        .not('locale', 'is', null),
    ])

    const competitorIds = (competitorLinks || []).map(c => c.id)

    // Fetch competitor metrics (depends on competitorIds)
    let competitorMetrics: any[] = []
    if (includeCompetitors && competitorIds.length > 0) {
      const { data: compMetrics } = await supabase
        .from('daily_competitor_metrics')
        .select('*')
        .in('competitor_id', competitorIds)
        .gte('run_date', startDateStr)
        .lte('run_date', endDateStr)
        .order('run_date', { ascending: false })

      competitorMetrics = compMetrics || []
    }

    // ─── Zero-visibility enforcement helper ───
    // If a brand has 0 visibility (no mentions), LVI must be 0 and sentiment/position are meaningless.
    // This enforces the rule at the API layer regardless of what's stored in the DB.
    const enforceZeroVisibility = (m: any) => {
      const vis = m?.visibility_rate ?? m?.mention_rate ?? 0
      const mentions = m?.responses_with_mention ?? m?.total_mentions ?? 0
      if (vis === 0 && mentions === 0) {
        return {
          lvi_score: 0,
          avg_sentiment: null,   // No mentions = no sentiment data
          avg_brand_rank: null, // No mentions = no position
          share_of_voice: null, // No mentions = no share to report
        }
      }
      return null // No override needed
    }

    // Build stats array (primary brand + competitors)
    const latestPrimary = brandMetrics?.[0]
    const statsArray: any[] = []

    if (latestPrimary) {
      const zeroOverride = enforceZeroVisibility(latestPrimary)
      statsArray.push({
        brand_name: brand.name,
        is_primary: true,
        lvi_score: zeroOverride?.lvi_score ?? latestPrimary.lvi_score,
        mention_rate: latestPrimary.visibility_rate,
        citation_rate: latestPrimary.citation_rate,
        avg_sentiment: zeroOverride?.avg_sentiment ?? latestPrimary.avg_sentiment,
        avg_position: zeroOverride ? 0 : (latestPrimary.avg_brand_rank ?? 0),
        share_of_voice: zeroOverride?.share_of_voice ?? latestPrimary.share_of_voice,
        total_responses: latestPrimary.total_responses,
        total_mentions: latestPrimary.responses_with_mention,
        first_position_count: 0,
        top_3_count: 0,
        citation_count: latestPrimary.total_citations,
      })
    }

    // Add competitor stats
    if (includeCompetitors) {
      const compByCompetitorId = new Map<string, any>()
      for (const m of competitorMetrics) {
        if (!compByCompetitorId.has(m.competitor_id)) compByCompetitorId.set(m.competitor_id, m)
      }

      for (const comp of competitorLinks || []) {
        const cm = compByCompetitorId.get(comp.id)
        const zeroOverride = cm ? enforceZeroVisibility(cm) : null
        statsArray.push({
          brand_name: comp.competitor_name,
          is_primary: false,
          lvi_score: zeroOverride?.lvi_score ?? (cm?.lvi_score ?? 0),
          mention_rate: cm?.visibility_rate ?? 0,
          citation_rate: cm?.citation_rate ?? 0,
          avg_sentiment: zeroOverride?.avg_sentiment !== undefined ? zeroOverride.avg_sentiment : (cm?.avg_sentiment ?? null),
          avg_position: zeroOverride ? 0 : (cm?.avg_brand_rank ?? 0),
          share_of_voice: zeroOverride?.share_of_voice ?? (cm?.share_of_voice ?? 0),
          total_responses: cm?.total_responses ?? 0,
          total_mentions: cm?.responses_with_mention ?? 0,
          first_position_count: 0,
          top_3_count: 0,
          citation_count: cm?.total_citations ?? 0,
        })
      }
    }

    // ─── Timeseries from daily_brand_metrics ───
    // Helper to build a timeseries entry with zero-visibility enforcement
    const buildTimeseriesEntry = (m: any, isPrimary: boolean, brandName: string) => {
      const zeroOverride = enforceZeroVisibility(m)
      const isInvisible = !!zeroOverride
      return {
        metric_date: m.run_date,
        lvi_score: isInvisible ? 0 : m.lvi_score,
        visibility_component: m.visibility_rate,
        citation_component: m.citation_rate,
        sentiment_component: isInvisible ? 0 : (((m.avg_sentiment ?? 0) + 1) / 2) * 100,
        position_component: isInvisible ? 0 : (m.avg_brand_rank ? Math.max(0, (1 - (m.avg_brand_rank - 1) / 9)) * 100 : 0),
        mention_rate: m.visibility_rate,
        citation_rate: m.citation_rate,
        share_of_voice: isInvisible ? null : m.share_of_voice,
        avg_sentiment: isInvisible ? null : m.avg_sentiment,
        avg_position: isInvisible ? null : m.avg_brand_rank,
        total_responses: m.total_responses,
        total_mentions: m.responses_with_mention,
        mention_count: m.responses_with_mention,
        citation_count: m.total_citations,
        is_primary: isPrimary,
        brand_name: brandName,
      }
    }

    const timeseriesData: any[] = []
    for (const m of (brandMetrics || []).reverse()) {
      timeseriesData.push(buildTimeseriesEntry(m, true, brand.name))
    }

    // Add competitor timeseries
    if (includeCompetitors && competitorMetrics.length > 0) {
      const compNameMap = new Map((competitorLinks || []).map(c => [c.id, c.competitor_name]))
      for (const m of competitorMetrics.reverse()) {
        const compName = compNameMap.get(m.competitor_id) || m.competitor_name || 'Competitor'
        timeseriesData.push(buildTimeseriesEntry(m, false, compName))
      }
    }

    // ─── Per-model timeseries from daily_model_metrics ───
    // These entries carry model_name so the report can build per-model breakdowns
    // (e.g. "ChatGPT shows 80% mention rate vs Gemini 40%")
    for (const mm of (modelMetricsData || []).reverse()) {
      const zeroOverride = enforceZeroVisibility(mm)
      const isInvisible = !!zeroOverride
      timeseriesData.push({
        metric_date: mm.run_date,
        model_name: mm.model_name,
        lvi_score: isInvisible ? 0 : mm.lvi_score,
        visibility_component: mm.visibility_rate,
        citation_component: mm.citation_rate,
        sentiment_component: isInvisible ? 0 : (((mm.avg_sentiment ?? 0) + 1) / 2) * 100,
        position_component: isInvisible ? 0 : (mm.avg_brand_rank ? Math.max(0, (1 - (mm.avg_brand_rank - 1) / 9)) * 100 : 0),
        mention_rate: mm.visibility_rate,
        citation_rate: mm.citation_rate,
        share_of_voice: isInvisible ? null : mm.share_of_voice,
        avg_sentiment: isInvisible ? null : mm.avg_sentiment,
        avg_position: isInvisible ? null : mm.avg_brand_rank,
        total_responses: mm.total_responses,
        total_mentions: mm.responses_with_mention,
        mention_count: mm.responses_with_mention,
        citation_count: mm.total_citations,
        is_primary: true,
        brand_name: brand.name,
      })
    }

    // ─── Fill missing primary dates ───
    // Collect all run dates from competitor metrics + prompt metrics so the
    // chart shows every date a run occurred (even if primary brand has no
    // daily_brand_metrics row, e.g. aggregation in progress or zero responses).
    const primaryDates = new Set((brandMetrics || []).map((m: any) => m.run_date))
    const allRunDates = new Set<string>(primaryDates)
    for (const m of competitorMetrics) allRunDates.add(m.run_date)
    for (const m of (promptMetricsData || [])) allRunDates.add(m.run_date)

    for (const date of allRunDates) {
      if (!primaryDates.has(date)) {
        // Placeholder for a date where the primary brand has no aggregated row.
        // null = "no data" (renders as "—"), distinct from 0 = "measured zero".
        timeseriesData.push({
          metric_date: date,
          lvi_score: null,
          visibility_component: 0,
          citation_component: 0,
          sentiment_component: null,
          position_component: null,
          mention_rate: 0,
          citation_rate: 0,
          share_of_voice: null,
          avg_sentiment: null,
          avg_position: null,
          total_responses: 0,
          total_mentions: 0,
          mention_count: 0,
          citation_count: 0,
          is_primary: true,
          brand_name: brand.name,
          _no_data: true, // Flag for frontend to show "—" instead of "0"
        })
      }
    }

    // ─── Rankings (all brands sorted by LVI) ───
    const rankingsData: any[] = []
    const allStats = [...statsArray].sort((a, b) => (b.lvi_score ?? 0) - (a.lvi_score ?? 0))
    allStats.forEach((s, idx) => {
      rankingsData.push({
        rank: idx + 1,
        brand_name: s.brand_name,
        is_primary: s.is_primary,
        lvi_score: s.lvi_score,
        mention_rate: s.mention_rate,
        avg_sentiment: s.avg_sentiment,
        share_of_voice: s.share_of_voice,
        avg_position: s.avg_position,
        total_mentions: s.total_mentions,
        total_responses: s.total_responses,
        first_position_count: 0,
        citation_count: s.citation_count,
        lvi_change: 0,
        lvi_change_pct: 0,
        mention_rate_change: 0,
        mention_rate_change_pct: 0,
        sentiment_change: 0,
        sentiment_change_pct: 0,
        avg_position_change: 0,
        avg_position_change_pct: 0,
        share_of_voice_change: 0,
        share_of_voice_change_pct: 0,
      })
    })

    // ─── Get response IDs for the current brand (for scoping topics & citations) ───
    const brandResponseIds = (brandResponseRows || []).map(r => r.id)

    // ─── Citations from aeo_citations (scoped to brand's responses) ───
    // Build domain classification helpers for consistent owned/competitor detection
    const normalizeDomain = (d: string | null | undefined): string | null => {
      if (!d) return null
      return d.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase()
    }
    const ownedDomains = new Set(
      [brand?.primary_domain, brand?.domain, brand?.brand_website, brand?.company_website]
        .map(normalizeDomain)
        .filter((d): d is string => !!d)
    )
    const competitorDomainMap = new Map<string, string>()
    for (const comp of competitorLinks || []) {
      const d = normalizeDomain(comp.competitor_domain)
      if (d) competitorDomainMap.set(d, comp.competitor_name || d)
    }

    const brandNameClean = (brand?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    const brandSlug = (brand?.slug || '').toLowerCase()
    const BRAND_PREFIXES = ['with', 'get', 'try', 'go', 'use', 'my', 'the', 'hey', 'join']
    const stripPrefixes = (s: string) => {
      for (const p of BRAND_PREFIXES) { if (s.startsWith(p) && s.length > p.length) return s.slice(p.length) }
      return s
    }
    const isOwnedDomain = (domain: string): boolean => {
      const d = domain.toLowerCase().replace(/^www\./, '')
      if (ownedDomains.has(d)) return true
      for (const owned of ownedDomains) {
        if (d.endsWith('.' + owned) || owned.endsWith('.' + d)) return true
        if (stripPrefixes(d.split('.')[0]) === stripPrefixes(owned.split('.')[0])) return true
      }
      const base = d.split('.')[0]
      const stripped = stripPrefixes(base)
      if (brandNameClean.length >= 3 && (stripped === brandNameClean || base === brandNameClean)) return true
      if (brandSlug.length >= 3 && (stripped === brandSlug || base === brandSlug)) return true
      return false
    }
    const classifyDomainType = (domain: string): string => {
      if (isOwnedDomain(domain)) return 'owned'
      const d = domain.toLowerCase().replace(/^www\./, '')
      // Check stored competitors only
      for (const [compDomain] of competitorDomainMap) {
        if (d === compDomain || d.endsWith('.' + compDomain) || compDomain.endsWith('.' + d)) return 'competitor'
        if (stripPrefixes(d.split('.')[0]) === stripPrefixes(compDomain.split('.')[0])) return 'competitor'
      }
      // Classify by well-known domain patterns (overrides potentially wrong DB values)
      if (/reuters|apnews|bbc|cnn|nytimes|washingtonpost|theguardian|bloomberg|techcrunch|theverge|wired|arstechnica|zdnet|venturebeat|searchengineland|searchenginejournal/.test(d)) return 'news'
      if (/arxiv|scholar\.google|nature\.com|sciencedirect|pubmed|jstor|ieee|springer|wiley/.test(d)) return 'research'
      if (/\.gov\b|\.gov\./.test(d)) return 'government'
      if (/\.edu\b|\.ac\./.test(d) || /coursera|udemy|khanacademy/.test(d)) return 'academic'
      if (/reddit\.com|quora\.com|stackexchange|stackoverflow|forums?\./.test(d)) return 'ugc'
      if (/g2\.com|capterra|yelp|trustpilot|trustradius/.test(d)) return 'directory'
      if (/twitter\.com|x\.com|linkedin\.com|facebook\.com|instagram\.com|youtube\.com/.test(d)) return 'social'
      if (/wikipedia\.org|wikimedia/.test(d)) return 'earned'
      return 'earned' // Default: third-party source
    }
    // ─── Phase 4: Parallel batch fetches (citations + topics) ───
    // Helper to fetch in parallel batches
    const fetchInBatches = async <T>(
      ids: string[],
      batchSize: number,
      fetcher: (batch: string[]) => Promise<T[]>
    ): Promise<T[]> => {
      if (ids.length === 0) return []
      const batches = []
      for (let i = 0; i < ids.length; i += batchSize) {
        batches.push(ids.slice(i, i + batchSize))
      }
      const results = await Promise.all(batches.map(fetcher))
      return results.flat()
    }

    // Run citation fetch and topic fetch in parallel
    const [citationData, tbaDataRaw] = await Promise.all([
      // Citations
      fetchInBatches(brandResponseIds, 200, async (batch) => {
        const { data } = await supabase
          .from('aeo_citations')
          .select('response_id, domain, url, page_title, source_type, content_category, benefits_brand_id, citation_rank, times_referenced, created_at')
          .in('response_id', batch)
          .order('times_referenced', { ascending: false })
          .limit(500)
        return data || []
      }),
      // Topics
      fetchInBatches(brandResponseIds, 200, async (batch) => {
        const { data } = await supabase
          .from('topic_brand_associations')
          .select('topic_name, topic_category, brand_name, sentiment, relevance')
          .in('response_id', batch)
        return data || []
      }),
    ])

    // Build a map of response_id → mentioned brand names (for brands_citing)
    const citResponseIds = [...new Set(citationData.map(c => c.response_id).filter(Boolean))]
    const responseBrandNamesMap = new Map<string, string[]>()
    if (citResponseIds.length > 0) {
      // Get primary brand mentions
      const { data: primaryRd } = await supabase
        .from('response_data')
        .select('response_id, brand_id, competitor_id, mentioned')
        .in('response_id', citResponseIds.slice(0, 500))
        .eq('mentioned', true)
      // Collect competitor IDs that are mentioned
      const mentionedCompIds = [...new Set((primaryRd || []).filter(r => r.competitor_id).map(r => r.competitor_id))]
      const compNameMap = new Map<string, string>()
      if (mentionedCompIds.length > 0) {
        const { data: compRows } = await supabase.from('competitors').select('id, name').in('id', mentionedCompIds)
        for (const c of compRows || []) compNameMap.set(c.id, c.name)
      }
      for (const rd of primaryRd || []) {
        if (!responseBrandNamesMap.has(rd.response_id)) responseBrandNamesMap.set(rd.response_id, [])
        const name = rd.competitor_id ? compNameMap.get(rd.competitor_id) : brand.name
        if (name && !responseBrandNamesMap.get(rd.response_id)!.includes(name)) {
          responseBrandNamesMap.get(rd.response_id)!.push(name)
        }
      }
    }

    // Aggregate citations by domain
    const domainMap = new Map<string, { domain: string; type: string; total: number; uniqueResponses: Set<string>; primaryCount: number; compCount: number; urls: any[]; brandNames: Set<string> }>()
    for (const c of citationData || []) {
      if (!domainMap.has(c.domain)) {
        // Reclassify source type using brand/competitor domain matching
        const reclassified = classifyDomainType(c.domain)
        domainMap.set(c.domain, {
          domain: c.domain,
          type: reclassified || c.source_type || 'web',
          total: 0,
          uniqueResponses: new Set(),
          primaryCount: 0,
          compCount: 0,
          urls: [],
          brandNames: new Set(),
        })
      }
      const d = domainMap.get(c.domain)!
      d.total += c.times_referenced || 1
      d.uniqueResponses.add(c.response_id || c.url || c.domain)
      if (c.benefits_brand_id === brandId) d.primaryCount++
      else d.compCount++
      if (d.urls.length < 5 && c.url) {
        d.urls.push({ url: c.url, title: c.page_title, type: c.content_category })
      }
      // Collect brand names mentioned in this response
      const mentionedInResponse = responseBrandNamesMap.get(c.response_id) || []
      for (const bn of mentionedInResponse) d.brandNames.add(bn)
    }

    const totalResponseCount = brandResponseIds.length || 1
    const citationsFormatted = [...domainMap.values()]
      .sort((a, b) => b.total - a.total)
      .map(d => ({
        source_domain: d.domain,
        source_type: d.type,
        total_citations: d.total,
        unique_responses_citing: d.uniqueResponses.size,
        usage_frequency: Math.round((d.uniqueResponses.size / totalResponseCount) * 100 * 10) / 10,
        avg_citation_position: 1,
        first_citation_count: 0,
        brands_citing: [...d.brandNames],
        primary_brand_citations: d.primaryCount,
        competitor_citations: d.compCount,
        is_authoritative: d.total >= 3,
        trust_score: Math.min(100, d.total * 10),
        citationUrls: d.urls,
      }))

    // Citation opportunities: domains cited for competitors but not primary brand
    const citOpps = citationsFormatted
      .filter(c => c.primary_brand_citations === 0 && c.competitor_citations > 0)
      .map(c => ({
        source_domain: c.source_domain,
        source_type: c.source_type,
        total_citations: c.total_citations,
        competitor_citations: c.competitor_citations,
        trust_score: c.trust_score,
        opportunity_score: Math.min(100, c.competitor_citations * 20),
        associated_topics: [],
      }))

    // ─── Topic-Brand Matrix from topic_brand_associations table ───
    let tbaData: any[] = [...tbaDataRaw]

    // Aggregate: group by (topic_name, brand_name)
    const topicBrandAgg = new Map<string, Map<string, { count: number; sentSum: number; relSum: number }>>()
    for (const row of tbaData) {
      const topicName = row.topic_name
      const brandName = row.brand_name
      if (!topicName || !brandName) continue

      if (!topicBrandAgg.has(topicName)) topicBrandAgg.set(topicName, new Map())
      const brandMap = topicBrandAgg.get(topicName)!

      if (!brandMap.has(brandName)) brandMap.set(brandName, { count: 0, sentSum: 0, relSum: 0 })
      const entry = brandMap.get(brandName)!
      entry.count++
      entry.sentSum += row.sentiment || 0
      entry.relSum += row.relevance || 0
    }

    const topicMatrixFormatted = {
      topics: [...topicBrandAgg.keys()],
      brands: [...new Set([brand.name, ...[...topicBrandAgg.values()].flatMap(v => [...v.keys()])])],
      data: [...topicBrandAgg.entries()].flatMap(([topic, brands]) =>
        [...brands.entries()].map(([bName, stats]) => ({
          topic,
          brand: bName,
          value: stats.count,
          sentiment: stats.count > 0 ? Math.round((stats.sentSum / stats.count) * 100) / 100 : 0,
          relevance: stats.count > 0 ? Math.round((stats.relSum / stats.count) * 100) / 100 : 0,
        }))
      ),
    }

    // Topic opportunities: topics where primary brand has low coverage
    const topicOppsFormatted = [...topicBrandAgg.entries()]
      .filter(([, brands]) => !brands.has(brand.name) || (brands.get(brand.name)?.count || 0) < 2)
      .map(([topic, brands]) => {
        const mentionCount = [...brands.values()].reduce((s, b) => s + b.count, 0)
        const avgRelevance = [...brands.values()].reduce((s, b) => s + b.relSum, 0) / Math.max(1, mentionCount)
        const competitorCount = [...brands.keys()].filter(n => n !== brand.name).length
        // Score: higher when competitors are active + topic is relevant + brand is absent
        const brandPresence = brands.get(brand.name)?.count || 0
        const opportunityScore = Math.min(100, Math.round(
          (competitorCount * 20) + (avgRelevance * 40) + (brandPresence === 0 ? 30 : 10)
        ))
        return {
          topic_name: topic,
          topic_category: tbaData.find(d => d.topic_name === topic)?.topic_category || 'general',
          mention_count: mentionCount,
          relevance_score: avgRelevance,
          opportunity_score: opportunityScore,
          shared_with_competitors: [...brands.keys()].filter(n => n !== brand.name),
        }
      })

    // ─── Recent chats (already fetched in Phase 3) ───

    // Deduplicate: keep only the latest response per (prompt_text, model_name)
    // This prevents multiple runs from creating duplicate entries
    const fileDedupMap = new Map<string, (typeof recentFiles extends (infer T)[] | null ? T : never)>()
    for (const f of recentFiles || []) {
      if (!f.prompt_text) continue
      const key = `${f.prompt_text.trim().toLowerCase()}||${f.model_name}`
      if (!fileDedupMap.has(key)) {
        fileDedupMap.set(key, f) // already ordered by created_at desc, first seen = latest
      }
    }
    const dedupedFiles = Array.from(fileDedupMap.values())
    const dedupedResponseIds = dedupedFiles.map(f => f.id)

    // Enrich with analysis data + citations in parallel
    let recentRdMap = new Map<string, any>()
    let recentCitations: any[] = []
    if (dedupedResponseIds.length > 0) {
      const [rdResult, citsResult] = await Promise.all([
        supabase
          .from('response_data')
          .select('response_id, brand_rank, brand_mention_count, co_mentioned_brands, raw_sentiment, mentioned, competitive_density')
          .eq('brand_id', brandId)
          .is('competitor_id', null)
          .in('response_id', dedupedResponseIds),
        supabase
          .from('aeo_citations')
          .select('response_id, domain, url, page_title')
          .in('response_id', dedupedResponseIds)
          .limit(500),
      ])
      for (const rd of rdResult.data || []) {
        recentRdMap.set(rd.response_id, rd)
      }
      recentCitations = citsResult.data || []
    }
    const citsByResponse = new Map<string, any[]>()
    for (const c of recentCitations) {
      if (!citsByResponse.has(c.response_id)) citsByResponse.set(c.response_id, [])
      citsByResponse.get(c.response_id)!.push({ url: c.url || '', domain: c.domain || '', title: c.page_title || '' })
    }

    const recentMentionsFormatted = dedupedFiles.map(f => {
      const rd = recentRdMap.get(f.id)
      const coMentioned = (rd?.co_mentioned_brands || []).map((name: string) => ({
        name,
        isPrimary: name.toLowerCase() === brand.name.toLowerCase(),
      }))
      // Compute gSOV using competitive_density (total brands detected in response)
      // This is consistent with the aggregator formula: (1 / competitive_density) * 100
      // Unlike counting only tracked competitor mentions, competitive_density includes ALL
      // brands detected by the brand-detection agent (e.g. Peec AI even if not tracked)
      let gsov: number | null = null
      if (rd?.mentioned && rd.competitive_density > 0) {
        gsov = Math.round((1 / rd.competitive_density) * 100 * 10) / 10
      }
      return {
        prompt_id: f.prompt_id || null,
        prompt_text: f.prompt_text || '',
        brand_position: rd?.brand_rank ?? null,
        gsov,
        mentioned: rd?.mentioned ?? false,
        mentions: rd?.brand_mention_count ?? 0,
        sentiment: rd?.raw_sentiment ?? null,
        model_name: f.model_name || 'unknown',
        model_provider: f.model_provider || null,
        response_snippet: f.response_preview?.substring(0, 200) || null,
        mentioned_brands: coMentioned,
        sources_cited: citsByResponse.get(f.id) || [],
        analysis_date: f.created_at,
        date: f.created_at,
      }
    })

    // ─── Available models (already fetched in Phase 3) ───
    const availableModels = [...new Set((modelRows || []).map(m => m.model_name).filter(Boolean))].sort()

    // ─── Prompt performance (already fetched in Phase 3) ───

    // Get latest per prompt
    const promptLatest = new Map<string, any>()
    for (const pm of promptMetricsData || []) {
      if (!promptLatest.has(pm.prompt_id)) promptLatest.set(pm.prompt_id, pm)
    }

    // Get prompt text
    const promptIdsForPerf = [...promptLatest.keys()]
    let promptTexts = new Map<string, any>()
    if (promptIdsForPerf.length > 0) {
      const { data: prompts } = await supabase
        .from('user_prompts')
        .select('id, prompt_text, category')
        .in('id', promptIdsForPerf.slice(0, 200))
      for (const p of prompts || []) {
        promptTexts.set(p.id, p)
      }
    }

    const promptPerf = [...promptLatest.entries()].map(([pid, pm]) => {
      const pt = promptTexts.get(pid)
      return {
        prompt_id: pid,
        prompt_text: pt?.prompt_text || '',
        prompt_category: pt?.category || 'general',
        prompt_intent: pt?.category || 'general',
        primary_mention_count: pm.visibility_rate > 0 ? Math.round(pm.total_responses * pm.visibility_rate / 100) : 0,
        competitor_mention_count: 0,
        opportunity_score: pm.visibility_rate < 30 ? 80 : pm.visibility_rate < 60 ? 50 : 20,
        total_responses: pm.total_responses,
        competitors_mentioned: [],
        primary_avg_position: pm.avg_brand_rank ?? 0,
        competitor_avg_position: 0,
        primary_avg_sentiment: pm.avg_sentiment,
        primary_sov: pm.share_of_voice,
      }
    })

    const opportunities = promptPerf.filter(p => p.primary_mention_count === 0 || p.opportunity_score > 50)
    const threats = promptPerf.filter(p => p.primary_avg_sentiment < -0.2 && p.primary_mention_count > 0)
    const strengths = promptPerf.filter(p => p.primary_mention_count > 0 && p.primary_avg_sentiment > 0.3)

    // Get primary brand stats (first result should be primary)
    const primaryStats = statsArray.find(s => s.is_primary) || null
    
    // Process locations (already fetched in Phase 3)
    const locationData = locationsResult.data || []
    const uniqueLocations = [...new Set(locationData.map((p: any) => p.country?.name).filter(Boolean))].sort()
    
    // Filter timeseries data by multiple models if specified
    let filteredTimeseries = timeseriesData
    if (modelNames && modelNames.length > 0) {
      filteredTimeseries = filteredTimeseries.filter((t: any) => {
        if (!t.model_name) return true // Include aggregated rows without model
        return modelNames.some(m => {
          const modelLower = m.toLowerCase()
          const tModelLower = t.model_name?.toLowerCase() || ''
          return tModelLower.includes(modelLower) || modelLower.includes(tModelLower)
        })
      })
    }
    
    // Filter recent mentions by multiple models and geography if specified
    let filteredMentions = recentMentionsFormatted
    if (modelNames && modelNames.length > 0) {
      filteredMentions = filteredMentions.filter((m: any) => {
        if (!m.model_name) return true
        return modelNames.some((model: string) => {
          const modelLower = model.toLowerCase()
          const mModelLower = m.model_name?.toLowerCase() || ''
          return mModelLower.includes(modelLower) || modelLower.includes(mModelLower)
        })
      })
    }
    
    // Calculate metadata
    const totalResponses = primaryStats?.total_responses || 0
    const totalPrompts = promptLatest.size
    
    // Build response
    const responseData = {
      stats: statsArray,
      timeseries: filteredTimeseries,
      rankings: rankingsData,
      topicMatrix: topicMatrixFormatted,
      prompts: {
        opportunities: opportunities.slice(0, 10),
        threats: threats.slice(0, 10),
        strengths: strengths.slice(0, 10)
      },
      citations: citationsFormatted,
      citationOpportunities: citOpps,
      topicOpportunities: topicOppsFormatted,
      recentMentions: filteredMentions,
      metadata: {
        brand_name: brand.name,
        period: effectivePeriod,
        start_date: effectiveStartDate,
        end_date: effectiveEndDate,
        requested_period: period,
        date_range_expanded: effectivePeriod !== period,
        total_responses: totalResponses,
        total_prompts: totalPrompts,
        account_timezone: accountTz,
        filters: {
          model: modelName,
          models: modelNames,
          geography: geography,
          category: promptCategory
        },
        last_updated: new Date().toISOString(),
        availableLocations: uniqueLocations,
        availableModels: availableModels
      }
    }

    console.log(`[Report Data] ${searchParams.get('period') || 'all'} completed in ${Date.now() - t0}ms`)
    return NextResponse.json(responseData)
    
  } catch (error) {
    console.error('Report data error:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
