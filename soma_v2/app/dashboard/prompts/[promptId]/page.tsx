"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useBrand } from '@/lib/contexts/brand-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Trophy, MessageSquare, FileText, ExternalLink, TrendingUp, TrendingDown, Users, ArrowLeft, Clock, ChevronRight, ChevronLeft, Activity } from 'lucide-react'

// Helper: relative time formatter for short relative labels
function formatRelativeTime(iso: string | number | Date | undefined) {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffSec = Math.round((now - then) / 1000)
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDays = Math.round(diffHr / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  const diffWeeks = Math.round(diffDays / 7)
  if (diffWeeks < 4) return `${diffWeeks}w ago`
  const diffMonths = Math.round(diffDays / 30)
  if (diffMonths < 12) return `${diffMonths}mo ago`
  const diffYears = Math.round(diffDays / 365)
  return `${diffYears}y ago`
}

// Map common model names/providers to logo paths under public/models
function getModelLogoPath(modelLabel: string) {
  if (!modelLabel) return '/models/chatgpt-logo.png'
  const s = modelLabel.toLowerCase()
  if (s.includes('openai') || s.includes('gpt') || s.includes('chatgpt')) return '/models/chatgpt-logo.png'
  if (s.includes('anthropic') || s.includes('claude')) return '/models/claude-logo.png'
  if (s.includes('google') || s.includes('gemini')) return '/models/gemini-logo.png'
  if (s.includes('grok') || s.includes('xai')) return '/models/grok-logo.png'
  if (s.includes('perplexity') || s.includes('sonar')) return '/models/perplexity-logo.png'
  if (s.includes('meta') || s.includes('llama')) return '/models/meta-logo.svg'
  // fallback
  return '/models/chatgpt-logo.png'
}

export default function PromptDetailPage() {
  const params = useParams()
  const promptId = params?.promptId
  const { currentBrand, currentWorkspace, isLoading: isBrandLoading } = useBrand()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isCached, setIsCached] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [prompt, setPrompt] = useState<any | null>(null)
  const [analytics, setAnalytics] = useState<any | null>(null)
  const [responses, setResponses] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [chatsPage, setChatsPage] = useState(0)
  const [sourcesPage, setSourcesPage] = useState(0)
  const CHATS_PER_PAGE = 5
  const SOURCES_PER_PAGE = 8

  useEffect(() => {
    const lastLoadRef = { current: 0 as number }
    // Guard: do not call APIs until we have brand context and promptId
    if (!currentBrand || !promptId) return

    // v3: unified endpoint cache key
    const cacheKey = `promptDetail:v3:${currentBrand.id}:${promptId}`
    // Clear stale cache entries
    try { sessionStorage.removeItem(`promptDetail:${currentBrand.id}:${promptId}`) } catch {}
    try { sessionStorage.removeItem(`promptDetail:v2:${currentBrand.id}:${promptId}`) } catch {}
    let cancelled = false

    const load = async (forceReload = false) => {
      const now = Date.now()
      const LOAD_TTL_MS = 60 * 1000 // 60s
      if (!forceReload && now - (lastLoadRef.current || 0) < LOAD_TTL_MS) {
        console.log('Skipping prompt detail reload (recently loaded)')
        setIsRefreshing(false)
        return
      }
      // If we have a cached copy and no forceReload, use it
      if (!forceReload) {
        const cached = sessionStorage.getItem(cacheKey)
        if (cached) {
          try {
            const parsed = JSON.parse(cached)
            if (parsed.prompt && parsed.analytics) {
              setPrompt(parsed.prompt)
              setAnalytics({ prompt_analytics: parsed.analytics })
              setResponses(parsed.responses || [])
              setIsCached(true)
              setLoading(false)
              return
            }
            sessionStorage.removeItem(cacheKey)
          } catch (e) {
            console.warn('Failed to parse prompt detail cache, refetching', e)
          }
        }
      }

      setLoading(true)
      setError(null)

      try {
        // Single unified endpoint — replaces 4 separate calls
        const res = await fetch(
          `/api/content/prompts/${encodeURIComponent(String(promptId))}?brand_id=${encodeURIComponent(currentBrand.id)}&responses_limit=200`
        )

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `Request failed: ${res.status}`)
        }

        const data = await res.json()
        if (cancelled) return

        const mergedAnalytics = {
          prompt_analytics: data.analytics || null
        }

        setPrompt(data.prompt || null)
        setAnalytics(mergedAnalytics)
        setResponses(data.responses || [])

        // Persist to sessionStorage
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            prompt: data.prompt,
            analytics: data.analytics,
            responses: data.responses || [],
            ts: Date.now()
          }))
        } catch (e) {
          console.warn('Failed to persist prompt detail to sessionStorage', e)
        }
        lastLoadRef.current = Date.now()
      } catch (err: any) {
        if (cancelled) return
        console.error('Prompt detail load error:', err)
        setError(err?.message || 'Unknown error')
      } finally {
        if (!cancelled) setLoading(false)
        setIsRefreshing(false)
      }
    }

    // Load from cache first; do not auto-refresh when returning to the route
    load(false)

    // Listen for events that explicitly invalidate cache
    const onPromptUpdated = (e: any) => {
      try { sessionStorage.removeItem(cacheKey) } catch {}
      // If update is for this prompt, force a reload
      if (!e?.detail || String(e.detail?.promptId) === String(promptId)) {
        load(true)
      }
    }

    const onBrandChanged = () => {
      try { sessionStorage.clear() } catch {}
    }

    const onDashboardRefresh = () => {
      try { sessionStorage.removeItem(cacheKey) } catch {}
      load(true)
    }

    window.addEventListener('promptDetailUpdated', onPromptUpdated)
    window.addEventListener('brandChanged', onBrandChanged)
    window.addEventListener('dashboardRefresh', onDashboardRefresh)

    return () => {
      cancelled = true
      window.removeEventListener('promptDetailUpdated', onPromptUpdated)
      window.removeEventListener('brandChanged', onBrandChanged)
      window.removeEventListener('dashboardRefresh', onDashboardRefresh)
    }
  }, [currentBrand, currentWorkspace, promptId])

  // Responses are now filtered server-side by prompt_id — no fuzzy matching needed
  const promptResponses = useMemo(() => {
    if (!responses || responses.length === 0) return []
    return responses
  }, [responses])

  // Build a Share of Voice time series from prompt_analytics
  const sovSeries = useMemo(() => {
    const promptAnalytics = analytics?.prompt_analytics
    if (promptAnalytics?.timeSeries && promptAnalytics.timeSeries.length > 0) {
      return promptAnalytics.timeSeries.map((day: any) => ({
        date: day.date,
        sov: Math.round((day.sov ?? 0) * 100) / 100,
        mentions: day.mentions,
        total: day.responses
      }))
    }
    
    // Fallback: build a single data point from current analytics summary
    const summary = promptAnalytics?.summary
    if (summary) {
      const sov = summary.shareOfVoice || summary.share_of_voice || 0
      if (sov > 0) {
        return [{
          date: new Date().toISOString().split('T')[0],
          sov: Math.round(sov * 100) / 100,
          mentions: summary.mentionCount || summary.total_appearances || 0,
          total: summary.totalResponses || summary.total_appearances || 0,
        }]
      }
    }
    
    return []
  }, [analytics])

  const modelRanking = useMemo(() => {
    const promptAnalytics = analytics?.prompt_analytics
    if (!promptAnalytics?.platforms || Object.keys(promptAnalytics.platforms).length === 0) {
      // Fallback to brand-level analytics
      const lm = analytics?.lvi_metrics?.lvi_by_model || []
      if (lm.length > 0) {
        return lm.map((m: any, idx: number) => ({
          position: idx + 1,
          model_name: m.model_name,
          lvi_score: Math.round((m.lvi_score || 0) * 10) / 10,
          response_count: m.response_count || 0,
          avg_sentiment: Math.round((m.avg_sentiment || 0) * 100) / 100
        }))
      }
      return []
    }

    // Use platform stats directly from the API
    const ranking = Object.entries(promptAnalytics.platforms).map(([platform, stats]: [string, any]) => ({
      position: 0, // Will be set after sorting
      model_name: platform,
      lvi_score: Math.round(stats.lvi * 10) / 10,
      response_count: stats.responses,
      avg_sentiment: Math.round(stats.avgSentiment * 100) / 100
    }))

    // Sort by LVI score descending
    ranking.sort((a, b) => b.lvi_score - a.lvi_score)
    
    // Assign positions
    ranking.forEach((item, idx) => { item.position = idx + 1 })
    
    return ranking
  }, [analytics])

  // Compute top competitors AND include the primary brand for the Industry Ranking table
  const industryRanking = useMemo(() => {
    const promptAnalytics = analytics?.prompt_analytics
    const competitors = promptAnalytics?.competitors || []
    const summary = promptAnalytics?.summary
    
    const rows: any[] = []

    // Add primary brand as the first entry
    if (summary && currentBrand) {
      const rawSent = summary.avgSentiment ?? summary.avg_sentiment ?? null
      rows.push({
        name: currentBrand.name,
        mentionCount: summary.mentionCount || 0,
        frequency: Math.round(summary.mentionRate || summary.mention_rate || 0),
        lvi: summary.lviScore || summary.avg_lvi || 0,
        avg_sentiment: rawSent,
        avg_position: (summary.avgPosition || summary.avg_position || 0) > 0 ? (summary.avgPosition || summary.avg_position) : null,
        isPrimary: true,
      })
    }

    if (competitors.length > 0) {
      const primaryName = currentBrand?.name?.toLowerCase()
      competitors.filter((c: any) => c.name?.toLowerCase() !== primaryName).slice(0, 5).forEach((c: any, idx: number) => {
        rows.push({
          name: c.name,
          mentionCount: c.mentionCount,
          frequency: c.frequency,
          lvi: c.lvi ?? null,
          avg_sentiment: c.avg_sentiment ?? null,
          avg_position: c.avg_position ?? null,
          isPrimary: false,
        })
      })
    } else {
      // Fallback to brand-level analytics
      const raw = analytics?.competitive_analysis?.detailed_competitor_analysis || analytics?.share_of_voice?.competitor_comparison || []
      if (Array.isArray(raw) && raw.length > 0) {
        raw.slice(0, 5).forEach((c: any, idx: number) => {
          rows.push({
            name: c.name || c.competitor_name || c.competitor || 'Competitor',
            mentionCount: c.mention_count || c.mentions || 0,
            frequency: c.frequency || 0,
            lvi: c.lvi_score ?? null,
            avg_sentiment: c.avg_sentiment ?? null,
            avg_position: null,
            isPrimary: false,
          })
        })
      }
    }

    return rows
  }, [analytics, currentBrand])

  // Build citation rows from the new API citations data
  const citationRows = useMemo(() => {
    const citations = analytics?.prompt_analytics?.citations || []
    if (citations.length === 0) return []
    return citations.map((c: any) => ({
      domain: c.domain,
      url: c.url,
      page_title: c.page_title,
      source_type: c.source_type,
      best_rank: c.best_rank,
      total_references: c.total_references,
      models: c.models || [],
    }))
  }, [analytics])

  // Latest response metadata for the sticky header
  const latestResponse = useMemo(() => {
    if (!promptResponses || promptResponses.length === 0) return null
    return promptResponses.slice().sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
  }, [promptResponses])

  const latestResponseTimeMs = latestResponse?.response_time_ms
  const latestResponseDateFormatted = latestResponse ? new Date(latestResponse.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

  if (isBrandLoading || !currentBrand) {
    return (
      <div className="max-w-9xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-9xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-9xl mx-auto px-6 py-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-rose-600">Error loading prompt</h3>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
             <div className="mt-4">
               <Link href="/dashboard/prompts"><Button variant="ghost">Back to prompts</Button></Link>
             </div>
           </CardContent>
         </Card>
       </div>
     )
   }

   return (
     <>
      {/* Sticky header adapted from Chat Detail (prompt-level) */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-9xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/prompts" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm font-medium">Back to Prompts</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900 truncate max-w-[60vw]">{prompt?.prompt_text || 'Prompt details'}</p>
                  <p className="text-xs text-gray-500">{promptResponses.length} responses</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {prompt?.classification && <Badge className="capitalize">{prompt.classification}</Badge>}
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                {latestResponseTimeMs ? `${Math.round(latestResponseTimeMs)}ms` : 'N/A'}
              </Badge>
              <span className="text-sm text-gray-500">{latestResponseDateFormatted}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-9xl mx-auto px-6 py-8">
       {/* Summary Metrics */}
       <Card className="border border-gray-200 bg-white shadow-sm overflow-hidden mb-6">
         <CardContent className="p-4">
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
             {/* Total Responses */}
             <div className="p-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-all duration-200">
               <div className="flex items-center justify-between mb-2">
                 <MessageSquare className="h-4 w-4 text-gray-500" />
               </div>
               <div className="space-y-1">
                 {!analytics?.prompt_analytics && loading ? (
                   <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                 ) : (
                   <div className="text-lg font-semibold text-gray-900">{analytics?.prompt_analytics?.summary?.totalResponses || analytics?.prompt_analytics?.summary?.total_appearances || promptResponses.length || 0}</div>
                 )}
                 <div className="text-xs font-medium text-gray-600">Total Responses</div>
                 <div className="text-xs text-gray-500">All platforms</div>
               </div>
             </div>

             {/* LVI Score */}
             <div className="p-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-all duration-200">
               <div className="flex items-center justify-between mb-2">
                 <TrendingUp className="h-4 w-4 text-gray-500" />
               </div>
               <div className="space-y-1">
                 {!analytics?.prompt_analytics && loading ? (
                   <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                 ) : (
                   <div className="text-lg font-semibold text-gray-900">{Math.round(analytics?.prompt_analytics?.summary?.lviScore || analytics?.prompt_analytics?.summary?.avg_lvi || 0)}<span className="text-sm font-normal text-gray-400">/100</span></div>
                 )}
                 <div className="text-xs font-medium text-gray-600">LVI Score</div>
                 <div className="text-xs text-gray-500">Visibility index</div>
               </div>
             </div>

             {/* Avg Position */}
             <div className="p-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-all duration-200">
               <div className="flex items-center justify-between mb-2">
                 <Trophy className="h-4 w-4 text-gray-500" />
               </div>
               <div className="space-y-1">
                 {!analytics?.prompt_analytics && loading ? (
                   <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                 ) : (
                   <div className="text-lg font-semibold text-gray-900">
                     {(analytics?.prompt_analytics?.summary?.avgPosition || analytics?.prompt_analytics?.summary?.avg_position || 0) > 0 
                       ? `#${Math.round(analytics.prompt_analytics.summary.avgPosition || analytics.prompt_analytics.summary.avg_position)}` 
                       : '—'}
                   </div>
                 )}
                 <div className="text-xs font-medium text-gray-600">Avg Position</div>
                 <div className="text-xs text-gray-500">{(analytics?.prompt_analytics?.summary?.avgPosition || analytics?.prompt_analytics?.summary?.avg_position || 0) > 0 ? 'Ordinal rank in responses' : 'Not mentioned'}</div>
               </div>
             </div>

             {/* Sentiment */}
             <div className="p-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-all duration-200">
               <div className="flex items-center justify-between mb-2">
                 <Activity className="h-4 w-4 text-gray-500" />
               </div>
               <div className="space-y-1">
                 {!analytics?.prompt_analytics && loading ? (
                   <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                 ) : (analytics?.prompt_analytics?.summary?.mentionCount || 0) > 0 ? (
                   (() => {
                     const rawSentiment = analytics?.prompt_analytics?.summary?.avgSentiment ?? analytics?.prompt_analytics?.summary?.avg_sentiment ?? 0
                     const sentiment10 = (rawSentiment + 1) * 5  // Convert -1..1 to 0-10 scale
                     return (
                       <>
                         <div className={`text-lg font-semibold ${
                           sentiment10 >= 7 ? 'text-green-600' : sentiment10 < 4 ? 'text-red-600' : 'text-gray-900'
                         }`}>
                           {sentiment10.toFixed(1)}<span className="text-sm font-normal text-gray-400">/10</span>
                         </div>
                         <div className="text-xs font-medium text-gray-600">Sentiment</div>
                         <div className="text-xs text-gray-500">
                           {sentiment10 >= 7 ? 'Positive' : sentiment10 < 4 ? 'Negative' : 'Neutral'}
                         </div>
                       </>
                     )
                   })()
                 ) : (
                   <>
                     <div className="text-lg font-semibold text-gray-400">—</div>
                     <div className="text-xs font-medium text-gray-600">Sentiment</div>
                     <div className="text-xs text-gray-500">Not mentioned</div>
                   </>
                 )}
               </div>
             </div>

             {/* Citations */}
             <div className="p-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-all duration-200">
               <div className="flex items-center justify-between mb-2">
                 <FileText className="h-4 w-4 text-gray-500" />
               </div>
               <div className="space-y-1">
                 {!analytics?.prompt_analytics && loading ? (
                   <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                 ) : (
                   <div className="text-lg font-semibold text-gray-900">{analytics?.prompt_analytics?.summary?.citationCount || citationRows.length || 0}</div>
                 )}
                 <div className="text-xs font-medium text-gray-600">Citations</div>
                 <div className="text-xs text-gray-500">Source references</div>
               </div>
             </div>
           </div>
         </CardContent>
       </Card>
       {/* Top metrics: SOV line chart and Industry ranking side-by-side */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
         <Card className="bg-white border border-gray-200 shadow-sm">
           <CardHeader className="pb-4">
             <div className="flex items-center gap-3">
               <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                 <TrendingUp className="h-4 w-4 text-gray-900" />
               </div>
               <div>
                 <CardTitle className="text-base font-semibold text-gray-900">Share of Voice Trend</CardTitle>
                 <CardDescription className="text-xs text-gray-500">Share of Voice over time for this prompt</CardDescription>
               </div>
             </div>
           </CardHeader>
           <CardContent>
             {sovSeries.length === 0 ? (
               <div className="text-center py-10 text-gray-500 text-sm">Not enough data to show trend</div>
             ) : (
               <div style={{ width: '100%', height: 280 }}>
                 <ResponsiveContainer>
                   <LineChart data={sovSeries}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                     <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
                     <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `${v}%`} />
                     <Tooltip 
                       contentStyle={{ 
                         backgroundColor: '#000', 
                         border: 'none', 
                         borderRadius: '6px',
                         fontSize: '12px'
                       }}
                       labelStyle={{ color: '#fff' }}
                       itemStyle={{ color: '#fff' }}
                       formatter={(value: number) => [`${value}%`, 'SOV']}
                     />
                     <Line type="monotone" dataKey="sov" stroke="#111827" strokeWidth={2} dot={{ r: 3, fill: '#111827' }} />
                   </LineChart>
                 </ResponsiveContainer>
               </div>
             )}
           </CardContent>
         </Card>

         <Card className="bg-white border border-gray-200 shadow-sm">
           <CardHeader className="pb-4">
             <div className="flex items-center gap-3">
               <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
                 <Trophy className="h-4 w-4 text-white" />
               </div>
               <div>
                 <CardTitle className="text-base font-semibold text-gray-900">Industry Ranking</CardTitle>
                 <CardDescription className="text-xs text-gray-500">Your brand vs top competitors for this prompt</CardDescription>
               </div>
             </div>
           </CardHeader>
           <CardContent className="pt-0">
             <div className="overflow-x-auto">
               <table className="w-full">
                 <thead>
                   <tr className="border-b border-gray-100">
                     <th className="text-left py-2 px-3 text-xs uppercase tracking-wide font-medium text-gray-500">Brand</th>
                     <th className="text-left py-2 px-3 text-xs uppercase tracking-wide font-medium text-gray-500">LVI</th>
                     <th className="text-left py-2 px-3 text-xs uppercase tracking-wide font-medium text-gray-500">Position</th>
                     <th className="text-left py-2 px-3 text-xs uppercase tracking-wide font-medium text-gray-500">Sentiment</th>
                   </tr>
                 </thead>
                 <tbody>
                   {industryRanking.length === 0 ? (
                     <tr>
                       <td colSpan={4} className="py-8 text-center text-gray-500">
                         <div className="flex flex-col items-center gap-2">
                           <Users className="h-6 w-6 text-gray-300" />
                           <p className="text-xs font-medium">No competitor data</p>
                         </div>
                       </td>
                     </tr>
                   ) : (
                     industryRanking.map((c: any, idx: number) => (
                       <tr key={`${c.name}-${idx}`} className={`hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${c.isPrimary ? 'bg-gray-50' : ''}`}>
                         <td className="py-2.5 px-3 text-sm font-medium text-gray-900">
                           <div className="flex items-center gap-2">
                             {c.name}
                             {c.isPrimary && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">You</Badge>}
                           </div>
                         </td>
                         <td className="py-2.5 px-3 text-sm text-gray-600">{typeof c.lvi === 'number' ? `${c.lvi.toFixed(1)}` : '—'}</td>
                         <td className="py-2.5 px-3 text-sm text-gray-600">{typeof c.avg_position === 'number' ? `#${Math.round(c.avg_position)}` : '—'}</td>
                         <td className="py-2.5 px-3 text-sm text-gray-600">{typeof c.avg_sentiment === 'number' ? (
                           (() => {
                             const s10 = (c.avg_sentiment + 1) * 5
                             return (
                               <span className={s10 >= 7 ? 'text-green-600' : s10 < 4 ? 'text-red-600' : ''}>
                                 {s10.toFixed(1)}/10
                               </span>
                             )
                           })()
                         ) : '—'}</td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
             </div>
           </CardContent>
         </Card>
       </div>

       {/* Lower layout: recent chats (left), citations & sources (right) */}
       {(promptResponses.length > 0 || citationRows.length > 0) && (
       <div className="flex flex-col lg:flex-row gap-6 items-stretch">
         {/* Recent Chats */}
         {promptResponses.length > 0 && (
         <div className={citationRows.length > 0 ? "lg:w-[55%]" : "w-full"}>
           <Card className="bg-white border border-gray-200 shadow-sm h-full">
             <CardHeader className="pb-4">
               <div className="flex items-center gap-3">
                 <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
                   <MessageSquare className="h-4 w-4 text-white" />
                 </div>
                 <div>
                   <CardTitle className="text-base font-semibold text-gray-900">Recent Chats</CardTitle>
                   <CardDescription className="text-xs text-gray-500">Responses matched to this prompt</CardDescription>
                 </div>
               </div>
             </CardHeader>
             <CardContent>
               {(() => {
                 const totalChatsPages = Math.ceil(promptResponses.length / CHATS_PER_PAGE)
                 const pagedChats = promptResponses.slice(chatsPage * CHATS_PER_PAGE, (chatsPage + 1) * CHATS_PER_PAGE)
                 return (
                   <>
                   <div className="overflow-x-auto">
                     <table className="w-full">
                       <thead>
                         <tr className="border-b border-gray-100">
                           <th className="text-left py-2 px-3 text-xs uppercase tracking-wide font-medium text-gray-500">Prompt</th>
                           <th className="text-left py-2 px-3 text-xs uppercase tracking-wide font-medium text-gray-500">Model</th>
                           <th className="text-left py-2 px-3 text-xs uppercase tracking-wide font-medium text-gray-500">Time</th>
                         </tr>
                       </thead>
                       <tbody>
                         {pagedChats.map((r: any) => (
                           <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer group" role="button" tabIndex={0}
                             onClick={() => router.push(`/dashboard/prompts/${promptId}/chats/${r.id}`)}
                             onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/dashboard/prompts/${promptId}/chats/${r.id}`) }}>
                             <td className="py-2.5 px-3">
                               <div className="flex items-start gap-2">
                                 <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-900 transition-colors mt-0.5 flex-shrink-0" />
                                 <div className="space-y-1 flex-1">
                                   <p className="text-sm font-medium text-gray-900 group-hover:text-gray-900 transition-colors line-clamp-1" title={r.prompt_text}>{r.prompt_text || r.prompt || '—'}</p>
                                   <p className="text-xs text-gray-500 line-clamp-2">{r.raw_response?.substring(0, 180) || ''}</p>
                                 </div>
                               </div>
                             </td>
                             <td className="py-2.5 px-3">
                               {(() => {
                                 const modelLabel = (r.model_name || r.model_provider || 'unknown').toString()
                                 const logoPath = getModelLogoPath(modelLabel)
                                 return (
                                   <img src={logoPath} alt={`${modelLabel} logo`} width={28} height={28} className="rounded bg-white border object-cover" />
                                 )
                               })()}
                             </td>
                             <td className="py-2.5 px-3 text-xs text-gray-500">{formatRelativeTime(r.created_at)}</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                   {totalChatsPages > 1 && (
                     <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                       <span className="text-xs text-gray-500">{chatsPage * CHATS_PER_PAGE + 1}–{Math.min((chatsPage + 1) * CHATS_PER_PAGE, promptResponses.length)} of {promptResponses.length}</span>
                       <div className="flex items-center gap-1">
                         <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={chatsPage === 0} onClick={() => setChatsPage(p => p - 1)}>
                           <ChevronLeft className="h-4 w-4" />
                         </Button>
                         <span className="text-xs text-gray-600 px-2">{chatsPage + 1}/{totalChatsPages}</span>
                         <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={chatsPage >= totalChatsPages - 1} onClick={() => setChatsPage(p => p + 1)}>
                           <ChevronRight className="h-4 w-4" />
                         </Button>
                       </div>
                     </div>
                   )}
                   </>
                 )
               })()}
             </CardContent>
           </Card>
         </div>
         )}

         {/* Citations & Sources - show which URLs each model cited */}
         {citationRows.length > 0 && (
         <div className={promptResponses.length > 0 ? "lg:w-[45%]" : "w-full"}>
           <Card className="bg-white border border-gray-200 shadow-sm h-full">
             <CardHeader className="pb-4">
               <div className="flex items-center gap-3">
                 <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
                   <FileText className="h-4 w-4 text-white" />
                 </div>
                 <div>
                   <CardTitle className="text-base font-semibold text-gray-900">Citations & Sources</CardTitle>
                   <CardDescription className="text-xs text-gray-500">{citationRows.length} sources cited across responses</CardDescription>
                 </div>
               </div>
             </CardHeader>
             <CardContent>
               {(() => {
                 const totalSourcesPages = Math.ceil(citationRows.length / SOURCES_PER_PAGE)
                 const pagedSources = citationRows.slice(sourcesPage * SOURCES_PER_PAGE, (sourcesPage + 1) * SOURCES_PER_PAGE)
                 return (
                   <>
                   <div className="space-y-0">
                     {pagedSources.map((s: any, idx: number) => (
                       <div key={`${s.domain}-${idx}`} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                         <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2">
                             <span className="text-xs font-medium text-gray-400 w-5 flex-shrink-0">#{s.best_rank}</span>
                             <div className="min-w-0 flex-1">
                               <p className="text-sm font-medium text-gray-900 truncate" title={s.page_title || s.domain}>{s.page_title || s.domain}</p>
                               {s.url ? (
                                 <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-gray-500 hover:text-gray-700 transition-colors truncate block">{s.domain}</a>
                               ) : (
                                 <span className="text-xs text-gray-500 truncate block">{s.domain}</span>
                               )}
                             </div>
                           </div>
                         </div>
                         <div className="flex items-center gap-2 flex-shrink-0">
                           <div className="flex -space-x-1.5">
                             {s.models.map((model: string) => (
                               <img
                                 key={model}
                                 src={getModelLogoPath(model)}
                                 alt={model}
                                 title={model}
                                 width={22}
                                 height={22}
                                 className="rounded-full bg-white border border-gray-200 object-cover"
                               />
                             ))}
                           </div>
                           <span className="text-xs text-gray-500 tabular-nums">{s.total_references}×</span>
                         </div>
                       </div>
                     ))}
                   </div>
                   {totalSourcesPages > 1 && (
                     <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                       <span className="text-xs text-gray-500">{sourcesPage * SOURCES_PER_PAGE + 1}–{Math.min((sourcesPage + 1) * SOURCES_PER_PAGE, citationRows.length)} of {citationRows.length}</span>
                       <div className="flex items-center gap-1">
                         <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={sourcesPage === 0} onClick={() => setSourcesPage(p => p - 1)}>
                           <ChevronLeft className="h-4 w-4" />
                         </Button>
                         <span className="text-xs text-gray-600 px-2">{sourcesPage + 1}/{totalSourcesPages}</span>
                         <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={sourcesPage >= totalSourcesPages - 1} onClick={() => setSourcesPage(p => p + 1)}>
                           <ChevronRight className="h-4 w-4" />
                         </Button>
                       </div>
                     </div>
                   )}
                   </>
                 )
               })()}
             </CardContent>
           </Card>
         </div>
         )}
       </div>
       )}
     </div>
    </>
   )
 }
