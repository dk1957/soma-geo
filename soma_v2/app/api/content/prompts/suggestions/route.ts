import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { generatePrompts } from '@/lib/services/prompt-generation-service'

/**
 * Prompt Suggestions API
 * ======================
 * Manages AI-generated prompt suggestions.
 * Generation logic delegated to the unified PromptGenerationService.
 * This route handles CRUD for the suggested_prompts table.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brand_id')
    const topicId = searchParams.get('topic_id')
    const status = searchParams.get('status') || 'pending'
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!brandId) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 })
    }

    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Verify user has access
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('account_id, name, industry, brand_category, target_markets')
      .eq('id', brandId)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const { data: hasAccess } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('account_id', brand.account_id)
      .eq('is_active', true)
      .single()

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Build query
    let query = supabase
      .from('suggested_prompts')
      .select('*, topic:prompt_topics(id, name, color, icon)')
      .eq('brand_id', brandId)
      .eq('status', status)
      .order('confidence_score', { ascending: false })
      .limit(limit)

    if (topicId) {
      query = query.eq('topic_id', topicId)
    }

    const { data: suggestions, error: suggestionsError } = await query

    if (suggestionsError) {
      console.error('Error fetching suggestions:', suggestionsError)
      return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      suggestions: suggestions || [],
      brand_context: {
        name: brand.name,
        industry: brand.industry || brand.brand_category,
        markets: brand.target_markets || []
      }
    })

  } catch (error) {
    console.error('Suggestions API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const body = await request.json()
    const { brand_id, topic_id } = body

    // Load admin-configured suggestion count from generation settings
    let configuredCount = 10 // safe default
    try {
      const supabase2 = createServiceClient()
      const { data: genConfig } = await supabase2
        .from('system_configurations')
        .select('value')
        .eq('key', 'prompt_generation_settings')
        .eq('is_active', true)
        .single()
      if (genConfig?.value?.suggestion_prompt_count) {
        configuredCount = genConfig.value.suggestion_prompt_count
      }
    } catch { /* use default */ }
    // Request body count overrides admin config if explicitly provided
    const count = body.count ?? configuredCount

    if (!brand_id) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 })
    }

    // Get brand context
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select(`
        *,
        account:accounts(name)
      `)
      .eq('id', brand_id)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const { data: hasAccess } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('account_id', brand.account_id)
      .eq('is_active', true)
      .single()

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get existing prompts to avoid duplicates
    const { data: existingPrompts } = await supabase
      .from('user_prompts')
      .select('prompt_text')
      .eq('brand_id', brand_id)
      .limit(100)

    const existingTexts = new Set((existingPrompts || []).map(p => p.prompt_text.toLowerCase()))

    // Get ALL topics for this brand to use as context
    const { data: allTopics } = await supabase
      .from('prompt_topics')
      .select('id, name, description')
      .eq('brand_id', brand_id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    // Build topic context
    let topicKeywords: string[] = []
    if (topic_id) {
      const specificTopic = allTopics?.find(t => t.id === topic_id)
      if (specificTopic) {
        topicKeywords = [specificTopic.name, specificTopic.description || ''].filter(Boolean)
      }
    } else if (allTopics && allTopics.length > 0) {
      topicKeywords = allTopics.map(t => t.name)
    }

    // Get countries for geography mapping
    const { data: countries } = await supabase
      .from('countries')
      .select('id, name, code')
      .eq('is_active', true)

    const countryMap = new Map((countries || []).map(c => [c.name.toLowerCase(), c.id]))

    // --- Use the unified PromptGenerationService ---
    const result = await generatePrompts({
      brandName: brand.name,
      brandCategory: brand.brand_category || brand.industry || '',
      productsServices: brand.products_services || '',
      targetMarkets: brand.target_markets || ['Global'],
      competitors: brand.known_competitors || [],
      brandWebsite: brand.website || '',
      brandDescription: brand.description || '',
      brandKeywords: brand.brand_topics || [],
      targetAudience: brand.target_audience || '',
      topics: topicKeywords,
      maxPrompts: count,
    })

    // Filter out duplicates against existing prompts
    const newPrompts = result.prompts.filter(p => !existingTexts.has(p.text.toLowerCase()))

    // Store suggestions
    const suggestionsToInsert = newPrompts.slice(0, count).map(p => {
      const countryId = p.market ? (countryMap.get(p.market.toLowerCase()) || null) : null
      return {
        brand_id,
        account_id: brand.account_id,
        topic_id: topic_id || null,
        prompt_text: p.text,
        prompt_type: p.category,
        intent: p.category,
        context: p.rationale,
        generation_source: 'ai_engine',
        generation_metadata: {
          model: result.model || 'fallback',
          target_market: p.market || 'Global',
        },
        confidence_score: p.confidence || 0.85,
      }
    })

    const { data: insertedSuggestions, error: insertError } = await supabase
      .from('suggested_prompts')
      .upsert(suggestionsToInsert, { onConflict: 'brand_id,prompt_text', ignoreDuplicates: true })
      .select()

    if (insertError) {
      console.error('Error storing suggestions:', insertError)
      return NextResponse.json({
        success: true,
        suggestions: suggestionsToInsert.map((s, i) => ({ ...s, id: `temp_${i}` })),
        stored: false,
      })
    }

    return NextResponse.json({
      success: true,
      suggestions: insertedSuggestions || [],
      stored: true,
    })
  } catch (error) {
    console.error('Suggestion generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Accept or reject a suggestion
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const body = await request.json()
    const { suggestion_id, action, topic_id, locale_id } = body

    if (!suggestion_id || !action) {
      return NextResponse.json({ error: 'Suggestion ID and action are required' }, { status: 400 })
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action must be accept or reject' }, { status: 400 })
    }

    // Get suggestion and verify access
    const { data: suggestion, error: suggestionError } = await supabase
      .from('suggested_prompts')
      .select('*, account_id')
      .eq('id', suggestion_id)
      .single()

    if (suggestionError || !suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 })
    }

    const { data: hasAccess } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('account_id', suggestion.account_id)
      .eq('is_active', true)
      .single()

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (action === 'accept') {
      // Use the database function to accept
      const { data: newPromptId, error: acceptError } = await supabase.rpc('accept_prompt_suggestion', {
        p_suggestion_id: suggestion_id,
        p_topic_id: topic_id || null,
        p_locale_id: locale_id || null
      })

      if (acceptError) {
        console.error('Error accepting suggestion:', acceptError)
        return NextResponse.json({ error: 'Failed to accept suggestion' }, { status: 500 })
      }

      // Get the created prompt
      const { data: newPrompt } = await supabase
        .from('user_prompts')
        .select('*')
        .eq('id', newPromptId)
        .single()

      return NextResponse.json({
        success: true,
        action: 'accepted',
        prompt: newPrompt
      })

    } else {
      // Reject the suggestion - completely delete it
      const { error: deleteError } = await supabase
        .from('suggested_prompts')
        .delete()
        .eq('id', suggestion_id)

      if (deleteError) {
        console.error('Error deleting suggestion:', deleteError)
        return NextResponse.json({ error: 'Failed to reject suggestion' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        action: 'rejected'
      })
    }

  } catch (error) {
    console.error('Suggestion action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
