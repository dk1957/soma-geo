import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schemas for profile management
const updateProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100).optional(),
  timezone: z.string().optional(),
  language_preference: z.string().optional(),
  region: z.string().nullable().optional().transform((val) => {
    // Handle legacy value - convert middle_east_africa to middle_east
    if (val === 'middle_east_africa') return 'middle_east'
    return val
  }),
  enhanced_preferences: z.object({
    theme: z.enum(['light', 'dark', 'auto']).optional(),
    dashboard_layout: z.enum(['compact', 'standard', 'detailed']).optional(),
    default_view: z.string().optional(),
    notification_preferences: z.object({
      email_enabled: z.boolean().optional(),
      push_enabled: z.boolean().optional(),
      sms_enabled: z.boolean().optional(),
      digest_frequency: z.enum(['immediate', 'hourly', 'daily', 'weekly', 'never']).optional(),
      job_completion: z.boolean().optional(),
      audit_results: z.boolean().optional(),
      optimization_ready: z.boolean().optional(),
      system_maintenance: z.boolean().optional(),
      quiet_hours_start: z.string().nullable().optional(),
      quiet_hours_end: z.string().nullable().optional(),
      quiet_days: z.array(z.string()).optional(),
    }).optional(),
  }).optional(),
})

const updateSecuritySchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  enable_2fa: z.boolean().optional(),
})

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        user_id,
        email,
        full_name,
        avatar_url,
        region,
        timezone,
        language_preference,
        role,
        onboarding_status,
        onboarding_completed_at,
        enhanced_preferences,
        usage_statistics,
        last_active_at,
        created_at,
        updated_at
      `)
      .eq('clerk_id', user.clerkUserId)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    // Get user's account memberships
    const { data: accountMemberships, error: membershipsError } = await supabase
      .from('account_users')
      .select(`
        role,
        joined_at,
        is_active,
        accounts (
          id,
          name,
          slug,
          account_type,
          billing_plan
        )
      `)
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)
      .order('joined_at', { ascending: false })

    if (membershipsError) {
      console.error('Error fetching account memberships:', membershipsError)
      // Continue without memberships rather than failing
    }

    // Format response
    const formattedProfile = {
      ...profile,
      account_memberships: accountMemberships?.map(membership => ({
        ...membership.accounts,
        user_role: membership.role,
        joined_at: membership.joined_at
      })) || []
    }

    return NextResponse.json({
      success: true,
      data: formattedProfile
    })

  } catch (error) {
    console.error('Get profile API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)
    
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Get current profile for audit trail
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_id', user.clerkUserId)
      .single()

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', user.clerkUserId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    // Create user notification for profile update
    try {
      await supabase.rpc('create_user_notification', {
        p_user_id: user.profile?.id,
        p_type: 'personal',
        p_title: 'Profile Updated',
        p_message: 'Your profile settings have been updated successfully.',
        p_metadata: {
          updated_fields: Object.keys(validatedData)
        }
      })
    } catch (notificationError) {
      console.warn('Failed to create profile update notification:', notificationError)
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    })

  } catch (error) {
    console.error('Update profile API error:', error)
    
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
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Check if user is the owner of any accounts
    const { data: ownedAccounts } = await supabase
      .from('accounts')
      .select('id, name')
      .eq('owner_clerk_id', user.clerkUserId)
      .eq('is_active', true)

    if (ownedAccounts && ownedAccounts.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete account while you own organizations. Please transfer ownership or delete the organizations first.',
        owned_accounts: ownedAccounts
      }, { status: 400 })
    }

    // Soft delete user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', user.clerkUserId)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
      return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 })
    }

    // Deactivate all account memberships
    const { error: membershipError } = await supabase
      .from('account_users')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', user.clerkUserId)

    if (membershipError) {
      console.error('Error deactivating memberships:', membershipError)
      // Continue with deletion even if this fails
    }

    // Note: In a production environment, you might want to:
    // 1. Schedule the actual auth user deletion for later
    // 2. Send confirmation emails
    // 3. Handle data export requests
    // 4. Clean up related data according to your data retention policy

    return NextResponse.json({
      success: true,
      message: 'Account deletion initiated successfully'
    })

  } catch (error) {
    console.error('Delete profile API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}