import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthMethods, logEnvironment } from '@/lib/utils/auth-environment'

/**
 * @deprecated This route uses Supabase OAuth which has been replaced by Clerk.
 * Clerk handles OAuth (Google, etc.) natively through its SignIn/SignUp components.
 * This route is kept for backwards compatibility but should not be used.
 */
export async function POST(request: NextRequest) {
  console.warn('DEPRECATED: /api/auth/oauth uses Supabase OAuth. Use Clerk OAuth instead.')
  
  try {
    const { provider } = await request.json()
    const authConfig = getAuthMethods()
    
    // Log environment on first auth request
    logEnvironment()

    if (!provider || provider !== 'google') {
      return NextResponse.json(
        { error: 'Only Google OAuth is supported' }, 
        { status: 400 }
      )
    }

    if (!authConfig.allowGoogleOAuth) {
      return NextResponse.json(
        { error: 'Google OAuth is only available in production. Please use email and password in development.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${authConfig.siteUrl}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      },
    })

    if (error) {
      console.error('OAuth generation error:', error)
      return NextResponse.json(
        { error: error.message }, 
        { status: 400 }
      )
    }

    if (!data.url) {
      return NextResponse.json(
        { error: 'Failed to generate OAuth URL' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      url: data.url,
      provider: 'google'
    })
  } catch (error) {
    console.error('OAuth route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}