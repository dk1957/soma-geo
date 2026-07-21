import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const SYSTEM_ACCOUNT_ID = 'a0000000-0000-4000-a000-000000000001'

/**
 * POST /api/free-audit/claim
 * Link a free audit report to a user's account after signup.
 *
 * If the audit used the provisioning pipeline (has provisional_brand_id),
 * transfers the brand + all its storage data to the user's account.
 * Storage files stay at their original paths — no re-upload needed.
 *
 * For truly legacy audits (no provisional brand), stores responses
 * properly in Supabase Storage via LLMResponseStorage.
 */

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { accessToken } = await request.json()
    if (!accessToken || !/^[a-f0-9]{64}$/.test(accessToken)) {
      return NextResponse.json({ error: 'Invalid access token' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Get user's account
    const { data: accountUser } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!accountUser) {
      return NextResponse.json({ error: 'No account found' }, { status: 404 })
    }

    // Look up the report BEFORE claiming so we can check for provisional brand
    const { data: auditReport } = await supabase
      .from('free_audit_reports')
      .select('id, provisional_brand_id, audit_results, brand_name, created_at, competitors')
      .eq('access_token', accessToken)
      .is('claimed_at', null)
      .eq('is_active', true)
      .single()

    if (!auditReport) {
      return NextResponse.json({ error: 'Report not found, already claimed, or expired' }, { status: 404 })
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', user.clerkUserId)
      .maybeSingle()

    let brandId: string

    if (auditReport.provisional_brand_id) {
      // ── NEW FLOW: Transfer provisional brand (reuse same Storage files) ──
      console.log(`🔄 Claim: transferring provisional brand ${auditReport.provisional_brand_id} to account ${accountUser.account_id}`)

      const { error: transferErr } = await supabase.rpc('transfer_brand_to_account', {
        p_brand_id: auditReport.provisional_brand_id,
        p_from_account_id: SYSTEM_ACCOUNT_ID,
        p_to_account_id: accountUser.account_id,
        p_profile_id: profile?.id || null,
      })

      if (transferErr) {
        console.error('Brand transfer failed:', transferErr)
        return NextResponse.json({ error: 'Failed to transfer brand data' }, { status: 500 })
      }

      brandId = auditReport.provisional_brand_id
      console.log(`✅ Claim: brand ${brandId} transferred — storage files reused at original paths`)

      // Create workspace for the transferred brand if none exists
      const { data: existingWorkspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('brand_id', brandId)
        .maybeSingle()

      if (!existingWorkspace) {
        const workspaceSlug = auditReport.brand_name
          .toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 40)
          + '-' + crypto.randomBytes(4).toString('hex')

        const { data: workspace } = await supabase
          .from('workspaces')
          .insert({
            account_id: accountUser.account_id,
            brand_id: brandId,
            name: `${auditReport.brand_name} workspace`,
            slug: workspaceSlug,
            is_default: true,
          })
          .select('id')
          .maybeSingle()

        if (workspace) {
          await supabase.from('workspace_users').insert({
            workspace_id: workspace.id,
            clerk_id: user.clerkUserId,
            role: 'admin',
            joined_at: new Date(),
          })
        }
      }

    } else {
      // ── LEGACY FLOW: Store responses properly via LLMResponseStorage ──
      // Get or use user's first brand
      const { data: existingBrand } = await supabase
        .from('brands')
        .select('id')
        .eq('account_id', accountUser.account_id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()

      brandId = existingBrand?.id || ''

      if (brandId && profile?.id) {
        const rawResponses = auditReport.audit_results?.raw_responses as Array<{
          raw_response: string
          model_name: string
          prompt_text: string
          extracted_citations?: Array<{ domain: string; url: string; title: string }>
          response_time_ms: number | null
          token_usage: Record<string, number>
        }> | undefined

        if (rawResponses?.length) {
          try {
            const { LLMResponseStorage } = await import('@/lib/services/llm-response-storage')
            const fileStorage = new LLMResponseStorage(supabase)

            const runId = crypto.randomUUID()
            const createdAt = auditReport.created_at || new Date().toISOString()

            // Create run record
            await supabase.from('runs').insert({
              id: runId,
              profile_id: profile.id,
              account_id: accountUser.account_id,
              brand_id: brandId,
              prompt_count: new Set(rawResponses.map(r => r.prompt_text)).size,
              model_count: new Set(rawResponses.map(r => r.model_name)).size,
              total_jobs: rawResponses.length,
              completed_jobs: rawResponses.length,
              failed_jobs: 0,
              status: 'completed',
              total_cost: 0,
              brand_context: { source: 'free_audit_legacy', brand_name: auditReport.brand_name },
              run_date: createdAt.split('T')[0],
              created_at: createdAt,
              completed_at: createdAt,
            })

            // Build unique prompt IDs
            const uniquePrompts = [...new Set(rawResponses.map(r => r.prompt_text))]
            const promptIdMap = new Map<string, string>()
            for (const text of uniquePrompts) {
              promptIdMap.set(text, crypto.randomUUID())
            }

            // Store via LLMResponseStorage (proper Supabase Storage + DB)
            const llmResponses = rawResponses.map(r => ({
              id: crypto.randomUUID(),
              run_id: runId,
              prompt_id: promptIdMap.get(r.prompt_text) || crypto.randomUUID(),
              profile_id: profile!.id,
              account_id: accountUser.account_id,
              brand_id: brandId,
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

            const storageResult = await fileStorage.batchStoreResponses(llmResponses as any)
            console.log(`💾 Legacy claim: ${storageResult.stored} stored in Storage, ${storageResult.failed} failed`)

            // Write manifest for consistency with dashboard engine
            if (storageResult.records.length > 0) {
              await fileStorage.writeManifest(accountUser.account_id, brandId, runId, storageResult.records)
            }

            // Trigger extraction + aggregation pipeline (non-blocking)
            triggerExtractionPipeline(accountUser.account_id, brandId).catch(err => {
              console.error('⚠️ AEO extraction pipeline error (non-blocking):', err)
            })
          } catch (storageErr) {
            console.error('Legacy claim storage error (non-blocking):', storageErr)
          }
        }
      }
    }

    // Claim the report (update ownership)
    await supabase
      .from('free_audit_reports')
      .update({
        account_id: accountUser.account_id,
        brand_id: brandId || null,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', auditReport.id)
      .is('claimed_at', null)

    return NextResponse.json({ success: true, reportId: auditReport.id, brandId })

  } catch (error) {
    console.error('Free audit claim error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Trigger AEO extraction + aggregation pipeline (non-blocking).
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
