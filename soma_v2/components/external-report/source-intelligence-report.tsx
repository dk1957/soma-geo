"use client"

/**
 * Rich Source Intelligence Component for External/Free-Audit Reports
 *
 * Matches the dashboard /sources page design:
 * - KPI row (total sources, citations, authority, own content share)
 * - Domain citation ranking table with type badges, models, share %
 * - Citation share donut chart by type
 * - Competitive source gap analysis
 * - Top cited pages table
 */

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Globe, BarChart3, ShieldCheck, Zap, Target,
  ExternalLink, ChevronDown, ChevronRight, Link2,
  CheckCircle2, Minus, Lightbulb, FileText
} from "lucide-react"

// ── Types ────────────────────────────────────────────────────────────

interface SourceDomain {
  domain: string
  type: string // granular: own, competitor, news, editorial, blog, ugc, etc.
  totalCitations: number
  citationShare: number
  authorityScore?: number
  models?: string[]
  isOwnBrand?: boolean
  isCompetitor?: boolean
  competitorName?: string | null
  brandMentioned?: boolean
  citationUrls?: Array<{ url: string; title?: string; type?: string }>
  brandsCiting?: string[]
}

interface TopPage {
  url: string
  title?: string
  domain: string
  citations: number
  domainType?: string | null
  brandMentioned?: boolean
  models?: string[]
}

interface CompetitiveGap {
  domain: string
  authority?: number | null
  citations: number
  competitorName: string
}

interface SourceIntelligenceProps {
  sources: SourceDomain[]
  topPages?: TopPage[]
  competitiveGaps?: CompetitiveGap[]
  totalCitations?: number
  ownCitationShare?: number
  avgAuthority?: number
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
  'your-brand':     { bg: 'bg-orange-50', text: 'text-orange-700', bar: '#FF760D' },
  'news-media':     { bg: 'bg-blue-50', text: 'text-blue-700', bar: '#2563EB' },
  'industry':       { bg: 'bg-purple-50', text: 'text-purple-700', bar: '#7C3AED' },
  'other':          { bg: 'bg-gray-50', text: 'text-gray-500', bar: '#D4D4D4' },
}

