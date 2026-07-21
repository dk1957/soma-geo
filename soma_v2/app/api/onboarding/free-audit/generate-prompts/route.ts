import { NextRequest, NextResponse } from 'next/server'
import { generatePrompts, type PromptGenerationInput } from '@/lib/services/prompt-generation-service'
import { applyRedisRateLimit } from '@/lib/rate-limit-redis'

/**
 * POST /api/onboarding/free-audit/generate-prompts
 * DEPRECATED — thin wrapper that delegates to the unified PromptGenerationService.
 * New callers should use POST /api/content/prompts/generate with mode: 'free_audit'.
 */
export async function POST(request: NextRequest) {
  try {
    const { response: rateLimited } = await applyRedisRateLimit(
      request, 'free_audit_prompts', { maxRequests: 6, windowSeconds: 60 }
    )
    if (rateLimited) return rateLimited

    const body = await request.json()
    const {
      brandName,
      brandWebsite,
      brandDescription,
      brandCategory,
      brandKeywords = [],
      competitors = [],
      targetMarkets = [],
      selectedStates = [],
      productsServices = '',
      topics = [],
    } = body

    if (!brandName || typeof brandName !== 'string') {
      return NextResponse.json({ error: 'brandName is required' }, { status: 400 })
    }

    const input: PromptGenerationInput = {
      brandName: brandName.trim(),
      brandCategory: brandCategory || '',
      brandWebsite: brandWebsite || '',
      brandDescription: brandDescription || '',
      brandKeywords: brandKeywords,
      competitors: competitors,
      targetMarkets: targetMarkets,
      selectedStates: selectedStates,
      productsServices: productsServices || '',
      topics: topics.length ? topics : brandKeywords,
      maxPrompts: 8,
      scrapeWebsite: true,
    }

    const result = await generatePrompts(input)

    return NextResponse.json({
      success: true,
      prompts: result.prompts,
      source: result.source,
      websiteScraped: result.websiteScraped,
      searchTrendsUsed: result.searchTrendsUsed,
      searchTrendsCount: result.searchTrendsCount,
    })
  } catch (error) {
    console.error('Prompt generation error:', error)
    return NextResponse.json({ error: 'Failed to generate prompts' }, { status: 500 })
  }
}
