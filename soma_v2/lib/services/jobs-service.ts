// Core Jobs Service - Consolidated job management for visibility and discoverability
// File: /lib/services/jobs-service.ts

import { createClient as createClientSide } from '@/lib/supabase/client';
import { 
  Job, 
  JobCreateRequest, 
  JobStatus, 
  Response, 
  ResponseCreateRequest,
  Citation,
  CitationCreateRequest,
  BrandMention,
  BrandMentionCreateRequest,
  Metric,
  MetricCreateRequest,
  JobAnalysisResult,
  JobSummary,
  JobDetailsApiResponse
} from '@/lib/types/jobs';
import type { SupabaseClient } from '@supabase/supabase-js';

export class JobsService {
  constructor(private useServiceRole: boolean = false) {
    // Constructor now just stores the preference
  }

  private async getClient(): Promise<SupabaseClient> {
    if (this.useServiceRole && typeof window === 'undefined') {
      // Server-side: dynamically import server client only when needed
      try {
        const serverModule = await import('@/lib/supabase/server');
        return serverModule.createServiceClient();
      } catch (error) {
        console.warn('Failed to load server client, falling back to client-side:', error);
        return createClientSide();
      }
    } else {
      // Client-side or fallback: use client-side client
      return createClientSide();
    }
  }

