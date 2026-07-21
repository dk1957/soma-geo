"use client"

/**
 * Strategic Insights
 * ==================
 * Compact, action-focused AI insight panel.
 * Consolidated into 3 tabs: Actions, Growth, Intelligence.
 */

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Target,
  Sparkles,
  FileText,
  ExternalLink,
  Clock,
  XCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────────────

const toArray = (v: string | string[] | undefined): string[] => {
  if (!v) return []
  if (Array.isArray(v)) return v
  return v.split(',').map(s => s.trim()).filter(Boolean)
}

interface KeyFinding {
  title: string
  description: string
  severity: string
  category: string
  evidence: string
  recommendation: string
}

interface Opportunity {
  title: string
  description: string
  impact: string
  effort: string
  expected_outcome: string
  target_queries: string | string[]
}

interface Threat {
  title: string
  description: string
  severity: string
  affected_area: string
  mitigation: string
}

interface ContentStrategy {
  title: string
  target_topic: string
  content_type: string
  target_publications: string | string[]
  rationale: string
  priority: string
}

interface FactVerification {
  claim: string
  source_model: string
  verdict: string
  evidence: string
  correction: string | null
  suggested_action: string
}

interface CompetitorInsight {
  competitor: string
  insight: string
  implication: string
  action: string
}

interface TrendSignal {
  signal: string
  direction: string
  confidence: string
  timeframe: string
  implication: string
}

interface StrategicAnalysisData {
  id: string
  executive_summary: string
  key_findings: KeyFinding[]
  opportunities: Opportunity[]
  threats: Threat[]
  content_strategy: ContentStrategy[]
  fact_verification: FactVerification[]
  competitive_intelligence: CompetitorInsight[]
  trend_signals: TrendSignal[]
  confidence_score?: number
  model_used?: string
  created_at: string
  cached?: boolean
}

interface StrategicInsightsProps {
  brandId: string
  isAnalyzing?: boolean
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }

const severityDot: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-400',
}

const priorityLabels: Record<string, string> = {
  immediate: 'Now',
  short_term: '1-2 Wk',
  medium_term: '1-3 Mo',
}

const priorityStyle: Record<string, string> = {
  immediate: 'bg-black text-white',
  short_term: 'bg-gray-100 text-gray-700 border border-gray-200',
  medium_term: 'bg-gray-50 text-gray-500 border border-gray-200',
}

const contentTypeLabels: Record<string, string> = {
  blog_post: 'Blog Post',
  whitepaper: 'Whitepaper',
  case_study: 'Case Study',
  comparison_page: 'Comparison',
  faq_page: 'FAQ',
  how_to_guide: 'How-To',
  industry_report: 'Report',
  press_release: 'PR',
  guest_post: 'Guest Post',
  reddit_engagement: 'Reddit',
  quora_answer: 'Quora',
  product_page: 'Product',
}

const verdictConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  accurate: { icon: CheckCircle2, color: 'text-green-600', label: 'Accurate' },
  inaccurate: { icon: XCircle, color: 'text-red-600', label: 'Wrong' },
  outdated: { icon: Clock, color: 'text-yellow-600', label: 'Outdated' },
  misleading: { icon: AlertCircle, color: 'text-orange-600', label: 'Misleading' },
  unverifiable: { icon: AlertCircle, color: 'text-gray-400', label: 'Unverifiable' },
}

const directionConfig: Record<string, { icon: typeof TrendingUp; color: string }> = {
  improving: { icon: TrendingUp, color: 'text-green-600' },
  declining: { icon: TrendingDown, color: 'text-red-600' },
  emerging: { icon: Sparkles, color: 'text-[#FF760D]' },
  volatile: { icon: AlertTriangle, color: 'text-yellow-600' },
}

/** Resolve a model or brand name to a logo path (returns null if no match) */
const getModelLogo = (name: string): string | null => {
  const lower = name.toLowerCase()
  if (lower.includes('openai') || lower.includes('gpt') || lower.includes('chatgpt')) return '/models/chatgpt-logo.png'
  if (lower.includes('anthropic') || lower.includes('claude')) return '/models/claude-logo.png'
  if (lower.includes('google') || lower.includes('gemini')) return '/models/gemini-logo.png'
  if (lower.includes('grok') || lower.includes('xai')) return '/models/grok-logo.png'
  if (lower.includes('perplexity') || lower.includes('sonar')) return '/models/perplexity-logo.png'
  if (lower.includes('llama') || lower.includes('meta')) return '/models/meta-logo.svg'
  return null
}

