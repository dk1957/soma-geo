/**
 * GSEO Content Optimization API
 * =============================
 * 
 * RESTful API for content creation, optimization, and evaluation
 * using the MACO multi-agent system.
 * 
 * Endpoints:
 * - POST /api/v1/content/gseo - Create new content
 * - POST /api/v1/content/gseo/optimize - Start optimization
 * - GET /api/v1/content/gseo/:id - Get content details
 * - GET /api/v1/content/gseo/:id/status - Get optimization status
 * - PUT /api/v1/content/gseo/:id - Update content
 * - POST /api/v1/content/gseo/:id/publish - Publish content
 * - GET /api/v1/content/gseo/:id/evaluations - Get evaluations
 * - GET /api/v1/content/gseo/:id/history - Get version history
 */

import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { z } from 'zod'
import { getMACOSystem } from '@/lib/services/maco-system'
import { gseoBaselineOptimizer, BaselineMethod } from '@/lib/services/gseo-baseline-strategies'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

// Helper to detect missing gseo_content table errors from PostgREST/Supabase
function isMissingGseoTableError(err: any) {
  if (!err) return false
  const msg = err.message || ''
  const code = err.code || ''
  return code === 'PGRST205' || msg.includes("Could not find the table 'public.gseo_content'") || msg.includes('gseo_content')
}
// ========================================
// Request Schemas
// ========================================

const CreateContentSchema = z.object({
  brand_id: z.string().uuid(),
  title: z.string().min(1),
  content: z.string().min(10),
  content_type: z.enum(['article', 'blog_post', 'whitepaper', 'guide', 'case_study', 'faq', 'landing_page']),
  source_type: z.enum(['manual', 'upload', 'url', 'generated']).optional(),
  source_url: z.string().url().optional(),
  source_file_name: z.string().optional(),
  source_materials: z.array(z.any()).optional(),
  target_audience: z.string().optional(),
  content_goals: z.array(z.string()).optional(),
  brand_voice: z.object({
    tone: z.string(),
    style_guidelines: z.array(z.string()),
    key_messages: z.array(z.string()),
    avoid_terms: z.array(z.string()).optional()
  }).optional(),
  target_keywords: z.array(z.string()).optional(),
  target_platforms: z.array(z.string()).optional()
})

const StartOptimizationSchema = z.object({
  content_id: z.string().uuid(),
  optimization_strategy: z.enum(['conservative', 'balanced', 'aggressive', 'comprehensive']).default('balanced'),
  max_iterations: z.number().min(1).max(5).default(3),
  num_benchmark_queries: z.number().min(5).max(10).default(5),
  use_baseline_method: z.enum([
    'fluent', 'simple_language', 'technical_terms', 'authoritative',
    'more_quotes', 'citing_sources', 'statistics', 'unique_words', 'keyword_stuffing'
  ]).optional(),
  run_mode: z.boolean().optional().default(false)
})

const UpdateContentSchema = z.object({
  content_id: z.string().uuid(),
  title: z.string().optional(),
  content: z.string().optional(),
  target_audience: z.string().optional(),
  content_goals: z.array(z.string()).optional(),
  brand_voice: z.object({
    tone: z.string(),
    style_guidelines: z.array(z.string()),
    key_messages: z.array(z.string()),
    avoid_terms: z.array(z.string()).optional()
  }).optional(),
  target_keywords: z.array(z.string()).optional(),
  target_platforms: z.array(z.string()).optional(),
  status: z.enum(['draft', 'optimizing', 'reviewing', 'approved', 'published', 'archived']).optional()
})

const PublishContentSchema = z.object({
  content_id: z.string().uuid(),
  publish_url: z.string().url()
})

// ========================================
// Helper Functions
// ========================================

