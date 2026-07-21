import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Fetch invitation details
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .select(`
        id,
        email,
        role,
        message,
        status,
        expires_at,
        account_id,
        invited_by,
        workspace_ids,
        brand_ids
      `)
      .eq('invite_token', token)
      .single()

    if (inviteError || !invitation) {
      console.error('Invitation fetch error:', inviteError)
      return NextResponse.json({ 
        error: 'Invitation not found or invalid' 
      }, { status: 404 })
    }

    // Check if invitation is still valid
    if (invitation.status !== 'pending') {
      return NextResponse.json({ 
        error: `This invitation has already been ${invitation.status}` 
      }, { status: 400 })
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Update status to expired
      await supabase
        .from('team_invitations')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', invitation.id)

      return NextResponse.json({ 
        error: 'This invitation has expired' 
      }, { status: 400 })
    }

    // Fetch account details
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, name, account_type')
      .eq('id', invitation.account_id)
      .single()

    if (accountError) {
      console.error('Account fetch error:', accountError)
    }

    // Get inviter details
    const { data: inviterProfile, error: inviterError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('clerk_id', invitation.invited_by)
      .single()

    if (inviterError) {
      console.error('Inviter profile fetch error:', inviterError)
    }

    return NextResponse.json({
      success: true,
      data: {
        email: invitation.email,
        role: invitation.role,
        message: invitation.message,
        account_name: account?.name || 'Unknown Organization',
        account_type: account?.account_type || 'team',
        invited_by: inviterProfile?.full_name || inviterProfile?.email || 'Someone',
        expires_at: invitation.expires_at
      }
    })

  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const user = await getCurrentUser()

    // Get current user
    if (!user?.clerkUserId) {
      return NextResponse.json({ 
        error: 'You must be signed in to accept invitations' 
      }, { status: 401 })
    }

    // Use service client for database operations that need to bypass RLS
    const supabaseService = createServiceClient()

    // Fetch invitation details
    const { data: invitation, error: inviteError } = await supabaseService
      .from('team_invitations')
      .select('*')
      .eq('invite_token', token)
      .single()

    if (inviteError || !invitation) {
      console.error('Invitation fetch error:', inviteError)
      return NextResponse.json({ 
        error: 'Invitation not found or invalid' 
      }, { status: 404 })
    }

    // Check if invitation is still valid
    if (invitation.status !== 'pending') {
      return NextResponse.json({ 
        error: `This invitation has already been ${invitation.status}` 
      }, { status: 400 })
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      await supabaseService
        .from('team_invitations')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', invitation.id)

      return NextResponse.json({ 
        error: 'This invitation has expired' 
      }, { status: 400 })
    }

    // Get user's profile
    const { data: userProfile } = await supabaseService
      .from('profiles')
      .select('email')
      .eq('clerk_id', user.clerkUserId)
      .single()

    // Verify email matches (case-insensitive)
    if (userProfile?.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json({ 
        error: `This invitation was sent to ${invitation.email}. Please sign in with that email address.` 
      }, { status: 403 })
    }

    // Check if user is already a member
    const { data: existingMember } = await supabaseService
      .from('account_users')
      .select('id, is_active')
      .eq('account_id', invitation.account_id)
      .eq('clerk_id', user.clerkUserId)
      .single()

    if (existingMember?.is_active) {
      return NextResponse.json({ 
        error: 'You are already a member of this organization' 
      }, { status: 400 })
    }

    // Use the accept_team_invitation function from the database
    const { data: result, error: acceptError } = await supabaseService
      .rpc('accept_team_invitation', {
        invitation_token: token,
        accepting_user_uuid: user.clerkUserId,
        mark_active: true // User is already signed in, so mark as active
      })

    if (acceptError) {
      console.error('Error accepting invitation:', acceptError)
      return NextResponse.json({ 
        error: 'Failed to accept invitation: ' + acceptError.message 
      }, { status: 500 })
    }

    // Check if the function returned success
    if (!result || !result.success) {
      return NextResponse.json({ 
        error: result?.error || 'Failed to accept invitation' 
      }, { status: 400 })
    }

    // Get account details for the response
    const { data: account } = await supabaseService
      .from('accounts')
      .select('name')
      .eq('id', invitation.account_id)
      .single()

    return NextResponse.json({
      success: true,
      message: `Welcome to ${account?.name || 'the team'}!`,
      data: {
        account_id: invitation.account_id,
        role: invitation.role,
        account_name: account?.name
      }
    })

  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
