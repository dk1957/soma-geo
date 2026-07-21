import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { BrandReportingService } from '@/lib/services/brand-reporting'
import { NextRequest, NextResponse } from 'next/server'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * POST /api/reporting/brand-discoverability
 * Generate a brand discoverability report
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit report generation
    const limited = applyRateLimit(request, 'reports:brand-discoverability', RATE_LIMITS.heavy, currentUser.clerkUserId)
    if (limited) return limited

    const supabase = createServiceClient()
    const body = await request.json()

    const { brand_id, title, filters = {} } = body

    if (!brand_id) {
      return NextResponse.json({ error: 'brand_id is required' }, { status: 400 })
    }

    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id, name')
      .eq('id', brand_id)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found or access denied' }, { status: 404 })
    }

    const reportingService = new BrandReportingService()
    const report = await reportingService.generateBrandVisibilityReport(
      brand_id,
      currentUser.clerkUserId,
      filters
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

    return NextResponse.json({
      success: true,
      data: report
    }, { status: 201 })

  } catch (error) {
    console.error('Error generating brand discoverability report:', error)
    return NextResponse.json(
      { error: 'Failed to generate brand discoverability report' },
      { status: 500 }
    )
  }
}