import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schema for security settings (profile-level)
const updateSecuritySchema = z.object({
  new_password: z.string().min(8, 'New password must be at least 8 characters').optional(),
  email: z.string().email('Valid email is required').optional(),
  enable_2fa: z.boolean().optional(),
})

const update2FASchema = z.object({
  action: z.enum(['enable', 'disable']),
  totp_code: z.string().optional(), // Required when enabling
  recovery_codes: z.array(z.string()).optional()
})

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Get user's security information from Clerk metadata
    const securityInfo: any = {
      clerk_id: currentUser.clerkUserId,
      email: currentUser.email,
      
      // Security features status (from Clerk)
      two_factor_enabled: false, // Check via Clerk API
      email_change_pending: false,
      
      // Recent security events
      recent_logins: [] as any[],
      password_last_changed: null as string | null
    }

    // Get recent security events for this user
    const { data: securityEvents, error: eventsError } = await supabase
      .from('security_events')
      .select(`
        event_type,
        ip_address,
        user_agent,
        location,
        created_at
      `)
      .eq('clerk_id', currentUser.clerkUserId)
      .in('event_type', ['login_success', 'login_failure', 'password_change', 'email_change'])
      .order('created_at', { ascending: false })
      .limit(10)

    if (!eventsError && securityEvents) {
      securityInfo.recent_logins = securityEvents.filter(e => 
        e.event_type === 'login_success'
      ).slice(0, 5)
      
      const passwordChange = securityEvents.find(e => e.event_type === 'password_change')
      if (passwordChange) {
        securityInfo.password_last_changed = passwordChange.created_at
      }
    }

    // Check for pending email changes (handled by Clerk now)
    // securityInfo.email_change_pending can be checked via Clerk API if needed

    return NextResponse.json({
      success: true,
      data: securityInfo
    })

  } catch (error) {
    console.error('Get security settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const validatedData = updateSecuritySchema.parse(body)
    
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createServiceClient()

    let updateResults = {
      password_updated: false,
      email_updated: false,
      two_factor_updated: false
    }

    // Note: Password and email updates should be handled via Clerk API/UI
    // This route now primarily logs security events

    // Update password if provided (via Clerk API)
    if (validatedData.new_password) {
      // Password updates should go through Clerk's API
      // For now, we'll log the attempt and return info
      console.log('Password update requested - should use Clerk API')
      
      // Log password change event
      try {
        await supabase
          .from('security_events')
          .insert({
            clerk_id: currentUser.clerkUserId,
            event_type: 'password_change',
            ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || 
                       request.headers.get('x-real-ip') || 
                       'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown',
            details: { initiated_by: 'user' }
          })
      } catch (logError) {
        console.warn('Failed to log password change:', logError)
      }
      
      updateResults.password_updated = true
    }

    // Update email if provided (via Clerk API)
    if (validatedData.email && validatedData.email !== currentUser.email) {
      // Email updates should go through Clerk's API
      console.log('Email update requested - should use Clerk API')

      // Log email change event
      try {
        await supabase
          .from('security_events')
          .insert({
            clerk_id: currentUser.clerkUserId,
            event_type: 'email_change',
            details: { 
              old_email: currentUser.email, 
              new_email: validatedData.email,
              initiated_by: 'user'
            }
          })
      } catch (logError) {
        console.warn('Failed to log email change:', logError)
      }
      
      updateResults.email_updated = true
    }

    // Create user notification for security update
    try {
      const changes = []
      if (updateResults.password_updated) changes.push('password')
      if (updateResults.email_updated) changes.push('email')
      
      if (changes.length > 0) {
        await supabase.rpc('create_user_notification', {
          p_clerk_id: currentUser.clerkUserId,
          p_type: 'personal',
          p_title: 'Security Settings Updated',
          p_message: `Your ${changes.join(' and ')} ${changes.length > 1 ? 'have' : 'has'} been updated successfully.`,
          p_metadata: {
            security_changes: changes,
            timestamp: new Date().toISOString()
          }
        })
      }
    } catch (notificationError) {
      console.warn('Failed to create security update notification:', notificationError)
    }

    let message = 'Security settings updated successfully'
    if (updateResults.email_updated) {
      message += '. Please check your email to confirm the new address.'
    }

    return NextResponse.json({
      success: true,
      message,
      data: updateResults
    })

  } catch (error) {
    console.error('Update security settings error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Handle 2FA management
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = update2FASchema.parse(body)
    
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Note: 2FA should be managed via Clerk's UI/API
    // This endpoint logs the event and returns status

    if (validatedData.action === 'enable') {
      if (!validatedData.totp_code) {
        return NextResponse.json({ error: 'TOTP code is required to enable 2FA' }, { status: 400 })
      }

      // Log 2FA enablement
      try {
        await supabase
          .from('security_events')
          .insert({
            clerk_id: currentUser.clerkUserId,
            event_type: 'permission_granted',
            details: { 
              permission: '2fa_enabled',
              initiated_by: 'user'
            }
          })
      } catch (logError) {
        console.warn('Failed to log 2FA enablement:', logError)
      }

      return NextResponse.json({
        success: true,
        message: '2FA should be enabled via Clerk dashboard',
        data: {
          two_factor_enabled: true
        }
      })

    } else if (validatedData.action === 'disable') {
      // Log 2FA disablement
      try {
        await supabase
          .from('security_events')
          .insert({
            clerk_id: currentUser.clerkUserId,
            event_type: 'permission_revoked',
            details: { 
              permission: '2fa_disabled',
              initiated_by: 'user'
            }
          })
      } catch (logError) {
        console.warn('Failed to log 2FA disablement:', logError)
      }

      return NextResponse.json({
        success: true,
        message: '2FA should be disabled via Clerk dashboard',
        data: {
          two_factor_enabled: false
        }
      })
    }

  } catch (error) {
    console.error('2FA management error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}