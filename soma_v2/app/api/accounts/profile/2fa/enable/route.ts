import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 2FA is not yet implemented - return 501 to be honest with clients
    return NextResponse.json(
      { error: 'Two-factor authentication is not yet available. This feature is coming soon.' },
      { status: 501 }
    )

  } catch (error) {
    console.error('2FA setup API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}