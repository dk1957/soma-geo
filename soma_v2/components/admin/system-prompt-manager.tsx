"use client"

import { useState, useEffect } from "react"
import { Save, Loader2, RefreshCw, Copy, Eye, FileText, Sparkles, Search, Zap, Brain, User, Settings, Activity, BarChart3, MessageSquare } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/layout/notification-toast"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// ─── Types ──────────────────────────────────────────────────────────

interface SystemPromptConfig {
  id?: string
  prompt_type: string
  role: 'system' | 'user'
  name: string
  description: string
  content: string
  variables: string[]
  is_active: boolean
  version: number
  created_at?: string
  updated_at?: string
}

type PromptCategory = 'query_run' | 'prompt_generation' | 'brand_research' | 'analysis_agents'

// ─── Category Metadata ──────────────────────────────────────────────

const CATEGORY_META: Record<PromptCategory, {
  label: string
  icon: typeof FileText
  color: string
  bg: string
  description: string
}> = {
  query_run: {
    label: 'Run (Response Query)',
    icon: Zap,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    description: 'Controls how consumer-facing AI models respond during query simulation runs.'
  },
  prompt_generation: {
    label: 'Prompt Generation',
    icon: Sparkles,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    description: 'Generates and scores the consumer search queries used to test brand visibility across AI platforms.'
  },
  brand_research: {
    label: 'Brand Research',
    icon: Search,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    description: 'Researches and classifies brands for context enrichment.'
  },
  analysis_agents: {
    label: 'Analysis Agents (ARIA)',
    icon: Activity,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    description: 'System prompts for the ARIA analysis pipeline sub-agents — brand detection, sentiment analysis, citation extraction, and topic extraction.'
  },
}

// ─── Prompt Type → Category Mapping ─────────────────────────────────

const PROMPT_TYPE_META: Record<string, {
  label: string
  description: string
  icon: typeof FileText
  color: string
  bg: string
  category: PromptCategory
}> = {
  query_run: {
    label: 'Run (Response Query)',
    description: 'Instructs LLMs how to respond as their consumer-facing versions during query simulation runs.',
    icon: Zap,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    category: 'query_run',
  },
  prompt_generation: {
    label: 'Prompt Generation',
    description: 'Generates realistic consumer search queries across all flows (onboarding, dashboard, scheduled runs).',
    icon: Sparkles,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    category: 'prompt_generation',
  },
  prompt_scoring: {
    label: 'Prompt Scoring',
    description: 'Scores generated queries on intent strength, naturalness, market relevance, and conversion potential.',
    icon: Brain,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    category: 'prompt_generation',
  },
  brand_intelligence: {
    label: 'Brand Intelligence',
    description: 'Classifies brand industry, sector, business model, and competitive landscape.',
    icon: Search,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    category: 'brand_research',
  },
  analysis_brand_detector: {
    label: 'Brand Detector',
    description: 'Detects explicit and implicit brand mentions in LLM responses. Classifies mention type, position prominence, and primary recommendations.',
    icon: Search,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    category: 'analysis_agents',
  },
  analysis_sentiment: {
    label: 'Sentiment Analyzer',
    description: 'Analyzes sentiment per brand in response text. Scores sentiment, identifies driving signals, and classifies overall response tone.',
    icon: MessageSquare,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    category: 'analysis_agents',
  },
  analysis_citation: {
    label: 'Citation Extractor',
    description: 'Extracts and classifies all citations, URLs, and source references from AI-generated responses. Determines which brands benefit from each citation.',
    icon: FileText,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    category: 'analysis_agents',
  },
  analysis_topic: {
    label: 'Topic Extractor',
    description: 'Extracts key semantic topics, themes, and categories from responses. Identifies primary user intent and assigns relevance/sentiment scores.',
    icon: BarChart3,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    category: 'analysis_agents',
  },
}

const CATEGORY_ORDER: PromptCategory[] = ['query_run', 'prompt_generation', 'brand_research', 'analysis_agents']

const PROMPT_ORDER = [
  'query_run',
  'prompt_generation', 'prompt_scoring',
  'brand_intelligence',
  'analysis_brand_detector', 'analysis_sentiment', 'analysis_citation', 'analysis_topic',
]

