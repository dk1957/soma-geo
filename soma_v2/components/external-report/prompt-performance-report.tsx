"use client"

/**
 * Prompt Performance Report Component
 *
 * Rich prompt-level analysis for external/free-audit reports.
 * Shows per-prompt LVI, gSOV, mentions, sentiment, position and model breakdowns.
 * Closely mirrors the dashboard /prompts and /prompts/[promptId] pages.
 */

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChevronDown, ChevronUp, ChevronRight, MessageSquare, TrendingUp,
  TrendingDown, Target, AlertTriangle, Sparkles, FileText,
  Activity, Shield, Trophy, BarChart3, Globe
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ────────────────────────────────────────────────────────────

interface PromptItem {
  promptKey: string
  promptText: string
  category: string
  intent?: string
  mentionRate: number           // 0-100
  avgSentiment: number          // -1 to 1
  avgPosition?: number | null
  lviScore?: number             // 0-100
  gSOV?: number                 // 0-100
  totalResponses?: number
  citationCount?: number
  opportunityScore: number
  isOpportunity: boolean
  isThreat: boolean
  isStrength?: boolean
  topCompetitor?: string | null
  competitorMentions?: number
  visibilityGap?: number
  modelPerformance?: Record<string, {
    lvi: number
    mentions: number
    sentiment: number
    responses: number
  }>
}

interface PromptPerformanceReportProps {
  prompts: PromptItem[]
  brandName?: string
}

// ── Helpers ──────────────────────────────────────────────────────────

function getModelLogo(model: string): string {
  const m = model.toLowerCase()
  if (m.includes('gpt') || m.includes('openai') || m.includes('chatgpt')) return '/models/chatgpt-logo.png'
  if (m.includes('claude')) return '/models/claude-logo.png'
  if (m.includes('gemini')) return '/models/gemini-logo.png'
  if (m.includes('grok')) return '/models/grok-logo.png'
  if (m.includes('perplexity') || m.includes('pplx') || m.includes('sonar')) return '/models/perplexity-logo.png'
  if (m.includes('llama') || m.includes('meta')) return '/models/meta-logo.svg'
  return '/models/chatgpt-logo.png'
}

function cleanModelName(raw: string): string {
  if (!raw) return raw
  const m = raw.toLowerCase()
  if (m.includes('gpt') || m.includes('openai') || m.includes('chatgpt')) return 'ChatGPT'
  if (m.includes('claude')) return 'Claude'
  if (m.includes('gemini')) return 'Gemini'
  if (m.includes('grok')) return 'Grok'
  if (m.includes('perplexity') || m.includes('pplx') || m.includes('sonar')) return 'Perplexity'
  if (m.includes('llama') || m.includes('meta')) return 'Meta AI'
  return raw
}

function sentimentLabel(v: number): string {
  const s10 = (v + 1) * 5
  return s10 >= 7 ? 'Positive' : s10 < 4 ? 'Negative' : 'Neutral'
}

function sentimentColor(v: number): string {
  const s10 = (v + 1) * 5
  return s10 >= 7 ? 'text-green-600' : s10 < 4 ? 'text-red-600' : 'text-gray-700'
}

const categoryLabels: Record<string, string> = {
  branded: 'Brand Defense',
  brand_defense: 'Brand Defense',
  discovery: 'Discovery',
  general: 'General',
  category_capture: 'Category',
  solution_discovery: 'Solution',
  competitive: 'Competitive',
}

// ── Prompt Row ───────────────────────────────────────────────────────

