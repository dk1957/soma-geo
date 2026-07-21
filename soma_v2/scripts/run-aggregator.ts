/**
 * Run the AEO Aggregator across ALL dates that have extracted response data.
 * Populates daily_brand_metrics and daily_prompt_metrics tables.
 *
 * Usage: npx tsx scripts/run-aggregator.ts [--date=YYYY-MM-DD]
 *
 *   --date=YYYY-MM-DD   Aggregate a single date (default: all dates)
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Parse CLI args
const args = process.argv.slice(2)
const getArg = (name: string) => {
  const found = args.find(a => a.startsWith(`--${name}=`))
  return found ? found.split('=')[1] : null
}
const singleDate = getArg('date')

async function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  AEO AGGREGATOR — DAILY METRICS BUILDER')
  console.log('═══════════════════════════════════════════════════\n')

  const { AEOAggregatorService } = await import('../lib/services/aeo-aggregator')
  const aggregator = new AEOAggregatorService(supabase)

  let dates: string[]

  if (singleDate) {
    dates = [singleDate]
  } else {
    // Find all dates with completed extractions
    const { data, error } = await supabase
      .from('llm_response_files')
      .select('created_at')
      .eq('extraction_status', 'complete')
      .eq('success', true)

    if (error || !data) {
      console.error('Failed to query dates:', error)
      process.exit(1)
    }

    // Extract unique dates
    const dateSet = new Set(data.map(r => r.created_at.split('T')[0]))
    dates = [...dateSet].sort()
  }

  console.log(`  Dates to aggregate: ${dates.length}`)
  console.log(`  Range: ${dates[0]} → ${dates[dates.length - 1]}\n`)

  let totalBrand = 0
  let totalPrompt = 0
  const startTime = Date.now()

  for (const date of dates) {
    process.stdout.write(`  📊 ${date}... `)
    try {
      const result = await aggregator.aggregateForDate(date)
      totalBrand += result.brandMetrics
      totalPrompt += result.promptMetrics
      console.log(`${result.brandMetrics} brand, ${result.promptMetrics} prompt metrics`)
    } catch (err) {
      console.log(`❌ ${err instanceof Error ? err.message : err}`)
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log('\n═══════════════════════════════════════════════════')
  console.log('  AGGREGATION RESULTS')
  console.log('═══════════════════════════════════════════════════')
  console.log(`  Total brand metrics:  ${totalBrand}`)
  console.log(`  Total prompt metrics: ${totalPrompt}`)
  console.log(`  Duration:             ${duration}s`)

  // Verify
  const { count: brandCount } = await supabase
    .from('daily_brand_metrics')
    .select('id', { count: 'exact', head: true })

  const { count: promptCount } = await supabase
    .from('daily_prompt_metrics')
    .select('id', { count: 'exact', head: true })

  console.log(`\n  Verification:`)
  console.log(`    daily_brand_metrics rows:  ${brandCount}`)
  console.log(`    daily_prompt_metrics rows: ${promptCount}`)

  // Sample some metrics
  const { data: sample } = await supabase
    .from('daily_brand_metrics')
    .select('run_date, lvi_score, visibility_rate, share_of_voice, avg_sentiment, citation_rate, total_responses')
    .order('run_date', { ascending: false })
    .limit(5)

  if (sample && sample.length > 0) {
    console.log('\n  Latest brand metrics sample:')
    for (const m of sample) {
      console.log(`    ${m.run_date}: LVI=${m.lvi_score} Vis=${m.visibility_rate}% SOV=${m.share_of_voice}% Sent=${m.avg_sentiment} Cit=${m.citation_rate}% (${m.total_responses} resp)`)
    }
  }

  console.log('═══════════════════════════════════════════════════\n')
  process.exit(0)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
