"use client"

import { useState, useEffect } from "react"
import {
  Loader2, Save, RefreshCw, Plus, Edit2, Trash2, X, Check,
  Zap, Globe, Cpu, MessageSquareCode, DollarSign, SlidersHorizontal,
  ChevronRight, Eye, Settings, AlertCircle, Search, Star,
  Gauge, Timer, Clock, ShieldCheck, RotateCcw, AlertTriangle,
  Info,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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

interface WebSearchConfig {
  id?: string
  model_id: string
  provider: string
  web_search_enabled: boolean
  search_engine: 'auto' | 'native' | 'exa'
  max_results: number
  search_context_size: 'low' | 'medium' | 'high'
  use_online_suffix: boolean
  use_responses_api: boolean
  custom_search_prompt: string | null
  is_active: boolean
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

interface RunSettings {
  concurrency_limit: number
  timeout_ms: number
  max_retries: number
  retry_delay_ms: number
  default_temperature: number
  default_max_tokens: number
  fallback_enabled: boolean
  rate_limit_enabled: boolean
  requests_per_minute: number
  max_cost_per_run: number
  daily_cost_limit: number
  auto_analysis_enabled: boolean
  longitudinal_analysis_enabled: boolean
  deduplication_window_hours: number
  force_rerun_allowed: boolean
}

const DEFAULT_RUN_SETTINGS: RunSettings = {
  concurrency_limit: 6,
  timeout_ms: 120000,
  max_retries: 2,
  retry_delay_ms: 1000,
  default_temperature: 0.2,
  default_max_tokens: 2000,
  fallback_enabled: false,
  rate_limit_enabled: true,
  requests_per_minute: 60,
  max_cost_per_run: 1.0,
  daily_cost_limit: 50.0,
  auto_analysis_enabled: true,
  longitudinal_analysis_enabled: true,
  deduplication_window_hours: 24,
  force_rerun_allowed: true,
}

// ─── Sections ───────────────────────────────────────────────────────

type SectionKey = 'models' | 'prompts' | 'execution' | 'analysis'

interface SectionDef {
  key: SectionKey
  name: string
  icon: typeof Cpu
  color: string
  bg: string
  description: string
}

const SECTIONS: SectionDef[] = [
  { key: 'models', name: 'Consumer Models', icon: Cpu, color: 'text-blue-600', bg: 'bg-blue-50', description: 'Consumer-facing AI models (ChatGPT, Gemini, Claude, etc.) used for daily runs, onboarding, and sign-up simulations. Includes per-model web search configuration.' },
  { key: 'prompts', name: 'Response Prompts', icon: MessageSquareCode, color: 'text-amber-600', bg: 'bg-amber-50', description: 'System and user prompts that instruct consumer AI models how to respond during query simulation runs.' },
  { key: 'execution', name: 'Execution & Performance', icon: SlidersHorizontal, color: 'text-green-600', bg: 'bg-green-50', description: 'How fast, how many, and how reliably the simulation engine runs API calls per brand run.' },
  { key: 'analysis', name: 'Post-Run & Costs', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', description: 'Spending caps, rate limiting, and automated post-run analysis for brand mentions and sentiment.' },
]

// ─── Component ──────────────────────────────────────────────────────

export function QueryResponseConfig() {
  const { addToast } = useToast()

  // ─ State ─
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionKey>('models')

  // Models
  const [models, setModels] = useState<ModelConfig[]>([])
  const [webSearchConfigs, setWebSearchConfigs] = useState<WebSearchConfig[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editForm, setEditForm] = useState<Partial<ModelConfig>>({})
  const [editingId, setEditingId] = useState<string | null>(null)

  // Prompts
  const [prompts, setPrompts] = useState<SystemPromptConfig[]>([])
  const [promptRole, setPromptRole] = useState<'system' | 'user'>('system')

  // Run settings
  const [runSettings, setRunSettings] = useState<RunSettings>(DEFAULT_RUN_SETTINGS)
  const [runHasChanges, setRunHasChanges] = useState(false)

  // ─ Load all data ─
  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    try {
      setLoading(true)
      const [modelsRes, wsRes, promptsRes, runRes] = await Promise.all([
        fetch('/api/admin/config/models'),
        fetch('/api/admin/config/web-search'),
        fetch('/api/admin/config/system-prompts'),
        fetch('/api/admin/config/run'),
      ])
      const [modelsData, wsData, promptsData, runData] = await Promise.all([
        modelsRes.json(), wsRes.json(), promptsRes.json(), runRes.json(),
      ])
      if (modelsData.success) setModels(modelsData.data.filter((m: ModelConfig) => (m.purpose || 'query_run') === 'query_run'))
      if (wsData.success) setWebSearchConfigs(wsData.data || [])
      if (promptsData.success) setPrompts(promptsData.data.filter((p: SystemPromptConfig) => p.prompt_type === 'query_run'))
      if (runData.success && runData.data) setRunSettings({ ...DEFAULT_RUN_SETTINGS, ...runData.data })
    } catch (error) {
      console.error('Error loading query response config:', error)
      addToast({ type: "error", title: "Error", message: "Failed to load configuration" })
    } finally {
      setLoading(false)
    }
  }

  // ─ Model CRUD ─
  const handleSaveModel = async (model: Partial<ModelConfig>) => {
    try {
      setSaving(true)
      const method = model.id ? 'PUT' : 'POST'
      const response = await fetch('/api/admin/config/models', {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...model, purpose: 'query_run' }),
      })
      const result = await response.json()
      if (result.success) {
        addToast({ type: "success", title: "Saved", message: model.id ? "Model updated" : "Model created" })
        setIsSheetOpen(false)
        setEditForm({})
        setEditingId(null)
        loadAll()
      } else {
        addToast({ type: "error", title: "Error", message: result.error || "Failed to save model" })
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to save model" })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteModel = async (id: string) => {
    if (!confirm('Deactivate this model? It will be soft-deleted.')) return
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

  const openAddModel = () => {
    setEditingId(null)
    setEditForm({
      model_id: '', name: '', provider: '', tier: 'growth', tiers: ['growth'],
      openrouter_id: '', description: '', max_tokens: 4000, temperature: 0.0,
      supports_search: true, supports_reasoning: true, supports_citations: true,
      rate_limit_rpm: 30, timeout_ms: 30000, input_cost_per_million: 0,
      output_cost_per_million: 0, consumer_behavior: 'direct_and_factual',
      is_active: true, sort_order: models.length + 1,
      purpose: 'query_run', is_default_onboarding: false, fallback_priority: null,
    })
    setIsSheetOpen(true)
  }

  const openEditModel = (model: ModelConfig) => {
    setEditingId(model.id!)
    setEditForm(model)
    setIsSheetOpen(true)
  }

  // ─ Web Search ─
  const getWebSearchConfig = (modelId: string) => webSearchConfigs.find(c => c.model_id === modelId)

  const updateWebSearch = async (modelId: string, updates: Partial<WebSearchConfig>) => {
    const existing = getWebSearchConfig(modelId)
    const model = models.find(m => m.model_id === modelId)
    const config: WebSearchConfig = {
      model_id: modelId, provider: model?.provider || 'unknown',
      web_search_enabled: true, search_engine: 'auto', max_results: 5,
      search_context_size: 'medium', use_online_suffix: false, use_responses_api: true,
      custom_search_prompt: null, is_active: true,
      ...existing, ...updates,
    }
    try {
      const res = await fetch('/api/admin/config/web-search', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const result = await res.json()
      if (result.success) {
        setWebSearchConfigs(prev => {
          const exists = prev.some(c => c.model_id === modelId)
          return exists ? prev.map(c => c.model_id === modelId ? config : c) : [...prev, config]
        })
        addToast({ type: "success", title: "Saved", message: "Web search config updated" })
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to save web search config" })
    }
  }

  // ─ Prompts ─
  const activePrompt = prompts.find(p => p.prompt_type === 'query_run' && p.role === promptRole)

  const updatePromptContent = (content: string) => {
    const exists = prompts.some(p => p.prompt_type === 'query_run' && p.role === promptRole)
    if (exists) {
      setPrompts(prev => prev.map(p =>
        p.prompt_type === 'query_run' && p.role === promptRole ? { ...p, content, version: (p.version || 1) + 1 } : p
      ))
    } else {
      setPrompts(prev => [...prev, {
        prompt_type: 'query_run', role: promptRole,
        name: 'Query Run', description: 'Instructs LLMs how to respond during query simulation runs.',
        content, variables: [], is_active: true, version: 1,
      }])
    }
  }

  const handleSavePrompt = async () => {
    const prompt = prompts.find(p => p.prompt_type === 'query_run' && p.role === promptRole)
    if (!prompt) return
    try {
      setSaving(true)
      const res = await fetch('/api/admin/config/system-prompts', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prompt),
      })
      const result = await res.json()
      if (result.success) {
        addToast({ type: "success", title: "Saved", message: "Prompt updated" })
        loadAll()
      } else {
        addToast({ type: "error", title: "Error", message: result.error || "Failed to save prompt" })
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to save prompt" })
    } finally {
      setSaving(false)
    }
  }

  // ─ Run Settings ─
  const updateRunSetting = <K extends keyof RunSettings>(key: K, value: RunSettings[K]) => {
    setRunSettings(prev => ({ ...prev, [key]: value }))
    setRunHasChanges(true)
  }

  const handleSaveRunSettings = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/admin/config/run', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(runSettings),
      })
      const result = await res.json()
      if (result.success) {
        addToast({ type: "success", title: "Saved", message: "Execution settings updated" })
        setRunHasChanges(false)
      } else {
        addToast({ type: "error", title: "Error", message: result.error || "Failed to save settings" })
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
  const activeModels = models.filter(m => m.is_active).sort((a, b) => a.sort_order - b.sort_order)
  const defaultOnboarding = activeModels.find(m => m.is_default_onboarding)
  const webSearchEnabled = webSearchConfigs.filter(c => c.web_search_enabled).length

  return (
    <div className="space-y-6">
      {/* ── Context Banner ── */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-zinc-900 p-2 shrink-0"><Zap className="h-4 w-4 text-white" /></div>
          <div>
            <h3 className="font-medium text-zinc-900 text-sm">Query Response Pipeline</h3>
            <p className="text-sm text-zinc-500 mt-1">
              End-to-end configuration for the daily query simulation pipeline — from the consumer AI models that generate responses,
              to the execution engine that orchestrates API calls, to the cost controls that keep spending in check.
            </p>
            <div className="flex items-center gap-2 mt-3 text-xs text-zinc-400 flex-wrap">
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-zinc-600 bg-amber-50">Prompts</span>
              <ChevronRight className="h-3 w-3 text-zinc-300" />
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-zinc-600 bg-blue-50">
                Consumer Models <span className="ml-1 font-medium text-zinc-900">{activeModels.length}</span>
              </span>
              <ChevronRight className="h-3 w-3 text-zinc-300" />
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-zinc-600 bg-green-50">Execution Engine</span>
              <ChevronRight className="h-3 w-3 text-zinc-300" />
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-zinc-600 bg-emerald-50">Analysis</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Layout: sidebar + detail panel ── */}
      <div className="flex gap-4">
        {/* Left Sidebar */}
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
                  {section.key === 'models' && `${activeModels.length} active · ${webSearchEnabled} search`}
                  {section.key === 'prompts' && `${prompts.length} prompt(s)`}
                  {section.key === 'execution' && `${runSettings.concurrency_limit} parallel · ${runSettings.timeout_ms / 1000}s timeout`}
                  {section.key === 'analysis' && `$${runSettings.daily_cost_limit}/day cap`}
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

        {/* Right Detail Panel */}
        <div className="flex-1 space-y-6">
          {/* Section Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`rounded-md p-2 ${activeSectionDef.bg}`}>
                <ActiveIcon className={`h-4 w-4 ${activeSectionDef.color}`} />
              </div>
              <div>
                <h3 className="font-medium text-sm text-zinc-900">{activeSectionDef.name}</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-2xl leading-relaxed">{activeSectionDef.description}</p>
              </div>
            </div>
          </div>

          {/* ═══ MODELS SECTION ═══ */}
          {activeSection === 'models' && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={<Cpu className="h-4 w-4" />} label="Active" value={`${activeModels.length} models`} bg="bg-blue-50" fg="text-blue-600" />
                <StatCard icon={<Globe className="h-4 w-4" />} label="Web Search" value={`${webSearchEnabled} enabled`} bg="bg-cyan-50" fg="text-cyan-600" />
                <StatCard icon={<Star className="h-4 w-4" />} label="Onboarding Default" value={defaultOnboarding?.name || 'None'} bg="bg-amber-50" fg="text-amber-600" />
                <StatCard icon={<Search className="h-4 w-4" />} label="Providers" value={`${new Set(activeModels.map(m => m.provider)).size}`} bg="bg-purple-50" fg="text-purple-600" />
              </div>

              {/* Add button */}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={openAddModel} className="text-xs">
                  <Plus className="h-3 w-3 mr-1.5" /> Add Model
                </Button>
              </div>

              {/* Model Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {models.sort((a, b) => a.sort_order - b.sort_order).map(model => (
                  <Card key={model.id} className={!model.is_active ? 'opacity-50' : ''}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-zinc-900 truncate">{model.name}</h4>
                            {model.is_default_onboarding && (
                              <Badge className="text-[9px] py-0 bg-amber-100 text-amber-800 border-amber-200">Default</Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 font-mono truncate mt-0.5">{model.openrouter_id || model.model_id}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button onClick={() => openEditModel(model)} className="p-1 rounded hover:bg-zinc-100">
                            <Edit2 className="h-3 w-3 text-zinc-400" />
                          </button>
                          <button onClick={() => handleDeleteModel(model.id!)} className="p-1 rounded hover:bg-red-50">
                            <Trash2 className="h-3 w-3 text-zinc-400 hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-[11px]">
                        <div>
                          <span className="text-zinc-400">Provider</span>
                          <p className="font-medium text-zinc-700 capitalize">{model.provider}</p>
                        </div>
                        <div>
                          <span className="text-zinc-400">Tier</span>
                          <p className="font-medium text-zinc-700">{(model.tiers || [model.tier]).join(', ')}</p>
                        </div>
                        <div>
                          <span className="text-zinc-400">Tokens</span>
                          <p className="font-medium text-zinc-700">{model.max_tokens.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-zinc-400">Temp</span>
                          <p className="font-medium text-zinc-700">{model.temperature}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {model.supports_search && <Badge variant="outline" className="text-[9px] py-0">Search</Badge>}
                        {model.supports_reasoning && <Badge variant="outline" className="text-[9px] py-0">Reasoning</Badge>}
                        {model.supports_citations && <Badge variant="outline" className="text-[9px] py-0">Citations</Badge>}
                        <span className="text-[10px] text-zinc-400 ml-auto">
                          ${model.input_cost_per_million}/M in · ${model.output_cost_per_million}/M out
                        </span>
                      </div>
                      {/* Inline Web Search Config */}
                      {model.is_active && (() => {
                        const ws = getWebSearchConfig(model.model_id)
                        const enabled = ws?.web_search_enabled ?? false
                        return (
                          <div className="pt-3 border-t border-zinc-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Globe className={`h-3 w-3 ${enabled ? 'text-cyan-600' : 'text-zinc-300'}`} />
                                <span className="text-[11px] font-medium text-zinc-600">Web Search</span>
                              </div>
                              <Switch
                                checked={enabled}
                                onCheckedChange={(checked) => updateWebSearch(model.model_id, { web_search_enabled: checked })}
                                className="scale-75"
                              />
                            </div>
                            {enabled && (
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-2">
                                <div className="space-y-0.5">
                                  <Label className="text-[10px] text-zinc-400">Engine</Label>
                                  <Select value={ws?.search_engine || 'auto'} onValueChange={(v) => updateWebSearch(model.model_id, { search_engine: v as 'auto' | 'native' | 'exa' })}>
                                    <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="auto">Auto</SelectItem>
                                      <SelectItem value="native">Native</SelectItem>
                                      <SelectItem value="exa">Exa</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-0.5">
                                  <Label className="text-[10px] text-zinc-400">Results</Label>
                                  <Input type="number" min={1} max={10} value={ws?.max_results || 5}
                                    onChange={(e) => updateWebSearch(model.model_id, { max_results: parseInt(e.target.value) || 5 })}
                                    className="h-7 text-[11px]" />
                                </div>
                                <div className="space-y-0.5">
                                  <Label className="text-[10px] text-zinc-400">Context</Label>
                                  <Select value={ws?.search_context_size || 'medium'} onValueChange={(v) => updateWebSearch(model.model_id, { search_context_size: v as 'low' | 'medium' | 'high' })}>
                                    <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="low">Low</SelectItem>
                                      <SelectItem value="medium">Medium</SelectItem>
                                      <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex items-end pb-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <Switch checked={ws?.use_responses_api ?? true}
                                      onCheckedChange={(v) => updateWebSearch(model.model_id, { use_responses_api: v })}
                                      className="scale-[0.6]" />
                                    <span className="text-[10px] text-zinc-500">Responses API</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </CardContent>
                  </Card>
                ))}
                {models.length === 0 && (
                  <div className="col-span-2 rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-400">
                    No consumer models configured. Click &ldquo;Add Model&rdquo; to add one.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ PROMPTS SECTION ═══ */}
          {activeSection === 'prompts' && (
            <div className="space-y-4">
              {/* Role tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setPromptRole('system')}
                  className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-all ${
                    promptRole === 'system' ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 hover:border-zinc-300 text-zinc-600'
                  }`}
                >
                  <Settings className="h-3 w-3" /> System Prompt
                </button>
                <button
                  onClick={() => setPromptRole('user')}
                  className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-all ${
                    promptRole === 'user' ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 hover:border-zinc-300 text-zinc-600'
                  }`}
                >
                  <Eye className="h-3 w-3" /> User Prompt
                </button>
              </div>

              {/* Editor */}
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`text-[10px] py-0 ${promptRole === 'system' ? 'bg-zinc-100' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      {promptRole === 'system' ? 'System' : 'User'} Prompt
                    </Badge>
                    <div className="flex items-center gap-3">
                      {activePrompt && (
                        <>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-zinc-500">Active</Label>
                            <Switch checked={activePrompt.is_active} onCheckedChange={() => {
                              setPrompts(prev => prev.map(p =>
                                p.prompt_type === 'query_run' && p.role === promptRole ? { ...p, is_active: !p.is_active } : p
                              ))
                            }} />
                          </div>
                          <Badge variant="outline" className="text-[10px]">v{activePrompt.version || 1}</Badge>
                        </>
                      )}
                    </div>
                  </div>

                  {activePrompt?.variables && activePrompt.variables.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] text-zinc-400 uppercase tracking-wide font-medium">Variables</span>
                      {activePrompt.variables.map(v => (
                        <Badge key={v} variant="secondary" className="text-[10px] font-mono py-0">{`{${v}}`}</Badge>
                      ))}
                    </div>
                  )}

                  <Textarea
                    value={activePrompt?.content || ''}
                    onChange={(e) => updatePromptContent(e.target.value)}
                    className="font-mono text-xs min-h-[400px] resize-y"
                    placeholder={`Enter ${promptRole} prompt for query runs...`}
                  />

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-4 text-[11px] text-zinc-400">
                      <span>{(activePrompt?.content || '').length.toLocaleString()} chars</span>
                      <span>~{Math.ceil((activePrompt?.content || '').length / 4).toLocaleString()} tokens</span>
                      {activePrompt?.updated_at && <span>Updated {new Date(activePrompt.updated_at).toLocaleDateString()}</span>}
                    </div>
                    <Button onClick={handleSavePrompt} disabled={saving} size="sm">
                      {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                      Save Prompt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══ EXECUTION SECTION ═══ */}
          {activeSection === 'execution' && (
            <div className="space-y-4">
              {/* Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={<Gauge className="h-4 w-4" />} label="Concurrency" value={`${runSettings.concurrency_limit} parallel`} bg="bg-amber-50" fg="text-amber-600" />
                <StatCard icon={<Timer className="h-4 w-4" />} label="Timeout" value={`${runSettings.timeout_ms / 1000}s`} bg="bg-blue-50" fg="text-blue-600" />
                <StatCard icon={<Clock className="h-4 w-4" />} label="Max Retries" value={`${runSettings.max_retries}`} bg="bg-purple-50" fg="text-purple-600" />
                <StatCard icon={<AlertCircle className="h-4 w-4" />} label="Retry Delay" value={`${runSettings.retry_delay_ms}ms`} bg="bg-rose-50" fg="text-rose-600" />
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-end gap-2">
                {runHasChanges && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Unsaved changes</Badge>}
                <Button onClick={handleSaveRunSettings} disabled={saving || !runHasChanges} size="sm">
                  {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                  Save Settings
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Performance */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-amber-100 p-1.5"><Zap className="h-3.5 w-3.5 text-amber-600" /></div>
                      <div>
                        <CardTitle className="text-sm">Performance &amp; Reliability</CardTitle>
                        <CardDescription className="text-xs">API call concurrency and failure handling</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Concurrency Limit</Label>
                        <span className="text-sm font-medium text-zinc-700">{runSettings.concurrency_limit} parallel</span>
                      </div>
                      <Slider value={[runSettings.concurrency_limit]} onValueChange={(v: number[]) => updateRunSetting('concurrency_limit', v[0])} min={1} max={20} step={1} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Request Timeout</Label>
                        <span className="text-sm font-medium text-zinc-700">{runSettings.timeout_ms / 1000}s</span>
                      </div>
                      <Slider value={[runSettings.timeout_ms]} onValueChange={(v: number[]) => updateRunSetting('timeout_ms', v[0])} min={10000} max={300000} step={5000} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm">Max Retries</Label>
                        <Select value={String(runSettings.max_retries)} onValueChange={(v) => updateRunSetting('max_retries', Number(v))}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[0, 1, 2, 3, 5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">Retry Delay</Label>
                        <div className="relative">
                          <Input type="number" value={runSettings.retry_delay_ms} onChange={(e) => updateRunSetting('retry_delay_ms', Number(e.target.value))} min={100} max={10000} className="h-9 pr-10" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">ms</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Model Defaults */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-blue-100 p-1.5"><Info className="h-3.5 w-3.5 text-blue-600" /></div>
                      <div>
                        <CardTitle className="text-sm">Model Defaults</CardTitle>
                        <CardDescription className="text-xs">Fallback settings when not configured per-model</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Temperature</Label>
                        <span className="text-sm font-medium text-zinc-700">{runSettings.default_temperature}</span>
                      </div>
                      <Slider value={[runSettings.default_temperature]} onValueChange={(v: number[]) => updateRunSetting('default_temperature', v[0])} min={0} max={1} step={0.1} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Max Output Tokens</Label>
                        <span className="text-sm font-medium text-zinc-700">{runSettings.default_max_tokens.toLocaleString()}</span>
                      </div>
                      <Slider value={[runSettings.default_max_tokens]} onValueChange={(v: number[]) => updateRunSetting('default_max_tokens', v[0])} min={100} max={4000} step={100} />
                    </div>
                    <ToggleRow id="fallback" label="Model Fallbacks" description="Automatically try a backup model if the primary one fails" checked={runSettings.fallback_enabled} onChange={(v) => updateRunSetting('fallback_enabled', v)} />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ═══ ANALYSIS & COSTS SECTION ═══ */}
          {activeSection === 'analysis' && (
            <div className="space-y-4">
              {/* Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={<DollarSign className="h-4 w-4" />} label="Per-Run Cap" value={`$${runSettings.max_cost_per_run}`} bg="bg-green-50" fg="text-green-600" />
                <StatCard icon={<ShieldCheck className="h-4 w-4" />} label="Daily Cap" value={`$${runSettings.daily_cost_limit}`} bg="bg-emerald-50" fg="text-emerald-600" />
                <StatCard icon={<Clock className="h-4 w-4" />} label="Rate Limit" value={runSettings.rate_limit_enabled ? `${runSettings.requests_per_minute} rpm` : 'Off'} bg="bg-purple-50" fg="text-purple-600" />
                <StatCard icon={<AlertTriangle className="h-4 w-4" />} label="Dedup Window" value={`${runSettings.deduplication_window_hours}h`} bg="bg-orange-50" fg="text-orange-600" />
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-end gap-2">
                {runHasChanges && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Unsaved changes</Badge>}
                <Button onClick={handleSaveRunSettings} disabled={saving || !runHasChanges} size="sm">
                  {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                  Save Settings
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Rate Limits & Costs */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-green-100 p-1.5"><DollarSign className="h-3.5 w-3.5 text-green-600" /></div>
                      <div>
                        <CardTitle className="text-sm">Rate Limits &amp; Spending</CardTitle>
                        <CardDescription className="text-xs">Prevent rate limit errors and unexpected bills</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <ToggleRow id="rate-limit" label="Rate Limiting" description="Throttle API calls to stay within provider limits" checked={runSettings.rate_limit_enabled} onChange={(v) => updateRunSetting('rate_limit_enabled', v)} />
                    {runSettings.rate_limit_enabled && (
                      <div className="space-y-1.5">
                        <Label className="text-sm">Requests Per Minute</Label>
                        <div className="relative">
                          <Input type="number" value={runSettings.requests_per_minute} onChange={(e) => updateRunSetting('requests_per_minute', Number(e.target.value))} min={1} max={1000} className="h-9 pr-12" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">rpm</span>
                        </div>
                      </div>
                    )}
                    <div className="h-px bg-zinc-100" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm">Max Cost Per Run</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">$</span>
                          <Input type="number" value={runSettings.max_cost_per_run} onChange={(e) => updateRunSetting('max_cost_per_run', Number(e.target.value))} min={0.01} max={100} step={0.1} className="h-9 pl-7" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">Daily Limit</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">$</span>
                          <Input type="number" value={runSettings.daily_cost_limit} onChange={(e) => updateRunSetting('daily_cost_limit', Number(e.target.value))} min={1} max={1000} step={1} className="h-9 pl-7" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Post-Run Analysis */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-orange-100 p-1.5"><AlertTriangle className="h-3.5 w-3.5 text-orange-600" /></div>
                      <div>
                        <CardTitle className="text-sm">Post-Run Analysis</CardTitle>
                        <CardDescription className="text-xs">What happens after LLM responses come back</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <ToggleRow id="auto-analysis" label="Auto-Analysis" description="Automatically analyze responses for brand mentions and sentiment" checked={runSettings.auto_analysis_enabled} onChange={(v) => updateRunSetting('auto_analysis_enabled', v)} />
                    <ToggleRow id="longitudinal" label="Longitudinal Tracking" description="Track brand visibility changes between runs over time" checked={runSettings.longitudinal_analysis_enabled} onChange={(v) => updateRunSetting('longitudinal_analysis_enabled', v)} />
                    <div className="h-px bg-zinc-100" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm">Dedup Window</Label>
                        <div className="relative">
                          <Input type="number" value={runSettings.deduplication_window_hours} onChange={(e) => updateRunSetting('deduplication_window_hours', Number(e.target.value))} min={1} max={168} className="h-9 pr-14" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">hours</span>
                        </div>
                      </div>
                      <div className="pt-1">
                        <ToggleRow id="force-rerun" label="Force Re-run" description="Allow bypassing dedup" checked={runSettings.force_rerun_allowed} onChange={(v) => updateRunSetting('force_rerun_allowed', v)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ MODEL ADD/EDIT SHEET ═══ */}
      <Sheet open={isSheetOpen} onOpenChange={(open) => { if (!open) { setIsSheetOpen(false); setEditForm({}); setEditingId(null) } }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Model' : 'Add Consumer Model'}</SheetTitle>
            <SheetDescription>Configure a consumer-facing AI model for query simulations.</SheetDescription>
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
                    ...prev,
                    openrouter_id: modelId,
                    model_id: modelId,
                    provider,
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
                <Input type="number" step={0.1} min={0} max={2} value={editForm.temperature ?? 0} onChange={(e) => setEditForm(prev => ({ ...prev, temperature: parseFloat(e.target.value) || 0 }))} className="h-9" />
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
                <Label className="text-sm">Tier</Label>
                <Select value={editForm.tier || 'growth'} onValueChange={(v) => setEditForm(prev => ({ ...prev, tier: v, tiers: [v] }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="launch">Launch</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="scale">Scale</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Behavior</Label>
                <Select value={editForm.consumer_behavior || 'direct_and_factual'} onValueChange={(v) => setEditForm(prev => ({ ...prev, consumer_behavior: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct_and_factual">Direct & Factual</SelectItem>
                    <SelectItem value="conversational">Conversational</SelectItem>
                    <SelectItem value="analytical">Analytical</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Input Cost ($/M tokens)</Label>
                <Input type="number" step={0.01} min={0} value={editForm.input_cost_per_million ?? 0} onChange={(e) => setEditForm(prev => ({ ...prev, input_cost_per_million: parseFloat(e.target.value) || 0 }))} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Output Cost ($/M tokens)</Label>
                <Input type="number" step={0.01} min={0} value={editForm.output_cost_per_million ?? 0} onChange={(e) => setEditForm(prev => ({ ...prev, output_cost_per_million: parseFloat(e.target.value) || 0 }))} className="h-9" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Rate Limit (rpm)</Label>
                <Input type="number" min={1} value={editForm.rate_limit_rpm ?? 30} onChange={(e) => setEditForm(prev => ({ ...prev, rate_limit_rpm: parseInt(e.target.value) || 30 }))} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Timeout (ms)</Label>
                <Input type="number" min={5000} value={editForm.timeout_ms ?? 30000} onChange={(e) => setEditForm(prev => ({ ...prev, timeout_ms: parseInt(e.target.value) || 30000 }))} className="h-9" />
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <ToggleRow id="edit-search" label="Supports Search" description="Model can perform web search" checked={editForm.supports_search ?? true} onChange={(v) => setEditForm(prev => ({ ...prev, supports_search: v }))} />
              <ToggleRow id="edit-reasoning" label="Supports Reasoning" description="Model has chain-of-thought" checked={editForm.supports_reasoning ?? true} onChange={(v) => setEditForm(prev => ({ ...prev, supports_reasoning: v }))} />
              <ToggleRow id="edit-citations" label="Supports Citations" description="Model returns source citations" checked={editForm.supports_citations ?? true} onChange={(v) => setEditForm(prev => ({ ...prev, supports_citations: v }))} />
              <ToggleRow id="edit-default" label="Default Onboarding Model" description="Used as the default model during onboarding" checked={editForm.is_default_onboarding ?? false} onChange={(v) => setEditForm(prev => ({ ...prev, is_default_onboarding: v }))} />
              <ToggleRow id="edit-active" label="Active" description="Model is available for use" checked={editForm.is_active ?? true} onChange={(v) => setEditForm(prev => ({ ...prev, is_active: v }))} />
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
