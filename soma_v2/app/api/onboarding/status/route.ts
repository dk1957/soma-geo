import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

// POST - Update onboarding status (uses service role to bypass RLS)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, status, step, metadata } = body

    const supabase = createServiceClient()

    // Handle different actions
    if (action === 'complete') {
      const completionMetadata = {
        completed_at: new Date().toISOString(),
        completed_via: metadata?.completed_via || 'application_flow',
        ...metadata
      }

      const { data: result, error } = await supabase.rpc('complete_user_onboarding', {
        clerk_user_id: userId,
        completion_metadata: completionMetadata
      })

      if (error) {
        console.error('Error in atomic onboarding completion:', error)
        // Fall through to direct update
      } else {
        // Fetch updated profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('clerk_id', userId)
          .maybeSingle()

        return NextResponse.json({ success: true, data: profile })
      }
    }

    // Default: update via RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('update_onboarding_status', {
      p_clerk_id: userId,
      p_status: status,
      p_step: step,
      p_metadata: metadata
    })

    if (!rpcError && rpcData && !(rpcData.error === true)) {
      return NextResponse.json({ success: true, data: rpcData })
    }

    // Fallback: direct update with service role (not upsert — profile must already exist)
    const completedAt = new Date().toISOString()
    const updatePayload: Record<string, any> = {
      onboarding_status: status,
      onboarding_step: step,
      onboarding_metadata: metadata,
      updated_at: completedAt,
    }
    if (status === 'completed') {
      updatePayload.onboarding_completed_at = completedAt
    }
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('clerk_id', userId)
      .select()
      .single()

    if (fallbackError) {
      console.error('Onboarding status update failed:', fallbackError)
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: fallbackData })
  } catch (error) {
    console.error('Error in POST /api/onboarding/status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Fetch onboarding state (uses service role to bypass RLS)
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching onboarding state:', error)
      return NextResponse.json({ error: 'Failed to fetch state' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    console.error('Error in GET /api/onboarding/status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