function PromptRow({ prompt, rank }: { prompt: PromptItem; rank: number }) {
  const [expanded, setExpanded] = useState(false)
  const s10 = (prompt.avgSentiment + 1) * 5
  const models = prompt.modelPerformance ? Object.entries(prompt.modelPerformance) : []

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left grid grid-cols-[32px_1fr_72px_64px_64px_64px_64px_28px] items-center gap-2 px-5 py-3 hover:bg-gray-50/60 transition-colors"
      >
        <span className="text-sm text-muted-foreground font-medium text-right tabular-nums">{rank}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 line-clamp-1">{prompt.promptText}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] h-4 px-1.5",
                prompt.isStrength ? "border-green-300 text-green-700" :
                  prompt.isThreat ? "border-red-300 text-red-700" :
                    prompt.isOpportunity ? "border-orange-300 text-orange-700" :
                      "border-gray-200 text-gray-500"
              )}
            >
              {prompt.isStrength ? 'Strength' : prompt.isThreat ? 'Threat' : prompt.isOpportunity ? 'Opportunity' : (categoryLabels[prompt.category] || prompt.category)}
            </Badge>
            {prompt.topCompetitor && (
              <span className="text-[10px] text-gray-400">vs {prompt.topCompetitor}</span>
            )}
          </div>
        </div>
        <span className="text-sm font-semibold text-gray-900 tabular-nums text-right">
          {prompt.lviScore != null ? `${Math.round(prompt.lviScore)}` : '—'}
          <span className="text-[10px] text-gray-400 font-normal">/100</span>
        </span>
        <span className="text-sm font-semibold text-gray-900 tabular-nums text-right">
          {prompt.gSOV != null ? `${Math.round(prompt.gSOV)}%` : '—'}
        </span>
        <span className="text-sm font-semibold text-gray-900 tabular-nums text-right">
          {prompt.mentionRate > 0 ? `${Math.round(prompt.mentionRate)}%` : '—'}
        </span>
        <span className={cn("text-sm font-semibold tabular-nums text-right", sentimentColor(prompt.avgSentiment))}>
          {s10.toFixed(1)}<span className="text-[10px] font-normal">/10</span>
        </span>
        <span className="text-sm font-semibold text-gray-900 tabular-nums text-right">
          {prompt.avgPosition != null && prompt.avgPosition > 0 ? `#${Math.round(prompt.avgPosition)}` : '—'}
        </span>
        <div className="flex justify-center">
          <ChevronDown className={`h-4 w-4 text-gray-300 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="px-10 pb-4 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox icon={MessageSquare} label="Responses" value={prompt.totalResponses ?? '—'} />
            <StatBox icon={FileText} label="Citations" value={prompt.citationCount ?? '—'} />
            <StatBox
              icon={Target}
              label="Opportunity"
              value={`${Math.round(prompt.opportunityScore)}`}
              valueColor={prompt.opportunityScore >= 70 ? 'text-green-600' : prompt.opportunityScore >= 30 ? 'text-orange-600' : 'text-gray-600'}
            />
            <StatBox
              icon={BarChart3}
              label="Gap vs Competitor"
              value={prompt.visibilityGap != null ? `${prompt.visibilityGap > 0 ? '+' : ''}${Math.round(prompt.visibilityGap)}%` : '—'}
              valueColor={prompt.visibilityGap != null ? (prompt.visibilityGap >= 0 ? 'text-green-600' : 'text-red-600') : ''}
            />
          </div>

          {/* Model breakdown */}
          {models.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Model Breakdown</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {models.map(([model, stats]) => (
                  <div key={model} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-100 bg-gray-50/50">
                    <img
                      src={getModelLogo(model)}
                      alt={cleanModelName(model)}
                      className="h-6 w-6 rounded-full border border-gray-200 object-cover bg-white shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-gray-900">{cleanModelName(model)}</span>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] text-gray-500">LVI {Math.round(stats.lvi)}</span>
                        <span className="text-[10px] text-gray-500">{stats.mentions} mentions</span>
                        <span className={cn("text-[10px]", sentimentColor(stats.sentiment))}>
                          {sentimentLabel(stats.sentiment)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatBox({
  icon: Icon, label, value, valueColor = ''
}: { icon: React.ElementType; label: string; value: string | number; valueColor?: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn("text-lg font-bold text-gray-900 tabular-nums", valueColor)}>{value}</p>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────

export function PromptPerformanceReport({ prompts, brandName = 'Your Brand' }: PromptPerformanceReportProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'strengths' | 'opportunities' | 'threats'>('all')
  const [showAll, setShowAll] = useState(false)

  const strengths = useMemo(() => prompts.filter(p => p.isStrength || (!p.isOpportunity && !p.isThreat && p.mentionRate >= 50)), [prompts])
  const opportunities = useMemo(() => prompts.filter(p => p.isOpportunity), [prompts])
  const threats = useMemo(() => prompts.filter(p => p.isThreat), [prompts])

  const filtered = useMemo(() => {
    let list = prompts
    if (activeTab === 'strengths') list = strengths
    else if (activeTab === 'opportunities') list = opportunities
    else if (activeTab === 'threats') list = threats
    return list.sort((a, b) => b.opportunityScore - a.opportunityScore)
  }, [activeTab, prompts, strengths, opportunities, threats])

  const displayed = showAll ? filtered : filtered.slice(0, 15)

  if (prompts.length === 0) {
    return (
      <Card className="border border-gray-200 shadow-none bg-white py-0">
        <CardHeader className="pb-4 bg-black text-white rounded-t-lg py-4">
          <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
            <MessageSquare className="h-5 w-5 text-white" />
            Prompt Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Prompt analysis will appear here after data is processed.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-gray-200 shadow-none bg-white py-0">
      <CardHeader className="pb-4 bg-black text-white rounded-t-lg py-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
              <MessageSquare className="h-5 w-5 text-white" />
              Prompt Performance
            </CardTitle>
            <CardDescription className="text-gray-300 font-light">
              Per-query analysis showing {brandName}&apos;s visibility across {prompts.length} prompts
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {strengths.length > 0 && (
              <Badge variant="outline" className="border-green-600/40 text-green-400 text-xs font-medium">
                <Shield className="h-3 w-3 mr-1" />{strengths.length} strengths
              </Badge>
            )}
            {opportunities.length > 0 && (
              <Badge variant="outline" className="border-[#FF760D]/40 text-[#FF760D] text-xs font-medium">
                <Target className="h-3 w-3 mr-1" />{opportunities.length} opportunities
              </Badge>
            )}
            {threats.length > 0 && (
              <Badge variant="outline" className="border-red-600/40 text-red-400 text-xs font-medium">
                <AlertTriangle className="h-3 w-3 mr-1" />{threats.length} threats
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Filter tabs */}
      <div className="border-b border-gray-100">
        <div className="flex gap-1 px-5 py-2">
          {([
            { key: 'all', label: `All (${prompts.length})` },
            { key: 'strengths', label: `Strengths (${strengths.length})` },
            { key: 'opportunities', label: `Opportunities (${opportunities.length})` },
            { key: 'threats', label: `Threats (${threats.length})` },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setShowAll(false) }}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                activeTab === tab.key ? 'bg-black text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <CardContent className="px-0 pt-0">
        {/* Table header */}
        <div className="grid grid-cols-[32px_1fr_72px_64px_64px_64px_64px_28px] items-center gap-2 px-5 py-2.5 border-b border-gray-100 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          <span className="text-right">#</span>
          <span>Prompt</span>
          <span className="text-right">LVI</span>
          <span className="text-right">gSOV</span>
          <span className="text-right">Mention</span>
          <span className="text-right">Sentiment</span>
          <span className="text-right">Position</span>
          <span />
        </div>

        {displayed.map((prompt, i) => (
          <PromptRow key={prompt.promptKey} prompt={prompt} rank={i + 1} />
        ))}

        {filtered.length > 15 && (
          <div className="pt-3 pb-4 text-center border-t border-gray-100">
            <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)} className="text-xs text-muted-foreground">
              {showAll ? 'Show top 15' : `Show all ${filtered.length} prompts`}
            </Button>
          </div>
        )}

        {filtered.length > 0 && !(filtered.length > 15) && (
          <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{filtered.length} prompt{filtered.length !== 1 ? 's' : ''}</span>
            <span className="text-xs text-muted-foreground">
              Avg LVI: {Math.round(filtered.reduce((s, p) => s + (p.lviScore || 0), 0) / filtered.length)}/100
            </span>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <MessageSquare className="h-8 w-8 text-gray-200 mb-3" />
            <p className="text-sm">No prompts in this category</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
