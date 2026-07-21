import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin, logAdminAction } from '@/lib/auth/admin'
import { runForBrand } from '@/lib/services/run-runner'

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard
    const { email } = guard

    const body = await request.json()
    const { brandId, options } = body

    if (!brandId) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 })
    }

    const result = await runForBrand(brandId, { ...options, skipSubscriptionCheck: true })
    return NextResponse.json(result)

  } catch (error) {
    console.error('Admin run error:', error)
    return NextResponse.json({
      error: 'Run failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
