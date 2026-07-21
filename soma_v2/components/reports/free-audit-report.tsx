"use client"

/**
 * Free Audit Report — Premium one-time brand audit for lead generation
 *
 * Designed to impress brand/marketing execs at businesses of all sizes.
 * Tells a data-driven story: context → evidence → action → CTA overlay.
 *
 * Data: useReportData hook with freeAuditToken
 * Design: dark hero, card-based sections, floating overlay CTA
 */

import React, { useMemo, useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useReportData, type ReportData } from "@/lib/hooks/useReportData"
import {
  Eye,
  Search,
  Users,
  Shield,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  BarChart3,
  Rocket,
  BookOpen,
  TrendingDown,
  Sparkles,
  Quote,
  Lock,
  Lightbulb,
  Info,
  Zap,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// ============================================================================
// TYPES
// ============================================================================

interface FreeAuditReportProps {
  brandName: string
  brandId: string
  freeAuditToken: string
  onBack?: () => void
}

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

const MODEL_NAMES: Record<string, { name: string; icon: string }> = {
  "openai/gpt-4o-mini:online": { name: "ChatGPT", icon: "/models/chatgpt-logo.png" },
  "openai/gpt-4o:online": { name: "ChatGPT", icon: "/models/chatgpt-logo.png" },
  "meta-llama/llama-4-8b-instruct:online": { name: "Llama", icon: "/models/meta-logo.svg" },
  "google/gemini-2.5-flash:online": { name: "Gemini", icon: "/models/gemini-logo.png" },
  "google/gemini-2.0-flash:online": { name: "Gemini", icon: "/models/gemini-logo.png" },
  "x-ai/grok-3-mini:online": { name: "Grok", icon: "/models/grok-logo.png" },
  "perplexity/sonar": { name: "Perplexity", icon: "/models/perplexity-logo.png" },
}

const getModelInfo = (key: string) => {
  if (MODEL_NAMES[key]) return MODEL_NAMES[key]
  const k = key.toLowerCase()
  if (k.includes("gpt") || k.includes("openai") || k.includes("chatgpt")) return { name: "ChatGPT", icon: "/models/chatgpt-logo.png" }
  if (k.includes("gemini") || k.includes("google")) return { name: "Gemini", icon: "/models/gemini-logo.png" }
  if (k.includes("grok")) return { name: "Grok", icon: "/models/grok-logo.png" }
  if (k.includes("llama") || k.includes("meta")) return { name: "Llama", icon: "/models/meta-logo.svg" }
  if (k.includes("perplexity")) return { name: "Perplexity", icon: "/models/perplexity-logo.png" }
  if (k.includes("claude")) return { name: "Claude", icon: "/models/claude-logo.png" }
  return { name: key.split("/").pop()?.split(":")[0] || key, icon: "/models/chatgpt-logo.png" }
}

const gradeScore = (score: number) => {
  if (score >= 80) return { label: "Excellent", letter: "A", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", barColor: "bg-emerald-500", ringColor: "#10b981" }
  if (score >= 60) return { label: "Good", letter: "B", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", barColor: "bg-blue-500", ringColor: "#3b82f6" }
  if (score >= 40) return { label: "Fair", letter: "C", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", barColor: "bg-amber-500", ringColor: "#f59e0b" }
  if (score >= 20) return { label: "Needs Work", letter: "D", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", barColor: "bg-orange-500", ringColor: "#f97316" }
  return { label: "Critical", letter: "F", color: "text-red-600", bg: "bg-red-50", border: "border-red-200", barColor: "bg-red-500", ringColor: "#ef4444" }
}

const sentimentLabel = (v: number) => {
  if (v >= 0.6) return { text: "Positive", color: "text-emerald-600", dotColor: "bg-emerald-500" }
  if (v >= 0.2) return { text: "Neutral", color: "text-gray-600", dotColor: "bg-gray-400" }
  if (v >= -0.2) return { text: "Mixed", color: "text-amber-600", dotColor: "bg-amber-500" }
  return { text: "Negative", color: "text-red-600", dotColor: "bg-red-500" }
}

const positionText = (pos: number) => {
  if (pos <= 0) return "Not ranked"
  if (pos <= 1.5) return "1st"
  if (pos <= 2.5) return "2nd"
  if (pos <= 3.5) return "3rd"
  return `${Math.round(pos)}th`
}

const SIGNUP_URL = "/signup?source=free-audit&redirect_url=/free-audit/activate"

// ============================================================================
// DERIVE AUDIT FINDINGS
// ============================================================================

function deriveFindings(data: ReportData, brandName: string) {
  const primary = data.stats.find((s) => s.is_primary)
  if (!primary) return null

  const competitors = data.stats
    .filter((s) => !s.is_primary && s.lvi_score > 0)
    .sort((a, b) => b.lvi_score - a.lvi_score)
  const totalPrompts = data.metadata.total_prompts || 0
  const totalResponses = data.metadata.total_responses || 0

  // ── Per-model stats ────────────────────────────────────────────────
  const modelMap = new Map<
    string,
    { responses: number; mentions: number; sentiment: number; sentCount: number; position: number; posCount: number; citations: number; lvi: number; lviCount: number }
  >()
  data.timeseries.forEach((t) => {
    if (!t.is_primary || !t.model_name) return
    const e = modelMap.get(t.model_name) || { responses: 0, mentions: 0, sentiment: 0, sentCount: 0, position: 0, posCount: 0, citations: 0, lvi: 0, lviCount: 0 }
    e.responses += t.total_responses || 0
    e.mentions += t.mention_count || 0
    e.sentiment += t.avg_sentiment || 0
    e.sentCount++
    if (t.avg_position > 0) { e.position += t.avg_position; e.posCount++ }
    e.citations += t.citation_count || 0
    e.lvi += t.lvi_score || 0
    e.lviCount++
    modelMap.set(t.model_name, e)
  })

  const modelStats = Array.from(modelMap.entries())
    .map(([model, e]) => ({
      model,
      ...getModelInfo(model),
      responses: e.responses,
      mentions: e.mentions,
      mentionRate: e.responses > 0 ? (e.mentions / e.responses) * 100 : 0,
      sentiment: e.sentCount > 0 ? e.sentiment / e.sentCount : 0,
      position: e.posCount > 0 ? e.position / e.posCount : 0,
      citations: e.citations,
      lvi: e.lviCount > 0 ? e.lvi / e.lviCount : 0,
    }))
    .sort((a, b) => b.lvi - a.lvi)

  // Note: No fallback that clones primary metrics to all models.
  // If per-model data is unavailable (modelStats is empty), the report
  // renders without per-model breakdown rather than fabricating identical
  // metrics across platforms. This ensures data integrity.

  // ── Citations ──────────────────────────────────────────────────────
  // Use actual citation data from the citations array (source of truth),
  // not the summary count which may differ due to aggregation scope.
  const totalCitations = data.citations.reduce((sum, c) => sum + c.total_citations, 0)
  const brandLower = brandName.toLowerCase().replace(/\s+/g, "")
  const ownCitations = data.citations.filter((c) => c.source_domain.toLowerCase().includes(brandLower))
  const topCitedDomains = [...data.citations].sort((a, b) => b.total_citations - a.total_citations).slice(0, 10)

  // ── Prompts ────────────────────────────────────────────────────────
  const strengths = data.prompts.strengths || []
  const opportunities = data.prompts.opportunities || []

  // ── Competitor intelligence ────────────────────────────────────────
  const topCompetitor = competitors[0] || null
  // Count non-primary brand mentions across responses, requiring each brand
  // to appear in at least 2 separate responses for confidence (prevents hallucinated names)
  const brandResponseSets = new Map<string, Set<string>>()
  data.recentMentions.forEach((m) => {
    const responseKey = `${m.prompt_text}__${m.model_name || ''}`
    m.mentioned_brands.filter((b) => !b.isPrimary).forEach((b) => {
      if (!brandResponseSets.has(b.name)) brandResponseSets.set(b.name, new Set())
      brandResponseSets.get(b.name)!.add(responseKey)
    })
  })
  const competitorBrandCount = Object.fromEntries(
    Array.from(brandResponseSets.entries())
      .filter(([, responses]) => responses.size >= 2) // Require 2+ independent mentions
      .map(([name, responses]) => [name, responses.size])
  )
  const discoveredBrands = Object.entries(competitorBrandCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 12)
    .map(([name, count]) => ({ name, count }))

  // ── Topics ─────────────────────────────────────────────────────────
  const brandTopics = data.topicMatrix.data
    .filter((d) => d.brand.toLowerCase() === brandName.toLowerCase() && d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  // ── Citation opportunities ─────────────────────────────────────────
  const citationOpps = data.citationOpportunities
    .sort((a, b) => b.opportunity_score - a.opportunity_score)
    .slice(0, 5)

  // ── Headline ──────────────────────────────────────────────────────
  let headline = ""
  let headlineType: "positive" | "warning" | "critical" = "warning"

  const invisibleModels = modelStats.filter((m) => m.mentionRate < 15)
  if (invisibleModels.length === modelStats.length && modelStats.length > 0) {
    headline = `${brandName} is invisible across all ${modelStats.length} AI platforms we tested. When customers ask AI about your industry, they won't find you.`
    headlineType = "critical"
  } else if (invisibleModels.length > 0) {
    headline = `${brandName} is missing from ${invisibleModels.map((m) => m.name).join(" and ")}. That's ${invisibleModels.length} of ${modelStats.length} AI platforms where customers can't find you.`
    headlineType = "critical"
  } else if (topCompetitor && topCompetitor.lvi_score > primary.lvi_score + 15) {
    headline = `${topCompetitor.brand_name} outscores ${brandName} by ${(topCompetitor.lvi_score - primary.lvi_score).toFixed(0)} points in AI visibility. They're getting recommended to your potential customers more often.`
    headlineType = "warning"
  } else if (primary.lvi_score >= 70) {
    headline = `${brandName} has strong AI visibility with a score of ${primary.lvi_score.toFixed(0)}/100. You're being mentioned in ${primary.mention_rate.toFixed(0)}% of relevant AI conversations — that's a competitive advantage.`
    headlineType = "positive"
  } else if (primary.mention_rate < 40) {
    headline = `AI mentions ${brandName} in only ${primary.mention_rate.toFixed(0)}% of relevant customer queries. More than half the time, customers searching via AI are directed to your competitors instead.`
    headlineType = "warning"
  } else {
    headline = `${brandName} appears in ${primary.mention_rate.toFixed(0)}% of AI responses with an average position of ${positionText(primary.avg_position)}. There's room to improve — especially on citation authority and positioning.`
    headlineType = "warning"
  }

  // ── Action items ──────────────────────────────────────────────────
  const actions: Array<{ priority: "critical" | "high" | "medium"; title: string; detail: string }> = []

  if (invisibleModels.length > 0) {
    actions.push({
      priority: invisibleModels.length === modelStats.length ? "critical" : "high",
      title: invisibleModels.length === modelStats.length
        ? `Not visible on any of the ${modelStats.length} AI platforms tested`
        : `Invisible on ${invisibleModels.map((m) => m.name).join(", ")}`,
      detail: `Potential customers searching via these AI platforms won't find ${brandName}. Create authoritative, structured content that directly answers customer questions.`,
    })
  }

  if (totalCitations < 3) {
    actions.push({
      priority: "critical",
      title: `Only ${totalCitations} source citation${totalCitations === 1 ? "" : "s"} found`,
      detail: `AI models cite sources to verify claims. Brands with 10+ citations have 3-5× higher visibility. Get featured on industry publications, review sites, and expert blogs.`,
    })
  }

  if (ownCitations.length === 0 && totalCitations > 0) {
    actions.push({
      priority: "high",
      title: `Your website is never cited as a source`,
      detail: `AI cites ${topCitedDomains.slice(0, 2).map((d) => d.source_domain).join(", ")} — but not your site. Create AI-optimized FAQ pages, how-to guides, and comparison content.`,
    })
  }

  if (primary.avg_position > 4 && primary.mention_rate > 30) {
    actions.push({
      priority: "high",
      title: `Listed low — average position ${primary.avg_position.toFixed(1)}`,
      detail: `You're mentioned but competitors are listed first. Brands in position #1 get 2× more consideration. Build topical authority and earn more source citations.`,
    })
  }

  if (topCompetitor && topCompetitor.lvi_score > primary.lvi_score) {
    const gap = topCompetitor.lvi_score - primary.lvi_score
    actions.push({
      priority: gap > 20 ? "high" : "medium",
      title: `${topCompetitor.brand_name} scores ${gap.toFixed(0)} points higher`,
      detail: `Analyze what content and citations are driving their advantage. Focus on the queries where they appear but you don't.`,
    })
  }

  if (opportunities.length > 0) {
    actions.push({
      priority: "medium",
      title: `${opportunities.length} search ${opportunities.length === 1 ? "query" : "queries"} where competitors appear but you don't`,
      detail: `Create targeted content for these search intents to capture AI recommendations you're currently missing.`,
    })
  }

  if (actions.length === 0) {
    actions.push({
      priority: "medium",
      title: "Maintain your AI visibility lead",
      detail: `Your brand is performing well. Monitor weekly to catch changes early and defend your position.`,
    })
  }

  return {
    primary,
    competitors,
    modelStats,
    totalPrompts,
    totalResponses,
    totalCitations,
    ownCitations,
    topCitedDomains,
    strengths,
    opportunities,
    topCompetitor,
    discoveredBrands,
    brandTopics,
    citationOpps,
    headline,
    headlineType,
    actions,
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FreeAuditReport({ brandName, brandId, freeAuditToken, onBack }: FreeAuditReportProps) {
  const { data, isLoading, error } = useReportData({
    reportId: brandId,
    period: "30d",
    includeCompetitors: true,
    autoRefresh: false,
    freeAuditToken,
  })

  const [expandedMention, setExpandedMention] = useState<number | null>(null)
  const [showOverlay, setShowOverlay] = useState(false)
  const [overlayDismissed, setOverlayDismissed] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  const findings = useMemo(() => (data ? deriveFindings(data, brandName) : null), [data, brandName])

  // Show overlay after scrolling past hero
  useEffect(() => {
    if (overlayDismissed) return
    const handleScroll = () => {
      const heroBottom = heroRef.current?.getBoundingClientRect().bottom ?? 0
      setShowOverlay(heroBottom < -200)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [overlayDismissed])

  // ── Loading ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-white/10" />
            <div className="absolute inset-0 rounded-full border-2 border-t-white animate-spin" />
          </div>
          <p className="text-white/80 font-medium mb-1">Analyzing AI visibility</p>
          <p className="text-white/40 text-sm">Scanning {brandName} across AI platforms...</p>
        </div>
      </div>
    )
  }

  if (error || !data || !findings) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-950 mb-2">Unable to Load Report</h2>
          <p className="text-gray-500 mb-6">{error?.message || "Something went wrong loading the audit data."}</p>
          {onBack && <Button onClick={onBack} variant="outline">Go Back</Button>}
        </div>
      </div>
    )
  }

  const { primary, competitors, modelStats, totalPrompts, totalResponses, totalCitations, topCitedDomains, strengths, opportunities, discoveredBrands, brandTopics, citationOpps, headline, headlineType, actions } = findings
  const g = gradeScore(primary.lvi_score)
  const sent = sentimentLabel(primary.avg_sentiment)
  const platforms = modelStats.length || data.metadata.availableModels?.length || 0

  // Group mentions by prompt
  const mentionsByPrompt = new Map<string, typeof data.recentMentions>()
  data.recentMentions.forEach((m) => {
    const existing = mentionsByPrompt.get(m.prompt_text) || []
    existing.push(m)
    mentionsByPrompt.set(m.prompt_text, existing)
  })

  // Build share-of-voice bar data
  const sovBars = [
    { name: brandName, score: primary.lvi_score, isPrimary: true },
    ...competitors.slice(0, 4).map((c) => ({ name: c.brand_name, score: c.lvi_score, isPrimary: false })),
  ].sort((a, b) => b.score - a.score)
  const maxSov = Math.max(...sovBars.map((s) => s.score), 1)

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50 print:bg-white">

        {/* ═══════════════════════════════════════════════════════════
            HERO — Dark header with score gauge + 3 key metrics
           ═══════════════════════════════════════════════════════════ */}
        <div ref={heroRef} className="bg-gray-950 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 opacity-[0.03] rounded-full blur-3xl" style={{ background: g.ringColor }} />

          <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-14 sm:pb-20 relative">

            {/* Meta line */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-8 sm:mb-10">
              <Badge className="bg-white/[0.08] text-white/90 border-white/[0.12] text-[11px] font-medium tracking-wider px-3 py-1">
                AI BRAND AUDIT
              </Badge>
              <span className="text-white/30 text-sm">
                {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </span>
            </div>

            {/* Brand name + context */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-5 leading-[1.1]">{brandName}</h1>
            <p className="text-lg sm:text-xl text-white/50 max-w-xl leading-relaxed mb-10">
              We queried <span className="text-white/80 font-medium">{platforms} AI platforms</span> with{" "}
              <span className="text-white/80 font-medium">{totalPrompts} real customer questions</span> about your industry.
              Here&apos;s how AI talks about your brand.
            </p>

            {/* Score gauge + 3 metric pills — single row */}
            <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:gap-5">
              {/* Score gauge card */}
              <div className="bg-white/[0.06] border border-white/[0.08] rounded-xl px-5 sm:px-6 py-4 sm:py-5 flex items-center gap-4 sm:gap-5 shrink-0">
                <ScoreGauge score={primary.lvi_score} grade={g} size="small" />
                <div>
                  <div className="text-[11px] sm:text-xs text-white/40 uppercase tracking-wider font-semibold mb-1">Visibility Score</div>
                  <div className="text-3xl sm:text-4xl font-bold text-white leading-none">{primary.lvi_score.toFixed(0)}<span className="text-lg text-white/30 font-medium">/100</span></div>
                  <div className="text-xs text-white/30 mt-1.5">Mentions, citations, sentiment &amp; position</div>
                </div>
              </div>

              {/* 3 metric pills */}
              <div className="grid grid-cols-3 gap-3 sm:gap-5 flex-1 min-w-0">
                <MetricPill
                  label="Mention Rate"
                  value={`${primary.mention_rate.toFixed(0)}%`}
                  sub={`${primary.total_mentions} of ${totalResponses}`}
                  tooltip={`AI mentioned ${brandName} in ${primary.total_mentions} of ${totalResponses} responses`}
                />
                <MetricPill
                  label="Sentiment"
                  value={sent.text}
                  sub={`${((primary.avg_sentiment + 1) * 5).toFixed(1)}/10`}
                  tooltip="How positively AI talks about your brand (-1 negative to +1 positive)"
                />
                <MetricPill
                  label="Source Citations"
                  value={String(totalCitations)}
                  sub={`${topCitedDomains.length} sources`}
                  tooltip="Number of times AI cited sources when mentioning your brand"
                />
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-10 pt-6 border-t border-white/[0.06] flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-white/30">
              <span>{totalResponses} AI responses analyzed</span>
              <span className="hidden sm:inline">·</span>
              <span>{totalPrompts} search queries tested</span>
              <span className="hidden sm:inline">·</span>
              <span>{platforms} AI platforms</span>
              <span className="hidden sm:inline">·</span>
              <span>{totalCitations} citations found</span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            EXECUTIVE SUMMARY
           ═══════════════════════════════════════════════════════════ */}
        <div className={cn(
          "border-b",
          headlineType === "critical" ? "bg-red-50/60 border-red-100" :
          headlineType === "warning" ? "bg-amber-50/40 border-amber-100" :
          "bg-emerald-50/40 border-emerald-100"
        )}>
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 sm:py-7">
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                headlineType === "critical" ? "bg-red-100" :
                headlineType === "warning" ? "bg-amber-100" :
                "bg-emerald-100"
              )}>
                {headlineType === "critical" ? <AlertTriangle className="h-5 w-5 text-red-600" /> :
                 headlineType === "warning" ? <Info className="h-5 w-5 text-amber-600" /> :
                 <CheckCircle className="h-5 w-5 text-emerald-600" />}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1.5 text-gray-500">Key Finding</p>
                <p className="text-base sm:text-lg text-gray-800 leading-relaxed font-semibold">{headline}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            WHY THIS MATTERS
           ═══════════════════════════════════════════════════════════ */}
        <div className="border-b border-gray-200 bg-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
            <div className="max-w-4xl">
              <div className="flex items-center gap-2.5 mb-3">
                <Lightbulb className="h-5 w-5 text-gray-400" />
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Why This Matters</p>
              </div>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Hundreds of millions of people now use ChatGPT, Gemini, and other AI assistants to research products and services before buying.
                If your brand doesn&apos;t appear in these AI responses, you&apos;re invisible to a fast-growing segment of potential customers.
                Unlike traditional SEO,{" "}
                <span className="font-semibold text-gray-900">AI visibility is determined by citations, authority, and sentiment</span> — not just keywords and links.
              </p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            REPORT BODY
           ═══════════════════════════════════════════════════════════ */}
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
          <div className="space-y-8 sm:space-y-10">

            {/* ── SECTION 1: Platform Performance ────────────────── */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 sm:px-6 pt-5 sm:pt-6">
                <SectionHeader
                  icon={<Eye className="h-5 w-5" />}
                  number={1}
                  title="How Each AI Platform Sees You"
                  subtitle={modelStats.length > 0 ? `Performance across ${platforms} major AI engines` : `Tested across ${platforms} AI engines`}
                />
              </div>

              {modelStats.length === 0 ? (
                <div className="px-6 sm:px-8 pb-6 sm:pb-8 mt-4">
                  <div className="border border-gray-200 rounded-xl p-6 text-center">
                    <p className="text-gray-500 text-sm">Per-model breakdown is being processed. Overall metrics are shown above.</p>
                  </div>
                </div>
              ) : (
              <>
              {/* Desktop table */}
              <div className="hidden sm:block px-6 sm:px-8 pb-6 sm:pb-8">
                <div className="border border-gray-200 rounded-xl overflow-hidden mt-4">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-200">
                        <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Platform</th>
                        <th className="text-center px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Visibility Score</th>
                        <th className="text-center px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Mention Rate</th>
                        <th className="text-center px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Avg Position</th>
                        <th className="text-center px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Sentiment</th>
                        <th className="text-right px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Citations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {modelStats.map((m) => {
                        const mg = gradeScore(m.lvi)
                        const s = sentimentLabel(m.sentiment)
                        return (
                          <tr key={m.model} className="group hover:bg-gray-50/60 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-white transition-colors">
                                  <img src={m.icon} alt={m.name} className="w-6 h-6 object-contain" />
                                </div>
                                <div>
                                  <div className="font-bold text-gray-900 text-[15px]">{m.name}</div>
                                  <div className="text-xs text-gray-400 mt-0.5">{m.responses} responses</div>
                                </div>
                              </div>
                            </td>
                            <td className="text-center px-4 py-4">
                              <div className="inline-flex items-center gap-2.5">
                                <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className={cn("h-full rounded-full transition-all", mg.barColor)} style={{ width: `${m.lvi}%` }} />
                                </div>
                                <span className={cn("text-[15px] font-bold tabular-nums", mg.color)}>{m.lvi.toFixed(0)}</span>
                              </div>
                            </td>
                            <td className="text-center px-4 py-4">
                              <span className={cn(
                                "text-[15px] font-semibold",
                                m.mentionRate >= 60 ? "text-gray-900" : m.mentionRate >= 30 ? "text-gray-700" : "text-red-600"
                              )}>
                                {m.mentionRate.toFixed(0)}%
                              </span>
                            </td>
                            <td className="text-center px-4 py-4">
                              <span className="text-[15px] font-medium text-gray-700">{positionText(m.position)}</span>
                            </td>
                            <td className="text-center px-4 py-4">
                              <div className="inline-flex items-center gap-2">
                                <div className={cn("w-2.5 h-2.5 rounded-full", s.dotColor)} />
                                <span className={cn("text-[15px] font-medium", s.color)}>{s.text}</span>
                              </div>
                            </td>
                            <td className="text-right px-5 py-4">
                              <span className="text-[15px] font-medium text-gray-700 tabular-nums">{m.citations}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden px-5 pb-5 space-y-3">
                {modelStats.map((m) => {
                  const mg = gradeScore(m.lvi)
                  const s = sentimentLabel(m.sentiment)
                  return (
                    <div key={m.model} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            <img src={m.icon} alt={m.name} className="w-6 h-6 object-contain" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{m.name}</div>
                            <div className="text-xs text-gray-400">{m.responses} responses</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={cn("text-2xl font-bold tabular-nums", mg.color)}>{m.lvi.toFixed(0)}</span>
                          <span className="text-sm text-gray-400">/100</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                        <div className={cn("h-full rounded-full", mg.barColor)} style={{ width: `${m.lvi}%` }} />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-xs text-gray-400 mb-0.5">Mentioned</div>
                          <div className="text-sm font-bold text-gray-900">{m.mentionRate.toFixed(0)}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-0.5">Position</div>
                          <div className="text-sm font-semibold text-gray-700">{positionText(m.position)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-0.5">Sentiment</div>
                          <div className={cn("text-sm font-semibold", s.color)}>{s.text}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Platform insight callout */}
              {modelStats.length > 1 && (() => {
                const best = modelStats[0]
                const worst = modelStats[modelStats.length - 1]
                if (best.lvi - worst.lvi < 10) return null
                return (
                  <div className="mx-6 sm:mx-8 mb-6 sm:mb-8 bg-gray-50 rounded-xl px-5 py-4 flex items-start gap-3">
                    <BarChart3 className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                    <p className="text-[15px] text-gray-600 leading-relaxed">
                      <span className="font-bold text-gray-900">{best.name}</span> is your strongest platform (score {best.lvi.toFixed(0)}) while{" "}
                      <span className="font-bold text-gray-900">{worst.name}</span> is your weakest ({worst.lvi.toFixed(0)}).
                      {worst.lvi < 20
                        ? " Your brand is essentially invisible there — a major blind spot."
                        : ` That's a ${(best.lvi - worst.lvi).toFixed(0)}-point gap worth closing.`}
                    </p>
                  </div>
                )
              })()}
              </>
              )}
            </div>

            {/* ── SECTION 2: Search Queries ───────────────────────── */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 sm:px-6 pt-5 sm:pt-6">
                <SectionHeader
                  icon={<Search className="h-5 w-5" />}
                  number={2}
                  title="What Customers Are Asking AI"
                  subtitle={`We tested ${totalPrompts} real search queries — here's how AI responds`}
                />
              </div>

              <div className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-3 mt-2">
                {Array.from(mentionsByPrompt.entries()).map(([promptText, mentions], idx) => {
                  const isExpanded = expandedMention === idx
                  const bestPosition = mentions.reduce((best, m) => {
                    if (m.brand_position && m.brand_position > 0) return Math.min(best, m.brand_position)
                    return best
                  }, Infinity)
                  const allModels = mentions.map((m) => getModelInfo(m.model_name))
                  const mentionedCount = mentions.filter((m) => m.mentions > 0).length

                  return (
                    <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden transition-all">
                      <button
                        onClick={() => setExpandedMention(isExpanded ? null : idx)}
                        className="w-full text-left px-5 py-4 flex items-start gap-3.5 hover:bg-gray-50/60 transition-colors"
                      >
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                          bestPosition <= 3 ? "bg-emerald-50" :
                          bestPosition < Infinity ? "bg-amber-50" :
                          "bg-red-50"
                        )}>
                          {bestPosition <= 3 ? <CheckCircle className="h-4.5 w-4.5 text-emerald-600" /> :
                           bestPosition < Infinity ? <TrendingDown className="h-4.5 w-4.5 text-amber-600" /> :
                           <AlertTriangle className="h-4.5 w-4.5 text-red-500" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-semibold text-gray-900 leading-snug">&ldquo;{promptText}&rdquo;</p>
                          <div className="flex flex-wrap items-center gap-2.5 mt-2">
                            <div className="flex -space-x-1.5">
                              {allModels.slice(0, 5).map((m, i) => (
                                <div key={i} className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                                  <img src={m.icon} alt={m.name} className="w-3.5 h-3.5 object-contain" />
                                </div>
                              ))}
                            </div>
                            <span className="text-sm text-gray-400">
                              Mentioned in {mentionedCount}/{mentions.length} responses
                            </span>
                            {bestPosition <= 5 && bestPosition > 0 && (
                              <>
                                <span className="text-gray-200">·</span>
                                <span className="text-sm text-gray-400">Best position: {positionText(bestPosition)}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <ChevronDown className={cn("h-5 w-5 text-gray-300 shrink-0 mt-1 transition-transform", isExpanded && "rotate-180")} />
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50/40 divide-y divide-gray-100">
                          {mentions.map((m, mIdx) => {
                            const mInfo = getModelInfo(m.model_name)
                            const isMentioned = m.mentions > 0
                            return (
                              <div key={mIdx} className="px-5 py-4">
                                <div className="flex items-center gap-2.5 mb-2.5">
                                  <img src={mInfo.icon} alt={mInfo.name} className="w-5 h-5 object-contain" />
                                  <span className="text-sm font-bold text-gray-700">{mInfo.name}</span>
                                  {isMentioned ? (
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] py-0">
                                      {m.brand_position ? `#${m.brand_position}` : "Mentioned"}
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-gray-100 text-gray-500 border-gray-200 text-[11px] py-0">Not mentioned</Badge>
                                  )}
                                  {m.sources_cited.length > 0 && (
                                    <span className="text-xs text-gray-400">{m.sources_cited.length} source{m.sources_cited.length !== 1 ? "s" : ""}</span>
                                  )}
                                </div>
                                {m.response_snippet && (
                                  <div className="bg-white border border-gray-200 rounded-lg p-4 relative">
                                    <Quote className="h-3.5 w-3.5 text-gray-200 absolute top-3 left-3.5" />
                                    <p className="text-[15px] text-gray-600 leading-relaxed pl-6 italic">
                                      {m.response_snippet.length > 350 ? m.response_snippet.slice(0, 350) + "..." : m.response_snippet}
                                    </p>
                                  </div>
                                )}
                                {m.mentioned_brands.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-3">
                                    {m.mentioned_brands.slice(0, 8).map((b, bIdx) => (
                                      <span key={bIdx} className={cn(
                                        "text-[11px] px-2.5 py-0.5 rounded-full border font-semibold",
                                        b.name.toLowerCase() === brandName.toLowerCase()
                                          ? "bg-gray-950 text-white border-gray-950"
                                          : "bg-white text-gray-500 border-gray-200"
                                      )}>
                                        {b.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Query insights */}
                {strengths.length > 0 && (
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl px-5 py-4 flex items-start gap-3 mt-4">
                    <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-[15px] text-gray-700 leading-relaxed">
                      <span className="font-bold text-emerald-700">Strong on {strengths.length} {strengths.length === 1 ? "query" : "queries"}:</span>{" "}
                      {strengths.slice(0, 2).map((s) => `"${s.prompt_text.length > 50 ? s.prompt_text.slice(0, 50) + "..." : s.prompt_text}"`).join(", ")}
                      {strengths.length > 2 && ` and ${strengths.length - 2} more`}.
                    </p>
                  </div>
                )}
                {opportunities.length > 0 && (
                  <div className="bg-amber-50/50 border border-amber-100 rounded-xl px-5 py-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[15px] text-gray-700 leading-relaxed">
                      <span className="font-bold text-amber-700">Missing from {opportunities.length} {opportunities.length === 1 ? "query" : "queries"}:</span>{" "}
                      {opportunities.slice(0, 2).map((o) => `"${o.prompt_text.length > 50 ? o.prompt_text.slice(0, 50) + "..." : o.prompt_text}"`).join(", ")}
                      {opportunities.length > 2 && ` and ${opportunities.length - 2} more`}. Competitors like{" "}
                      {opportunities.slice(0, 1).flatMap((o) => o.competitors_mentioned.slice(0, 2)).join(", ") || "others"} appear instead.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── SECTION 3: Competitive Landscape ────────────────── */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 sm:px-6 pt-5 sm:pt-6">
                <SectionHeader
                  icon={<Users className="h-5 w-5" />}
                  number={3}
                  title="Your Competitive Landscape"
                  subtitle="Who AI recommends alongside — or instead of — your brand"
                />
              </div>

              <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                {(competitors.length > 0 || discoveredBrands.length > 0) ? (
                  <div className="space-y-6 mt-2">
                    {sovBars.length > 1 && (
                      <div className="border border-gray-200 rounded-xl p-5 sm:p-6">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-5">Visibility Score Comparison</p>
                        <div className="space-y-3.5">
                          {sovBars.map((b, i) => (
                            <div key={i} className="flex items-center gap-4">
                              <div className="w-28 sm:w-36 text-right shrink-0">
                                <span className={cn(
                                  "text-[15px] truncate inline-block max-w-full",
                                  b.isPrimary ? "font-bold text-gray-900" : "font-medium text-gray-600"
                                )}>
                                  {b.name}
                                  {b.isPrimary && <span className="text-[11px] text-gray-400 font-normal ml-1.5">(You)</span>}
                                </span>
                              </div>
                              <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                                <div
                                  className={cn("h-full rounded-lg transition-all flex items-center", b.isPrimary ? "bg-gray-900" : "bg-gray-300")}
                                  style={{ width: `${Math.max((b.score / maxSov) * 100, 3)}%` }}
                                />
                                <span className={cn(
                                  "absolute right-2.5 top-1/2 -translate-y-1/2 text-sm font-bold tabular-nums",
                                  (b.score / maxSov) * 100 > 50 ? "text-white" : "text-gray-600"
                                )} style={(b.score / maxSov) * 100 > 50 ? {} : { right: "auto", left: `${Math.max((b.score / maxSov) * 100, 3) + 2}%` }}>
                                  {b.score.toFixed(0)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {discoveredBrands.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Brands AI Mentions in Your Space</p>
                        <div className="flex flex-wrap gap-2.5">
                          {discoveredBrands.map((b, i) => (
                            <span key={i} className="inline-flex items-center gap-2 text-[15px] font-medium px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors">
                              {b.name}
                              <span className="text-gray-300 text-sm">×{b.count}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl p-12 text-center mt-2">
                    <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-base text-gray-500">Add competitors when you sign up to see detailed comparisons.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── SECTION 4: Where AI Gets Information ────────────── */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 sm:px-6 pt-5 sm:pt-6">
                <SectionHeader
                  icon={<BookOpen className="h-5 w-5" />}
                  number={4}
                  title="Where AI Gets Information About You"
                  subtitle={`AI models cited ${topCitedDomains.length} sources — ${findings.ownCitations.length > 0 ? "including your website" : "your website isn't among them"}`}
                />
              </div>

              <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                {topCitedDomains.length > 0 ? (
                  <div className="space-y-4 mt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {topCitedDomains.map((c, i) => {
                        const isOwn = c.source_domain.toLowerCase().includes(brandName.toLowerCase().replace(/\s+/g, ""))
                        return (
                          <div key={i} className={cn(
                            "border rounded-xl p-4 flex items-start gap-3.5 transition-colors",
                            isOwn ? "border-emerald-200 bg-emerald-50/30" : "border-gray-200 hover:bg-gray-50/50"
                          )}>
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${c.source_domain}&sz=32`}
                              alt=""
                              className="w-6 h-6 rounded mt-0.5 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn("text-[15px] font-semibold truncate", isOwn ? "text-emerald-800" : "text-gray-900")}>
                                  {c.source_domain}
                                </span>
                                {isOwn && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] shrink-0">YOUR SITE</Badge>}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                                <span>Cited {c.total_citations}×</span>
                                <span className="capitalize">{c.source_type || "earned"}</span>
                                {c.primary_brand_citations > 0 && (
                                  <span className="text-emerald-600 font-semibold">{c.primary_brand_citations}× for you</span>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0">
                              {c.is_authoritative && (
                                <UITooltip>
                                  <TooltipTrigger>
                                    <Shield className="h-4 w-4 text-blue-500" />
                                  </TooltipTrigger>
                                  <TooltipContent className="text-xs">High-authority source</TooltipContent>
                                </UITooltip>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {citationOpps.length > 0 && (
                      <div className="bg-blue-50/50 border border-blue-100 rounded-xl px-5 py-4 flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[15px] text-gray-700 leading-relaxed">
                          <span className="font-bold text-blue-700">{citationOpps.length} citation opportunities found.</span>{" "}
                          Sources like {citationOpps.slice(0, 2).map((c) => c.source_domain).join(", ")} are cited by AI but don&apos;t mention {brandName} yet.{" "}
                          <span className="text-blue-600 font-semibold">Getting featured on these sites could boost your visibility.</span>
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl p-12 text-center mt-2">
                    <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-base text-gray-500">No citations found. AI models aren&apos;t citing any sources for your industry queries.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── SECTION 5: Topics ──────────────────────────────── */}
            {brandTopics.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 sm:px-6 pt-5 sm:pt-6">
                  <SectionHeader
                    icon={<Sparkles className="h-5 w-5" />}
                    number={5}
                    title="Topics AI Associates With Your Brand"
                    subtitle="What AI 'thinks' your brand is about — based on actual responses"
                  />
                </div>

                <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                  <div className="flex flex-wrap gap-2.5 mt-2">
                    {brandTopics.map((t, i) => {
                      const intensity = Math.min(t.value / Math.max(brandTopics[0]?.value || 1, 1), 1)
                      return (
                        <span
                          key={i}
                          className={cn(
                            "px-4 py-2 rounded-xl border text-[15px] font-semibold transition-colors",
                            intensity >= 0.7 ? "bg-gray-950 text-white border-gray-950" :
                            intensity >= 0.4 ? "bg-gray-100 text-gray-800 border-gray-200" :
                            "bg-white text-gray-500 border-gray-200"
                          )}
                        >
                          {t.topic}
                        </span>
                      )
                    })}
                  </div>
                  <p className="text-sm text-gray-400 mt-4">Darker tags = stronger association. These topic associations determine which queries your brand appears in.</p>
                </div>
              </div>
            )}

            {/* ── SECTION 6: Action Plan ──────────────────────────── */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 sm:px-6 pt-5 sm:pt-6">
                <SectionHeader
                  icon={<Rocket className="h-5 w-5" />}
                  number={brandTopics.length > 0 ? 6 : 5}
                  title="Your AI Visibility Action Plan"
                  subtitle="What to do next, based on your audit results"
                />
              </div>

              <div className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-3 mt-2">
                {actions.map((a, i) => (
                  <div key={i} className={cn(
                    "border rounded-xl p-5 sm:p-6 flex items-start gap-4",
                    a.priority === "critical" ? "border-red-200 bg-red-50/30" :
                    a.priority === "high" ? "border-amber-200 bg-amber-50/20" :
                    "border-gray-200 bg-white"
                  )}>
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold",
                      a.priority === "critical" ? "bg-red-100 text-red-700" :
                      a.priority === "high" ? "bg-amber-100 text-amber-700" :
                      "bg-gray-100 text-gray-600"
                    )}>
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h4 className="text-base font-bold text-gray-900 leading-snug">{a.title}</h4>
                        <Badge className={cn(
                          "shrink-0 text-[10px] font-bold uppercase tracking-wider",
                          a.priority === "critical" ? "bg-red-100 text-red-700 border-red-200" :
                          a.priority === "high" ? "bg-amber-100 text-amber-700 border-amber-200" :
                          "bg-gray-100 text-gray-500 border-gray-200"
                        )}>
                          {a.priority}
                        </Badge>
                      </div>
                      <p className="text-[15px] text-gray-500 leading-relaxed">{a.detail}</p>
                    </div>
                  </div>
                ))}

                {/* Locked teaser */}
                <div className="border border-dashed border-gray-300 rounded-xl p-5 sm:p-6 bg-gray-50/30 relative overflow-hidden">
                  <div className="flex items-start gap-3 opacity-60 blur-[1px]">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      <Zap className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-gray-900">Weekly AI-generated optimization recommendations</h4>
                      <p className="text-[15px] text-gray-500 mt-1">Get specific, data-driven content and strategy suggestions every week based on how AI...</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
                    <div className="text-center">
                      <Lock className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-base font-bold text-gray-700">Unlock weekly AI recommendations</p>
                      <Link href={SIGNUP_URL}>
                        <Button size="sm" className="mt-3 bg-gray-950 hover:bg-gray-800 text-white text-sm h-9 px-5">
                          Start Free Trial <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 py-6 print:hidden">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 bg-gray-950 rounded-md text-white flex items-center justify-center text-[10px] font-bold">S</div>
              <span className="text-sm text-gray-400">Soma AI · AI Visibility Platform</span>
            </div>
            <span className="text-sm text-gray-400">
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            FLOATING OVERLAY CTA
           ═══════════════════════════════════════════════════════════ */}
        {showOverlay && !overlayDismissed && (
          <div className="fixed bottom-0 inset-x-0 z-50 print:hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gray-950 border-t border-white/10">
              <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 sm:py-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  <button
                    onClick={() => setOverlayDismissed(true)}
                    className="absolute top-3 right-4 sm:static sm:order-last p-1.5 hover:bg-white/10 rounded-lg transition-colors shrink-0"
                    aria-label="Dismiss"
                  >
                    <X className="h-4 w-4 text-white/40" />
                  </button>
                  <div className="flex-1 min-w-0 pr-8 sm:pr-0">
                    <p className="text-white font-bold text-base sm:text-lg leading-snug">
                      Make {brandName} the brand AI recommends.
                    </p>
                    <p className="text-white/50 text-sm mt-1 leading-relaxed">
                      Start your free trial to monitor weekly, get competitor alerts, and optimize your AI presence.
                    </p>
                  </div>
                  <Link href={SIGNUP_URL} className="shrink-0 w-full sm:w-auto">
                    <Button className="bg-white text-gray-950 hover:bg-gray-100 font-bold text-[15px] px-6 h-11 w-full sm:w-auto">
                      Start Free Trial
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

// ============================================================================
// Sub-components
// ============================================================================

function SectionHeader({ icon, number, title, subtitle }: { icon: React.ReactNode; number: number; title: string; subtitle: string }) {
  return (
    <div className="bg-gray-950 text-white rounded-xl px-5 py-4 flex items-center gap-4">
      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <h2 className="text-lg sm:text-xl font-bold leading-tight">{title}</h2>
        <p className="text-white/50 text-sm mt-0.5">{subtitle}</p>
      </div>
    </div>
  )
}

function MetricPill({ label, value, sub, tooltip }: { label: string; value: string; sub: string; tooltip: string }) {
  return (
    <UITooltip>
      <TooltipTrigger asChild>
        <div className="bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 sm:px-5 py-4 sm:py-5 cursor-help">
          <div className="text-[11px] sm:text-xs text-white/40 uppercase tracking-wider font-semibold mb-2">{label}</div>
          <div className="text-xl sm:text-3xl font-bold text-white leading-none">{value}</div>
          <div className="text-xs sm:text-sm text-white/30 mt-1.5">{sub}</div>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs bg-gray-900 text-white border-gray-700 text-sm">{tooltip}</TooltipContent>
    </UITooltip>
  )
}

function ScoreGauge({ score, grade: g, size = "large" }: { score: number; grade: ReturnType<typeof gradeScore>; size?: "small" | "large" }) {
  const circumference = 2 * Math.PI * 52
  const fillPct = Math.min(score / 100, 1)
  const dashOffset = circumference * (1 - fillPct)

  const sizeClass = size === "small" ? "w-16 h-16" : "w-40 h-40 sm:w-48 sm:h-48"

  return (
    <div className={cn("relative shrink-0", sizeClass)}>
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size === "small" ? "10" : "8"} />
        <circle
          cx="60" cy="60" r="52"
          fill="none"
          stroke={g.ringColor}
          strokeWidth={size === "small" ? "10" : "8"}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {size === "large" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl sm:text-6xl font-bold text-white leading-none">{score.toFixed(0)}</span>
          <span className="text-sm text-white/40 mt-1">out of 100</span>
        </div>
      )}
    </div>
  )
}
