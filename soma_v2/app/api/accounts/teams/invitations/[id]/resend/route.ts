import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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
      .select(`
        *,
        accounts!inner(name, type),
        invited_by_user:users!team_invitations_invited_by_fkey(
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', invitationId)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Check if invitation is still valid
    if (invitation.status !== 'pending' || new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation is no longer valid' }, { status: 400 })
    }

    // Check if current user has permission to resend invitations
    const { data: currentUserMember } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', invitation.account_id)
      .eq('clerk_id', user.clerkUserId)
      .single()

    if (!currentUserMember || !['owner', 'admin'].includes(currentUserMember.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Resend the invitation email
    const inviterName = `${invitation.invited_by_user?.first_name || ''} ${invitation.invited_by_user?.last_name || ''}`.trim() 
      || invitation.invited_by_user?.email || 'Someone'

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.token}`

    const emailHtml = `
      <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="text-align: center; padding: 40px 0;">
          <h1 style="color: #333; margin-bottom: 30px;">You're invited to join ${invitation.accounts.name}</h1>
          
          <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
            ${inviterName} has invited you to join their team on Soma as a <strong>${invitation.role}</strong>.
          </p>
          
          ${invitation.message ? `
            <div style="background: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 30px 0; text-align: left;">
              <p style="margin: 0; font-style: italic; color: #333;">"${invitation.message}"</p>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${inviteUrl}" 
               style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          
          <p style="font-size: 14px; color: #999; margin-top: 30px;">
            This invitation expires on ${new Date(invitation.expires_at).toLocaleDateString()}.
            <br>
            If you don't want to accept this invitation, you can safely ignore this email.
          </p>
        </div>
      </div>
    `

    await resend.emails.send({
      from: 'Soma Team <noreply@soma.ai>',
      to: invitation.email,
      subject: `Invitation to join ${invitation.accounts.name} on Soma`,
      html: emailHtml,
    })

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