async function checkUserAccess(clerkUserId: string, brandId: string, supabaseClient?: ReturnType<typeof createServiceClient>): Promise<boolean> {
  try {
    const supabase = supabaseClient || createServiceClient()
    
    // First get the brand with its account_id
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('account_id')
      .eq('id', brandId)
      .single()
    
    if (brandError || !brand) {
      console.error('Brand not found:', brandError)
      return false
    }
    
    // Then check if user has access to this account
    const { data: accountUser, error: accessError } = await supabase
      .from('account_users')
      .select('clerk_id')
      .eq('account_id', brand.account_id)
      .eq('clerk_id', clerkUserId)
      .eq('is_active', true)
      .single()
    
    if (accessError || !accountUser) {
      console.error('User access check failed:', accessError)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error checking user access:', error)
    return false
  }
}

// ========================================
// POST - Create New Content
// ========================================

export async function POST(request: NextRequest) {
  const requestHeaders = await headers()
  const action = requestHeaders.get('x-action') || 'create'
  
  const user = await getCurrentUser()

  if (!user?.clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit GSEO content operations
  const limited = applyRateLimit(request, 'content:gseo', RATE_LIMITS.ai, user.clerkUserId)
  if (limited) return limited

  try {
    const body = await request.json()

    switch (action) {
      case 'create':
        return await handleCreateContent(body, user.clerkUserId)
      case 'optimize':
        return await handleStartOptimization(body, user.clerkUserId)
      case 'publish':
        return await handlePublishContent(body, user.clerkUserId)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('GSEO API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleCreateContent(body: any, clerkUserId: string) {
  const validatedData = CreateContentSchema.parse(body)
  
  // Check brand access
  const hasAccess = await checkUserAccess(clerkUserId, validatedData.brand_id)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServiceClient()
  
  // Get account_id from brand
  const { data: brand } = await supabase
    .from('brands')
    .select('account_id')
    .eq('id', validatedData.brand_id)
    .single()
  
  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
  }

  // Create content record
  const { data: content, error: createError } = await supabase
    .from('gseo_content')
    .insert({
      clerk_id: clerkUserId,
      account_id: brand.account_id,
      brand_id: validatedData.brand_id,
      title: validatedData.title,
      content_type: validatedData.content_type,
      original_content: validatedData.content,
      original_format: 'markdown',
      source_type: validatedData.source_type || 'manual',
      source_url: validatedData.source_url,
      source_file_name: validatedData.source_file_name,
      source_materials: validatedData.source_materials || [],
      target_audience: validatedData.target_audience,
      content_goals: validatedData.content_goals || [],
      brand_voice: validatedData.brand_voice || {},
      target_keywords: validatedData.target_keywords || [],
      target_platforms: validatedData.target_platforms || ['chatgpt', 'claude', 'gemini', 'perplexity'],
      status: 'draft'
    })
    .select()
    .single()

  if (createError) {
    console.error('Error creating content:', createError)
    if (isMissingGseoTableError(createError)) {
      return NextResponse.json({ error: 'gseo_content table not found. Please run DB migrations to enable content features.' }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to create content' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    content
  })
}

async function handleStartOptimization(body: any, clerkUserId: string) {
  console.log('📥 Start optimization request body:', JSON.stringify(body, null, 2))
  const validatedData = StartOptimizationSchema.parse(body)
  console.log('✅ Validated data - max_iterations:', validatedData.max_iterations)
  
  const supabase = createServiceClient()
  
  // Get content and check access
  const { data: content, error: contentError } = await supabase
    .from('gseo_content')
    .select('*, brands!inner(account_id, accounts!inner(account_users!inner(user_id)))')
    .eq('id', validatedData.content_id)
    .single()
  if (contentError) {
    if (isMissingGseoTableError(contentError)) {
      return NextResponse.json({ error: 'gseo_content table not found. Please run DB migrations.' }, { status: 500 })
    }
    return NextResponse.json({ error: 'Content not found' }, { status: 404 })
  }

  if (!content) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 })
  }

  // Check user has access
  const hasAccess = content.brands.accounts.account_users.some(
    (au: any) => au.clerk_id === clerkUserId
  )
  
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Update status to optimizing
  await supabase
    .from('gseo_content')
    .update({ status: 'optimizing' })
    .eq('id', validatedData.content_id)

  // Create optimization session
  const { data: session } = await supabase
    .from('gseo_optimization_sessions')
    .insert({
      content_id: validatedData.content_id,
      session_status: 'active',
      current_iteration: 0,
      max_iterations: validatedData.max_iterations
    })
    .select()
    .single()

  // Start optimization in background
  // In production, this would be a background job/queue
  setImmediate(async () => {
    try {
      if (validatedData.run_mode) {
        await runRunOptimization(
          validatedData.content_id,
          validatedData.max_iterations,
          session.id
        )
      } else if (validatedData.use_baseline_method) {
        await runBaselineOptimization(
          validatedData.content_id,
          validatedData.use_baseline_method as BaselineMethod,
          session.id
        )
      } else {
        await runMACOOptimization(
          validatedData.content_id,
          validatedData.max_iterations,
          validatedData.num_benchmark_queries,
          session.id
        )
      }
    } catch (error) {
      console.error('Optimization error:', error)
      
      // Update both session and content status on failure
      const supabase = createServiceClient()
      await Promise.all([
        supabase
          .from('gseo_optimization_sessions')
          .update({ 
            session_status: 'failed',
            session_end: new Date().toISOString()
          })
          .eq('id', session.id),
        supabase
          .from('gseo_content')
          .update({ status: 'draft' })
          .eq('id', validatedData.content_id)
      ])
    }
  })

  return NextResponse.json({
    success: true,
    session_id: session.id,
    message: 'Optimization started',
    estimated_duration: `${validatedData.max_iterations * 2}-${validatedData.max_iterations * 3} minutes`
  })
}

async function runRunOptimization(
  contentId: string,
  maxIterations: number,
  sessionId: string
) {
  const supabase = createServiceClient()
  
  // Get content
  const { data: contentData } = await supabase
    .from('gseo_content')
    .select('*')
    .eq('id', contentId)
    .single()

  if (!contentData) {
    throw new Error('Content not found')
  }

  // Simulate iterations with delays
  for (let i = 1; i <= maxIterations; i++) {
    // Simulate processing time (1 second per iteration)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const currentScore = 50 + (i * 10) + (Math.random() * 5)
    
    // Update session progress
    await supabase
      .from('gseo_optimization_sessions')
      .update({
        current_iteration: i,
        current_score: Math.min(currentScore, 98)
      })
      .eq('id', sessionId)

    // Create a simulated history record
    const { data: historyRecord } = await supabase
      .from('gseo_optimization_history')
      .insert({
        content_id: contentId,
        version_number: i,
        content_text: contentData.original_content + `\n\n[Simulated Optimization Iteration ${i}]\nAdded more relevant keywords and improved structure.`,
        change_summary: `Iteration ${i}: Improved keyword density and readability.`,
        change_rationale: 'Simulated improvement for testing purposes.',
        agent_suggestions: ['Add more keywords', 'Improve structure'],
        optimizing_agent: 'simulator',
        pre_optimization_score: 50 + ((i-1) * 10),
        post_optimization_score: Math.min(currentScore, 98)
      })
      .select()
      .single()

    // Create simulated evaluations
    await supabase
      .from('gseo_evaluations')
      .insert({
        content_id: contentId,
        history_id: historyRecord.id,
        evaluator_model: 'simulator',
        citation_prominence: Math.min(4 + (i * 1), 9),
        citation_prominence_justification: 'Simulated high visibility.',
        attribution_accuracy: 8 + (Math.random() * 2),
        attribution_accuracy_justification: 'Sources are correctly cited.',
        faithfulness: 9 + (Math.random()),
        faithfulness_justification: 'Content remains true to facts.',
        key_info_coverage: 7 + (i * 0.5),
        key_info_coverage_justification: 'Covers most key points.',
        semantic_contribution: 6 + (i * 0.8),
        semantic_contribution_justification: 'Adds significant value.',
        answer_dominance: 5 + (i * 1.2),
        answer_dominance_justification: 'Dominates the answer space.',
        overall_score: Math.min(currentScore, 98),
        attribution_mechanics_score: 8.5,
        content_fidelity_score: 9.0,
        semantic_dominance_score: 7.5,
        generated_answer: 'This is a simulated answer generated by the AI engine.',
        sources_cited: ['Source A', 'Source B']
      })
  }

  // Finalize
  await supabase
    .from('gseo_content')
    .update({
      optimized_content: contentData.original_content + `\n\n[Final Simulated Version]\nOptimized for maximum visibility.`,
      optimization_version: maxIterations,
      status: 'reviewing'
    })
    .eq('id', contentId)

  await supabase
    .from('gseo_optimization_sessions')
    .update({
      session_status: 'completed',
      session_end: new Date().toISOString(),
      best_score: 95,
      current_score: 95
    })
    .eq('id', sessionId)
}

async function runMACOOptimization(
  contentId: string,
  maxIterations: number,
  numQueries: number,
  sessionId: string
) {
  const supabase = createServiceClient()
  
  // Get content
  const { data: contentData } = await supabase
    .from('gseo_content')
    .select('*')
    .eq('id', contentId)
    .single()

  if (!contentData) {
    throw new Error('Content not found')
  }

  // Prepare content for MACO
  const content = {
    id: contentData.id,
    title: contentData.title,
    content: contentData.original_content,
    format: contentData.original_format as 'markdown' | 'html' | 'plain_text',
    brandId: contentData.brand_id,
    targetAudience: contentData.target_audience,
    contentGoals: contentData.content_goals,
    targetKeywords: contentData.target_keywords,
    targetPlatforms: contentData.target_platforms,
    brandVoice: contentData.brand_voice
  }

  // Run MACO optimization
  const maco = await getMACOSystem()
  const trajectory = await maco.optimizeContent(content, {
    numQueries,
    maxIterations,
    onIteration: async (iteration, score) => {
      // Update session progress
      await supabase
        .from('gseo_optimization_sessions')
        .update({
          current_iteration: iteration,
          current_score: score
        })
        .eq('id', sessionId)
    },
    onComplete: async (finalTrajectory) => {
      // Store all versions and evaluations
      for (let i = 0; i < finalTrajectory.versions.length; i++) {
        const version = finalTrajectory.versions[i]
        const evals = finalTrajectory.evaluations.get(i) || []
        
        // Store version
        const { data: historyRecord } = await supabase
          .from('gseo_optimization_history')
          .insert({
            content_id: contentId,
            version_number: i,
            content_text: version.content,
            change_summary: version.changeSummary,
            change_rationale: version.changeRationale,
            agent_suggestions: version.suggestionsApplied,
            optimizing_agent: 'editor',
            pre_optimization_score: version.preOptimizationScore,
            post_optimization_score: version.postOptimizationScore
          })
          .select()
          .single()
        
        // Store evaluations
        for (const evaluation of evals) {
          await supabase
            .from('gseo_evaluations')
            .insert({
              content_id: contentId,
              history_id: historyRecord.id,
              evaluator_model: 'llama-3.3-70b-versatile',
              citation_prominence: evaluation.citationProminence,
              citation_prominence_justification: evaluation.citationProminenceJustification,
              attribution_accuracy: evaluation.attributionAccuracy,
              attribution_accuracy_justification: evaluation.attributionAccuracyJustification,
              faithfulness: evaluation.faithfulness,
              faithfulness_justification: evaluation.faithfulnessJustification,
              key_info_coverage: evaluation.keyInfoCoverage,
              key_info_coverage_justification: evaluation.keyInfoCoverageJustification,
              semantic_contribution: evaluation.semanticContribution,
              semantic_contribution_justification: evaluation.semanticContributionJustification,
              answer_dominance: evaluation.answerDominance,
              answer_dominance_justification: evaluation.answerDominanceJustification,
              overall_score: evaluation.overallScore,
              attribution_mechanics_score: evaluation.attributionMechanicsScore,
              content_fidelity_score: evaluation.contentFidelityScore,
              semantic_dominance_score: evaluation.semanticDominanceScore,
              generated_answer: evaluation.generatedAnswer,
              sources_cited: evaluation.sourcesCited
            })
        }
      }
      
      // Update content with best version
      const bestVersion = finalTrajectory.versions[finalTrajectory.selectedVersion]
      const bestVersionEvals = finalTrajectory.evaluations.get(finalTrajectory.selectedVersion) || []
      const avgScore = bestVersionEvals.reduce((sum, e) => sum + e.overallScore, 0) / bestVersionEvals.length
      
      await supabase
        .from('gseo_content')
        .update({
          optimized_content: bestVersion.content,
          optimization_version: finalTrajectory.selectedVersion,
          status: 'reviewing'
        })
        .eq('id', contentId)
      
      // Update session
      await supabase
        .from('gseo_optimization_sessions')
        .update({
          session_status: 'completed',
          session_end: new Date().toISOString(),
          best_score: avgScore,
          current_score: avgScore
        })
        .eq('id', sessionId)
    }
  })
}

async function runBaselineOptimization(
  contentId: string,
  method: BaselineMethod,
  sessionId: string
) {
  const supabase = createServiceClient()
  
  // Get content
  const { data: contentData } = await supabase
    .from('gseo_content')
    .select('*')
    .eq('id', contentId)
    .single()

  if (!contentData) {
    throw new Error('Content not found')
  }

  // Apply baseline method
  const result = await gseoBaselineOptimizer.optimize(
    contentData.original_content,
    method,
    {
      targetKeywords: contentData.target_keywords,
      industry: contentData.content_type,
      targetAudience: contentData.target_audience
    }
  )

  // Store version
  await supabase
    .from('gseo_optimization_history')
    .insert({
      content_id: contentId,
      version_number: 1,
      content_text: result.optimizedContent,
      change_summary: result.changesSummary,
      optimizing_agent: 'baseline',
      baseline_method: method
    })

  // Update content
  await supabase
    .from('gseo_content')
    .update({
      optimized_content: result.optimizedContent,
      optimization_version: 1,
      status: 'reviewing'
    })
    .eq('id', contentId)

  // Update session
  await supabase
    .from('gseo_optimization_sessions')
    .update({
      session_status: 'completed',
      session_end: new Date().toISOString()
    })
    .eq('id', sessionId)
}

async function handlePublishContent(body: any, clerkUserId: string) {
  const validatedData = PublishContentSchema.parse(body)
  
  const supabase = createServiceClient()
  
  // Get content and check access
  const { data: content } = await supabase
    .from('gseo_content')
    .select('*, brands!inner(account_id, accounts!inner(account_users!inner(user_id)))')
    .eq('id', validatedData.content_id)
    .single()

  if (!content) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 })
  }

  const hasAccess = content.brands.accounts.account_users.some(
    (au: any) => au.clerk_id === clerkUserId
  )
  
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Update content
  const { error: updateError } = await supabase
    .from('gseo_content')
    .update({
      status: 'published',
      published_url: validatedData.publish_url,
      published_at: new Date().toISOString()
    })
    .eq('id', validatedData.content_id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to publish content' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: 'Content published successfully'
  })
}

