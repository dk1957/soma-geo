import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const inviteMemberSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.enum(['admin', 'account_manager', 'member', 'viewer']),
  message: z.string().optional()
})

const updateMemberSchema = z.object({
  clerk_id: z.string('Valid clerk ID is required'),
  role: z.enum(['owner', 'admin', 'account_manager', 'member', 'viewer']),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params
    
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
        clerk_id,
        role,
        joined_at,
        invitation_sent_at,
        is_active
      `)
      .eq('account_id', accountId)
      .eq('is_active', true)
      .order('joined_at', { ascending: false })

    if (membersError) {
      console.error('Error fetching team members:', membersError)
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
    }

    // Get clerk IDs for all members
    const clerkIds = members.map(m => m.clerk_id).filter(Boolean)
    
    // Get profiles for all users using clerk_id
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        clerk_id,
        full_name,
        email,
        avatar_url,
        last_active_at
      `)
      .in('clerk_id', clerkIds)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      // Continue without profiles rather than failing completely
    }

    // Get workspace memberships for each user
    const { data: workspaceMemberships } = await supabase
      .from('workspace_users')
      .select(`
        clerk_id,
        role,
        workspaces (
          id,
          name,
          slug
        )
      `)
      .in('clerk_id', clerkIds)
      .eq('is_active', true)

    // Get brand manager roles for each user
    const { data: brandRoles } = await supabase
      .from('brand_managers')
      .select(`
        clerk_id,
        role,
        brands (
          id,
          name,
          slug
        )
      `)
      .in('clerk_id', clerkIds)
      .eq('is_active', true)

    // Format team members data
    const formattedMembers = members.map(member => {
      const profile = profiles?.find(p => p.clerk_id === member.clerk_id)
      
      return {
        clerk_id: member.clerk_id,
        email: profile?.email,
        full_name: profile?.full_name || 'Unknown User',
        avatar_url: profile?.avatar_url,
        account_role: member.role,
        joined_at: member.joined_at,
        invitation_sent_at: member.invitation_sent_at,
        last_active_at: profile?.last_active_at,
        workspaces: workspaceMemberships?.filter(wm => wm.clerk_id === member.clerk_id)
          .map(wm => ({
            ...wm.workspaces,
            role: wm.role
          })) || [],
        brand_roles: brandRoles?.filter(br => br.clerk_id === member.clerk_id)
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
    console.error('Account members API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params
    const body = await request.json()
    const validatedData = inviteMemberSchema.parse(body)
    
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Check if current user has permission to invite members
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

    // Only owners and admins can invite members
    if (!['owner', 'admin'].includes(accountAccess.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to invite members' }, { status: 403 })
    }

    // Check if user already exists in the system by searching for profile with email
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('clerk_id, email')
      .eq('email', validatedData.email)
      .single()

    if (existingProfile) {
      // User exists, check if already a member
      const { data: existingMember } = await supabase
        .from('account_users')
        .select('id, is_active')
        .eq('account_id', accountId)
        .eq('clerk_id', existingProfile.clerk_id)
        .single()

      if (existingMember) {
        if (existingMember.is_active) {
          return NextResponse.json({ error: 'User is already a member of this account' }, { status: 400 })
        } else {
          // Reactivate the membership
          const { error: reactivateError } = await supabase
            .from('account_users')
            .update({
              role: validatedData.role,
              is_active: true,
              invitation_sent_at: new Date().toISOString()
            })
            .eq('id', existingMember.id)

          if (reactivateError) {
            console.error('Error reactivating member:', reactivateError)
            return NextResponse.json({ error: 'Failed to reactivate member' }, { status: 500 })
          }

          // Update account usage
          await supabase.rpc('update_account_usage', {
            p_account_id: accountId,
            p_usage_type: 'team_members',
            p_increment: 1
          })

          return NextResponse.json({
            success: true,
            message: 'Member reactivated successfully',
            data: {
              clerk_id: existingProfile.clerk_id,
              email: validatedData.email,
              role: validatedData.role
            }
          })
        }
      } else {
        // Add existing user to account
        const { error: addError } = await supabase
          .from('account_users')
          .insert({
            account_id: accountId,
            clerk_id: existingProfile.clerk_id,
            role: validatedData.role,
            invited_by: currentUser.clerkUserId,
            invitation_sent_at: new Date().toISOString(),
            joined_at: new Date().toISOString()
          })

        if (addError) {
          console.error('Error adding existing user to account:', addError)
          return NextResponse.json({ error: 'Failed to add user to account' }, { status: 500 })
        }

        // Update account usage
        await supabase.rpc('update_account_usage', {
          p_account_id: accountId,
          p_usage_type: 'team_members',
          p_increment: 1
        })

        return NextResponse.json({
          success: true,
          message: 'User added to account successfully',
          data: {
            clerk_id: existingProfile.clerk_id,
            email: validatedData.email,
            role: validatedData.role
          }
        })
      }
    } else {
      // User doesn't exist, create invitation
      // For now, we'll create a pending invitation record
      // In a real implementation, you'd send an invitation email
      const invitationToken = crypto.randomUUID()
      
      const { error: inviteError } = await supabase
        .from('account_users')
        .insert({
          account_id: accountId,
          clerk_id: null, // Will be filled when user accepts invitation
          role: validatedData.role,
          invited_by: currentUser.clerkUserId,
          invitation_token: invitationToken,
          invitation_sent_at: new Date().toISOString(),
          is_active: false
        })

      if (inviteError) {
        console.error('Error creating invitation:', inviteError)
        return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
      }

      // TODO: Send invitation email with invitation token
      
      return NextResponse.json({
        success: true,
        message: 'Invitation created successfully',
        data: {
          email: validatedData.email,
          role: validatedData.role,
        }
      })
    }

  } catch (error) {
    console.error('Invite member API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params
    const body = await request.json()
    const validatedData = updateMemberSchema.parse(body)
    
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Check if current user has permission to update roles
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

    // Only owners and admins can update member roles
    if (!['owner', 'admin'].includes(accountAccess.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to update member roles' }, { status: 403 })
    }

    // Cannot change your own role or demote the only owner
    if (validatedData.clerk_id === currentUser.clerkUserId) {
      return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 })
    }

    // Update member role
    const { data: updatedMember, error: updateError } = await supabase
      .from('account_users')
      .update({ 
        role: validatedData.role,
        updated_at: new Date().toISOString()
      })
      .eq('account_id', accountId)
      .eq('clerk_id', validatedData.clerk_id)
      .select('role')
      .single()

    if (updateError) {
      console.error('Error updating member role:', updateError)
      return NextResponse.json({ error: 'Failed to update member role' }, { status: 500 })
    }

    // Log the role change
    try {
      await supabase.rpc('log_account_action', {
        p_account_id: accountId,
        p_clerk_id: currentUser.clerkUserId,
        p_action: 'member_role_updated',
        p_resource_type: 'member',
        p_resource_id: validatedData.clerk_id,
        p_new_values: { role: validatedData.role }
      })
    } catch (logError) {
      console.warn('Failed to log role update:', logError)
    }

    return NextResponse.json({
      success: true,
      message: 'Member role updated successfully',
      data: {
        clerk_id: validatedData.clerk_id,
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params
    const { searchParams } = new URL(request.url)
    const clerkId = searchParams.get('clerk_id')
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Clerk ID is required' }, { status: 400 })
    }

    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Check if current user has permission to remove members
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

    // Only owners and admins can remove members
    if (!['owner', 'admin'].includes(accountAccess.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to remove members' }, { status: 403 })
    }

    // Cannot remove yourself or the only owner
    if (clerkId === currentUser.clerkUserId) {
      return NextResponse.json({ error: 'You cannot remove yourself from the account' }, { status: 400 })
    }

    // Remove member (soft delete)
    const { error: removeError } = await supabase
      .from('account_users')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('account_id', accountId)
      .eq('clerk_id', clerkId)

    if (removeError) {
      console.error('Error removing member:', removeError)
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
    }

    // Update account usage
    await supabase.rpc('update_account_usage', {
      p_account_id: accountId,
      p_usage_type: 'team_members',
      p_increment: -1
    })

    // Log the member removal
    try {
      await supabase.rpc('log_account_action', {
        p_account_id: accountId,
        p_clerk_id: currentUser.clerkUserId,
        p_action: 'member_removed',
        p_resource_type: 'member',
        p_resource_id: clerkId
      })
    } catch (logError) {
      console.warn('Failed to log member removal:', logError)
    }

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully'
    })

  } catch (error) {
    console.error('Remove member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}