import { createServiceClient } from '@/lib/supabase/server'

export interface BrandReportFilters {
  dateRangeStart?: string
  dateRangeEnd?: string
  models?: string[]
  regions?: string[]
  languages?: string[]
  queryCategories?: string[]
  includeVectorAnalysis?: boolean
  includeCompetitiveIntelligence?: boolean
}

export interface BrandMetrics {
  // Core GEO metrics
  avg_lvi_score: number
  total_analyses: number
  brand_mention_frequency: number
  sentiment_score: number
  competitive_advantage: number
  
  // Enhanced metrics
  share_of_voice: number
  citation_quality: number
  position_quality: number
  competitive_ranking: number
  discoverability_score: number
  
  // Vector insights
  response_clustering_insights?: any
  competitive_landscape_analysis?: any
  semantic_similarity_trends?: any
}

export class BrandReportingService {
  private supabase: any

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createServiceClient()
  }

  async generateBrandVisibilityReport(
    brandId: string, 
    userId: string, 
    filters: BrandReportFilters = {},
    reportType: string = 'brand_visibility'
  ) {
    try {
      console.log(`🎯 Generating enhanced brand visibility report for brand ${brandId}`)

      // Get brand data
      const { data: brand } = await this.supabase
        .from('brands')
        .select('*')
        .eq('id', brandId)
        .single()

      if (!brand) throw new Error('Brand not found')

      // Build date range filter - Try multiple table names for compatibility
      let geoAnalyses: any[] = []
      let geoError: any = null
      
      // Get actual LLM responses for this brand from llm_response_files
      const { data: rawAnalysisData, error: analysisError } = await this.supabase
        .from('llm_response_files')
        .select('id, model_name, model_provider, prompt_text, response_preview, storage_path, created_at, success')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (!analysisError && rawAnalysisData && rawAnalysisData.length > 0) {
        // Map to expected format from raw LLM response files
        geoAnalyses = rawAnalysisData.map((a: any) => ({
          id: a.id,
          lvi_score: 0,
          brand_mention_count: 0,
          unique_brands_count: 1,
          avg_brand_sentiment: 0,
          sentiment_differential: 0,
          avg_competitor_sentiment: 0,
          total_citations: 0,
          brand_citations: 0,
          rank_in_response: 99,
          confidence_score: 0,
          all_brands_mentioned: [],
          competitor_names: [],
          model_name: a.model_name || 'unknown',
          prompt_text: a.prompt_text || '',
          raw_response: a.response_preview || '',
          created_at: a.created_at,
          needs_improvement: false,
          improvement_areas: []
        }))
      }

      // If no data found, return empty report
      if (geoAnalyses.length === 0) {
        geoError = { message: 'No analysis data found' }
      }

      const analysisData = geoAnalyses || []
      const totalAnalyses = analysisData.length

      if (totalAnalyses === 0) {
        return await this.generateEmptyReport(brandId, userId, brand, filters, reportType)
      }

      // Calculate metrics directly from run responses
      const brandMentions = analysisData.filter((a: any) => a.brand_mention_count > 0).length
      const avgSentiment = analysisData.reduce((sum: number, a: any) => sum + (a.avg_brand_sentiment || 0), 0) / analysisData.length
      const totalCitations = analysisData.reduce((sum: number, a: any) => sum + (a.total_citations || 0), 0)
      
      const comprehensiveMetrics = {
        brandMentionRate: (brandMentions / totalAnalyses) * 100,
        avgSentimentScore: avgSentiment,
        totalCitations,
        avgRank: analysisData.reduce((sum: number, a: any) => sum + (a.rank_in_response || 99), 0) / analysisData.length,
        competitorPresence: analysisData.filter((a: any) => (a.competitor_names || []).length > 0).length,
        modelPerformance: this.groupByModel(analysisData),
        promptAnalysis: this.groupByPrompt(analysisData)
      }

      // Calculate core visibility metrics
      const coreMetrics = this.calculateCoreVisibilityMetrics(analysisData)

      // Vector analysis and competitive intelligence removed — will be rebuilt
      const vectorInsights = null
      const competitiveIntelligence = null

      // Analyze competitive landscape
      const competitiveAnalysis = this.analyzeCompetitiveLandscape(analysisData)

      // Calculate model performance
      const modelPerformance = this.calculateModelPerformance(analysisData)

      // Generate insights and recommendations
      const insights = this.generateInsights(coreMetrics, competitiveAnalysis, vectorInsights)
      const recommendations = this.generateRecommendations(coreMetrics, competitiveAnalysis, analysisData)

      // Create comprehensive report data - store complex data in JSONB columns
      const reportData = {
        clerk_id: userId,
        brand_id: brandId,
        account_id: brand.account_id,
        title: `Enhanced Brand Visibility Report - ${brand.name}`,
        description: `Comprehensive AI visibility analysis for ${brand.name} across ${totalAnalyses} LLM responses`,
        report_type: reportType,
        status: 'completed',
        date_range_start: filters.dateRangeStart,
        date_range_end: filters.dateRangeEnd,
        
        // Executive summary
        executive_summary: this.generateExecutiveSummary(brand.name, coreMetrics, totalAnalyses, competitiveAnalysis),
        
        // Summary statistics in dedicated columns
        overall_score: this.calculateOverallVisibilityScore(coreMetrics, competitiveAnalysis),
        visibility_score: coreMetrics.avg_lvi_score,
        mention_count: coreMetrics.total_brand_mentions,
        citation_count: coreMetrics.total_citations,
        competitor_count: competitiveAnalysis.unique_competitors.length,
        
        // Core findings in JSONB
        key_findings: {
          total_analyses: totalAnalyses,
          avg_lvi_score: coreMetrics.avg_lvi_score,
          total_brand_mentions: coreMetrics.total_brand_mentions,
          avg_sentiment: coreMetrics.avg_sentiment,
          competitive_advantage: coreMetrics.competitive_advantage,
          unique_competitors: competitiveAnalysis.unique_competitors.length,
          citation_performance: coreMetrics.citation_performance,
          ranking_performance: coreMetrics.ranking_performance
        },
        
        // All metrics and analysis data in metrics_data JSONB column
        metrics_data: {
          enhanced_metrics: comprehensiveMetrics,
          core_metrics: coreMetrics,
          competitive_analysis: competitiveAnalysis,
          model_performance: modelPerformance,
          vector_insights: vectorInsights,
          competitive_intelligence: competitiveIntelligence,
          strategic_insights: insights,
          data_quality: {
            total_analyses: totalAnalyses,
            confidence_threshold_met: analysisData.filter((a: any) => (a.confidence_score || 0) >= 0.7).length,
            needs_improvement_count: analysisData.filter((a: any) => a.needs_improvement).length,
            coverage_completeness: this.calculateCoverageCompleteness(analysisData)
          }
        },
        
        // Charts and visualization data in charts_data JSONB column
        charts_data: {
          lvi_timeline: this.generateLVITimeline(analysisData),
          sentiment_timeline: this.generateSentimentTimeline(analysisData),
          model_performance_chart: this.generateModelPerformanceChart(modelPerformance),
          competitive_landscape_chart: this.generateCompetitiveLandscapeChart(competitiveAnalysis),
          citation_analysis_chart: this.generateCitationAnalysisChart(analysisData)
        },
        
        // Recommendations array
        recommendations: recommendations,
        
        // Raw data for drill-down in raw_data JSONB column
        raw_data: {
          geo_analyses: analysisData.map((a: any) => ({
            id: a.id,
            lvi_score: a.lvi_score,
            brand_mentions: a.brand_mention_count,
            sentiment: a.avg_brand_sentiment,
            competitors: a.competitor_names?.length || 0,
            model: a.model_name,
            prompt_text: a.prompt_text,
            raw_response: a.raw_response,
            date: a.created_at
          })),
          visibility_grade: this.calculateVisibilityGrade(coreMetrics.avg_lvi_score),
          performance_trend: this.calculatePerformanceTrend(analysisData),
          generation_time_ms: Date.now(),
          enhanced_features_enabled: {
            vector_analysis: !!vectorInsights,
            competitive_intelligence: !!competitiveIntelligence,
            comprehensive_metrics: true,
            multi_model_analysis: true
          }
        },
        
        // Timestamps
        generated_at: new Date().toISOString(),
        is_public: false,
        views_count: 0,
        downloads_count: 0
      }

      // Store the report
      const { data: report, error: reportError } = await this.supabase
        .from('brand_reports')
        .insert(reportData)
        .select()
        .single()

      if (reportError) {
        console.error('❌ Error inserting report:', reportError)
        throw reportError
      }

      if (!report || !report.id) {
        console.error('❌ Report inserted but no ID returned:', report)
        throw new Error('Failed to get report ID after insert')
      }

      console.log(`✅ Enhanced brand visibility report generated with ID: ${report.id}`)
      return report

    } catch (error) {
      console.error('Error generating enhanced brand visibility report:', error)
      throw error
    }
  }

  async generateBrandMentionsReport(
    brandId: string,
    userId: string,
    filters: BrandReportFilters = {}
  ) {
    try {
      console.log(`📊 Generating enhanced brand mentions report for brand ${brandId}`)

      const { data: brand } = await this.supabase
        .from('brands')
        .select('*')
        .eq('id', brandId)
        .single()

      if (!brand) throw new Error('Brand not found')

      // brand_appearances table dropped — use empty mention data
      const rawAnalyses: any[] = []
      const mentionError = null
      // Map real column names to property names used by helper methods
      const analyses = rawAnalyses.map((a: any) => ({
        ...a,
        brand_mention_count: a.mention_count || 0,
        avg_brand_sentiment: a.sentiment || 0,
        rank_in_response: a.first_position || null,
        competitor_names: a.competitors_in_response || [],
        unique_brands_count: a.total_brands || 0
      }))
      const totalMentions = analyses.reduce((sum: number, a: any) => sum + (a.brand_mention_count || 0), 0)

      // Analyze mention patterns
      const mentionAnalysis = this.analyzeMentionPatterns(analyses)

      // Analyze positioning and ranking
      const positioningAnalysis = this.analyzePositioning(analyses)

      // Calculate mention trends
      const trends = this.calculateMentionTrends(analyses)

      const reportData = {
        clerk_id: userId,
        brand_id: brandId,
        title: `Enhanced Brand Mentions Report - ${brand.name}`,
        description: `Detailed brand mention analysis for ${brand.name} across ${analyses.length} AI responses`,
        report_type: 'enhanced_brand_mentions',
        status: 'completed',
        date_range_start: filters.dateRangeStart,
        date_range_end: filters.dateRangeEnd,

        executive_summary: `${brand.name} received ${totalMentions} total mentions across ${analyses.length} AI responses, with an average sentiment of ${mentionAnalysis.avg_sentiment.toFixed(2)} and ${mentionAnalysis.positive_mention_rate.toFixed(1)}% positive mention rate.`,

        key_findings: {
          total_mentions: totalMentions,
          total_responses: analyses.length,
          mention_frequency: totalMentions / Math.max(1, analyses.length),
          avg_sentiment: mentionAnalysis.avg_sentiment,
          positive_mention_rate: mentionAnalysis.positive_mention_rate,
          avg_ranking: positioningAnalysis.avg_ranking,
          top_position_rate: positioningAnalysis.top_position_rate
        },

        mention_analysis: mentionAnalysis,
        positioning_analysis: positioningAnalysis,
        trend_analysis: trends,

        charts_data: {
          mention_frequency_timeline: this.generateMentionFrequencyChart(analyses),
          sentiment_distribution: this.generateSentimentDistributionChart(analyses),
          ranking_distribution: this.generateRankingDistributionChart(analyses),
          model_mention_comparison: this.generateModelMentionChart(analyses)
        },

        raw_data: { mention_analyses: analyses },
        overall_score: this.calculateMentionScore(mentionAnalysis, positioningAnalysis),
        generated_at: new Date().toISOString()
      }

      const { data: report, error } = await this.supabase
        .from('brand_reports')
        .insert(reportData)
        .select('*')
        .single()

      if (error) throw error
      return report

    } catch (error) {
      console.error('Error generating enhanced brand mentions report:', error)
      throw error
    }
  }

  // Helper methods for calculations

  private calculateCoreVisibilityMetrics(analysisData: any[]): any {
    const totalAnalyses = analysisData.length
    
    return {
      avg_lvi_score: analysisData.reduce((sum, a) => sum + (a.lvi_score || 0), 0) / totalAnalyses,
      total_brand_mentions: analysisData.reduce((sum, a) => sum + (a.brand_mention_count || 0), 0),
      avg_sentiment: analysisData.reduce((sum, a) => sum + (a.avg_brand_sentiment || 0), 0) / totalAnalyses,
      competitive_advantage: analysisData.reduce((sum, a) => sum + (a.sentiment_differential || 0), 0) / totalAnalyses,
      citation_performance: {
        total_citations: analysisData.reduce((sum, a) => sum + (a.total_citations || 0), 0),
        brand_citations: analysisData.reduce((sum, a) => sum + (a.brand_citations || 0), 0),
        citation_rate: analysisData.length > 0 ? 
          analysisData.reduce((sum, a) => sum + (a.brand_citations || 0), 0) / 
          Math.max(1, analysisData.reduce((sum, a) => sum + (a.total_citations || 0), 0)) : 0
      },
      ranking_performance: {
        avg_ranking: analysisData.filter(a => a.rank_in_response).length > 0 ?
          analysisData.filter(a => a.rank_in_response).reduce((sum, a) => sum + a.rank_in_response, 0) /
          analysisData.filter(a => a.rank_in_response).length : null,
        top_3_appearances: analysisData.filter(a => a.rank_in_response && a.rank_in_response <= 3).length,
        ranking_coverage: analysisData.filter(a => a.rank_in_response).length / totalAnalyses
      }
    }
  }

  private analyzeCompetitiveLandscape(analysisData: any[]): any {
    const allCompetitors = new Set<string>()
    const competitorCounts: Record<string, number> = {}
    
    analysisData.forEach(analysis => {
      if (analysis.competitor_names) {
        analysis.competitor_names.forEach((competitor: string) => {
          allCompetitors.add(competitor)
          competitorCounts[competitor] = (competitorCounts[competitor] || 0) + 1
        })
      }
    })

    const topCompetitors = Object.entries(competitorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, appearance_count: count, appearance_rate: count / analysisData.length }))

    return {
      unique_competitors: Array.from(allCompetitors),
      total_competitive_mentions: Object.values(competitorCounts).reduce((sum, count) => sum + count, 0),
      avg_competitors_per_response: analysisData.reduce((sum, a) => sum + (a.unique_brands_count || 0), 0) / analysisData.length,
      top_competitors: topCompetitors,
      competitive_intensity: allCompetitors.size / Math.max(1, analysisData.length),
      market_concentration: topCompetitors.slice(0, 3).reduce((sum, c) => sum + c.appearance_rate, 0) / 3
    }
  }

  private calculateModelPerformance(analysisData: any[]): any {
    const modelStats: Record<string, any> = {}
    
    analysisData.forEach(analysis => {
      const model = analysis.model_name || 'unknown'
      if (!modelStats[model]) {
        modelStats[model] = {
          total_analyses: 0,
          avg_lvi: 0,
          avg_sentiment: 0,
          avg_mentions: 0,
          lvi_scores: []
        }
      }
      
      modelStats[model].total_analyses++
      modelStats[model].lvi_scores.push(analysis.lvi_score || 0)
      modelStats[model].avg_mentions += analysis.brand_mention_count || 0
    })

    // Calculate averages
    Object.keys(modelStats).forEach(model => {
      const stats = modelStats[model]
      stats.avg_lvi = stats.lvi_scores.reduce((sum: number, score: number) => sum + score, 0) / stats.lvi_scores.length
      stats.avg_mentions = stats.avg_mentions / stats.total_analyses
      
      // Calculate consistency (inverse of coefficient of variation)
      const mean = stats.avg_lvi
      const variance = stats.lvi_scores.reduce((sum: number, score: number) => sum + Math.pow(score - mean, 2), 0) / stats.lvi_scores.length
      stats.consistency = mean > 0 ? 1 - (Math.sqrt(variance) / mean) : 0
    })

    return modelStats
  }

  private generateInsights(coreMetrics: any, competitiveAnalysis: any, vectorInsights: any): string[] {
    const insights = []

    if (coreMetrics.avg_lvi_score > 8) {
      insights.push('Excellent LVI performance indicates strong AI platform visibility')
    } else if (coreMetrics.avg_lvi_score > 6) {
      insights.push('Good LVI performance with room for optimization')
    } else if (coreMetrics.avg_lvi_score > 4) {
      insights.push('Moderate LVI performance requires strategic improvements')
    } else {
      insights.push('Low LVI performance indicates significant optimization opportunities')
    }

    if (coreMetrics.competitive_advantage > 0.1) {
      insights.push('Positive sentiment advantage over competitors indicates strong brand perception')
    } else if (coreMetrics.competitive_advantage < -0.1) {
      insights.push('Negative sentiment differential suggests need for brand perception improvement')
    }

    if (competitiveAnalysis.competitive_intensity > 2) {
      insights.push('High competitive market density requires differentiated positioning strategy')
    }

    if (coreMetrics.citation_performance.citation_rate > 0.5) {
      insights.push('Strong citation performance demonstrates content authority and trust')
    }

    return insights
  }

  private generateRecommendations(coreMetrics: any, competitiveAnalysis: any, analysisData: any[]): string[] {
    const recommendations = []

    if (coreMetrics.avg_lvi_score < 6) {
      recommendations.push('Focus on improving content quality and relevance to increase LVI scores')
    }

    if (coreMetrics.competitive_advantage < 0) {
      recommendations.push('Develop content strategy to improve sentiment relative to competitors')
    }

    if (coreMetrics.citation_performance.citation_rate < 0.3) {
      recommendations.push('Create more authoritative content to increase citation rates')
    }

    const needsImprovementCount = analysisData.filter(a => a.needs_improvement).length
    if (needsImprovementCount > analysisData.length * 0.3) {
      recommendations.push('Address content gaps identified in improvement analysis')
    }

    if (competitiveAnalysis.unique_competitors.length > 10) {
      recommendations.push('Consider niche positioning strategy in highly competitive market')
    }

    return recommendations
  }

  // Additional helper methods would continue here...
  // (I'll add the remaining methods if needed, but keeping this focused on the main functionality)

  private async generateEmptyReport(brandId: string, userId: string, brand: any, filters: any, reportType: string = 'brand_visibility'): Promise<any> {
    const reportData = {
      clerk_id: userId,
      brand_id: brandId,
      title: `Enhanced Brand Visibility Report - ${brand.name}`,
      description: 'No analysis data available for the selected period',
      report_type: reportType,
      status: 'completed',
      executive_summary: 'No visibility data available for analysis in the selected time period.',
      key_findings: { message: 'No data available' },
      generated_at: new Date().toISOString()
    }

    // Insert into database to get an ID
    const { data: report, error: reportError } = await this.supabase
      .from('brand_reports')
      .insert(reportData)
      .select()
      .single()

    if (reportError) {
      console.error('❌ Error inserting empty report:', reportError)
      throw reportError
    }

    if (!report || !report.id) {
      console.error('❌ Empty report inserted but no ID returned:', report)
      throw new Error('Failed to get report ID after insert')
    }

    console.log(`✅ Empty report generated with ID: ${report.id}`)
    return report
  }

  private generateExecutiveSummary(brandName: string, coreMetrics: any, totalAnalyses: number, competitiveAnalysis: any): string {
    return `${brandName} achieved an average LVI score of ${coreMetrics.avg_lvi_score.toFixed(1)} across ${totalAnalyses} AI platform analyses. The brand received ${coreMetrics.total_brand_mentions} total mentions with ${(coreMetrics.avg_sentiment * 100).toFixed(0)}% average sentiment score. Competitive analysis reveals ${competitiveAnalysis.unique_competitors.length} active competitors with ${(coreMetrics.competitive_advantage * 100).toFixed(0)}% sentiment advantage.`
  }

  private calculateOverallVisibilityScore(coreMetrics: any, competitiveAnalysis: any): number {
    const lviWeight = 0.4
    const sentimentWeight = 0.3
    const competitiveWeight = 0.3
    
    const lviScore = Math.min(coreMetrics.avg_lvi_score / 10, 1) * 100
    const sentimentScore = Math.max(coreMetrics.avg_sentiment, 0) * 100
    const competitiveScore = Math.max(coreMetrics.competitive_advantage + 0.5, 0) * 100
    
    return lviScore * lviWeight + sentimentScore * sentimentWeight + competitiveScore * competitiveWeight
  }

  private calculateVisibilityGrade(avgLviScore: number): string {
    if (avgLviScore >= 9) return 'A+'
    if (avgLviScore >= 8) return 'A'
    if (avgLviScore >= 7) return 'B+'
    if (avgLviScore >= 6) return 'B'
    if (avgLviScore >= 5) return 'C+'
    if (avgLviScore >= 4) return 'C'
    if (avgLviScore >= 3) return 'D'
    return 'F'
  }

  private calculatePerformanceTrend(analysisData: any[]): string {
    if (analysisData.length < 2) return 'insufficient_data'
    
    const sortedData = analysisData.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    const halfPoint = Math.floor(sortedData.length / 2)
    
    const firstHalf = sortedData.slice(0, halfPoint)
    const secondHalf = sortedData.slice(halfPoint)
    
    const firstAvg = firstHalf.reduce((sum, a) => sum + (a.lvi_score || 0), 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, a) => sum + (a.lvi_score || 0), 0) / secondHalf.length
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100
    
    if (change > 10) return 'improving'
    if (change < -10) return 'declining'
    return 'stable'
  }

  private calculateCoverageCompleteness(analysisData: any[]): number {
    const withConfidence = analysisData.filter(a => a.confidence_score && a.confidence_score >= 0.7).length
    return withConfidence / Math.max(1, analysisData.length)
  }

  // Chart generation methods (simplified)
  private generateLVITimeline(analysisData: any[]): any[] {
    return analysisData.map(a => ({
      date: a.created_at,
      lvi_score: a.lvi_score || 0,
      model: a.model_name
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  private generateSentimentTimeline(analysisData: any[]): any[] {
    return analysisData.map(a => ({
      date: a.created_at,
      sentiment: a.avg_brand_sentiment || 0,
      model: a.model_name
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  private generateModelPerformanceChart(modelPerformance: any): any[] {
    return Object.entries(modelPerformance).map(([model, stats]: [string, any]) => ({
      model,
      avg_lvi: stats.avg_lvi,
      total_analyses: stats.total_analyses,
      consistency: stats.consistency
    }))
  }

  private generateCompetitiveLandscapeChart(competitiveAnalysis: any): any[] {
    return competitiveAnalysis.top_competitors.slice(0, 10)
  }

  private generateCitationAnalysisChart(analysisData: any[]): any {
    const totalCitations = analysisData.reduce((sum, a) => sum + (a.total_citations || 0), 0)
    const brandCitations = analysisData.reduce((sum, a) => sum + (a.brand_citations || 0), 0)
    
    return {
      total_citations: totalCitations,
      brand_citations: brandCitations,
      citation_rate: totalCitations > 0 ? brandCitations / totalCitations : 0,
      analyses_with_citations: analysisData.filter(a => (a.total_citations || 0) > 0).length
    }
  }

  // Mention analysis methods (simplified implementations)
  private analyzeMentionPatterns(analyses: any[]): any {
    const totalMentions = analyses.reduce((sum, a) => sum + (a.brand_mention_count || 0), 0)
    const avgSentiment = analyses.length > 0 ? 
      analyses.reduce((sum, a) => sum + (a.avg_brand_sentiment || 0), 0) / analyses.length : 0
    
    const positiveMentions = analyses.filter(a => (a.avg_brand_sentiment || 0) > 0.6).length
    const positiveMentionRate = analyses.length > 0 ? (positiveMentions / analyses.length) * 100 : 0

    return {
      total_mentions: totalMentions,
      avg_sentiment: avgSentiment,
      positive_mention_rate: positiveMentionRate,
      mention_frequency: totalMentions / Math.max(1, analyses.length)
    }
  }

  private analyzePositioning(analyses: any[]): any {
    const withRanking = analyses.filter(a => a.rank_in_response)
    const avgRanking = withRanking.length > 0 ? 
      withRanking.reduce((sum, a) => sum + a.rank_in_response, 0) / withRanking.length : null
    
    const topPositions = withRanking.filter(a => a.rank_in_response <= 3).length
    const topPositionRate = withRanking.length > 0 ? (topPositions / withRanking.length) * 100 : 0

    return {
      avg_ranking: avgRanking,
      top_position_rate: topPositionRate,
      ranking_coverage: withRanking.length / Math.max(1, analyses.length)
    }
  }

  private calculateMentionTrends(analyses: any[]): any {
    // Simplified trend calculation
    return {
      trend_direction: 'stable',
      growth_rate: 0,
      weekly_breakdown: []
    }
  }

  private calculateMentionScore(mentionAnalysis: any, positioningAnalysis: any): number {
    const mentionWeight = 0.4
    const sentimentWeight = 0.4
    const positionWeight = 0.2
    
    const mentionScore = Math.min(mentionAnalysis.mention_frequency * 20, 100)
    const sentimentScore = mentionAnalysis.avg_sentiment * 100
    const positionScore = positioningAnalysis.avg_ranking ? 
      Math.max(100 - (positioningAnalysis.avg_ranking - 1) * 20, 0) : 50
    
    return mentionScore * mentionWeight + sentimentScore * sentimentWeight + positionScore * positionWeight
  }

  // Additional chart generation methods (simplified)
  private generateMentionFrequencyChart(analyses: any[]): any[] {
    return analyses.map(a => ({
      date: a.created_at,
      mentions: a.brand_mention_count || 0
    }))
  }

  private generateSentimentDistributionChart(analyses: any[]): any {
    const positive = analyses.filter(a => (a.avg_brand_sentiment || 0) > 0.6).length
    const neutral = analyses.filter(a => (a.avg_brand_sentiment || 0) >= 0.3 && (a.avg_brand_sentiment || 0) <= 0.6).length
    const negative = analyses.filter(a => (a.avg_brand_sentiment || 0) < 0.3).length
    
    return { positive, neutral, negative }
  }

  private generateRankingDistributionChart(analyses: any[]): any {
    const rankings = analyses.filter(a => a.rank_in_response).map(a => a.rank_in_response)
    const distribution: Record<string, number> = {}
    
    rankings.forEach(rank => {
      const bucket = rank <= 3 ? 'top-3' : rank <= 5 ? '4-5' : rank <= 10 ? '6-10' : '10+'
      distribution[bucket] = (distribution[bucket] || 0) + 1
    })
    
    return distribution
  }

  private groupByModel(analyses: any[]): any {
    const models: Record<string, any> = {}
    
    analyses.forEach(a => {
      const model = a.model_name || 'unknown'
      if (!models[model]) {
        models[model] = {
          modelName: model,
          totalResponses: 0,
          mentions: 0,
          avgSentiment: 0,
          avgRank: 0,
          sentiments: [],
          ranks: []
        }
      }
      models[model].totalResponses++
      if (a.brand_mention_count > 0) models[model].mentions++
      if (a.avg_brand_sentiment) models[model].sentiments.push(a.avg_brand_sentiment)
      if (a.rank_in_response) models[model].ranks.push(a.rank_in_response)
    })

    // Calculate averages
    Object.values(models).forEach((m: any) => {
      m.avgSentiment = m.sentiments.length > 0 
        ? m.sentiments.reduce((sum: number, s: number) => sum + s, 0) / m.sentiments.length 
        : 0
      m.avgRank = m.ranks.length > 0
        ? m.ranks.reduce((sum: number, r: number) => sum + r, 0) / m.ranks.length
        : 0
      m.mentionRate = (m.mentions / m.totalResponses) * 100
    })

    return models
  }

  private groupByPrompt(analyses: any[]): any {
    const prompts: Record<string, any> = {}
    
    analyses.forEach(a => {
      const promptKey = a.prompt_text?.substring(0, 100) || 'unknown'
      if (!prompts[promptKey]) {
        prompts[promptKey] = {
          promptText: a.prompt_text || '',
          totalResponses: 0,
          mentions: 0,
          responses: []
        }
      }
      prompts[promptKey].totalResponses++
      if (a.brand_mention_count > 0) prompts[promptKey].mentions++
      prompts[promptKey].responses.push({
        model: a.model_name,
        response: a.raw_response,
        sentiment: a.avg_brand_sentiment,
        rank: a.rank_in_response,
        citations: a.total_citations
      })
    })

    return prompts
  }

  private generateModelMentionChart(analyses: any[]): any[] {
    const modelStats: Record<string, number> = {}
    
    analyses.forEach(a => {
      const model = a.model_name || 'unknown'
      modelStats[model] = (modelStats[model] || 0) + (a.brand_mention_count || 0)
    })
    
    return Object.entries(modelStats).map(([model, mentions]) => ({ model, mentions }))
  }
}

export default BrandReportingService