/**
 * API Route: Get LVI Score
 * 
 * GET /api/reports/[brandId]/lvi
 * 
 * Returns LVI score and components for a brand
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { brandId: string } }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    
    const brandId = params.brandId
    const searchParams = request.nextUrl.searchParams
    
    // Parse query parameters
    const period = searchParams.get('period') || 'all'
    const modelName = searchParams.get('model') || undefined
    const promptCategory = searchParams.get('category') || undefined
    const competitorId = searchParams.get('competitorId') || undefined
    
    // Calculate date range
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
    
    // Get brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id, name, account_id')
      .eq('id', brandId)
      .single()
    
    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }
    
    // Verify access via clerk_id
    const { data: accountUser } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('clerk_id', user.clerkUserId)
      .eq('account_id', brand.account_id)
      .eq('is_active', true)
      .single()
    
    if (!accountUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Get latest brand metrics from daily_brand_metrics
    const { data: latestMetrics } = await supabase
      .from('daily_brand_metrics')
      .select('lvi_score, visibility_rate, citation_rate, avg_sentiment, avg_brand_rank, total_responses, responses_with_mention, share_of_voice')
      .eq('brand_id', brandId)
      .order('run_date', { ascending: false })
      .limit(1)
      .single()

    if (!latestMetrics) {
      return NextResponse.json({
        lvi_score: 0,
        mention_rate: 0,
        citation_rate: 0,
        avg_sentiment: 0,
        avg_position: 0,
        total_responses: 0,
        total_mentions: 0
      })
    }

    return NextResponse.json({
      lvi_score: latestMetrics.lvi_score ?? 0,
      mention_rate: latestMetrics.visibility_rate ?? 0,
      citation_rate: latestMetrics.citation_rate ?? 0,
      avg_sentiment: latestMetrics.avg_sentiment ?? 0,
      avg_position: latestMetrics.avg_brand_rank ?? 0,
      total_responses: latestMetrics.total_responses ?? 0,
      total_mentions: latestMetrics.responses_with_mention ?? 0,
      share_of_voice: latestMetrics.share_of_voice ?? 0
    })
    
  } catch (error) {
    console.error('Error in LVI endpoint:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