// ========================================
// GET - Retrieve Content & Status
// ========================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const contentId = searchParams.get('content_id')
  const brandId = searchParams.get('brand_id')
  const action = searchParams.get('action') || 'get'

  const user = await getCurrentUser()

  if (!user?.clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    switch (action) {
      case 'get':
        if (!contentId) {
          return NextResponse.json({ error: 'content_id required' }, { status: 400 })
        }
        return await getContent(contentId, user.clerkUserId)
      
      case 'list':
        if (!brandId) {
          return NextResponse.json({ error: 'brand_id required' }, { status: 400 })
        }
        return await listContent(brandId, user.clerkUserId)
      
      case 'status':
        if (!contentId) {
          return NextResponse.json({ error: 'content_id required' }, { status: 400 })
        }
        return await getOptimizationStatus(contentId, user.clerkUserId)
      
      case 'evaluations':
        if (!contentId) {
          return NextResponse.json({ error: 'content_id required' }, { status: 400 })
        }
        return await getEvaluations(contentId, user.clerkUserId)
      
      case 'history':
        if (!contentId) {
          return NextResponse.json({ error: 'content_id required' }, { status: 400 })
        }
        return await getVersionHistory(contentId, user.clerkUserId)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('GSEO API GET error:', error)
    console.error('Action:', action, 'ContentId:', contentId, 'BrandId:', brandId)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

async function getContent(contentId: string, clerkUserId: string) {
  const supabase = createServiceClient()
  
  const { data: content, error } = await supabase
    .from('gseo_content')
    .select('*')
    .eq('id', contentId)
    .single()
  if (error) {
    if (isMissingGseoTableError(error)) {
      return NextResponse.json({ error: 'gseo_content table not found. Please run DB migrations.' }, { status: 500 })
    }
    return NextResponse.json({ error: 'Content not found' }, { status: 404 })
  }

  if (!content) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 })
  }

  // Check access
  const hasAccess = await checkUserAccess(clerkUserId, content.brand_id)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ content })
}