// ─── Default prompts for analysis agents (used as scaffold when not yet in DB) ──

const ANALYSIS_AGENT_DEFAULTS: Record<string, string> = {
  analysis_brand_detector: `You are a specialized brand detection analyst. Your task is to analyze AI-generated text responses and extract precise information about brand mentions.

INSTRUCTIONS:
1. Identify EVERY brand, company, or product name mentioned in the text.
2. For each brand, count exact mentions (including variations and abbreviations).
3. Rank brands by their order of first appearance (1 = first mentioned).
4. Determine if a brand is the primary/top recommendation.
5. Classify the overall response type.

RULES:
- Be case-insensitive but report exact capitalization from the text.
- Count each distinct mention separately (e.g., "Slack" and "Slack's" = 2 mentions).
- A brand is "primary recommendation" if it's presented as the top choice, #1 pick, or most recommended option.
- For "first_position": early = first third of text, middle = second third, late = final third.
- Include ALL brands from the provided brand list that are mentioned, plus any additional brands found.
- If a brand from the list is NOT mentioned, still include it with mentioned=false.

OUTPUT ACCURACY IS CRITICAL. This data feeds into business metrics.`,

  analysis_sentiment: `You are a specialized sentiment analysis agent for brand perception in AI-generated responses.

INSTRUCTIONS:
1. For each mentioned brand, determine sentiment from the surrounding context.
2. Score sentiment on a -1.0 to 1.0 scale with precision to 2 decimal places.
3. Identify the top 5 words/phrases that drive the sentiment for each brand.
4. Classify overall response tone.

SCORING GUIDE:
- 1.0: Extremely positive ("best-in-class", "industry leader", "highly recommended")
- 0.5: Moderately positive ("good option", "solid choice", "well-regarded")
- 0.0: Neutral (factual mention without opinion)
- -0.5: Moderately negative ("has limitations", "not the best", "could improve")
- -1.0: Extremely negative ("avoid", "poor quality", "worst option")

RULES:
- Only analyze brands that are actually mentioned in the text.
- Sentiment signals should be exact words/phrases from the text.
- Consider the CONTEXT of the mention, not just adjacent words.
- A brand listed as "#1" with positive framing = very_positive.
- A brand mentioned as "an alternative" = neutral.
- A brand mentioned with caveats = negative or neutral depending on severity.
- Be precise and consistent. This data drives business analytics.`,

  analysis_citation: `You are a specialized citation and source extraction agent. Your task is to identify every external source, URL, link, and reference in AI-generated text.

INSTRUCTIONS:
1. Extract ALL URLs (full and partial), domains, numbered references, and inline citations.
2. For each citation, determine the domain name (strip www. prefix).
3. Classify each source type based on domain and context.
4. Determine which brand (if any) benefits from each citation.
5. Maintain citation order as they appear in the text.

SOURCE TYPE CLASSIFICATION:
- "owned": The primary brand's own website/property
- "competitor": A competitor's website/property
- "news": Major news outlets (reuters, bbc, cnn, techcrunch, etc.)
- "research": Academic/research (arxiv, scholar.google, nature.com, etc.)
- "government": Government sites (.gov domains)
- "academic": Academic institutions (.edu, .ac. domains)
- "ugc": User-generated content (reddit, quora, stackoverflow, etc.)
- "earned": Third-party mentions, blogs, review sites not owned by any tracked brand
- "directory": Business directories (g2, capterra, yelp, etc.)
- "social": Social media platforms (twitter, linkedin, facebook)

CONTENT CATEGORY:
- Classify based on URL path and context (blog, review, news, product, research, social, forum, directory, documentation, other)

RULES:
- Extract EVERY URL, even if malformed or partial.
- For markdown links [text](url), the text is the anchor_text.
- For numbered references (e.g., "[1]", "1."), map to URLs if listed at the end.
- If a source appears multiple times, set times_referenced accordingly.
- Domain should be lowercase, no "www." prefix.
- benefits_brand should be null for neutral/general sources.`,

  analysis_topic: `You are a specialized topic and theme extraction agent. Your task is to identify the key SEMANTIC TOPICS, themes, and subject areas discussed in AI-generated text responses.

CRITICAL RULE — BRANDS ARE NOT TOPICS:
- NEVER extract brand names, company names, product names, or service names as topics.
- Instead, extract the THEMES being discussed ABOUT those brands: "Transfer Speed", "Fee Comparison", "Mobile Money Integration", "Market Coverage".
- If a brand is excluded below, do NOT include it or any variation of its name as a topic.

INSTRUCTIONS:
1. Extract up to 15 key semantic topics/themes from the response.
2. Order topics by relevance (most important first).
3. Assign each topic a relevance score (0.0-1.0) based on how central it is to the response.
4. Assign each topic a sentiment score (-1.0 to 1.0) based on how it's discussed.
5. Categorize each topic into one of the predefined categories.
6. Identify the primary user intent the response addresses.

TOPIC QUALITY RULES:
- Topics should be concise (2-5 words) and meaningful.
- Topics must describe CONCEPTS, THEMES, or ATTRIBUTES — not entities/brands.
- No single-word topics unless they're specific technical terms.
- No generic words like "introduction", "conclusion", "summary".
- Capitalize first letter of each word (title case).
- Merge similar/overlapping topics into one.

RELEVANCE SCORING:
- 1.0: The central topic of the entire response
- 0.7-0.9: Major topics that receive significant coverage
- 0.4-0.6: Supporting topics mentioned multiple times
- 0.1-0.3: Minor topics mentioned briefly

CATEGORY ASSIGNMENTS:
Use one of: pricing, features, security, performance, support, market, reputation, use_case, onboarding, compliance, integration, scalability, user_experience, other

Be precise and consistent. This data drives trend analysis.`,
}

