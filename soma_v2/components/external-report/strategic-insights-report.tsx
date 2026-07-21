"use client"

/**
 * Strategic Insights Report Component
 * 
 * Rich, executive-level insights panel for external/free audit reports.
 * Mirrors the dashboard Strategic Insights (3-tab: Actions, Growth, Intel)
 * plus data-driven recommendations with specific metrics and evidence.
 * 
 * Falls back to rule-based insights when no LLM-generated analysis exists.
 */

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp, TrendingDown, AlertTriangle, AlertCircle, CheckCircle2,
  Target, Sparkles, FileText, ExternalLink, ArrowRight, ChevronDown,
  ChevronUp, Zap, Lightbulb, Shield, BarChart3, Trophy
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────────────

interface Insight {
  category: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  metric?: string
  metricValue?: string | number
  dataSource?: string
}

interface Recommendation {
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  actions: string[]
  dataSource?: string
}

/** LLM-generated analysis from /api/insights/strategic */
interface StrategicAnalysis {
  executive_summary?: string
  key_findings?: Array<{
    title: string
    description: string
    severity: string
    category: string
    evidence: string
    recommendation: string
  }>
  opportunities?: Array<{
    title: string
    description: string
    impact: string
    effort: string
    expected_outcome: string
    target_queries: string | string[]
  }>
  threats?: Array<{
    title: string
    description: string
    severity: string
    affected_area: string
    mitigation: string
  }>
  content_strategy?: Array<{
    title: string
    target_topic: string
    content_type: string
    target_publications: string | string[]
    rationale: string
    priority: string
  }>
  fact_verification?: Array<{
    claim: string
    source_model: string
    verdict: string
    evidence: string
    correction: string | null
    suggested_action: string
  }>
  competitive_intelligence?: Array<{
    competitor: string
    insight: string
    implication: string
    action: string
  }>
  trend_signals?: Array<{
    signal: string
    direction: string
    confidence: string
    timeframe: string
    implication: string
  }>
}

interface StrategicInsightsReportProps {
  insights: Insight[]
  recommendations: Recommendation[]
  strategicAnalysis?: StrategicAnalysis | null
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const toArray = (v: string | string[] | undefined): string[] => {
  if (!v) return []
  if (Array.isArray(v)) return v
  return v.split(',').map(s => s.trim()).filter(Boolean)
}

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
  blog_post: 'Blog Post', whitepaper: 'Whitepaper', case_study: 'Case Study',
  comparison_page: 'Comparison', faq_page: 'FAQ', how_to_guide: 'How-To',
  industry_report: 'Report', press_release: 'PR', guest_post: 'Guest Post',
  reddit_engagement: 'Reddit', quora_answer: 'Quora', product_page: 'Product',
}

const verdictConfig: Record<string, { color: string; label: string }> = {
  accurate: { color: 'text-green-600', label: 'Accurate' },
  inaccurate: { color: 'text-red-600', label: 'Wrong' },
  outdated: { color: 'text-yellow-600', label: 'Outdated' },
  misleading: { color: 'text-orange-600', label: 'Misleading' },
  unverifiable: { color: 'text-gray-400', label: 'Unverifiable' },
}

const directionConfig: Record<string, { icon: typeof TrendingUp; color: string }> = {
  improving: { icon: TrendingUp, color: 'text-green-600' },
  declining: { icon: TrendingDown, color: 'text-red-600' },
  emerging: { icon: Sparkles, color: 'text-[#FF760D]' },
  volatile: { icon: AlertTriangle, color: 'text-yellow-600' },
}

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

const getMainModelName = (name: string): string => {
  const lower = name.toLowerCase()
  if (lower.includes('gpt') || lower.includes('openai') || lower.includes('chatgpt')) return 'ChatGPT'
  if (lower.includes('claude') || lower.includes('anthropic')) return 'Claude'
  if (lower.includes('gemini') || lower.includes('google')) return 'Gemini'
  if (lower.includes('grok') || lower.includes('xai')) return 'Grok'
  if (lower.includes('perplexity') || lower.includes('sonar')) return 'Perplexity'
  if (lower.includes('llama') || lower.includes('meta')) return 'Meta AI'
  return name
}