async function listContent(brandId: string, clerkUserId: string) {
  try {
    console.log('📋 Listing content for brand:', brandId, 'user:', clerkUserId)
    
    // Check access
    const hasAccess = await checkUserAccess(clerkUserId, brandId)
    if (!hasAccess) {
      console.log('❌ Access denied for user:', clerkUserId, 'brand:', brandId)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createServiceClient()
    
    const { data: contents, error } = await supabase
      .from('gseo_content')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
    if (error) {
      // Handle case where the gseo_content table does not exist in the database/schema cache
      const message = error?.message || ''
      const code = (error as any)?.code
      if (code === 'PGRST205' || message.includes("Could not find the table 'public.gseo_content'") || message.includes('gseo_content')) {
        // Return an empty list and a friendly warning so the UI can continue to work
        return NextResponse.json({
          contents: [],
          warning: 'gseo_content table not found in the database. Run the pending migration to create it.'
        })
      }

      console.error('❌ Database error fetching content:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch content',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ contents: contents || [] })
  } catch (error) {
    console.error('❌ Unexpected error in listContent:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function getOptimizationStatus(contentId: string, clerkUserId: string) {
  const supabase = createServiceClient()
  
  const { data: content, error: contentFetchError } = await supabase
    .from('gseo_content')
    .select('brand_id, status')
    .eq('id', contentId)
    .single()

  if (contentFetchError) {
    if (isMissingGseoTableError(contentFetchError)) {
      return NextResponse.json({ error: 'gseo_content table not found. Please run DB migrations.' }, { status: 500 })
    }
    return NextResponse.json({ error: 'Content not found' }, { status: 404 })
  }

  if (!content) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 })
  }

  const hasAccess = await checkUserAccess(clerkUserId, content.brand_id)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get latest session
  const { data: session } = await supabase
    .from('gseo_optimization_sessions')
    .select('*')
    .eq('content_id', contentId)
    .order('session_start', { ascending: false })
    .limit(1)
    .maybeSingle()

  // If content is stuck in optimizing but session is failed/completed, fix the status
  if (content.status === 'optimizing' && session) {
    if (session.session_status === 'failed') {
      await supabase
        .from('gseo_content')
        .update({ status: 'draft' })
        .eq('id', contentId)
      
      content.status = 'draft'
    } else if (session.session_status === 'completed') {
      await supabase
        .from('gseo_content')
        .update({ status: 'reviewing' })
        .eq('id', contentId)
      
      content.status = 'reviewing'
    }
  }

  return NextResponse.json({
    status: content.status,
    session: session || null
  })
}

