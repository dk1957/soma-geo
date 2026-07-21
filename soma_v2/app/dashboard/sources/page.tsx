'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  RefreshCw,
  Globe,
  ShieldCheck,
  BarChart3,
  Zap,
  AlertCircle,
  TrendingUp,
  Search,
  Link2,
  ArrowUpRight,
  X,
  Target,
  Layers,
  ExternalLink,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Crown,
  Minus,
  ChevronRight,
  MessageSquare,
  FileText,
  Info
} from "lucide-react"
import { useBrand } from "@/lib/contexts/brand-context"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"

// ── Types ────────────────────────────────────────────────────────────

interface SourceContext {
  url: string
  title?: string
  context?: string
  snippet?: string
}

interface Source {
  id: string
  domain: string
  title: string
  url: string
  authority_score: number
  citation_count: number
  content_type: string
  source_category?: string
  domain_type?: string
  citation_quality: 'primary' | 'secondary' | 'tertiary'
  platforms: string[]
  trust_signals: string[]
  trend: 'up' | 'down' | 'stable'
  change_percentage: number
  citation_velocity: number
  status: 'active' | 'monitored' | 'competitor' | 'opportunity'
  brand_mentions: number
  contextual_relevance: number
  sample_contexts?: (string | SourceContext)[]
  is_target_publisher?: boolean
  is_competitor?: boolean
  is_inferred_competitor?: boolean
  competitor_name?: string | null
  brands_mentioned_in_sources?: string[]
  associated_brands?: string[]
  avg_citation_position?: number
  first_citation_count?: number
  citation_share?: number
}

interface TopUrl {
  url: string
  title: string
  domain: string
  citations: number
  domain_type: string | null
  brand_mentioned?: boolean
  snippet?: string
  prompt_text?: string
  model_name?: string
  models?: string[]
  prompts?: Array<{ prompt_id: string; prompt_text: string; model_name: string }>
}

interface SourceMetrics {
  total_sources: number
  avg_authority_score: number
  total_citations: number
  platform_coverage: number
  high_authority_sources: number
  trending_sources: number
  quality_score: number
  citation_velocity: number
  domain_diversity: number
}

interface CompetitiveGapItem {
  domain: string
  authority: number | null
  citation_count: number
  competitor_name: string
}

interface Insight {
  category: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  metricValue?: string | number
  metric?: string
}

interface Recommendation {
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  actions?: string[]
}

interface SourcesResponse {
  success: boolean
  data: {
    metrics: SourceMetrics
    sources: Source[]
    top_urls?: TopUrl[]
    domain_type_share?: Record<string, { count: number; share: number }>
    relationship_share?: Record<string, { count: number; share: number }>
    analytics: {
      content_type_distribution: Record<string, number>
      competitive_gap: CompetitiveGapItem[]
      insights?: Insight[]
      recommendations?: Recommendation[]
      [key: string]: any
    }
  }
  metadata: any
}

// ── Constants ────────────────────────────────────────────────────────

const DOMAIN_TYPE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  'own':            { bg: 'bg-orange-50', text: 'text-orange-700', bar: '#FF760D' },
  'competitor':     { bg: 'bg-red-50', text: 'text-red-700', bar: '#DC2626' },
  'news':           { bg: 'bg-blue-50', text: 'text-blue-700', bar: '#2563EB' },
  'editorial':      { bg: 'bg-indigo-50', text: 'text-indigo-700', bar: '#4F46E5' },
  'blog':           { bg: 'bg-violet-50', text: 'text-violet-700', bar: '#7C3AED' },
  'ugc':            { bg: 'bg-amber-50', text: 'text-amber-700', bar: '#D97706' },
  'social':         { bg: 'bg-pink-50', text: 'text-pink-700', bar: '#DB2777' },
  'reference':      { bg: 'bg-cyan-50', text: 'text-cyan-700', bar: '#0891B2' },
  'academic':       { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: '#059669' },
  'government':     { bg: 'bg-slate-100', text: 'text-slate-700', bar: '#475569' },
  'institutional':  { bg: 'bg-teal-50', text: 'text-teal-700', bar: '#0D9488' },
  'corporate':      { bg: 'bg-neutral-100', text: 'text-neutral-700', bar: '#404040' },
  'other':          { bg: 'bg-gray-50', text: 'text-gray-500', bar: '#D4D4D4' },
}

// ── Reusable Components ──────────────────────────────────────────────

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
    </div>
  )
}

function DomainTypeBadge({ type }: { type: string }) {
  const normalized = (type || 'other').toLowerCase().replace(/_/g, '-').trim()
  const colors = DOMAIN_TYPE_COLORS[normalized] || DOMAIN_TYPE_COLORS['other']
  const labels: Record<string, string> = {
    'own': 'Own', 'competitor': 'Competitor', 'news': 'News', 'editorial': 'Editorial',
    'blog': 'Blog', 'ugc': 'UGC', 'social': 'Social', 'reference': 'Reference',
    'academic': 'Academic', 'government': 'Government', 'institutional': 'Institutional',
    'corporate': 'Corporate', 'other': 'Other',
    // Legacy fallbacks
    'fintech': 'Corporate', 'telecom': 'Corporate', 'industry': 'Corporate',
    'e-commerce': 'Corporate', 'official': 'Institutional', 'user-generated': 'UGC',
    'comparison': 'UGC',
  }
  const label = labels[normalized] || normalized.charAt(0).toUpperCase() + normalized.slice(1).replace(/-/g, ' ')
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide ${colors.bg} ${colors.text}`}>
      {label}
    </span>
  )
}

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

/** Map raw model identifier to its simple brand name */
function cleanModelName(raw: string): string {
  if (!raw) return raw
  const m = raw.toLowerCase()
  if (m.includes('gpt') || m.includes('openai') || m.includes('chatgpt')) return 'ChatGPT'
  if (m.includes('claude')) return 'Claude'
  if (m.includes('gemini')) return 'Gemini'
  if (m.includes('grok')) return 'Grok'
  if (m.includes('perplexity') || m.includes('pplx') || m.includes('sonar')) return 'Perplexity'
  if (m.includes('llama') || m.includes('meta')) return 'Meta AI'
  if (m.includes('mistral')) return 'Mistral'
  if (m.includes('copilot')) return 'Copilot'
  // Fallback: strip provider prefix and take first segment capitalised
  const name = raw.includes('/') ? raw.split('/').slice(1).join('/') : raw
  const first = name.split(/[-_]/)[0]
  return first.charAt(0).toUpperCase() + first.slice(1)
}

function ModelStack({ models }: { models: string[] }) {
  if (!models || models.length === 0) return <span className="text-xs text-gray-300">&mdash;</span>
  // Deduplicate by brand name so e.g. gpt-4o and gpt-5-mini both show one ChatGPT icon
  const seen = new Set<string>()
  const unique: string[] = []
  for (const model of models) {
    const brand = cleanModelName(model)
    if (!seen.has(brand)) { seen.add(brand); unique.push(model) }
  }
  return (
    <div className="flex -space-x-1.5">
      {unique.slice(0, 4).map((model) => (
        <Tooltip key={model}>
          <TooltipTrigger asChild>
            <img
              src={getModelLogo(model)}
              alt={cleanModelName(model)}
              className="h-5 w-5 rounded-full border border-white shadow-sm object-cover bg-white"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">{cleanModelName(model)}</TooltipContent>
        </Tooltip>
      ))}
      {unique.length > 4 && (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white bg-gray-100 text-gray-500 text-[9px] font-medium shadow-sm">
          +{unique.length - 4}
        </span>
      )}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, subtext, accent }: {
  icon: React.ElementType; label: string; value: string | number; subtext?: string; accent?: string
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{value}</p>
            {subtext && <p className="text-[11px] text-muted-foreground mt-0.5">{subtext}</p>}
          </div>
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${accent || 'bg-gray-100'}`}>
            <Icon className="h-4.5 w-4.5 text-gray-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── SVG Donut Chart ──────────────────────────────────────────────────

