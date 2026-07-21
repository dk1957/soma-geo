/**
 * GSC Integration API - Main Route
 * 
 * Handles GET (fetch connection/data), PATCH (update settings), DELETE (disconnect)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { gscOAuthService } from '@/lib/services/gsc-oauth-service'
import { getCurrentUser } from '@/lib/auth/get-current-user'

interface GSCConnectionRow {
  id: string
  brand_id: string
  site_url: string
  property_type?: string
  is_active: boolean
  last_sync_at: string | null
  last_sync_status: string | null
  sync_error: string | null
  auto_sync_enabled: boolean
  sync_frequency_hours: number
  scopes: string[]
  connected_at: string | null
  created_at: string
  updated_at: string
}

// GET - Fetch GSC connection and data
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const brandId = searchParams.get('brand_id')
  const daysParam = searchParams.get('days') // e.g. 7, 30, 90, 180, or 'all'

  if (!brandId) {
    return NextResponse.json({ error: 'brand_id is required' }, { status: 400 })
  }

  // Compute date range filter
  const days = daysParam === 'all' ? null : parseInt(daysParam || '30', 10) || 30
  // Performance chart needs 2x range for period-over-period comparison
  const perfStartDateStr = days
    ? new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : null
  // All other data uses the selected range exactly
  const startDateStr = days
    ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : null

  // Verify user is authenticated
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Use service client to bypass RLS (we validated auth above)
    const supabase = createServiceClient()

    // Get connection status
    const { data, error: connError } = await supabase
      .from('gsc_connections')
      .select('id, brand_id, site_url, property_type, is_active, last_sync_at, last_sync_status, sync_error, auto_sync_enabled, sync_frequency_hours, scopes, connected_at, created_at, updated_at')
      .eq('brand_id', brandId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (connError && connError.code !== 'PGRST116') {
      throw connError
    }

    const connection = data as GSCConnectionRow | null

    if (!connection?.is_active) {
      return NextResponse.json({ 
        connection: null, 
        sites: [],
        performance: [],
        topQueries: []
      })
    }

    // Get available sites if connected
    let sites: any[] = []
    try {
      const accessToken = await gscOAuthService.getValidAccessToken(brandId)
      if (accessToken) {
        sites = await gscOAuthService.listSites(accessToken)
      }
    } catch (err) {
      console.error('Error fetching GSC sites:', err)
    }

    // Get date-level aggregate rows for the performance chart.
    // These are rows where query IS NULL and page_url IS NULL — they contain
    // accurate daily totals from GSC (dimensions: ['date'] only), matching
    // what Google Search Console's Performance report shows.
    // Falls back to summing per-query rows if no date-level aggregates exist yet.
    let perfQuery = supabase
      .from('gsc_performance_data')
      .select('date, clicks, impressions, ctr, position')
      .eq('brand_id', brandId)
      .is('query', null)
      .is('page_url', null)
      .order('date', { ascending: false })
    if (perfStartDateStr) perfQuery = perfQuery.gte('date', perfStartDateStr)
    else perfQuery = perfQuery.limit(365)
    const { data: dateLevelData } = await perfQuery

    let performance: { date: string; clicks: number; impressions: number; ctr: number; position: number }[]

    if (dateLevelData && dateLevelData.length > 0) {
      // Use accurate date-level aggregates directly
      performance = dateLevelData.map(row => ({
        date: row.date,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position
      })).sort((a, b) => a.date.localeCompare(b.date))
    } else {
      // Fallback: sum per-query rows (less accurate, for data synced before this fix)
      let fallbackQuery = supabase
        .from('gsc_performance_data')
        .select('date, clicks, impressions, ctr, position')
        .eq('brand_id', brandId)
        .order('date', { ascending: false })
      if (perfStartDateStr) fallbackQuery = fallbackQuery.gte('date', perfStartDateStr)
      else fallbackQuery = fallbackQuery.limit(365)
      const { data: fallbackData } = await fallbackQuery

      const dateMap = new Map<string, { clicks: number, impressions: number, ctr: number, position: number, count: number }>()
      fallbackData?.forEach(row => {
        const existing = dateMap.get(row.date) || { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 }
        dateMap.set(row.date, {
          clicks: existing.clicks + row.clicks,
          impressions: existing.impressions + row.impressions,
          ctr: existing.ctr + row.ctr,
          position: existing.position + row.position,
          count: existing.count + 1
        })
      })

      performance = Array.from(dateMap.entries()).map(([date, data]) => ({
        date,
        clicks: data.clicks,
        impressions: data.impressions,
        ctr: data.count > 0 ? data.ctr / data.count : 0,
        position: data.count > 0 ? data.position / data.count : 0
      })).sort((a, b) => a.date.localeCompare(b.date))
    }

    // --- Effective date range: align with GSC's convention ---
    // GSC data typically lags ~2 days. "Last 7 days" in GSC = 7 days ending at latest available data.
    const nowUtc = new Date()
    const maxEndDate = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate() - 2))
    const maxEndStr = maxEndDate.toISOString().split('T')[0]

    let effectiveEndDate = maxEndStr
    let effectiveStartDate: string | null = null

    if (days && performance.length > 0) {
      const latestDataDate = performance[performance.length - 1].date
      effectiveEndDate = latestDataDate <= maxEndStr ? latestDataDate : maxEndStr
    }

    if (days) {
      const endObj = new Date(effectiveEndDate + 'T00:00:00Z')
      const startObj = new Date(endObj)
      startObj.setUTCDate(startObj.getUTCDate() - days + 1)
      effectiveStartDate = startObj.toISOString().split('T')[0]
    }

    // Get all query+page rows for comprehensive analysis — filtered by effective date range
    let qQuery = supabase
      .from('gsc_performance_data')
      .select('query, page_url, clicks, impressions, ctr, position, date')
      .eq('brand_id', brandId)
      .not('query', 'is', null)
      .order('impressions', { ascending: false })
      .limit(5000)
    if (effectiveStartDate) qQuery = qQuery.gte('date', effectiveStartDate)
    if (days) qQuery = qQuery.lte('date', effectiveEndDate)
    const { data: queryData } = await qQuery

    // Aggregate queries across all dates
    const queryMap = new Map<string, { clicks: number, impressions: number, ctr: number, position: number, count: number }>()
    queryData?.forEach(row => {
      if (!row.query) return
      const existing = queryMap.get(row.query) || { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 }
      queryMap.set(row.query, {
        clicks: existing.clicks + row.clicks,
        impressions: existing.impressions + row.impressions,
        ctr: existing.ctr + row.ctr,
        position: existing.position + row.position,
        count: existing.count + 1
      })
    })

    const topQueries = Array.from(queryMap.entries())
      .map(([query, data]) => ({
        query,
        clicks: data.clicks,
        impressions: data.impressions,
        ctr: data.count > 0 ? data.ctr / data.count : 0,
        position: data.count > 0 ? data.position / data.count : 0
      }))
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 200)

    // Aggregate pages across all query data
    const pageMap = new Map<string, { clicks: number; impressions: number; ctr: number; position: number; rowCount: number; queries: Set<string> }>()
    queryData?.forEach(row => {
      const pageUrl = row.page_url || 'Unknown'
      const existing = pageMap.get(pageUrl) || { clicks: 0, impressions: 0, ctr: 0, position: 0, rowCount: 0, queries: new Set<string>() }
      existing.clicks += row.clicks
      existing.impressions += row.impressions
      existing.ctr += row.ctr
      existing.position += row.position
      existing.rowCount += 1
      if (row.query) existing.queries.add(row.query)
      pageMap.set(pageUrl, existing)
    })

    const topPages = Array.from(pageMap.entries())
      .map(([pageUrl, data]) => ({
        pageUrl,
        clicks: data.clicks,
        impressions: data.impressions,
        ctr: data.rowCount > 0 ? data.ctr / data.rowCount : 0,
        position: data.rowCount > 0 ? data.position / data.rowCount : 0,
        queryCount: data.queries.size
      }))
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 50)

    // AI-specific analysis: queries with high impressions but poor ranking (GEO opportunities)
    const opportunityQueries = Array.from(queryMap.entries())
      .map(([query, data]) => ({
        query,
        clicks: data.clicks,
        impressions: data.impressions,
        ctr: data.count > 0 ? data.ctr / data.count : 0,
        position: data.count > 0 ? data.position / data.count : 0
      }))
      .filter(q => q.impressions > 50 && q.position > 5)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 15)

    // Pages with high impressions but low CTR — content optimization candidates
    const pagesToOptimize = topPages
      .filter(p => p.impressions > 100 && p.ctr < 0.04 && p.position > 5)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 15)

    // High-performing queries already ranking well — protect these in AI responses
    const protectQueries = Array.from(queryMap.entries())
      .map(([query, data]) => ({
        query,
        clicks: data.clicks,
        impressions: data.impressions,
        ctr: data.count > 0 ? data.ctr / data.count : 0,
        position: data.count > 0 ? data.position / data.count : 0
      }))
      .filter(q => q.position <= 3 && q.clicks > 5)
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 15)

    // --- Query classification for GEO insights ---
    const questionWords = /^(who|what|where|when|why|how|is|are|can|do|does|should|which|will|would|could|has|have|was|were)\b/i
    const allQueryEntries = Array.from(queryMap.entries()).map(([query, data]) => ({
      query,
      clicks: data.clicks,
      impressions: data.impressions,
      ctr: data.count > 0 ? data.ctr / data.count : 0,
      position: data.count > 0 ? data.position / data.count : 0
    }))

    // Derive brand name(s) for branded detection
    const { data: brandRow } = await supabase
      .from('brands')
      .select('name, website')
      .eq('id', brandId)
      .maybeSingle()
    const brandTerms = [
      brandRow?.name?.toLowerCase(),
      brandRow?.website?.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').split('.')[0]?.toLowerCase()
    ].filter(Boolean) as string[]

    let brandedCount = 0, questionCount = 0, informationalCount = 0, navigationalCount = 0
    const questionQueries: typeof allQueryEntries = []
    const brandedQueries: typeof allQueryEntries = []

    for (const q of allQueryEntries) {
      const lower = q.query.toLowerCase()
      const isBranded = brandTerms.some(t => t && lower.includes(t))
      const isQuestion = questionWords.test(lower) || lower.includes('?')

      if (isBranded) {
        brandedCount++
        brandedQueries.push(q)
      } else if (isQuestion) {
        questionCount++
        questionQueries.push(q)
      } else if (lower.includes('best') || lower.includes('top') || lower.includes('vs') || lower.includes('review') || lower.includes('compare') || lower.includes('alternative')) {
        informationalCount++
        questionQueries.push(q) // These are also high-value for AI
      } else {
        navigationalCount++
      }
    }

    const queryClassification = {
      branded: brandedCount,
      question: questionCount,
      informational: informationalCount,
      navigational: navigationalCount,
      total: allQueryEntries.length
    }

    // --- Country & device data (live from GSC API) — uses selected date range ---
    let countries: { country: string; clicks: number; impressions: number }[] = []
    let devices: { device: string; clicks: number; impressions: number; ctr: number; position: number }[] = []
    try {
      const accessToken = await gscOAuthService.getValidAccessToken(brandId)
      if (accessToken && connection.site_url && connection.site_url !== 'pending_selection') {
        const gscEndDate = effectiveEndDate
        const gscStartDate = effectiveStartDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        ;[countries, devices] = await Promise.all([
          gscOAuthService.getCountryBreakdown(accessToken, connection.site_url, gscStartDate, gscEndDate),
          gscOAuthService.getDeviceBreakdown(accessToken, connection.site_url, gscStartDate, gscEndDate)
        ])
      }
    } catch (err) {
      console.error('Error fetching country/device data:', err)
    }

    // Summary statistics
    const allQueries = Array.from(queryMap.values())
    const sumClicks = allQueries.reduce((sum, q) => sum + q.clicks, 0)
    const sumImpressions = allQueries.reduce((sum, q) => sum + q.impressions, 0)
    const sumPosition = allQueries.reduce((sum, q) => sum + (q.position / q.count), 0)
    const summary = {
      totalClicks: sumClicks,
      totalImpressions: sumImpressions,
      avgCtr: sumImpressions > 0 ? sumClicks / sumImpressions : 0,
      avgPosition: queryMap.size > 0 ? sumPosition / queryMap.size : 0,
      totalQueries: queryMap.size,
      totalPages: pageMap.size,
      opportunityQueries: opportunityQueries.length,
      pagesToOptimize: pagesToOptimize.length
    }

    // --- Insights: period-over-period comparison (uses selected date range) ---
    // Fetch LIVE from GSC API with page and query dimensions for accurate data
    // dataState:'all' is now default, so we include fresh/preliminary data
    const insightsDays = days || 28
    const insightsEnd = days ? new Date(effectiveEndDate + 'T00:00:00Z') : new Date()
    const insightsCurrentStart = new Date(insightsEnd)
    insightsCurrentStart.setUTCDate(insightsCurrentStart.getUTCDate() - insightsDays)
    const insightsPrevStart = new Date(insightsCurrentStart)
    insightsPrevStart.setUTCDate(insightsPrevStart.getUTCDate() - insightsDays)
    const insightsEndStr = insightsEnd.toISOString().split('T')[0]
    const insightsCurrentStartStr = insightsCurrentStart.toISOString().split('T')[0]
    const insightsPrevStartStr = insightsPrevStart.toISOString().split('T')[0]

    let insights: any = null
    try {
      const insightsToken = await gscOAuthService.getValidAccessToken(brandId)
      if (insightsToken && connection.site_url && connection.site_url !== 'pending_selection') {
        // Fetch page-level and query-level data for both periods in parallel
        const [curPageData, prevPageData, curQueryDataLive, prevQueryDataLive] = await Promise.all([
          gscOAuthService.getSearchAnalytics(insightsToken, connection.site_url, {
            startDate: insightsCurrentStartStr,
            endDate: insightsEndStr,
            dimensions: ['page'],
            rowLimit: 25
          }),
          gscOAuthService.getSearchAnalytics(insightsToken, connection.site_url, {
            startDate: insightsPrevStartStr,
            endDate: insightsCurrentStartStr,
            dimensions: ['page'],
            rowLimit: 25
          }),
          gscOAuthService.getSearchAnalytics(insightsToken, connection.site_url, {
            startDate: insightsCurrentStartStr,
            endDate: insightsEndStr,
            dimensions: ['query'],
            rowLimit: 25
          }),
          gscOAuthService.getSearchAnalytics(insightsToken, connection.site_url, {
            startDate: insightsPrevStartStr,
            endDate: insightsCurrentStartStr,
            dimensions: ['query'],
            rowLimit: 25
          })
        ])

        // Build maps for page data
        const curPages = new Map<string, { url: string; clicks: number; impressions: number }>()
        curPageData.forEach(r => curPages.set(r.page!, { url: r.page!, clicks: r.clicks, impressions: r.impressions }))
        const prevPages = new Map<string, { url: string; clicks: number; impressions: number }>()
        prevPageData.forEach(r => prevPages.set(r.page!, { url: r.page!, clicks: r.clicks, impressions: r.impressions }))

        // Build maps for query data
        const curQueriesMap = new Map<string, { query: string; clicks: number; impressions: number }>()
        curQueryDataLive.forEach(r => curQueriesMap.set(r.query!, { query: r.query!, clicks: r.clicks, impressions: r.impressions }))
        const prevQueriesMap = new Map<string, { query: string; clicks: number; impressions: number }>()
        prevQueryDataLive.forEach(r => prevQueriesMap.set(r.query!, { query: r.query!, clicks: r.clicks, impressions: r.impressions }))

        // Compute insights: top, trending up, trending down
        const computeInsights = <T extends { clicks: number }>(
          current: Map<string, T>,
          previous: Map<string, T>,
          keyFn: (item: T) => string,
          limit = 10
        ) => {
          const top = Array.from(current.values())
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, limit)
            .map(item => {
              const key = keyFn(item)
              const prev = previous.get(key)
              const prevClicks = prev?.clicks ?? 0
              const change = prevClicks > 0 ? Math.round(((item.clicks - prevClicks) / prevClicks) * 100) : 0
              return { ...item, prevClicks, change, isNew: prevClicks === 0 && item.clicks > 0 }
            })

          const trendingUp = Array.from(current.values())
            .map(item => {
              const key = keyFn(item)
              const prev = previous.get(key)
              const prevClicks = prev?.clicks ?? 0
              const gain = item.clicks - prevClicks
              const change = prevClicks > 0 ? Math.round((gain / prevClicks) * 100) : 0
              return { ...item, prevClicks, change, gain, isNew: prevClicks === 0 && item.clicks > 0 }
            })
            .filter(item => item.gain > 0 || item.isNew)
            .sort((a, b) => b.gain - a.gain)
            .slice(0, limit)

          const trendingDown = Array.from(current.values())
            .map(item => {
              const key = keyFn(item)
              const prev = previous.get(key)
              if (!prev) return null
              const prevClicks = prev.clicks
              const loss = prevClicks - item.clicks
              const change = prevClicks > 0 ? Math.round(((item.clicks - prevClicks) / prevClicks) * 100) : 0
              return { ...item, prevClicks, change, loss, isNew: false }
            })
            .filter((item): item is NonNullable<typeof item> => item !== null && item.loss > 0)
            .sort((a, b) => b.loss - a.loss)
            .slice(0, limit)

          return { top, trendingUp, trendingDown }
        }

        const contentInsights = computeInsights(curPages, prevPages, item => (item as any).url)
        const queryInsights = computeInsights(curQueriesMap, prevQueriesMap, item => (item as any).query)

        // Period totals
        const curTotalClicks = curPageData.reduce((s, r) => s + r.clicks, 0)
        const curTotalImpr = curPageData.reduce((s, r) => s + r.impressions, 0)
        const prevTotalClicks = prevPageData.reduce((s, r) => s + r.clicks, 0)
        const prevTotalImpr = prevPageData.reduce((s, r) => s + r.impressions, 0)

        insights = {
          period: { days: insightsDays, currentStart: insightsCurrentStartStr, prevStart: insightsPrevStartStr },
          summary: {
            clicks: curTotalClicks,
            clicksChange: prevTotalClicks > 0 ? Math.round(((curTotalClicks - prevTotalClicks) / prevTotalClicks) * 100) : 0,
            impressions: curTotalImpr,
            impressionsChange: prevTotalImpr > 0 ? Math.round(((curTotalImpr - prevTotalImpr) / prevTotalImpr) * 100) : 0,
          },
          content: contentInsights,
          queries: queryInsights,
        }
      }
    } catch (err) {
      console.error('Error fetching insights from GSC API:', err)
    }

    return NextResponse.json({
      connection,
      sites,
      performance,
      topQueries,
      topPages,
      opportunityQueries,
      pagesToOptimize,
      protectQueries,
      questionQueries: questionQueries.sort((a, b) => b.impressions - a.impressions).slice(0, 20),
      brandedQueries: brandedQueries.sort((a, b) => b.impressions - a.impressions).slice(0, 20),
      queryClassification,
      countries,
      devices,
      summary,
      insights,
      effectiveEndDate: days ? effectiveEndDate : null,
    })

  } catch (error) {
    console.error('GSC GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch GSC data' }, { status: 500 })
  }
}

// PATCH - Update GSC settings (site selection)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { brand_id, site_url } = body

    if (!brand_id) {
      return NextResponse.json({ error: 'brand_id is required' }, { status: 400 })
    }

    // Verify user is authenticated
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('gsc_connections')
      .update({
        site_url,
        updated_at: new Date().toISOString()
      })
      .eq('brand_id', brand_id)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('GSC PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}

// DELETE - Disconnect GSC
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { brand_id } = body

    if (!brand_id) {
      return NextResponse.json({ error: 'brand_id is required' }, { status: 400 })
    }

    await gscOAuthService.disconnect(brand_id)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('GSC DELETE error:', error)
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}