async function getEvaluations(contentId: string, clerkUserId: string) {
  const supabase = createServiceClient()
  
  const { data: content, error: contentFetchError2 } = await supabase
    .from('gseo_content')
    .select('brand_id')
    .eq('id', contentId)
    .single()

  if (contentFetchError2) {
    if (isMissingGseoTableError(contentFetchError2)) {
      return NextResponse.json({ error: 'gseo_content table not found. Please run DB migrations.' }, { status: 500 })
    }
    return NextResponse.json({ error: 'Content not found' }, { status: 404 })
  }

  if (!content) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 })
  }

  const hasAccess = await checkUserAccess(clerkUserId, content.brand_id)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: evaluations, error } = await supabase
    .from('gseo_evaluations')
    .select('*')
    .eq('content_id', contentId)
    .order('evaluated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch evaluations' }, { status: 500 })
  }

  return NextResponse.json({ evaluations })
}

async function getVersionHistory(contentId: string, clerkUserId: string) {
  const supabase = createServiceClient()
  
  const { data: content, error: contentFetchError3 } = await supabase
    .from('gseo_content')
    .select('brand_id')
    .eq('id', contentId)
    .single()

  if (contentFetchError3) {
    if (isMissingGseoTableError(contentFetchError3)) {
      return NextResponse.json({ error: 'gseo_content table not found. Please run DB migrations.' }, { status: 500 })
    }
    return NextResponse.json({ error: 'Content not found' }, { status: 404 })
  }

  if (!content) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 })
  }

  const hasAccess = await checkUserAccess(clerkUserId, content.brand_id)
  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: history, error } = await supabase
    .from('gseo_optimization_history')
    .select('*')
    .eq('content_id', contentId)
    .order('version_number', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }

  return NextResponse.json({ history })
}

