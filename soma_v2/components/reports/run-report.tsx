'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, TrendingUp, TrendingDown, Award, Target, Clock, DollarSign, Globe, Users, BarChart3 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Metric,
  Text,
  Grid,
  Col,
  ProgressBar
} from '@tremor/react'

interface RunReportProps {
  runId: string
  onReportLoaded?: (data: any) => void
}

interface ReportData {
  run: {
    id: string
    run_id: string
    brand_name: string
    status: string
    total_jobs: number
    completed_jobs: number
    actual_duration: number
    total_cost: number
    created_at: string
  }
  responses: any[]
  analytics: {
    brandVisibility: {
      mentionRate: number
      totalMentions: number
      averageConfidence: number
      modelPerformance: Record<string, any>
    }
    competitorAnalysis: {
      shareOfVoice: Record<string, number>
      competitorMentions: Record<string, number>
      brandRanking: number
    }
    sourceAnalysis: {
      topDomains: Array<{
        domain: string
        count: number
        percentage: number
      }>
      citationQuality: {
        totalCitations: number
        avgRelevanceScore: number
        uniqueSources: number
      }
    }
    modelInsights: Array<{
      model: string
      responseCount: number
      avgConfidence: number
      brandMentionRate: number
      avgResponseTime: number
      totalCost: number
    }>
  }
  insights: Array<{
    type: 'strength' | 'opportunity' | 'concern' | 'recommendation'
    title: string
    description: string
    impact: 'high' | 'medium' | 'low'
    metric?: string
    value?: number
  }>
}

