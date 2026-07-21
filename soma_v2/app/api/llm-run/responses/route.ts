import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { LLMResponseStorage } from '@/lib/services/llm-response-storage'

/**
 * Parse citations from raw response text as a final fallback.
 * Handles Perplexity-style multi-line citations and bare URLs in source sections.
 */
function parseCitationsFromText(text: string): { url: string; domain: string; title: string; authority_score: number }[] {
  if (!text) return []
  const citations: { url: string; domain: string; title: string; authority_score: number }[] = []
  const seenUrls = new Set<string>()
  const lines = text.split('\n')

  let currentTitle = ''

  for (const line of lines) {
    const trimmed = line.trim()

    // Match "[N] Title..." or "⁽N⁾ Title..." at start of line
    const numberedTitle = trimmed.match(/^(?:\[(\d+)\]|⁽(\d+)⁾)\s+(.+)/)
    if (numberedTitle) {
      currentTitle = numberedTitle[3].trim()
      continue
    }

    // Match "URL: https://..." line
    const urlLine = trimmed.match(/^URL\s*:\s*(https?:\/\/[^\s]+)/i)
    if (urlLine) {
      const url = urlLine[1].replace(/[.,;:!?\]]+$/, '')
      if (!seenUrls.has(url)) {
        seenUrls.add(url)
        let domain = ''
        try { domain = new URL(url).hostname.replace('www.', '') } catch {}
        citations.push({
          url,
          domain,
          title: currentTitle || domain,
          authority_score: 0,
        })
      }
      currentTitle = ''
      continue
    }

    // Non-numbered title followed by URL line (e.g. "Remitly vs LemFi: Best money transfer...")
    if (/^[A-Z]/.test(trimmed) && trimmed.length > 15 && !trimmed.match(/^(URL|Used for|Source|Domain|Title|Reason|Additional|Sources|Citations)/i)) {
      currentTitle = trimmed
    }
  }

  return citations
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    
    // Check authentication
    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const runId = searchParams.get('run_id')
    const brandId = searchParams.get('brand_id')
    const promptId = searchParams.get('prompt_id')
    const responseId = searchParams.get('response_id')
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50') || 50, 1), 200)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0)

    // Direct single-response fetch by ID (used by chat detail page)
    if (responseId) {
      // Try file-based storage first, fall back to old table
      const { data: fileRecord, error: fileError } = await supabase
        .from('llm_response_files')
        .select('id, brand_id, prompt_text, model_name, response_preview, created_at, run_id, response_time_ms, success, cost_estimate, storage_path')
        .eq('id', responseId)
        .maybeSingle()

      if (fileRecord) {
        // Verify access via brand
        const { data: brand, error: brandError } = await supabase
          .from('brands')
          .select('id, name, account_id')
          .eq('id', fileRecord.brand_id)
          .single()
        if (brandError || !brand) {
          return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
        }
        const { data: brandAccess, error: accessError } = await supabase
          .from('account_users')
          .select('account_id')
          .eq('account_id', brand.account_id)
          .eq('clerk_id', user.clerkUserId)
          .eq('is_active', true)
          .single()
        if (accessError || !brandAccess) {
          return NextResponse.json({ error: 'Access denied to this response' }, { status: 403 })
        }

        // Download full response from Storage
        const fileStorage = new LLMResponseStorage(supabase)
        let rawResponse = fileRecord.response_preview || ''
        try {
          rawResponse = await fileStorage.downloadResponse(fileRecord.storage_path)
        } catch (downloadErr) {
          console.warn('⚠️ File download failed, using preview:', downloadErr)
        }

        // brand_sources table dropped — skip citation lookup
        let citations: Array<{url: string, domain: string, title: string, authority_score: number}> = []

        // Try aeo_citations first
        const { data: aeoCitations } = await supabase
          .from('aeo_citations')
          .select('domain, url, page_title')
          .eq('response_id', responseId)
          .limit(50)

        if (aeoCitations && aeoCitations.length > 0) {
          citations = aeoCitations.map(c => ({
            url: c.url || '',
            domain: c.domain || '',
            title: c.page_title || '',
            authority_score: 0,
          }))
        }

        // Fallback: parse citations from the raw response text (Perplexity etc.)
        if (citations.length === 0 && rawResponse) {
          citations = parseCitationsFromText(rawResponse)
        }

        // Fetch analysis data from response_data (AEO extraction results)
        const { data: responseDataRows } = await supabase
          .from('response_data')
          .select('mentioned, brand_rank, brand_mention_count, co_mentioned_brands, competitive_density, raw_sentiment, sentiment_signals, citation_count, total_response_citations, is_primary_recommendation')
          .eq('response_id', responseId)
          .eq('brand_id', fileRecord.brand_id)
          .maybeSingle()

        const analysisData = responseDataRows ? {
          brand_mentioned: responseDataRows.mentioned,
          brand_cited: (responseDataRows.citation_count || 0) > 0,
          brand_mention_count: responseDataRows.brand_mention_count || 0,
          brand_citation_count: responseDataRows.citation_count || 0,
          brand_sentiment: responseDataRows.raw_sentiment ?? 0,
          sentiment_category: (responseDataRows.raw_sentiment ?? 0) > 0.3 ? 'positive' : (responseDataRows.raw_sentiment ?? 0) < -0.3 ? 'negative' : 'neutral',
          brand_avg_position: responseDataRows.brand_rank ?? 0,
          brand_first_position: responseDataRows.brand_rank ?? 0,
          total_brands_mentioned: (responseDataRows.co_mentioned_brands || []).length + 1,
          competitors_mentioned: responseDataRows.co_mentioned_brands || [],
          share_of_voice: responseDataRows.co_mentioned_brands?.length
            ? Math.round((1 / ((responseDataRows.co_mentioned_brands.length || 0) + 1)) * 100 * 10) / 10
            : 100,
          competitive_positioning: responseDataRows.is_primary_recommendation ? 'primary_recommendation' : 'mentioned',
          response_word_count: 0,
          analysis_confidence: 1,
          topics_covered: responseDataRows.sentiment_signals || [],
        } : null

        return NextResponse.json({
          success: true,
          data: {
            id: fileRecord.id,
            brand_id: fileRecord.brand_id,
            prompt_text: fileRecord.prompt_text,
            model_name: fileRecord.model_name,
            raw_response: rawResponse,
            created_at: fileRecord.created_at,
            run_id: fileRecord.run_id,
            response_time_ms: fileRecord.response_time_ms,
            success: fileRecord.success,
            cost_estimate: fileRecord.cost_estimate,
            brand_name: brand.name,
            source: 'file_storage',
            citations,
            analysis: analysisData,
          }
        })
      }

      // Response not found in llm_response_files
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }

    // If brand_id is provided instead of run_id, get responses for that brand
    if (brandId && !runId) {
      // Get brand and account information
      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .select('account_id')
        .eq('id', brandId)
        .single()

      if (brandError || !brand) {
        return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
      }

      // Verify user has access to this brand's account
      const { data: brandAccess, error: accessError } = await supabase
        .from('account_users')
        .select('account_id')
        .eq('account_id', brand.account_id)
        .eq('clerk_id', user.clerkUserId)
        .eq('is_active', true)
        .single()

      if (accessError || !brandAccess) {
        return NextResponse.json({ error: 'Access denied to this brand' }, { status: 403 })
      }

      // Try file-based storage first for brand listing (lightweight — no full text)
      let query = supabase
        .from('llm_response_files')
        .select('id, prompt_id, prompt_text, model_name, model_provider, response_preview, created_at, run_id, response_time_ms, success, cost_estimate, word_count, storage_path')
        .eq('brand_id', brandId)
      
      // Filter by prompt_id if provided
      if (promptId) {
        query = query.eq('prompt_id', promptId)
      }
      
      const { data: fileResponses, error: fileError } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (!fileError && fileResponses && fileResponses.length > 0) {
        // Return preview-based results (no full text pulled from DB)
        const mapped = fileResponses.map(r => ({
          id: r.id,
          prompt_id: r.prompt_id,
          prompt_text: r.prompt_text,
          model_name: r.model_name,
          model_provider: r.model_provider,
          raw_response: r.response_preview || '',
          created_at: r.created_at,
          run_id: r.run_id,
          response_time_ms: r.response_time_ms,
          success: r.success,
          cost_estimate: r.cost_estimate,
          word_count: r.word_count,
          source: 'file_storage',
        }))
        return NextResponse.json({
          success: true,
          data: mapped,
          pagination: { limit, offset, has_more: mapped.length === limit }
        })
      }

      // No responses found for this brand
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { limit, offset, has_more: false }
      })
    }

    // Original run-based logic - verify user has access via account membership
    const { data: run, error: simError } = await supabase
      .from('runs')
      .select('id, profile_id, account_id, brand_id')
      .eq('id', runId)
      .single()

    if (simError || !run) {
      return NextResponse.json({ 
        error: 'Run not found' 
      }, { status: 404 })
    }

    // Verify user has access to this run's account
    const { data: accountAccess, error: accessError } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('account_id', run.account_id)
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)
      .single()

    if (accessError || !accountAccess) {
      return NextResponse.json({ 
        error: 'Access denied to this run' 
      }, { status: 403 })
    }

    // Try file-based storage first for run detail
    const { data: fileSimResponses } = await supabase
      .from('llm_response_files')
      .select('id, run_id, prompt_text, response_preview, model_name, model_provider, success, response_time_ms, cost_estimate, created_at, word_count, storage_path')
      .eq('run_id', runId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    let responses: any[] = fileSimResponses ? fileSimResponses.map(r => ({
        id: r.id,
        run_id: r.run_id,
        prompt_text: r.prompt_text,
        raw_response: r.response_preview || '',
        model_name: r.model_name,
        model_provider: r.model_provider,
        success: r.success,
        response_time_ms: r.response_time_ms,
        cost_estimate: r.cost_estimate,
        created_at: r.created_at,
        word_count: r.word_count,
        source: 'file_storage',
      })) : []

    // Group responses by model for easy analysis
    const responsesByModel: Record<string, any[]> = {}
    const responsesByPrompt: Record<string, any[]> = {}
    
    responses?.forEach(response => {
      // Group by model
      if (!responsesByModel[response.model_name]) {
        responsesByModel[response.model_name] = []
      }
      responsesByModel[response.model_name].push(response)
      
      // Group by prompt
      if (!responsesByPrompt[response.prompt_text]) {
        responsesByPrompt[response.prompt_text] = []
      }
      responsesByPrompt[response.prompt_text].push(response)
    })

    // Calculate stats using available fields
    const totalResponses = responses?.length || 0
    const successfulResponses = responses?.filter(r => r.success === true).length || 0
    const failedResponses = responses?.filter(r => r.success === false).length || 0
    const avgConfidence = totalResponses > 0 
      ? Math.round(responses.reduce((sum, r) => sum + (r.cost_estimate || 0), 0) / totalResponses)
      : 0

    return NextResponse.json({
      success: true,
      run_id: runId,
      stats: {
        total_responses: totalResponses,
        successful_responses: successfulResponses,
        failed_responses: failedResponses,
        avg_confidence: avgConfidence,
        models_tested: Object.keys(responsesByModel).length,
        prompts_tested: Object.keys(responsesByPrompt).length
      },
      responses: responses || [],
      responses_by_model: responsesByModel,
      responses_by_prompt: responsesByPrompt
    })

  } catch (error) {
    console.error('❌ Run responses API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}