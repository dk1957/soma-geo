/**
 * GSC Sitemap URL Fetching API
 * 
 * Fetches sitemap URLs for the connected site. Used by the Page Health tab
 * to auto-populate pages for inspection.
 */

import { NextRequest, NextResponse } from 'next/server'
import { gscOAuthService } from '@/lib/services/gsc-oauth-service'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'

export async function GET(request: NextRequest) {
  const brandId = request.nextUrl.searchParams.get('brand_id')

  if (!brandId) {
    return NextResponse.json({ error: 'brand_id is required' }, { status: 400 })
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()

    const { data: connection } = await supabase
      .from('gsc_connections')
      .select('site_url')
      .eq('brand_id', brandId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!connection?.site_url || connection.site_url === 'pending_selection') {
      return NextResponse.json({ error: 'No site configured' }, { status: 400 })
    }

    // Fetch sitemap URLs
    const sitemapUrls = await gscOAuthService.fetchSitemapUrls(connection.site_url)

    // Also get previous inspection results if any
    const { data: inspections } = await supabase
      .from('gsc_url_inspection')
      .select('url, verdict, coverage_state, last_crawl_time, inspected_at')
      .eq('brand_id', brandId)

    const inspectionMap = new Map<string, any>()
    inspections?.forEach(i => inspectionMap.set(i.url, i))

    const pages = sitemapUrls.map(url => ({
      url,
      inspection: inspectionMap.get(url) || null
    }))

    return NextResponse.json({
      siteUrl: connection.site_url,
      pages,
      totalFromSitemap: sitemapUrls.length,
      allInspections: inspections || []
    })

  } catch (error) {
    console.error('Sitemap fetch error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch sitemap'
    }, { status: 500 })
  }
}
