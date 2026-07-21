"use client"

import { useState, useEffect } from "react"
import {
  Loader2, Save, RefreshCw, Plus, Edit2, Trash2,
  Star, FileText, BarChart3, ChevronRight, Eye, Settings,
  Brain, Lightbulb, TrendingUp, Database,
  User, MessageSquareCode,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { OpenRouterModelSearch } from "@/components/admin/openrouter-model-search"
import { useToast } from "@/components/layout/notification-toast"

// ─── Types ──────────────────────────────────────────────────────────

interface ModelConfig {
  id?: string
  model_id: string
  name: string
  provider: string
  tier: string
  tiers: string[]
  openrouter_id: string
  description?: string
  max_tokens: number
  temperature: number
  supports_search: boolean
  supports_reasoning: boolean
  supports_citations: boolean
  rate_limit_rpm: number
  timeout_ms: number
  input_cost_per_million: number
  output_cost_per_million: number
  consumer_behavior: string
  is_active: boolean
  sort_order: number
  purpose: string
  is_default_onboarding: boolean
  fallback_priority: number | null
}

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
  updated_at?: string
}

// ─── Sections ───────────────────────────────────────────────────────

type SectionKey = 'overview' | 'insight_models' | 'content_models' | 'data_sources' | 'settings' | 'history'

interface SectionDef {
  key: SectionKey
  name: string
  icon: typeof Star
  color: string
  bg: string
  description: string
}