// ========================================
// PUT - Update Content
// ========================================

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser()
  const supabase = createServiceClient()

  if (!user?.clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = UpdateContentSchema.parse(body)
    
    // Get content and check access
    const { data: content, error: contentFetchError } = await supabase
      .from('gseo_content')
      .select('brand_id')
      .eq('id', validatedData.content_id)
      .single()

    if (contentFetchError) {
      if (isMissingGseoTableError(contentFetchError)) {
        return NextResponse.json({ error: 'gseo_content table not found. Please run DB migrations.' }, { status: 500 })
      }
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    const hasAccess = await checkUserAccess(user.clerkUserId, content.brand_id)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (validatedData.title) updateData.title = validatedData.title
    if (validatedData.content) updateData.original_content = validatedData.content
    if (validatedData.target_audience) updateData.target_audience = validatedData.target_audience
    if (validatedData.content_goals) updateData.content_goals = validatedData.content_goals
    if (validatedData.brand_voice) updateData.brand_voice = validatedData.brand_voice
    if (validatedData.target_keywords) updateData.target_keywords = validatedData.target_keywords
    if (validatedData.target_platforms) updateData.target_platforms = validatedData.target_platforms
    if (validatedData.status) updateData.status = validatedData.status

    // Update content
    const { error: updateError } = await supabase
      .from('gseo_content')
      .update(updateData)
      .eq('id', validatedData.content_id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update content' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Content updated successfully'
    })
  } catch (error) {
    console.error('GSEO API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete content and all related data
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const supabase = createServiceClient()
    
    // Get user
    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get content_id from query params
    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('content_id')

    if (!contentId) {
      return NextResponse.json({ error: 'Content ID required' }, { status: 400 })
    }

    // Get content to check ownership
    const { data: content, error: fetchError } = await supabase
      .from('gseo_content')
      .select('brand_id')
      .eq('id', contentId)
      .single()

    if (fetchError) {
      if (isMissingGseoTableError(fetchError)) {
        return NextResponse.json({ error: 'gseo_content table not found. Please run DB migrations.' }, { status: 500 })
      }
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    // Check user access
    const hasAccess = await checkUserAccess(user.clerkUserId, content.brand_id, supabase)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete related data first (cascading delete)
    // Note: If you have ON DELETE CASCADE in your schema, this is automatic
    // Otherwise, delete manually:
    await supabase.from('gseo_optimization_sessions').delete().eq('content_id', contentId)
    await supabase.from('gseo_optimization_history').delete().eq('content_id', contentId)
    await supabase.from('gseo_evaluations').delete().eq('content_id', contentId)
    await supabase.from('gseo_benchmarks').delete().eq('content_id', contentId)

    // Delete the content
    const { error: deleteError } = await supabase
      .from('gseo_content')
      .delete()
      .eq('id', contentId)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Content deleted successfully'
    })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
