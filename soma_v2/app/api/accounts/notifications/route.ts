import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * User Notifications API
 * ======================
 * 
 * This API works with the user_notifications table for personal notifications
 * like run completion alerts, job notifications, etc.
 * 
 * GET: Fetch notifications for the current user
 * PATCH: Mark notifications as read/dismissed
 */

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const supabase = createServiceClient()
    
    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')
    const accountId = searchParams.get('accountId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const type = searchParams.get('type') // 'job', 'audit', 'optimization', 'mention', 'personal'
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Guard: abort if query takes too long (prevents 22-min hangs on transient network issues)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    let query = supabase
      .from('user_notifications')
      .select('*', { signal: controller.signal } as any)
      .eq('clerk_id', user.clerkUserId)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (brandId) {
      query = query.eq('brand_id', brandId)
    }

    if (accountId) {
      query = query.eq('account_id', accountId)
    }

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    if (type) {
      query = query.eq('type', type)
    }

    const { data: notifications, error } = await query
    clearTimeout(timeout)

    if (error) {
      console.error('Failed to fetch user notifications:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch notifications',
        details: error.message 
      }, { status: 500 })
    }

    // Get unread count (separate lightweight query)
    const countController = new AbortController()
    const countTimeout = setTimeout(() => countController.abort(), 5_000)
    const { count: unreadCount } = await supabase
      .from('user_notifications')
      .select('*', { count: 'exact', head: true, signal: countController.signal } as any)
      .eq('clerk_id', user.clerkUserId)
      .eq('is_read', false)
      .eq('is_dismissed', false)
    clearTimeout(countTimeout)

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unread_count: unreadCount || 0
    })

  } catch (error) {
    const isAbort = error instanceof DOMException && error.name === 'AbortError'
    if (!isAbort) {
      console.error('User notifications GET error:', {
        message: error instanceof Error ? error.message : String(error),
        details: error instanceof Error ? error.stack : '',
        hint: (error as any)?.hint || '',
        code: (error as any)?.code || '',
      })
    }
    return NextResponse.json({
      success: false,
      notifications: [],
      unread_count: 0,
    }, { status: isAbort ? 504 : 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const supabase = createServiceClient()
    
    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      notificationId, 
      notificationIds,
      action // 'read', 'dismiss', 'read_all'
    } = body

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    const serviceSupabase = createServiceClient()

    if (action === 'read_all') {
      // Mark all notifications as read for this user
      const { error } = await serviceSupabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('clerk_id', user.clerkUserId)
        .eq('is_read', false)

      if (error) {
        return NextResponse.json({ 
          error: 'Failed to mark all as read',
          details: error.message 
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      })
    }

    // Handle single or multiple notification updates
    const ids = notificationIds || (notificationId ? [notificationId] : [])
    
    if (ids.length === 0) {
      return NextResponse.json({ 
        error: 'Notification ID(s) required' 
      }, { status: 400 })
    }

    const updateData: { is_read?: boolean; is_dismissed?: boolean } = {}
    
    if (action === 'read') {
      updateData.is_read = true
    } else if (action === 'dismiss') {
      updateData.is_dismissed = true
    } else {
      return NextResponse.json({ 
        error: 'Invalid action. Use "read", "dismiss", or "read_all"' 
      }, { status: 400 })
    }

    const { error } = await serviceSupabase
      .from('user_notifications')
      .update(updateData)
      .in('id', ids)
      .eq('clerk_id', user.clerkUserId) // Security: only update user's own notifications

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to update notification(s)',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Notification(s) ${action === 'read' ? 'marked as read' : 'dismissed'}`
    })

  } catch (error) {
    console.error('User notifications PATCH error:', error)
    return NextResponse.json({
      error: 'Failed to update notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