const cleanModelVersionsInText = (text: string): string =>
  text.replace(/\b(gpt|chatgpt|openai)[-\s]?[\d][\w.\-]*/gi, 'ChatGPT')
    .replace(/\b(claude|anthropic)[-\s]?[\d][\w.\-]*/gi, 'Claude')
    .replace(/\b(gemini|google)[-\s]?[\d][\w.\-]*/gi, 'Gemini')
    .replace(/\b(grok|xai)[-\s]?[\d][\w.\-]*/gi, 'Grok')
    .replace(/\b(perplexity|sonar)[-\s]?[\d][\w.\-]*/gi, 'Perplexity')
    .replace(/\b(llama|meta)[-\s]?[\d][\w.\-]*/gi, 'Meta AI')

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'high': return 'text-green-700 bg-green-50 border-green-200'
    case 'medium': return 'text-orange-700 bg-orange-50 border-orange-200'
    default: return 'text-gray-700 bg-gray-50 border-gray-200'
  }
}

const getEffortColor = (effort: string) => {
  switch (effort) {
    case 'low': return 'text-green-700 bg-green-50'
    case 'medium': return 'text-orange-700 bg-orange-50'
    default: return 'text-red-700 bg-red-50'
  }
}

const getCategoryIcon = (cat: string) => {
  switch (cat) {
    case 'performance': return BarChart3
    case 'competitive': return Trophy
    case 'content': return FileText
    case 'opportunity': return Zap
    case 'topic': return Target
    case 'perception': return TrendingUp
    default: return Target
  }
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function StrategicInsightsReport({ insights, recommendations, strategicAnalysis }: StrategicInsightsReportProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [showFullSummary, setShowFullSummary] = useState(false)
  const toggle = (key: string) => setExpandedItem(prev => prev === key ? null : key)

  const hasStrategicData = strategicAnalysis && (
    strategicAnalysis.executive_summary ||
    (strategicAnalysis.key_findings && strategicAnalysis.key_findings.length > 0) ||
    (strategicAnalysis.opportunities && strategicAnalysis.opportunities.length > 0)
  )

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════
       *  STRATEGIC INSIGHTS (LLM-driven, same as dashboard)
       * ═══════════════════════════════════════════════════════════════ */}
      {hasStrategicData && (
        <Card className="border border-gray-200 shadow-none bg-white py-0">
          <CardHeader className="pb-4 bg-black text-white rounded-t-lg py-4">
            <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
              <Sparkles className="h-5 w-5 text-white" />
              Strategic Intelligence
            </CardTitle>
            <CardDescription className="text-gray-200 text-sm font-light">
              AI-powered analysis of visibility signals, competitive positioning, and growth opportunities
            </CardDescription>
          </CardHeader>

          {/* Executive summary */}
          {strategicAnalysis!.executive_summary && (
            <div className="border-b border-gray-200">
              <div className="px-5 pt-5 pb-4">
                <p className="text-[13px] leading-[1.7] text-gray-700">
                  {showFullSummary
                    ? strategicAnalysis!.executive_summary
                    : strategicAnalysis!.executive_summary.split(/(?<=\.)\s+/).slice(0, 2).join(' ')}
                </p>
                {strategicAnalysis!.executive_summary.split(/(?<=\.)\s+/).length > 2 && (
                  <button
                    onClick={() => setShowFullSummary(!showFullSummary)}
                    className="text-xs text-gray-400 hover:text-gray-700 mt-2 flex items-center gap-1 font-medium cursor-pointer transition-colors"
                  >
                    {showFullSummary ? <><ChevronUp className="h-3 w-3" />Show less</> : <><ChevronDown className="h-3 w-3" />Read full summary</>}
                  </button>
                )}
              </div>

              {/* Quick indicators */}
              <div className="px-5 pb-4 flex flex-wrap items-center gap-2">
                {(strategicAnalysis!.key_findings || []).filter(f => f.severity === 'critical' || f.severity === 'high').length > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-100 rounded-full px-2.5 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {(strategicAnalysis!.key_findings || []).filter(f => f.severity === 'critical' || f.severity === 'high').length} urgent actions
                  </span>
                )}
                {(strategicAnalysis!.opportunities || []).length > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-100 rounded-full px-2.5 py-1">
                    <Target className="h-3 w-3" />
                    {strategicAnalysis!.opportunities!.length} opportunities
                  </span>
                )}
                {(strategicAnalysis!.threats || []).length > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-1">
                    <AlertTriangle className="h-3 w-3" />
                    {strategicAnalysis!.threats!.length} threats
                  </span>
                )}
                {(strategicAnalysis!.fact_verification || []).filter(f => f.verdict !== 'accurate').length > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-100 rounded-full px-2.5 py-1">
                    <AlertCircle className="h-3 w-3" />
                    {(strategicAnalysis!.fact_verification || []).filter(f => f.verdict !== 'accurate').length} fact issues
                  </span>
                )}
                {(strategicAnalysis!.trend_signals || []).length > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1">
                    <TrendingUp className="h-3 w-3" />
                    {strategicAnalysis!.trend_signals!.length} trends detected
                  </span>
                )}
              </div>
            </div>
          )}

          <CardContent className="pt-5">
            <Tabs defaultValue="actions" className="w-full">
              <TabsList className="w-full bg-gray-100 p-1 h-11 rounded-lg">
                <TabsTrigger value="actions" className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md">
                  Actions
                </TabsTrigger>
                <TabsTrigger value="growth" className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md">
                  Growth
                </TabsTrigger>
                <TabsTrigger value="intel" className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md">
                  Intel
                </TabsTrigger>
              </TabsList>

              {/* ─── Actions Tab ─── */}
              <TabsContent value="actions" className="mt-4 space-y-0">
                <div className="divide-y divide-gray-100">
                  {(strategicAnalysis!.key_findings || [])
                    .sort((a, b) => ({'critical':0,'high':1,'medium':2,'low':3}[a.severity]??3) - ({'critical':0,'high':1,'medium':2,'low':3}[b.severity]??3))
                    .map((f, i) => {
                      const key = `f-${i}`
                      const isOpen = expandedItem === key
                      return (
                        <div key={key} className="py-4 first:pt-1">
                          <button onClick={() => toggle(key)} className="w-full text-left flex items-start gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-gray-50 transition-colors cursor-pointer">
                            <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${severityDot[f.severity] || 'bg-gray-300'}`} />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[15px] font-medium text-gray-900 truncate">{f.title}</h4>
                              {!isOpen && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{f.recommendation}</p>}
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
                  {(strategicAnalysis!.threats || []).map((t, i) => {
                    const key = `t-${i}`
                    const isOpen = expandedItem === key
                    return (
                      <div key={key} className="py-4">
                        <button onClick={() => toggle(key)} className="w-full text-left flex items-start gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-gray-50 transition-colors cursor-pointer">
                          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[15px] font-medium text-gray-900 truncate">{t.title}</h4>
                            {!isOpen && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{t.mitigation}</p>}
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
                </div>
                {(strategicAnalysis!.key_findings || []).length === 0 && (strategicAnalysis!.threats || []).length === 0 && (
                  <div className="flex items-center justify-center py-10">
                    <p className="text-sm text-gray-400">No urgent actions identified — your visibility profile looks strong.</p>
                  </div>
                )}
              </TabsContent>

              {/* ─── Growth Tab ─── */}
              <TabsContent value="growth" className="mt-4 space-y-5">
                {(strategicAnalysis!.opportunities || []).length > 0 && (
                  <div className="divide-y divide-gray-100">
                    {strategicAnalysis!.opportunities!.map((o, i) => {
                      const key = `o-${i}`
                      const isOpen = expandedItem === key
                      return (
                        <div key={key} className="py-4 first:pt-1">
                          <button onClick={() => toggle(key)} className="w-full text-left flex items-start gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-gray-50 transition-colors cursor-pointer">
                            <Target className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-[15px] font-medium text-gray-900 truncate">{o.title}</h4>
                                <span className="text-[11px] text-gray-400 shrink-0">{o.impact} impact · {o.effort} effort</span>
                              </div>
                              {!isOpen && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{o.expected_outcome}</p>}
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

                {(strategicAnalysis!.content_strategy || []).length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Content to Create</p>
                    <div className="divide-y divide-gray-100">
                      {strategicAnalysis!.content_strategy!.map((c, i) => {
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

                {(strategicAnalysis!.opportunities || []).length === 0 && (strategicAnalysis!.content_strategy || []).length === 0 && (
                  <div className="flex items-center justify-center py-10">
                    <p className="text-sm text-gray-400">No growth opportunities identified yet — check back after more data is collected.</p>
                  </div>
                )}
              </TabsContent>

              {/* ─── Intel Tab ─── */}
              <TabsContent value="intel" className="mt-4 space-y-5">
                {/* Competitor intelligence */}
                {(strategicAnalysis!.competitive_intelligence || []).length > 0 && (
                  <div className="divide-y divide-gray-100">
                    {strategicAnalysis!.competitive_intelligence!.map((c, i) => {
                      const key = `ci-${i}`
                      const isOpen = expandedItem === key
                      return (
                        <div key={key} className="py-4 first:pt-1">
                          <button onClick={() => toggle(key)} className="w-full text-left flex items-start gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-gray-50 transition-colors cursor-pointer">
                            <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-[11px] font-bold text-gray-500">
                              {c.competitor.charAt(0)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[15px] font-medium text-gray-900">{c.competitor}</h4>
                              {!isOpen && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{c.insight}</p>}
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
                {(strategicAnalysis!.trend_signals || []).length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Trends</p>
                    <div className="divide-y divide-gray-100">
                      {strategicAnalysis!.trend_signals!.map((t, i) => {
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

                {/* Fact issues */}
                {(strategicAnalysis!.fact_verification || []).filter(f => f.verdict !== 'accurate').length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-red-500 uppercase tracking-wider mb-3">Fact Issues</p>
                    <div className="divide-y divide-gray-100">
                      {strategicAnalysis!.fact_verification!.filter(f => f.verdict !== 'accurate').map((f, i) => {
                        const vc = verdictConfig[f.verdict] || verdictConfig.unverifiable
                        const key = `fv-${i}`
                        const isOpen = expandedItem === key
                        return (
                          <div key={key} className="py-4 first:pt-1">
                            <button onClick={() => toggle(key)} className="w-full text-left flex items-start gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-gray-50 transition-colors cursor-pointer">
                              <AlertCircle className={`h-4 w-4 ${vc.color} shrink-0 mt-0.5`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[11px] font-medium ${vc.color}`}>{vc.label}</span>
                                  <span className="text-[11px] text-gray-300">via {getMainModelName(f.source_model)}</span>
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

                {(strategicAnalysis!.competitive_intelligence || []).length === 0 &&
                 (strategicAnalysis!.trend_signals || []).length === 0 &&
                 (strategicAnalysis!.fact_verification || []).filter(f => f.verdict !== 'accurate').length === 0 && (
                  <div className="flex items-center justify-center py-10">
                    <p className="text-sm text-gray-400">No competitive intelligence available yet.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════
       *  DATA-DRIVEN INSIGHTS (rule-based, always shown)
       * ═══════════════════════════════════════════════════════════════ */}
      <Card className="border border-gray-200 shadow-none bg-white py-0">
        <CardHeader className="pb-4 bg-black text-white rounded-t-lg py-4">
          <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
            <Lightbulb className="h-5 w-5 text-white" />
            Key Findings
          </CardTitle>
          <CardDescription className="text-gray-200 text-sm font-light">
            Data-driven findings from your AI visibility analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, idx) => {
              const Icon = getCategoryIcon(insight.category)
              return (
                <div
                  key={idx}
                  className={`rounded-lg p-5 border-2 transition-all duration-150 ${
                    insight.impact === 'high'
                      ? 'border-gray-900 bg-gray-50 hover:bg-gray-100'
                      : 'border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${insight.impact === 'high' ? 'bg-gray-900' : 'bg-gray-100'}`}>
                        <Icon className={`h-5 w-5 ${insight.impact === 'high' ? 'text-white' : 'text-gray-700'}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-base text-gray-900 mb-1">{insight.title}</h3>
                        {insight.metricValue && (
                          <div className="text-2xl font-bold text-gray-900 mb-2">
                            {insight.metricValue}
                            {insight.metric && <span className="text-sm font-normal text-gray-600 ml-2">{insight.metric}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs font-semibold ${getImpactColor(insight.impact)}`}>
                      {insight.impact.toUpperCase()} IMPACT
                    </Badge>
                  </div>
                  <p className="text-[15px] text-gray-700 leading-relaxed">{insight.description}</p>
                  {insight.dataSource && (
                    <p className="text-xs text-gray-400 mt-2 italic">Based on {insight.dataSource}</p>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════
       *  HIGH-IMPACT RECOMMENDATIONS
       * ═══════════════════════════════════════════════════════════════ */}
      <Card className="border border-gray-200 shadow-none bg-white py-0">
        <CardHeader className="pb-4 bg-black text-white rounded-t-lg py-4">
          <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
            <Zap className="h-5 w-5 text-white" />
            High-Impact Opportunities
          </CardTitle>
          <CardDescription className="text-gray-200 text-sm font-light">
            Strategic actions to increase your AI visibility and rankings
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {/* High priority */}
          {recommendations.filter(r => r.impact === 'high').length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {recommendations.filter(r => r.impact === 'high').map((rec, idx) => (
                <div key={idx} className="rounded-lg p-4 border-2 border-gray-900 bg-gray-50 hover:bg-gray-100 transition-colors duration-150">
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-gray-900 text-white text-xs font-semibold">HIGH PRIORITY</Badge>
                      <Badge variant="outline" className={`text-xs font-semibold ${getEffortColor(rec.effort)}`}>{rec.effort} effort</Badge>
                    </div>
                    <h3 className="font-bold text-base text-gray-900 mb-2">{rec.title}</h3>
                    <p className="text-sm text-gray-700 leading-snug">{rec.description}</p>
                  </div>
                  <div className="bg-white rounded-md p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-gray-900" />
                      <span className="text-xs font-semibold text-gray-900">Key Actions:</span>
                    </div>
                    <ul className="space-y-1.5">
                      {rec.actions.slice(0, 3).map((action, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                          <ArrowRight className="h-3.5 w-3.5 text-gray-900 flex-shrink-0 mt-0.5" />
                          <span className="leading-snug">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Other recommendations */}
          {recommendations.filter(r => r.impact !== 'high').length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Additional Opportunities</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {recommendations.filter(r => r.impact !== 'high').map((rec, idx) => (
                  <div key={idx} className="rounded-md p-3 border border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50 transition-colors duration-150">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={`text-[10px] font-semibold ${getImpactColor(rec.impact)}`}>{rec.impact}</Badge>
                      <Badge variant="outline" className={`text-[10px] font-semibold ${getEffortColor(rec.effort)}`}>{rec.effort} effort</Badge>
                    </div>
                    <h4 className="font-bold text-sm text-gray-900 mb-1.5 leading-snug">{rec.title}</h4>
                    <p className="text-xs text-gray-600 leading-snug">{rec.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
