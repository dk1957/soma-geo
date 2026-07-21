import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/run-status?brand_id=...
 *
 * Returns whether the brand has an active (running/pending) LLM run.
 * Used by the useActiveRun hook to show run-in-progress UI.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ running: false })
    }

    const brandId = request.nextUrl.searchParams.get('brand_id')
    if (!brandId) {
      return NextResponse.json({ running: false })
    }

    const supabase = createServiceClient()

    // Verify user has access to this brand's account
    const { data: brand } = await supabase
      .from('brands')
      .select('account_id')
      .eq('id', brandId)
      .single()

    if (!brand) {
      return NextResponse.json({ running: false })
    }

    const { data: access } = await supabase
      .from('account_users')
      .select('id')
      .eq('clerk_id', user.clerkUserId)
      .eq('account_id', brand.account_id)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!access) {
      return NextResponse.json({ running: false })
    }

    const { data } = await supabase
      .from('runs')
      .select('id, status')
      .eq('brand_id', brandId)
      .in('status', ['running', 'pending'])
      .order('created_at', { ascending: false })
      .limit(1)

    return NextResponse.json({ running: data !== null && data.length > 0 })
  } catch {
    return NextResponse.json({ running: false })
  }
}
