import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { BrandReportingService } from '@/lib/services/brand-reporting'
import { NextRequest, NextResponse } from 'next/server'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * POST /api/reporting/brand-mentions
 * Generate an enhanced brand mentions report using our comprehensive GEO analysis system
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit report generation
    const limited = applyRateLimit(request, 'reports:brand-mentions', RATE_LIMITS.heavy, currentUser.clerkUserId)
    if (limited) return limited

    const supabase = createServiceClient()
    const body = await request.json()

    const { 
      brand_id, 
      title, 
      filters = {},
      include_competitive_analysis = true
    } = body

    if (!brand_id) {
      return NextResponse.json({ error: 'brand_id is required' }, { status: 400 })
    }

    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id, name, account_id')
      .eq('id', brand_id)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found or access denied' }, { status: 404 })
    }

    console.log(`📊 Generating enhanced brand mentions report for ${brand.name}`)

    // Enhanced filters for mentions analysis
    const enhancedFilters = {
      ...filters,
      includeCompetitiveIntelligence: include_competitive_analysis
    }

    const reportingService = new BrandReportingService(supabase)
    const report = await reportingService.generateBrandMentionsReport(
      brand_id, 
      currentUser.clerkUserId, 
      enhancedFilters
    )

    if (title && title !== report.title) {
      const { data: updatedReport } = await supabase
        .from('brand_reports')
        .update({ title })
        .eq('id', report.id)
        .select('*')
        .single()
      
      if (updatedReport) {
        report.title = updatedReport.title
      }
    }

    console.log(`✅ Enhanced brand mentions report generated: ${report.id}`)

    return NextResponse.json({
      success: true,
      data: report,
      enhanced_features: {
        comprehensive_mention_analysis: true,
        positioning_analysis: true,
        sentiment_tracking: true,
        competitive_comparison: include_competitive_analysis,
        model_performance_breakdown: true
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error generating enhanced brand mentions report:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate enhanced brand mentions report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}