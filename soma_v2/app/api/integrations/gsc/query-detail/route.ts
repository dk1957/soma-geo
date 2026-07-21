/**
 * GSC Query Detail API
 * 
 * Fetches per-query data: which pages rank for this query,
 * daily trend, and supporting metadata for query exploration.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const brandId = searchParams.get('brand_id')
  const query = searchParams.get('query')

  if (!brandId || !query) {
    return NextResponse.json({ error: 'brand_id and query are required' }, { status: 400 })
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()

    // Fetch all rows matching this query (across dates and pages)
    const { data: rows, error } = await supabase
      .from('gsc_performance_data')
      .select('date, page_url, clicks, impressions, ctr, position')
      .eq('brand_id', brandId)
      .eq('query', query)
      .order('date', { ascending: true })
      .limit(2000)

    if (error) throw error

    if (!rows || rows.length === 0) {
      return NextResponse.json({
        query,
        pages: [],
        trend: [],
        totals: { clicks: 0, impressions: 0, avgCtr: 0, avgPosition: 0 }
      })
    }

    // Aggregate by page
    const pageMap = new Map<string, { clicks: number; impressions: number; ctr: number; position: number; count: number }>()
    rows.forEach(row => {
      const url = row.page_url || 'Unknown'
      const existing = pageMap.get(url) || { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 }
      existing.clicks += row.clicks
      existing.impressions += row.impressions
      existing.ctr += row.ctr
      existing.position += row.position
      existing.count += 1
      pageMap.set(url, existing)
    })

    const pages = Array.from(pageMap.entries())
      .map(([pageUrl, data]) => ({
        pageUrl,
        clicks: data.clicks,
        impressions: data.impressions,
        ctr: data.count > 0 ? data.ctr / data.count : 0,
        position: data.count > 0 ? data.position / data.count : 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)

    // Aggregate by date for trend
    const dateMap = new Map<string, { clicks: number; impressions: number; position: number; count: number }>()
    rows.forEach(row => {
      if (!row.date) return
      const existing = dateMap.get(row.date) || { clicks: 0, impressions: 0, position: 0, count: 0 }
      existing.clicks += row.clicks
      existing.impressions += row.impressions
      existing.position += row.position
      existing.count += 1
      dateMap.set(row.date, existing)
    })

    const trend = Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        clicks: data.clicks,
        impressions: data.impressions,
        position: data.count > 0 ? Math.round((data.position / data.count) * 10) / 10 : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Totals
    const totalClicks = pages.reduce((s, p) => s + p.clicks, 0)
    const totalImpressions = pages.reduce((s, p) => s + p.impressions, 0)
    const avgPosition = pages.length > 0
      ? pages.reduce((s, p) => s + p.position, 0) / pages.length
      : 0

    return NextResponse.json({
      query,
      pages,
      trend,
      totals: {
        clicks: totalClicks,
        impressions: totalImpressions,
        avgCtr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
        avgPosition,
      }
    })

  } catch (error) {
    console.error('Query detail error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch query detail'
    }, { status: 500 })
  }
}
