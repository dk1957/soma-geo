import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { BrandReportingService } from '@/lib/services/brand-reporting'
import { NextRequest, NextResponse } from 'next/server'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * POST /api/reporting/brand-visibility
 * Generate a brand visibility report using our comprehensive GEO analysis system
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit report generation
    const limited = applyRateLimit(request, 'reports:brand-visibility', RATE_LIMITS.heavy, currentUser.clerkUserId)
    if (limited) return limited

    const supabase = createServiceClient()
    const body = await request.json()

    const {
      brandId,
      workspaceId,
      dateRange,
      includeCompetitors = true,
      includeVectorAnalysis = true,
      platforms = ['chatgpt', 'claude', 'gemini', 'perplexity'],
      baseFilters = {},
      title
    } = body

    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 })
    }

    // Check brand access
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id, name, account_id')
      .eq('id', brandId)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found or access denied' }, { status: 404 })
    }

    console.log(`🎯 Generating brand visibility report for ${brand.name}`)

    // Filters with vector analysis options
    const filters = {
      ...baseFilters,
      includeVectorAnalysis,
      includeCompetitiveIntelligence: includeCompetitors
    }

    const reportingService = new BrandReportingService(supabase)
    const report = await reportingService.generateBrandVisibilityReport(
      brandId, 
      currentUser.clerkUserId, 
      filters
    )

    // Update title if provided
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

    console.log(`✅ Brand visibility report generated: ${report.id}`)

    return NextResponse.json({
      success: true,
      data: report,
      features: {
        vector_analysis_enabled: includeVectorAnalysis,
        competitive_intelligence_enabled: includeCompetitors,
        comprehensive_metrics: true,
        multi_model_analysis: true,
        real_time_data: true
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error generating brand visibility report:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate brand visibility report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}