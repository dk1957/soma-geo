import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const passwordUpdateSchema = z.object({
  new_password: z.string().min(8, 'New password must be at least 8 characters')
})

// NOTE: Password changes are handled via Clerk's UI or API directly
// This route now just logs the security event after Clerk password change
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = passwordUpdateSchema.parse(body)

    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Note: Actual password update should be done via Clerk's API
    // This endpoint now primarily logs the security event
    // For Clerk password management, use the Clerk SDK or redirect to Clerk's password reset

    // Log security event
    try {
      await supabase
        .from('security_events')
        .insert({
          clerk_id: currentUser.clerkUserId,
          event_type: 'password_change',
          ip_address: request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          details: {
            source: 'settings_page',
            timestamp: new Date().toISOString()
          }
        })
    } catch (logError) {
      console.warn('Failed to log password change event:', logError)
    }

    // Create user notification
    try {
      await supabase.rpc('create_user_notification', {
        p_clerk_id: currentUser.clerkUserId,
        p_type: 'personal',
        p_title: 'Password Changed',
        p_message: 'Your password has been successfully updated.',
        p_metadata: {
          event_type: 'password_change',
          timestamp: new Date().toISOString()
        }
      })
    } catch (notificationError) {
      console.warn('Failed to create password change notification:', notificationError)
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    })

  } catch (error) {
    console.error('Password update API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}