/**
 * Process ALL pending responses through the AEO extraction pipeline.
 * Uses AI agents with the configured model (currently google/gemini-2.0-flash-001).
 *
 * Features:
 * - Processes in configurable batch sizes with progress reporting
 * - Speed benchmarking (tokens/sec, responses/min)
 * - Quality metrics (success rate, agent hit rate)
 * - Graceful handling of rate limits
 *
 * Usage: npx tsx scripts/process-all-responses.ts [--batch-size=50] [--limit=0] [--dry-run]
 *
 *   --batch-size=N   Responses per extractor call (default: 50)
 *   --limit=N        Total responses to process, 0 = all (default: 0)
 *   --dry-run        Count pending without processing
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Parse CLI args
const args = process.argv.slice(2)
const getArg = (name: string, defaultVal: string) => {
  const found = args.find(a => a.startsWith(`--${name}=`))
  return found ? found.split('=')[1] : defaultVal
}
const isDryRun = args.includes('--dry-run')
const BATCH_SIZE = parseInt(getArg('batch-size', '50'), 10)
const TOTAL_LIMIT = parseInt(getArg('limit', '0'), 10)

interface BatchResult {
  batchNum: number
  processed: number
  failed: number
  skipped: number
  durationMs: number
}

async function main() {
  // Count pending
  const { count: pendingCount } = await supabase
    .from('llm_response_files')
    .select('id', { count: 'exact', head: true })
    .in('extraction_status', ['pending', 'failed'])
    .eq('success', true)

  const total = pendingCount ?? 0
  const toProcess = TOTAL_LIMIT > 0 ? Math.min(TOTAL_LIMIT, total) : total

  console.log('═══════════════════════════════════════════════════')
  console.log('  AEO EXTRACTION PIPELINE — BATCH PROCESSOR')
  console.log('═══════════════════════════════════════════════════')
  console.log(`  Pending responses:  ${total}`)
  console.log(`  Will process:       ${toProcess}`)
  console.log(`  Batch size:         ${BATCH_SIZE}`)
  console.log(`  Est. batches:       ${Math.ceil(toProcess / BATCH_SIZE)}`)
  console.log(`  Dry run:            ${isDryRun}`)

  // Check what model is configured
  const { data: modelConfig } = await supabase
    .from('agent_model_configs')
    .select('agent_type, model_id')
    .eq('agent_type', 'analysis_brand_detector')
    .single()

  console.log(`  Model:              ${modelConfig?.model_id || 'default'}`)
  console.log('═══════════════════════════════════════════════════\n')

  if (isDryRun) {
    console.log('  Dry run — exiting without processing.')
    process.exit(0)
  }

  if (toProcess === 0) {
    console.log('  No pending responses. All done!')
    process.exit(0)
  }

  // Dynamically import the extractor
  const { AEOExtractorService } = await import('../lib/services/aeo-extractor')

  const allBatchResults: BatchResult[] = []
  let totalProcessed = 0
  let totalFailed = 0
  let totalSkipped = 0
  const overallStart = Date.now()
  let remaining = toProcess

  let batchNum = 0
  while (remaining > 0) {
    batchNum++
    const batchLimit = Math.min(BATCH_SIZE, remaining)

    console.log(`  ▶ Batch ${batchNum} — processing up to ${batchLimit} responses...`)
    const batchStart = Date.now()

    const extractor = new AEOExtractorService(supabase, true)
    const result = await extractor.processPendingResponses(batchLimit)

    const batchDuration = Date.now() - batchStart
    const batchResult: BatchResult = {
      batchNum,
      processed: result.processed,
      failed: result.failed,
      skipped: result.skipped,
      durationMs: batchDuration,
    }
    allBatchResults.push(batchResult)

    totalProcessed += result.processed
    totalFailed += result.failed
    totalSkipped += result.skipped
    remaining -= (result.processed + result.failed + result.skipped)

    const respPerSec = result.processed > 0 ? (result.processed / (batchDuration / 1000)).toFixed(2) : '0'
    const elapsed = ((Date.now() - overallStart) / 1000).toFixed(0)

    console.log(`    ✓ ${result.processed} processed, ${result.failed} failed, ${result.skipped} skipped`)
    console.log(`    ⏱ ${(batchDuration / 1000).toFixed(1)}s (${respPerSec} resp/s, ${elapsed}s total elapsed)`)
    console.log(`    📊 Progress: ${totalProcessed}/${toProcess} (${Math.round((totalProcessed / toProcess) * 100)}%)`)
    console.log()

    // If nothing was processed, there may be no more pending
    if (result.processed + result.failed + result.skipped === 0) {
      console.log('  ⚠ No responses returned — likely all processed.')
      break
    }

    // Brief pause between batches to avoid rate limits
    if (remaining > 0) {
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  // ─── Summary ────────────────────────────────────
  const totalDuration = Date.now() - overallStart
  const totalSecs = totalDuration / 1000

  console.log('═══════════════════════════════════════════════════')
  console.log('  FINAL RESULTS')
  console.log('═══════════════════════════════════════════════════')
  console.log(`  Total processed:    ${totalProcessed}`)
  console.log(`  Total failed:       ${totalFailed}`)
  console.log(`  Total skipped:      ${totalSkipped}`)
  console.log(`  Total duration:     ${totalSecs.toFixed(1)}s (${(totalSecs / 60).toFixed(1)} min)`)
  console.log(`  Avg rate:           ${(totalProcessed / totalSecs).toFixed(2)} resp/s`)
  console.log(`  Success rate:       ${totalProcessed > 0 ? Math.round((totalProcessed / (totalProcessed + totalFailed)) * 100) : 0}%`)

  // Agent-level metrics summary
  console.log('\n  ─── Agent Performance (this run) ─────────')
  const { data: agentMetrics } = await supabase
    .from('agent_run_metrics')
    .select('agent_type, model_id, success, duration_ms, prompt_tokens, completion_tokens')
    .gte('created_at', new Date(overallStart).toISOString())
    .order('created_at', { ascending: false })

  if (agentMetrics && agentMetrics.length > 0) {
    // Group by agent_type
    const byAgent = new Map<string, typeof agentMetrics>()
    for (const m of agentMetrics) {
      if (!byAgent.has(m.agent_type)) byAgent.set(m.agent_type, [])
      byAgent.get(m.agent_type)!.push(m)
    }

    for (const [agentType, metrics] of byAgent) {
      const successes = metrics.filter(m => m.success)
      const avgMs = successes.length > 0
        ? Math.round(successes.reduce((s, m) => s + m.duration_ms, 0) / successes.length)
        : 0
      const totalIn = successes.reduce((s, m) => s + (m.prompt_tokens || 0), 0)
      const totalOut = successes.reduce((s, m) => s + (m.completion_tokens || 0), 0)
      const model = metrics[0]?.model_id || 'unknown'

      console.log(`    ${agentType}:`)
      console.log(`      model: ${model}`)
      console.log(`      calls: ${successes.length}/${metrics.length} success`)
      console.log(`      avg latency: ${avgMs}ms`)
      console.log(`      tokens: ${totalIn} in / ${totalOut} out`)
    }
  }

  // Verify final counts
  const { count: newComplete } = await supabase
    .from('llm_response_files')
    .select('id', { count: 'exact', head: true })
    .eq('extraction_status', 'complete')

  const { count: responseDataCount } = await supabase
    .from('response_data')
    .select('id', { count: 'exact', head: true })

  const { count: citationCount } = await supabase
    .from('aeo_citations')
    .select('id', { count: 'exact', head: true })

  console.log('\n  ─── Pipeline Data Totals ─────────────────')
  console.log(`    Completed extractions: ${newComplete}`)
  console.log(`    Response data rows:    ${responseDataCount}`)
  console.log(`    Citation rows:         ${citationCount}`)
  console.log('═══════════════════════════════════════════════════\n')

  process.exit(totalFailed > totalProcessed ? 1 : 0)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
