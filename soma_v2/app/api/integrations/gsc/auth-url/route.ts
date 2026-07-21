/**
 * GSC OAuth URL Generator
 * 
 * Generates the Google OAuth URL server-side using credentials from .env
 */

import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

const GSC_SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/webmasters',
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { brandId } = body

    if (!brandId) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 })
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) {
      console.error('GOOGLE_CLIENT_ID is not configured in .env')
      return NextResponse.json({ error: 'Google OAuth is not configured' }, { status: 500 })
    }

    // Get the origin from the request headers
    const origin = request.headers.get('origin') || process.env.APP_URL || 'http://localhost:3000'
    const redirectUri = `${origin}/api/integrations/gsc/callback`

    const state = JSON.stringify({ brandId })

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: GSC_SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      state
    })

    const authUrl = `${GOOGLE_OAUTH_URL}?${params.toString()}`

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Error generating auth URL:', error)
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 })
  }
}
