import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createInviteLinkSchema = z.object({
  account_id: z.string().uuid('Valid account ID is required'),
  role: z.enum(['admin', 'account_manager', 'member', 'viewer']).default('member'),
  workspace_ids: z.array(z.string().uuid()).optional(),
  brand_ids: z.array(z.string().uuid()).optional(),
  max_uses: z.number().int().positive().optional(),
  expires_in_days: z.number().int().min(1).max(30).default(7),
})

// GET: List invite links for an account
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const account_id = searchParams.get('account_id')
    
    if (!account_id) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
    }

    const user = await getCurrentUser()
    const supabase = createServiceClient()
    
    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user has permission to view invite links
    const { data: accountAccess, error: accessError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', account_id)
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)
      .single()

    if (accessError || !accountAccess) {
      return NextResponse.json({ error: 'Access denied to this account' }, { status: 403 })
    }

    if (!['owner', 'admin', 'account_manager'].includes(accountAccess.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to view invite links' }, { status: 403 })
    }

    // Get invite links
    const { data: inviteLinks, error: linksError } = await supabase
      .from('invite_links')
      .select(`
        id,
        token,
        role,
        max_uses,
        current_uses,
        expires_at,
        is_active,
        created_at,
        profiles:created_by (
          full_name,
          email
        )
      `)
      .eq('account_id', account_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (linksError) {
      console.error('Error fetching invite links:', linksError)
      return NextResponse.json({ error: 'Failed to fetch invite links' }, { status: 500 })
    }

    // Format response with usage stats
    const formattedLinks = inviteLinks.map(link => ({
      id: link.id,
      token: link.token,
      role: link.role,
      max_uses: link.max_uses,
      current_uses: link.current_uses,
      expires_at: link.expires_at,
      is_expired: new Date(link.expires_at) < new Date(),
      created_by: (link.profiles as any)?.full_name || (link.profiles as any)?.email,
      created_at: link.created_at,
      invite_url: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${link.token}`
    }))

    return NextResponse.json({
      success: true,
      data: formattedLinks
    })

  } catch (error) {
    console.error('Get invite links error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create new invite link
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = createInviteLinkSchema.parse(body)
    
    const user = await getCurrentUser()
    const supabase = createServiceClient()
    
    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user has permission to create invite links
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

    if (!['owner', 'admin', 'account_manager'].includes(accountAccess.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to create invite links' }, { status: 403 })
    }

    // Generate unique token
    const token = generateInviteToken()
    const expiresAt = new Date(Date.now() + validatedData.expires_in_days * 24 * 60 * 60 * 1000)

    // Create invite link
    const { data: inviteLink, error: createError } = await supabase
      .from('invite_links')
      .insert({
        account_id: validatedData.account_id,
        created_by: user.clerkUserId,
        token,
        role: validatedData.role,
        workspace_ids: validatedData.workspace_ids || [],
        brand_ids: validatedData.brand_ids || [],
        max_uses: validatedData.max_uses,
        expires_at: expiresAt.toISOString(),
        is_active: true
      })
      .select('id, token, role, max_uses, expires_at')
      .single()

    if (createError) {
      console.error('Error creating invite link:', createError)
      return NextResponse.json({ error: 'Failed to create invite link' }, { status: 500 })
    }

    // Log the activity
    await supabase.rpc('log_team_activity', {
      account_uuid: validatedData.account_id,
      actor_uuid: user.clerkUserId,
      activity_action: 'invite_link_created',
      resource_type_param: 'invite_link',
      resource_uuid: inviteLink.id,
      new_data_param: {
        role: validatedData.role,
        max_uses: validatedData.max_uses,
        expires_at: expiresAt.toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Invite link created successfully',
      data: {
        id: inviteLink.id,
        token: inviteLink.token,
        role: inviteLink.role,
        max_uses: inviteLink.max_uses,
        expires_at: inviteLink.expires_at,
        invite_url: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${inviteLink.token}`
      }
    })

  } catch (error) {
    console.error('Create invite link error:', error)
    
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
  return Array.from({ length: 24 }, () => 
    Math.floor(Math.random() * 36).toString(36)
  ).join('')
}