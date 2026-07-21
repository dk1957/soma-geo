import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'

export const dynamic = 'force-dynamic'

// Stubbed — brand_sources table dropped, will be redesigned
export async function GET(request: Request) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  return NextResponse.json({
    success: true,
    sources: [],
    pagination: { total: 0, limit: 100, offset: 0, hasMore: false },
    summary: {
      total_citations: 0,
      unique_domains: 0,
      authoritative_sources: 0,
      type_breakdown: {},
      all_topics: [],
      all_geographies: []
    }
  })
}
