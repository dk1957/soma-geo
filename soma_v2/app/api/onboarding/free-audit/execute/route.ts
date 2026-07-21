import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { LLMResponseStorage } from '@/lib/services/llm-response-storage'
import type { LLMResponse } from '@/lib/services/llm-run-orchestrator'
import { checkRateLimit } from '@/lib/rate-limit'
import { Resend } from 'resend'

/**
 * POST /api/free-audit/execute
 * Internal endpoint that runs lightweight LLM queries for a free audit.
 *
 * Uses the SAME data pipeline as the dashboard:
 *   1. Provisions a brand under the system account
 *   2. Queries LLMs via OpenRouter
 *   3. Stores responses in llm_response_files + Supabase Storage
 *   4. Runs AEO extraction → aggregation pipeline
 *   5. Builds BrandAnalytics JSON for immediate report display
 *
 * On signup, the provisional brand is transferred to the user's account
 * via transfer_brand_to_account(), and all pipeline data comes with it.
 */

const SYSTEM_ACCOUNT_ID = 'a0000000-0000-4000-a000-000000000001'

const FREE_AUDIT_MODELS = [
  'openai/gpt-4o-mini:online',
  'google/gemini-2.5-flash:online',
  'x-ai/grok-3-mini:online',
]

function generateAuditPrompts(brandName: string, industry?: string, keywords?: string[], markets?: string[], competitors?: string[], description?: string): string[] {
  const marketContext = markets?.length ? ` in ${markets[0]}` : ''
  const industryContext = industry ? ` ${industry}` : ''
  const keywordContext = keywords?.length ? keywords.slice(0, 3).join(', ') : brandName
  const serviceTerm = keywords?.length ? keywords[0].toLowerCase() : (industry || 'services')
  const year = new Date().getFullYear()

  const prompts: string[] = []

  // Brand defense prompts
  prompts.push(`Has anyone used ${brandName}? Is it actually worth it${marketContext}?`)
  if (competitors?.length) {
    prompts.push(`How does ${brandName} compare to ${competitors[0]}? Looking for honest opinions`)
  } else {
    prompts.push(`What do people think about ${brandName}? Any real experiences?`)
  }

  // Category capture prompts
  prompts.push(`What are the best${industryContext} companies${marketContext} for ${year}?`)
  if (keywords && keywords.length >= 2) {
    prompts.push(`I need help with ${keywords[0].toLowerCase()} and ${keywords[1].toLowerCase()} — what do people recommend?`)
  } else {
    prompts.push(`Can you recommend ${keywordContext} providers${marketContext}?`)
  }

  // Solution discovery prompts
  prompts.push(`How do I choose the right ${serviceTerm}? What should I look for?`)

  return prompts
}

