/**
 * GSC URL Inspection API
 * 
 * Inspect URL indexing status via GSC
 */

import { NextRequest, NextResponse } from 'next/server'
import { gscOAuthService } from '@/lib/services/gsc-oauth-service'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { brand_id, url } = body

    if (!brand_id || !url) {
      return NextResponse.json({ error: 'brand_id and url are required' }, { status: 400 })
    }

    // Use service client to bypass RLS (we validated auth above)
    const supabase = createServiceClient()
    const { data: connection } = await supabase
      .from('gsc_connections')
      .select('site_url')
      .eq('brand_id', brand_id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!connection?.site_url || connection.site_url === 'pending_selection') {
      return NextResponse.json({ error: 'No site configured in GSC connection. Please select a property first.' }, { status: 400 })
    }

    // Get access token
    const accessToken = await gscOAuthService.getValidAccessToken(brand_id)
    if (!accessToken) {
      return NextResponse.json({ error: 'GSC connection expired. Please reconnect.' }, { status: 401 })
    }

    // Perform inspection
    const result = await gscOAuthService.inspectUrl(accessToken, connection.site_url, url)

    // Store inspection result
    await supabase.from('gsc_url_inspection').upsert({
      brand_id,
      url,
      site_url: connection.site_url,
      verdict: result.inspectionResult?.indexStatusResult?.verdict,
      coverage_state: result.inspectionResult?.indexStatusResult?.coverageState,
      last_crawl_time: result.inspectionResult?.indexStatusResult?.lastCrawlTime,
      crawled_as: result.inspectionResult?.indexStatusResult?.crawledAs,
      robots_txt_state: result.inspectionResult?.indexStatusResult?.robotsTxtState,
      indexing_state: result.inspectionResult?.indexStatusResult?.indexingState,
      mobile_usability_verdict: result.inspectionResult?.mobileUsabilityResult?.verdict,
      rich_results_verdict: result.inspectionResult?.richResultsResult?.verdict,
      raw_response: result,
      inspected_at: new Date().toISOString()
    }, {
      onConflict: 'brand_id,url'
    })

    return NextResponse.json({ 
      success: true, 
      result: result.inspectionResult 
    })

  } catch (error) {
    console.error('GSC inspect error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to inspect URL' 
    }, { status: 500 })
  }
}
