import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { JobsService } from '@/lib/services/jobs-service';
import PureGroundTruthCollector, { BrandContext, GroundTruthResult, GroundTruthQuestion } from '@/lib/services/ground-truth-collector';

/**
 * Store ground truth research data in the proper research tables
 * (NOT in Jobs system tables which are for LLM responses only)
 */
async function storeGroundTruthCollection(
  supabase: SupabaseClient,
  clerkUserId: string,
  brandId: string | null,
  originalBrandContext: BrandContext,
  questions: GroundTruthQuestion[],
  collectionType: 'quick' | 'comprehensive'
) {
  // Use original brand context values, not potentially modified ones during collection
  // Use clerk_id instead of user_id for Clerk authentication
  const insertData = {
    clerk_id: clerkUserId,
    brand_id: brandId,
    brand_name: originalBrandContext.brandName,
    markets: originalBrandContext.markets,
    business_category: originalBrandContext.businessCategory,
    business_categories: originalBrandContext.businessCategories || [originalBrandContext.businessCategory],
    products_services: originalBrandContext.productsServices ? [originalBrandContext.productsServices] : [],
    competitors: originalBrandContext.competitors || [],
    website: originalBrandContext.website,
    collection_type: collectionType,
    total_questions: questions.length,
    questions_data: questions,
    metadata: {
      collection_source: 'jobs_research_api',
      timestamp: new Date().toISOString()
    }
  };
  
  console.log('🔍 Ground truth collection insert data:', JSON.stringify(insertData, null, 2));
  console.log('🚀 BRAND RESEARCH DEBUG: Storing with original brand context');
  
  // Store main collection record
  const { data: collection, error: collectionError } = await supabase
    .from('ground_truth_collections')
    .insert(insertData)
    .select('id')
    .single();

  if (collectionError) {
    console.error('Error storing ground truth collection:', collectionError);
    throw new Error(`Failed to store research data: ${collectionError.message}`);
  }

  console.log(`✅ Stored ground truth collection: ${collection.id}`);
  
  return {
    collection_id: collection.id,
    questions_count: questions.length
  };
}

