"use client"

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  Eye, 
  EyeOff, 
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RawResultsTableProps {
  auditResults: any
  className?: string
}

interface TestResult {
  prompt: string
  model: string
  response: string
  brand_mentions: any[]
  citations: string[]
  competitors_mentioned: any[]
  source_names: string[]
  mentions_count: number
  confidence_score: number
  timestamp: string
  raw_response?: any
}

export function RawResultsTable({ auditResults, className }: RawResultsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedModel, setSelectedModel] = useState('all')
  const [selectedMentions, setSelectedMentions] = useState('all')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [copiedText, setCopiedText] = useState<string | null>(null)

  // Extract test results from audit data
  const testResults: TestResult[] = useMemo(() => {
    const results: TestResult[] = []
    
    // Handle different data structures
    const rawResponses = auditResults?.audit_summary?.raw_responses || 
                        auditResults?.test_results || 
                        auditResults?.testing_results?.test_results || 
                        []

    rawResponses.forEach((response: any, index: number) => {
      // Extract brand mentions
      const brandMentions = response.brand_mentions || []
      const citations = response.citations || []
      const competitors = response.competitors_mentioned || []
      
      results.push({
        prompt: response.prompt_text || response.prompt || response.query || `Query ${index + 1}`,
        model: response.model_name || response.model || response.llm_model || 'Unknown',
        response: response.response_text || response.response || response.answer || response.content || '',
        brand_mentions: brandMentions,
        citations: citations,
        competitors_mentioned: response.competitor_mentions || competitors,
        source_names: citations.map((citation: any) => {
          try {
            // Handle both string URLs and citation objects
            const url = typeof citation === 'string' ? citation : citation.url
            if (url) {
              const domain = new URL(url).hostname.replace('www.', '')
              return domain
            }
            return citation.source_name || `Citation ${citations.indexOf(citation) + 1}`
          } catch {
            return typeof citation === 'string' ? citation : citation.source_name || 'Unknown Source'
          }
        }),
        mentions_count: brandMentions.length || 0,
        confidence_score: response.confidence_score || response.score || 0,
        timestamp: response.timestamp || new Date().toISOString(),
        raw_response: response
      })
    })

    return results
  }, [auditResults])

  // Filter and search functionality
  const filteredResults = useMemo(() => {
    return testResults.filter(result => {
      const matchesSearch = !searchTerm || 
        result.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.response.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.model.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesModel = selectedModel === 'all' || result.model === selectedModel

      const matchesMentions = selectedMentions === 'all' ||
        (selectedMentions === 'with-mentions' && result.mentions_count > 0) ||
        (selectedMentions === 'no-mentions' && result.mentions_count === 0)

      return matchesSearch && matchesModel && matchesMentions
    })
  }, [testResults, searchTerm, selectedModel, selectedMentions])

  // Get unique models for filter
  const availableModels = useMemo(() => {
    const models = [...new Set(testResults.map(r => r.model))]
    return models.sort()
  }, [testResults])

  // Toggle row expansion
  const toggleRowExpansion = (index: number) => {
    const newExpanded = new Set(expandedRows)
    const rowId = `row-${index}`
    
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId)
    } else {
      newExpanded.add(rowId)
    }
    
    setExpandedRows(newExpanded)
  }

  // Copy text to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label)
      setTimeout(() => setCopiedText(null), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const getModelBadgeColor = (model: string) => {
    const colors: Record<string, string> = {
      'openai/gpt-4o-mini:online': 'bg-blue-100 text-blue-800',
      'anthropic/claude-3.5-sonnet:online': 'bg-purple-100 text-purple-800', 
      'google/gemini-2.5-flash:online': 'bg-green-100 text-green-800',
      'perplexity/sonar': 'bg-orange-100 text-orange-800'
    }
    
    // Simplified model names
    const simplifiedModel = model.includes('chatgpt') ? 'ChatGPT' :
                           model.includes('claude') ? 'Claude' :
                           model.includes('gemini') ? 'Gemini' :
                           model.includes('perplexity') ? 'Perplexity' :
                           model

    return {
      className: colors[model] || 'bg-gray-100 text-gray-800',
      name: simplifiedModel
    }
  }

  if (testResults.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No test results available</h3>
          <p className="text-muted-foreground">
            Raw test results will appear here after running the AI run.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Raw AI Test Results</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Diagnostic view of all {testResults.length} AI responses for detailed analysis
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {filteredResults.length} of {testResults.length} results
          </Badge>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search prompts, responses, or models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              {availableModels.map(model => {
                const badge = getModelBadgeColor(model)
                return (
                  <SelectItem key={model} value={model}>
                    {badge.name}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          <Select value={selectedMentions} onValueChange={setSelectedMentions}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter mentions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Results</SelectItem>
              <SelectItem value="with-mentions">With Mentions</SelectItem>
              <SelectItem value="no-mentions">No Mentions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {filteredResults.map((result, index) => {
            const rowId = `row-${index}`
            const isExpanded = expandedRows.has(rowId)
            const modelBadge = getModelBadgeColor(result.model)

            return (
              <div key={rowId} className="p-4 hover:bg-muted/50 transition-colors">
                {/* Row Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => toggleRowExpansion(index)}
                        className="p-1 hover:bg-muted rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <Badge className={cn("text-xs", modelBadge.className)}>
                        {modelBadge.name}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {result.mentions_count} mentions
                      </Badge>
                      {result.citations.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {result.citations.length} sources
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-medium text-sm mb-1 line-clamp-2">
                      {result.prompt}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {result.response.slice(0, 200)}...
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(result.response, `response-${index}`)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedText === `response-${index}` ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRowExpansion(index)}
                      className="h-8 px-3 text-xs"
                    >
                      {isExpanded ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                      {isExpanded ? 'Hide' : 'View'}
                    </Button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="ml-6 space-y-4 pt-4 border-t border-border">
                    {/* Full Response */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-medium">Full Response</h5>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(result.response, `full-response-${index}`)}
                          className="h-7 px-2 text-xs"
                        >
                          {copiedText === `full-response-${index}` ? (
                            <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3 mr-1" />
                          )}
                          Copy
                        </Button>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-sm">
                        <pre className="whitespace-pre-wrap font-sans">
                          {result.response}
                        </pre>
                      </div>
                    </div>

                    {/* Brand Mentions */}
                    {result.brand_mentions.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium mb-2">Brand Mentions</h5>
                        <div className="space-y-2">
                          {result.brand_mentions.map((mention: any, i: number) => (
                            <div key={i} className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-green-800">
                                  {mention.brand_name || mention.name || `Mention ${i + 1}`}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  Count: {mention.count || 1}
                                </Badge>
                              </div>
                              {mention.context && (
                                <p className="text-xs text-green-700">
                                  Context: {Array.isArray(mention.context) ? mention.context.join(', ') : mention.context}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Competitors */}
                    {result.competitors_mentioned.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium mb-2">Competitors Mentioned</h5>
                        <div className="flex flex-wrap gap-2">
                          {result.competitors_mentioned.map((competitor: any, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {competitor.name || competitor}
                              {competitor.count && ` (${competitor.count})`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Citations */}
                    {result.citations.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium mb-2">Sources & Citations</h5>
                        <div className="space-y-2">
                          {result.citations.map((citation: any, i: number) => {
                            // Handle both string URLs and citation objects
                            const citationUrl = typeof citation === 'string' ? citation : citation.url
                            const citationTitle = typeof citation === 'object' && citation.source_name ? citation.source_name : ''
                            const citationExcerpt = typeof citation === 'object' && citation.excerpt ? citation.excerpt : ''
                            
                            return (
                              <div key={i} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-blue-800 truncate">
                                    {citationTitle || (citationUrl ? new URL(citationUrl).hostname : `Citation ${i + 1}`)}
                                  </p>
                                  <p className="text-xs text-blue-600 truncate">
                                    {citationUrl || 'No URL provided'}
                                  </p>
                                  {citationExcerpt && (
                                    <p className="text-xs text-blue-500 mt-1 line-clamp-2">
                                      {citationExcerpt}
                                    </p>
                                  )}
                                </div>
                                {citationUrl && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(citationUrl, '_blank')}
                                    className="h-7 w-7 p-0 ml-2"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Raw Data */}
                    <details className="group">
                      <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                        Raw JSON Data
                      </summary>
                      <div className="mt-2 bg-muted/50 rounded-lg p-3">
                        <pre className="text-xs overflow-auto max-h-40">
                          {JSON.stringify(result.raw_response, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {filteredResults.length === 0 && (
          <div className="p-8 text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No results match your current filters. Try adjusting your search criteria.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RawResultsTable