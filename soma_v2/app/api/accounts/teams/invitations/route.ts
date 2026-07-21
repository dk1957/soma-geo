import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const supabase = createServiceClient()
    
    // Check authentication
    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current account ID (use the first account for now)
    const { data: profile } = await supabase
      .from('users')
      .select('accounts!inner(id)')
      .eq('clerk_id', user.clerkUserId)
      .single()

    if (!profile?.accounts?.length) {
      return NextResponse.json({ error: 'No account found' }, { status: 404 })
    }

    const accountId = profile.accounts[0].id

    // Fetch pending invitations
    const { data: invitations, error } = await supabase
      .from('team_invitations')
      .select(`
        id,
        email,
        role,
        message,
        expires_at,
        status,
        created_at,
        invited_by_user:users!team_invitations_invited_by_fkey(
          first_name,
          last_name,
          email
        )
      `)
      .eq('account_id', accountId)
      .in('status', ['pending', 'expired'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invitations:', error)
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 })
    }

    // Transform data
    const transformedInvitations = invitations?.map((invitation: any) => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      message: invitation.message,
      expires_at: invitation.expires_at,
      status: invitation.status,
      invited_at: invitation.created_at,
      invited_by: `${invitation.invited_by_user?.first_name || ''} ${invitation.invited_by_user?.last_name || ''}`.trim() || invitation.invited_by_user?.email || 'Unknown'
    })) || []

    return NextResponse.json({ 
      success: true, 
      data: transformedInvitations 
    })

  } catch (error) {
    console.error('Error in invitations API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}