import { NextRequest, NextResponse } from 'next/server'
import { getAuthMethods } from '@/lib/utils/auth-environment'

/**
 * Auth Methods API Endpoint
 * =========================
 * 
 * Returns the available authentication methods based on the current environment.
 * This allows the frontend to conditionally show/hide auth options.
 */

export async function GET(request: NextRequest) {
  try {
    const authConfig = getAuthMethods()
    
    return NextResponse.json({
      success: true,
      environment: authConfig.isProduction ? 'production' : 'development',
      methods: {
        password: {
          enabled: authConfig.allowPasswordAuth,
          description: 'Email and password authentication (development only)'
        },
        googleOAuth: {
          enabled: authConfig.allowGoogleOAuth,
          description: 'Google OAuth authentication (production only)'
        },
        magicLink: {
          enabled: authConfig.allowMagicLink,
          description: 'Email magic link authentication (production only)'
        }
      },
      settings: {
        requireEmailVerification: authConfig.requireEmailVerification,
        siteUrl: authConfig.siteUrl
      }
    })
  } catch (error) {
    console.error('Auth methods endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}