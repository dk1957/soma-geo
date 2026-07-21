import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { checkRateLimit } from '@/lib/rate-limit'

const SYSTEM_ACCOUNT_ID = 'a0000000-0000-4000-a000-000000000001'

/**
 * POST /api/free-audit/claim-and-setup
 * 
 * For free audit → signup conversion: creates account + brand from audit data,
 * claims the audit report, migrates responses, and marks onboarding as complete.
 * This bypasses the normal onboarding flow entirely.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate via Clerk
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit per user (5 claims per 10 min)
    const rl = checkRateLimit(`free_audit_claim:${clerkUserId}`, { maxRequests: 5, windowSeconds: 600 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { accessToken, reportId } = await request.json()
    
    // Accept either a valid token OR null/empty (for email-based fallback)
    const hasToken = accessToken && /^[a-f0-9]{64}$/.test(accessToken)
    const hasReportId = reportId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reportId)

    const supabase = createServiceClient()

    // Get Clerk user's email for verification
    const clerkUserObj = await currentUser()
    const clerkEmail = clerkUserObj?.emailAddresses?.[0]?.emailAddress?.toLowerCase()
    console.log('📋 Claim-and-setup: clerkUserId=', clerkUserId, 'clerkEmail=', clerkEmail, 'hasToken=', hasToken, 'hasReportId=', hasReportId)

    const REPORT_SELECT = 'id, brand_name, website_url, brand_industry, brand_categories, keywords, target_markets, competitors, audit_results, provisional_brand_id, created_at, lead_id'

    // 2. Fetch the audit report — by token, reportId, or email fallback
    let auditReport: any = null

    if (hasToken) {
      // Primary path: direct token lookup
      const { data, error } = await supabase
        .from('free_audit_reports')
        .select(REPORT_SELECT)
        .eq('access_token', accessToken)
        .is('claimed_at', null)
        .single()
      if (!error && data) auditReport = data
    }

    if (!auditReport && hasReportId) {
      // Second path: direct ID lookup (passed from onboarding page that already found the report)
      // Security: verify the report email matches the Clerk user's email
      const { data, error } = await supabase
        .from('free_audit_reports')
        .select(REPORT_SELECT + ', email')
        .eq('id', reportId)
        .is('claimed_at', null)
        .eq('status', 'completed')
        .single()
      if (!error && data) {
        // Verify email matches for security (prevent claiming someone else's report)
        if (clerkEmail && data.email?.toLowerCase() === clerkEmail) {
          const { email: _email, ...reportData } = data
          auditReport = reportData
        } else {
          console.warn('⚠️ Report ID email mismatch: report email=', data.email, 'clerk email=', clerkEmail)
        }
      }
    }

    if (!auditReport && clerkEmail) {
      // Fallback: match by the Clerk user's email against free_audit_reports.email
      const { data } = await supabase
        .from('free_audit_reports')
        .select(REPORT_SELECT)
        .eq('email', clerkEmail)
        .is('claimed_at', null)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data) auditReport = data
    }

    if (!auditReport) {
      console.error('❌ Claim-and-setup: No report found. clerkEmail=', clerkEmail, 'hasToken=', hasToken, 'hasReportId=', hasReportId)
      return NextResponse.json(
        { error: 'Report not found, already claimed, or expired' },
        { status: 404 }
      )
    }

    // 3. Ensure profile exists (reuse clerkUserObj from above)
    const email = clerkEmail || `${clerkUserId}@clerk.user`
    const fullName = [clerkUserObj?.firstName, clerkUserObj?.lastName].filter(Boolean).join(' ') || null

    let { data: profile } = await supabase
      .from('profiles')
      .select('id, clerk_id')
      .eq('clerk_id', clerkUserId)
      .maybeSingle()

    if (!profile) {
      const { data: newProfile, error: profileErr } = await supabase
        .from('profiles')
        .insert({
          clerk_id: clerkUserId,
          email,
          full_name: fullName,
          avatar_url: clerkUserObj?.imageUrl || null,
          auth_provider: 'clerk',
          role: 'user',
          onboarding_status: 'in_progress',
          onboarding_step: 1,
          timezone: 'UTC',
          language_preference: 'en',
        })
        .select('id, clerk_id')
        .single()

      if (profileErr || !newProfile) {
        console.error('Failed to create profile:', profileErr)
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
      }
      profile = newProfile
    }

    // 4. Check if user already has an account (e.g. signed up normally before)
    let { data: existingAccount } = await supabase
      .from('accounts')
      .select('id, name, slug')
      .eq('owner_clerk_id', clerkUserId)
      .maybeSingle()

    let account = existingAccount
    const brandName = auditReport.brand_name || 'My Brand'
    // Fields stored in audit_results JSON (not as table columns)
    const auditMeta = auditReport.audit_results || {}
    // Use company_name from audit record (or audit_results JSON), fallback to brand name
    const companyName = auditReport.company_name || auditMeta.company_name || brandName

    // 5. Create account if needed
    if (!account) {
      const accountSlug = generateSlug(companyName)

      const { data: accountResult, error: accountError } = await supabase
        .rpc('create_account_with_owner', {
          p_name: companyName,
          p_slug: accountSlug,
          p_account_type: 'in_house',
          p_owner_id: clerkUserId,
          p_industry: auditMeta.brand_industry || 'other',
          p_company_size: 'small',
        })

      if (accountError || !accountResult) {
        console.error('Account creation error:', accountError)
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
      }

      account = accountResult
    }

    // 6. Ensure account_users record exists
    const { data: existingAccountUser } = await supabase
      .from('account_users')
      .select('id')
      .eq('account_id', account!.id)
      .eq('clerk_id', clerkUserId)
      .maybeSingle()

    if (!existingAccountUser) {
      await supabase.from('account_users').insert({
        account_id: account!.id,
        clerk_id: clerkUserId,
        role: 'owner',
        is_active: true,
      })
    }

    // 7. Create trial subscription (Growth plan) — user must pay to activate
    const { data: existingSub } = await supabase
      .from('account_subscriptions')
      .select('id')
      .eq('account_id', account!.id)
      .in('status', ['active', 'trialing'])
      .maybeSingle()

    if (!existingSub) {
      // Look up Growth plan dynamically
      const { data: growthPlan } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('plan_slug', 'growth')
        .eq('is_active', true)
        .single()

      const trialPlanId = growthPlan?.id || 'a34e6cf6-bc46-4519-929c-5f405038d5ce'
      const startDate = new Date()
      const trialEndDate = new Date()
      trialEndDate.setDate(trialEndDate.getDate() + 14) // 14-day trial

      await supabase.from('account_subscriptions').insert({
        account_id: account!.id,
        plan_id: trialPlanId,
        status: 'trialing',
        billing_cycle: 'monthly',
        current_period_start: startDate.toISOString(),
        current_period_end: trialEndDate.toISOString(),
        auto_renew: false,
        metadata: { created_via: 'free_audit_conversion', is_trial: true, trial_days: 14 },
      })

      // Log trial event
      await supabase.from('subscription_history').insert({
        account_id: account!.id,
        event_type: 'trial_started',
        new_plan_id: trialPlanId,
        new_status: 'trialing',
        event_data: { created_via: 'free_audit_conversion', trial_days: 14 },
        triggered_by: clerkUserId,
      }).then(() => {}, () => {})
    }

    // 8. Create or transfer brand
    let brand: { id: string; name: string; slug: string }
    const provisionalBrandId = auditReport.provisional_brand_id

    if (provisionalBrandId) {
      // ── NEW FLOW: Transfer provisional brand from system account ──────
      console.log(`🔄 Transferring provisional brand ${provisionalBrandId} to account ${account!.id}`)

      const { error: transferErr } = await supabase.rpc('transfer_brand_to_account', {
        p_brand_id: provisionalBrandId,
        p_from_account_id: SYSTEM_ACCOUNT_ID,
        p_to_account_id: account!.id,
        p_profile_id: profile.id,
      })

      if (transferErr) {
        console.error('Brand transfer failed:', transferErr)
        return NextResponse.json({ error: 'Failed to transfer brand data' }, { status: 500 })
      }

      // Fetch the transferred brand details
      const { data: transferredBrand, error: fetchErr } = await supabase
        .from('brands')
        .select('id, name, slug')
        .eq('id', provisionalBrandId)
        .single()

      if (fetchErr || !transferredBrand) {
        console.error('Failed to fetch transferred brand:', fetchErr)
        return NextResponse.json({ error: 'Brand transfer incomplete' }, { status: 500 })
      }

      brand = transferredBrand
      console.log(`✅ Brand transferred: ${brand.name} (${brand.id}) → account ${account!.id}`)
    } else {
      // ── LEGACY FLOW: Create brand from scratch (old audits without provisioning) ──
      let brandWebsite = auditReport.website_url || ''
      let primaryDomain = ''
      if (brandWebsite) {
        try { primaryDomain = new URL(brandWebsite).hostname } catch {}
      }

      const brandSlug = generateSlug(brandName)
      const brandCategory = (auditMeta.brand_categories || [])[0] || 'other'

      const { data: newBrand, error: brandError } = await supabase
        .from('brands')
        .insert({
          account_id: account!.id,
          name: brandName,
          slug: brandSlug,
          brand_type: 'own',
          industry: auditMeta.brand_industry || 'other',
          primary_domain: primaryDomain,
          company_name: brandName,
          company_website: brandWebsite || null,
          description: auditMeta.brand_description || null,
          brand_category: brandCategory,
          brand_categories: auditMeta.brand_categories || [],
          brand_website: brandWebsite || null,
          target_markets: auditMeta.target_markets || [],
          products_services: (auditMeta.keywords || []).join(', '),
          brand_topics: auditMeta.keywords || [],
          business_type: 'brand',
          entity_type: 'company',
          known_competitors: [
            ...(auditReport.competitors || []),
            ...(auditMeta.competitive_analysis?.discovered_brands || []),
          ].filter((c: string, i: number, arr: string[]) => c && arr.indexOf(c) === i).slice(0, 20),
        })
        .select('id, name, slug')
        .single()

      if (brandError || !newBrand) {
        console.error('Brand creation error:', brandError)
        return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 })
      }

      brand = newBrand

      // Insert competitors (only for legacy flow — new flow already has them)
      const explicitCompetitors = auditReport.competitors || []
      const discoveredBrands = auditMeta.competitive_analysis?.discovered_brands || []
      const allCompetitors = [...explicitCompetitors]
      const lowerSet = new Set(allCompetitors.map((c: string) => c.toLowerCase().trim()))
      for (const db of discoveredBrands) {
        if (db && !lowerSet.has(db.toLowerCase().trim())) {
          allCompetitors.push(db)
          lowerSet.add(db.toLowerCase().trim())
        }
      }
      if (allCompetitors.length > 0) {
        const competitorInserts = allCompetitors
          .filter((c: string) => c?.trim())
          .slice(0, 20)
          .map((name: string, idx: number) => ({
            brand_id: brand.id,
            account_id: account!.id,
            competitor_name: name.trim(),
            competitor_domain: null,
            competitor_category: null,
            is_direct_competitor: idx < explicitCompetitors.length,
            competitive_threat_level: 'medium' as const,
            mention_frequency: 0,
            avg_sentiment: 0,
            avg_position: 0,
          }))

        if (competitorInserts.length > 0) {
          await supabase.from('competitors').insert(competitorInserts)
        }
      }

      // Insert prompt_topics from keywords (only for legacy flow)
      const keywords = auditMeta.keywords || []
      if (keywords.length > 0) {
        const topicsToInsert = keywords
          .filter((t: string) => t?.trim())
          .map((topic: string, index: number) => {
            const topicSlug = topic.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
            return {
              brand_id: brand.id,
              account_id: account!.id,
              name: topic.trim(),
              slug: topicSlug || `topic-${index}`,
              description: `Topic: ${topic.trim()}`,
              sort_order: index,
              is_active: true,
            }
          })

        await supabase.from('prompt_topics').insert(topicsToInsert)
      }
    }

    // 12. Create workspace
    const workspaceSlug = generateSlug(brandName)
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        account_id: account!.id,
        brand_id: brand.id,
        name: `${brandName} workspace`,
        slug: workspaceSlug,
        is_default: true,
      })
      .select('id, name, slug')
      .single()

    if (workspaceError) {
      console.error('Workspace creation error:', workspaceError)
      // Non-blocking — brand already exists
    }

    // Add user to workspace
    if (workspace) {
      await supabase.from('workspace_users').insert({
        workspace_id: workspace.id,
        clerk_id: clerkUserId,
        role: 'admin',
        joined_at: new Date(),
      })
    }

    // 13. Claim the audit report (link to account/brand)
    // Use direct UPDATE instead of RPC — the RPC references a non-existent expires_at column
    const { error: claimError } = await supabase
      .from('free_audit_reports')
      .update({
        account_id: account!.id,
        brand_id: brand.id,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', auditReport.id)
      .is('claimed_at', null)

    if (claimError) {
      console.error('Failed to claim audit report:', claimError)
      // Non-blocking — account/brand already created
    }

    // 14. Pipeline safety net: ensure extraction ran for provisional brands
    if (provisionalBrandId) {
      // Check if any response files are still pending extraction
      const { count: pendingCount } = await supabase
        .from('llm_response_files')
        .select('id', { count: 'exact', head: true })
        .eq('brand_id', brand.id)
        .eq('extraction_status', 'pending')

      if (pendingCount && pendingCount > 0) {
        console.log(`🔄 ${pendingCount} responses still pending extraction for brand ${brand.id}, re-triggering pipeline...`)
        triggerExtractionPipeline(account!.id, brand.id).catch(err => {
          console.error('⚠️ Re-trigger pipeline error (non-blocking):', err)
        })
      } else {
        // Pipeline already ran — just broadcast so dashboard auto-refreshes
        try {
          const channel = supabase.channel(`brand:${brand.id}`)
          await channel.send({
            type: 'broadcast',
            event: 'pipeline_complete',
            payload: { brandId: brand.id, source: 'claim_transfer', timestamp: new Date().toISOString() }
          })
          await supabase.removeChannel(channel)
        } catch {}
      }
    }

    // 14b. For legacy audits (no provisional brand), migrate raw responses into pipeline
    if (!provisionalBrandId) {
      const rawResponses = auditMeta.raw_responses as Array<{
        raw_response: string
        model_name: string
        prompt_text: string
        extracted_citations?: Array<{ domain: string; url: string; title: string }>
        response_time_ms: number | null
        token_usage: Record<string, number>
      }> | undefined

      if (rawResponses?.length && profile) {
        const runId = `run_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
        const createdAt = auditReport.created_at || new Date().toISOString()

        // Create a proper run record
        const { error: runErr } = await supabase.from('runs').insert({
          id: runId,
          profile_id: profile.id,
          account_id: account!.id,
          brand_id: brand.id,
          prompt_count: new Set(rawResponses.map(r => r.prompt_text)).size,
          model_count: new Set(rawResponses.map(r => r.model_name)).size,
          total_jobs: rawResponses.length,
          completed_jobs: rawResponses.length,
          failed_jobs: 0,
          status: 'completed',
          total_cost: 0,
          brand_context: { source: 'free_audit_legacy', brand_name: brandName },
          run_date: createdAt.split('T')[0],
          created_at: createdAt,
          completed_at: createdAt,
        })

        if (runErr) {
          console.error('Failed to create run for audit migration:', runErr)
        }

        // Store responses via LLMResponseStorage (proper pipeline storage)
        try {
          const { LLMResponseStorage } = await import('@/lib/services/llm-response-storage')
          const fileStorage = new LLMResponseStorage(supabase)

          const uniquePrompts = [...new Set(rawResponses.map(r => r.prompt_text))]
          const promptIdMap = new Map<string, string>()
          for (const promptText of uniquePrompts) {
            promptIdMap.set(promptText, crypto.randomUUID())
          }

          const llmResponses = rawResponses.map((r) => ({
            id: crypto.randomUUID(),
            run_id: runId,
            prompt_id: promptIdMap.get(r.prompt_text) || crypto.randomUUID(),
            profile_id: profile!.id,
            account_id: account!.id,
            brand_id: brand.id,
            model_name: r.model_name,
            model_provider: 'OpenRouter',
            prompt_text: r.prompt_text,
            raw_response: r.raw_response,
            response_time_ms: r.response_time_ms || 0,
            token_usage: r.token_usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
            cost_estimate: 0,
            success: true,
            retry_count: 0,
            consumer_behavior: 'search' as const,
            created_at: createdAt,
            processing_metadata: {},
            extracted_citations: (r.extracted_citations || []).map((c, cidx) => ({
              url: c.url,
              domain: c.domain,
              title: c.title,
              citation_position: cidx + 1,
              citation_format: 'inline_link' as const,
            })),
          }))

          const storageResult = await fileStorage.batchStoreResponses(llmResponses)
          console.log(`✅ Legacy audit: stored ${storageResult.stored} responses via pipeline`)

          // Write manifest for consistency with dashboard engine
          if (storageResult.records.length > 0) {
            await fileStorage.writeManifest(account!.id, brand.id, runId, storageResult.records)
          }

          // Trigger extraction + aggregation pipeline (non-blocking)
          triggerExtractionPipeline(account!.id, brand.id).catch(err => {
            console.error('⚠️ AEO extraction pipeline error (non-blocking):', err)
          })
        } catch (storageErr) {
          console.error('Failed to store legacy audit responses via pipeline:', storageErr)
        }
      }
    }

    // 15. Mark onboarding as completed
    const completedAt = new Date().toISOString()
    await supabase
      .from('profiles')
      .update({
        onboarding_status: 'completed',
        onboarding_step: 5,
        onboarding_completed_at: completedAt,
        onboarding_metadata: {
          completed_via: 'free_audit_conversion',
          completed_at: completedAt,
          free_audit_token: accessToken,
          brand_id: brand.id,
        },
        updated_at: completedAt,
      })
      .eq('clerk_id', clerkUserId)

    // 16. Create notification preferences
    await supabase.from('notification_preferences').insert({
      clerk_id: clerkUserId,
      account_id: account!.id,
      brand_id: brand.id,
      event_types: ['citation_drop', 'citation_spike', 'competitor_gain', 'keyword_opportunity'],
      frequency: 'daily',
    })

    console.log(`✅ Free audit claim-and-setup complete: brand=${brand.id}, account=${account!.id}`)

    // 17. Convert linked lead (non-blocking)
    if (auditReport.lead_id) {
      supabase.from('leads').update({
        status: 'converted',
        account_id: account!.id,
        clerk_id: clerkUserId,
        converted_at: new Date().toISOString(),
      }).eq('id', auditReport.lead_id).then(
        () => { console.log(`✅ Lead ${auditReport.lead_id} converted to account ${account!.id}`) },
        () => {}
      )
    }

    return NextResponse.json({
      success: true,
      account: { id: account!.id, name: account!.name },
      brand: { id: brand.id, name: brand.name, slug: brand.slug },
      workspace: workspace ? { id: workspace.id } : null,
    })

  } catch (error) {
    console.error('Free audit claim-and-setup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50)

  const suffix = Math.random().toString(36).substring(2, 8)
  return `${base}-${suffix}`
}

/**
 * Trigger AEO extraction + aggregation pipeline.
 * Mirrors the same pipeline from llm-run-orchestrator.ts.
 * Non-blocking — errors are logged but don't fail the claim.
 */
