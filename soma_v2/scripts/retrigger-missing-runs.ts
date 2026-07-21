/**
 * Re-trigger LLM simulations for runs that completed but never saved responses.
 * 
 * These are runs where `completed_jobs > 0` but no `llm_response_files` entries exist.
 * The original responses were lost (never persisted to Supabase Storage), so we
 * re-run fresh simulations using each brand's current prompts and selected models.
 * 
 * Usage:
 *   npx tsx scripts/retrigger-missing-runs.ts                    # Run all brands
 *   npx tsx scripts/retrigger-missing-runs.ts --brand=Nala       # Single brand
 *   npx tsx scripts/retrigger-missing-runs.ts --dry-run          # Preview only
 *   npx tsx scripts/retrigger-missing-runs.ts --use-all-prompts  # Use all prompts, not just selected
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { LLMRunOrchestrator } from '../lib/services/llm-run-orchestrator'

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
const useAllPrompts = args.includes('--use-all-prompts')
const brandFilter = getArg('brand', '')

interface BrandRunInfo {
  brandId: string
  brandName: string
  accountId: string
  profileId: string
  userId: string
  missingRunCount: number
  missingResponseCount: number
}

async function getMissingRunBrands(): Promise<BrandRunInfo[]> {
  // Find all runs with completed jobs but no response files
  const { data: missingRuns, error } = await supabase
    .from('runs')
    .select(`
      id,
      brand_id,
      account_id,
      profile_id,
      completed_jobs,
      brands!inner(name)
    `)
    .gt('completed_jobs', 0)

  if (error) throw new Error(`Failed to fetch runs: ${error.message}`)
  if (!missingRuns || missingRuns.length === 0) return []

  // Check which runs have no response files
  const runIds = missingRuns.map(r => r.id)
  const { data: responseFiles } = await supabase
    .from('llm_response_files')
    .select('run_id')
    .in('run_id', runIds)

  const runsWithFiles = new Set((responseFiles || []).map(f => f.run_id))
  const orphanRuns = missingRuns.filter(r => !runsWithFiles.has(r.id))

  if (orphanRuns.length === 0) return []

  // Group by brand
  const brandMap = new Map<string, BrandRunInfo>()
  for (const run of orphanRuns) {
    const brandName = (run as any).brands?.name || 'Unknown'
    if (!brandMap.has(run.brand_id)) {
      // Get profile's user_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', run.profile_id)
        .single()

      brandMap.set(run.brand_id, {
        brandId: run.brand_id,
        brandName,
        accountId: run.account_id,
        profileId: run.profile_id,
        userId: profile?.user_id || run.profile_id,
        missingRunCount: 0,
        missingResponseCount: 0
      })
    }
    const info = brandMap.get(run.brand_id)!
    info.missingRunCount++
    info.missingResponseCount += run.completed_jobs
  }

  return Array.from(brandMap.values())
}

async function getPromptsForBrand(brandId: string, accountId: string) {
  let query = supabase
    .from('user_prompts')
    .select(`
      id,
      prompt_text,
      intent_category,
      priority,
      locale,
      country:countries!user_prompts_locale_fkey(code, name)
    `)
    .eq('brand_id', brandId)

  if (!useAllPrompts) {
    query = query.eq('is_selected', true)
  }

  const { data, error } = await query.limit(20)
  if (error) throw new Error(`Failed to fetch prompts for brand ${brandId}: ${error.message}`)
  return data || []
}

async function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  RE-TRIGGER MISSING LLM SIMULATIONS')
  console.log('═══════════════════════════════════════════════════')
  
  if (isDryRun) console.log('  *** DRY RUN — no simulations will be executed ***')
  if (brandFilter) console.log(`  Brand filter: ${brandFilter}`)
  if (useAllPrompts) console.log('  Using ALL prompts (not just selected)')
  console.log('')

  // Find brands with missing responses
  let brands = await getMissingRunBrands()
  
  if (brandFilter) {
    brands = brands.filter(b => b.brandName.toLowerCase().includes(brandFilter.toLowerCase()))
  }

  if (brands.length === 0) {
    console.log('✅ No brands with missing responses found.')
    return
  }

  console.log(`Found ${brands.length} brand(s) with missing responses:\n`)
  for (const b of brands) {
    console.log(`  • ${b.brandName}: ${b.missingRunCount} runs, ~${b.missingResponseCount} lost responses`)
  }
  console.log('')

  // Process each brand
  let totalNewResponses = 0
  let totalFailed = 0

  for (const brand of brands) {
    console.log('───────────────────────────────────────────────────')
    console.log(`🏷️  ${brand.brandName}`)
    console.log('───────────────────────────────────────────────────')

    // Get prompts
    const prompts = await getPromptsForBrand(brand.brandId, brand.accountId)
    if (prompts.length === 0) {
      console.log(`  ⚠️ No ${useAllPrompts ? '' : 'selected '}prompts found. Skipping.`)
      continue
    }

    console.log(`  📋 ${prompts.length} prompts available`)

    // Format prompts
    const formattedPrompts = prompts.map(p => ({
      id: p.id,
      text: p.prompt_text,
      intent_category: p.intent_category || 'general',
      priority: p.priority || 5,
      locale: (p as any).country?.code,
      country_name: (p as any).country?.name
    }))

    // Get brand's selected models info
    const { data: brandData } = await supabase
      .from('brands')
      .select('selected_models')
      .eq('id', brand.brandId)
      .single()

    const modelNames = brandData?.selected_models || []
    console.log(`  🤖 Models: ${modelNames.join(', ')}`)
    console.log(`  📊 Expected jobs: ${prompts.length} prompts × ${modelNames.length} models = ${prompts.length * modelNames.length}`)

    if (isDryRun) {
      console.log('  ⏭️  Skipping execution (dry run)')
      continue
    }

    // Create orchestrator and run
    const orchestrator = new LLMRunOrchestrator({ supabase })

    try {
      console.log(`  🚀 Starting simulation...`)
      const startTime = Date.now()

      const result = await orchestrator.runRun({
        prompts: formattedPrompts,
        accountId: brand.accountId,
        brandId: brand.brandId,
        profileId: brand.profileId,
        userId: brand.userId,
        options: {
          use_cache: false,
          force_rerun: true
        }
      })

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(`  ✅ Completed in ${elapsed}s`)
      console.log(`     Run ID: ${result.runId}`)
      console.log(`     Jobs: ${result.completedJobs}/${result.totalJobs} completed, ${result.failedJobs} failed`)
      console.log(`     Cost: $${result.totalCost.toFixed(4)}`)
      if (result.averageResponseTime) {
        console.log(`     Avg response time: ${Math.round(result.averageResponseTime)}ms`)
      }

      totalNewResponses += result.completedJobs
      totalFailed += result.failedJobs

      // Dispose orchestrator to clean up timers
      orchestrator.dispose()
    } catch (error) {
      console.error(`  ❌ Run failed:`, error instanceof Error ? error.message : error)
      orchestrator.dispose()
    }

    console.log('')
  }

  // Summary
  console.log('═══════════════════════════════════════════════════')
  console.log('  SUMMARY')
  console.log('═══════════════════════════════════════════════════')
  console.log(`  New responses generated: ${totalNewResponses}`)
  console.log(`  Failed jobs: ${totalFailed}`)
  console.log('')
  
  if (totalNewResponses > 0) {
    console.log('  Next steps:')
    console.log('  1. Run AEO extraction: npx tsx scripts/process-all-responses.ts')
    console.log('  2. Run aggregator:     npx tsx scripts/run-aggregator.ts')
  }
}

main()
  .then(() => {
    console.log('\nDone.')
    process.exit(0)
  })
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