/**
 * Generic Brand Research API Endpoint
 * ===================================
 * 
 * This endpoint creates a Job record for brand research and integrates with
 * the existing ground truth collection services. Can be used from:
 * - Onboarding flow
 * - Dashboard brand research
 * - Manual research requests
 * 
 * Flow:
 * 1. Create Job record for brand research
 * 2. Execute ground truth collection via PureGroundTruthCollector
 * 3. Store all results in Jobs system (responses, metrics)
 * 4. Return Job ID and summary for tracking
 */

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const supabase = createServiceClient();

    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's account ID
    const { data: accountUser, error: accountError } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('clerk_id', user.clerkUserId)
      .eq('is_active', true)
      .single();

    const userAccountId = accountUser?.account_id;

    // Enhanced error handling for JSON parsing
    let body;
    try {
      const rawBody = await request.text();
      console.log('🔍 Raw request body length:', rawBody.length);
      console.log('🔍 Raw request body preview:', rawBody.substring(0, 200));

      if (!rawBody || rawBody.trim().length === 0) {
        console.error('❌ Empty request body received');
        return NextResponse.json(
          { error: 'Request body is empty. Please provide brand research data.' },
          { status: 400 }
        );
      }

      body = JSON.parse(rawBody);
      console.log('✅ Successfully parsed JSON body with keys:', Object.keys(body));
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('❌ Request headers:', Object.fromEntries(request.headers.entries()));
      return NextResponse.json(
        { error: 'Invalid JSON in request body. Please check your data format.' },
        { status: 400 }
      );
    }

    const { 
      brandName, 
      markets, 
      businessCategory, 
      businessCategories,
      brandTopics, // Brand topics - key areas AI should know about (from onboarding)
      productsServices: rawProductsServices, 
      competitors,
      website,
      quick = false,
      // Context fields (can be from onboarding or dashboard)
      auditId,
      brandId,
      workspaceId,
      formData,
      source = 'jobs' // 'onboarding' or 'dashboard' or 'jobs'
    } = body;

    // Use brandTopics as canonical source for products/services context
    const productsServices = (brandTopics && Array.isArray(brandTopics) && brandTopics.length > 0)
      ? brandTopics.join(', ')
      : rawProductsServices;

    // Validate required fields
    if (!brandName) {
      return NextResponse.json(
        { error: 'Brand name is required' },
        { status: 400 }
      );
    }

    if (!businessCategory && (!businessCategories || businessCategories.length === 0)) {
      return NextResponse.json(
        { error: 'Business category is required' },
        { status: 400 }
      );
    }

    if (!markets || !Array.isArray(markets) || markets.length === 0) {
      return NextResponse.json(
        { error: 'At least one market is required' },
        { status: 400 }
      );
    }

    console.log(`🚀 BRAND RESEARCH: Starting research for ${brandName} (source: ${source})`);
    console.log(`📊 Markets: ${markets.join(', ')}, Category: ${businessCategory || businessCategories[0]}`);

    // Create brand context for ground truth collection
    const brandContext: BrandContext = {
      brandName,
      markets,
      businessCategory: businessCategory || (businessCategories && businessCategories[0]) || 'general',
      businessCategories: businessCategories || (businessCategory ? [businessCategory] : []),
      productsServices: productsServices || 'products and services',
      competitors: competitors || [],
      website,
      userId: user.clerkUserId
    };

    // Create a copy of original brand context to prevent mutation during processing
    const originalBrandContext = { ...brandContext };

    // Validate that we have the required IDs
    if (!userAccountId) {
      return NextResponse.json(
        { error: 'User account not found. Please ensure you have a valid account.' },
        { status: 400 }
      );
    }

    // Create a Job for this ground truth collection task (use service role for DB operations)
    const jobsService = new JobsService(true); // Use service role
    const job = await jobsService.createJob({
      account_id: userAccountId,
      brand_id: brandId || null, // Use null instead of empty string for optional UUID
      job_category: 'discoverability',
      job_type: 'brand_audit',
      provider: 'pure_ground_truth_collector',
      model: 'serp_api',
      metadata: {
        user_id: user.clerkUserId,
        source: `brand_research_api_${source}`,
        endpoint: '/api/llm-run/jobs/research',
        brand_context: brandContext,
        collection_type: quick ? 'quick' : 'comprehensive',
        markets: markets,
        business_categories: businessCategories || [businessCategory],
        audit_id: auditId,
        workspace_id: workspaceId,
        form_data: formData,
        research_source: source
      }
    });

    console.log(`✅ Created Job for brand research: ${job.job_id}`);

    // Execute ground truth collection
    const collector = new PureGroundTruthCollector();
    let result: any;
    let finalCompetitors: string[];
    let discoveredCount: number;
    let collectionResult: any;

    try {
      const initialCompetitors = (competitors || []).flat().filter((c: any) => c && typeof c === 'string' && c.trim().length > 0);
      
      if (quick) {
        // Quick collection for immediate results
        console.log('⚡ Starting quick ground truth collection...');
        const questions = await collector.collectQuickGroundTruth(brandContext);
        
        finalCompetitors = (brandContext.competitors || []).flat().filter((c: any) => c && typeof c === 'string' && c.trim().length > 0);
        discoveredCount = finalCompetitors.length - initialCompetitors.length;
        
        result = {
          questions,
          totalQuestions: questions.length,
          brandContext,
          competitors: finalCompetitors,
          collectionType: 'quick'
        };

        // Store research data in ground_truth_collections table (NOT Jobs system tables)
        collectionResult = await storeGroundTruthCollection(
          supabase,
          user.clerkUserId,
          brandId,
          originalBrandContext,
          questions,
          'quick'
        );

        console.log(`✅ Quick collection completed: ${questions.length} questions, ${discoveredCount} new competitors`);
        console.log(`✅ Stored in ground_truth_collections: ${collectionResult.collection_id}`);

      } else {
        // Comprehensive collection
        console.log('🔍 Starting comprehensive ground truth collection...');
        const comprehensiveResult: GroundTruthResult = await collector.collectGroundTruth(brandContext);
        
        finalCompetitors = (brandContext.competitors || []).flat().filter((c: any) => c && typeof c === 'string' && c.trim().length > 0);
        discoveredCount = finalCompetitors.length - initialCompetitors.length;
        
        result = {
          ...comprehensiveResult,
          competitors: finalCompetitors,
          collectionType: 'comprehensive'
        };

        // Store research data in ground_truth_collections table (NOT Jobs system tables)
        collectionResult = await storeGroundTruthCollection(
          supabase,
          user.clerkUserId,
          brandId,
          originalBrandContext,
          result.questions || [],
          'comprehensive'
        );

        console.log(`✅ Comprehensive collection completed: ${comprehensiveResult.totalQuestions} questions, ${comprehensiveResult.highIntentQuestions} high-intent`);
        console.log(`✅ Comprehensive collection completed: ${comprehensiveResult.totalQuestions} questions, ${discoveredCount} new competitors`);
        console.log(`✅ Stored in ground_truth_collections: ${collectionResult.collection_id}`);
      }

      // Update job status to completed
      await jobsService.updateJobStatus(job.job_id, 'completed');

      console.log(`✅ Job ${job.job_id} completed successfully`);

      // Return response in format compatible with existing flows
      return NextResponse.json({
        success: true,
        job_id: job.job_id,
        collection_id: collectionResult?.collection_id,
        type: quick ? 'quick' : 'comprehensive',
        brandName,
        markets,
        result,
        questions: result.questions || [],
        totalQuestions: result.totalQuestions || result.questions?.length || 0,
        competitors: {
          initial: (competitors || []).flat().filter(Boolean),
          final: finalCompetitors,
          discovered: discoveredCount
        },
        message: `${quick ? 'Quick' : 'Comprehensive'} ground truth collection completed for ${brandName}${discoveredCount > 0 ? ` with ${discoveredCount} auto-discovered competitors` : ''}`,
        // Include summary for comprehensive results
        ...(result.qualityScore && {
          summary: {
            totalQuestions: result.totalQuestions,
            highIntentQuestions: result.highIntentQuestions,
            qualityScore: result.qualityScore,
            topSources: result.topSources,
            intentBreakdown: result.intentBreakdown
          }
        }),
        // Data flow confirmation
        data_flow: {
          jobs_system: `Job tracking record: ${job.job_id}`,
          research_data: `Ground truth collection: ${collectionResult?.collection_id}`,
          note: 'Research data stored in ground_truth_collections table, NOT Jobs system tables'
        }
      });

    } catch (collectionError) {
      // Update job status to failed
      await jobsService.updateJobStatus(job.job_id, 'failed', collectionError instanceof Error ? collectionError.message : 'Unknown collection error');
      
      console.error(`❌ Job ${job.job_id} failed:`, collectionError);
      throw collectionError;
    }

  } catch (error) {
    console.error('❌ Error in brand research:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to collect ground truth data',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'brand_research_error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('job_id');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const jobsService = new JobsService();

    if (jobId) {
      // Get specific job details
      const job = await jobsService.getJob(jobId);
      const responses = await jobsService.getJobResponses(jobId);
      const metrics = await jobsService.getJobMetrics(jobId);

      return NextResponse.json({
        success: true,
        job,
        responses,
        metrics
      });
    } else {
      // Get user's brand research jobs
      const jobs = await jobsService.getUserJobs(user.clerkUserId, {
        job_type: 'brand_audit',
        limit,
        offset
      });

      return NextResponse.json({
        success: true,
        jobs,
        hasMore: jobs.length === limit
      });
    }

  } catch (error) {
    console.error('Error fetching brand research jobs:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch brand research data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}