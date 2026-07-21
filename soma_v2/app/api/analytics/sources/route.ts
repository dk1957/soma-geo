import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Sources & Citations API
 * ======================
 * Reads from aeo_citations table.
 *
 * Query params:
 * - brandId (required): Brand UUID
 * - startDate (optional): ISO date string
 * - endDate (optional): ISO date string
 * - limit (optional): Max results (default: 50)
 * - sourceType (optional): Filter by source_type
 */

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const sourceType = searchParams.get('sourceType')

    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Get brand account_id + domain fields for auth check and source classification
    const { data: brand } = await supabase
      .from('brands')
      .select('account_id, name, slug, primary_domain, domain, brand_website, company_website')
      .eq('id', brandId)
      .single()

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Verify access
    const { data: access } = await supabase
      .from('account_users')
      .select('id')
      .eq('account_id', brand.account_id)
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)
      .single()

    if (!access) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const effectiveStartDate = startDate || new Date(0).toISOString()
    const effectiveEndDate = endDate || new Date().toISOString()

    // Load competitors for classification
    const { data: dbCompetitors } = await supabase
      .from('competitors')
      .select('competitor_name, competitor_domain')
      .eq('brand_id', brandId)

    // Build domain classification helpers (same logic as getCitationDomains)
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
    for (const comp of dbCompetitors || []) {
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
    const isCompetitorDomain = (domain: string): boolean => {
      const d = domain.toLowerCase().replace(/^www\./, '')
      // Check stored competitors only
      for (const [compDomain] of competitorDomainMap) {
        if (d === compDomain || d.endsWith('.' + compDomain) || compDomain.endsWith('.' + d)) return true
        if (stripPrefixes(d.split('.')[0]) === stripPrefixes(compDomain.split('.')[0])) return true
      }
      return false
    }
    const classifyDomainType = (domain: string, fallback: string): string => {
      if (isOwnedDomain(domain)) return 'owned'
      if (isCompetitorDomain(domain)) return 'competitor'
      return fallback
    }

    // Query aeo_citations for this brand's account
    let citationsQuery = supabase
      .from('aeo_citations')
      .select('*')
      .eq('account_id', brand.account_id)
      .gte('created_at', effectiveStartDate)
      .lte('created_at', effectiveEndDate)
      .order('created_at', { ascending: false })

    if (sourceType) citationsQuery = citationsQuery.eq('source_type', sourceType)

    const { data: citations, error: citError } = await citationsQuery.limit(2000)

    if (citError) {
      console.error('Citations query error:', citError)
      return NextResponse.json({ error: 'Failed to fetch citations' }, { status: 500 })
    }

    const allCitations = citations || []

    // Load domain metadata from the domains table (canonical source registry)
    const citedDomains = [...new Set(allCitations.map(c => c.domain))]
    const { data: domainRecords } = await supabase
      .from('domains')
      .select('id, domain, display_name, source_type, content_category, domain_authority, is_high_authority, is_known_aggregator, is_social_platform, total_citations, first_seen_at, last_cited_at')
      .in('domain', citedDomains)

    const domainLookup = new Map((domainRecords || []).map(d => [d.domain, d]))

    // Aggregate by domain — use domains table for metadata, citations for per-query counts
    const domainMap = new Map<string, {
      domain: string
      display_name: string | null
      total_citations: number
      times_referenced: number
      source_type: string
      content_categories: Set<string>
      benefits_brand: boolean
      is_competitor: boolean
      domain_authority: number | null
      is_high_authority: boolean
      is_known_aggregator: boolean
      urls: Set<string>
      first_seen: string
      last_seen: string
    }>()

    for (const c of allCitations) {
      const domainMeta = domainLookup.get(c.domain)
      const existing = domainMap.get(c.domain)
      if (existing) {
        existing.total_citations++
        existing.times_referenced += c.times_referenced || 1
        if (c.content_category) existing.content_categories.add(c.content_category)
        if (c.url) existing.urls.add(c.url)
        if (c.benefits_brand_id === brandId) existing.benefits_brand = true
        if (isCompetitorDomain(c.domain)) existing.is_competitor = true
        if (c.created_at < existing.first_seen) existing.first_seen = c.created_at
        if (c.created_at > existing.last_seen) existing.last_seen = c.created_at
      } else {
        const rawType = domainMeta?.source_type || c.source_type || 'earned'
        domainMap.set(c.domain, {
          domain: c.domain,
          display_name: domainMeta?.display_name || null,
          total_citations: 1,
          times_referenced: c.times_referenced || 1,
          source_type: classifyDomainType(c.domain, rawType),
          content_categories: new Set(c.content_category ? [c.content_category] : []),
          benefits_brand: c.benefits_brand_id === brandId,
          is_competitor: isCompetitorDomain(c.domain),
          domain_authority: domainMeta?.domain_authority || c.domain_authority,
          is_high_authority: domainMeta?.is_high_authority || c.is_high_authority || false,
          is_known_aggregator: domainMeta?.is_known_aggregator || false,
          urls: new Set(c.url ? [c.url] : []),
          first_seen: c.created_at,
          last_seen: c.created_at,
        })
      }
    }

    // Convert to sorted array
    const sources = [...domainMap.values()]
      .sort((a, b) => b.total_citations - a.total_citations)
      .slice(0, limit)
      .map(s => ({
        domain: s.domain,
        display_name: s.display_name,
        total_citations: s.total_citations,
        times_referenced: s.times_referenced,
        source_type: s.source_type,
        content_categories: [...s.content_categories],
        benefits_brand: s.benefits_brand,
        is_competitor: s.is_competitor,
        domain_authority: s.domain_authority,
        is_high_authority: s.is_high_authority,
        is_known_aggregator: s.is_known_aggregator,
        unique_urls: s.urls.size,
        first_seen: s.first_seen,
        last_seen: s.last_seen,
      }))

    // Compute summary stats
    const totalSources = domainMap.size
    const highAuthoritySources = [...domainMap.values()].filter(s => s.is_high_authority).length
    const ownedSources = [...domainMap.values()].filter(s => s.source_type === 'owned').length
    const competitorSources = [...domainMap.values()].filter(s => s.is_competitor).length
    const ownContentShare = totalSources > 0 ? (ownedSources / totalSources) * 100 : 0

    // Source type breakdown
    const sourceTypeBreakdown: Record<string, number> = {}
    for (const s of domainMap.values()) {
      sourceTypeBreakdown[s.source_type] = (sourceTypeBreakdown[s.source_type] || 0) + 1
    }

    // Citation Velocity: per-week citation count comparison (current week vs prior week)
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const currentWeekCitations = allCitations.filter(c => new Date(c.created_at) >= weekAgo).length
    const priorWeekCitations = allCitations.filter(c => {
      const d = new Date(c.created_at)
      return d >= twoWeeksAgo && d < weekAgo
    }).length
    const citationVelocityChange = priorWeekCitations > 0
      ? Math.round(((currentWeekCitations - priorWeekCitations) / priorWeekCitations) * 100)
      : currentWeekCitations > 0 ? 100 : 0

    // Top Pages: individual URL ranking by citation count
    const urlMap = new Map<string, { url: string; domain: string; page_title: string | null; total_citations: number; source_type: string; benefits_brand: boolean }>()
    for (const c of allCitations) {
      if (!c.url) continue
      const existing = urlMap.get(c.url)
      if (existing) {
        existing.total_citations++
      } else {
        urlMap.set(c.url, {
          url: c.url,
          domain: c.domain,
          page_title: c.page_title || null,
          total_citations: 1,
          source_type: classifyDomainType(c.domain, c.source_type || 'earned'),
          benefits_brand: c.benefits_brand_id === brandId,
        })
      }
    }
    const topPages = [...urlMap.values()]
      .sort((a, b) => b.total_citations - a.total_citations)
      .slice(0, 20)

    // Competitive Gap: high-authority competitor domains not citing this brand
    const competitiveGapDomains = [...domainMap.values()]
      .filter(s => s.is_competitor && !s.benefits_brand && s.is_high_authority)
      .sort((a, b) => b.total_citations - a.total_citations)
      .slice(0, 10)
      .map(s => ({
        domain: s.domain,
        total_citations: s.total_citations,
        domain_authority: s.domain_authority,
      }))

    return NextResponse.json({
      success: true,
      sources,
      top_pages: topPages,
      competitive_gap: competitiveGapDomains,
      summary: {
        total_sources: totalSources,
        total_citations: allCitations.length,
        high_authority_sources: highAuthoritySources,
        owned_sources: ownedSources,
        competitor_sources: competitorSources,
        own_content_share: Math.round(ownContentShare * 100) / 100,
        source_type_breakdown: sourceTypeBreakdown,
        citation_velocity: {
          current_week: currentWeekCitations,
          prior_week: priorWeekCitations,
          change_percent: citationVelocityChange,
        },
      },
      metadata: {
        total_sources: totalSources,
        date_range: {
          start: effectiveStartDate,
          end: effectiveEndDate,
        },
      },
    })
  } catch (error) {
    console.error('Sources citations API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch sources citations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
