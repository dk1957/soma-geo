import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { z } from 'zod'

// Validation schemas
const TokenCreateSchema = z.object({
  name: z.string().min(1, 'Token name is required'),
  permissions: z.array(z.string()).default(['api_read']),
  expires_in_days: z.number().min(1).max(365).default(365)
})

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Check if user has permission to view tokens (owner or admin)
    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get API tokens for the organization
    const { data: tokens, error: tokensError } = await supabase
      .from('account_api_tokens')
      .select(`
        id,
        name,
        prefix,
        permissions,
        last_used_at,
        expires_at,
        is_active,
        created_by,
        created_at
      `)
      .eq('account_id', membership.account_id)
      .order('created_at', { ascending: false })

    if (tokensError) {
      console.error('Error fetching API tokens:', tokensError)
      return NextResponse.json({ error: 'Failed to fetch API tokens' }, { status: 500 })
    }

    // Transform the data for the frontend
    const formattedTokens = tokens?.map(token => ({
      id: token.id,
      name: token.name,
      prefix: token.prefix,
      permissions: token.permissions,
      usage: {
        lastUsedAt: token.last_used_at,
      },
      expiresAt: token.expires_at,
      isActive: token.is_active,
      createdBy: token.created_by,
      createdAt: token.created_at
    })) || []

    return NextResponse.json({
      success: true,
      data: formattedTokens
    })

  } catch (error) {
    console.error('Error fetching API tokens:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const validation = TokenCreateSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: validation.error.issues 
      }, { status: 400 })
    }

    const { name, permissions, expires_in_days } = validation.data
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

    // Check if user has permission to create tokens (owner or admin)
    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Generate a secure API token
    const tokenValue = `soma_${generateRandomString(32)}`
    const tokenHash = await hashToken(tokenValue)
    const tokenPrefix = `${tokenValue.substring(0, 12)}...`

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expires_in_days)

    // Create the API token in database
    const { data: token, error: tokenError } = await supabase
      .from('account_api_tokens')
      .insert({
        account_id: membership.account_id,
        name: name,
        token_hash: tokenHash,
        prefix: tokenPrefix,
        permissions: permissions,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        created_by: currentUser.clerkUserId
      })
      .select()
      .single()

    if (tokenError) {
      console.error('Error creating API token:', tokenError)
      return NextResponse.json({ error: 'Failed to create API token' }, { status: 500 })
    }

      // Log the action for audit trail
      await supabase.rpc('log_account_action', {
        p_account_id: membership.account_id,
        p_clerk_id: currentUser.clerkUserId,
        p_action: 'api_token_created',
        p_resource_type: 'integration',
        p_resource_id: token.id,
        p_new_values: { 
          token_name: name, 
          permissions: permissions,
          expires_at: expiresAt.toISOString()
        }
      })    // Create notification
    await supabase.rpc('create_user_notification', {
      p_clerk_id: currentUser.clerkUserId,
      p_account_id: membership.account_id,
      p_type: 'personal',
      p_title: 'API Token Created',
      p_message: `API token "${name}" has been created successfully.`
    })

      return NextResponse.json({
        success: true,
        data: {
          id: token.id,
          name: token.name,
          token: tokenValue, // Only returned once during creation
          prefix: token.prefix,
          permissions: token.permissions,
          expiresAt: token.expires_at,
          createdAt: token.created_at
        }
      })  } catch (error) {
    console.error('Error creating API token:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tokenId from URL params
    const url = new URL(request.url)
    const tokenId = url.searchParams.get('tokenId')

    if (!tokenId) {
      return NextResponse.json({ error: 'Token ID required' }, { status: 400 })
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

    // Check if user has permission to delete tokens (owner or admin)
    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get token info for audit trail
    const { data: targetToken, error: tokenError } = await supabase
      .from('account_api_tokens')
      .select('id, name, account_id, created_by')
      .eq('id', tokenId)
      .eq('account_id', membership.account_id)
      .single()

    if (tokenError || !targetToken) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }

    // Deactivate the token (soft delete)
    const { error: deleteError } = await supabase
      .from('account_api_tokens')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenId)

    if (deleteError) {
      console.error('Error deleting API token:', deleteError)
      return NextResponse.json({ error: 'Failed to delete API token' }, { status: 500 })
    }

    // Log the action for audit trail
    await supabase.rpc('log_account_action', {
      p_account_id: membership.account_id,
      p_clerk_id: currentUser.clerkUserId,
      p_action: 'api_token_deleted',
      p_resource_type: 'integration',
      p_resource_id: targetToken.id,
      p_old_values: { token_name: targetToken.name, is_active: true },
      p_new_values: { is_active: false }
    })

    // Create notification
    await supabase.rpc('create_user_notification', {
      p_clerk_id: currentUser.clerkUserId,
      p_account_id: membership.account_id,
      p_type: 'personal',
      p_title: 'API Token Revoked',
      p_message: `API token "${targetToken.name}" has been revoked.`
    })

    return NextResponse.json({
      success: true,
      data: { message: 'API token revoked successfully' }
    })

  } catch (error) {
    console.error('Error deleting API token:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper functions
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return result
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}