const SECTIONS: SectionDef[] = [
  { key: 'overview', name: 'Overview', icon: BarChart3, color: 'text-zinc-600', bg: 'bg-zinc-50', description: 'Agent status, knowledge base stats, and test generation.' },
  { key: 'insight_models', name: 'Insight Models', icon: Star, color: 'text-orange-600', bg: 'bg-orange-50', description: 'Models for analyzing LLM visibility metrics and Google Search Console data to generate actionable insights and recommendations.' },
  { key: 'content_models', name: 'Content Models', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50', description: 'Models for content generation — GSEO content, optimization recommendations, and brand-specific content guidance.' },
  { key: 'data_sources', name: 'Data Sources', icon: Database, color: 'text-blue-600', bg: 'bg-blue-50', description: 'Configure which data sources feed into the insight engine — LLM visibility data, Google Search Console, competitor analysis.' },
  { key: 'settings', name: 'Generation Settings', icon: Lightbulb, color: 'text-emerald-600', bg: 'bg-emerald-50', description: 'Configure insight generation parameters — frequency, depth, content types, and output formatting.' },
  { key: 'history', name: 'Recent Analyses', icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-50', description: 'View recent strategic analyses generated across all brands.' },
]

// ─── Default insight settings ───────────────────────────────────────

interface InsightSettings {
  auto_generate: boolean
  generation_frequency: 'daily' | 'weekly' | 'on_run_complete'
  max_insights_per_brand: number
  include_gsc_data: boolean
  include_visibility_data: boolean
  include_competitor_data: boolean
  content_types: string[]
  min_confidence_threshold: number
  lookback_days: number
}

const DEFAULT_INSIGHT_SETTINGS: InsightSettings = {
  auto_generate: true,
  generation_frequency: 'on_run_complete',
  max_insights_per_brand: 10,
  include_gsc_data: true,
  include_visibility_data: true,
  include_competitor_data: true,
  content_types: ['visibility_trend', 'keyword_opportunity', 'competitor_gap', 'content_recommendation'],
  min_confidence_threshold: 0.7,
  lookback_days: 30,
}

const CONTENT_TYPE_OPTIONS = [
  { value: 'visibility_trend', label: 'Visibility Trends', description: 'Track brand visibility changes over time' },
  { value: 'keyword_opportunity', label: 'Keyword Opportunities', description: 'Identify high-potential search queries' },
  { value: 'competitor_gap', label: 'Competitor Gaps', description: 'Find areas where competitors outperform' },
  { value: 'content_recommendation', label: 'Content Recommendations', description: 'Suggest content optimizations' },
  { value: 'sentiment_shift', label: 'Sentiment Shifts', description: 'Detect changes in brand perception' },
  { value: 'citation_analysis', label: 'Citation Analysis', description: 'Analyze source attribution patterns' },
]

// ─── Component ──────────────────────────────────────────────────────

export function InsightAgentConfig() {
  const { addToast } = useToast()

  // State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionKey>('overview')

  // Models
  const [insightModels, setInsightModels] = useState<ModelConfig[]>([])
  const [contentModels, setContentModels] = useState<ModelConfig[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editForm, setEditForm] = useState<Partial<ModelConfig>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [sheetPurpose, setSheetPurpose] = useState<'insights' | 'content'>('insights')

  // Settings
  const [settings, setSettings] = useState<InsightSettings>(DEFAULT_INSIGHT_SETTINGS)
  const [settingsChanged, setSettingsChanged] = useState(false)

  // Overview & History (connected to /api/admin/insights)
  const [overviewData, setOverviewData] = useState<{
    history: Array<{
      id: string; brand_id: string; brand_name: string; generation_type: string
      trigger_source: string; model_used: string; confidence_score: number
      tokens: number; created_at: string; executive_summary: string
      counts: { findings: number; opportunities: number; threats: number; content_recs: number }
    }>
    knowledge_stats: Array<{
      brand_id: string; brand_name: string; total_facts: number; verified_facts: number; categories: number
    }>
    brands: Array<{ id: string; name: string; industry: string | null }>
    total_analyses: number
    total_facts: number
  } | null>(null)
  const [testBrandId, setTestBrandId] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [extracting, setExtracting] = useState(false)

  // Load
  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    try {
      setLoading(true)
      const [modelsRes, overviewRes] = await Promise.all([
        fetch('/api/admin/config/models'),
        fetch('/api/admin/insights'),
      ])
      const modelsData = await modelsRes.json()

      if (modelsData.success) {
        const all = modelsData.data as ModelConfig[]
        setInsightModels(all.filter(m => (m.purpose || 'query_run') === 'insights'))
        setContentModels(all.filter(m => (m.purpose || 'query_run') === 'content'))
      }

      // Load overview data
      const overviewJson = await overviewRes.json()
      if (overviewJson.success) {
        setOverviewData(overviewJson.data)
        if (overviewJson.data.brands?.length > 0 && !testBrandId) {
          setTestBrandId(overviewJson.data.brands[0].id)
        }
      }

      // Load insight settings from feature flags
      try {
        const settingsRes = await fetch('/api/admin/config/feature-flags')
        const settingsData = await settingsRes.json()
        const flag = settingsData.flags?.find((f: { key: string }) => f.key === 'insight_agent_settings')
        if (flag?.value) {
          setSettings(prev => ({ ...prev, ...flag.value }))
        }
      } catch {
        // Use defaults
      }
    } catch (error) {
      console.error('Error loading insight agent config:', error)
      addToast({ type: "error", title: "Error", message: "Failed to load configuration" })
    } finally {
      setLoading(false)
    }
  }

  // ─ Test Generation ─
  const handleTestGenerate = async () => {
    if (!testBrandId) return
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_id: testBrandId, action: 'generate' }),
      })
      const result = await res.json()
      if (result.success) {
        addToast({ type: "success", title: "Generated", message: `Analysis complete: ${result.data.counts.findings} findings, ${result.data.counts.opportunities} opportunities` })
        loadAll() // Refresh history
      } else {
        addToast({ type: "error", title: "Failed", message: result.error || "Generation failed" })
      }
    } catch (error) {
      addToast({ type: "error", title: "Error", message: "Failed to generate analysis" })
    } finally {
      setGenerating(false)
    }
  }

  // ─ Extract Knowledge ─
  const handleExtractKnowledge = async () => {
    if (!testBrandId) return
    setExtracting(true)
    try {
      const res = await fetch('/api/admin/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_id: testBrandId, action: 'extract_knowledge' }),
      })
      const result = await res.json()
      if (result.success) {
        addToast({ type: "success", title: "Extracted", message: `${result.data.facts_created} facts extracted from brand profile` })
        loadAll()
      } else {
        addToast({ type: "error", title: "Failed", message: result.error || "Extraction failed" })
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to extract knowledge" })
    } finally {
      setExtracting(false)
    }
  }

  // ─ Model CRUD ─
  const handleSaveModel = async (model: Partial<ModelConfig>) => {
    try {
      setSaving(true)
      const method = model.id ? 'PUT' : 'POST'
      const res = await fetch('/api/admin/config/models', {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...model, purpose: sheetPurpose === 'insights' ? 'insights' : 'content' }),
      })
      const result = await res.json()
      if (result.success) {
        addToast({ type: "success", title: "Saved", message: model.id ? "Model updated" : "Model created" })
        setIsSheetOpen(false)
        setEditForm({})
        setEditingId(null)
        loadAll()
      } else {
        addToast({ type: "error", title: "Error", message: result.error || "Failed to save" })
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to save model" })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteModel = async (id: string) => {
    if (!confirm('Deactivate this model?')) return
    try {
      const res = await fetch(`/api/admin/config/models?id=${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) {
        addToast({ type: "success", title: "Removed", message: "Model deactivated" })
        loadAll()
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to remove model" })
    }
  }

  const openAddModel = (purpose: 'insights' | 'content') => {
    setSheetPurpose(purpose)
    setEditingId(null)
    setEditForm({
      model_id: '', name: '', provider: '', tier: 'growth', tiers: ['growth'],
      openrouter_id: '', description: '', max_tokens: 4000, temperature: 0.3,
      supports_search: false, supports_reasoning: true, supports_citations: false,
      rate_limit_rpm: 30, timeout_ms: 60000, input_cost_per_million: 0,
      output_cost_per_million: 0, consumer_behavior: 'analytical',
      is_active: true, sort_order: 0,
      purpose, is_default_onboarding: false, fallback_priority: null,
    })
    setIsSheetOpen(true)
  }

  const openEditModel = (model: ModelConfig, purpose: 'insights' | 'content') => {
    setSheetPurpose(purpose)
    setEditingId(model.id!)
    setEditForm(model)
    setIsSheetOpen(true)
  }

  // ─ Settings ─
  const updateSetting = <K extends keyof InsightSettings>(key: K, value: InsightSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setSettingsChanged(true)
  }

  const toggleContentType = (type: string) => {
    setSettings(prev => ({
      ...prev,
      content_types: prev.content_types.includes(type)
        ? prev.content_types.filter(t => t !== type)
        : [...prev.content_types, type],
    }))
    setSettingsChanged(true)
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/admin/config/feature-flags', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'insight_agent_settings',
          value: settings,
          description: 'Insight agent configuration (generation frequency, data sources, content types)',
        }),
      })
      const result = await res.json()
      if (result.flag) {
        addToast({ type: "success", title: "Saved", message: "Insight settings updated" })
        setSettingsChanged(false)
      } else {
        addToast({ type: "error", title: "Error", message: "Failed to save settings" })
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to save settings" })
    } finally {
      setSaving(false)
    }
  }

  // ─ Render ─
  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
  }

  const activeSectionDef = SECTIONS.find(s => s.key === activeSection)!
  const ActiveIcon = activeSectionDef.icon
  const activeInsightModels = insightModels.filter(m => m.is_active)
  const activeContentModels = contentModels.filter(m => m.is_active)

  const renderModelCards = (modelList: ModelConfig[], purpose: 'insights' | 'content') => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => openAddModel(purpose)} className="text-xs">
          <Plus className="h-3 w-3 mr-1.5" /> Add Model
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {modelList.sort((a, b) => a.sort_order - b.sort_order).map(model => (
          <Card key={model.id} className={!model.is_active ? 'opacity-50' : ''}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h4 className="text-sm font-medium text-zinc-900 truncate">{model.name}</h4>
                  <p className="text-[11px] text-zinc-400 font-mono truncate mt-0.5">{model.openrouter_id || model.model_id}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button onClick={() => openEditModel(model, purpose)} className="p-1 rounded hover:bg-zinc-100">
                    <Edit2 className="h-3 w-3 text-zinc-400" />
                  </button>
                  <button onClick={() => handleDeleteModel(model.id!)} className="p-1 rounded hover:bg-red-50">
                    <Trash2 className="h-3 w-3 text-zinc-400 hover:text-red-500" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-[11px]">
                <div><span className="text-zinc-400">Provider</span><p className="font-medium text-zinc-700 capitalize">{model.provider}</p></div>
                <div><span className="text-zinc-400">Tokens</span><p className="font-medium text-zinc-700">{model.max_tokens.toLocaleString()}</p></div>
                <div><span className="text-zinc-400">Temp</span><p className="font-medium text-zinc-700">{model.temperature}</p></div>
                <div><span className="text-zinc-400">Cost</span><p className="font-medium text-zinc-700">${model.input_cost_per_million}/M</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
        {modelList.length === 0 && (
          <div className="col-span-2 rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-400">
            No models configured. Click &ldquo;Add Model&rdquo; to add one.
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* ── Context Banner ── */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-zinc-900 p-2 shrink-0"><Lightbulb className="h-4 w-4 text-white" /></div>
          <div>
            <h3 className="font-medium text-zinc-900 text-sm">Insight Agent</h3>
            <p className="text-sm text-zinc-500 mt-1">
              Combines LLM visibility data with Google Search Console metrics to generate actionable insights,
              content recommendations, and competitive intelligence for each brand.
            </p>
            <div className="flex items-center gap-2 mt-3 text-xs text-zinc-400 flex-wrap">
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-zinc-600 bg-blue-50">
                <Database className="h-3 w-3 mr-1" /> Data Sources
              </span>
              <ChevronRight className="h-3 w-3 text-zinc-300" />
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-zinc-600 bg-orange-50">
                <Star className="h-3 w-3 mr-1" /> Analysis
                <span className="ml-1 font-medium text-zinc-900">{activeInsightModels.length}</span>
              </span>
              <ChevronRight className="h-3 w-3 text-zinc-300" />
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-zinc-600 bg-purple-50">
                <FileText className="h-3 w-3 mr-1" /> Content
                <span className="ml-1 font-medium text-zinc-900">{activeContentModels.length}</span>
              </span>
              <ChevronRight className="h-3 w-3 text-zinc-300" />
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-zinc-600 bg-emerald-50">
                <Lightbulb className="h-3 w-3 mr-1" /> Insights
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="flex gap-4">
        {/* Sidebar */}
        <div className="w-56 shrink-0 space-y-2 sticky top-4 self-start">
          {SECTIONS.map(section => {
            const SIcon = section.icon
            const isActive = activeSection === section.key
            return (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`w-full text-left rounded-lg border p-3 transition-all ${
                  isActive ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <SIcon className={`h-4 w-4 ${isActive ? 'text-white' : section.color}`} />
                  <span className="text-sm font-medium">{section.name}</span>
                </div>
                <div className={`text-[10px] mt-1 ${isActive ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {section.key === 'overview' && `${overviewData?.total_analyses ?? 0} analyses · ${overviewData?.total_facts ?? 0} facts`}
                  {section.key === 'insight_models' && `${activeInsightModels.length} model(s)`}
                  {section.key === 'content_models' && `${activeContentModels.length} model(s)`}
                  {section.key === 'data_sources' && `${[settings.include_gsc_data, settings.include_visibility_data, settings.include_competitor_data].filter(Boolean).length} active`}
                  {section.key === 'settings' && `${settings.generation_frequency} · ${settings.max_insights_per_brand} max`}
                  {section.key === 'history' && `${overviewData?.history?.length ?? 0} recent`}
                </div>
              </button>
            )
          })}
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={loadAll} disabled={loading} className="w-full text-xs">
              <RefreshCw className={`h-3 w-3 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="flex-1 space-y-6">
          {/* Section Header */}
          <div className="flex items-start gap-3">
            <div className={`rounded-md p-2 ${activeSectionDef.bg}`}>
              <ActiveIcon className={`h-4 w-4 ${activeSectionDef.color}`} />
            </div>
            <div>
              <h3 className="font-medium text-sm text-zinc-900">{activeSectionDef.name}</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-2xl leading-relaxed">{activeSectionDef.description}</p>
            </div>
          </div>

          {/* ═══ OVERVIEW ═══ */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={<Brain className="h-4 w-4" />} label="Total Analyses" value={`${overviewData?.total_analyses ?? 0}`} bg="bg-orange-50" fg="text-orange-600" />
                <StatCard icon={<Database className="h-4 w-4" />} label="Knowledge Facts" value={`${overviewData?.total_facts ?? 0}`} bg="bg-blue-50" fg="text-blue-600" />
                <StatCard icon={<Star className="h-4 w-4" />} label="Insight Models" value={`${activeInsightModels.length}`} bg="bg-purple-50" fg="text-purple-600" />
                <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Active Brands" value={`${overviewData?.brands?.length ?? 0}`} bg="bg-emerald-50" fg="text-emerald-600" />
              </div>

              {/* Test generation */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-orange-100 p-1.5"><Lightbulb className="h-3.5 w-3.5 text-orange-600" /></div>
                    <div>
                      <CardTitle className="text-sm">Test Generation</CardTitle>
                      <CardDescription className="text-xs">Trigger a strategic analysis or extract knowledge for a brand</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Select Brand</Label>
                    <Select value={testBrandId} onValueChange={setTestBrandId}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select a brand..." /></SelectTrigger>
                      <SelectContent>
                        {(overviewData?.brands || []).map(b => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name} {b.industry ? `(${b.industry})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleTestGenerate} disabled={generating || !testBrandId} size="sm" className="flex-1">
                      {generating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Brain className="h-3.5 w-3.5 mr-1.5" />}
                      Generate Analysis
                    </Button>
                    <Button onClick={handleExtractKnowledge} disabled={extracting || !testBrandId} size="sm" variant="outline" className="flex-1">
                      {extracting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Database className="h-3.5 w-3.5 mr-1.5" />}
                      Extract Knowledge
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Knowledge base stats */}
              {overviewData?.knowledge_stats && overviewData.knowledge_stats.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-blue-100 p-1.5"><Database className="h-3.5 w-3.5 text-blue-600" /></div>
                      <div>
                        <CardTitle className="text-sm">Knowledge Base</CardTitle>
                        <CardDescription className="text-xs">Brand facts extracted from profiles and competitors table</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {overviewData.knowledge_stats.map(ks => (
                        <div key={ks.brand_id} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-zinc-900">{ks.brand_name}</p>
                            <p className="text-[11px] text-zinc-400">{ks.categories} categories</p>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-zinc-500">{ks.total_facts} facts</span>
                            <Badge variant="secondary" className={ks.verified_facts > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-zinc-100 text-zinc-500'}>
                              {ks.verified_facts} verified
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent analyses preview */}
              {overviewData?.history && overviewData.history.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-md bg-indigo-100 p-1.5"><Eye className="h-3.5 w-3.5 text-indigo-600" /></div>
                        <div>
                          <CardTitle className="text-sm">Latest Analyses</CardTitle>
                          <CardDescription className="text-xs">Most recent 5 strategic analyses</CardDescription>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setActiveSection('history')} className="text-xs">
                        View All →
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {overviewData.history.slice(0, 5).map(h => (
                        <div key={h.id} className="rounded-lg border border-zinc-100 p-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-zinc-900">{h.brand_name}</span>
                              <Badge variant="secondary" className="text-[10px]">{h.trigger_source}</Badge>
                            </div>
                            <span className="text-[10px] text-zinc-400">{new Date(h.created_at).toLocaleDateString()} {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-xs text-zinc-500 line-clamp-2">{h.executive_summary}</p>
                          <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                            <span>{h.counts.findings} findings</span>
                            <span>{h.counts.opportunities} opportunities</span>
                            <span>{h.counts.threats} threats</span>
                            <span>{h.counts.content_recs} content recs</span>
                            <span className="ml-auto font-mono">{h.tokens.toLocaleString()} tokens</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ═══ INSIGHT MODELS ═══ */}
          {activeSection === 'insight_models' && renderModelCards(insightModels, 'insights')}

          {/* ═══ CONTENT MODELS ═══ */}
          {activeSection === 'content_models' && renderModelCards(contentModels, 'content')}

          {/* ═══ DATA SOURCES ═══ */}
          {activeSection === 'data_sources' && (
            <div className="space-y-4">
              {/* Action bar */}
              <div className="flex items-center justify-end gap-2">
                {settingsChanged && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Unsaved changes</Badge>}
                <Button onClick={handleSaveSettings} disabled={saving || !settingsChanged} size="sm">
                  {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                  Save
                </Button>
              </div>

              <div className="space-y-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-md bg-blue-100 p-2"><TrendingUp className="h-4 w-4 text-blue-600" /></div>
                        <div>
                          <h4 className="text-sm font-medium text-zinc-900">LLM Visibility Data</h4>
                          <p className="text-xs text-zinc-500 mt-0.5">Brand mentions, sentiment, citations, and rankings from AI response analysis</p>
                        </div>
                      </div>
                      <Switch checked={settings.include_visibility_data} onCheckedChange={(v) => updateSetting('include_visibility_data', v)} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-md bg-green-100 p-2"><BarChart3 className="h-4 w-4 text-green-600" /></div>
                        <div>
                          <h4 className="text-sm font-medium text-zinc-900">Google Search Console</h4>
                          <p className="text-xs text-zinc-500 mt-0.5">Search queries, impressions, clicks, CTR, and position data from GSC</p>
                        </div>
                      </div>
                      <Switch checked={settings.include_gsc_data} onCheckedChange={(v) => updateSetting('include_gsc_data', v)} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-md bg-purple-100 p-2"><Eye className="h-4 w-4 text-purple-600" /></div>
                        <div>
                          <h4 className="text-sm font-medium text-zinc-900">Competitor Analysis</h4>
                          <p className="text-xs text-zinc-500 mt-0.5">Competitor visibility scores, mention frequency, and relative positioning</p>
                        </div>
                      </div>
                      <Switch checked={settings.include_competitor_data} onCheckedChange={(v) => updateSetting('include_competitor_data', v)} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ═══ SETTINGS ═══ */}
          {activeSection === 'settings' && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={<Lightbulb className="h-4 w-4" />} label="Frequency" value={settings.generation_frequency.replace('_', ' ')} bg="bg-emerald-50" fg="text-emerald-600" />
                <StatCard icon={<Star className="h-4 w-4" />} label="Max / Brand" value={`${settings.max_insights_per_brand}`} bg="bg-orange-50" fg="text-orange-600" />
                <StatCard icon={<Brain className="h-4 w-4" />} label="Confidence" value={`${settings.min_confidence_threshold}`} bg="bg-blue-50" fg="text-blue-600" />
                <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Lookback" value={`${settings.lookback_days}d`} bg="bg-purple-50" fg="text-purple-600" />
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-end gap-2">
                {settingsChanged && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Unsaved changes</Badge>}
                <Button onClick={handleSaveSettings} disabled={saving || !settingsChanged} size="sm">
                  {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                  Save Settings
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Generation Config */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-emerald-100 p-1.5"><Lightbulb className="h-3.5 w-3.5 text-emerald-600" /></div>
                      <div>
                        <CardTitle className="text-sm">Generation Config</CardTitle>
                        <CardDescription className="text-xs">When and how many insights to generate</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ToggleRow id="auto-gen" label="Auto-Generate" description="Automatically generate insights after each run" checked={settings.auto_generate} onChange={(v) => updateSetting('auto_generate', v)} />
                    <div className="space-y-1.5">
                      <Label className="text-sm">Frequency</Label>
                      <Select value={settings.generation_frequency} onValueChange={(v) => updateSetting('generation_frequency', v as InsightSettings['generation_frequency'])}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="on_run_complete">After Each Run</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm">Max per Brand</Label>
                        <Input type="number" min={1} max={50} value={settings.max_insights_per_brand} onChange={(e) => updateSetting('max_insights_per_brand', parseInt(e.target.value) || 10)} className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">Lookback (days)</Label>
                        <Input type="number" min={1} max={365} value={settings.lookback_days} onChange={(e) => updateSetting('lookback_days', parseInt(e.target.value) || 30)} className="h-9" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Min Confidence</Label>
                      <Input type="number" step={0.1} min={0} max={1} value={settings.min_confidence_threshold} onChange={(e) => updateSetting('min_confidence_threshold', parseFloat(e.target.value) || 0.7)} className="h-9" />
                      <p className="text-[10px] text-zinc-400">Only surface insights above this confidence threshold</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Content Types */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-orange-100 p-1.5"><Star className="h-3.5 w-3.5 text-orange-600" /></div>
                      <div>
                        <CardTitle className="text-sm">Insight Types</CardTitle>
                        <CardDescription className="text-xs">Which types of insights to generate</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {CONTENT_TYPE_OPTIONS.map(opt => (
                        <div key={opt.value} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                          <div className="min-w-0 mr-3">
                            <p className="text-sm font-medium text-zinc-900">{opt.label}</p>
                            <p className="text-[11px] text-zinc-400">{opt.description}</p>
                          </div>
                          <Switch
                            checked={settings.content_types.includes(opt.value)}
                            onCheckedChange={() => toggleContentType(opt.value)}
                            className="shrink-0"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ═══ HISTORY ═══ */}
          {activeSection === 'history' && (
            <div className="space-y-4">
              {overviewData?.history && overviewData.history.length > 0 ? (
                <div className="space-y-3">
                  {overviewData.history.map(h => (
                    <Card key={h.id}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-zinc-900">{h.brand_name}</span>
                            <Badge variant="secondary" className="text-[10px]">{h.trigger_source}</Badge>
                            <Badge variant="outline" className="text-[10px] font-mono">{h.model_used?.split('/').pop() || h.model_used}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                            <span>Confidence: {((h.confidence_score || 0) * 100).toFixed(0)}%</span>
                            <span>{new Date(h.created_at).toLocaleDateString()} {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-600 leading-relaxed">{h.executive_summary}</p>
                        <div className="flex items-center gap-4 text-[11px]">
                          <span className="text-zinc-500"><span className="font-medium text-zinc-700">{h.counts.findings}</span> findings</span>
                          <span className="text-zinc-500"><span className="font-medium text-zinc-700">{h.counts.opportunities}</span> opportunities</span>
                          <span className="text-zinc-500"><span className="font-medium text-zinc-700">{h.counts.threats}</span> threats</span>
                          <span className="text-zinc-500"><span className="font-medium text-zinc-700">{h.counts.content_recs}</span> content recs</span>
                          <span className="ml-auto text-zinc-400 font-mono">{h.tokens.toLocaleString()} tokens</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center">
                  <Eye className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500 font-medium">No analyses yet</p>
                  <p className="text-xs text-zinc-400 mt-1">Go to Overview and generate an analysis to get started.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ MODEL ADD/EDIT SHEET ═══ */}
      <Sheet open={isSheetOpen} onOpenChange={(open) => { if (!open) { setIsSheetOpen(false); setEditForm({}); setEditingId(null) } }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Model' : `Add ${sheetPurpose === 'insights' ? 'Insight' : 'Content'} Model`}</SheetTitle>
            <SheetDescription>Configure an LLM for {sheetPurpose === 'insights' ? 'generating insights' : 'content generation'}.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label className="text-sm">OpenRouter Model</Label>
              <OpenRouterModelSearch
                value={editForm.openrouter_id || ''}
                onChange={(modelId) => {
                  const provider = modelId.split('/')[0] || ''
                  const name = modelId.split('/').pop()?.replace(/-/g, ' ') || modelId
                  setEditForm(prev => ({
                    ...prev, openrouter_id: modelId, model_id: modelId, provider,
                    name: prev?.name || name,
                  }))
                }}
                placeholder="Search OpenRouter models..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Display Name</Label>
                <Input value={editForm.name || ''} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Provider</Label>
                <Input value={editForm.provider || ''} onChange={(e) => setEditForm(prev => ({ ...prev, provider: e.target.value }))} className="h-9" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Temperature</Label>
                <Input type="number" step={0.1} min={0} max={2} value={editForm.temperature ?? 0.3} onChange={(e) => setEditForm(prev => ({ ...prev, temperature: parseFloat(e.target.value) || 0 }))} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Max Tokens</Label>
                <Input type="number" step={500} min={500} max={16000} value={editForm.max_tokens ?? 4000} onChange={(e) => setEditForm(prev => ({ ...prev, max_tokens: parseInt(e.target.value) || 4000 }))} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Sort Order</Label>
                <Input type="number" min={0} value={editForm.sort_order ?? 0} onChange={(e) => setEditForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))} className="h-9" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Input Cost ($/M)</Label>
                <Input type="number" step={0.01} min={0} value={editForm.input_cost_per_million ?? 0} onChange={(e) => setEditForm(prev => ({ ...prev, input_cost_per_million: parseFloat(e.target.value) || 0 }))} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Output Cost ($/M)</Label>
                <Input type="number" step={0.01} min={0} value={editForm.output_cost_per_million ?? 0} onChange={(e) => setEditForm(prev => ({ ...prev, output_cost_per_million: parseFloat(e.target.value) || 0 }))} className="h-9" />
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <ToggleRow id="edit-active" label="Active" description="Model available for use" checked={editForm.is_active ?? true} onChange={(v) => setEditForm(prev => ({ ...prev, is_active: v }))} />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => { setIsSheetOpen(false); setEditForm({}); setEditingId(null) }} className="flex-1">Cancel</Button>
              <Button onClick={() => handleSaveModel(editForm)} disabled={saving || !editForm.openrouter_id} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                {editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ─── Shared sub-components ──────────────────────────────────────────

function StatCard({ icon, label, value, bg, fg }: { icon: React.ReactNode; label: string; value: string; bg: string; fg: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className={`rounded-md p-1 ${bg} ${fg}`}>{icon}</div>
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-semibold text-zinc-900 truncate">{value}</p>
    </div>
  )
}

function ToggleRow({ id, label, description, checked, onChange }: {
  id: string; label: string; description: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
        <p className="text-[11px] text-zinc-400 mt-0.5">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} className="shrink-0" />
    </div>
  )
}