/** Map any model version string (e.g. "gpt-5.4-mini") to its friendly name (e.g. "ChatGPT") */
const getMainModelName = (name: string): string => {
  const lower = name.toLowerCase()
  if (lower.includes('gpt') || lower.includes('openai') || lower.includes('chatgpt')) return 'ChatGPT'
  if (lower.includes('claude') || lower.includes('anthropic')) return 'Claude'
  if (lower.includes('gemini') || lower.includes('google')) return 'Gemini'
  if (lower.includes('grok') || lower.includes('xai')) return 'Grok'
  if (lower.includes('perplexity') || lower.includes('sonar')) return 'Perplexity'
  if (lower.includes('llama') || lower.includes('meta')) return 'Meta AI'
  return name // fallback to original if unknown
}

/** Replace model version strings in evidence/description text with friendly names */
const cleanModelVersionsInText = (text: string): string => {
  // Match patterns like gpt-5.4-mini, grok-4.1-fast, claude-3.5-sonnet, gemini-2.0-flash, etc.
  return text.replace(/\b(gpt|chatgpt|openai)[-\s]?[\d][\w.\-]*/gi, 'ChatGPT')
    .replace(/\b(claude|anthropic)[-\s]?[\d][\w.\-]*/gi, 'Claude')
    .replace(/\b(gemini|google)[-\s]?[\d][\w.\-]*/gi, 'Gemini')
    .replace(/\b(grok|xai)[-\s]?[\d][\w.\-]*/gi, 'Grok')
    .replace(/\b(perplexity|sonar)[-\s]?[\d][\w.\-]*/gi, 'Perplexity')
    .replace(/\b(llama|meta)[-\s]?[\d][\w.\-]*/gi, 'Meta AI')
}

