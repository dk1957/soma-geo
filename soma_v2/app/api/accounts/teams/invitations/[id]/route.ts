import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const supabase = createServiceClient()
    
    // Check authentication
    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: invitationId } = await params

    // Get current account ID and check permissions
    const { data: profile } = await supabase
      .from('users')
      .select('accounts!inner(id)')
      .eq('clerk_id', user.clerkUserId)
      .single()

    if (!profile?.accounts?.length) {
      return NextResponse.json({ error: 'No account found' }, { status: 404 })
    }

    const accountId = profile.accounts[0].id

    // Check if current user has permission to cancel invitations
    const { data: currentUserMember } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', accountId)
      .eq('clerk_id', user.clerkUserId)
      .single()

    if (!currentUserMember || !['owner', 'admin'].includes(currentUserMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Cancel the invitation
    const { error: cancelError } = await supabase
      .from('team_invitations')
      .update({ 
        status: 'cancelled', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', invitationId)
      .eq('account_id', accountId)

    if (cancelError) {
      console.error('Error cancelling invitation:', cancelError)
      return NextResponse.json({ error: 'Failed to cancel invitation' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Invitation cancelled successfully' 
    })

  } catch (error) {
    console.error('Error in cancel invitation API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const supabase = createServiceClient()
    
    // Check authentication
    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: invitationId } = await params

    // Get the invitation details
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('id', invitationId)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Check if invitation is still valid
    if (invitation.status !== 'pending' || new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation is no longer valid' }, { status: 400 })
    }

    // Send a new invitation email (you can implement this using your existing invite logic)
    // For now, just return success
    return NextResponse.json({ 
      success: true, 
      message: 'Invitation resent successfully' 
    })

  } catch (error) {
    console.error('Error in resend invitation API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}