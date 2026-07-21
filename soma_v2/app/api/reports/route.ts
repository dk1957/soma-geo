// Reports API Route - For generating and retrieving comprehensive analysis reports
// GET: Retrieve analysis reports, POST: Generate new report

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const searchParams = request.nextUrl.searchParams
    const brandId = searchParams.get('brandId')
    const reportType = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!brandId) {
      return NextResponse.json(
        { success: false, error: 'brandId is required' },
        { status: 400 }
      )
    }

    // Check brand access via clerk_id
    const { data: brandAccess } = await supabase
      .from('account_users')
      .select(`
        clerk_id,
        account_id,
        accounts!inner(
          brands!inner(id)
        )
      `)
      .eq('clerk_id', user.clerkUserId)
      .eq('accounts.brands.id', brandId)
      .single()

    if (!brandAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Build query for reports from brand_reports table
    let query = supabase
      .from('external_brand_reports')
      .select(`
        *,
        brands!inner(
          id,
          name,
          industry,
          target_markets
        )
      `)
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (reportType) {
      query = query.eq('report_type', reportType)
    }

    const { data: reports, error } = await query

    if (error) {
      console.error('Reports fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: reports || []
    })

  } catch (error) {
    console.error('Reports GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const body = await request.json()
    const {
      brandId,
      title,
      description,
      reportType = 'brand-visibility'
    } = body

    if (!brandId) {
      return NextResponse.json(
        { error: 'brandId is required' },
        { status: 400 }
      )
    }

    // Check brand access via clerk_id
    const { data: brandAccess } = await supabase
      .from('account_users')
      .select(`
        clerk_id,
        account_id,
        accounts!inner(
          brands!inner(id, name)
        )
      `)
      .eq('clerk_id', user.clerkUserId)
      .eq('accounts.brands.id', brandId)
      .single()

    if (!brandAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create report record - use clerk_id for user tracking
    const { data: report, error: reportError } = await supabase
      .from('external_brand_reports')
      .insert({
        clerk_id: user.clerkUserId,
        brand_id: brandId,
        title: title || `Brand Visibility Report - ${new Date().toLocaleDateString()}`,
        description: description || `Comprehensive brand visibility analysis`,
        report_type: reportType,
        status: 'completed',
        source: 'manual'
      })
      .select()
      .single()

    if (reportError) {
      console.error('Report creation error:', reportError)
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: report
    })

  } catch (error) {
    console.error('Reports POST error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}