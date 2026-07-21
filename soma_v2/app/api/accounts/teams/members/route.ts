import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateMemberSchema = z.object({
  user_id: z.string().uuid('Valid user ID is required'),
  account_id: z.string().uuid('Valid account ID is required'),
  role: z.enum(['owner', 'admin', 'manager', 'member', 'viewer']),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('account_id')
    
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
    }

    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    const supabase = createServiceClient()

    // Check if user has access to this account
    const { data: accountAccess, error: accessError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', accountId)
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('is_active', true)
      .single()

    if (accessError || !accountAccess) {
      return NextResponse.json({ error: 'Access denied to this account' }, { status: 403 })
    }

    // Get all account members
    const { data: members, error: membersError } = await supabase
      .from('account_users')
      .select(`
        user_id,
        role,
        joined_at,
        is_active
      `)
      .eq('account_id', accountId)
      .eq('is_active', true)
      .order('joined_at', { ascending: false })

    if (membersError) {
      console.error('Error fetching team members:', membersError)
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
    }

    // Get user details for all members
    const userIds = members.map(m => m.user_id)
    const { data: userDetails, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        created_at,
        last_sign_in_at
      `)
      .in('id', userIds)

    if (usersError) {
      console.error('Error fetching user details:', usersError)
      return NextResponse.json({ error: 'Failed to fetch user details' }, { status: 500 })
    }

    // Get profiles for all users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        user_id,
        full_name,
        avatar_url
      `)
      .in('user_id', userIds)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      // Continue without profiles rather than failing completely
    }

    // Get workspace memberships for each user
    const { data: workspaceMemberships } = await supabase
      .from('workspace_users')
      .select(`
        user_id,
        role,
        workspaces (
          id,
          name,
          slug
        )
      `)
      .in('user_id', userIds)
      .eq('is_active', true)

    // Get brand manager roles for each user
    const { data: brandRoles } = await supabase
      .from('brand_managers')
      .select(`
        user_id,
        role,
        brands (
          id,
          name,
          slug
        )
      `)
      .in('user_id', userIds)
      .eq('is_active', true)

    // Format team members data
    const formattedMembers = members.map(member => {
      const userDetail = userDetails?.find(u => u.id === member.user_id)
      const profile = profiles?.find(p => p.user_id === member.user_id)
      
      return {
        user_id: member.user_id,
        email: userDetail?.email,
        full_name: profile?.full_name || 'Unknown User',
        avatar_url: profile?.avatar_url,
        account_role: member.role,
        joined_at: member.joined_at,
        last_sign_in: userDetail?.last_sign_in_at,
        workspaces: workspaceMemberships?.filter(wm => wm.user_id === member.user_id)
          .map(wm => ({
            ...wm.workspaces,
            role: wm.role
          })) || [],
        brand_roles: brandRoles?.filter(br => br.user_id === member.user_id)
          .map(br => ({
            ...br.brands,
            role: br.role
          })) || []
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedMembers,
      count: formattedMembers.length
    })

  } catch (error) {
    console.error('Team members API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const validatedData = updateMemberSchema.parse(body)
    
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    const supabase = createServiceClient()

    // Check if current user has permission to update roles in this account
    const { data: accountAccess, error: accessError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', validatedData.account_id)
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('is_active', true)
      .single()

    if (accessError || !accountAccess) {
      return NextResponse.json({ error: 'Access denied to this account' }, { status: 403 })
    }

    // Only owners and admins can update member roles
    if (!['owner', 'admin'].includes(accountAccess.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to update member roles' }, { status: 403 })
    }

    // Cannot change your own role or demote the only owner
    // Note: validatedData.user_id is clerk_id in the account_users table
    if (validatedData.user_id === currentUser.clerkUserId) {
      return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 })
    }

    // Update member role - use clerk_id since that's what the UI passes
    const { data: updatedMember, error: updateError } = await supabase
      .from('account_users')
      .update({ 
        role: validatedData.role,
        updated_at: new Date().toISOString()
      })
      .eq('account_id', validatedData.account_id)
      .eq('clerk_id', validatedData.user_id)
      .select('role')
      .single()

    if (updateError) {
      console.error('Error updating member role:', updateError)
      return NextResponse.json({ error: 'Failed to update member role' }, { status: 500 })
    }

    // Get user details for response (use clerk_id)
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('clerk_id', validatedData.user_id)
      .single()

    return NextResponse.json({
      success: true,
      message: 'Member role updated successfully',
      data: {
        user_id: validatedData.user_id,
        email: profile?.email,
        full_name: profile?.full_name,
        new_role: updatedMember.role
      }
    })

  } catch (error) {
    console.error('Update member role error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}