async function triggerExtractionPipeline(accountId: string, brandId: string): Promise<void> {
  console.log(`🔬 Starting AEO extraction pipeline for claimed audit (brand ${brandId})...`)

  const { AEOExtractorService } = await import('@/lib/services/aeo-extractor')
  const { AEOAggregatorService } = await import('@/lib/services/aeo-aggregator')
  const { createServiceClient } = await import('@/lib/supabase/server')

  const supabase = createServiceClient()
  const extractor = new AEOExtractorService(supabase)
  const extractResult = await extractor.processPendingResponses(200, brandId)

  console.log(`🔬 Extraction done: ${extractResult.processed} processed, ${extractResult.failed} failed`)

  if (extractResult.processed > 0) {
    const { getAccountTimezone, getDateInTimezone } = await import('@/lib/utils/timezone')
    const accountTz = await getAccountTimezone(supabase, accountId)
    const aggregator = new AEOAggregatorService(supabase)
    const today = getDateInTimezone(accountTz)
    const aggResult = await aggregator.aggregateForDate(today, { accountId, brandId, timezone: accountTz })
    console.log(`📊 Aggregation done: ${aggResult.brandMetrics} brand metrics, ${aggResult.promptMetrics} prompt metrics`)
  }

  // Broadcast pipeline_complete so dashboard auto-refreshes
  try {
    const channel = supabase.channel(`brand:${brandId}`)
    await channel.send({
      type: 'broadcast',
      event: 'pipeline_complete',
      payload: { brandId, processed: extractResult.processed, timestamp: new Date().toISOString() }
    })
    await supabase.removeChannel(channel)
    console.log(`📡 Broadcast pipeline_complete for brand ${brandId}`)
  } catch (broadcastErr) {
    console.warn('⚠️ Failed to broadcast pipeline_complete:', broadcastErr)
  }
}
