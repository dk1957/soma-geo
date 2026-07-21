import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

/**
 * POST /api/reports/[id]/share
 * Share a report publicly or with specific users
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const { id } = await params
    const body = await request.json()

    const { action, emails, password } = body

    // Verify user owns the report
    const { data: report, error: fetchError } = await supabase
      .from('brand_reports')
      .select('id, is_shared, share_token, shared_with')
      .eq('id', id)
      .eq('clerk_id', currentUser.clerkUserId)
      .single()

    if (fetchError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    let updateData: any = {}

    switch (action) {
      case 'make_public':
        updateData = {
          is_shared: true,
          share_token: report.share_token || randomBytes(32).toString('hex'),
          shared_count: 0
        }
        break

      case 'make_private':
        updateData = {
          is_shared: false,
          share_token: null,
          shared_with: []
        }
        break

      case 'share_with_users':
        if (!emails || !Array.isArray(emails)) {
          return NextResponse.json({ error: 'Emails array required' }, { status: 400 })
        }
        
        updateData = {
          is_shared: true,
          share_token: report.share_token || randomBytes(32).toString('hex'),
          shared_with: [...new Set([...report.shared_with || [], ...emails])]
        }
        break

      case 'remove_user':
        if (!emails || !Array.isArray(emails)) {
          return NextResponse.json({ error: 'Emails array required' }, { status: 400 })
        }
        
        updateData = {
          shared_with: (report.shared_with || []).filter((email: string) => !emails.includes(email))
        }
        
        // If no users left and not public, make it private
        if (updateData.shared_with.length === 0 && !report.is_shared) {
          updateData.is_shared = false
          updateData.share_token = null
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Update the report
    const { data: updatedReport, error: updateError } = await supabase
      .from('brand_reports')
      .update(updateData)
      .eq('id', id)
      .eq('clerk_id', currentUser.clerkUserId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating report sharing:', updateError)
      return NextResponse.json({ error: 'Failed to update sharing settings' }, { status: 500 })
    }

    // Generate share URL if public
    let shareUrl = null
    if (updatedReport.is_shared && updatedReport.share_token) {
      shareUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reports/shared/${updatedReport.share_token}`
    }

    return NextResponse.json({
      success: true,
      report: updatedReport,
      shareUrl
    })

  } catch (error) {
    console.error('Share report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/reports/[id]/share
 * Get sharing information for a report
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const { id } = await params

    // Get report sharing info
    const { data: report, error } = await supabase
      .from('brand_reports')
      .select('id, is_shared, share_token, shared_with, shared_count')
      .eq('id', id)
      .eq('clerk_id', currentUser.clerkUserId)
      .single()

    if (error || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    let shareUrl = null
    if (report.is_shared && report.share_token) {
      shareUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reports/shared/${report.share_token}`
    }

    return NextResponse.json({
      success: true,
      sharing: {
        is_shared: report.is_shared,
        shared_with: report.shared_with || [],
        shared_count: report.shared_count || 0,
        shareUrl
      }
    })

  } catch (error) {
    console.error('Get sharing info error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}