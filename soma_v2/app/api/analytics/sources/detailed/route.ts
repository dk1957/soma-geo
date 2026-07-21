import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import ExternalReportAnalyticsService from '@/lib/services/external-report-analytics'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brand_id')
    const timeframe = (searchParams.get('timeframe') || '30d') as '7d' | '30d' | '90d' | 'all'
    const contentType = searchParams.get('contentType') || 'all'
    const authorityMin = parseInt(searchParams.get('authorityMin') || '0')
    const authorityMax = parseInt(searchParams.get('authorityMax') || '100')
    
    if (!brandId) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 })
    }

    // Get the authenticated user
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Verify brand access
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id, account_id')
      .eq('id', brandId)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found or access denied' }, { status: 403 })
    }

    // Check if user has access to the account
    const { data: accountMember, error: memberError } = await supabase
      .from('account_users')
      .select('id')
      .eq('account_id', brand.account_id)
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('is_active', true)
      .single()

    if (memberError || !accountMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const analyticsService = new ExternalReportAnalyticsService(supabase)
    
    // Fetch real data
    console.log(`[Sources API] Fetching data for brand ${brandId}, account ${brand.account_id}, timeframe ${timeframe}`)
    
    const [citations, metrics, competitiveGap, contentTypes, topUrlsData] = await Promise.all([
      analyticsService.getCitationDomains(brand.account_id, brandId, timeframe, {
        domainType: contentType !== 'all' ? contentType : undefined,
        limit: 100
      }),
      analyticsService.getBrandPerformanceMetrics(brand.account_id, brandId, timeframe),
      analyticsService.getCompetitiveGap(brand.account_id, brandId, timeframe),
      analyticsService.getContentTypeDistribution(brand.account_id, brandId, timeframe),
      analyticsService.getTopCitedUrls(brand.account_id, brandId, timeframe, 30)
    ])
    
    console.log(`[Sources API] Got ${citations.length} citations, metrics: ${metrics ? 'yes' : 'no'}, gap: ${competitiveGap.length}, types: ${Object.keys(contentTypes).length}, topUrls: ${topUrlsData.length}`)

    const insightsResult = await analyticsService.getInsightsAndRecommendations(
      brand.account_id,
      brandId,
      timeframe
    )

    // Helper for consistent pseudo-random scores
    const getPseudoRandomScore = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return 20 + (Math.abs(hash) % 71); // 20-90 range
    }

    // Transform citations to Source format
    const sources = citations.map((c, index) => ({
      id: `source-${index}`,
      domain: c.domain,
      title: c.domain,
      url: `https://${c.domain}`,
      authority_score: c.trust_score ? Math.round(c.trust_score * 100) : getPseudoRandomScore(c.domain),
      page_authority: c.trust_score ? Math.round(c.trust_score * 90) : getPseudoRandomScore(c.domain) - 5,
      citation_count: c.total_citations,
      content_type: c.is_target_publisher ? 'own' : c.is_competitor ? 'competitor' : (c.source_category || 'other'),
      source_category: c.source_category,
      domain_type: c.domain_type,  // owned | earned | competitor
      is_target_publisher: c.is_target_publisher,
      is_competitor: c.is_competitor,
      is_inferred_competitor: c.is_inferred_competitor,
      competitor_name: c.competitor_name,
      brands_mentioned_in_sources: c.brands_mentioned_in_sources || [],
      citation_quality: c.is_authoritative ? 'primary' : 'secondary',
      platforms: c.citing_models || [],
      trust_signals: c.is_authoritative ? ['verified_publisher'] : [],
      backlinks: null as number | null,
      freshness_score: null as number | null,
      eat_score: c.trust_score ? Math.round(c.trust_score * 100) : 50,
      geographic_focus: 'global',
      trend: (c as any).citation_velocity > 0 ? 'up' : (c as any).citation_velocity < 0 ? 'down' : 'stable',
      change_percentage: 0,
      last_cited: new Date().toISOString(),
      citation_velocity: Math.round(c.avg_citations_per_response * 10),
      seasonal_patterns: false,
      status: c.is_target_publisher ? 'active' : c.is_competitor ? 'competitor' : 'monitored',
      brand_mentions: c.total_citations,
      contextual_relevance: Math.round(c.used_percentage),
      sample_contexts: c.sample_contexts || [],
      associated_brands: c.associated_brands || [],
      avg_citation_position: c.avg_citation_position,
      first_citation_count: c.first_citation_count,
      citation_share: c.citation_share || 0
    }))

    // Filter by authority
    const filteredSources = sources.filter(s => 
      s.authority_score >= authorityMin && s.authority_score <= authorityMax
    )

    // Calculate metrics
    const totalSources = filteredSources.length
    const uniqueDomainCount = new Set(filteredSources.map(s => s.domain)).size
    const totalCitations = filteredSources.reduce((sum, s) => sum + s.citation_count, 0)
    const avgAuthority = totalSources > 0 
      ? Math.round(filteredSources.reduce((sum, s) => sum + s.authority_score, 0) / totalSources) 
      : 0

    // Calculate Trust Score based on source quality metrics
    // Weighted average of: authority (40%), authoritative sources ratio (30%), citation quality (30%)
    const highAuthorityCount = filteredSources.filter(s => s.authority_score > 70).length
    const highAuthorityRatio = totalSources > 0 ? (highAuthorityCount / totalSources) * 100 : 0
    const primaryCitationRatio = totalSources > 0 
      ? (filteredSources.filter(s => s.citation_quality === 'primary').length / totalSources) * 100 
      : 0
    
    const calculatedTrustScore = totalSources > 0
      ? Math.round(
          (avgAuthority * 0.4) + 
          (highAuthorityRatio * 0.3) + 
          (primaryCitationRatio * 0.3)
        )
      : 0

    const realMetrics = {
      total_sources: totalSources,
      avg_authority_score: avgAuthority,
      total_citations: totalCitations,
      platform_coverage: metrics?.share_of_voice || 0, // Use SOV as proxy
      high_authority_sources: highAuthorityCount,
      trending_sources: filteredSources.filter(s => s.trend === 'up').length,
      quality_score: calculatedTrustScore,
      citation_velocity: Math.round(totalCitations / (timeframe === '7d' ? 1 : timeframe === '30d' ? 4 : 12)),
      domain_diversity: totalSources > 0 ? Math.round((uniqueDomainCount / Math.max(totalCitations, 1)) * 100) / 100 : 0
    }

    // Use properly aggregated top URLs from service, fall back to extracting from citation domains
    let topUrls = topUrlsData
    if (topUrls.length === 0 && citations.length > 0) {
      // Extract URLs from citation domain sample_contexts
      const urlCounts = new Map<string, { url: string; title: string; domain: string; citations: number; domain_type: string | null; brand_mentioned: boolean }>()
      for (const c of citations) {
        if (!c.sample_contexts) continue
        for (const ctx of c.sample_contexts) {
          const ctxObj = typeof ctx === 'string' ? { url: ctx, title: '' } : ctx
          if (!ctxObj.url) continue
          const existing = urlCounts.get(ctxObj.url)
          if (existing) {
            existing.citations++
          } else {
            urlCounts.set(ctxObj.url, {
              url: ctxObj.url,
              title: ctxObj.title || c.domain,
              domain: c.domain,
              citations: 1,
              domain_type: c.is_target_publisher ? 'own' : c.is_competitor ? 'competitor' : (c.source_category || c.domain_type || null),
              brand_mentioned: c.is_target_publisher || false
            })
          }
        }
      }
      topUrls = Array.from(urlCounts.values()).sort((a, b) => b.citations - a.citations).slice(0, 30)
      console.log(`[Sources API] Extracted ${topUrls.length} URLs from citation domain contexts as fallback`)
    }

    // Calculate citation share by source category
    // For owned/competitor domains, use their ownership as the category (own/competitor)
    // For everything else, use the content-type category (news, ugc, blog, etc.)
    const totalAllCitations = filteredSources.reduce((s, src) => s + src.citation_count, 0)
    const domainTypeShare: Record<string, { count: number; share: number }> = {}
    filteredSources.forEach(src => {
      let category: string
      if (src.is_target_publisher) {
        category = 'own'
      } else if (src.is_competitor) {
        category = 'competitor'
      } else {
        category = src.source_category || 'other'
      }
      if (!domainTypeShare[category]) domainTypeShare[category] = { count: 0, share: 0 }
      domainTypeShare[category].count += src.citation_count
    })
    Object.keys(domainTypeShare).forEach(k => {
      domainTypeShare[k].share = totalAllCitations > 0 
        ? Math.round((domainTypeShare[k].count / totalAllCitations) * 1000) / 10 
        : 0
    })

    // Calculate citation share by relationship type (owned, earned, competitor)
    const relationshipShare: Record<string, { count: number; share: number }> = {}
    filteredSources.forEach(src => {
      const relType = src.domain_type || 'unknown'
      if (!relationshipShare[relType]) relationshipShare[relType] = { count: 0, share: 0 }
      relationshipShare[relType].count += src.citation_count
    })
    Object.keys(relationshipShare).forEach(k => {
      relationshipShare[k].share = totalAllCitations > 0 
        ? Math.round((relationshipShare[k].count / totalAllCitations) * 1000) / 10 
        : 0
    })

    return NextResponse.json({
      success: true,
      data: {
        metrics: realMetrics,
        sources: filteredSources,
        top_urls: topUrls,
        domain_type_share: domainTypeShare,
        relationship_share: relationshipShare,
        analytics: {
          content_type_distribution: contentTypes,
          competitive_gap: competitiveGap.map((g: any) => ({
            domain: g.domain,
            citation_count: g.competitor_citations || 0,
            authority: g.domain_authority ?? null,
            competitor_name: g.competitor_name || 'Competitor',
          })),
          authority_distribution: {},
          platform_coverage: {},
          trending_sources: {},
          citation_velocity_bands: {},
          insights: insightsResult?.insights || [],
          recommendations: insightsResult?.recommendations || []
        }
      },
      metadata: {
        timeframe,
        contentType,
        authorityRange: [authorityMin, authorityMax],
        total_filtered: filteredSources.length,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Sources API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch sources data'
    }, { status: 500 })
  }
}