export function RunReport({ runId, onReportLoaded }: RunReportProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadReport()
  }, [runId])

  const loadReport = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/reports/run/${runId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load report')
      }

      setReportData(result.data)
      onReportLoaded?.(result.data)
    } catch (err) {
      console.error('Error loading report:', err)
      setError(err instanceof Error ? err.message : 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength':
        return <Award className="h-4 w-4 text-green-600" />
      case 'opportunity':
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'concern':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'recommendation':
        return <Target className="h-4 w-4 text-purple-600" />
      default:
        return <BarChart3 className="h-4 w-4 text-gray-600" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'strength':
        return 'bg-green-50 border-green-200'
      case 'opportunity':
        return 'bg-blue-50 border-blue-200'
      case 'concern':
        return 'bg-red-50 border-red-200'
      case 'recommendation':
        return 'bg-purple-50 border-purple-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(amount)
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Generating comprehensive report...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!reportData) {
    return (
      <Alert className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No report data available</AlertDescription>
      </Alert>
    )
  }

  const { run, analytics, insights } = reportData

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Brand Intelligence Report: {run.brand_name}
          </CardTitle>
          <CardDescription>
            Run completed on {new Date(run.created_at).toLocaleDateString()} 
            • Duration: {formatDuration(run.actual_duration)} 
            • Cost: {formatCurrency(run.total_cost)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Grid numItems={1} numItemsMd={4} className="gap-4">
            <Col className="text-center">
              <Metric className="text-primary">
                {analytics.brandVisibility.mentionRate.toFixed(1)}%
              </Metric>
              <Text>Brand Mention Rate</Text>
            </Col>
            <Col className="text-center">
              <Metric className="text-green-600">
                #{analytics.competitorAnalysis.brandRanking}
              </Metric>
              <Text>Market Position</Text>
            </Col>
            <Col className="text-center">
              <Metric className="text-blue-600">
                {(analytics.brandVisibility.averageConfidence * 100).toFixed(0)}%
              </Metric>
              <Text>Avg Confidence</Text>
            </Col>
            <Col className="text-center">
              <Metric className="text-purple-600">
                {analytics.sourceAnalysis.citationQuality.totalCitations}
              </Metric>
              <Text>Total Citations</Text>
            </Col>
          </Grid>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights & Recommendations</CardTitle>
          <CardDescription>
            AI-powered analysis of your brand's performance and opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {insights.map((insight, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}>
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{insight.title}</h4>
                      <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}>
                        {insight.impact} impact
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    {insight.metric && insight.value && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {insight.metric}: {insight.value.toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics */}
      <Tabs defaultValue="models" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="models">AI Models</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="visibility">Visibility</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                AI Model Performance
              </CardTitle>
              <CardDescription>
                How different AI models respond to queries about your brand
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.modelInsights.map((model, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{model.model}</div>
                      <div className="text-sm text-muted-foreground">
                        {model.brandMentionRate.toFixed(1)}% mention rate
                      </div>
                    </div>
                    <Progress value={model.brandMentionRate} className="h-2" />
                    <div className="grid grid-cols-4 gap-4 text-xs text-muted-foreground">
                      <div>
                        <Clock className="h-3 w-3 inline mr-1" />
                        {model.avgResponseTime.toFixed(0)}ms
                      </div>
                      <div>
                        <DollarSign className="h-3 w-3 inline mr-1" />
                        {formatCurrency(model.totalCost)}
                      </div>
                      <div>
                        <BarChart3 className="h-3 w-3 inline mr-1" />
                        {(model.avgConfidence * 100).toFixed(0)}% conf.
                      </div>
                      <div>
                        <Globe className="h-3 w-3 inline mr-1" />
                        {model.responseCount} responses
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Competitive Landscape
              </CardTitle>
              <CardDescription>
                Share of voice analysis among competitors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics.competitorAnalysis.shareOfVoice)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 10)
                  .map(([brand, mentions], index) => {
                    const totalMentions = Object.values(analytics.competitorAnalysis.shareOfVoice).reduce((a, b) => a + b, 0)
                    const percentage = totalMentions > 0 ? (mentions / totalMentions) * 100 : 0
                    const isCurrentBrand = brand === run.brand_name
                    
                    return (
                      <div key={brand} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className={`font-medium ${isCurrentBrand ? 'text-primary' : ''}`}>
                            #{index + 1} {brand}
                            {isCurrentBrand && <Badge variant="outline" className="ml-2">Your Brand</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {mentions} mentions ({percentage.toFixed(1)}%)
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Source Analysis
              </CardTitle>
              <CardDescription>
                Top domains and citation quality metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Top Citation Sources</h4>
                  <div className="space-y-3">
                    {analytics.sourceAnalysis.topDomains.slice(0, 8).map((source, index) => (
                      <div key={source.domain} className="flex items-center justify-between">
                        <div className="text-sm">{source.domain}</div>
                        <div className="text-xs text-muted-foreground">
                          {source.count} ({source.percentage.toFixed(1)}%)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Citation Quality</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Citations</span>
                      <span className="font-medium">{analytics.sourceAnalysis.citationQuality.totalCitations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Unique Sources</span>
                      <span className="font-medium">{analytics.sourceAnalysis.citationQuality.uniqueSources}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Relevance Score</span>
                      <span className="font-medium">
                        {(analytics.sourceAnalysis.citationQuality.avgRelevanceScore * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visibility" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Brand Visibility Breakdown
              </CardTitle>
              <CardDescription>
                Detailed analysis of brand mention patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Overall Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Responses</span>
                      <span className="font-medium">{reportData.responses.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Brand Mentions</span>
                      <span className="font-medium">{analytics.brandVisibility.totalMentions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Mention Rate</span>
                      <span className="font-medium">{analytics.brandVisibility.mentionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Confidence</span>
                      <span className="font-medium">{(analytics.brandVisibility.averageConfidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Model Comparison</h4>
                  <div className="space-y-3">
                    {Object.entries(analytics.brandVisibility.modelPerformance).map(([model, perf]: [string, any]) => (
                      <div key={model} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{model.split(':')[0]}</span>
                          <span>{perf.mentionRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={perf.mentionRate} className="h-1" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default RunReport