// ─── Component ──────────────────────────────────────────────────────

export function SystemPromptManager() {
  const { addToast } = useToast()
  const [prompts, setPrompts] = useState<SystemPromptConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeType, setActiveType] = useState<string>('query_run')
  const [activeRole, setActiveRole] = useState<'system' | 'user'>('system')

  useEffect(() => { loadPrompts() }, [])

  const loadPrompts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/config/system-prompts')
      const result = await response.json()
      if (result.success && result.data?.length > 0) {
        setPrompts(result.data as SystemPromptConfig[])
      }
    } catch (error) {
      console.error('Error loading system prompts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (promptType: string, role: 'system' | 'user') => {
    // Find prompt in local state, or use the scaffold activePrompt for new analysis agent prompts
    let prompt = prompts.find(p => p.prompt_type === promptType && p.role === role)
    if (!prompt && activePrompt && activePrompt.prompt_type === promptType && activePrompt.role === role) {
      prompt = activePrompt
    }
    if (!prompt) return
    try {
      setSaving(true)
      const response = await fetch('/api/admin/config/system-prompts', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prompt)
      })
      const result = await response.json()
      if (result.success) {
        addToast({ type: "success", title: "Saved", message: `${prompt.name} updated` })
        loadPrompts()
      } else {
        addToast({ type: "error", title: "Error", message: result.error || "Failed to save prompt" })
      }
    } catch (error) {
      console.error('Error saving prompt:', error)
      addToast({ type: "error", title: "Error", message: "Failed to save prompt" })
    } finally {
      setSaving(false)
    }
  }

  const updatePromptContent = (promptType: string, role: 'system' | 'user', content: string) => {
    const exists = prompts.some(p => p.prompt_type === promptType && p.role === role)
    if (exists) {
      setPrompts(prev => prev.map(p =>
        p.prompt_type === promptType && p.role === role ? { ...p, content, version: (p.version || 1) + 1 } : p
      ))
    } else {
      // Scaffold prompt being edited for the first time — add to local state
      const meta = PROMPT_TYPE_META[promptType]
      setPrompts(prev => [...prev, {
        prompt_type: promptType,
        role,
        name: meta?.label || promptType,
        description: meta?.description || '',
        content,
        variables: [],
        is_active: true,
        version: 1,
      }])
    }
  }

  const togglePromptActive = (promptType: string, role: 'system' | 'user') => {
    setPrompts(prev => prev.map(p =>
      p.prompt_type === promptType && p.role === role ? { ...p, is_active: !p.is_active } : p
    ))
  }

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
    addToast({ type: "success", title: "Copied", message: "Prompt copied to clipboard" })
  }

  const activePrompt = prompts.find(p => p.prompt_type === activeType && p.role === activeRole)
    // For analysis agent types not yet in DB, create a scaffold so the admin can edit + save to initialize
    || (PROMPT_TYPE_META[activeType]?.category === 'analysis_agents' && activeRole === 'system'
      ? {
          prompt_type: activeType,
          role: 'system' as const,
          name: PROMPT_TYPE_META[activeType].label,
          description: PROMPT_TYPE_META[activeType].description,
          content: ANALYSIS_AGENT_DEFAULTS[activeType] || '',
          variables: [],
          is_active: true,
          version: 1,
        }
      : undefined)
  const activeTypeMeta = PROMPT_TYPE_META[activeType]
  const userPromptExists = activeType !== 'query_run' && prompts.some(p => p.prompt_type === activeType && p.role === 'user')

  // Get unique prompt_types in a category — show all defined types (including those not yet saved to DB)
  const promptTypesByCategory = (cat: PromptCategory) => {
    const seen = new Set<string>()
    return PROMPT_ORDER
      .filter(type => PROMPT_TYPE_META[type]?.category === cat)
      .filter(type => {
        if (seen.has(type)) return false
        seen.add(type)
        return true
      })
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
  }

  return (
    <div className="space-y-6">
      {/* Context Banner */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-zinc-900 p-2 shrink-0"><Eye className="h-4 w-4 text-white" /></div>
          <div>
            <h3 className="font-medium text-zinc-900 text-sm">System & User Prompts</h3>
            <p className="text-sm text-zinc-500 mt-1">
              Every AI action uses prompts from this config — no prompts are hardcoded in the codebase. Each action has a <span className="font-medium text-zinc-700">system prompt</span> (LLM behavior instructions) and optionally a <span className="font-medium text-zinc-700">user prompt</span> (template with variable placeholders filled at runtime).
            </p>
            <div className="flex items-center gap-2 mt-3 text-xs text-zinc-400 flex-wrap">
              {CATEGORY_ORDER.map((cat, i) => {
                const meta = CATEGORY_META[cat]
                const count = promptTypesByCategory(cat).length
                if (count === 0) return null
                return (
                  <span key={cat} className="flex items-center gap-1">
                    {i > 0 && <span className="text-zinc-300 mr-1">·</span>}
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-zinc-600 ${meta.bg}`}>
                      {meta.label} <span className="ml-1 font-medium text-zinc-900">{count}</span>
                    </span>
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-side layout: sidebar + editor */}
      <div className="flex gap-4">
        {/* Left sidebar — full-height, scrollable */}
        <div className="w-56 shrink-0 space-y-3 sticky top-4 self-start overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {CATEGORY_ORDER.map(cat => {
            const catMeta = CATEGORY_META[cat]
            const types = promptTypesByCategory(cat)
            const CatIcon = catMeta.icon
            if (types.length === 0) return null

            return (
              <div key={cat}>
                <div className="flex items-center gap-1.5 mb-1.5 px-1">
                  <CatIcon className={`h-3 w-3 ${catMeta.color}`} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{catMeta.label}</span>
                </div>
                <div className="space-y-1">
                  {types.map(type => {
                    const meta = PROMPT_TYPE_META[type]
                    if (!meta) return null
                    const isActive = activeType === type
                    const hasUser = type !== 'query_run' && prompts.some(p => p.prompt_type === type && p.role === 'user')
                    const inDb = prompts.some(p => p.prompt_type === type)

                    return (
                      <button
                        key={type}
                        onClick={() => { setActiveType(type); setActiveRole('system') }}
                        className={`w-full text-left rounded-lg border p-2 transition-all ${
                          isActive
                            ? 'border-zinc-900 bg-zinc-900 text-white'
                            : 'border-zinc-200 bg-white hover:border-zinc-300'
                        }`}
                      >
                        <div className="text-xs font-medium truncate">{meta.label}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Badge variant={isActive ? "outline" : "secondary"} className={`text-[9px] px-1 py-0 ${isActive ? 'border-zinc-600 text-zinc-300' : ''}`}>
                            <Settings className="h-2.5 w-2.5 mr-0.5" />sys
                          </Badge>
                          {hasUser && (
                            <Badge variant={isActive ? "outline" : "secondary"} className={`text-[9px] px-1 py-0 ${isActive ? 'border-zinc-600 text-zinc-300' : ''}`}>
                              <User className="h-2.5 w-2.5 mr-0.5" />usr
                            </Badge>
                          )}
                          {!inDb && (
                            <Badge variant={isActive ? "outline" : "secondary"} className={`text-[9px] px-1 py-0 ${isActive ? 'border-amber-500 text-amber-300' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                              new
                            </Badge>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={loadPrompts} disabled={loading} className="w-full text-xs">
              <RefreshCw className={`h-3 w-3 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Right editor panel */}
        {activeTypeMeta && (
          <div className="flex-1 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`rounded-md p-2 ${activeTypeMeta.bg}`}>
                  <activeTypeMeta.icon className={`h-4 w-4 ${activeTypeMeta.color}`} />
                </div>
                <div>
                  <h3 className="font-medium text-sm text-zinc-900">{activeTypeMeta.label}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5 max-w-lg">{activeTypeMeta.description}</p>
                </div>
              </div>
            </div>

            {/* Role Tabs (system / user) */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveRole('system')}
                className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-all ${
                  activeRole === 'system'
                    ? 'border-zinc-900 bg-zinc-900 text-white'
                    : 'border-zinc-200 hover:border-zinc-300 text-zinc-600'
                }`}
              >
                <Settings className="h-3 w-3" />
                System Prompt
              </button>
              {userPromptExists && (
                <button
                  onClick={() => setActiveRole('user')}
                  className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-all ${
                    activeRole === 'user'
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-200 hover:border-zinc-300 text-zinc-600'
                  }`}
                >
                  <User className="h-3 w-3" />
                  User Prompt
                </button>
              )}
              {!userPromptExists && (
                <span className="flex items-center gap-1 text-[10px] text-zinc-400 px-2">
                  <User className="h-3 w-3" /> No user prompt (query is dynamic)
                </span>
              )}
            </div>

            {/* Editor Card */}
            {activePrompt ? (
              <Card>
                <CardContent className="p-5 space-y-4">
                  {/* Meta row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={`text-[10px] py-0 ${activeRole === 'system' ? 'bg-zinc-100' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        {activeRole === 'system' ? 'System' : 'User'} Prompt
                      </Badge>
                      <span className="text-xs text-zinc-400">{activePrompt.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="active-toggle" className="text-xs text-zinc-500">Active</Label>
                        <Switch id="active-toggle" checked={activePrompt.is_active} onCheckedChange={() => togglePromptActive(activePrompt.prompt_type, activeRole)} />
                      </div>
                      <Badge variant="outline" className="text-[10px]">v{activePrompt.version || 1}</Badge>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-zinc-500">{activePrompt.description}</p>

                  {/* Variables */}
                  {activePrompt.variables && activePrompt.variables.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] text-zinc-400 uppercase tracking-wide font-medium">Variables</span>
                      {activePrompt.variables.map(v => (
                        <Badge key={v} variant="secondary" className="text-[10px] font-mono py-0">{`{${v}}`}</Badge>
                      ))}
                    </div>
                  )}

                  {/* Editor */}
                  <div className="relative">
                    <Textarea
                      value={activePrompt.content}
                      onChange={(e) => updatePromptContent(activePrompt.prompt_type, activeRole, e.target.value)}
                      className="font-mono text-xs min-h-[400px] resize-y"
                      placeholder={`Enter ${activeRole} prompt...`}
                    />
                    <div className="absolute top-2 right-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyToClipboard(activePrompt.content)}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-4 text-[11px] text-zinc-400">
                      <span>{activePrompt.content.length.toLocaleString()} chars</span>
                      <span>~{Math.ceil(activePrompt.content.length / 4).toLocaleString()} tokens</span>
                      {activePrompt.updated_at && (
                        <span>Updated {new Date(activePrompt.updated_at).toLocaleDateString()}</span>
                      )}
                    </div>
                    <Button onClick={() => handleSave(activePrompt.prompt_type, activeRole)} disabled={saving} size="sm">
                      {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-10 text-center text-zinc-400 text-sm">
                  No {activeRole} prompt configured for this action.
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