/** Format category labels: "brand_defense" → "Brand Defense", "category_capture" → "Category", etc. */
const formatCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    branded: 'Brand Defense',
    brand_defense: 'Brand Defense',
    discovery: 'Discovery',
    category_capture: 'Category',
    solution_discovery: 'Solution',
    general: 'General',
  }
  return labels[category] ?? category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function StrategicInsights({ brandId, isAnalyzing = false }: StrategicInsightsProps) {
  const [analysis, setAnalysis] = useState<StrategicAnalysisData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [showFullSummary, setShowFullSummary] = useState(false)

  const toggle = (key: string) => setExpandedItem(prev => prev === key ? null : key)

  const fetchCached = useCallback(async () => {
    if (!brandId) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/insights/strategic?brand_id=${brandId}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch')
      const { data } = await res.json()
      setAnalysis(data)
    } catch (e) {
      console.error('Fetch insights error:', e)
    } finally {
      setIsLoading(false)
    }
  }, [brandId])

  useEffect(() => { fetchCached() }, [fetchCached])

  // ─── Loading ────────────────────────────────────────────────────────

  if (isLoading || (isAnalyzing && !analysis)) {
    return (
      <Card className="border border-gray-200 shadow-none bg-white py-0">
        <CardHeader className="pb-4 bg-black text-white rounded-t-lg py-4">
          <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
            <Sparkles className="h-5 w-5 text-white" />
            Strategic Insights
          </CardTitle>
          <CardDescription className="text-gray-200 text-sm font-light">
            Deep analysis of visibility signals, competitor positioning, and content gaps across AI engines
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5 pb-6 space-y-5">
          {/* Executive summary skeleton */}
          <div className="space-y-2">
            <div className="h-3.5 w-full rounded bg-gray-200 animate-pulse" />
            <div className="h-3.5 w-11/12 rounded bg-gray-200 animate-pulse" style={{ animationDelay: '50ms' }} />
            <div className="h-3.5 w-3/4 rounded bg-gray-100 animate-pulse" style={{ animationDelay: '100ms' }} />
          </div>
          {/* Quick indicator pills skeleton */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-6 w-28 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-6 w-20 rounded-full bg-gray-100 animate-pulse" style={{ animationDelay: '80ms' }} />
            <div className="h-6 w-24 rounded-full bg-gray-200 animate-pulse" style={{ animationDelay: '160ms' }} />
          </div>
          {/* Finding cards skeleton */}
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-4 space-y-2" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-14 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
                </div>
                <div className="h-3 w-full rounded bg-gray-100 animate-pulse" />
                <div className="h-3 w-5/6 rounded bg-gray-100 animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // ─── Empty State ────────────────────────────────────────────────────

  if (!analysis) {
    return (
      <Card className="border border-gray-200 shadow-none bg-white py-0">
        <CardHeader className="pb-4 bg-black text-white rounded-t-lg py-4">
          <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
            <Sparkles className="h-5 w-5 text-white" />
            Strategic Insights
          </CardTitle>
          <CardDescription className="text-gray-200 text-sm font-light">
            Deep analysis of visibility signals, competitor positioning, and content gaps across AI engines
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="text-center max-w-md">
            <p className="text-base text-gray-700 mb-1 font-medium">
              Insights are on their way
            </p>
            <p className="text-sm text-gray-500">
              We automatically analyze your brand mentions, competitor strategies, content gaps, and fact accuracy across every major AI model. Your first insights will appear here after the next scheduled analysis.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ─── Sorted & merged action items ───────────────────────────────────

  const sortedFindings = [...analysis.key_findings].sort(
    (a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
  )

  const factIssues = analysis.fact_verification.filter(f => f.verdict !== 'accurate')

  // First sentence of executive summary for TL;DR
  const summaryLines = analysis.executive_summary.split(/(?<=\.)\s+/)
  const tldr = summaryLines.slice(0, 2).join(' ')
  const hasMoreSummary = summaryLines.length > 2

  return (
    <Card className="border border-gray-200 shadow-none bg-white py-0">
      {/* Header */}
      <CardHeader className="pb-4 bg-black text-white rounded-t-lg py-4">
        <div>
          <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
            <Sparkles className="h-5 w-5 text-white" />
            Strategic Insights
          </CardTitle>
          <CardDescription className="text-gray-200 text-sm font-light">
            Deep analysis of visibility signals, competitor positioning, and content gaps across AI engines
          </CardDescription>
        </div>
      </CardHeader>

      {/* Executive Summary + Quick Indicators */}
      <div className="border-b border-gray-200">
        {/* Summary Callout */}
        <div className="px-5 pt-5 pb-4">
          <p className="text-[13px] leading-[1.7] text-gray-700">
            {showFullSummary ? analysis.executive_summary : tldr}
          </p>
          {hasMoreSummary && (
            <button
              onClick={() => setShowFullSummary(!showFullSummary)}
              className="text-xs text-gray-400 hover:text-gray-700 mt-2 flex items-center gap-1 font-medium cursor-pointer transition-colors"
            >
              {showFullSummary ? <><ChevronUp className="h-3 w-3" />Show less</> : <><ChevronDown className="h-3 w-3" />Read full summary</>}
            </button>
          )}
        </div>

        {/* Quick-glance Indicators */}
        <div className="px-5 pb-4 flex flex-wrap items-center gap-2">
          {sortedFindings.filter(f => f.severity === 'critical' || f.severity === 'high').length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-100 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {sortedFindings.filter(f => f.severity === 'critical' || f.severity === 'high').length} urgent {sortedFindings.filter(f => f.severity === 'critical' || f.severity === 'high').length === 1 ? 'action' : 'actions'}
            </span>
          )}
          {analysis.opportunities.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-100 rounded-full px-2.5 py-1">
              <Target className="h-3 w-3" />
              {analysis.opportunities.length} {analysis.opportunities.length === 1 ? 'opportunity' : 'opportunities'}
            </span>
          )}
          {analysis.threats.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-1">
              <AlertTriangle className="h-3 w-3" />
              {analysis.threats.length} {analysis.threats.length === 1 ? 'threat' : 'threats'}
            </span>
          )}
          {factIssues.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-100 rounded-full px-2.5 py-1">
              <AlertCircle className="h-3 w-3" />
              {factIssues.length} fact {factIssues.length === 1 ? 'issue' : 'issues'}
            </span>
          )}
          {analysis.trend_signals.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1">
              <TrendingUp className="h-3 w-3" />
              {analysis.trend_signals.length} {analysis.trend_signals.length === 1 ? 'trend' : 'trends'}
            </span>
          )}
        </div>
      </div>

      <CardContent className="pt-5">
        {/* 3-Tab Layout */}
        <Tabs defaultValue="actions" className="w-full">
          <TabsList className="w-full bg-gray-100 p-1 h-11 rounded-lg">
            <TabsTrigger value="actions" className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md">
              Actions
              {(sortedFindings.length + analysis.threats.length) > 0 && (
                <span className="ml-2 text-[11px] bg-gray-200 text-gray-600 rounded-full px-2 py-0.5 data-[state=active]:bg-black data-[state=active]:text-white">
                  {sortedFindings.length + analysis.threats.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="growth" className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md">
              Growth
              {(analysis.opportunities.length + analysis.content_strategy.length) > 0 && (
                <span className="ml-2 text-[11px] bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">
                  {analysis.opportunities.length + analysis.content_strategy.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="intel" className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md">
              Intel
              {(analysis.competitive_intelligence.length + analysis.trend_signals.length + factIssues.length) > 0 && (
                <span className="ml-2 text-[11px] bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">
                  {analysis.competitive_intelligence.length + analysis.trend_signals.length + factIssues.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ─── Actions Tab ──────────────────────────────────────── */}
          <TabsContent value="actions" className="mt-4 space-y-0">
            {sortedFindings.length === 0 && analysis.threats.length === 0 ? (
              <EmptyState message="No action items identified — your visibility profile looks strong." />
            ) : (
              <div className="divide-y divide-gray-100">
                {/* Findings */}
                {sortedFindings.map((f, i) => {
                  const key = `f-${i}`
                  const isOpen = expandedItem === key
                  return (
                    <div key={key} className="py-4 first:pt-1">
                      <button onClick={() => toggle(key)} className="w-full text-left flex items-start gap-3 group rounded-lg px-2 py-1.5 -mx-2 hover:bg-gray-50 transition-colors cursor-pointer">
                        <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${severityDot[f.severity] || 'bg-gray-300'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-[15px] font-medium text-gray-900 truncate">{f.title}</h4>
                            <span className="text-[11px] text-gray-400 shrink-0">{formatCategoryLabel(f.category)}</span>
                          </div>
                          {!isOpen && (
                            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{f.recommendation}</p>
                          )}
                        </div>
                        <ChevronDown className={`h-4 w-4 text-gray-300 shrink-0 mt-0.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="ml-6 mt-3 space-y-3">
                          <p className="text-sm text-gray-600 leading-relaxed">{f.description}</p>
                          <div className="bg-gray-50 rounded-lg p-3 text-sm">
                            <span className="font-medium text-gray-500">Evidence: </span>
                            <span className="text-gray-600">{cleanModelVersionsInText(f.evidence)}</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm">
                            <ArrowRight className="h-4 w-4 text-[#FF760D] shrink-0 mt-0.5" />
                            <span className="text-gray-800 font-medium">{f.recommendation}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Threats */}
                {analysis.threats.length > 0 && (
                  <>
                    {sortedFindings.length > 0 && (
                      <div className="pt-4 pb-1">
                        <span className="text-[11px] font-semibold text-red-500 uppercase tracking-wider">Threats</span>
                      </div>
                    )}
                    {analysis.threats.map((t, i) => {
                      const key = `t-${i}`
                      const isOpen = expandedItem === key
                      return (
                        <div key={key} className="py-4">
                          <button onClick={() => toggle(key)} className="w-full text-left flex items-start gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-gray-50 transition-colors cursor-pointer">
                            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[15px] font-medium text-gray-900 truncate">{t.title}</h4>
                              {!isOpen && (
                                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{t.mitigation}</p>
                              )}
                            </div>
                            <ChevronDown className={`h-4 w-4 text-gray-300 shrink-0 mt-0.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {isOpen && (
                            <div className="ml-7 mt-3 space-y-3">
                              <p className="text-sm text-gray-600 leading-relaxed">{t.description}</p>
                              <div className="flex items-start gap-2 text-sm">
                                <ArrowRight className="h-4 w-4 text-[#FF760D] shrink-0 mt-0.5" />
                                <span className="text-gray-800 font-medium">{t.mitigation}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            )}
          </TabsContent>

          {/* ─── Growth Tab ───────────────────────────────────────── */}
          <TabsContent value="growth" className="mt-4 space-y-0">
            {analysis.opportunities.length === 0 && analysis.content_strategy.length === 0 ? (
              <EmptyState message="No new growth opportunities identified yet — check back after your next analysis." />
            ) : (
              <div className="space-y-5">
                {/* Opportunities */}
                {analysis.opportunities.length > 0 && (
                  <div className="divide-y divide-gray-100">
                    {analysis.opportunities.map((o, i) => {
                      const key = `o-${i}`
                      const isOpen = expandedItem === key
                      return (
                        <div key={key} className="py-4 first:pt-1">
                          <button onClick={() => toggle(key)} className="w-full text-left flex items-start gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-gray-50 transition-colors cursor-pointer">
                            <Target className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-[15px] font-medium text-gray-900 truncate">{o.title}</h4>
                                <div className="flex gap-1.5 shrink-0">
                                  <span className="text-[11px] text-gray-400">{o.impact} impact</span>
                                  <span className="text-[11px] text-gray-300">·</span>
                                  <span className="text-[11px] text-gray-400">{o.effort} effort</span>
                                </div>
                              </div>
                              {!isOpen && (
                                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{o.expected_outcome}</p>
                              )}
                            </div>
                            <ChevronDown className={`h-4 w-4 text-gray-300 shrink-0 mt-0.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {isOpen && (
                            <div className="ml-7 mt-3 space-y-3">
                              <p className="text-sm text-gray-600 leading-relaxed">{o.description}</p>
                              <div className="flex items-start gap-2 text-sm">
                                <ArrowRight className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                                <span className="text-gray-800 font-medium">{o.expected_outcome}</span>
                              </div>
                              {toArray(o.target_queries).length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {toArray(o.target_queries).map((q, j) => (
                                    <Badge key={j} variant="outline" className="text-[11px] h-6 px-2 bg-white">{q}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Content Strategy */}
                {analysis.content_strategy.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Content to Create</p>
                    <div className="divide-y divide-gray-100">
                      {analysis.content_strategy.map((c, i) => {
                        const key = `c-${i}`
                        const isOpen = expandedItem === key
                        return (
                          <div key={key} className="py-4 first:pt-1">
                            <button onClick={() => toggle(key)} className="w-full text-left flex items-start gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-gray-50 transition-colors cursor-pointer">
                              <FileText className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-[15px] font-medium text-gray-900 truncate">{c.title}</h4>
                                  <Badge className={`text-[11px] h-5 px-2 ${priorityStyle[c.priority] || priorityStyle.medium_term}`}>
                                    {priorityLabels[c.priority] || c.priority}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[11px] text-gray-400">{contentTypeLabels[c.content_type] || c.content_type}</span>
                                  <span className="text-[11px] text-gray-300">·</span>
                                  <span className="text-[11px] text-gray-400">{c.target_topic}</span>
                                </div>
                              </div>
                              <ChevronDown className={`h-4 w-4 text-gray-300 shrink-0 mt-0.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isOpen && (
                              <div className="ml-7 mt-3 space-y-3">
                                <p className="text-sm text-gray-600 leading-relaxed">{c.rationale}</p>
                                {toArray(c.target_publications).length > 0 && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {toArray(c.target_publications).map((pub, j) => (
                                      <Badge key={j} variant="outline" className="text-[11px] h-6 px-2 bg-white">
                                        <ExternalLink className="h-3 w-3 mr-1" />{pub}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ─── Intel Tab ────────────────────────────────────────── */}
          <TabsContent value="intel" className="mt-4 space-y-0">
            {analysis.competitive_intelligence.length === 0 &&
             analysis.trend_signals.length === 0 &&
             factIssues.length === 0 ? (
              <EmptyState message="No competitive intelligence available yet — data will surface after more queries are tracked." />
            ) : (
              <div className="space-y-5">
                {/* Competitors */}
                {analysis.competitive_intelligence.length > 0 && (
                  <div className="divide-y divide-gray-100">
                    {analysis.competitive_intelligence.map((c, i) => {
                      const key = `ci-${i}`
                      const isOpen = expandedItem === key
                      const competitorLogo = getModelLogo(c.competitor)
                      return (
                        <div key={key} className="py-4 first:pt-1">
                          <button onClick={() => toggle(key)} className="w-full text-left flex items-start gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-gray-50 transition-colors cursor-pointer">
                            {competitorLogo ? (
                              <span className="w-6 h-6 rounded-full overflow-hidden shrink-0 relative">
                                <Image src={competitorLogo} alt={c.competitor} fill className="object-contain" />
                              </span>
                            ) : (
                              <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-[11px] font-bold text-gray-500">
                                {c.competitor.charAt(0)}
                              </span>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[15px] font-medium text-gray-900">{c.competitor}</h4>
                              {!isOpen && (
                                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{c.insight}</p>
                              )}
                            </div>
                            <ChevronDown className={`h-4 w-4 text-gray-300 shrink-0 mt-0.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {isOpen && (
                            <div className="ml-9 mt-3 space-y-2">
                              <p className="text-sm text-gray-600 leading-relaxed">{c.insight}</p>
                              <p className="text-sm text-gray-500"><span className="font-medium">Impact:</span> {c.implication}</p>
                              <div className="flex items-start gap-2 text-sm">
                                <ArrowRight className="h-4 w-4 text-[#FF760D] shrink-0 mt-0.5" />
                                <span className="text-gray-800 font-medium">{c.action}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Trends */}
                {analysis.trend_signals.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Trends</p>
                    <div className="divide-y divide-gray-100">
                      {analysis.trend_signals.map((t, i) => {
                        const dc = directionConfig[t.direction] || directionConfig.emerging
                        const DirIcon = dc.icon
                        return (
                          <div key={i} className="py-3.5 first:pt-1 flex items-start gap-3">
                            <DirIcon className={`h-4 w-4 ${dc.color} shrink-0 mt-0.5`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[15px] font-medium text-gray-900">{t.signal}</span>
                                <span className="text-[11px] text-gray-400">{t.timeframe}</span>
                              </div>
                              <p className="text-sm text-gray-500 mt-0.5">{t.implication}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Fact Issues */}
                {factIssues.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-red-500 uppercase tracking-wider mb-3">Fact Issues</p>
                    <div className="divide-y divide-gray-100">
                      {factIssues.map((f, i) => {
                        const vc = verdictConfig[f.verdict] || verdictConfig.unverifiable
                        const VerdictIcon = vc.icon
                        const key = `fv-${i}`
                        const isOpen = expandedItem === key
                        return (
                          <div key={key} className="py-4 first:pt-1">
                            <button onClick={() => toggle(key)} className="w-full text-left flex items-start gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-gray-50 transition-colors cursor-pointer">
                              <VerdictIcon className={`h-4 w-4 ${vc.color} shrink-0 mt-0.5`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[11px] font-medium ${vc.color}`}>{vc.label}</span>
                                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-300">
                                    via
                                    {(() => {
                                      const logo = getModelLogo(f.source_model)
                                      return logo ? (
                                        <Image src={logo} alt={getMainModelName(f.source_model)} width={14} height={14} className="inline-block rounded-sm" />
                                      ) : null
                                    })()}
                                    {getMainModelName(f.source_model)}
                                  </span>
                                </div>
                                <p className="text-[15px] text-gray-900 line-clamp-1">&ldquo;{f.claim}&rdquo;</p>
                              </div>
                              <ChevronDown className={`h-4 w-4 text-gray-300 shrink-0 mt-0.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isOpen && (
                              <div className="ml-7 mt-3 space-y-2">
                                <p className="text-sm text-gray-600 leading-relaxed">{cleanModelVersionsInText(f.evidence)}</p>
                                {f.correction && (
                                  <p className="text-sm"><span className="font-medium text-red-600">Correction:</span> <span className="text-gray-600">{f.correction}</span></p>
                                )}
                                <div className="flex items-start gap-2 text-sm">
                                  <ArrowRight className="h-4 w-4 text-[#FF760D] shrink-0 mt-0.5" />
                                  <span className="text-gray-800 font-medium">{f.suggested_action}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-10">
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  )
}