async function callOpenRouter(
  model: string,
  prompt: string,
  apiKey: string
): Promise<{ content: string; model_used: string; annotations?: any[] } | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000)

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://withsoma.ai',
        'X-Title': 'Soma AI Free Brand Audit',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a knowledgeable assistant. Answer the question thoroughly and cite sources when possible.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 2000,
        temperature: 0.2,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      console.warn(`OpenRouter ${model} HTTP ${res.status}`)
      return null
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return null

    return {
      content,
      model_used: model,
      annotations: data.choices?.[0]?.message?.annotations || [],
    }
  } catch (e) {
    clearTimeout(timeout)
    console.warn(`OpenRouter ${model} error:`, e instanceof Error ? e.message : e)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // 0. Rate limit per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || '127.0.0.1'
    const rl = checkRateLimit(`free_audit_exec:${ip}`, { maxRequests: 5, windowSeconds: 300 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // 1. Verify internal API key (timing-safe)
    const internalKey = request.headers.get('X-Internal-Key') || ''
    const expectedKey = process.env.INTERNAL_API_KEY
    if (!expectedKey) {
      console.error('INTERNAL_API_KEY not configured')
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    const keyBuffer = Buffer.from(internalKey)
    const expectedBuffer = Buffer.from(expectedKey)
    if (keyBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(keyBuffer, expectedBuffer)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const auditId = body.auditId
    if (!auditId) {
      return NextResponse.json({ error: 'auditId required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // 2. Load audit record
    const { data: audit, error: fetchError } = await supabase
      .from('free_audit_reports')
      .select('*')
      .eq('id', auditId)
      .eq('is_active', true)
      .single()

    if (fetchError || !audit) {
      console.error('Free audit not found:', fetchError)
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }

    if (audit.status !== 'pending') {
      return NextResponse.json({ error: 'Audit already processed', status: audit.status }, { status: 409 })
    }

    // 3. Mark as running
    await supabase
      .from('free_audit_reports')
      .update({ status: 'running' })
      .eq('id', auditId)

    // 4. Use user-reviewed prompts if available, otherwise generate
    const storedPrompts = audit.audit_results?.user_prompts as string[] | undefined
    // Fields are stored in audit_results JSON since the table only has core columns
    const auditMeta = audit.audit_results || {}
    const prompts = (storedPrompts && storedPrompts.length >= 3)
      ? storedPrompts.slice(0, 10)
      : generateAuditPrompts(
          audit.brand_name,
          auditMeta.brand_industry,
          auditMeta.keywords,
          auditMeta.target_markets,
          audit.competitors,
          auditMeta.brand_description
        )

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY not configured')
    }

    // ── PROVISIONING: Create brand + run under system account ──────────
    const brandSlug = audit.brand_name
      .toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 40)
      + '-' + crypto.randomBytes(4).toString('hex')
    const brandCategory = (audit.brand_categories || [])[0] || (auditMeta.brand_categories || [])[0] || 'other'

    const { data: brand, error: brandErr } = await supabase
      .from('brands')
      .insert({
        account_id: SYSTEM_ACCOUNT_ID,
        name: audit.brand_name,
        slug: brandSlug,
        brand_type: 'own',
        industry: audit.brand_industry || auditMeta.brand_industry || 'other',
        primary_domain: audit.website_url ? (() => { try { return new URL(audit.website_url).hostname } catch { return '' } })() : '',
        company_name: audit.company_name || audit.brand_name,
        company_website: audit.website_url || null,
        description: auditMeta.brand_description || null,
        brand_category: brandCategory,
        brand_categories: audit.brand_categories || auditMeta.brand_categories || [],
        brand_website: audit.website_url || null,
        target_markets: audit.target_markets || auditMeta.target_markets || [],
        products_services: (audit.keywords || auditMeta.keywords || []).join(', '),
        brand_topics: audit.keywords || auditMeta.keywords || [],
        business_type: 'brand',
        entity_type: 'company',
        known_competitors: (audit.competitors || []).filter(Boolean).slice(0, 20),
      })
      .select('id')
      .single()

    if (brandErr || !brand) {
      console.error('Failed to create provisional brand:', brandErr)
      throw new Error('Failed to create provisional brand')
    }

    const brandId = brand.id
    const runId = crypto.randomUUID()
    const runCreatedAt = new Date().toISOString()

    // Create run record (profile_id is null for provisional runs)
    await supabase.from('runs').insert({
      id: runId,
      profile_id: null,
      account_id: SYSTEM_ACCOUNT_ID,
      brand_id: brandId,
      prompt_count: prompts.length,
      model_count: FREE_AUDIT_MODELS.length,
      total_jobs: prompts.length * FREE_AUDIT_MODELS.length,
      completed_jobs: 0,
      failed_jobs: 0,
      status: 'running',
      total_cost: 0,
      brand_context: { source: 'free_audit', brand_name: audit.brand_name },
      run_date: runCreatedAt.split('T')[0],
      created_at: runCreatedAt,
    })

    // Insert competitors
    const allCompetitors = (audit.competitors || []).filter(Boolean)
    if (allCompetitors.length > 0) {
      await supabase.from('competitors').insert(
        allCompetitors.slice(0, 20).map((name: string, idx: number) => ({
          brand_id: brandId,
          account_id: SYSTEM_ACCOUNT_ID,
          competitor_name: name.trim(),
          is_direct_competitor: true,
          competitive_threat_level: 'medium',
          mention_frequency: 0,
          avg_sentiment: 0,
          avg_position: 0,
        }))
      )
    }

    // Insert user_prompts for the brand
    const promptIdMap = new Map<string, string>()
    for (const promptText of prompts) {
      const promptId = crypto.randomUUID()
      promptIdMap.set(promptText, promptId)
    }
    await supabase.from('user_prompts').insert(
      prompts.map(text => ({
        id: promptIdMap.get(text),
        account_id: SYSTEM_ACCOUNT_ID,
        brand_id: brandId,
        prompt_text: text,
        category: 'run',
        priority: 1,
        is_selected: true,
        rationale: 'Generated for free audit',
      }))
    )

    // Store provisional IDs on the audit record
    await supabase
      .from('free_audit_reports')
      .update({ provisional_brand_id: brandId, run_id: runId })
      .eq('id', auditId)

    // ── LLM EXECUTION ─────────────────────────────────────────────────
    console.log(`🚀 Free audit: running ${prompts.length} prompts × ${FREE_AUDIT_MODELS.length} models (brand=${brandId})`)

    const jobs = prompts.flatMap((prompt) =>
      FREE_AUDIT_MODELS.map((model) => ({ prompt, model }))
    )

    const results = await Promise.allSettled(
      jobs.map((job) => callOpenRouter(job.model, job.prompt, apiKey))
    )

    // 6. Collect responses
    const responses: Array<{
      raw_response: string
      model_name: string
      prompt_text: string
      extracted_citations: Array<{ domain: string; url: string; title: string }>
    }> = []

    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      if (result.status !== 'fulfilled' || !result.value) continue
      const { content, model_used, annotations } = result.value

      // Extract citations from annotations
      const citations: Array<{ domain: string; url: string; title: string }> = []
      if (annotations) {
        for (const ann of annotations) {
          const urlCite = ann.url_citation || ann
          if (urlCite?.url) {
            try {
              const domain = new URL(urlCite.url).hostname.replace('www.', '')
              citations.push({ domain, url: urlCite.url, title: urlCite.title || '' })
            } catch {}
          }
        }
      }

      responses.push({
        raw_response: content,
        model_name: model_used,
        prompt_text: jobs[i].prompt,
        extracted_citations: citations,
      })
    }

    // ── FALLBACK: If all paid models failed (out of credits), retry with openrouter/free ──
    if (responses.length === 0) {
      console.warn(`⚠️ All paid models failed for free audit ${auditId} — retrying with openrouter/free`)
      const fallbackResults = await Promise.allSettled(
        prompts.map((prompt) => callOpenRouter('openrouter/free', prompt, apiKey))
      )

      for (let i = 0; i < fallbackResults.length; i++) {
        const result = fallbackResults[i]
        if (result.status !== 'fulfilled' || !result.value) continue
        const { content, model_used, annotations } = result.value

        const citations: Array<{ domain: string; url: string; title: string }> = []
        if (annotations) {
          for (const ann of annotations) {
            const urlCite = ann.url_citation || ann
            if (urlCite?.url) {
              try {
                const domain = new URL(urlCite.url).hostname.replace('www.', '')
                citations.push({ domain, url: urlCite.url, title: urlCite.title || '' })
              } catch {}
            }
          }
        }

        responses.push({
          raw_response: content,
          model_name: model_used,
          prompt_text: prompts[i],
          extracted_citations: citations,
        })
      }
      console.log(`🔄 Free audit fallback: ${responses.length}/${prompts.length} responses from openrouter/free`)
    }

    console.log(`✅ Free audit: ${responses.length}/${jobs.length} responses collected`)

    // ── PIPELINE STORAGE: Store via LLMResponseStorage (same as dashboard) ──
    const fileStorage = new LLMResponseStorage(supabase)
    const llmResponses: LLMResponse[] = responses.map((r, idx) => {
      const promptId = promptIdMap.get(r.prompt_text) || crypto.randomUUID()
      const wordCount = r.raw_response.split(/\s+/).filter(Boolean).length
      const hasSources = /\[.*?\]\(.*?\)|https?:\/\/|Sources:|References:/i.test(r.raw_response)

      return {
        id: crypto.randomUUID(),
        run_id: runId,
        prompt_id: promptId,
        profile_id: SYSTEM_ACCOUNT_ID, // Placeholder — no FK constraint on this column
        account_id: SYSTEM_ACCOUNT_ID,
        brand_id: brandId,
        model_name: r.model_name,
        model_provider: 'OpenRouter',
        prompt_text: r.prompt_text,
        raw_response: r.raw_response,
        response_time_ms: 0,
        token_usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        cost_estimate: 0,
        success: true,
        retry_count: 0,
        consumer_behavior: 'search',
        created_at: runCreatedAt,
        processing_metadata: {
          format_detected: 'markdown',
          platform_style: 'generic',
          quality_score: Math.min(100, (wordCount > 100 ? 30 : 15) + (hasSources ? 25 : 0) + (wordCount > 30 ? 25 : 0)),
          authenticity_score: 70,
          brand_mentions_found: 0,
          sources_found: r.extracted_citations.length,
          word_count: wordCount,
          is_analysis_ready: wordCount > 20,
        },
        extracted_citations: r.extracted_citations.map((c, cidx) => ({
          url: c.url,
          domain: c.domain,
          title: c.title,
          citation_position: cidx + 1,
          citation_format: 'inline_link' as const,
        })),
      }
    })

    const storageResult = await fileStorage.batchStoreResponses(llmResponses)
    console.log(`💾 Free audit pipeline: ${storageResult.stored} stored, ${storageResult.failed} failed`)

    // Write manifest (same as dashboard response engine)
    if (storageResult.records.length > 0) {
      await fileStorage.writeManifest(SYSTEM_ACCOUNT_ID, brandId, runId, storageResult.records)
    }

    // Update run as completed
    await supabase.from('runs').update({
      completed_jobs: responses.length,
      failed_jobs: jobs.length - responses.length,
      status: 'completed',
      completed_at: new Date().toISOString(),
    }).eq('id', runId)

    // ── EXTRACTION + AGGREGATION PIPELINE ──────────────────────────────
    // Same pipeline as dashboard: extraction → aggregation → deterministic readback
    let finalAuditResults: Record<string, any> | null = null
    try {
      const { AEOExtractorService } = await import('@/lib/services/aeo-extractor')
      const extractor = new AEOExtractorService(supabase)
      const extractResult = await extractor.processPendingResponses(200, brandId)
      console.log(`🔬 Free audit extraction: ${extractResult.processed} processed, ${extractResult.failed} failed`)

      if (extractResult.processed > 0) {
        const { AEOAggregatorService } = await import('@/lib/services/aeo-aggregator')
        const { getAccountTimezone, getDateInTimezone } = await import('@/lib/utils/timezone')
        const accountTz = await getAccountTimezone(supabase, SYSTEM_ACCOUNT_ID)
        const today = getDateInTimezone(accountTz)
        const aggregator = new AEOAggregatorService(supabase)
        const aggResult = await aggregator.aggregateForDate(today, {
          accountId: SYSTEM_ACCOUNT_ID,
          brandId,
          timezone: accountTz,
        })
        console.log(`📊 Free audit aggregation: brand=${aggResult.brandMetrics}, prompt=${aggResult.promptMetrics}`)

        const pipelineData = await readPipelineAnalytics(supabase, brandId, SYSTEM_ACCOUNT_ID, audit.brand_name)
        if (!pipelineData) {
          throw new Error('Deterministic pipeline readback returned no metrics')
        }

        const recommendations = generateDeterministicRecommendations(pipelineData)
        finalAuditResults = {
          ...pipelineData,
          recommendations,
          recommendation_score: computeRecommendationScore(pipelineData),
          category_visibility: 0,
          generated_at: new Date().toISOString(),
        }
      } else {
        throw new Error('Deterministic extraction produced no response facts')
      }
    } catch (pipelineErr) {
      console.error('❌ Free audit deterministic pipeline error:', pipelineErr)
      throw pipelineErr instanceof Error ? pipelineErr : new Error('Deterministic free audit pipeline failed')
    }

    if (!finalAuditResults) {
      throw new Error('Free audit completed without deterministic analytics output')
    }

    console.log(`✅ Free audit: using deterministic pipeline metrics (LVI=${finalAuditResults.lvi_metrics?.overall_lvi ?? 0})`)

    // Store raw responses for enrichment by the report wrapper
    const responseRecords = responses.map((r) => ({
      raw_response: r.raw_response,
      model_name: r.model_name,
      prompt_text: r.prompt_text,
      extracted_citations: r.extracted_citations,
      response_time_ms: null,
      token_usage: {},
    }))

    // Store: final results + raw responses + preserved audit form metadata
    await supabase
      .from('free_audit_reports')
      .update({
        status: 'completed',
        audit_results: {
          ...finalAuditResults,
          raw_responses: responseRecords,
          // Preserve audit form metadata
          brand_industry: auditMeta.brand_industry,
          brand_categories: auditMeta.brand_categories,
          brand_description: auditMeta.brand_description,
          keywords: auditMeta.keywords,
          target_markets: auditMeta.target_markets,
          user_prompts: auditMeta.user_prompts,
        },
      })
      .eq('id', auditId)

    // ── SEND REPORT-READY EMAIL ──────────────────────────────────────
    // Non-blocking — failure doesn't affect audit completion
    if (audit.email) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://withsoma.ai'
        const reportUrl = `${appUrl}/free-audit?report=${audit.access_token}`
        const signupUrl = `${appUrl}/signup?source=free-audit&redirect_url=/free-audit/activate`
        const resendKey = process.env.RESEND_API_KEY
        if (resendKey) {
          const resend = new Resend(resendKey)
          await resend.emails.send({
            from: process.env.FROM_EMAIL ? `Soma AI <${process.env.FROM_EMAIL}>` : 'Soma AI <alerts@withsoma.ai>',
            to: [audit.email],
            subject: `Your AI Visibility Report for ${audit.brand_name} is Ready`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; padding: 40px 20px 20px;">
                  <div style="display: inline-block; width: 48px; height: 48px; background: #000; border-radius: 8px; color: #fff; font-size: 20px; font-weight: 700; line-height: 48px; margin-bottom: 20px;">S</div>
                  <h1 style="color: #111; font-size: 22px; margin: 0 0 12px;">Your report is ready</h1>
                  <p style="color: #666; font-size: 15px; line-height: 1.5; margin: 0 0 30px;">
                    We tested how <strong>${audit.brand_name}</strong> appears across ChatGPT, Gemini, and other AI assistants. Here&rsquo;s what we found.
                  </p>
                </div>
                <div style="text-align: center; margin: 0 20px 30px;">
                  <a href="${reportUrl}" style="display: inline-block; background: #000; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                    View Your Report
                  </a>
                </div>
                <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 0 20px 30px;">
                  <p style="color: #333; font-size: 14px; margin: 0 0 12px; font-weight: 600;">Want to track your visibility over time?</p>
                  <p style="color: #666; font-size: 13px; line-height: 1.5; margin: 0 0 16px;">
                    Create a free account to monitor weekly changes, get competitor comparisons, and receive AI-powered recommendations.
                  </p>
                  <a href="${signupUrl}" style="display: inline-block; background: #fff; color: #000; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 13px; border: 1px solid #ddd;">
                    Create Free Account
                  </a>
                </div>
                <div style="text-align: center; padding: 20px; border-top: 1px solid #eee;">
                  <p style="color: #999; font-size: 12px; margin: 0;">
                    Soma AI &mdash; Generative Engine Optimization Platform<br>
                    <a href="https://withsoma.ai" style="color: #999;">withsoma.ai</a>
                  </p>
                </div>
              </div>
            `,
          })
          console.log(`📧 Free audit report-ready email sent to ${audit.email}`)
        }
      } catch (emailErr) {
        console.error('⚠️ Failed to send report-ready email (non-blocking):', emailErr)
      }
    }

    return NextResponse.json({ success: true, auditId, brandId })

  } catch (error) {
    console.error('Free audit execution error:', error)
    
    // Try to mark as failed
    try {
      const body = await request.clone().json().catch(() => null)
      const failedAuditId = body?.auditId
      if (failedAuditId) {
        const supabase = createServiceClient()
        await supabase
          .from('free_audit_reports')
          .update({ status: 'failed' })
          .eq('id', failedAuditId)
      }
    } catch {}

    return NextResponse.json({ error: 'Execution failed' }, { status: 500 })
  }
}

/**
 * Process raw LLM responses into the BrandAnalytics format
 * that ExecutiveBrandVisibilityReport consumes — same as /api/brand-analytics output.
 */
/** Escape special regex characters in a string */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function processAuditResults(
  brandName: string,
  responses: Array<{ raw_response: string; model_name: string; prompt_text: string; extracted_citations: Array<{ domain: string; url: string; title: string }> }>,
  competitors: string[]
): Record<string, any> {
  const brandLower = brandName.toLowerCase()
  // Word-boundary regex prevents false positives (e.g. "Precise" matching "precisely")
  const brandPattern = new RegExp(`\\b${escapeRegex(brandLower)}\\b`, 'i')
  const totalResponses = responses.length

  // ── Platform/tool names that aren't real business competitors ──────
  const PLATFORM_NAMES = new Set([
    'facebook', 'google', 'google ads', 'meta', 'meta ads', 'instagram', 'linkedin',
    'twitter', 'x', 'tiktok', 'youtube', 'reddit', 'pinterest', 'snapchat',
    'whatsapp', 'telegram', 'bing', 'yahoo', 'amazon', 'microsoft', 'apple',
    'chatgpt', 'openai', 'anthropic', 'perplexity', 'gemini', 'claude',
    'hubspot', 'salesforce', 'mailchimp', 'wordpress', 'shopify', 'stripe',
    'zapier', 'slack', 'zoom', 'canva', 'notion', 'figma', 'github', 'gitlab',
    'stackoverflow', 'stack overflow', 'wikipedia', 'craigslist', 'yelp',
    'zillow', 'indeed', 'glassdoor', 'paypal', 'venmo', 'square',
    'wix', 'squarespace', 'godaddy', 'cloudflare', 'aws', 'azure',
    'google analytics', 'google search console', 'google my business',
    'facebook ads', 'facebook marketplace', 'instagram ads', 'linkedin ads',
    'tiktok ads', 'youtube ads', 'bing ads', 'twitter ads',
    'semrush', 'ahrefs', 'moz', 'screaming frog',
  ])
  const isPlatformName = (name: string) => PLATFORM_NAMES.has(name.toLowerCase().trim())

  // ── Per-model tracking ────────────────────────────────────────────
  const modelMap: Record<string, {
    mentions: number; total: number; sentiment: number;
    positions: number[]; citations: number; responsesWithCitation: number; competitorMentions: number
  }> = {}

  // ── Per-prompt tracking ───────────────────────────────────────────
  const promptMap: Record<string, {
    text: string; mentions: number; total: number;
    modelScores: Array<{ model_name: string; lvi_score: number; brand_mentioned: boolean; raw_response?: string }>
    citations: Array<{ url: string; domain: string; authority_score: number; model_name: string; relevance_score: number }>
  }> = {}

  // ── Global counters ───────────────────────────────────────────────
  let mentionCount = 0
  let totalSentiment = 0
  let allPositions: number[] = []
  let citationCount = 0
  let responsesWithCitation = 0 // binary: count of responses that had ≥1 citation
  const competitorMentions: Record<string, { count: number; models: Set<string>; sentiment: number; citations: number }> = {}
  const topSources: Record<string, { count: number; models: Set<string> }> = {}
  const discoveredBrands = new Set<string>()
  let recommendedCount = 0 // How often the brand is actively recommended
  let categoryQueryMentions = 0 // Mentions in "best X" category queries
  let categoryQueryTotal = 0

  for (const response of responses) {
    const rawText = (response.raw_response || '').toLowerCase()
    const modelName = response.model_name || 'unknown'
    const promptText = response.prompt_text

    // Init model
    if (!modelMap[modelName]) {
      modelMap[modelName] = { mentions: 0, total: 0, sentiment: 0, positions: [], citations: 0, responsesWithCitation: 0, competitorMentions: 0 }
    }
    const m = modelMap[modelName]
    m.total++

    // Init prompt
    const promptKey = promptText.substring(0, 100)
    if (!promptMap[promptKey]) {
      promptMap[promptKey] = { text: promptText, mentions: 0, total: 0, modelScores: [], citations: [] }
    }
    const p = promptMap[promptKey]
    p.total++

    // ── Brand mention detection (word-boundary to avoid false positives) ──
    const brandMatch = rawText.match(brandPattern)
    const mentioned = !!brandMatch
    if (mentioned && brandMatch) {
      mentionCount++
      m.mentions++
      p.mentions++

      const pos = brandMatch.index ?? rawText.indexOf(brandLower)
      const textBefore = rawText.substring(0, pos)
      const sentencesBefore = Math.min(textBefore.split(/[.!?\n]/).length, 10)
      allPositions.push(sentencesBefore)
      m.positions.push(sentencesBefore)
    }

    // Per-prompt model score
    const promptMentionScore = mentioned ? 80 : 10
    p.modelScores.push({
      model_name: modelName,
      lvi_score: promptMentionScore,
      brand_mentioned: mentioned,
      raw_response: response.raw_response,
    })

    // ── Sentiment analysis ──────────────────────────────────────
    const positiveWords = ['excellent', 'great', 'leading', 'innovative', 'trusted', 'reliable', 'recommend', 'popular', 'best', 'top', 'renowned', 'strong', 'notable', 'major', 'well-known', 'prominent']
    const negativeWords = ['poor', 'concern', 'issue', 'problem', 'complaint', 'avoid', 'questionable', 'criticism', 'controversy', 'scandal', 'struggling']

    let posCount = 0, negCount = 0
    for (const word of positiveWords) posCount += (rawText.match(new RegExp(`\\b${word}\\b`, 'gi')) || []).length
    for (const word of negativeWords) negCount += (rawText.match(new RegExp(`\\b${word}\\b`, 'gi')) || []).length

    const sentimentScore = posCount + negCount > 0 ? posCount / (posCount + negCount) : 0.5
    // Only accumulate sentiment for responses where brand is actually mentioned
    if (mentioned) {
      totalSentiment += sentimentScore
      m.sentiment += sentimentScore
    }

    // ── Citation extraction ─────────────────────────────────────
    const citations = response.extracted_citations || []
    citationCount += citations.length
    if (citations.length > 0) responsesWithCitation++
    m.citations += citations.length
    if (citations.length > 0) m.responsesWithCitation++

    for (const cite of citations) {
      if (cite.domain) {
        if (!topSources[cite.domain]) topSources[cite.domain] = { count: 0, models: new Set() }
        topSources[cite.domain].count++
        topSources[cite.domain].models.add(modelName)

        p.citations.push({
          url: cite.url,
          domain: cite.domain,
          authority_score: 50,
          model_name: modelName,
          relevance_score: 0.7,
        })
      }
    }

    // ── Recommendation detection ────────────────────────────────
    const recommendPatterns = [/\brecommend\b/, /\bsugg?est\b/, /\btop pick\b/, /\bbest choice\b/, /\bhighly rated\b/, /\bgo-to\b/, /\bfirst choice\b/]
    const isRecommended = mentioned && brandMatch && recommendPatterns.some(p => {
      const match = rawText.match(p)
      if (!match) return false
      // Check if recommendation is near the brand mention (within 200 chars)
      const recPos = match.index || 0
      const brandPos = brandMatch.index ?? 0
      return Math.abs(recPos - brandPos) < 200
    })
    if (isRecommended) recommendedCount++

    // ── Category query detection (queries like "best X", "top X") ─
    const promptLower = (promptText || '').toLowerCase()
    const isCategoryQuery = /\b(best|top|leading|popular|recommended)\b/.test(promptLower)
    if (isCategoryQuery) {
      categoryQueryTotal++
      if (mentioned) categoryQueryMentions++
    }

    // ── Position quality classification ──────────────────────────
    let positionLabel = 'Not Mentioned'
    if (mentioned && brandMatch) {
      const pos = brandMatch.index ?? 0
      const responseLength = rawText.length
      const relativePosition = pos / responseLength
      if (relativePosition < 0.15) positionLabel = 'Featured First'
      else if (relativePosition < 0.35) positionLabel = 'Mentioned Early'
      else if (relativePosition < 0.65) positionLabel = 'Mid-Response'
      else positionLabel = 'Mentioned Late'
    }

    // Store position label in model scores for this prompt
    const lastModelScore = p.modelScores[p.modelScores.length - 1]
    if (lastModelScore) {
      (lastModelScore as any).position_label = positionLabel
    }

    // ── Response snippet extraction ─────────────────────────────
    if (mentioned) {
      const originalResponse = response.raw_response || ''
      const snippetMatch = originalResponse.match(new RegExp(`\\b${escapeRegex(brandLower)}\\b`, 'i'))
      const brandIdx = snippetMatch?.index ?? originalResponse.toLowerCase().indexOf(brandLower)
      if (brandIdx >= 0) {
        const snippetStart = Math.max(0, brandIdx - 60)
        const snippetEnd = Math.min(originalResponse.length, brandIdx + brandName.length + 120)
        let snippet = originalResponse.substring(snippetStart, snippetEnd).trim()
        if (snippetStart > 0) snippet = '...' + snippet
        if (snippetEnd < originalResponse.length) snippet = snippet + '...'
        const lastScore = p.modelScores[p.modelScores.length - 1]
        if (lastScore) {
          (lastScore as any).response_snippet = snippet
        }
      }
    }

    // ── Competitor tracking (word-boundary matching) ────────────
    for (const comp of competitors) {
      if (!comp || isPlatformName(comp)) continue
      const compPattern = new RegExp(`\\b${escapeRegex(comp.toLowerCase().trim())}\\b`, 'i')
      if (compPattern.test(rawText)) {
        if (!competitorMentions[comp]) competitorMentions[comp] = { count: 0, models: new Set(), sentiment: 0, citations: 0 }
        competitorMentions[comp].count++
        competitorMentions[comp].models.add(modelName)
        competitorMentions[comp].sentiment += sentimentScore
        m.competitorMentions++

        // Track competitor citations
        for (const cite of citations) {
          const citeText = (cite.url || '').toLowerCase() + ' ' + (cite.domain || '').toLowerCase()
          if (citeText.includes(comp.toLowerCase().split(' ')[0])) {
            competitorMentions[comp].citations++
          }
        }
      }
    }

    // Discover brand names from "top X" lists in response
    // Use original (non-lowercased) response since we need to detect capitalized names
    const originalText = response.raw_response || ''
    // Filter: skip strategy/tactic headings that aren't real brand names
    const isStrategyPhrase = (name: string) => {
      // Starts with verb stem (handles both base "Optimize" and gerund "Optimizing")
      if (/^(Optimiz|Leverag|Embrac|Focus|Build|Creat|Us|Implement|Develop|Invest|Establish|Consider|Explor|Enhanc|Improv|Maintain|Maximiz|Utiliz|Adopt|Integrat|Prioritiz|Monitor|Track|Ensur|Provid|Offer|Includ|Start|Launch|Run|Set|Get|Try|Mak|Tak|Keep|Turn|Put|Buy|Attend|Host|Join|Partner|Conduct|Participat|Cultivat|Purchas|Negotiat|Analyz|Evaluat|Research|Measur|Traditional|Modern|Various|Common|Specific|General|Essential|Primary|Key|Community|Local|Online|Digital|Social|Content|Email|Direct|Advanced|Basic|Premium|Free|Organic|Paid|Strategic|Targeted|Effective|Comprehensive|Professional|Automated|Personalized)\w*\s/i.test(name)) return true
      // Common article/pronoun starts
      if (/^(The|A|An|This|That|It|They|We|You|If|When|How|What|For|In|On|At|To|And|Or|But)\s/i.test(name)) return true
      // Contains generic strategy terms (not brand-like)
      if (/\b(your|their|strategy|strategies|marketing|engagement|optimization|automation|techniques?|approach|practices?|campaigns?|management|development|generation|analytics|intelligence|consulting|programs?|referral|training|resources?|partnerships?|seminars?|webinars?|workshops?|events?|scalable|volume|methods?)\b/i.test(name)) return true
      // Generic "X and Y" noun phrases (e.g. "Technology and Data")
      if (/^[A-Z][a-z]+\s+and\s+[A-Z]/i.test(name) && !/\b(inc|corp|co|llc|ltd|group|associates)\b/i.test(name)) return true
      // Phrases containing "with a/the" (strategy descriptions)
      if (/\bwith\s+(a|the|an|your)\b/i.test(name)) return true
      // Single words under 6 chars are too ambiguous to be brand names
      if (!/\s/.test(name) && name.length < 6) return true
      return false
    }
    // Pattern 1: Numbered list items with bold markdown (most common AI format)
    //   e.g. "1. **Noble Services Agency**" or "2. **QuoteWizard**"
    const boldListMatches = originalText.match(/\d+\.\s+\*\*(.+?)\*\*/g) || []
    for (const match of boldListMatches) {
      const name = match.replace(/^\d+\.\s+\*\*/, '').replace(/\*\*$/, '').trim()
      if (name.length > 2 && name.length < 60 && name.toLowerCase() !== brandLower && !isStrategyPhrase(name) && !isPlatformName(name)) {
        discoveredBrands.add(name)
      }
    }
    // Pattern 2: Numbered list items without bold (plain text format)
    //   e.g. "1. Noble Services Agency - description" or "1. QuoteWizard"
    const plainListMatches = originalText.match(/\d+\.\s+([A-Z][A-Za-z]+(?:\s+[A-Za-z]+){0,4})/g) || []
    for (const match of plainListMatches) {
      const name = match.replace(/^\d+\.\s+/, '').trim()
      if (isStrategyPhrase(name)) continue
      if (name.length > 2 && name.length < 60 && name.toLowerCase() !== brandLower && !isPlatformName(name)) {
        discoveredBrands.add(name)
      }
    }
  }

  // ── Second pass: use discovered brands as fallback competitors ──
  // If no explicit competitors were provided (or none were found in responses),
  // re-scan all responses for mentions of brands discovered in "top X" lists
  if (Object.keys(competitorMentions).length === 0 && discoveredBrands.size > 0) {
    const fallbackCompetitors = Array.from(discoveredBrands).slice(0, 15)
    for (const response of responses) {
      const rawText = (response.raw_response || '').toLowerCase()
      const modelName = response.model_name
      const citations = response.extracted_citations || []
      // Simple sentiment heuristic (same as main loop)
      const sentimentScore = rawText.includes('best') || rawText.includes('leading') || rawText.includes('top') ? 0.7
        : rawText.includes('poor') || rawText.includes('worst') || rawText.includes('avoid') ? 0.2
        : 0.5

      for (const comp of fallbackCompetitors) {
        const compPattern = new RegExp(`\\b${escapeRegex(comp.toLowerCase().trim())}\\b`, 'i')
        if (compPattern.test(rawText)) {
          if (!competitorMentions[comp]) competitorMentions[comp] = { count: 0, models: new Set(), sentiment: 0, citations: 0 }
          competitorMentions[comp].count++
          competitorMentions[comp].models.add(modelName)
          competitorMentions[comp].sentiment += sentimentScore
          // Track competitor citations
          for (const cite of citations) {
            const citeText = (cite.url || '').toLowerCase() + ' ' + (cite.domain || '').toLowerCase()
            if (citeText.includes(comp.toLowerCase().split(' ')[0])) {
              competitorMentions[comp].citations++
            }
          }
        }
      }
    }
  }

  // ── Filter out platform/tool names from competitor data ──────────
  for (const name of Object.keys(competitorMentions)) {
    if (isPlatformName(name)) {
      delete competitorMentions[name]
    }
  }

  // ── Compute final metrics ───────────────────────────────────────
  const mentionRate = totalResponses > 0 ? mentionCount / totalResponses : 0
  const mentionRatePct = mentionRate * 100
  // Sentiment only from responses with brand mentions; 0 when no mentions
  const avgSentimentRaw = mentionCount > 0 ? totalSentiment / mentionCount : 0
  // Normalize from [0,1] to [-1,1] range to match report display formula: (x+1)*5
  const avgSentiment = mentionCount > 0 ? (avgSentimentRaw * 2) - 1 : 0
  const avgPosition = allPositions.length > 0 ? allPositions.reduce((a, b) => a + b, 0) / allPositions.length : 0
  // Canonical LVI formula: vis*0.35 + normRank*0.30 + cit*0.15 + normSent*0.20
  // normRank: position 1 = 100, position 10 = 0, no rank = 0
  const normRank = avgPosition > 0 ? Math.max(0, (1 - (avgPosition - 1) / 9)) * 100 : 0
  const normSentiment = mentionCount > 0 ? ((avgSentiment + 1) / 2) * 100 : 0 // map [-1,1] back to [0,100] for LVI
  // Citation rate: % of total responses that had ≥1 citation (matches aggregator semantics)
  const citationRate = totalResponses > 0 ? Math.min(100, (responsesWithCitation / totalResponses) * 100) : 0

  // LVI formula: matches the canonical aggregator (vis*0.35 + normRank*0.30 + cit*0.15 + normSent*0.20)
  const overallLVI = mentionRatePct > 0
    ? Math.round(Math.max(0, Math.min(100, mentionRatePct * 0.35 + normRank * 0.30 + citationRate * 0.15 + normSentiment * 0.20)))
    : 0

  // ── Build BrandAnalytics-shaped output ────────────────────────────
  const now = new Date().toISOString()
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // lvi_by_model
  const lviByModel = Object.entries(modelMap).map(([modelName, d]) => {
    const modelMentionRate = d.total > 0 ? d.mentions / d.total : 0
    const modelMentionRatePct = modelMentionRate * 100
    // Sentiment only from mentioned responses; normalize to [-1,1] for display
    const modelSentimentRaw = d.mentions > 0 ? d.sentiment / d.mentions : 0
    const modelSentiment = d.mentions > 0 ? (modelSentimentRaw * 2) - 1 : 0
    const modelAvgPos = d.positions.length > 0 ? d.positions.reduce((a, b) => a + b, 0) / d.positions.length : 0
    // Canonical LVI formula per model
    const modelNormRank = modelAvgPos > 0 ? Math.max(0, (1 - (modelAvgPos - 1) / 9)) * 100 : 0
    const modelNormSent = d.mentions > 0 ? ((modelSentiment + 1) / 2) * 100 : 0
    const modelCitRate = d.total > 0 ? Math.min(100, (d.responsesWithCitation / d.total) * 100) : 0
    const modelLVI = modelMentionRatePct > 0
      ? Math.round(Math.max(0, Math.min(100, modelMentionRatePct * 0.35 + modelNormRank * 0.30 + modelCitRate * 0.15 + modelNormSent * 0.20)))
      : 0

    return {
      model_name: modelName,
      lvi_score: modelLVI,
      response_count: d.total,
      mention_count: d.mentions,
      mention_rate: Math.round(modelMentionRate * 100),
      avg_sentiment: Math.round(modelSentiment * 100) / 100,
      avg_position: Math.round(modelAvgPos * 10) / 10,
      citation_count: d.citations,
      competitor_mentions: d.competitorMentions,
    }
  })

  // lvi_by_prompt — use canonical LVI formula
  const lviByPrompt = Object.entries(promptMap).map(([key, d], idx) => {
    const pMentionRate = d.total > 0 ? (d.mentions / d.total) * 100 : 0
    // For per-prompt, we don't track individual positions — use mention rate as primary signal
    const pLVI = pMentionRate > 0
      ? Math.round(Math.max(0, Math.min(100, pMentionRate * 0.55 + 50 * 0.25 + 50 * 0.2)))
      : 0
    return {
      prompt_id: `prompt-${idx + 1}`,
      prompt_text: d.text,
      lvi_score: pLVI,
      response_count: d.total,
      mention_count: d.mentions,
      model_scores: d.modelScores,
    }
  })

  // share_of_voice
  const shareByModel = Object.entries(modelMap).map(([modelName, d]) => ({
    model_name: modelName,
    total_mentions: d.mentions + d.competitorMentions,
    brand_mentions: d.mentions,
    competitor_mentions: d.competitorMentions,
    share_percentage: (d.mentions + d.competitorMentions) > 0
      ? Math.round((d.mentions / (d.mentions + d.competitorMentions)) * 100)
      : 0,
  }))

  const competitorComparison = Object.entries(competitorMentions)
    .map(([name, d]) => ({
      competitor_name: name,
      mentions: d.count,
      share_percentage: totalResponses > 0 ? Math.round((d.count / totalResponses) * 100) : 0,
      avg_sentiment: d.count > 0 ? Math.round((d.sentiment / d.count) * 100) / 100 : 0.5,
    }))
    .sort((a, b) => b.mentions - a.mentions)

  // source_analysis
  const topDomains = Object.entries(topSources)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 15)
    .map(([domain, d]) => ({
      domain,
      citation_count: d.count,
      avg_authority: 50,
      models_used: Array.from(d.models),
    }))

  const citationsByPrompt = Object.entries(promptMap).map(([key, d], idx) => ({
    prompt_id: `prompt-${idx + 1}`,
    prompt_text: d.text,
    citations: d.citations,
  }))

  // competitive_analysis
  const competitorPositioning = Object.entries(competitorMentions).map(([name, d]) => ({
    name,
    mentions: d.count,
    models: Array.from(d.models),
    avg_position: 5,
    co_mentions_with_brand: Math.floor(d.count * 0.6),
    avg_sentiment: d.count > 0 ? Math.round((d.sentiment / d.count) * 100) / 100 : 0.5,
    co_mention_rate: totalResponses > 0 ? Math.round((d.count / totalResponses) * 100) / 100 : 0,
  }))

  // Sentiment analysis by model (only from responses with brand mentions)
  const sentimentByModel = Object.entries(modelMap).map(([modelName, d]) => {
    const sRaw = d.mentions > 0 ? d.sentiment / d.mentions : 0
    const s = d.mentions > 0 ? (sRaw * 2) - 1 : 0 // normalize [0,1] → [-1,1]
    return {
      model_name: modelName,
      avg_sentiment: Math.round(s * 100) / 100,
      sentiment_distribution: {
        positive: d.mentions > 0 ? Math.round(((s + 1) / 2) * 100) : 0,
        neutral: d.mentions > 0 ? Math.round((1 - (s + 1) / 2) * 60) : 100,
        negative: d.mentions > 0 ? Math.round((1 - (s + 1) / 2) * 40) : 0,
      },
      total_sentiment_scores: d.total,
    }
  })

  // Generate recommendations text
  const recommendations = generateRecommendations(overallLVI, mentionRate, avgSentiment, citationCount, totalResponses)

  // ── Build detailed_competitor_analysis ───────────────────────────
  const detailedCompetitorAnalysis = Object.entries(competitorMentions)
    .map(([name, d]) => {
      const mentionRate = totalResponses > 0 ? d.count / totalResponses : 0
      const prominence = Math.round(mentionRate * 100)
      const threatLevel = prominence >= 80 ? 'high' : prominence >= 40 ? 'medium' : 'low'
      return {
        name,
        mention_count: d.count,
        prominence_score: prominence,
        model_count: d.models.size,
        models: Array.from(d.models),
        citation_count: d.citations,
        avg_sentiment: d.count > 0 ? Math.round((d.sentiment / d.count) * 100) / 100 : 0.5,
        threat_level: threatLevel,
        market_share_estimate: prominence,
        co_mention_rate: totalResponses > 0 ? Math.round((d.count / totalResponses) * 100) / 100 : 0,
      }
    })
    .sort((a, b) => b.mention_count - a.mention_count)

  // ── Recommendation score ────────────────────────────────────────
  const recommendationScore = totalResponses > 0 ? Math.round((recommendedCount / totalResponses) * 100) : 0

  // ── Category visibility (how often mentioned in "best X" queries) ──
  const categoryVisibility = categoryQueryTotal > 0 ? Math.round((categoryQueryMentions / categoryQueryTotal) * 100) : 0

  return {
    // ── BrandAnalytics shape (consumed by ExecutiveBrandVisibilityReport) ──
    brand_info: {
      brand_id: 'free-audit',
      brand_name: brandName,
      total_responses: totalResponses,
      total_mentions: mentionCount,
      analysis_period: { start: dayAgo, end: now },
    },
    lvi_metrics: {
      overall_lvi: overallLVI,
      lvi_by_model: lviByModel,
      lvi_by_prompt: lviByPrompt,
      lvi_components: {
        mention_frequency: Math.round(mentionRatePct),
        position_quality: Math.round(normRank),
        citation_authority: Math.round(citationRate),
        sentiment_quality: Math.round(normSentiment),
        competitive_position: Math.round(Math.max(0, 1 - (competitorComparison.length > 0 ? competitorComparison[0].share_percentage / 100 : 0.5)) * 100),
        platform_coverage: Math.round((Object.keys(modelMap).length / 3) * 100),
      },
    },
    share_of_voice: {
      overall_share: Math.round(mentionRatePct),
      share_by_model: shareByModel,
      competitor_comparison: competitorComparison,
    },
    source_analysis: {
      citations_by_prompt: citationsByPrompt,
      top_domains: topDomains,
      authority_distribution: {
        high_authority: Math.round(topDomains.length * 0.3),
        medium_authority: Math.round(topDomains.length * 0.5),
        low_authority: Math.round(topDomains.length * 0.2),
      },
    },
    competitive_analysis: {
      direct_competitors: competitors.filter(Boolean),
      discovered_brands: Array.from(discoveredBrands).slice(0, 10),
      market_position_score: overallLVI,
      competitor_positioning: competitorPositioning,
      detailed_competitor_analysis: detailedCompetitorAnalysis,
      sentiment_analysis: sentimentByModel,
      citation_analysis: {
        total_citations: citationCount,
        avg_citations_per_response: totalResponses > 0 ? Math.round((citationCount / totalResponses) * 100) / 100 : 0,
        citation_types: {},
        avg_authority_score: 50,
        high_authority_citations: Math.round(citationCount * 0.3),
      },
    },
    trends: {
      lvi_trend: 0,
      mention_trend: 0,
      sentiment_trend: 0,
    },
    quality_metrics: {
      avg_completeness: 0.8,
      avg_accuracy: 0.75,
      avg_relevance: 0.85,
      mention_rate: Math.round(mentionRate * 100) / 100,
      avg_sentiment: Math.round(avgSentiment * 100) / 100,
    },
    // ── Extra fields for free audit report page ──
    recommendations,
    recommendation_score: recommendationScore,
    category_visibility: categoryVisibility,
    generated_at: now,
  }
}

function generateRecommendations(lviScore: number, mentionRate: number, sentiment: number, citations: number, totalResponses: number): string[] {
  const recs: string[] = []
  
  if (mentionRate < 0.3) {
    recs.push('Your brand is underrepresented in AI responses. Create authoritative, structured content that AI models can discover and cite.')
  }
  if (mentionRate >= 0.3 && mentionRate < 0.6) {
    recs.push('Your brand appears in some AI responses but not consistently. Focus on building authority in your core topics.')
  }
  if (sentiment < 0.5) {
    recs.push('Sentiment analysis shows room for improvement. Address negative perceptions by publishing positive case studies and reviews.')
  }
  if (citations < 3) {
    recs.push('Few citations point to your content. Publish expert content, research, and data that AI models will want to reference.')
  }
  if (lviScore < 30) {
    recs.push('Your overall AI visibility is low. A comprehensive GEO strategy can significantly improve your discoverability.')
  }
  
  // Always add upgrade CTA
  recs.push('Get detailed model-by-model breakdowns, weekly tracking, and actionable optimization plans with a full Soma AI account.')
  
  return recs
}

/**
 * Read back from the SAME aggregated tables the dashboard API uses.
 * Builds the identical JSON structure as /api/analytics/brand so the
 * free audit report displays the exact same data the dashboard will show.
 */
async function readPipelineAnalytics(
  supabase: ReturnType<typeof createServiceClient>,
  brandId: string,
  accountId: string,
  brandName: string
): Promise<Record<string, any> | null> {
  const { getModelPlatform } = await import('@/lib/types/analytics')

  // ── Parallel DB queries (all independent) ──
  const [brandMetricsRes, modelMetricsRes, competitorsRes, responseFilesRes] = await Promise.all([
    supabase
      .from('daily_brand_metrics')
      .select('*')
      .eq('brand_id', brandId)
      .order('run_date', { ascending: false })
      .limit(1),
    supabase
      .from('daily_model_metrics')
      .select('*')
      .eq('brand_id', brandId)
      .order('run_date', { ascending: false }),
    supabase
      .from('competitors')
      .select('id, competitor_name')
      .eq('brand_id', brandId),
    supabase
      .from('llm_response_files')
      .select('id, model_name')
      .eq('brand_id', brandId)
      .eq('success', true)
      .eq('extraction_status', 'complete'),
  ])

  const latest = brandMetricsRes.data?.[0] ?? null
  if (!latest) return null // Pipeline didn't produce metrics — fall back

  const modelMetrics = modelMetricsRes.data
  const competitors = competitorsRes.data
  const responseFiles = responseFilesRes.data || []
  const responseIds = responseFiles.map(row => row.id)
  const modelByResponseId = new Map(responseFiles.map(row => [row.id, row.model_name]))

  const topDomains: Array<{ domain: string; source_type: string | null; is_high_authority: boolean | null; times_referenced: number | null }> = []
  for (let index = 0; index < responseIds.length; index += 200) {
    const batch = responseIds.slice(index, index + 200)
    if (batch.length === 0) continue

    const { data } = await supabase
      .from('aeo_citations')
      .select('domain, source_type, is_high_authority, times_referenced')
      .in('response_id', batch)

    topDomains.push(...((data || []) as Array<{ domain: string; source_type: string | null; is_high_authority: boolean | null; times_referenced: number | null }>))
  }

  const sentimentBuckets = new Map<string, { positive: number; neutral: number; negative: number; total: number }>()
  for (let index = 0; index < responseIds.length; index += 200) {
    const batch = responseIds.slice(index, index + 200)
    if (batch.length === 0) continue

    const { data } = await supabase
      .from('response_data')
      .select('response_id, raw_sentiment')
      .eq('brand_id', brandId)
      .is('competitor_id', null)
      .eq('mentioned', true)
      .in('response_id', batch)

    for (const row of ((data || []) as Array<{ response_id: string; raw_sentiment: number | null }>)) {
      const modelName = modelByResponseId.get(row.response_id)
      if (!modelName) continue

      const platform = getModelPlatform(modelName)
      const bucket = sentimentBuckets.get(platform) || { positive: 0, neutral: 0, negative: 0, total: 0 }
      const sentiment = row.raw_sentiment ?? 0

      if (sentiment > 0.1) bucket.positive += 1
      else if (sentiment < -0.1) bucket.negative += 1
      else bucket.neutral += 1

      bucket.total += 1
      sentimentBuckets.set(platform, bucket)
    }
  }

  const competitorIds = (competitors || []).map(c => c.id)
  let competitorPositioning: any[] = []

  if (competitorIds.length > 0) {
    const { data: compMetrics } = await supabase
      .from('daily_competitor_metrics')
      .select('competitor_id, lvi_score, visibility_rate, citation_rate, avg_sentiment, share_of_voice, total_responses, responses_with_mention, total_citations, avg_brand_rank')
      .in('competitor_id', competitorIds)
      .order('run_date', { ascending: false })

    const compMap = new Map<string, any>()
    for (const row of (compMetrics || [])) {
      if (!compMap.has(row.competitor_id)) compMap.set(row.competitor_id, row)
    }

    competitorPositioning = (competitors || [])
      .map(c => {
        const cm = compMap.get(c.id)
        return {
          name: c.competitor_name,
          lvi_score: cm?.lvi_score ?? 0,
          visibility_rate: cm?.visibility_rate ?? 0,
          share_of_voice: cm?.share_of_voice ?? 0,
          avg_sentiment: cm?.avg_sentiment ?? 0,
          citation_rate: cm?.citation_rate ?? 0,
          total_mentions: cm?.responses_with_mention ?? 0,
          mentions: cm?.responses_with_mention ?? 0,
          total_citations: cm?.total_citations ?? 0,
          avg_position: cm?.avg_brand_rank ?? 0,
          co_mention_rate: 0,
        }
      })
      .sort((a, b) => b.lvi_score - a.lvi_score)
  }

  // ── Build model breakdown (same logic as /api/analytics/brand) ──
  const modelMap = new Map<string, { latest: any; prev: any | null; totalResponses: number }>()
  for (const row of (modelMetrics || [])) {
    const platform = getModelPlatform(row.model_name)
    const existing = modelMap.get(platform)
    if (!existing) {
      modelMap.set(platform, { latest: row, prev: null, totalResponses: row.total_responses })
    } else {
      if (!existing.prev) existing.prev = row
      existing.totalResponses += row.total_responses
    }
  }

  const modelBreakdown = Array.from(modelMap.entries()).map(([platform, { latest: l, totalResponses }]) => ({
    platform,
    lvi_score: l.lvi_score ?? 0,
    visibility_rate: l.visibility_rate ?? 0,
    citation_rate: l.citation_rate ?? 0,
    avg_sentiment: l.avg_sentiment ?? 0,
    share_of_voice: l.share_of_voice ?? 0,
    total_responses: totalResponses,
    responses_with_mention: l.responses_with_mention ?? 0,
    total_citations: l.total_citations ?? 0,
    total_brand_mentions: l.total_brand_mentions ?? 0,
    avg_brand_rank: l.avg_brand_rank ?? 0,
    trend: 'new' as const,
  })).sort((a, b) => b.lvi_score - a.lvi_score)

  // ── Source analysis ──
  const domainAgg = new Map<string, { count: number; sourceType: string | null; isHighAuth: boolean }>()
  for (const c of topDomains) {
    const existing = domainAgg.get(c.domain)
    const citationCount = c.times_referenced ?? 1
    if (!existing) {
      domainAgg.set(c.domain, { count: citationCount, sourceType: c.source_type, isHighAuth: !!c.is_high_authority })
    } else {
      existing.count += citationCount
    }
  }
  const sourceAnalysis = Array.from(domainAgg.entries())
    .map(([domain, { count, sourceType, isHighAuth }]) => ({ domain, citations: count, source_type: sourceType, is_high_authority: isHighAuth }))
    .sort((a, b) => b.citations - a.citations)
    .slice(0, 15)

  const totalCitations = sourceAnalysis.reduce((s, d) => s + d.citations, 0)
  const highAuthCitations = sourceAnalysis.filter(d => d.is_high_authority).reduce((s, d) => s + d.citations, 0)

  const citationTypes: Record<string, number> = {}
  for (const d of sourceAnalysis) {
    const t = d.source_type || 'unknown'
    citationTypes[t] = (citationTypes[t] || 0) + d.citations
  }

  const now = new Date().toISOString()
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // ── Return in the EXACT same shape as /api/analytics/brand ──
  return {
    brand_info: {
      brand_id: brandId,
      brand_name: brandName,
      total_mentions: latest.total_brand_mentions ?? 0,
      total_responses: latest.total_responses ?? 0,
      total_citations: latest.total_citations ?? 0,
      models_tracked: latest.total_models_run ?? 0,
      analysis_period: { start: dayAgo, end: now },
    },
    lvi_metrics: {
      overall_lvi: latest.lvi_score ?? 0,
      lvi_change: 0,
      lvi_trend: 'new',
      lvi_by_model: modelBreakdown.map(m => ({
        model: m.platform,
        model_name: m.platform,
        lvi_score: m.lvi_score,
        visibility_rate: m.visibility_rate,
        mention_rate: m.visibility_rate,
        mention_count: m.responses_with_mention,
        response_count: m.total_responses,
        citation_rate: m.citation_rate,
        citation_count: m.total_citations,
        avg_position: m.avg_brand_rank,
        sentiment: m.avg_sentiment,
        avg_sentiment: m.avg_sentiment,
        share_of_voice: m.share_of_voice,
        total_responses: m.total_responses,
        competitor_mentions: 0,
        trend: 'new',
      })),
      lvi_by_prompt: [], // Overridden by processAuditResults in merge
      lvi_components: {
        mention_frequency: latest.visibility_rate ?? 0,
        position_quality: latest.avg_brand_rank ? Math.max(0, 100 - (latest.avg_brand_rank * 10)) : 0,
        citation_authority: latest.citation_rate ?? 0,
        sentiment_quality: latest.avg_sentiment != null ? Math.round(((latest.avg_sentiment + 1) / 2) * 100) : 0,
        competitive_position: latest.share_of_voice ?? 0,
        platform_coverage: (latest.total_models_run ?? 0) > 0 ? Math.round((modelBreakdown.length / latest.total_models_run) * 100) : 0,
      },
    },
    share_of_voice: {
      overall_share: latest.share_of_voice ?? 0,
      share_by_model: modelBreakdown.map(m => ({
        model: m.platform,
        model_name: m.platform,
        share: m.share_of_voice,
        share_percentage: m.share_of_voice,
        total_responses: m.total_responses,
        brand_mentions: m.total_responses > 0 ? Math.round(m.visibility_rate / 100 * m.total_responses) : 0,
        competitor_mentions: 0,
        trend: 'new',
      })),
      competitor_comparison: competitorPositioning.map(c => ({
        competitor_name: c.name,
        name: c.name,
        mentions: c.mentions,
        share: c.share_of_voice,
        share_percentage: c.share_of_voice,
        avg_sentiment: c.avg_sentiment,
        lvi_score: c.lvi_score,
      })),
    },
    quality_metrics: {
      mention_rate: latest.visibility_rate ?? 0,
      avg_sentiment: latest.avg_sentiment ?? 0,
      recommendation_rate: latest.recommendation_rate ?? 0,
      citation_rate: latest.citation_rate ?? 0,
      visibility_rate: latest.visibility_rate ?? 0,
      avg_completeness: latest.recommendation_rate ?? 0,
      avg_accuracy: latest.citation_rate ?? 0,
      avg_relevance: latest.visibility_rate ?? 0,
    },
    competitive_analysis: {
      direct_competitors: (competitors || []).map(c => c.competitor_name),
      discovered_brands: [],
      market_position_score: latest.lvi_score ?? 0,
      competitor_positioning: competitorPositioning,
      detailed_competitor_analysis: competitorPositioning.map(c => {
        const mentionRate = (latest.total_responses ?? 1) > 0 ? (c.mentions || 0) / (latest.total_responses ?? 1) : 0
        const prominence = Math.round(mentionRate * 100)
        return {
          name: c.name,
          mention_count: c.mentions || 0,
          prominence_score: prominence,
          model_count: 0,
          models: [],
          citation_count: c.total_citations || 0,
          avg_sentiment: c.avg_sentiment || 0,
          threat_level: prominence >= 80 ? 'high' : prominence >= 40 ? 'medium' : 'low',
          market_share_estimate: prominence,
          co_mention_rate: c.co_mention_rate || 0,
        }
      }),
      sentiment_analysis: modelBreakdown.map(m => {
        const bucket = sentimentBuckets.get(m.platform) || { positive: 0, neutral: 0, negative: 0, total: 0 }
        return {
          model_name: m.platform,
          avg_sentiment: m.avg_sentiment,
          total_sentiment_scores: bucket.total,
          sentiment_distribution: {
            positive: bucket.positive,
            negative: bucket.negative,
            neutral: bucket.neutral,
          },
        }
      }),
      citation_analysis: {
        total_citations: totalCitations,
        avg_citations_per_response: (latest.total_responses ?? 0) > 0 ? totalCitations / latest.total_responses : 0,
        avg_authority_score: sourceAnalysis.length > 0 ? sourceAnalysis.filter(d => d.is_high_authority).length / sourceAnalysis.length * 100 : 0,
        high_authority_citations: highAuthCitations,
        citation_types: citationTypes,
      },
    },
    source_analysis: {
      top_domains: sourceAnalysis,
      citations_by_prompt: [],
      authority_distribution: {
        high_authority: sourceAnalysis.filter(d => d.is_high_authority).length,
        medium_authority: sourceAnalysis.filter(d => !d.is_high_authority).length,
        low_authority: 0,
      },
    },
    trends: {
      lvi_trend: 0,
      mention_trend: 0,
      sentiment_trend: 0,
    },
  }
}

function generateDeterministicRecommendations(auditResults: Record<string, any>): string[] {
  const mentionRate = auditResults?.quality_metrics?.mention_rate ?? 0
  const citationRate = auditResults?.quality_metrics?.citation_rate ?? 0
  const overallLvi = auditResults?.lvi_metrics?.overall_lvi ?? 0
  const overallShare = auditResults?.share_of_voice?.overall_share ?? 0
  const directCompetitors = auditResults?.competitive_analysis?.direct_competitors || []

  const recommendations: string[] = []

  if (mentionRate < 40) {
    recommendations.push('Your brand appears in too few AI answers. Publish more direct, query-matched content for the exact prompts customers use.')
  }

  if (citationRate < 30) {
    recommendations.push('Your pages are not being cited often enough. Strengthen structured content, original data, and page-level authority so models have more reasons to reference you.')
  }

  if (overallShare < 25 && directCompetitors.length > 0) {
    recommendations.push('Competitors are capturing more answer share than your brand. Prioritize the prompt clusters where they are present and you are absent.')
  }

  if (overallLvi < 50) {
    recommendations.push('Your overall AI visibility is below a defensible threshold. Build a repeatable GEO program around prompts, citations, and model-specific coverage.')
  }

  if (recommendations.length === 0) {
    recommendations.push('Your brand already has measurable AI visibility. Focus on protecting citation share and improving consistency across every target model.')
  }

  recommendations.push('Track the same prompts weekly so you can measure trend movement instead of relying on one-off snapshots.')

  return recommendations
}

function computeRecommendationScore(auditResults: Record<string, any>): number {
  const lvi = auditResults?.lvi_metrics?.overall_lvi ?? 0
  const mentionRate = auditResults?.quality_metrics?.mention_rate ?? 0
  const citationRate = auditResults?.quality_metrics?.citation_rate ?? 0

  return Math.round(((lvi * 0.4) + (mentionRate * 0.35) + (citationRate * 0.25)))
}
