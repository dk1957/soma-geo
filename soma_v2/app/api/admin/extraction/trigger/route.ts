import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { AEOExtractorService } from '@/lib/services/aeo-extractor'

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const body = await request.json().catch(() => ({}))
    const limit = body.limit || 100
    const useAIAgents = body.use_ai_agents === true

    const extractor = new AEOExtractorService(undefined, useAIAgents)
    const result = await extractor.processPendingResponses(limit)

    return NextResponse.json({
      success: true,
      mode: useAIAgents ? 'ai-agents' : 'rule-based',
      ...result,
    })
  } catch (error) {
    console.error('[API] Extraction trigger error:', error)
    return NextResponse.json({
      error: 'Extraction failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
