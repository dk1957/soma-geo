/**
 * Insight Engine API
 *
 * GET /api/insights/engine?brand_id=<id>
 *
 * Returns actionable recommendations by cross-referencing:
 * - Response analysis (LVI, mentions, citations, competitors)
 * - Discoverability audit (7-pillar AEO readiness)
 * - Google Search Console (queries, impressions, CTR, gaps)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { generateInsights } from '@/lib/services/insight-engine'

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
    const result = await generateInsights(brandId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Insight engine error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate insights' },
      { status: 500 }
    )
  }
}
