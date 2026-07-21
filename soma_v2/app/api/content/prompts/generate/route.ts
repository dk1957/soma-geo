import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generatePrompts, type PromptGenerationInput } from '@/lib/services/prompt-generation-service'
import { applyRedisRateLimit } from '@/lib/rate-limit-redis'

/**
 * POST /api/content/prompts/generate
 * Unified prompt generation endpoint.
 *
 * Supports two modes:
 *   1. Authenticated (onboarding + dashboard) — requires Clerk user, can store to DB
 *   2. Public / free-audit — no auth, rate-limited, returns prompts only
 *
 * Body: PromptGenerationInput (brandName required, everything else optional)
 *   Optional: mode = 'free_audit' to skip auth and apply rate limiting instead.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Detect mode
    const isFreeAudit = body.mode === 'free_audit'

    // --- Auth or rate-limit ---
    let accountId: string | null = null
    let brandId: string | null = body.brandId || body.brand_id || null

    if (isFreeAudit) {
      // Public: apply rate limiting
      const { response: rateLimited } = await applyRedisRateLimit(
        request as any,
        'free_audit_prompts',
        { maxRequests: 6, windowSeconds: 60 }
      )
      if (rateLimited) return rateLimited
    } else {
      // Authenticated
      const user = await getCurrentUser()
      if (!user?.clerkUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const supabase = createServiceClient()
      const { data: accountUser } = await supabase
        .from('account_users')
        .select('account_id')
        .eq('clerk_id', user.clerkUserId)
        .eq('is_active', true)
        .single()
      accountId = accountUser?.account_id || null
    }

    // --- Normalize input ---
    // Accept both the old "brandContext" wrapper (from onboarding) and flat body
    const bc = body.brandContext || body

    const input: PromptGenerationInput = {
      brandName: (bc.brandName || '').trim(),
      brandCategory: bc.brandCategory || bc.businessCategory || bc.industry || '',
      productsServices: bc.productsServices || '',
      targetMarkets: bc.targetMarkets || bc.markets || [],
      competitors: bc.competitors || bc.knownCompetitors || [],
      brandWebsite: bc.brandWebsite || bc.website || '',
      brandDescription: bc.brandDescription || bc.description || '',
      brandKeywords: bc.brandKeywords || bc.topics || bc.brandTopics || [],
      targetAudience: bc.targetAudience || '',
      businessModel: bc.businessModel || '',
      businessType: bc.businessType || '',
      topics: bc.topics || bc.brandTopics || bc.brandKeywords || [],
      selectedStates: bc.selectedStates || [],
      maxPrompts: body.maxPrompts ? Math.min(Math.max(Number(body.maxPrompts), 1), 20) : 8,
      scrapeWebsite: isFreeAudit || !!body.scrapeWebsite,
    }

    if (!input.brandName) {
      return NextResponse.json({ error: 'brandName is required' }, { status: 400 })
    }

    // --- Generate ---
    const result = await generatePrompts(input)

    // --- Optionally store to user_prompts (authenticated, non-free-audit) ---
    // Both account_id and brand_id are NOT NULL in user_prompts table,
    // so skip insert if either is missing to avoid silent FK/constraint failures
    if (accountId && brandId && !isFreeAudit) {
      try {
        const supabase = createServiceClient()
        const promptsData = result.prompts.map(p => ({
          account_id: accountId,
          brand_id: brandId,
          prompt_text: p.text,
          category: p.category,
          priority: p.priority,
          rationale: p.rationale,
          is_selected: true,
          source: 'ai_generated',
          created_at: new Date().toISOString(),
        }))
        const { error: insertError } = await supabase.from('user_prompts').insert(promptsData)
        if (insertError) console.warn('Failed to store prompts:', insertError)
        else console.log(`✅ Stored ${promptsData.length} prompts for brand ${brandId}`)
      } catch (e) {
        console.warn('Failed to store prompts:', e)
      }
    } else if (!isFreeAudit && (!accountId || !brandId)) {
      console.warn(`⚠️ Skipping prompt storage: accountId=${accountId}, brandId=${brandId} (will be created during run)`)
    }

    // --- Return in format that both onboarding and free-audit callers expect ---
    return NextResponse.json({
      success: true,
      prompts: result.prompts,
      source: result.source,
      websiteScraped: result.websiteScraped,
      model: result.model,
      searchTrendsUsed: result.searchTrendsUsed,
      searchTrendsCount: result.searchTrendsCount,
    })
  } catch (error) {
    console.error('Prompt generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate prompts' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    const supabase = createServiceClient()

    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's account
    const { data: accountUser, error: accountError } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)
      .single()

    if (accountError || !accountUser) {
      return NextResponse.json({ error: 'No active account found' }, { status: 404 })
    }

    // Get account's previously generated prompts
    const { data: userPrompts, error } = await supabase
      .from('user_prompts')
      .select('*')
      .eq('account_id', accountUser.account_id)
      .order('priority', { ascending: true })

    if (error) {
      console.error('Error fetching user prompts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch prompts' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      prompts: userPrompts || []
    })
  } catch (error) {
    console.error('Error fetching prompts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser()
    const supabase = createServiceClient()

    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's account
    const { data: accountUser, error: accountError } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)
      .single()

    if (accountError || !accountUser) {
      return NextResponse.json({ error: 'No active account found' }, { status: 404 })
    }

    const body = await request.json()
    const { selectedPrompts } = body

    if (!Array.isArray(selectedPrompts)) {
      return NextResponse.json(
        { error: 'Selected prompts must be an array' },
        { status: 400 }
      )
    }

    // Update prompt selections
    const { error } = await supabase
      .from('user_prompts')
      .update({ is_selected: false })
      .eq('account_id', accountUser.account_id)

    if (error) {
      console.error('Error updating prompts:', error)
      return NextResponse.json(
        { error: 'Failed to update prompts' },
        { status: 500 }
      )
    }

    // Set selected prompts
    if (selectedPrompts.length > 0) {
      const { error: selectError } = await supabase
        .from('user_prompts')
        .update({ is_selected: true })
        .eq('account_id', accountUser.account_id)
        .in('id', selectedPrompts)

      if (selectError) {
        console.error('Error selecting prompts:', selectError)
        return NextResponse.json(
          { error: 'Failed to select prompts' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Prompt selections updated successfully'
    })
  } catch (error) {
    console.error('Error updating prompt selections:', error)
    return NextResponse.json(
      { error: 'Failed to update prompt selections' },
      { status: 500 }
    )
  }
}