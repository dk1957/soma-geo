import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * Prompt Management API
 * ====================
 * Handles CRUD operations for user prompts and fetches related run data
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brand_id')
    const workspaceId = searchParams.get('workspace_id')
    const includeStats = searchParams.get('include_stats') === 'true'

    if (!brandId) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 })
    }

    const user = await getCurrentUser()
    const supabase = createServiceClient()

    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First, get the account_id from the brand_id
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('account_id, name')
      .eq('id', brandId)
      .single()

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found or access denied' }, { status: 404 })
    }

    // Check if user has access to this account
    const { data: hasAccess } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('clerk_id', user.clerkUserId)
      .eq('account_id', brand.account_id)
      .eq('is_active', true)
      .single()

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to this brand' }, { status: 403 })
    }

    // Get user's prompts for this specific brand with locale information and topics
    const { data: prompts, error: promptsError } = await supabase
      .from('user_prompts')
      .select(`
        *,
        country:countries(id, code, name, flag_emoji),
        topic:prompt_topics(id, name, slug, color, icon)
      `)
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })

    if (promptsError) {
      console.error('Error fetching prompts:', promptsError)
      return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 })
    }

    // Get related run responses if requested
    let responses: any[] = []
    let metrics: {
      total_prompts: number
      branded_count: number
      discovery_count: number
      total_responses: number
      avg_response_time: number
      platforms_covered: string[]
    } = {
      total_prompts: prompts?.length || 0,
      branded_count: 0,
      discovery_count: 0,
      total_responses: 0,
      avg_response_time: 0,
      platforms_covered: []
    }

    // Fetch per-prompt metrics from daily_prompt_metrics (latest date per prompt)
    const promptIds = prompts?.map(p => p.id).filter(Boolean) || []
    const perPromptMetrics: Record<string, any> = {}

    if (promptIds.length > 0) {
      // Get latest metrics for each prompt from daily_prompt_metrics
      const { data: promptMetricsData } = await supabase
        .from('daily_prompt_metrics')
        .select('prompt_id, lvi_score, share_of_voice, visibility_rate, avg_brand_rank, avg_sentiment, citation_rate, total_responses, run_date')
        .eq('brand_id', brandId)
        .in('prompt_id', promptIds)
        .order('run_date', { ascending: false })

      if (promptMetricsData) {
        // Keep only latest date per prompt
        for (const row of promptMetricsData) {
          if (!perPromptMetrics[row.prompt_id]) {
            perPromptMetrics[row.prompt_id] = {
              lvi_score: row.lvi_score,
              share_of_voice: row.share_of_voice,
              mention_count: row.visibility_rate > 0 ? Math.round(row.total_responses * row.visibility_rate / 100) : 0,
              avg_sentiment: row.avg_sentiment,
              avg_position: row.avg_brand_rank,
              total_responses: row.total_responses,
              citation_count: row.citation_rate > 0 ? Math.round(row.total_responses * row.citation_rate / 100) : 0,
              latest_date: row.run_date,
            }
          }
        }
      }

      // Fallback: for prompts missing from daily_prompt_metrics, compute from response_data
      const promptsMissingMetrics = promptIds.filter(id => !perPromptMetrics[id])
      if (promptsMissingMetrics.length > 0) {
        // Get response_ids for prompts that lack pre-computed metrics
        const { data: responseFiles } = await supabase
          .from('llm_response_files')
          .select('id, prompt_id')
          .eq('brand_id', brandId)
          .in('prompt_id', promptsMissingMetrics)
          .eq('extraction_status', 'complete')

        if (responseFiles && responseFiles.length > 0) {
          // Group response IDs by prompt
          const responseIdsByPrompt = new Map<string, string[]>()
          for (const f of responseFiles) {
            if (!f.prompt_id) continue
            if (!responseIdsByPrompt.has(f.prompt_id)) responseIdsByPrompt.set(f.prompt_id, [])
            responseIdsByPrompt.get(f.prompt_id)!.push(f.id)
          }

          // Fetch response_data for all these responses in one query
          const allRespIds = responseFiles.map(f => f.id)
          const { data: responseData } = await supabase
            .from('response_data')
            .select('response_id, brand_id, mentioned, brand_rank, raw_sentiment, citation_count, brand_mention_count')
            .eq('brand_id', brandId)
            .in('response_id', allRespIds.slice(0, 500))

          if (responseData && responseData.length > 0) {
            // Build a response_id → prompt_id lookup
            const respToPrompt = new Map<string, string>()
            for (const f of responseFiles) {
              if (f.prompt_id) respToPrompt.set(f.id, f.prompt_id)
            }

            // Group response_data by prompt_id
            const rdByPrompt = new Map<string, typeof responseData>()
            for (const rd of responseData) {
              const pid = respToPrompt.get(rd.response_id)
              if (!pid) continue
              if (!rdByPrompt.has(pid)) rdByPrompt.set(pid, [])
              rdByPrompt.get(pid)!.push(rd)
            }

            // Compute metrics per prompt (same formulas as aggregator)
            for (const [promptId, rows] of rdByPrompt) {
              const total = rows.length
              const mentioned = rows.filter(r => r.mentioned)
              const visRate = total > 0 ? (mentioned.length / total) * 100 : 0
              const sentiments = mentioned.map(r => r.raw_sentiment).filter((s): s is number => s !== null)
              const avgSent = sentiments.length > 0 ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length : null
              const ranks = mentioned.map(r => r.brand_rank).filter((r): r is number => r !== null && r > 0)
              const avgRank = ranks.length > 0 ? ranks.reduce((a, b) => a + b, 0) / ranks.length : null
              const citedCount = mentioned.filter(r => r.citation_count > 0).length
              const citRate = mentioned.length > 0 ? (citedCount / mentioned.length) * 100 : 0

              // LVI formula
              const normRank = avgRank && avgRank > 0 ? Math.max(0, (1 - (avgRank - 1) / 9)) * 100 : 0
              const normSent = (((avgSent ?? 0) + 1) / 2) * 100
              const lvi = visRate > 0
                ? Math.max(0, Math.min(100, visRate * 0.35 + normRank * 0.30 + citRate * 0.15 + normSent * 0.20))
                : 0

              // SOV — brand mentions / total mentions for this prompt
              const brandMentions = mentioned.reduce((sum, r) => sum + r.brand_mention_count, 0)
              const totalMentions = rows.reduce((sum, r) => sum + r.brand_mention_count, 0)
              const sov = totalMentions > 0 ? (brandMentions / totalMentions) * 100 : 0

              perPromptMetrics[promptId] = {
                lvi_score: Math.round(lvi * 100) / 100,
                share_of_voice: Math.round(sov * 100) / 100,
                mention_count: mentioned.length,
                avg_sentiment: avgSent !== null ? Math.round(avgSent * 1000) / 1000 : null,
                avg_position: avgRank ? Math.round(avgRank * 100) / 100 : null,
                total_responses: total,
                citation_count: citedCount,
                latest_date: null, // No aggregated date — computed on the fly
              }
            }
          }
        }
      }
    }

    if (includeStats) {
      // Fetch run responses for this brand
      const { data: runResponses, error: responsesError } = await supabase
        .from('llm_response_files')
        .select(`
          id,
          run_id,
          prompt_text,
          response_preview,
          model_name,
          model_provider,
          success,
          response_time_ms,
          cost_estimate,
          created_at
        `)
        .eq('brand_id', brandId)
        .eq('account_id', user.clerkUserId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (!responsesError && runResponses) {
        responses = runResponses
        
        // Calculate metrics
        const totalResponseTime = responses.reduce((sum, r) => sum + (r.response_time_ms || 0), 0)
        const platforms = [...new Set(responses.map(r => r.model_provider).filter(Boolean))]
        
        metrics = {
          total_prompts: prompts?.length || 0,
          branded_count: prompts?.filter(p => p.category === 'branded').length || 0,
          discovery_count: prompts?.filter(p => p.category === 'discovery').length || 0,
          total_responses: responses.length,
          avg_response_time: responses.length > 0 ? totalResponseTime / responses.length : 0,
          platforms_covered: platforms
        }
      }
    }

    // Transform prompts to match expected interface with per-prompt metrics
    const transformedPrompts = prompts?.map(prompt => {
      const promptMetrics = perPromptMetrics[prompt.id] || {}
      return {
        ...prompt,
        classification: prompt.category as 'branded' | 'discovery',
        platforms_used: [], // This would need to be calculated from actual usage
        locale: prompt.country?.id || (prompt.geo_sub_region ? `subregion:${prompt.geo_sub_region}` : null),
        country_name: prompt.country?.name,
        country_code: prompt.country?.code,
        geo_region: prompt.geo_region,
        geo_sub_region: prompt.geo_sub_region,
        // Per-prompt metrics from brand_appearances
        lvi_score: promptMetrics.lvi_score ?? null,
        gsov_score: promptMetrics.share_of_voice ?? null,
        mentions_count: promptMetrics.mention_count ?? null,
        sentiment_score: promptMetrics.avg_sentiment ?? null,
        position: promptMetrics.avg_position ?? null,
        total_responses: promptMetrics.total_responses ?? 0,
        citation_count: promptMetrics.citation_count ?? 0,
        latest_analysis_date: promptMetrics.latest_date ?? null,
        performance_metrics: {
          usage_count: promptMetrics.total_responses || 0,
          success_rate: promptMetrics.total_responses > 0 
            ? Math.round((promptMetrics.mention_count / promptMetrics.total_responses) * 100) 
            : 0,
          avg_response_time: 0, // This would need to be calculated
          quality_score: promptMetrics.lvi_score || 0
        }
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: transformedPrompts,
      responses,
      metrics,
      brand_info: {
        id: brandId,
        name: brand.name || 'Unknown Brand'
      }
    })

  } catch (error) {
    console.error('Prompt management API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const supabase = createServiceClient()

    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: prompt creation
    const limited = applyRateLimit(request, 'prompts:create', RATE_LIMITS.write, user.clerkUserId)
    if (limited) return limited

    const body = await request.json()
    const { 
      prompt_text, 
      category = 'general', 
      priority = 1, 
      is_selected = false, 
      brand_id, 
      workspace_id,
      rationale,
      execution_status = 'draft',
      execution_metadata = {},
      locale = null,
      // Geographic targeting fields
      geo_region = null,
      geo_sub_region = null,
      // New fields for topics and enhanced prompts
      topic_id = null,
      prompt_type = 'general',
      intent = null,
      context = null,
      source = 'manual'
    } = body

    if (!prompt_text) {
      return NextResponse.json({ error: 'Prompt text is required' }, { status: 400 })
    }

    // Validate prompt length (max 200 characters as per spec)
    if (prompt_text.length > 500) {
      return NextResponse.json({ error: 'Prompt text must be 500 characters or less' }, { status: 400 })
    }

    // If brand_id is provided, get the account_id from it
    let account_id
    if (brand_id) {
      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .select('account_id')
        .eq('id', brand_id)
        .single()

      if (brandError || !brand) {
        return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
      }
      account_id = brand.account_id
    } else {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 })
    }

    // Check if user has access to this account
    const { data: hasAccess } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('clerk_id', user.clerkUserId)
      .eq('account_id', account_id)
      .eq('is_active', true)
      .single()

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to this account' }, { status: 403 })
    }

    // Verify topic belongs to the brand if provided
    if (topic_id) {
      const { data: topic, error: topicError } = await supabase
        .from('prompt_topics')
        .select('id')
        .eq('id', topic_id)
        .eq('brand_id', brand_id)
        .single()
      
      if (topicError || !topic) {
        return NextResponse.json({ error: 'Topic not found or does not belong to this brand' }, { status: 400 })
      }
    }

    // Check prompt quota before creation (if brand_id provided)
    if (brand_id) {
      const { data: quotaAllowed, error: quotaError } = await supabase.rpc('can_add_prompt', {
        p_brand_id: brand_id
      })

      if (quotaError) {
        console.error('Error checking prompt quota:', quotaError)
        return NextResponse.json({ error: 'Failed to check prompt quota' }, { status: 500 })
      }

      if (!quotaAllowed) {
        // Get quota details for error message
        const { data: quota } = await supabase
          .from('brand_quotas')
          .select('max_prompts, current_prompts_count')
          .eq('brand_id', brand_id)
          .single()
        
        // Get plan info from the brand's account subscription
        const { data: brand } = await supabase.from('brands').select('account_id').eq('id', brand_id).single()
        const { data: planInfo } = brand?.account_id
          ? await supabase.rpc('get_account_subscription_quotas', { p_account_id: brand.account_id })
          : { data: null }
        const p = planInfo?.[0]

        const maxPrompts = quota?.max_prompts || 0
        return NextResponse.json({ 
          error: `Prompt limit reached. Your plan allows ${maxPrompts} prompt${maxPrompts !== 1 ? 's' : ''} per brand. Upgrade your plan to add more prompts.`,
          quota_exceeded: true,
          max_prompts: maxPrompts,
          current_count: quota?.current_prompts_count || 0,
          plan_name: p?.plan_name || null,
          plan_tier: p?.plan_tier || null,
        }, { status: 403 })
      }
    }

    // Generate a prompt_id - temporarily disabled due to schema cache issues
    // const prompt_id = `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Parse locale value - it can be a country UUID or a sub-region identifier
    let parsedLocale = null
    let parsedGeoRegion = geo_region
    let parsedGeoSubRegion = geo_sub_region
    
    if (locale && typeof locale === 'string') {
      if (locale.startsWith('subregion:')) {
        // It's a sub-region selection like "subregion:West Africa"
        parsedGeoSubRegion = locale.replace('subregion:', '')
        parsedLocale = null // No specific country
      } else {
        // It's a country UUID
        parsedLocale = locale
      }
    }

    const { data: newPrompt, error: insertError } = await supabase
      .from('user_prompts')
      .insert({
        account_id,
        brand_id,
        prompt_text,
        category,
        priority,
        is_selected,
        rationale,
        execution_status,
        execution_metadata,
        locale: parsedLocale || null,
        geo_region: parsedGeoRegion || null,
        geo_sub_region: parsedGeoSubRegion || null,
        topic_id: topic_id || null,
        intent,
        context
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating prompt:', insertError)
      return NextResponse.json({ error: 'Failed to create prompt' }, { status: 500 })
    }

    return NextResponse.json({ success: true, prompt: newPrompt })

  } catch (error) {
    console.error('Prompt creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const supabase = createServiceClient()

    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      id, 
      prompt_text, 
      category, 
      priority, 
      is_selected, 
      rationale,
      execution_status,
      execution_metadata,
      locale,
      geo_region,
      geo_sub_region,
      topic_id,
      intent_type,
      context_details
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 })
    }

    const updateData: any = { updated_at: new Date().toISOString() }
    if (prompt_text !== undefined) updateData.prompt_text = prompt_text
    if (category !== undefined) updateData.category = category
    if (priority !== undefined) updateData.priority = priority
    if (is_selected !== undefined) updateData.is_selected = is_selected
    if (rationale !== undefined) updateData.rationale = rationale
    if (execution_status !== undefined) updateData.execution_status = execution_status
    if (execution_metadata !== undefined) updateData.execution_metadata = execution_metadata
    
    // Handle locale - can be country UUID or sub-region identifier
    if (locale !== undefined) {
      if (locale && typeof locale === 'string' && locale.startsWith('subregion:')) {
        // It's a sub-region selection
        updateData.locale = null
        updateData.geo_sub_region = locale.replace('subregion:', '')
      } else {
        updateData.locale = locale || null
      }
    }
    
    // Handle geo fields directly if provided
    if (geo_region !== undefined) updateData.geo_region = geo_region || null
    if (geo_sub_region !== undefined) updateData.geo_sub_region = geo_sub_region || null
    
    // Handle topic_id - convert empty string to null for UUID fields
    if (topic_id !== undefined) updateData.topic_id = topic_id || null
    if (intent_type !== undefined) updateData.intent_type = intent_type
    if (context_details !== undefined) updateData.context_details = context_details
    
    // Log the update data for debugging
    console.log('Prompt update data:', { id, updateData })

    // Check if user has access to this account
    const { data: hasAccess } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)
      .single()

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { data: updatedPrompt, error: updateError } = await supabase
      .from('user_prompts')
      .update(updateData)
      .eq('id', id)
      .eq('account_id', hasAccess.account_id) // Ensure user can only update prompts for their account
      .select()
      .single()

    if (updateError) {
      console.error('Error updating prompt:', updateError)
      return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 })
    }

    if (!updatedPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, prompt: updatedPrompt })

  } catch (error) {
    console.error('Prompt update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 })
    }

    const user = await getCurrentUser()
    const supabase = createServiceClient()

    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this account
    const { data: hasAccess } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)
      .single()

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { error: deleteError } = await supabase
      .from('user_prompts')
      .delete()
      .eq('id', id)
      .eq('account_id', hasAccess.account_id) // Ensure user can only delete prompts for their account

    if (deleteError) {
      console.error('Error deleting prompt:', deleteError)
      return NextResponse.json({ error: 'Failed to delete prompt' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Prompt deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}