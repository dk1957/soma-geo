import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { z } from 'zod'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Validation schemas
const InviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'admin', 'member']).optional().default('member'),
  firstName: z.string().optional(),
  lastName: z.string().optional()
})

const UpdateRoleSchema = z.object({
  clerkId: z.string(),
  role: z.enum(['owner', 'admin', 'member'])
})

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Get user's organization
    const { data: membership, error: membershipError } = await supabase
      .from('account_users')
      .select('account_id, role')
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('is_active', true)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    // Use service client to bypass RLS and fetch all team members
    const supabaseService = createServiceClient()
    
    // Get all team members for this organization
    const { data: teamMembers, error: teamError } = await supabaseService
      .from('account_users')
      .select(`
        id,
        clerk_id,
        role,
        is_active,
        joined_at,
        created_at,
        invited_by
      `)
      .eq('account_id', membership.account_id)
      .order('joined_at', { ascending: true })

    if (teamError) {
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
    }

    // Get profiles for all team members
    const clerkIds = teamMembers?.map(member => member.clerk_id).filter(Boolean) || []
    const { data: profiles, error: profilesError } = await supabaseService
      .from('profiles')
      .select(`
        clerk_id,
        email,
        full_name,
        avatar_url,
        enhanced_preferences,
        last_active_at
      `)
      .in('clerk_id', clerkIds)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
    }

    // Get auth user data as fallback for missing profile info
    // Note: With Clerk, we can get user info directly from Clerk API if needed
    const authUsersMap = new Map()

    // Get pending invitations using service client
    const { data: invitations } = await supabaseService
      .from('team_invitations')
      .select('*')
      .eq('account_id', membership.account_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    // Transform the data for the frontend
    const formattedMembers = teamMembers?.map(member => {
      const profile = profiles?.find(p => p.clerk_id === member.clerk_id)
      const authUser = authUsersMap.get(member.clerk_id)
      
      // Generate display name with fallback priority
      let displayName = 'Unknown User'
      let displayEmail = 'No email found'
      
      if (profile?.full_name?.trim()) {
        displayName = profile.full_name
      } else if (authUser?.name?.trim()) {
        displayName = authUser.name
      } else if (profile?.email || authUser?.email) {
        // Use email username as fallback
        const email = profile?.email || authUser?.email
        displayEmail = email
        displayName = email.split('@')[0].replace(/[._-]/g, ' ').split(' ')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      }
      
      if (profile?.email) displayEmail = profile.email
      else if (authUser?.email) displayEmail = authUser.email
      
      return {
        id: member.id,
        clerkId: member.clerk_id,
        role: member.role,
        isActive: member.is_active,
        joinedAt: member.joined_at,
        createdAt: member.created_at,
        invitedBy: member.invited_by,
        wasInvited: !!member.invited_by,
        profile: {
          clerkId: profile?.clerk_id || member.clerk_id,
          fullName: displayName,
          email: displayEmail,
          avatarUrl: profile?.avatar_url || null,
          lastActiveAt: profile?.last_active_at || authUser?.last_sign_in || null,
          preferences: profile?.enhanced_preferences
        }
      }
    }) || []

    // Format invitations
    const formattedInvites = invitations?.map(invite => ({
      id: invite.id,
      clerkId: null,
      role: invite.role,
      isActive: false,
      joinedAt: null,
      createdAt: invite.created_at,
      status: 'invited',
      profile: {
        clerkId: null,
        fullName: 'Pending Invitation',
        email: invite.email,
        avatarUrl: null,
        lastActiveAt: null,
        preferences: null
      }
    })) || []

    return NextResponse.json({
      success: true,
      data: [...formattedMembers, ...formattedInvites]
    })

  } catch (error) {
    console.error('Error in team GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const validation = InviteUserSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: validation.error.issues 
      }, { status: 400 })
    }

    const { email, role, firstName, lastName } = validation.data
    const supabase = createServiceClient()

    // Get user's organization and check permissions
    const { data: membership, error: membershipError } = await supabase
      .from('account_users')
      .select('account_id, role')
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('is_active', true)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    // Check if user has permission to invite (owner or admin)
    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if user already exists and get their ID
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('clerk_id, email')
      .eq('email', email)
      .single()

    let invitedClerkId: string

    if (existingUser) {
      // User exists, check if they're already a member (active or inactive)
      const { data: existingMembership } = await supabase
        .from('account_users')
        .select('id, is_active')
        .eq('account_id', membership.account_id)
        .eq('clerk_id', existingUser.clerk_id)
        .single()

      if (existingMembership) {
        return NextResponse.json({ 
          error: existingMembership.is_active 
            ? 'This user is already a member of this organization' 
            : 'This user was previously a member of this organization. Please contact support to reactivate their account.',
          existingMember: true
        }, { status: 409 })
      }

      invitedClerkId = existingUser.clerk_id
    } else {
      // User doesn't exist, create invitation record
      
      // Check for ANY existing invitation (pending, accepted, or expired)
      const { data: existingInvites } = await supabase
        .from('team_invitations')
        .select('id, status')
        .eq('account_id', membership.account_id)
        .eq('email', email)
        .in('status', ['pending', 'accepted'])
        
      if (existingInvites && existingInvites.length > 0) {
        const status = existingInvites[0].status
        return NextResponse.json({ 
          error: status === 'pending' 
            ? 'An invitation has already been sent to this email address' 
            : 'This user has already accepted an invitation. They should sign in to access the organization.',
          invitationExists: true
        }, { status: 409 })
      }

      // Generate token
      const inviteToken = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiration

      // Map current user's Clerk ID to the internal auth.users UUID for invited_by
      // Try account_users.user_id first, then fallback to profiles.user_id
      let inviterUserUuid: string | null = null
      try {
        const { data: inviterRow } = await supabase
          .from('account_users')
          .select('user_id')
          .eq('account_id', membership.account_id)
          .eq('clerk_id', currentUser.clerkUserId)
          .maybeSingle()

        inviterUserUuid = inviterRow?.user_id || null

        if (!inviterUserUuid) {
          const { data: inviterProfile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('clerk_id', currentUser.clerkUserId)
            .maybeSingle()
          inviterUserUuid = inviterProfile?.user_id || null
        }
      } catch (mapErr) {
        console.warn('Could not map clerk_id to user_id for inviter', mapErr)
      }

      if (!inviterUserUuid) {
        try {
          // Fallback: use account owner -> map owner_clerk_id to user_id
          const { data: accountRow } = await supabase.from('accounts').select('owner_clerk_id').eq('id', membership.account_id).maybeSingle()
          const ownerClerkId = accountRow?.owner_clerk_id || null
          if (ownerClerkId) {
            const { data: ownerRow } = await supabase.from('account_users').select('user_id').eq('account_id', membership.account_id).eq('clerk_id', ownerClerkId).maybeSingle()
            inviterUserUuid = ownerRow?.user_id || null
          }
        } catch (ownerMapErr) {
          console.warn('Could not map account owner to user_id for inviter fallback', ownerMapErr)
        }
      }

      if (!inviterUserUuid) {
        return NextResponse.json({ error: 'Inviter does not have an associated internal user id. Please contact support.' }, { status: 400 })
      }

      const { data: newInvite, error: inviteError } = await supabase
        .from('team_invitations')
        .insert({
          account_id: membership.account_id,
          email: email,
          role: role,
          invited_by: inviterUserUuid, // must be UUID per schema
          invite_token: inviteToken,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        })
        .select()
        .single()

      if (inviteError) {
        console.error('Error creating invitation:', inviteError)
        return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
      }

      // Get account details for email
      const { data: accountData } = await supabase
        .from('accounts')
        .select('name, account_type')
        .eq('id', membership.account_id)
        .single()

      // Get inviter profile
      const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('clerk_id', currentUser.clerkUserId)
        .single()

      // Send invitation email
      const inviteUrl = `${process.env.APP_URL || 'http://localhost:3000'}/invite/${inviteToken}`
      
      try {
        await resend.emails.send({
          from: process.env.FROM_EMAIL || 'noreply@withsoma.ai',
          to: email,
          subject: `You're invited to join ${accountData?.name || 'an organization'} on Soma`,
          html: generateInvitationEmailHTML({
            invitee_email: email,
            inviter_name: inviterProfile?.full_name || inviterProfile?.email || 'Someone',
            account_name: accountData?.name || 'the organization',
            account_type: accountData?.account_type || 'team',
            role: role,
            invite_url: inviteUrl,
            expires_at: expiresAt
          })
        })
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError)
        // Don't fail the whole process if email fails
      }

      // Log activity
      await supabase.rpc('log_account_action', {
        p_account_id: membership.account_id,
        p_clerk_id: currentUser.clerkUserId,
        p_action: 'member_invited',
        p_resource_type: 'invitation',
        p_resource_id: newInvite.id,
        p_new_values: { email, role, token: inviteToken }
      })

      return NextResponse.json({
        success: true,
        data: { 
            id: newInvite.id, 
            message: 'Invitation sent successfully',
            invite_url: inviteUrl
        }
      })
    }

    // Add existing user to organization (use service client to bypass RLS)
    const { data: newMembership, error: addError } = await supabase
      .from('account_users')
      .insert({
        account_id: membership.account_id,
        clerk_id: invitedClerkId,
        role: role,
        is_active: true,
        invited_by: currentUser.clerkUserId
      })
      .select()
      .single()

    if (addError) {
      console.error('Error adding team member:', addError)
      
      // Provide user-friendly error messages
      if (addError.code === '23505') { // Unique constraint violation
        return NextResponse.json({ 
          error: 'This user is already associated with this organization',
          code: 'DUPLICATE_MEMBER'
        }, { status: 409 })
      } else if (addError.code === '42501') { // RLS policy violation
        return NextResponse.json({ 
          error: 'Permission denied. Please ensure you have the correct role to add members.',
          code: 'PERMISSION_DENIED'
        }, { status: 403 })
      } else if (addError.code === '23503') { // Foreign key violation
        return NextResponse.json({ 
          error: 'Invalid user or organization. Please try again.',
          code: 'INVALID_REFERENCE'
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to add team member. Please try again or contact support.',
        code: 'ADD_MEMBER_FAILED',
        details: addError.message
      }, { status: 500 })
    }

    // Log the action for audit trail
    await supabase.rpc('log_account_action', {
      p_account_id: membership.account_id,
      p_clerk_id: currentUser.clerkUserId,
      p_action: 'member_added',
      p_resource_type: 'member',
      p_resource_id: newMembership.id,
      p_new_values: { email, role, invited_clerk_id: invitedClerkId }
    })

    // Create notification for the new member
    await supabase.rpc('create_user_notification', {
      p_clerk_id: invitedClerkId,
      p_account_id: membership.account_id,
      p_type: 'personal',
      p_title: 'Welcome to the team!',
      p_message: `You've been added to the organization as a ${role}.`
    })

    return NextResponse.json({
      success: true,
      data: { 
        id: newMembership.id, 
        message: `${email} has been added to your organization successfully` 
      }
    })

  } catch (error) {
    console.error('Error in team POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const validation = UpdateRoleSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: validation.error.issues 
      }, { status: 400 })
    }

    const { clerkId, role } = validation.data
    const supabase = createServiceClient()

    // Get user's organization and check permissions
    const { data: membership, error: membershipError } = await supabase
      .from('account_users')
      .select('account_id, role')
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('is_active', true)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    // Check if user has permission to update roles (owner or admin)
    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get current member info
    const { data: targetMember, error: targetError } = await supabase
      .from('account_users')
      .select('id, role, clerk_id')
      .eq('account_id', membership.account_id)
      .eq('clerk_id', clerkId)
      .single()

    if (targetError || !targetMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    // Prevent self-demotion from owner role
    if (clerkId === currentUser.clerkUserId && membership.role === 'owner' && role !== 'owner') {
      return NextResponse.json({ 
        error: 'Cannot change your own owner role' 
      }, { status: 403 })
    }

    // Update the member's role
    const { error: updateError } = await supabase
      .from('account_users')
      .update({ role: role })
      .eq('id', targetMember.id)

    if (updateError) {
      console.error('Error updating member role:', updateError)
      return NextResponse.json({ error: 'Failed to update member role' }, { status: 500 })
    }

    // Log the action for audit trail
    await supabase.rpc('log_account_action', {
      p_account_id: membership.account_id,
      p_clerk_id: currentUser.clerkUserId,
      p_action: 'member_role_updated',
      p_resource_type: 'member',
      p_resource_id: targetMember.id,
      p_old_values: { role: targetMember.role },
      p_new_values: { role: role }
    })

    // Create notification for the updated member
    if (clerkId !== currentUser.clerkUserId) {
      await supabase.rpc('create_user_notification', {
        p_clerk_id: clerkId,
        p_account_id: membership.account_id,
        p_type: 'personal',
        p_title: 'Role Updated',
        p_message: `Your role has been updated to ${role}.`
      })
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Member role updated successfully' }
    })

  } catch (error) {
    console.error('Error in team PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
// Helper function to generate invitation email HTML
function generateInvitationEmailHTML(params: {
  invitee_email: string
  inviter_name: string
  account_name: string
  account_type: string
  role: string
  invite_url: string
  expires_at: Date
}) {
  const roleDescriptions = {
    'owner': 'Full account control and billing access',
    'admin': 'Full team and brand management access',
    'account_manager': 'Team and assigned brand management',
    'member': 'Standard workspace access',
    'viewer': 'Read-only access to assigned workspaces'
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Team Invitation - Soma</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Urbanist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
          line-height: 1.6; 
          color: #000000; 
          background-color: #ffffff;
        }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; padding: 32px 0; border-bottom: 2px solid #000000; }
        .logo { 
          font-size: 36px; 
          font-weight: 700; 
          color: #000000; 
          letter-spacing: -0.5px;
        }
        .header h1 { 
          font-size: 24px; 
          font-weight: 600; 
          color: #000000; 
          margin-top: 16px;
        }
        .content { padding: 40px 0; }
        .invitation-card { 
          background: #f5f5f5; 
          border: 2px solid #000000; 
          border-radius: 0; 
          padding: 32px; 
          margin: 24px 0; 
        }
        .invitation-card h2 {
          font-size: 20px;
          font-weight: 600;
          color: #000000;
          margin-bottom: 24px;
        }
        .cta-button { 
          display: inline-block; 
          background: #000000 !important; 
          color: #ffffff !important; 
          text-decoration: none; 
          padding: 16px 48px; 
          border-radius: 0;
          font-weight: 600;
          font-size: 16px;
          margin: 24px 0;
          border: 2px solid #000000;
          transition: all 0.2s;
        }
        .cta-button:hover {
          background: #ffffff !important;
          color: #000000 !important;
        }
        .details { 
          background: #ffffff; 
          border: 2px solid #000000; 
          border-radius: 0; 
          padding: 24px; 
          margin: 20px 0; 
        }
        .details h3 {
          font-size: 18px;
          font-weight: 600;
          color: #000000;
          margin-bottom: 16px;
        }
        .details p {
          font-size: 14px;
          color: #000000;
          margin: 8px 0;
        }
        .details strong {
          font-weight: 600;
        }
        .footer { 
          text-align: center; 
          padding: 40px 0; 
          border-top: 2px solid #000000; 
          color: #666666; 
          font-size: 14px; 
        }
        .footer p {
          margin: 8px 0;
        }
        .expires { 
          color: #000000; 
          font-weight: 600; 
          background: #f5f5f5;
          padding: 8px;
          margin-top: 12px;
          border-left: 4px solid #000000;
        }
        .info-box {
          background: #f5f5f5;
          border: 2px solid #000000;
          border-radius: 0;
          padding: 24px;
          margin: 20px 0;
        }
        .info-box h3 {
          font-size: 18px;
          font-weight: 600;
          color: #000000;
          margin-bottom: 12px;
        }
        .info-box p {
          font-size: 14px;
          color: #000000;
          line-height: 1.6;
        }
        code {
          background: #f5f5f5;
          padding: 6px 12px;
          border: 1px solid #000000;
          border-radius: 0;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          word-break: break-all;
          color: #000000;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">SOMA</div>
          <h1>You're invited to join a team!</h1>
        </div>
        
        <div class="content">
          <div class="invitation-card">
            <h2>${params.inviter_name} invited you to join ${params.account_name}</h2>
            
            <div class="details">
              <h3>Invitation Details</h3>
              <p><strong>Organization:</strong> ${params.account_name} (${params.account_type === 'agency' ? 'Agency' : 'In-house team'})</p>
              <p><strong>Your Role:</strong> ${params.role.charAt(0).toUpperCase() + params.role.slice(1).replace('_', ' ')}</p>
              <p><strong>Permissions:</strong> ${roleDescriptions[params.role as keyof typeof roleDescriptions]}</p>
              <p class="expires"><strong>Expires:</strong> ${params.expires_at.toLocaleDateString()} at ${params.expires_at.toLocaleTimeString()}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${params.invite_url}" class="cta-button">Accept Invitation</a>
            </div>
            
            <p style="text-align: center; margin-top: 20px; color: #666666; font-size: 14px;">
              Or copy and paste this link in your browser:<br>
              <code>${params.invite_url}</code>
            </p>
          </div>
          
          <div class="info-box">
            <h3>What is Soma?</h3>
            <p>Soma is the leading AI discoverability platform that helps brands optimize their presence across AI models like ChatGPT, Claude, Gemini, and Perplexity. Monitor citations, improve visibility, and stay ahead in the AI-first world.</p>
          </div>
        </div>
        
        <div class="footer">
          <p>This invitation was sent to ${params.invitee_email}</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          <p style="margin-top: 16px;">© 2025 Soma. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get clerkId or inviteId from URL params
    const url = new URL(request.url)
    const clerkId = url.searchParams.get('clerkId')
    const inviteId = url.searchParams.get('inviteId')

    if (!clerkId && !inviteId) {
      return NextResponse.json({ error: 'Clerk ID or Invite ID required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Get user's organization and check permissions
    const { data: membership, error: membershipError } = await supabase
      .from('account_users')
      .select('account_id, role')
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('is_active', true)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    // Check if user has permission to remove members (owner or admin)
    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Handle invitation revocation
    if (inviteId) {
      const supabaseService = createServiceClient()
      
      const { data: invitation, error: inviteError } = await supabaseService
        .from('team_invitations')
        .select('id, email, status, accepted_by')
        .eq('id', inviteId)
        .eq('account_id', membership.account_id)
        .single()

      if (inviteError || !invitation) {
        return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
      }

      // Only allow deletion of pending or expired invitations
      // For accepted invitations, user should use the regular member removal
      if (invitation.status === 'accepted') {
        return NextResponse.json({ 
          error: 'Cannot cancel an accepted invitation. Please remove the user from team members instead.' 
        }, { status: 400 })
      }

      if (!['pending', 'expired'].includes(invitation.status)) {
        return NextResponse.json({ 
          error: `Cannot cancel ${invitation.status} invitations` 
        }, { status: 400 })
      }

      // Check if this invitation has an associated user who accepted it
      // (for cases where user signed up but hasn't logged in yet)
      let deletedClerkId: string | null = null
      if (invitation.accepted_by) {
        // Check if this user has ANY active memberships
        const { count: membershipCount } = await supabaseService
          .from('account_users')
          .select('id', { count: 'exact', head: true })
          .eq('clerk_id', invitation.accepted_by)
          .eq('is_active', true)

        // If user has no active memberships (pending invited user), delete completely
        if (membershipCount === 0) {
          deletedClerkId = invitation.accepted_by
          
          // Get user email before deletion
          const { data: userProfile } = await supabaseService
            .from('profiles')
            .select('email')
            .eq('clerk_id', deletedClerkId)
            .single()
          
          // Clean up ALL team_invitations for this user
          await supabaseService
            .from('team_invitations')
            .update({ accepted_by: null, invited_by: null })
            .or(`accepted_by.eq.${deletedClerkId},invited_by.eq.${deletedClerkId}`)
          
          // Delete invitations sent TO this email
          if (userProfile?.email) {
            await supabaseService
              .from('team_invitations')
              .delete()
              .eq('email', userProfile.email)
          }

          // For Clerk, user deletion should be handled via Clerk API
          // Just delete the profile from our database
          await supabaseService.from('profiles').delete().eq('clerk_id', deletedClerkId)
          console.log('✅ Deleted profile for clerk_id:', deletedClerkId)
        }
      }

      // Delete the invitation record
      const { error: deleteError } = await supabaseService
        .from('team_invitations')
        .delete()
        .eq('id', inviteId)

      if (deleteError) {
        console.error('Error deleting invitation:', deleteError)
        return NextResponse.json({ error: 'Failed to delete invitation' }, { status: 500 })
      }

      // Log the action
      await supabase.rpc('log_account_action', {
        p_account_id: membership.account_id,
        p_clerk_id: currentUser.clerkUserId,
        p_action: deletedClerkId ? 'invitation_and_user_deleted' : 'invitation_deleted',
        p_resource_type: 'invitation',
        p_resource_id: inviteId,
        p_old_values: { status: invitation.status, email: invitation.email, had_user: !!deletedClerkId },
        p_new_values: { deleted: true, user_deleted: !!deletedClerkId }
      })

      return NextResponse.json({
        success: true,
        data: { 
          message: deletedClerkId 
            ? 'Invitation and associated user deleted successfully' 
            : 'Invitation deleted successfully'
        }
      })
    }

    // Prevent self-removal if owner
    if (clerkId === currentUser.clerkUserId && membership.role === 'owner') {
      return NextResponse.json({ 
        error: 'Owner cannot remove themselves' 
      }, { status: 403 })
    }

    // Get target member info
    const { data: targetMember, error: targetError } = await supabase
      .from('account_users')
      .select('id, role, clerk_id')
      .eq('account_id', membership.account_id)
      .eq('clerk_id', clerkId)
      .single()

    if (targetError || !targetMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    // Check if the user is a member of other organizations
    const { count: membershipCount, error: countError } = await supabase
      .from('account_users')
      .select('id', { count: 'exact', head: true })
      .eq('clerk_id', clerkId)
      .eq('is_active', true)

    if (countError) {
      console.error('Error checking membership count:', countError)
    }

    // If user is only in this organization, perform a full cascading delete
    // This handles the requirement: "When user is deleting an invited users, delete their profile, account_user, and uses records."
    if (membershipCount !== null && membershipCount <= 1) {
      const supabaseService = createServiceClient()
      
      // 1. Clean up team_invitations (nullify or delete foreign key references)
      await supabaseService
        .from('team_invitations')
        .update({ accepted_by: null, invited_by: null })
        .or(`accepted_by.eq.${clerkId},invited_by.eq.${clerkId}`)
      
      // 2. Delete any invitations TO this user's email
      const { data: userProfile } = await supabaseService
        .from('profiles')
        .select('email')
        .eq('clerk_id', clerkId)
        .single()
      
      if (userProfile?.email) {
        await supabaseService
          .from('team_invitations')
          .delete()
          .eq('email', userProfile.email)
      }
      
      // 3. For Clerk users, deletion from Clerk should be handled via Clerk API
      // Just delete the profile from our database
      await supabaseService.from('profiles').delete().eq('clerk_id', clerkId)
      
      // 4. Log the action
      await supabase.rpc('log_account_action', {
        p_account_id: membership.account_id,
        p_clerk_id: currentUser.clerkUserId,
        p_action: 'member_deleted_fully',
        p_resource_type: 'user',
        p_resource_id: clerkId,
        p_old_values: { role: targetMember.role, email: userProfile?.email || 'deleted' }
      })

      return NextResponse.json({
        success: true,
        data: { message: 'User and all associated records deleted successfully' }
      })
    }

    // If user is in multiple organizations, or auth delete failed, just remove from this organization
    // Remove the member (soft delete by setting is_active to false)
    const { error: removeError } = await supabase
      .from('account_users')
      .delete() // Changed to hard delete from account_users as per "delete their ... account_user" request
      .eq('id', targetMember.id)

    if (removeError) {
      console.error('Error removing team member:', removeError)
      return NextResponse.json({ error: 'Failed to remove team member' }, { status: 500 })
    }

    // Log the action for audit trail
    await supabase.rpc('log_account_action', {
      p_account_id: membership.account_id,
      p_clerk_id: currentUser.clerkUserId,
      p_action: 'member_removed',
      p_resource_type: 'member',
      p_resource_id: targetMember.id,
      p_old_values: { role: targetMember.role, is_active: true },
      p_new_values: { is_active: false }
    })

    // Create notification for the removed member (if they still exist)
    if (clerkId !== currentUser.clerkUserId) {
      await supabase.rpc('create_user_notification', {
        p_clerk_id: clerkId,
        p_account_id: membership.account_id,
        p_type: 'personal',
        p_title: 'Removed from Organization',
        p_message: 'You have been removed from the organization.'
      })
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Team member removed successfully' }
    })

  } catch (error) {
    console.error('Error in team DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}