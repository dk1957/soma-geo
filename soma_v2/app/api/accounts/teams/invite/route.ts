import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const inviteUserSchema = z.object({
  email: z.string().email('Valid email is required'),
  account_id: z.string().uuid('Valid account ID is required'),
  role: z.enum(['owner', 'admin', 'account_manager', 'member', 'viewer']).default('member'),
  workspace_ids: z.array(z.string().uuid()).optional(),
  brand_ids: z.array(z.string().uuid()).optional(),
  message: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = inviteUserSchema.parse(body)
    
    const user = await getCurrentUser()
    const supabase = createServiceClient()
    
    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if current user has permission to invite to this account
    const { data: accountAccess, error: accessError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', validatedData.account_id)
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)
      .single()

    if (accessError || !accountAccess) {
      return NextResponse.json({ error: 'Access denied to this account' }, { status: 403 })
    }

    // Check if user has sufficient permissions to invite others
    if (!['owner', 'admin', 'account_manager'].includes(accountAccess.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to invite users' }, { status: 403 })
    }

    // Get account details for the invitation
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, name, account_type')
      .eq('id', validatedData.account_id)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Get inviter details
    const { data: inviterProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('clerk_id', user.clerkUserId)
      .single()

    // Check if invitee already exists in the account
    const { data: existingMember } = await supabase
      .from('account_users')
      .select('id, role, is_active')
      .eq('account_id', validatedData.account_id)
      .eq('user_id', (
        await supabase
          .from('profiles')
          .select('user_id')
          .eq('email', validatedData.email)
          .single()
      ).data?.user_id)
      .single()

    if (existingMember?.is_active) {
      return NextResponse.json({ 
        error: 'User is already a member of this account' 
      }, { status: 400 })
    }

    // Check for existing pending invitation
    const { data: existingInvite } = await supabase
      .from('team_invitations')
      .select('id, status')
      .eq('account_id', validatedData.account_id)
      .eq('email', validatedData.email)
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      return NextResponse.json({ 
        error: 'User has already been invited to this account' 
      }, { status: 400 })
    }

    // Create team invitation
    const inviteToken = generateInviteToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .insert({
        account_id: validatedData.account_id,
        email: validatedData.email,
        role: validatedData.role,
        invited_by: user.clerkUserId,
        invite_token: inviteToken,
        workspace_ids: validatedData.workspace_ids || [],
        brand_ids: validatedData.brand_ids || [],
        message: validatedData.message,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
      .select('id, email, role, invite_token, expires_at')
      .single()

    if (inviteError) {
      console.error('Error creating invitation:', inviteError)
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }

    // Send invitation email via Resend
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${inviteToken}`
    
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@soma.app',
        to: validatedData.email,
        subject: `You're invited to join ${account.name} on Soma`,
        html: generateInvitationEmailHTML({
          invitee_email: validatedData.email,
          inviter_name: inviterProfile?.full_name || inviterProfile?.email || 'Someone',
          account_name: account.name,
          account_type: account.account_type,
          role: validatedData.role,
          invite_url: inviteUrl,
          message: validatedData.message,
          expires_at: expiresAt
        })
      })

      // Log the team activity
      await supabase.rpc('log_team_activity', {
        account_uuid: validatedData.account_id,
        actor_uuid: user.clerkUserId,
        activity_action: 'invited',
        target_email_param: validatedData.email,
        resource_type_param: 'account',
        resource_uuid: validatedData.account_id,
        new_data_param: {
          role: validatedData.role,
          invitation_id: invitation.id,
          workspace_ids: validatedData.workspace_ids,
          brand_ids: validatedData.brand_ids
        }
      })

    } catch (emailError) {
      console.error('Error sending invitation email:', emailError)
      // Don't fail the whole process if email fails
      // TODO: Add to a retry queue or notify admin
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        account_name: account.name,
        expires_at: invitation.expires_at,
        invite_url: inviteUrl
      }
    })

  } catch (error) {
    console.error('Team invitation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to generate invite token
function generateInviteToken(): string {
  return Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

// Generate professional invitation email HTML
function generateInvitationEmailHTML(params: {
  invitee_email: string
  inviter_name: string
  account_name: string
  account_type: string
  role: string
  invite_url: string
  message?: string
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
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 40px 0; border-bottom: 1px solid #eee; }
        .logo { font-size: 32px; font-weight: bold; color: #0070f3; }
        .content { padding: 40px 0; }
        .invitation-card { background: #f8f9fa; border-radius: 12px; padding: 32px; margin: 24px 0; }
        .cta-button { 
          display: inline-block; 
          background: #0070f3; 
          color: white; 
          text-decoration: none; 
          padding: 16px 32px; 
          border-radius: 8px; 
          font-weight: 600;
          margin: 24px 0;
        }
        .details { background: #fff; border: 1px solid #e1e5e9; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .footer { text-align: center; padding: 40px 0; border-top: 1px solid #eee; color: #666; font-size: 14px; }
        .expires { color: #d73a49; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Soma</div>
          <h1>You're invited to join a team!</h1>
        </div>
        
        <div class="content">
          <div class="invitation-card">
            <h2>🎉 ${params.inviter_name} invited you to join ${params.account_name}</h2>
            
            ${params.message ? `
              <div style="background: #fff; border-left: 4px solid #0070f3; padding: 16px; margin: 20px 0;">
                <strong>Personal message:</strong><br>
                "${params.message}"
              </div>
            ` : ''}
            
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
            
            <p style="text-align: center; margin-top: 20px; color: #666;">
              Or copy and paste this link in your browser:<br>
              <code style="background: #f1f3f4; padding: 4px 8px; border-radius: 4px; word-break: break-all;">${params.invite_url}</code>
            </p>
          </div>
          
          <div style="background: #e8f4fd; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0;">🚀 What is Soma?</h3>
            <p>Soma is the leading AI discoverability platform that helps brands optimize their presence across AI models like ChatGPT, Claude, Gemini, and Perplexity. Monitor citations, improve visibility, and stay ahead in the AI-first world.</p>
          </div>
        </div>
        
        <div class="footer">
          <p>This invitation was sent to ${params.invitee_email}</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          <p>© 2025 Soma. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}