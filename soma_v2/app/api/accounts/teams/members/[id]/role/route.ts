import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export async function PUT(
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

    const { id: memberId } = await params
    const body = await request.json()
    const { role } = body

    if (!role || !['admin', 'account_manager', 'member', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

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

    // Check if current user has permission to update roles
    const { data: currentUserMember } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', accountId)
      .eq('clerk_id', user.clerkUserId)
      .single()

    if (!currentUserMember || !['owner', 'admin'].includes(currentUserMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Prevent changing your own role
    if (memberId === user.clerkUserId) {
      return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 })
    }

    // Update the member role
    const { error: updateError } = await supabase
      .from('account_users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('account_id', accountId)
      .eq('clerk_id', memberId)

    if (updateError) {
      console.error('Error updating member role:', updateError)
      return NextResponse.json({ error: 'Failed to update member role' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Member role updated successfully' 
    })

  } catch (error) {
    console.error('Error in update member role API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}