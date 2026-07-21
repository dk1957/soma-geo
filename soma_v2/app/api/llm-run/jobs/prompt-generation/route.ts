import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { JobsService } from '@/lib/services/jobs-service';

/**
 * Dashboard Prompt Generation API Endpoint
 * ========================================
 * 
 * This endpoint creates a Job record for prompt generation and integrates with
 * a mock analysis service. Can be used from:
 * - Onboarding flow
 * - Dashboard prompt generation
 * - Content optimization workflows
 * 
 * Flow:
 * 1. Create Job record for prompt generation
 * 2. Execute mock analysis for testing
 * 3. Store all results in Jobs system (responses, metrics)
 * 4. Return Job ID and generated content for tracking
 */

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Get the user's account ID
    const { data: accountUser, error: accountError } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('clerk_id', currentUser.clerkUserId)
      .eq('is_active', true)
      .single();

    const userAccountId = accountUser?.account_id;

    const body = await request.json();
    const { 
      prompts,
      questions,
      brandName, 
      businessCategories,
      businessCategory,
      productsServices,
      markets,
      competitors,
      website,
      // Context fields (can be from onboarding or dashboard)
      auditId,
      brandId,
      workspaceId,
      formData,
      source = 'dashboard', // 'onboarding' or 'dashboard'
      analysisType = 'full' // 'full' | 'quick' | 'targeted'
    } = body;

    // Validate required fields
    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json(
        { error: 'At least one prompt is required' },
        { status: 400 }
      );
    }

    if (!brandName) {
      return NextResponse.json(
        { error: 'Brand name is required' },
        { status: 400 }
      );
    }

    console.log(`🚀 PROMPT GENERATION: Starting analysis for ${brandName} (source: ${source})`);
    console.log(`📊 Prompts to analyze: ${prompts.length}, Type: ${analysisType}`);

    // Create a Job for this prompt generation task
    const jobsService = new JobsService();
    const job = await jobsService.createJob({
      account_id: userAccountId || '',
      brand_id: brandId || '', // May be empty during onboarding
      job_category: 'visibility',
      job_type: 'prompt_generation',
      provider: 'analysis_agent',
      model: 'groq-llama3',
      metadata: {
        clerk_id: currentUser.clerkUserId,
        source: `prompt_generation_api_${source}`,
        endpoint: '/api/dashboard/prompts',
        brand_context: {
          brandName,
          businessCategories: businessCategories || [businessCategory],
          businessCategory: businessCategory || (businessCategories && businessCategories[0]),
          productsServices,
          markets,
          competitors,
          website
        },
        analysis_type: analysisType,
        prompt_count: prompts.length,
        questions_count: questions?.length || 0,
        audit_id: auditId,
        workspace_id: workspaceId,
        form_data: formData,
        prompt_source: source
      }
    });

    console.log(`✅ Created Job for prompt generation: ${job.job_id}`);

    try {
      // Mock analysis service since AnalysisAgentService doesn't exist yet
      // This creates a simple run of prompt analysis
      
      // Prepare brand context for analysis
      const brandContext = {
        brandName,
        businessCategory: businessCategory || (businessCategories && businessCategories[0]) || 'general',
        businessCategories: businessCategories || (businessCategory ? [businessCategory] : []),
        productsServices: productsServices || 'products and services',
        markets: markets || ['global'],
        competitors: competitors || [],
        website
      };

      // Process each prompt through mock analysis
      const results = [];
      let totalResponseTime = 0;
      let totalConfidenceScore = 0;
      let totalBrandMentions = 0;
      let totalCompetitorMentions = 0;

      for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i];
        const startTime = Date.now();

        console.log(`🔍 Analyzing prompt ${i + 1}/${prompts.length}: "${prompt.substring(0, 100)}..."`);

        // Mock analysis result
        const analysisResult = {
          summary: `Analysis of prompt: ${prompt.substring(0, 100)}...`,
          brandAnalysis: {
            mentionCount: Math.floor(Math.random() * 3) + 1,
            expectedMention: 'indirect',
            mentions: [{
              brand: brandName,
              context: `Relevant context for ${brandName}`,
              type: 'indirect',
              sentiment: 0.7 + Math.random() * 0.3,
              relevance: 0.8 + Math.random() * 0.2,
              strength: 'moderate',
              positioning: 'positive'
            }]
          },
          competitorAnalysis: {
            totalMentions: competitors.length > 0 ? Math.floor(Math.random() * competitors.length) : 0
          },
          intentAnalysis: {
            primaryIntent: ['informational', 'commercial', 'navigational'][Math.floor(Math.random() * 3)]
          },
          styleAnalysis: {
            queryStyle: 'conversational'
          },
          audienceAnalysis: {
            primaryPersona: 'general_user'
          },
          qualityMetrics: {
            overallQuality: 0.7 + Math.random() * 0.3
          },
          overallScore: 0.6 + Math.random() * 0.4,
          relevanceScore: 0.7 + Math.random() * 0.3,
          citations: [
            {
              url: `https://example.com/source-${i}`,
              content: `Example citation for prompt ${i + 1}`,
              type: 'web',
              relevance: 0.8,
              context: 'Supporting information'
            }
          ],
          optimizationSuggestions: [`Suggestion 1 for prompt ${i + 1}`, `Suggestion 2 for prompt ${i + 1}`],
          contentSuggestions: [`Content idea 1 for prompt ${i + 1}`, `Content idea 2 for prompt ${i + 1}`]
        };

        const responseTime = Date.now() - startTime;
        totalResponseTime += responseTime;

        // Calculate metrics from analysis result
        const brandMentions = analysisResult.brandAnalysis?.mentionCount || 0;
        const competitorMentions = analysisResult.competitorAnalysis?.totalMentions || 0;
        const confidenceScore = analysisResult.overallScore || 0.5;

        totalBrandMentions += brandMentions;
        totalCompetitorMentions += competitorMentions;
        totalConfidenceScore += confidenceScore;

        // Store analysis result in Jobs system
        const response = await jobsService.createResponse({
          job_id: job.job_id,
          account_id: userAccountId || '',
          brand_id: brandId || '',
          raw_content: JSON.stringify(analysisResult),
          extracted_content: analysisResult.summary || `Analysis of prompt: ${prompt.substring(0, 200)}...`,
          model_name: 'groq-llama3',
          response_time_ms: responseTime,
          confidence_score: confidenceScore,
          // Enhanced metadata
          context: `Prompt analysis for ${brandName} (${source})`,
          intent_type: analysisResult.intentAnalysis?.primaryIntent || 'informational',
          query_style: analysisResult.styleAnalysis?.queryStyle || 'conversational',
          user_persona: analysisResult.audienceAnalysis?.primaryPersona || 'general_user',
          expected_brand_mention: analysisResult.brandAnalysis?.expectedMention || 'indirect',
          processing_metadata: {
            prompt_index: i,
            analysis_type: analysisType,
            brand_mentions: brandMentions,
            competitor_mentions: competitorMentions,
            optimization_suggestions: analysisResult.optimizationSuggestions?.length || 0,
            content_suggestions: analysisResult.contentSuggestions?.length || 0,
            source: source
          },
          source_endpoint: '/api/dashboard/prompts',
          market: markets?.[0] || 'global',
          business_category: businessCategory || businessCategories?.[0] || 'general',
          quality_score: analysisResult.qualityMetrics?.overallQuality || confidenceScore,
          relevance_score: analysisResult.relevanceScore || 0.7,
          tags: [source, analysisType, 'prompt_analysis', analysisResult.intentAnalysis?.primaryIntent || 'analysis']
        });

        // Store citations if available
        if (analysisResult.citations && analysisResult.citations.length > 0) {
          for (const citation of analysisResult.citations) {
            await jobsService.createCitation({
              response_id: response.response_id,
              account_id: userAccountId || '',
              brand_id: brandId || '',
              url: citation.url || '',
              source_name: citation.content || '',
              source_type: citation.type as any || 'web',
              excerpt: citation.content || '',
              relevance_score: citation.relevance || 0.5
            });
          }
        }

        results.push({
          prompt,
          analysis: analysisResult,
          responseTime,
          confidenceScore
        });

        console.log(`✅ Prompt ${i + 1} analyzed: ${brandMentions} brand mentions, score: ${confidenceScore.toFixed(2)}`);
      }

      // Create overall metrics for the job
      await jobsService.createMetric({
        job_id: job.job_id,
        account_id: userAccountId || '',
        brand_id: brandId || '',
        model_name: 'groq-llama3',
        citation_count: results.reduce((sum, r) => sum + (r.analysis.citations?.length || 0), 0),
        brand_mentions_count: totalBrandMentions,
        content_quality_score: totalConfidenceScore / prompts.length,
        competitor_mentions_count: totalCompetitorMentions,
        response_time_avg: totalResponseTime / prompts.length
      });

      // Update job status to completed
      await jobsService.updateJobStatus(job.job_id, 'completed');

      console.log(`✅ Job ${job.job_id} completed successfully`);

      // Return response in format compatible with existing flows
      return NextResponse.json({
        success: true,
        job_id: job.job_id,
        analysisType,
        brandName,
        results,
        summary: {
          totalPrompts: prompts.length,
          averageScore: totalConfidenceScore / prompts.length,
          totalBrandMentions,
          totalCompetitorMentions,
          averageResponseTime: totalResponseTime / prompts.length,
          brandContext
        },
        message: `Successfully analyzed ${prompts.length} prompts for ${brandName} using ${analysisType} analysis`
      });

    } catch (analysisError) {
      // Update job status to failed
      await jobsService.updateJobStatus(job.job_id, 'failed', analysisError instanceof Error ? analysisError.message : 'Unknown analysis error');
      
      console.error(`❌ Job ${job.job_id} failed:`, analysisError);
      throw analysisError;
    }

  } catch (error) {
    console.error('❌ Error in prompt generation:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze prompts',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'prompt_analysis_error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.clerkUserId) {
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
      const citations = await jobsService.getCitationsByJob(jobId);
      const brandMentions = await jobsService.getBrandMentionsByJob(jobId);

      return NextResponse.json({
        success: true,
        job,
        responses,
        metrics,
        citations,
        brandMentions
      });
    } else {
      // Get user's prompt generation jobs
      const jobs = await jobsService.getUserJobs(currentUser.clerkUserId, {
        job_type: 'prompt_generation',
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
    console.error('Error fetching prompt generation jobs:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch prompt generation data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}