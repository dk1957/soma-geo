import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const statusQuerySchema = z.object({
  run_id: z.string().optional(),
  brand_id: z.string().optional(),
  user_runs: z.boolean().optional()
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    
    // Check authentication
    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', user.clerkUserId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 })
    }

    const runId = searchParams.get('run_id')
    const brandId = searchParams.get('brand_id')
    const userRuns = searchParams.get('user_runs') === 'true'

    // New: Get latest run for a brand
    if (brandId && !runId) {
      const { data: run, error: simError } = await supabase
        .from('runs')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (simError) {
        return NextResponse.json({ 
          error: 'Failed to fetch run' 
        }, { status: 500 })
      }

      if (!run) {
        return NextResponse.json({ 
          success: true,
          run: null,
          message: 'No run found for this brand'
        })
      }

      // Use run record values
      const completedJobs = run.completed_jobs || 0
      const failedJobs = run.failed_jobs || 0
      const totalJobs = run.total_jobs || 0
      const runningJobs = Math.max(0, totalJobs - completedJobs - failedJobs)
      
      const progressPercentage = totalJobs > 0 ? Math.round((completedJobs + failedJobs) / totalJobs * 100) : 0
      const isComplete = run.status === 'completed' || run.status === 'failed'

      return NextResponse.json({
        success: true,
        run: {
          id: run.id,
          status: run.status,
          total_jobs: totalJobs,
          completed_jobs: completedJobs,
          failed_jobs: failedJobs,
          running_jobs: runningJobs,
          progress_percentage: progressPercentage,
          is_complete: isComplete,
          created_at: run.created_at,
          updated_at: run.completed_at
        }
      })
    }

    if (runId) {
      // Get specific run status with detailed progress
      const { data: run, error: simError } = await supabase
        .from('runs')
        .select('*')
        .eq('id', runId)
        .single()

      if (simError || !run) {
        return NextResponse.json({ 
          error: 'Run not found' 
        }, { status: 404 })
      }

      // Use run record values instead of counting responses
      const completedJobs = run.completed_jobs || 0
      const failedJobs = run.failed_jobs || 0
      const totalJobs = run.total_jobs || 0
      const runningJobs = Math.max(0, totalJobs - completedJobs - failedJobs)
      
      const progressPercentage = Math.round((completedJobs + failedJobs) / totalJobs * 100)
      const isComplete = run.status === 'completed' || run.status === 'failed'

      const statusCounts = {
        completed: completedJobs,
        failed: failedJobs,
        running: runningJobs
      }

      return NextResponse.json({
        success: true,
        run: {
          id: run.id,
          status: run.status,
          brand_contexts: { brand_name: 'Unbiased Run' }, // Generic name since no brand context
          progress: {
            total_jobs: totalJobs,
            completed_jobs: statusCounts.completed,
            failed_jobs: statusCounts.failed,
            running_jobs: statusCounts.running,
            cached_responses: 0, // Will be calculated separately if needed
            progress_percentage: progressPercentage,
            is_complete: isComplete,
            estimated_completion_time: null, // Not stored in current schema
            actual_duration: null // Not stored in current schema
          },
          created_at: run.created_at,
          updated_at: run.completed_at // Use completed_at as updated_at
        }
      })

    } else if (userRuns) {
      // Get all user's recent runs with summary
      const { data: runs, error: simsError } = await supabase
        .from('runs')
        .select('*')
        .eq('profile_id', user.clerkUserId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (simsError) {
        return NextResponse.json({ 
          error: 'Failed to fetch runs' 
        }, { status: 500 })
      }

      // Add progress info for each run
      const runsWithProgress = runs?.map(sim => {
        const progressPercentage = sim.total_jobs > 0 ? 
          Math.round((sim.completed_jobs + sim.failed_jobs) / sim.total_jobs * 100) : 0
        
        return {
          ...sim,
          progress_percentage: progressPercentage,
          is_complete: sim.status === 'completed' || sim.status === 'failed',
          duration: null // Not stored in current schema
        }
      }) || []

      return NextResponse.json({
        success: true,
        runs: runsWithProgress,
        summary: {
          total_runs: runsWithProgress.length,
          running_runs: runsWithProgress.filter(s => s.status === 'running').length,
          completed_runs: runsWithProgress.filter(s => s.status === 'completed').length,
          failed_runs: runsWithProgress.filter(s => s.status === 'failed').length
        }
      })

    } else {
      return NextResponse.json({ 
        error: 'Either run_id, brand_id, or user_runs=true must be provided' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Run status error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// PATCH endpoint to update run status (for system use)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    
    const updateSchema = z.object({
      run_id: z.string(),
      status: z.enum(['pending', 'running', 'completed', 'failed']).optional(), // Match database constraints
      completed_jobs: z.number().optional(),
      failed_jobs: z.number().optional(),
      total_cost: z.number().optional(),
      average_response_time_ms: z.number().optional()
    })

    const validatedData = updateSchema.parse(body)

    const { data, error } = await supabase
      .from('runs')
      .update({
        status: validatedData.status,
        completed_jobs: validatedData.completed_jobs,
        failed_jobs: validatedData.failed_jobs,
        total_cost: validatedData.total_cost,
        average_response_time_ms: validatedData.average_response_time_ms,
        completed_at: validatedData.status === 'completed' || validatedData.status === 'failed' ? 
          new Date().toISOString() : undefined
      })
      .eq('id', validatedData.run_id)
      .select()
      .single()

    if (error) {
      console.error('❌ Failed to update run:', error)
      return NextResponse.json({ 
        error: 'Failed to update run' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      run: data
    })

  } catch (error) {
    console.error('❌ Run update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}