function DonutChart({ data, size = 200, strokeWidth = 28 }: {
  data: { key: string; label: string; value: number; share: number; color: string }[]
  size?: number
  strokeWidth?: number
}) {
  const [hovered, setHovered] = useState<string | null>(null)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2
  const total = data.reduce((s, d) => s + d.value, 0)

  let cumulativePercent = 0

  // Compute midpoint angles for tooltip positioning
  const segments = data.map((segment) => {
    const percent = total > 0 ? segment.value / total : 0
    const startPercent = cumulativePercent
    cumulativePercent += percent
    const midPercent = startPercent + percent / 2
    // Angle in radians (-90° offset because SVG is rotated)
    const angle = midPercent * 2 * Math.PI
    return { ...segment, percent, startPercent, midPercent, angle }
  })

  const hoveredSegment = segments.find(s => s.key === hovered)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#F5F5F5" strokeWidth={strokeWidth} />
        {segments.map((segment) => {
          const offset = circumference * segment.startPercent
          const segmentLength = circumference * segment.percent
          const gap = data.length > 1 ? 2 : 0
          return (
            <circle
              key={segment.key}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={hovered === segment.key ? strokeWidth + 6 : strokeWidth}
              strokeDasharray={`${Math.max(segmentLength - gap, 0)} ${circumference - segmentLength + gap}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              className="transition-all duration-300 cursor-pointer"
              style={{ filter: hovered === segment.key ? 'brightness(1.1)' : undefined }}
              onMouseEnter={() => setHovered(segment.key)}
              onMouseLeave={() => setHovered(null)}
            />
          )
        })}
      </svg>
      {hoveredSegment && (
        <div
          className="absolute pointer-events-none z-10 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap"
          style={{
            left: center + Math.cos(hoveredSegment.angle - Math.PI / 2) * (radius * 0.5) - 40,
            top: center + Math.sin(hoveredSegment.angle - Math.PI / 2) * (radius * 0.5) - 16,
          }}
        >
          <span className="font-semibold">{hoveredSegment.label}</span>
          <span className="ml-1.5 text-gray-300">{hoveredSegment.share.toFixed(1)}%</span>
          <span className="ml-1.5 text-gray-400">({hoveredSegment.value})</span>
        </div>
      )}
    </div>
  )
}


// ── Main Page ────────────────────────────────────────────────────────

export default function SourcesPage() {
  const { currentBrand } = useBrand()
  const [sources, setSources] = useState<Source[]>([])
  const [topUrls, setTopUrls] = useState<TopUrl[]>([])
  const [domainTypeShare, setDomainTypeShare] = useState<Record<string, { count: number; share: number }>>({})
  const [sourceMetrics, setSourceMetrics] = useState<SourceMetrics>({
    total_sources: 0, avg_authority_score: 0, total_citations: 0,
    platform_coverage: 0, high_authority_sources: 0, trending_sources: 0,
    quality_score: 0, citation_velocity: 0, domain_diversity: 0
  })
  const [competitiveGap, setCompetitiveGap] = useState<CompetitiveGapItem[]>([])
  const [contentTypeDistribution, setContentTypeDistribution] = useState<Record<string, number>>({})
  const [insights, setInsights] = useState<Insight[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDomain, setSelectedDomain] = useState<Source | null>(null)
  const [showAllDomains, setShowAllDomains] = useState(false)
  const [showAllUrls, setShowAllUrls] = useState(false)
  // Filters for Domain Citation Ranking
  const [filterType, setFilterType] = useState<string>('all')
  const [filterModel, setFilterModel] = useState<string>('all')
  const [filterBrand, setFilterBrand] = useState<string>('all')

  useEffect(() => {
    setSources([]); setTopUrls([]); setDomainTypeShare({})
    setSourceMetrics({ total_sources: 0, avg_authority_score: 0, total_citations: 0, platform_coverage: 0, high_authority_sources: 0, trending_sources: 0, quality_score: 0, citation_velocity: 0, domain_diversity: 0 })
    setCompetitiveGap([]); setContentTypeDistribution({}); setInsights([]); setRecommendations([])
    setSearchQuery(''); setSelectedDomain(null); setError(null); setIsLoading(true)
  }, [currentBrand?.id])

  const fetchSourcesData = useCallback(async () => {
    if (!currentBrand?.id) return
    setIsLoading(true); setError(null)
    try {
      const params = new URLSearchParams({ brand_id: currentBrand.id, timeframe, contentType: 'all', authorityMin: '0', authorityMax: '100' })
      const response = await fetch(`/api/analytics/sources/detailed?${params}`, { credentials: 'include' })
      if (!response.ok) throw new Error('Failed to fetch sources data')
      const result: SourcesResponse = await response.json()
      if (result.success) {
        setSources(result.data.sources)
        setTopUrls(result.data.top_urls || [])
        setDomainTypeShare(result.data.domain_type_share || {})
        setSourceMetrics(result.data.metrics)
        setCompetitiveGap(result.data.analytics.competitive_gap || [])
        setContentTypeDistribution(result.data.analytics.content_type_distribution || {})
        setInsights(result.data.analytics.insights || [])
        setRecommendations(result.data.analytics.recommendations || [])
      } else { throw new Error('API returned error') }
    } catch {
      setError('Failed to load sources data')
      toast.error("Failed to load sources data")
    } finally { setIsLoading(false) }
  }, [currentBrand?.id, timeframe])

  useEffect(() => { if (currentBrand?.id) fetchSourcesData() }, [currentBrand?.id, timeframe, fetchSourcesData])

  // ── Computed ──

  const filteredSources = useMemo(() => {
    let result = sources
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s => s.domain.toLowerCase().includes(q))
    }
    if (filterType !== 'all') {
      result = result.filter(s => (s.content_type || 'other').toLowerCase() === filterType)
    }
    if (filterModel !== 'all') {
      result = result.filter(s => s.platforms?.some(p => p.toLowerCase().includes(filterModel)))
    }
    if (filterBrand === 'mentioned') {
      result = result.filter(s => s.brands_mentioned_in_sources && s.brands_mentioned_in_sources.length > 0)
    } else if (filterBrand === 'not_mentioned') {
      result = result.filter(s => !s.brands_mentioned_in_sources || s.brands_mentioned_in_sources.length === 0)
    }
    return result.sort((a, b) => b.citation_count - a.citation_count)
  }, [sources, searchQuery, filterType, filterModel, filterBrand])

  // Unique models across all sources for filter dropdown
  const allModels = useMemo(() => {
    const set = new Set<string>()
    sources.forEach(s => s.platforms?.forEach(p => set.add(p)))
    return Array.from(set).sort()
  }, [sources])

  // Unique types across all sources for filter dropdown
  const allTypes = useMemo(() => {
    const set = new Set<string>()
    sources.forEach(s => { if (s.content_type) set.add(s.content_type.toLowerCase()) })
    return Array.from(set).sort()
  }, [sources])

  const displayedDomains = showAllDomains ? filteredSources : filteredSources.slice(0, 10)
  const displayedUrls = showAllUrls ? topUrls : topUrls.slice(0, 10)

  const totalCitations = sourceMetrics.total_citations
  // "Own content" = brand's own source category (matches the donut chart "Own" slice)
  const ownCitationCount = useMemo(() => {
    const ownEntry = domainTypeShare['own'] || domainTypeShare['Own'] || domainTypeShare['official'] || domainTypeShare['Official']
    return ownEntry ? ownEntry.count : sources.filter(s => s.is_target_publisher).reduce((s, src) => s + src.citation_count, 0)
  }, [sources, domainTypeShare])
  const ownCitationShare = totalCitations > 0 ? Math.round(ownCitationCount / totalCitations * 1000) / 10 : 0

  const categoryData = useMemo(() => {
    const entries = Object.entries(domainTypeShare).sort(([, a], [, b]) => b.count - a.count)
    // Map legacy categories to new taxonomy labels
    const legacyLabels: Record<string, string> = {
      'official': 'Institutional', 'fintech': 'Corporate', 'telecom': 'Corporate',
      'industry': 'Corporate', 'e-commerce': 'Corporate', 'user-generated': 'UGC', 'comparison': 'UGC',
    }
    return entries.map(([key, data]) => {
      const lk = key.toLowerCase()
      const label = legacyLabels[lk] || (lk === 'ugc' ? 'UGC' : key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '))
      return {
        key,
        label,
        count: data.count,
        share: data.share,
        color: (DOMAIN_TYPE_COLORS[lk] || DOMAIN_TYPE_COLORS['other']).bar
      }
    })
  }, [domainTypeShare])

  // Sources where brand IS mentioned but can be improved (UGC, blog, social, low authority, etc.)
  const improvementOpportunities = useMemo(() => {
    return sources
      .filter(s => {
        const hasBrandMention = s.brands_mentioned_in_sources && s.brands_mentioned_in_sources.length > 0
        if (!hasBrandMention) return false
        // Opportunity if: low citation count, or UGC/blog/social/comparison types, or low authority
        const type = (s.content_type || '').toLowerCase()
        const isImprovableType = ['ugc', 'blog', 'social', 'reference', 'corporate', 'editorial'].includes(type)
        const isLowAuthority = s.authority_score < 60
        const isLowCitations = s.citation_count <= 5
        return isImprovableType || isLowAuthority || isLowCitations
      })
      .sort((a, b) => b.citation_count - a.citation_count)
      .slice(0, 15)
  }, [sources])

  const selectedDomainUrls = useMemo(() => {
    if (!selectedDomain) return []
    return topUrls.filter(u => u.domain === selectedDomain.domain)
  }, [selectedDomain, topUrls])

  // Aggregate unique prompts across all URLs for the selected domain
  const selectedDomainPrompts = useMemo(() => {
    if (!selectedDomain) return []
    const domainUrls = topUrls.filter(u => u.domain === selectedDomain.domain)
    const seen = new Set<string>()
    const prompts: Array<{ prompt_id: string; prompt_text: string; model_name: string }> = []
    for (const u of domainUrls) {
      if (!u.prompts) continue
      for (const p of u.prompts) {
        if (!p.prompt_id || seen.has(p.prompt_id)) continue
        seen.add(p.prompt_id)
        prompts.push(p)
      }
    }
    return prompts
  }, [selectedDomain, topUrls])

  // ── Loading / Error ──

  if (isLoading && sources.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mb-3" />
            <p className="text-sm">Loading source analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && sources.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col items-center justify-center py-32">
            <AlertCircle className="h-8 w-8 text-red-300 mb-3" />
            <p className="text-sm text-red-500 mb-3">Failed to load sources</p>
            <Button variant="outline" size="sm" onClick={() => { setError(null); fetchSourcesData() }}>Retry</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-6 py-8 space-y-6">
          {/* ── HEADER ── */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Source Intelligence</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Understand which domains, pages, and content types drive your AI visibility
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-muted rounded-lg p-0.5">
                {[
                  { value: 'all', label: 'All' },
                  { value: '7d', label: '7 days' },
                  { value: '30d', label: '30 days' },
                  { value: '90d', label: '90 days' },
                ].map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTimeframe(t.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      timeframe === t.value ? 'bg-white text-gray-900 shadow-sm' : 'text-muted-foreground hover:text-gray-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <Button onClick={fetchSourcesData} variant="outline" size="icon" className="h-8 w-8" disabled={isLoading}>
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* ── KPI ROW ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <KpiCard icon={Globe} label="Total Sources" value={sourceMetrics.total_sources} subtext={`${sourceMetrics.high_authority_sources} high authority`} accent="bg-neutral-50" />
            <KpiCard icon={BarChart3} label="Total Citations" value={sourceMetrics.total_citations.toLocaleString()} subtext={`${sourceMetrics.trending_sources} trending up`} accent="bg-neutral-50" />
            <KpiCard icon={ShieldCheck} label="Avg Authority" value={sourceMetrics.avg_authority_score} subtext="Domain trust score" accent="bg-neutral-50" />
            <KpiCard icon={Zap} label="Citation Velocity" value={`${sourceMetrics.citation_velocity}/wk`} subtext="New citations per week" accent="bg-orange-50" />
            <KpiCard icon={Target} label="Own Content Share" value={`${ownCitationShare}%`} subtext={`${ownCitationCount} of ${totalCitations} citations`} accent="bg-orange-50" />
          </div>

          {/* ── TOP DOMAINS + CHART — side by side ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[65fr_35fr] gap-4 mb-6 pb-2">
            {/* Left card: Top 10 domains table */}
            <Card className="border border-gray-200 shadow-none bg-white py-0">
              <CardHeader className="pb-4 bg-black text-white rounded-t-lg py-4">
                <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
                  <Globe className="h-5 w-5 text-white" />
                  Top Domains
                </CardTitle>
                <CardDescription className="text-gray-300 font-light">Which domains are cited in the most AI answers</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                {filteredSources.length > 0 ? (
                  <>
                    <div className="grid grid-cols-[32px_1fr_80px_56px_70px_80px] items-center gap-2 px-5 py-2 border-b border-gray-100 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      <span className="text-right">#</span>
                      <span>Domain</span>
                      <span className="text-center">Type</span>
                      <span className="text-right">Citations</span>
                      <span className="text-right">Share</span>
                      <span className="text-center">Models</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {filteredSources.slice(0, 10).map((source, i) => (
                        <button
                          key={source.id}
                          onClick={() => setSelectedDomain(source)}
                          className="w-full grid grid-cols-[32px_1fr_80px_56px_70px_80px] items-center gap-2 px-5 py-2.5 text-left hover:bg-gray-50/60 transition-colors"
                        >
                          <span className="text-sm text-muted-foreground font-medium text-right tabular-nums">{i + 1}</span>
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${source.domain}&sz=32`}
                              alt=""
                              className="h-4 w-4 rounded shrink-0"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                            <span className="text-sm font-medium text-gray-900 truncate">{source.domain}</span>
                            {source.is_target_publisher && (
                              <Badge className="h-4 px-1.5 text-[9px] bg-orange-50 text-[#FF760D] border-orange-200 shrink-0">Own</Badge>
                            )}
                            {source.is_competitor && (
                              <Badge className={`h-4 px-1.5 text-[9px] shrink-0 ${source.is_inferred_competitor ? 'bg-amber-50 text-amber-700 border-amber-200 border-dashed' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                {source.is_inferred_competitor ? `~ ${source.competitor_name || source.domain.split('.')[0]}` : (source.competitor_name || 'Competitor')}
                              </Badge>
                            )}
                          </div>
                          <div className="flex justify-center">
                            <DomainTypeBadge type={source.content_type} />
                          </div>
                          <span className="text-sm font-semibold text-gray-900 tabular-nums text-right">{source.citation_count}</span>
                          <span className="text-sm font-semibold text-gray-900 tabular-nums text-right">{source.citation_share?.toFixed(1) || '0.0'}%</span>
                          <div className="flex justify-center"><ModelStack models={source.platforms} /></div>
                        </button>
                      ))}
                    </div>
                    {/* Footer */}
                    <div className="border-t border-gray-100 px-5 py-3 mt-1 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Showing top 10 of {filteredSources.length} domains</span>
                      <span className="text-xs text-muted-foreground">{filteredSources.reduce((s, src) => s + src.citation_count, 0).toLocaleString()} total citations</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-40 text-muted-foreground text-sm px-6">No domain data yet</div>
                )}
              </CardContent>
            </Card>

            {/* Right card: Donut chart */}
            <Card className="border border-gray-200 shadow-none bg-white py-0">
              <CardHeader className="pb-4 bg-black text-white rounded-t-lg py-4">
                <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
                  <BarChart3 className="h-5 w-5 text-white" />
                  Citation Share by Type
                </CardTitle>
                <CardDescription className="text-gray-300 font-light">Distribution across source categories</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <p className="text-3xl font-bold text-gray-900 tabular-nums">{ownCitationShare}%</p>
                    <p className="text-xs text-muted-foreground mb-5">Own content of all AI citations</p>

                    <div className="relative">
                      <DonutChart
                        data={categoryData.slice(0, 10).map(c => ({ key: c.key, label: c.label, value: c.count, share: c.share, color: c.color }))}
                        size={200}
                        strokeWidth={28}
                      />
                    </div>

                    {/* Badge legend */}
                    <div className="flex flex-wrap justify-center gap-1.5 mt-5">
                      {categoryData.slice(0, 10).map((item) => (
                        <span key={item.key} className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 border border-gray-200 rounded-full px-2 py-0.5">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          {item.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No data yet</div>
                )}
              </CardContent>
              {/* Footer */}
              {categoryData.length > 0 && (
                <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">{categoryData.length} source {categoryData.length === 1 ? 'category' : 'categories'} detected</span>
                </div>
              )}
            </Card>
          </div>

          {/* ── MAIN CONTENT TABS ── */}
          <Tabs defaultValue="domains" className="space-y-4">
            <TabsList className="bg-white border border-gray-200 h-12 rounded-lg p-1 gap-1 w-full">
              <TabsTrigger value="domains" className="gap-2 text-gray-500 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-5 py-2 text-sm font-medium transition-all flex-1"><Globe className="h-4 w-4" /> Top Domains</TabsTrigger>
              <TabsTrigger value="pages" className="gap-2 text-gray-500 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-5 py-2 text-sm font-medium transition-all flex-1"><Link2 className="h-4 w-4" /> Top Pages</TabsTrigger>
              <TabsTrigger value="competitive" className="gap-2 text-gray-500 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-5 py-2 text-sm font-medium transition-all flex-1"><Target className="h-4 w-4" /> Competitive Gap</TabsTrigger>
            </TabsList>

            {/* ── Top Domains ── */}
            <TabsContent value="domains">
              <Card className="border border-gray-200 shadow-none bg-white py-0">
                <CardHeader className="pb-4 bg-black text-white rounded-t-lg py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
                        <Globe className="h-5 w-5 text-white" />
                        Domain Citation Ranking
                      </CardTitle>
                      <CardDescription className="text-gray-300 font-light">Domains ranked by how often AI models cite them in responses</CardDescription>
                    </div>
                    <div className="relative w-56">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input placeholder="Search domains..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-8 text-sm bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20" />
                    </div>
                  </div>
                </CardHeader>

                {/* Filter bar */}
                <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 bg-gray-50/50">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider shrink-0">Filter</span>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="h-7 px-2.5 rounded-md border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
                  >
                    <option value="all">All Types</option>
                    {allTypes.map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                  <select
                    value={filterModel}
                    onChange={(e) => setFilterModel(e.target.value)}
                    className="h-7 px-2.5 rounded-md border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
                  >
                    <option value="all">All Models</option>
                    {allModels.map(m => (
                      <option key={m} value={m.toLowerCase()}>{cleanModelName(m)}</option>
                    ))}
                  </select>
                  <select
                    value={filterBrand}
                    onChange={(e) => setFilterBrand(e.target.value)}
                    className="h-7 px-2.5 rounded-md border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
                  >
                    <option value="all">Cited By: Any</option>
                    <option value="mentioned">Cites Your Brand</option>
                    <option value="not_mentioned">Doesn't Cite Brand</option>
                  </select>
                  {(filterType !== 'all' || filterModel !== 'all' || filterBrand !== 'all') && (
                    <button
                      onClick={() => { setFilterType('all'); setFilterModel('all'); setFilterBrand('all') }}
                      className="flex items-center gap-1 h-7 px-2.5 rounded-md text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <X className="h-3 w-3" />
                      Clear
                    </button>
                  )}
                  <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">{filteredSources.length} domains</span>
                </div>
                <CardContent className="px-0">
                  {/* Table header */}
                  <div className="grid grid-cols-[36px_1fr_80px_56px_64px_70px_24px] items-center gap-2 px-6 py-2.5 border-b border-gray-100 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    <span className="text-right">#</span>
                    <span>Domain</span>
                    <span className="text-center">Type</span>
                    <span className="text-right">Citations</span>
                    <span className="text-right">Share</span>
                    <span className="text-center">Models</span>
                    <span />
                  </div>

                  {/* Domain rows */}
                  <div className="divide-y divide-gray-50">
                    {displayedDomains.map((source, index) => {
                      return (
                        <button
                          key={source.id}
                          onClick={() => setSelectedDomain(source)}
                          className="w-full grid grid-cols-[36px_1fr_80px_56px_64px_70px_24px] items-center gap-2 px-6 py-3 text-left hover:bg-gray-50/60 transition-colors"
                        >
                          <span className="text-sm text-muted-foreground font-medium text-right tabular-nums">{index + 1}</span>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${source.domain}&sz=32`}
                              alt=""
                              className="h-5 w-5 rounded shrink-0"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                            <span className="text-sm font-medium text-gray-900 truncate">{source.domain}</span>
                            {source.is_target_publisher && (
                              <Badge className="h-4 px-1.5 text-[9px] bg-orange-50 text-[#FF760D] border-orange-200 shrink-0">Own</Badge>
                            )}
                            {source.is_competitor && (
                              <Badge className={`h-4 px-1.5 text-[9px] shrink-0 ${source.is_inferred_competitor ? 'bg-amber-50 text-amber-700 border-amber-200 border-dashed' : 'bg-neutral-100 text-neutral-700 border-neutral-300'}`}>
                                {source.is_inferred_competitor ? `~ ${source.competitor_name || source.domain.split('.')[0]}` : (source.competitor_name || 'Competitor')}
                              </Badge>
                            )}
                          </div>
                          <div className="flex justify-center"><DomainTypeBadge type={source.content_type} /></div>
                          <span className="text-sm font-semibold text-gray-900 tabular-nums text-right">{source.citation_count}</span>
                          <span className="text-sm font-semibold text-gray-900 tabular-nums text-right">{source.citation_share?.toFixed(1) || '0.0'}%</span>
                          <div className="flex justify-center"><ModelStack models={source.platforms} /></div>
                          <div className="flex justify-center">
                            <ArrowRight className="h-4 w-4 text-gray-300" />
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {filteredSources.length > 10 && (
                    <div className="pt-3 pb-4 border-t border-gray-100 text-center px-6">
                      <Button variant="ghost" size="sm" onClick={() => setShowAllDomains(!showAllDomains)} className="text-xs text-muted-foreground">
                        {showAllDomains ? 'Show top 10' : `Show all ${filteredSources.length} domains`}
                      </Button>
                    </div>
                  )}

                  {/* Footer */}
                  {filteredSources.length > 0 && !(filteredSources.length > 10) && (
                    <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{filteredSources.length} domains</span>
                      <span className="text-xs text-muted-foreground">{filteredSources.reduce((s, src) => s + src.citation_count, 0).toLocaleString()} total citations</span>
                    </div>
                  )}

                  {filteredSources.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center py-16 text-muted-foreground">
                      <Globe className="h-8 w-8 text-gray-200 mb-3" />
                      <p className="text-sm">No sources found</p>
                      {searchQuery && (
                        <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => setSearchQuery('')}>
                          <X className="h-3 w-3 mr-1" /> Clear search
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Top Pages ── */}
            <TabsContent value="pages">
              <Card className="border border-gray-200 shadow-none bg-white py-0">
                <CardHeader className="bg-black text-white rounded-t-lg py-4">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-gray-400" />
                    <CardTitle className="text-base font-light text-white">Top Cited Web Pages</CardTitle>
                  </div>
                  <CardDescription className="text-gray-300">Individual URLs most frequently cited by AI models</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="grid grid-cols-[40px_1fr_90px_70px_70px_55px_28px] items-center gap-2 px-6 py-2.5 border-b border-gray-100 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    <span className="text-right">#</span>
                    <span>URL</span>
                    <span className="text-center">Type</span>
                    <span className="text-right">Citations</span>
                    <span className="text-center">Models</span>
                    <Tooltip>
                      <TooltipTrigger asChild><span className="text-center cursor-help">Brand</span></TooltipTrigger>
                      <TooltipContent className="text-xs">Primary brand mentioned</TooltipContent>
                    </Tooltip>
                    <span />
                  </div>

                  <div className="divide-y divide-gray-50">
                    {displayedUrls.length > 0 ? (
                      displayedUrls.map((urlItem, index) => {
                        let displayUrl = urlItem.url
                        try {
                          const parsed = new URL(urlItem.url)
                          displayUrl = parsed.hostname.replace('www.', '') + parsed.pathname
                          if (displayUrl.length > 70) displayUrl = displayUrl.substring(0, 67) + '...'
                        } catch { /* use raw */ }

                        return (
                          <a
                            key={urlItem.url}
                            href={urlItem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="grid grid-cols-[40px_1fr_90px_70px_70px_55px_28px] items-center gap-2 px-6 py-3 hover:bg-gray-50/60 transition-colors group"
                          >
                            <span className="text-sm text-muted-foreground font-medium text-right tabular-nums">{index + 1}</span>
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${urlItem.domain}&sz=32`}
                                alt=""
                                className="h-4 w-4 rounded shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                              <div className="min-w-0">
                                <p className="text-sm text-gray-900 truncate group-hover:underline">{displayUrl}</p>
                                {urlItem.title && urlItem.title !== urlItem.url && (
                                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{urlItem.title}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-center">
                              {urlItem.domain_type && <DomainTypeBadge type={urlItem.domain_type} />}
                            </div>
                            <span className="text-sm font-semibold text-gray-900 tabular-nums text-right">{urlItem.citations}</span>
                            <div className="flex justify-center"><ModelStack models={urlItem.models || (urlItem.model_name ? [urlItem.model_name] : [])} /></div>
                            <div className="flex justify-center">
                              {urlItem.brand_mentioned ? (
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-50">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                </span>
                              ) : (
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-50">
                                  <Minus className="h-3 w-3 text-gray-300" />
                                </span>
                              )}
                            </div>
                            <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500" />
                          </a>
                        )
                      })
                    ) : (
                      <div className="flex flex-col items-center py-16 text-muted-foreground">
                        <Link2 className="h-8 w-8 text-gray-200 mb-3" />
                        <p className="text-sm">No URL-level data available yet</p>
                        <p className="text-xs mt-1">URL data is collected from AI citation sources</p>
                      </div>
                    )}
                  </div>

                  {topUrls.length > 10 && (
                    <div className="mt-2 pt-3 pb-4 border-t border-gray-100 text-center px-6">
                      <Button variant="ghost" size="sm" onClick={() => setShowAllUrls(!showAllUrls)} className="text-xs text-muted-foreground">
                        {showAllUrls ? 'Show top 10' : `Show all ${topUrls.length} pages`}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Competitive Gap ── */}
            <TabsContent value="competitive">
              <Card className="border border-gray-200 shadow-none bg-white py-0">
                <CardHeader className="bg-black text-white rounded-t-lg py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-gray-400" />
                      <div>
                        <CardTitle className="text-base font-light text-white">Competitive Source Gap</CardTitle>
                        <CardDescription className="text-gray-300">Domains where competitors are cited but you are not — each is an opportunity to expand your AI visibility</CardDescription>
                      </div>
                    </div>
                    {competitiveGap.length > 0 && (
                      <Badge variant="outline" className="text-xs tabular-nums shrink-0 border-gray-600 text-gray-300">{competitiveGap.length} gaps</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {competitiveGap.length > 0 ? (
                    <div className="space-y-4">
                      {/* Summary banner */}
                      <div className="flex items-center gap-4 p-3.5 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="h-10 w-10 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
                          <Target className="h-5 w-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900">{competitiveGap.length} untapped source{competitiveGap.length !== 1 ? 's' : ''} found</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Your competitors are being cited on these domains. Publishing content here could help you capture additional AI visibility.</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-gray-900 tabular-nums">{competitiveGap.reduce((s, g) => s + (g.citation_count || 0), 0)}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Total citations</p>
                        </div>
                      </div>

                      {/* Gap table */}
                      <div className="border border-gray-100 rounded-lg overflow-hidden">
                        <div className="grid grid-cols-[40px_1fr_120px_80px_80px] items-center gap-2 px-4 py-2.5 bg-gray-50/50 border-b border-gray-100 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                          <span className="text-right">#</span>
                          <span>Domain</span>
                          <span>Competitor</span>
                          <span className="text-right">Citations</span>
                          <span className="text-right">Authority</span>
                        </div>
                        <div className="divide-y divide-gray-50">
                          {competitiveGap.map((item, i) => (
                            <div key={`${item.domain}-${i}`} className="grid grid-cols-[40px_1fr_120px_80px_80px] items-center gap-2 px-4 py-3 hover:bg-gray-50/40 transition-colors">
                              <span className="text-sm text-muted-foreground font-medium text-right tabular-nums">{i + 1}</span>
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=32`}
                                  alt=""
                                  className="h-5 w-5 rounded shrink-0"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{item.domain}</p>
                                </div>
                              </div>
                              <div className="min-w-0">
                                <Badge className="h-4 px-1.5 text-[9px] bg-neutral-100 text-neutral-700 border-neutral-300 truncate max-w-full">
                                  {item.competitor_name}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-semibold text-gray-900 tabular-nums">{item.citation_count}</span>
                              </div>
                              <div className="text-right">
                                {item.authority ? (
                                  <span className="text-sm text-gray-600 tabular-nums">{item.authority}</span>
                                ) : (
                                  <span className="text-sm text-gray-300">—</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Footer */}
                        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{competitiveGap.length} gap{competitiveGap.length !== 1 ? 's' : ''} identified</span>
                            <span className="text-xs text-muted-foreground">{competitiveGap.reduce((s: number, g: any) => s + g.citation_count, 0)} competitor citations</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-gray-200 bg-gray-50/30">
                            <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium text-gray-700">Next step:</span> Publish expert content on the top domains above to start appearing in AI responses alongside your competitors.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-16 text-muted-foreground">
                      <CheckCircle2 className="h-8 w-8 text-neutral-300 mb-3" />
                      <p className="text-sm font-medium text-gray-700">No competitive gaps found</p>
                      <p className="text-xs mt-1">You appear on all the sources your competitors do</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── Improvement Opportunities ── */}
              {improvementOpportunities.length > 0 && (
                <Card className="border border-gray-200 shadow-none bg-white py-0 mt-4">
                  <CardHeader className="bg-black text-white rounded-t-lg py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                        <div>
                          <CardTitle className="text-base font-light text-white">Visibility Improvement Opportunities</CardTitle>
                          <CardDescription className="text-gray-300">Sources where your brand is mentioned but can be strengthened with UGC, content partnerships, or optimization</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs tabular-nums shrink-0 border-gray-600 text-gray-300">{improvementOpportunities.length} opportunities</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Summary banner */}
                      <div className="flex items-center gap-4 p-3.5 rounded-lg bg-orange-50/50 border border-orange-100">
                        <div className="h-10 w-10 rounded-lg bg-[#FF760D] flex items-center justify-center shrink-0">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900">{improvementOpportunities.length} source{improvementOpportunities.length !== 1 ? 's' : ''} can be improved</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Your brand already appears on these domains. Boost visibility through UGC, guest posts, reviews, or content optimization.</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-gray-900 tabular-nums">{improvementOpportunities.reduce((s, o) => s + o.citation_count, 0)}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Current citations</p>
                        </div>
                      </div>

                      {/* Opportunities table */}
                      <div className="border border-gray-100 rounded-lg overflow-hidden">
                        <div className="grid grid-cols-[40px_1fr_90px_80px_70px_70px] items-center gap-2 px-4 py-2.5 bg-gray-50/50 border-b border-gray-100 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                          <span className="text-right">#</span>
                          <span>Domain</span>
                          <span className="text-center">Type</span>
                          <span className="text-right">Citations</span>
                          <span className="text-right">Authority</span>
                          <span className="text-center">Models</span>
                        </div>
                        <div className="divide-y divide-gray-50">
                          {improvementOpportunities.map((source, i) => (
                            <button
                              key={source.id}
                              onClick={() => setSelectedDomain(source)}
                              className="w-full grid grid-cols-[40px_1fr_90px_80px_70px_70px] items-center gap-2 px-4 py-3 hover:bg-gray-50/40 transition-colors text-left"
                            >
                              <span className="text-sm text-muted-foreground font-medium text-right tabular-nums">{i + 1}</span>
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={`https://www.google.com/s2/favicons?domain=${source.domain}&sz=32`}
                                  alt=""
                                  className="h-5 w-5 rounded shrink-0"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{source.domain}</p>
                                </div>
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 text-[9px] font-medium shrink-0">
                                  <CheckCircle2 className="h-2.5 w-2.5" /> Mentioned
                                </span>
                              </div>
                              <div className="flex justify-center">
                                <DomainTypeBadge type={source.content_type} />
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-semibold text-gray-900 tabular-nums">{source.citation_count}</span>
                              </div>
                              <div className="text-right">
                                {source.authority_score ? (
                                  <span className="text-sm text-gray-600 tabular-nums">{source.authority_score}</span>
                                ) : (
                                  <span className="text-sm text-gray-300">—</span>
                                )}
                              </div>
                              <div className="flex justify-center"><ModelStack models={source.platforms} /></div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{improvementOpportunities.length} opportunit{improvementOpportunities.length !== 1 ? 'ies' : 'y'} identified</span>
                          <span className="text-xs text-muted-foreground">{improvementOpportunities.reduce((s, o) => s + o.citation_count, 0)} current citations</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-orange-200 bg-orange-50/30">
                          <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-gray-700">Tip:</span> Focus on UGC-friendly platforms (blogs, reviews, social media) where you can publish or encourage user-generated content to increase citation frequency.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* ── DOMAIN DETAIL FLYOUT (wide, with rich context) ── */}
          {selectedDomain && (
            <>
              <div className="fixed inset-0 bg-black/30 z-[60] backdrop-blur-[1px]" onClick={() => setSelectedDomain(null)} />
              <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white border-l border-gray-200 shadow-2xl z-[60] flex flex-col animate-in slide-in-from-right duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${selectedDomain.domain}&sz=32`}
                      alt=""
                      className="h-7 w-7 rounded shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-semibold text-gray-900 truncate">{selectedDomain.domain}</h2>
                        {selectedDomain.is_target_publisher && (
                          <Badge className="h-5 text-[10px] bg-orange-50 text-[#FF760D] border-orange-200">Own</Badge>
                        )}
                        {selectedDomain.is_competitor && (
                          <Badge className={`h-5 text-[10px] ${selectedDomain.is_inferred_competitor ? 'bg-amber-50 text-amber-700 border-amber-200 border-dashed' : 'bg-neutral-100 text-neutral-700 border-neutral-300'}`}>
                            {selectedDomain.is_inferred_competitor ? `~ ${selectedDomain.competitor_name}` : (selectedDomain.competitor_name || 'Competitor')}
                          </Badge>
                        )}
                        {(selectedDomain.brands_mentioned_in_sources && selectedDomain.brands_mentioned_in_sources.length > 0) ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-medium">
                            <CheckCircle2 className="h-3 w-3" /> Cites your brand
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-medium">
                            <Minus className="h-3 w-3" /> Doesn&apos;t cite your brand
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5"><DomainTypeBadge type={selectedDomain.content_type} /></div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setSelectedDomain(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Total Citations', value: selectedDomain.citation_count, icon: BarChart3 },
                      { label: 'Citation Share', value: `${selectedDomain.citation_share?.toFixed(1) || '0.0'}%`, icon: Layers },
                      { label: 'Authority Score', value: selectedDomain.authority_score, icon: ShieldCheck },
                      { label: 'Avg Position', value: selectedDomain.avg_citation_position ? `#${selectedDomain.avg_citation_position.toFixed(1)}` : '—', icon: Crown },
                      { label: 'Top 3 Citations', value: selectedDomain.first_citation_count || 0, icon: Sparkles },
                      { label: 'Brand Mentions', value: selectedDomain.brand_mentions, icon: Target },
                    ].map(stat => (
                      <div key={stat.label} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <stat.icon className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900 tabular-nums">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* AI Models */}
                  {selectedDomain.platforms.length > 0 && (
                    <div>
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Citing AI Models</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedDomain.platforms.map(p => (
                          <Badge key={p} variant="outline" className="text-xs px-2.5 py-1 bg-white flex items-center gap-1.5">
                            <img src={getModelLogo(p)} alt="" className="h-3.5 w-3.5 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            {cleanModelName(p)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Brands mentioned */}
                  {selectedDomain.brands_mentioned_in_sources && selectedDomain.brands_mentioned_in_sources.length > 0 && (
                    <div>
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Brands Discussed by This Source</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedDomain.brands_mentioned_in_sources.filter(b => typeof b === 'string').map(b => (
                          <Badge key={b} variant="secondary" className="text-xs px-2.5 py-1 bg-neutral-100 text-neutral-700 border-neutral-200">{b}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prompts citing this source */}
                  {selectedDomainPrompts.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                          Prompts Citing This Source ({selectedDomainPrompts.length})
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        {selectedDomainPrompts.map((p, idx) => (
                          <Link
                            key={p.prompt_id || idx}
                            href={`/dashboard/prompts/${p.prompt_id}`}
                            className="flex items-start gap-2.5 p-2.5 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-colors group"
                          >
                            <span className="text-[10px] text-muted-foreground font-medium tabular-nums mt-0.5 shrink-0">{idx + 1}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-800 leading-relaxed line-clamp-2 group-hover:text-gray-900">
                                {p.prompt_text}
                              </p>
                            </div>
                            {p.model_name && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 shrink-0">{cleanModelName(p.model_name)}</Badge>
                            )}
                            <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 shrink-0 mt-0.5" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cited Pages with prompt/response context */}
                  {selectedDomainUrls.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                          Cited Pages ({selectedDomainUrls.length})
                        </p>
                      </div>
                      <div className="space-y-3">
                        {selectedDomainUrls.map((urlItem, idx) => {
                          let displayPath = urlItem.url
                          try {
                            const parsed = new URL(urlItem.url)
                            displayPath = parsed.pathname + parsed.search
                            if (displayPath.length > 80) displayPath = displayPath.substring(0, 77) + '...'
                          } catch { /* use raw */ }

                          return (
                            <div key={idx} className="border border-gray-100 rounded-lg overflow-hidden">
                              <a
                                href={urlItem.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-3 bg-gray-50/50 hover:bg-gray-50 transition-colors group"
                              >
                                <Link2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <span className="text-xs font-medium text-gray-900 truncate flex-1 group-hover:underline">{displayPath}</span>
                                <span className="text-[10px] font-semibold text-gray-500 tabular-nums shrink-0">{urlItem.citations}×</span>
                                <ExternalLink className="h-3 w-3 text-gray-300 shrink-0 group-hover:text-gray-500" />
                              </a>
                              {urlItem.title && urlItem.title !== urlItem.url && (
                                <div className="px-3 pb-2 pt-0 bg-gray-50/50">
                                  <p className="text-[11px] text-muted-foreground truncate ml-5">{urlItem.title}</p>
                                </div>
                              )}
                              {urlItem.snippet && (
                                <div className="border-t border-gray-100 px-3 py-2.5 bg-white">
                                  <div className="flex items-start gap-2">
                                    <div className="w-0.5 shrink-0 self-stretch bg-orange-200 rounded-full mt-0.5" />
                                    <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-3 italic">
                                      &ldquo;{urlItem.snippet}&rdquo;
                                    </p>
                                  </div>
                                </div>
                              )}
                              {(urlItem.models && urlItem.models.length > 0 || urlItem.prompt_text) && (
                                <div className="border-t border-gray-100 p-3 space-y-2.5">
                                  {urlItem.models && urlItem.models.length > 0 && (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {urlItem.models.map(m => (
                                        <Badge key={m} variant="outline" className="text-[9px] px-1.5 py-0 h-4 flex items-center gap-1">
                                          <img src={getModelLogo(m)} alt="" className="h-3 w-3 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                          {cleanModelName(m)}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                  {urlItem.prompt_text && (
                                    <div>
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <MessageSquare className="h-3 w-3 text-gray-400" />
                                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Prompt</span>
                                      </div>
                                      <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 rounded-md p-2.5 line-clamp-3">
                                        {urlItem.prompt_text}
                                      </p>
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

                  {/* Fallback sample contexts */}
                  {selectedDomainUrls.length === 0 && selectedDomain.sample_contexts && selectedDomain.sample_contexts.length > 0 && (
                    <div>
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Cited Pages</p>
                      <div className="space-y-2">
                        {selectedDomain.sample_contexts.map((ctx, idx) => {
                          const isString = typeof ctx === 'string'
                          const url = isString ? `https://${selectedDomain.domain}` : ctx.url
                          const title = isString ? ctx : (ctx.title || ctx.url || selectedDomain.domain)
                          const snippet = !isString && ctx.context ? ctx.context : null
                          return (
                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                              className="block p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors group">
                              <div className="flex items-center gap-2 mb-1">
                                <Link2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <span className="text-xs font-medium text-gray-900 truncate flex-1 group-hover:underline">{title}</span>
                                <ExternalLink className="h-3 w-3 text-gray-300 shrink-0 group-hover:text-gray-500" />
                              </div>
                              {snippet && <p className="text-[11px] text-muted-foreground ml-5 line-clamp-2 leading-relaxed">{snippet}</p>}
                            </a>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Associated brands */}
                  {selectedDomain.associated_brands && selectedDomain.associated_brands.length > 0 && (
                    <div>
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Associated Brands</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedDomain.associated_brands.filter(b => typeof b === 'string').map(b => (
                          <Badge key={b} variant="outline" className="text-xs px-2 py-0.5">{b}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 shrink-0">
                  <a
                    href={`https://${selectedDomain.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Visit {selectedDomain.domain}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