  // Job Management
  async createJob(request: JobCreateRequest): Promise<Job> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('jobs')
      .insert([request])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create job: ${error.message}`);
    }

    return data;
  }

  async getJob(jobId: string): Promise<Job | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('job_id', jobId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get job: ${error.message}`);
    }

    return data;
  }

  async updateJobStatus(jobId: string, status: JobStatus, errorMessage?: string): Promise<void> {
    const supabase = await this.getClient();
    const updateData: any = { 
      status, 
      updated_at: new Date().toISOString() 
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('job_id', jobId);

    if (error) {
      throw new Error(`Failed to update job status: ${error.message}`);
    }
  }

  async getJobsByBrand(
    brandId: string, 
    accountId: string, 
    limit: number = 50,
    offset: number = 0
  ): Promise<Job[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('brand_id', brandId)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get jobs: ${error.message}`);
    }

    return data || [];
  }

  async getJobSummaries(
    brandId: string, 
    accountId: string,
    limit: number = 20
  ): Promise<JobSummary[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        job_id,
        job_category,
        job_type,
        status,
        created_at,
        completed_at,
        responses!inner(count),
        citations!inner(count),
        metrics(
          llm_visibility_index,
          sentiment_avg
        )
      `)
      .eq('brand_id', brandId)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get job summaries: ${error.message}`);
    }

    // Transform the data to match JobSummary interface
    return (data || []).map((job: any) => ({
      job_id: job.job_id,
      job_category: job.job_category,
      job_type: job.job_type,
      status: job.status,
      created_at: job.created_at,
      completed_at: job.completed_at,
      total_responses: job.responses?.length || 0,
      total_citations: job.citations?.length || 0,
      total_brand_mentions: 0,
      avg_sentiment: job.metrics?.[0]?.sentiment_avg,
      visibility_index: job.metrics?.[0]?.llm_visibility_index
    }));
  }

  // Response Management
  async createResponse(request: ResponseCreateRequest): Promise<Response> {
    const supabase = await this.getClient();
    // Calculate content length if extracted_content is provided
    const contentLength = request.extracted_content?.length || 0;
    
    const responseData = {
      ...request,
      content_length: contentLength
    };

    const { data, error } = await supabase
      .from('llm_response_files')
      .insert([responseData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create response: ${error.message}`);
    }

    return data;
  }

  async getResponsesByJob(jobId: string): Promise<Response[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('llm_response_files')
      .select('*')
      .eq('run_id', jobId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get responses: ${error.message}`);
    }

    return data || [];
  }

  // Citation Management
  async createCitation(request: CitationCreateRequest): Promise<Citation> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('citations')
      .insert([request])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create citation: ${error.message}`);
    }

    return data;
  }

  async createCitations(requests: CitationCreateRequest[]): Promise<Citation[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('citations')
      .insert(requests)
      .select();

    if (error) {
      throw new Error(`Failed to create citations: ${error.message}`);
    }

    return data || [];
  }

  async getCitationsByResponse(responseId: string): Promise<Citation[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('citations')
      .select('*')
      .eq('response_id', responseId)
      .order('relevance_score', { ascending: false });

    if (error) {
      throw new Error(`Failed to get citations: ${error.message}`);
    }

    return data || [];
  }

  // Metrics Management
  async createMetric(request: MetricCreateRequest): Promise<Metric> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('metrics')
      .insert([request])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create metric: ${error.message}`);
    }

    return data;
  }

  async getMetricsByJob(jobId: string): Promise<Metric[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('metrics')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get metrics: ${error.message}`);
    }

    return data || [];
  }

  // Complete Job Analysis
  async getJobAnalysis(jobId: string): Promise<JobAnalysisResult | null> {
    const job = await this.getJob(jobId);
    if (!job) return null;

    const [responses, citations, brandMentions, metrics] = await Promise.all([
      this.getResponsesByJob(jobId),
      this.getCitationsByJob(jobId),
      this.getBrandMentionsByJob(jobId),
      this.getMetricsByJob(jobId)
    ]);

    return {
      job,
      responses,
      citations,
      brand_mentions: brandMentions,
      metrics
    };
  }

  async getCitationsByJob(jobId: string): Promise<Citation[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('citations')
      .select(`
        *,
        responses!inner(job_id)
      `)
      .eq('responses.job_id', jobId)
      .order('relevance_score', { ascending: false });

    if (error) {
      throw new Error(`Failed to get citations by job: ${error.message}`);
    }

    return data || [];
  }

  async getBrandMentionsByJob(jobId: string): Promise<BrandMention[]> {
    // brand_mentions table was dropped — pending rebuild
    return []
  }

  // Job Details for API
  async getJobDetails(jobId: string): Promise<JobDetailsApiResponse | null> {
    const analysis = await this.getJobAnalysis(jobId);
    if (!analysis) return null;

    const { job, responses, metrics } = analysis;

    // Get brand mentions from dedicated table
    const brandMentions = await this.getBrandMentionsByJob(jobId);

    // Calculate summary statistics
    const totalResponses = responses.length;
    const avgResponseTime = responses.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / totalResponses || 0;
    const totalCitations = responses.reduce((sum, r) => sum + (r.citations?.length || 0), 0);
    const totalBrandMentions = brandMentions.length;

    // Calculate sentiment distribution
    const sentiments = responses
      .map(r => r.sentiment)
      .filter((s): s is number => s !== undefined && s !== null);
    
    const sentimentDistribution = {
      positive: sentiments.filter(s => s > 0.1).length,
      neutral: sentiments.filter(s => s >= -0.1 && s <= 0.1).length,
      negative: sentiments.filter(s => s < -0.1).length
    };

    return {
      job,
      responses,
      metrics: metrics[0] || {} as Metric,
      summary: {
        total_responses: totalResponses,
        avg_response_time: Math.round(avgResponseTime),
        total_citations: totalCitations,
        total_brand_mentions: totalBrandMentions,
        sentiment_distribution: sentimentDistribution
      }
    };
  }

  // Utility Methods
  async calculateVisibilityIndex(jobId: string): Promise<number> {
    const responses = await this.getResponsesByJob(jobId);
    if (responses.length === 0) return 0;

    // Simple calculation: average of brand mention counts weighted by model confidence
    const weightedScores = responses.map(response => {
      const mentionCount = response.brand_mentions?.length || 0;
      const confidence = response.confidence_score || 1.0;
      return mentionCount * confidence;
    });

    return weightedScores.reduce((sum, score) => sum + score, 0) / responses.length;
  }

  async updateJobTokensAndCost(jobId: string, tokens: number, cost: number): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await supabase
      .from('jobs')
      .update({ 
        total_tokens: tokens, 
        cost_estimate: cost,
        updated_at: new Date().toISOString()
      })
      .eq('job_id', jobId);

    if (error) {
      throw new Error(`Failed to update job tokens and cost: ${error.message}`);
    }
  }

  // Additional Methods for Onboarding Integration
  async getUserJobs(userId: string, options: {
    job_type?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Job[]> {
    const supabase = await this.getClient();
    
    let query = supabase
      .from('jobs')
      .select('*')
      .contains('metadata', { clerk_id: userId });

    if (options.job_type) {
      query = query.eq('job_type', options.job_type);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(options.offset || 0, (options.offset || 0) + (options.limit || 10) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch user jobs: ${error.message}`);
    }

    return data || [];
  }

  async getJobResponses(jobId: string): Promise<Response[]> {
    // Alias for getResponsesByJob for consistency
    return this.getResponsesByJob(jobId);
  }

  async getJobMetrics(jobId: string): Promise<Metric[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from('metrics')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch job metrics: ${error.message}`);
    }

    return data || [];
  }
}