function DomainTypeBadge({ type }: { type: string }) {
  const normalized = (type || 'other').toLowerCase().replace(/_/g, '-').trim()
  const colors = DOMAIN_TYPE_COLORS[normalized] || DOMAIN_TYPE_COLORS['other']
  const labels: Record<string, string> = {
    'own': 'Own', 'your-brand': 'Own', 'competitor': 'Competitor', 'news': 'News', 'news-media': 'News',
    'editorial': 'Editorial', 'blog': 'Blog', 'ugc': 'UGC', 'social': 'Social',
    'reference': 'Reference', 'academic': 'Academic', 'government': 'Government',
    'institutional': 'Institutional', 'corporate': 'Corporate', 'industry': 'Industry', 'other': 'Other',
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

function ModelStack({ models }: { models: string[] }) {
  if (!models || models.length === 0) return <span className="text-xs text-gray-300">&mdash;</span>
  const seen = new Set<string>()
  const unique: string[] = []
  for (const model of models) {
    const brand = cleanModelName(model)
    if (!seen.has(brand)) { seen.add(brand); unique.push(model) }
  }
  return (
    <TooltipProvider>
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
    </TooltipProvider>
  )
}

function KpiCard({ icon: Icon, label, value, subtext, accent }: {
  icon: React.ElementType; label: string; value: string | number; subtext?: string; accent?: string
}) {
  return (
    <div className={`rounded-lg p-4 border border-gray-200 ${accent || 'bg-white'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{value}</p>
          {subtext && <p className="text-[11px] text-muted-foreground mt-0.5">{subtext}</p>}
        </div>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${accent ? '' : 'bg-gray-100'}`}>
          <Icon className="h-4 w-4 text-gray-600" />
        </div>
      </div>
    </div>
  )
}

// ── Donut ─────────────────────────────────────────────────────────────

function DonutChart({ data, size = 180, strokeWidth = 24 }: {
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

  const segments = data.map((segment) => {
    const percent = total > 0 ? segment.value / total : 0
    const startPercent = cumulativePercent
    cumulativePercent += percent
    const midPercent = startPercent + percent / 2
    const angle = midPercent * 2 * Math.PI
    return { ...segment, percent, startPercent, angle }
  })

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#F5F5F5" strokeWidth={strokeWidth} />
        {segments.map((seg) => {
          const offset = circumference * seg.startPercent
          const segmentLen = circumference * seg.percent
          const gap = data.length > 1 ? 2 : 0
          return (
            <circle
              key={seg.key}
              cx={center} cy={center} r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={hovered === seg.key ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={`${Math.max(segmentLen - gap, 0)} ${circumference - segmentLen + gap}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              className="transition-all duration-300 cursor-pointer"
              onMouseEnter={() => setHovered(seg.key)}
              onMouseLeave={() => setHovered(null)}
            />
          )
        })}
      </svg>
      {hovered && (() => {
        const seg = segments.find(s => s.key === hovered)
        if (!seg) return null
        return (
          <div
            className="absolute pointer-events-none z-10 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap"
            style={{
              left: center + Math.cos(seg.angle - Math.PI / 2) * (radius * 0.5) - 40,
              top: center + Math.sin(seg.angle - Math.PI / 2) * (radius * 0.5) - 16,
            }}
          >
            <span className="font-semibold">{seg.label}</span>
            <span className="ml-1.5 text-gray-300">{seg.share.toFixed(1)}%</span>
            <span className="ml-1.5 text-gray-400">({seg.value})</span>
          </div>
        )
      })()}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────

export function SourceIntelligenceReport({
  sources,
  topPages = [],
  competitiveGaps = [],
  totalCitations: totalCitationsProp,
  ownCitationShare: ownCitShareProp,
  avgAuthority: avgAuthProp,
}: SourceIntelligenceProps) {
  const [showAllDomains, setShowAllDomains] = useState(false)
  const [showAllPages, setShowAllPages] = useState(false)

  // Derived metrics
  const totalCitations = totalCitationsProp ?? sources.reduce((s, src) => s + src.totalCitations, 0)
  const ownSources = sources.filter(s => s.isOwnBrand || s.type === 'your-brand' || s.type === 'own')
  const ownCitCount = ownSources.reduce((s, src) => s + src.totalCitations, 0)
  const ownCitationShare = ownCitShareProp ?? (totalCitations > 0 ? Math.round(ownCitCount / totalCitations * 1000) / 10 : 0)
  const avgAuth = avgAuthProp ?? (sources.length > 0 ? Math.round(sources.reduce((s, src) => s + (src.authorityScore || 0), 0) / sources.length) : 0)

  // Type distribution for donut
  const typeDistribution = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of sources) {
      const key = (s.type || 'other').toLowerCase()
      map.set(key, (map.get(key) || 0) + s.totalCitations)
    }
    const totalCit = sources.reduce((s, src) => s + src.totalCitations, 0) || 1
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => {
        const colors = DOMAIN_TYPE_COLORS[key] || DOMAIN_TYPE_COLORS['other']
        const labelMap: Record<string, string> = {
          'own': 'Own', 'your-brand': 'Own', 'competitor': 'Competitor', 'news': 'News',
          'news-media': 'News', 'editorial': 'Editorial', 'blog': 'Blog', 'ugc': 'UGC',
          'social': 'Social', 'reference': 'Reference', 'academic': 'Academic',
          'government': 'Government', 'institutional': 'Institutional',
          'corporate': 'Corporate', 'industry': 'Industry', 'other': 'Other',
        }
        return {
          key,
          label: labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1),
          value: count,
          share: (count / totalCit) * 100,
          color: colors.bar,
        }
      })
  }, [sources])

  const displayedDomains = showAllDomains ? sources : sources.slice(0, 10)
  const displayedPages = showAllPages ? topPages : topPages.slice(0, 8)

  if (sources.length === 0) {
    return (
      <Card className="border border-gray-200 shadow-none bg-white py-0">
        <CardHeader className="pb-4 bg-black text-white rounded-t-lg py-4">
          <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
            <Globe className="h-5 w-5 text-white" />
            Source Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <Globe className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Citation data will appear here after analysis is complete.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* ── KPI ROW ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard icon={Globe} label="Total Sources" value={sources.length} subtext={`${ownSources.length} own brand`} accent="bg-gray-50" />
          <KpiCard icon={BarChart3} label="Total Citations" value={totalCitations.toLocaleString()} accent="bg-gray-50" />
          <KpiCard icon={ShieldCheck} label="Avg Authority" value={avgAuth || '—'} subtext="Domain trust score" accent="bg-gray-50" />
          <KpiCard icon={Target} label="Own Content" value={`${ownCitationShare}%`} subtext={`${ownCitCount} of ${totalCitations} citations`} accent="bg-orange-50/50" />
        </div>

        {/* ── DOMAINS + DONUT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[65fr_35fr] gap-4">
          {/* Left: Domain ranking */}
          <Card className="border border-gray-200 shadow-none bg-white py-0">
            <CardHeader className="pb-4 bg-black text-white rounded-t-lg py-4">
              <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
                <Globe className="h-5 w-5 text-white" />
                Domain Citation Ranking
              </CardTitle>
              <CardDescription className="text-gray-300 font-light">Domains ranked by citation frequency across AI models</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="grid grid-cols-[32px_1fr_80px_56px_70px_80px] items-center gap-2 px-5 py-2 border-b border-gray-100 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                <span className="text-right">#</span>
                <span>Domain</span>
                <span className="text-center">Type</span>
                <span className="text-right">Citations</span>
                <span className="text-right">Share</span>
                <span className="text-center">Models</span>
              </div>
              <div className="divide-y divide-gray-50">
                {displayedDomains.map((source, i) => (
                  <div
                    key={source.domain}
                    className="grid grid-cols-[32px_1fr_80px_56px_70px_80px] items-center gap-2 px-5 py-2.5 hover:bg-gray-50/60 transition-colors"
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
                      {(source.isOwnBrand || source.type === 'your-brand' || source.type === 'own') && (
                        <Badge className="h-4 px-1.5 text-[9px] bg-orange-50 text-[#FF760D] border-orange-200 shrink-0">Own</Badge>
                      )}
                      {source.isCompetitor && (
                        <Badge className="h-4 px-1.5 text-[9px] bg-neutral-100 text-neutral-700 border-neutral-300 shrink-0">
                          {source.competitorName || 'Competitor'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-center"><DomainTypeBadge type={source.type} /></div>
                    <span className="text-sm font-semibold text-gray-900 tabular-nums text-right">{source.totalCitations}</span>
                    <span className="text-sm font-semibold text-gray-900 tabular-nums text-right">{source.citationShare.toFixed(1)}%</span>
                    <div className="flex justify-center"><ModelStack models={source.models || []} /></div>
                  </div>
                ))}
              </div>
              {sources.length > 10 && (
                <div className="pt-3 pb-4 border-t border-gray-100 text-center px-6">
                  <Button variant="ghost" size="sm" onClick={() => setShowAllDomains(!showAllDomains)} className="text-xs text-muted-foreground">
                    {showAllDomains ? 'Show top 10' : `Show all ${sources.length} domains`}
                  </Button>
                </div>
              )}
              <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{sources.length} domains</span>
                <span className="text-xs text-muted-foreground">{totalCitations.toLocaleString()} total citations</span>
              </div>
            </CardContent>
          </Card>

          {/* Right: Donut */}
          <Card className="border border-gray-200 shadow-none bg-white py-0">
            <CardHeader className="pb-4 bg-black text-white rounded-t-lg py-4">
              <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
                <BarChart3 className="h-5 w-5 text-white" />
                Citation Share by Type
              </CardTitle>
              <CardDescription className="text-gray-300 font-light">Distribution across source categories</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {typeDistribution.length > 0 ? (
                <div className="flex flex-col items-center">
                  <p className="text-3xl font-bold text-gray-900 tabular-nums">{ownCitationShare}%</p>
                  <p className="text-xs text-muted-foreground mb-5">Own content of all AI citations</p>
                  <DonutChart data={typeDistribution.slice(0, 8)} size={180} strokeWidth={24} />
                  <div className="flex flex-wrap justify-center gap-1.5 mt-5">
                    {typeDistribution.slice(0, 8).map(item => (
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
          </Card>
        </div>

        {/* ── TOP CITED PAGES ── */}
        {topPages.length > 0 && (
          <Card className="border border-gray-200 shadow-none bg-white py-0">
            <CardHeader className="bg-black text-white rounded-t-lg py-4">
              <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
                <Link2 className="h-5 w-5 text-white" />
                Top Cited Pages
              </CardTitle>
              <CardDescription className="text-gray-300 font-light">Individual URLs most frequently cited by AI models</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="grid grid-cols-[40px_1fr_90px_70px_70px_55px] items-center gap-2 px-6 py-2.5 border-b border-gray-100 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                <span className="text-right">#</span>
                <span>URL</span>
                <span className="text-center">Type</span>
                <span className="text-right">Citations</span>
                <span className="text-center">Models</span>
                <span className="text-center">Brand</span>
              </div>
              <div className="divide-y divide-gray-50">
                {displayedPages.map((page, idx) => {
                  let displayUrl = page.url
                  try {
                    const parsed = new URL(page.url)
                    displayUrl = parsed.hostname.replace('www.', '') + parsed.pathname
                    if (displayUrl.length > 60) displayUrl = displayUrl.substring(0, 57) + '...'
                  } catch { /* use raw */ }
                  return (
                    <a
                      key={page.url}
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="grid grid-cols-[40px_1fr_90px_70px_70px_55px] items-center gap-2 px-6 py-3 hover:bg-gray-50/60 transition-colors group"
                    >
                      <span className="text-sm text-muted-foreground font-medium text-right tabular-nums">{idx + 1}</span>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${page.domain}&sz=32`}
                          alt=""
                          className="h-4 w-4 rounded shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm text-gray-900 truncate group-hover:underline">{displayUrl}</p>
                          {page.title && page.title !== page.url && (
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{page.title}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-center">
                        {page.domainType && <DomainTypeBadge type={page.domainType} />}
                      </div>
                      <span className="text-sm font-semibold text-gray-900 tabular-nums text-right">{page.citations}</span>
                      <div className="flex justify-center"><ModelStack models={page.models || []} /></div>
                      <div className="flex justify-center">
                        {page.brandMentioned ? (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-50">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          </span>
                        ) : (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-50">
                            <Minus className="h-3 w-3 text-gray-300" />
                          </span>
                        )}
                      </div>
                    </a>
                  )
                })}
              </div>
              {topPages.length > 8 && (
                <div className="pt-3 pb-4 border-t border-gray-100 text-center px-6">
                  <Button variant="ghost" size="sm" onClick={() => setShowAllPages(!showAllPages)} className="text-xs text-muted-foreground">
                    {showAllPages ? 'Show top 8' : `Show all ${topPages.length} pages`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── COMPETITIVE SOURCE GAP ── */}
        {competitiveGaps.length > 0 && (
          <Card className="border border-gray-200 shadow-none bg-white py-0">
            <CardHeader className="bg-black text-white rounded-t-lg py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
                    <Target className="h-5 w-5 text-white" />
                    Competitive Source Gap
                  </CardTitle>
                  <CardDescription className="text-gray-300 font-light">Domains where competitors are cited but you are not</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs tabular-nums shrink-0 border-gray-600 text-gray-300">{competitiveGaps.length} gaps</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="flex items-center gap-4 p-3.5 rounded-lg bg-gray-50 border border-gray-100 mb-4">
                <div className="h-10 w-10 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{competitiveGaps.length} untapped source{competitiveGaps.length !== 1 ? 's' : ''} found</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Your competitors are being cited on these domains. Publishing content here could help capture additional visibility.</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-gray-900 tabular-nums">{competitiveGaps.reduce((s, g) => s + g.citations, 0)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Total citations</p>
                </div>
              </div>

              <div className="border border-gray-100 rounded-lg overflow-hidden">
                <div className="grid grid-cols-[40px_1fr_120px_80px_80px] items-center gap-2 px-4 py-2.5 bg-gray-50/50 border-b border-gray-100 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  <span className="text-right">#</span>
                  <span>Domain</span>
                  <span>Competitor</span>
                  <span className="text-right">Citations</span>
                  <span className="text-right">Authority</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {competitiveGaps.slice(0, 10).map((item, i) => (
                    <div key={`${item.domain}-${i}`} className="grid grid-cols-[40px_1fr_120px_80px_80px] items-center gap-2 px-4 py-3 hover:bg-gray-50/40 transition-colors">
                      <span className="text-sm text-muted-foreground font-medium text-right tabular-nums">{i + 1}</span>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=32`}
                          alt=""
                          className="h-5 w-5 rounded shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                        <p className="text-sm font-medium text-gray-900 truncate">{item.domain}</p>
                      </div>
                      <Badge className="h-4 px-1.5 text-[9px] bg-neutral-100 text-neutral-700 border-neutral-300 truncate max-w-full">
                        {item.competitorName}
                      </Badge>
                      <span className="text-sm font-semibold text-gray-900 tabular-nums text-right">{item.citations}</span>
                      <span className="text-sm text-gray-600 tabular-nums text-right">{item.authority ?? '—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-gray-200 bg-gray-50/30 mt-4">
                <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-gray-700">Next step:</span> Publish expert content on the top domains above to start appearing in AI responses alongside your competitors.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  )
}
