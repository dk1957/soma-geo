/**
 * GSC OAuth Callback Handler
 * 
 * Handles the OAuth callback from Google after user authorization.
 * Supports both legacy integration flow and new discoverability feature.
 */

import { google } from 'googleapis'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'

// Google OAuth constants
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const stateParam = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  // Determine the redirect URI based on the request origin
  // This must match exactly what was sent in the initial OAuth request
  const redirectUri = `${url.origin}/api/integrations/gsc/callback`

  // Handle OAuth errors
  if (error) {
    console.error('GSC OAuth error:', error)
    const redirectUrl = new URL('/dashboard/search-console', request.url)
    redirectUrl.searchParams.set('error', error)
    return NextResponse.redirect(redirectUrl)
  }

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  }

  // Parse state to determine flow type
  let state: { brandId?: string; customState?: string } = {}
  if (stateParam) {
    try {
      state = JSON.parse(stateParam)
    } catch (e) {
      console.error('Failed to parse state:', e)
    }
  }

  // Exchange code for tokens using direct fetch (more reliable)
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('Missing Google OAuth credentials')
    const redirectUrl = new URL('/dashboard/search-console', request.url)
    redirectUrl.searchParams.set('error', 'OAuth configuration error')
    return NextResponse.redirect(redirectUrl)
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Token exchange error:', errorData)
      throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error}`)
    }

    const tokens = await tokenResponse.json()
    const { access_token, refresh_token, expires_in, scope } = tokens

    if (!access_token) {
      throw new Error('No access token received')
    }

    // Get user email
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    })
    const userInfo = await userInfoResponse.json()
    const email = userInfo.email

    // If this is a brand-specific flow (new discoverability feature)
    if (state.brandId) {
      const supabase = createServiceClient()

      // List available sites
      const sitesResponse = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
        headers: { Authorization: `Bearer ${access_token}` }
      })
      const sitesData = await sitesResponse.json()
      const sites = sitesData.siteEntry || []

      // Auto-select only when there is exactly one site.
      // When multiple properties exist, keep selection pending so the user can choose.
      const selectedSite = sites.length === 1 && sites[0]?.siteUrl ? sites[0].siteUrl : 'pending_selection'

      // Calculate expiry timestamp
      const expiresAt = new Date(Date.now() + (expires_in * 1000)).toISOString()

      // Delete any existing connection for this brand first (allows clean re-connect)
      await supabase
        .from('gsc_connections')
        .delete()
        .eq('brand_id', state.brandId)

      // Insert new connection
      const { error: saveError } = await supabase
        .from('gsc_connections')
        .insert({
          brand_id: state.brandId,
          site_url: selectedSite,
          access_token,
          refresh_token,
          token_expires_at: expiresAt,
          is_active: true,
          last_sync_status: 'success',
          scopes: scope?.split(' ') || [],
          auto_sync_enabled: true
        })

      if (saveError) {
        console.error('Error saving GSC connection:', saveError)
        throw new Error('Failed to save connection')
      }

      // Redirect to search console page
      const redirectUrl = new URL('/dashboard/search-console', request.url)
      redirectUrl.searchParams.set('brand', state.brandId)
      redirectUrl.searchParams.set('success', 'connected')
      
      if (sites.length > 1) {
        redirectUrl.searchParams.set('select_site', 'true')
      }
      
      return NextResponse.redirect(redirectUrl)
    }

    // Legacy integration flow (no brandId in state)
    // For legacy, we still need to associate with a brand
    // Get the user's first brand and save connection there
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.redirect(new URL('/signin', request.url))
    }

    const supabase = createServiceClient()

    // Find user's account and first brand
    const { data: accountMember } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('is_active', true)
      .single()

    if (!accountMember) {
      throw new Error('No account found for user')
    }

    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('account_id', accountMember.account_id)
      .limit(1)
      .single()

    if (!brand) {
      throw new Error('No brand found for account')
    }

    // Calculate expiry timestamp
    const expiresAt = new Date(Date.now() + (expires_in * 1000)).toISOString()

    // Delete any existing connection for this brand first (allows clean re-connect)
    await supabase
      .from('gsc_connections')
      .delete()
      .eq('brand_id', brand.id)

    // Insert new connection
    const { error: saveError } = await supabase
      .from('gsc_connections')
      .insert({
        brand_id: brand.id,
        site_url: 'pending_selection',
        access_token,
        refresh_token,
        token_expires_at: expiresAt,
        is_active: true,
        last_sync_status: 'success',
        scopes: scope?.split(' ') || [],
        auto_sync_enabled: true
      })

    if (saveError) {
      console.error('Error saving GSC connection:', saveError)
      throw new Error('Failed to save integration details.')
    }

    // Redirect to the settings page with a success message
    const redirectUrl = new URL('/dashboard/settings/integrations', request.url)
    redirectUrl.searchParams.set('success', 'true')
    return NextResponse.redirect(redirectUrl)

  } catch (err) {
    console.error('Error during GSC OAuth callback:', err)
    
    // Determine where to redirect based on flow type
    const errorRedirectPath = state.brandId 
      ? '/dashboard/search-console' 
      : '/dashboard/settings/integrations'
    
    const redirectUrl = new URL(errorRedirectPath, request.url)
    redirectUrl.searchParams.set('error', 'Failed to connect to Google Search Console')
    
    if (state.brandId) {
      redirectUrl.searchParams.set('brand', state.brandId)
    }
    
    return NextResponse.redirect(redirectUrl)
  }
}
