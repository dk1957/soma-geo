import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateNotificationSchema = z.object({
  is_read: z.boolean().optional(),
  is_dismissed: z.boolean().optional(),
})

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Notifications tables not yet implemented - return empty data
    // TODO: Implement user_notifications and account_notifications tables
    return NextResponse.json({
      success: true,
      data: [],
      count: 0,
      unread_counts: {
        total: 0,
        by_type: {}
      }
    })

  } catch (error) {
    console.error('Get notifications API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request
) {
  try {
    const body = await request.json()
    const { notification_id, notification_source, ...updateData } = body
    const validatedData = updateNotificationSchema.parse(updateData)

    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createServiceClient()

    if (notification_source === 'user') {
      // Update user notification
      const { error: updateError } = await supabase
        .from('user_notifications')
        .update(validatedData)
        .eq('id', notification_id)
        .eq('clerk_id', currentUser.clerkUserId)

      if (updateError) {
        console.error('Error updating user notification:', updateError)
        return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
      }
    } else if (notification_source === 'account') {
      // Update account notification read/dismissed status
      const { data: notification, error: fetchError } = await supabase
        .from('account_notifications')
        .select('read_by, dismissed_by')
        .eq('id', notification_id)
        .single()

      if (fetchError) {
        console.error('Error fetching account notification:', fetchError)
        return NextResponse.json({ error: 'Failed to fetch notification' }, { status: 500 })
      }

      let updateFields: any = {}

      if (validatedData.is_read !== undefined) {
        const readBy = notification.read_by || []
        if (validatedData.is_read && !readBy.includes(currentUser.clerkUserId)) {
          updateFields.read_by = [...readBy, currentUser.clerkUserId]
        } else if (!validatedData.is_read && readBy.includes(currentUser.clerkUserId)) {
          updateFields.read_by = readBy.filter((id: string) => id !== currentUser.clerkUserId)
        }
      }

      if (validatedData.is_dismissed !== undefined) {
        const dismissedBy = notification.dismissed_by || []
        if (validatedData.is_dismissed && !dismissedBy.includes(currentUser.clerkUserId)) {
          updateFields.dismissed_by = [...dismissedBy, currentUser.clerkUserId]
        } else if (!validatedData.is_dismissed && dismissedBy.includes(currentUser.clerkUserId)) {
          updateFields.dismissed_by = dismissedBy.filter((id: string) => id !== currentUser.clerkUserId)
        }
      }

      if (Object.keys(updateFields).length > 0) {
        const { error: updateError } = await supabase
          .from('account_notifications')
          .update({
            ...updateFields,
            updated_at: new Date().toISOString()
          })
          .eq('id', notification_id)

        if (updateError) {
          console.error('Error updating account notification:', updateError)
          return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
        }
      }
    } else {
      return NextResponse.json({ error: 'Invalid notification source' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Notification updated successfully'
    })

  } catch (error) {
    console.error('Update notification API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('notification_id')
    const notificationSource = searchParams.get('notification_source')
    
    if (!notificationId || !notificationSource) {
      return NextResponse.json({ error: 'Notification ID and source are required' }, { status: 400 })
    }

    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createServiceClient()

    if (notificationSource === 'user') {
      // Delete user notification
      const { error: deleteError } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', notificationId)
        .eq('clerk_id', currentUser.clerkUserId)

      if (deleteError) {
        console.error('Error deleting user notification:', deleteError)
        return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
      }
    } else if (notificationSource === 'account') {
      // For account notifications, we mark as dismissed rather than delete
      const { data: notification, error: fetchError } = await supabase
        .from('account_notifications')
        .select('dismissed_by')
        .eq('id', notificationId)
        .single()

      if (fetchError) {
        console.error('Error fetching account notification:', fetchError)
        return NextResponse.json({ error: 'Failed to fetch notification' }, { status: 500 })
      }

      const dismissedBy = notification.dismissed_by || []
      if (!dismissedBy.includes(currentUser.clerkUserId)) {
        const { error: updateError } = await supabase
          .from('account_notifications')
          .update({
            dismissed_by: [...dismissedBy, currentUser.clerkUserId],
            updated_at: new Date().toISOString()
          })
          .eq('id', notificationId)

        if (updateError) {
          console.error('Error dismissing account notification:', updateError)
          return NextResponse.json({ error: 'Failed to dismiss notification' }, { status: 500 })
        }
      }
    } else {
      return NextResponse.json({ error: 'Invalid notification source' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    })

  } catch (error) {
    console.error('Delete notification API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}