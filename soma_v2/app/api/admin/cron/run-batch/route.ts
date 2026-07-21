import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { runForBrand } from '@/lib/services/run-runner'
import { LLMRunOrchestrator } from '@/lib/services/llm-run-orchestrator'

export const maxDuration = 300 // 5 minutes

// Maximum brands to process per cron run to avoid timeout
const MAX_BRANDS_PER_RUN = 5

// Time window in milliseconds - 24 hours
const ONE_DAY_MS = 24 * 60 * 60 * 1000

const JOB_NAME = 'daily-run'

// Helper to log cron runs
async function logCronRun(
  supabase: ReturnType<typeof createServiceClient>,
  logId: string,
  data: {
    status: 'started' | 'completed' | 'failed' | 'skipped'
    completed_at?: string
    duration_ms?: number
    brands_checked?: number
    brands_needed_run?: number
    brands_processed?: number
    brands_successful?: number
    brands_failed?: number
    brands_remaining?: number
    results?: any[]
    error_message?: string
    error_details?: any
    metadata?: any
  }
) {
  try {
    if (data.status === 'started') {
      // Insert new log
      await supabase.from('cron_logs').insert({
        id: logId,
        job_name: JOB_NAME,
        status: data.status,
        started_at: new Date().toISOString(),
        metadata: data.metadata || {}
      })
    } else {
      // Update existing log
      await supabase.from('cron_logs').update({
        status: data.status,
        completed_at: data.completed_at || new Date().toISOString(),
        duration_ms: data.duration_ms,
        brands_checked: data.brands_checked,
        brands_needed_run: data.brands_needed_run,
        brands_processed: data.brands_processed,
        brands_successful: data.brands_successful,
        brands_failed: data.brands_failed,
        brands_remaining: data.brands_remaining,
        results: data.results || [],
        error_message: data.error_message,
        error_details: data.error_details
      }).eq('id', logId)
    }
  } catch (error) {
    console.error('[CRON] Failed to log cron run:', error)
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log('[CRON] Unauthorized request - invalid or missing CRON_SECRET')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const logId = crypto.randomUUID()
  let supabase: ReturnType<typeof createServiceClient>
  
  console.log('[CRON] Daily run cron job started at', new Date().toISOString())

  try {
    supabase = createServiceClient()

    // Log the start of this cron run
    await logCronRun(supabase, logId, { 
      status: 'started',
      metadata: { trigger: 'vercel_cron', max_brands: MAX_BRANDS_PER_RUN }
    })

    // Fetch active brands that are not paused for auto-runs
    // Only include brands with selected prompts (user_prompts with is_selected = true)
    const { data: brands, error } = await supabase
      .from('brands')
      .select(`
        id,
        name,
        auto_run_paused,
        runs:runs(created_at)
      `)
      .or('auto_run_paused.is.null,auto_run_paused.eq.false')
      .limit(100)

    if (error) {
      console.error('[CRON] Error fetching brands:', error)
      await logCronRun(supabase, logId, {
        status: 'failed',
        duration_ms: Date.now() - startTime,
        error_message: 'Failed to fetch brands from database',
        error_details: { error: error.message, code: error.code }
      })
      throw error
    }

    console.log(`[CRON] Found ${brands?.length || 0} active brands (auto_run not paused)`)

    const now = new Date()
    
    // Filter brands that haven't run run in the last 24 hours
    const brandsToRun = (brands || []).filter(brand => {
      // Skip if auto-run is paused (double-check)
      if (brand.auto_run_paused) return false
      
      const runs = brand.runs || []
      
      // Sort by created_at descending to get most recent
      runs.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      
      const lastSim = runs[0]
      
      // If no previous run, include this brand
      if (!lastSim) {
        console.log(`[CRON] Brand "${brand.name}" has no previous runs - will run`)
        return true
      }
      
      const lastDate = new Date(lastSim.created_at)
      const timeSinceLastRun = now.getTime() - lastDate.getTime()
      const needsRun = timeSinceLastRun > ONE_DAY_MS
      
      if (needsRun) {
        console.log(`[CRON] Brand "${brand.name}" last ran ${Math.round(timeSinceLastRun / (60 * 60 * 1000))} hours ago - will run`)
      }
      
      return needsRun
    })

    console.log(`[CRON] ${brandsToRun.length} brands need run (last run > 24 hours ago)`)

    if (brandsToRun.length === 0) {
      const duration = Date.now() - startTime
      
      // Log skipped run (no brands needed run)
      await logCronRun(supabase, logId, {
        status: 'skipped',
        duration_ms: duration,
        brands_checked: brands?.length || 0,
        brands_needed_run: 0,
        brands_processed: 0,
        brands_successful: 0,
        brands_failed: 0,
        brands_remaining: 0,
        results: [],
        metadata: { reason: 'No brands need run at this time' }
      })
      
      return NextResponse.json({ 
        success: true,
        message: 'No brands need run at this time',
        checked_brands: brands?.length || 0,
        duration_ms: duration,
        log_id: logId
      })
    }

    // Process up to MAX_BRANDS_PER_RUN brands per cron run
    const brandsToProcess = brandsToRun.slice(0, MAX_BRANDS_PER_RUN)
    const results: Array<{ brand: string; brandId: string; success: boolean; error?: string; run_id?: string }> = []

    for (const brand of brandsToProcess) {
      try {
        console.log(`[CRON] Starting run for brand: ${brand.name} (${brand.id})`)
        
        const result = await runForBrand(brand.id)
        
        results.push({
          brand: brand.name,
          brandId: brand.id,
          success: true,
          run_id: result.run_id
        })
        
        console.log(`[CRON] ✅ Run started for ${brand.name}: ${result.run_id}`)
        
      } catch (brandError) {
        const errorMessage = brandError instanceof Error ? brandError.message : 'Unknown error'
        console.error(`[CRON] ❌ Failed to run run for ${brand.name}:`, errorMessage)
        
        results.push({
          brand: brand.name,
          brandId: brand.id,
          success: false,
          error: errorMessage
        })
        
        // Continue to next brand even if this one fails
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length
    const duration = Date.now() - startTime

    console.log(`[CRON] Job completed in ${duration}ms - Success: ${successCount}, Failed: ${failureCount}, Remaining: ${brandsToRun.length - brandsToProcess.length}`)

    // Broadcast pipeline_complete for all successfully processed brands
    const succeededBrandIds = results.filter(r => r.success).map(r => r.brandId)
    after(async () => {
      const svc = createServiceClient()
      for (const bid of succeededBrandIds) {
        await LLMRunOrchestrator.broadcastPipelineComplete(svc, bid, { source: 'cron-batch' })
      }
    })

    // Log completed run
    await logCronRun(supabase, logId, {
      status: failureCount === brandsToProcess.length ? 'failed' : 'completed',
      duration_ms: duration,
      brands_checked: brands?.length || 0,
      brands_needed_run: brandsToRun.length,
      brands_processed: brandsToProcess.length,
      brands_successful: successCount,
      brands_failed: failureCount,
      brands_remaining: brandsToRun.length - brandsToProcess.length,
      results
    })

    return NextResponse.json({
      success: true,
      summary: {
        total_checked: brands?.length || 0,
        needed_run: brandsToRun.length,
        processed: brandsToProcess.length,
        remaining: brandsToRun.length - brandsToProcess.length,
        successful: successCount,
        failed: failureCount
      },
      results,
      duration_ms: duration,
      log_id: logId
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error('[CRON] Critical error:', error)
    
    // Log failed run
    if (supabase!) {
      await logCronRun(supabase, logId, {
        status: 'failed',
        duration_ms: duration,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_details: { 
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : undefined
        }
      })
    }
    
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown',
      duration_ms: duration,
      log_id: logId
    }, { status: 500 })
  }
}
