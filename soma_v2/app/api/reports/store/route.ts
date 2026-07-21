import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const body = await request.json()
    const { 
      title,
      type,
      brand_id,
      workspace_id,
      brand_name,
      audit_data,
      ldi_score,
      key_insights,
      summary,
      sharing_settings
    } = body

    if (!title || !type || !brand_id || !workspace_id || !brand_name) {
      return NextResponse.json(
        { error: 'Required fields missing' },
        { status: 400 }
      )
    }

    // Verify user has access to this brand via their account
    const { data: brandAccess, error: accessError } = await supabase
      .from('brands')
      .select('id, account_id')
      .eq('id', brand_id)
      .single()

    if (accessError || !brandAccess) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Check user belongs to the brand's account
    const { data: membership } = await supabase
      .from('account_users')
      .select('id')
      .eq('account_id', brandAccess.account_id)
      .eq('clerk_id', currentUser.clerkUserId)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden - no access to this brand' }, { status: 403 })
    }

    // Store the audit results as a report
    const { data: report, error } = await supabase
      .from('audit_reports')
      .insert({
        title,
        type,
        brand_id,
        workspace_id,
        brand_name,
        created_by: currentUser.clerkUserId,
        status: 'completed',
        ldi_score: ldi_score || 0,
        key_insights: key_insights || [],
        summary: summary || '',
        sharing_settings: sharing_settings || {
          is_public: false,
          shared_with: [],
          password_protected: false
        },
        audit_data: audit_data || {}
      })
      .select()
      .single()

    if (error) {
      console.error('Error storing report:', error)
      return NextResponse.json({ error: 'Failed to store report' }, { status: 500 })
    }

    // Also store detailed scoring data for analytics
    if (audit_data && audit_data.platform_analysis) {
      const scoreInserts = Object.entries(audit_data.platform_analysis).map(
        ([platform, data]) => {
          const platformData = data as Record<string, unknown>
          return {
            report_id: report.id,
            brand_id,
            workspace_id,
            platform_name: platform,
            ldi_score: (platformData.ldi_score as number) || 0,
            visibility_score: (platformData.visibility_score as number) || 0,
            citation_score: (platformData.citation_score as number) || 0,
            freshness_score: (platformData.freshness_score as number) || 0,
            authority_score: (platformData.authority_score as number) || 0,
            raw_data: platformData
          }
        }
      )
      if (scoreInserts.length > 0) {
        await supabase.from('audit_scores').insert(scoreInserts)
      }
    }

    return NextResponse.json({
      success: true,
      data: report
    })

  } catch (error) {
    console.error('Error storing report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}