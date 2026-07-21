"use client"

import { useState, useEffect } from "react"
import {
  Loader2, Save, RefreshCw, Plus, Edit2, Trash2,
  Sparkles, Brain, Search, ChevronRight, Eye, Settings,
  ArrowUpDown, User, MessageSquareCode, Zap,
  Hash, Target, Layers,
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

type SectionKey = 'models' | 'generation_prompt' | 'scoring_prompt' | 'brand_research' | 'settings'

interface SectionDef {
  key: SectionKey
  name: string
  icon: typeof Brain
  color: string
  bg: string
  description: string
}

const SECTIONS: SectionDef[] = [
  { key: 'models', name: 'Generation Models', icon: Brain, color: 'text-amber-600', bg: 'bg-amber-50', description: 'LLM models used for generating and suggesting consumer search prompts. Supports fallback ordering for reliability.' },
  { key: 'generation_prompt', name: 'Generation Prompt', icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50', description: 'System prompt that instructs the LLM how to generate realistic consumer search queries for brand visibility testing.' },
  { key: 'scoring_prompt', name: 'Scoring Prompt', icon: Target, color: 'text-orange-600', bg: 'bg-orange-50', description: 'System prompt for scoring generated prompts on intent strength, naturalness, market relevance, and conversion potential.' },
  { key: 'brand_research', name: 'Brand Research', icon: Search, color: 'text-cyan-600', bg: 'bg-cyan-50', description: 'System prompt for researching and classifying brands — industry, sector, competitive landscape, and business model.' },
  { key: 'settings', name: 'Generation Settings', icon: Layers, color: 'text-purple-600', bg: 'bg-purple-50', description: 'Configure how many prompts to generate per flow, scoring thresholds, distribution, and category balance.' },
]

// Prompt types mapped to sections
const PROMPT_SECTION_MAP: Record<string, SectionKey> = {
  prompt_generation: 'generation_prompt',
  prompt_scoring: 'scoring_prompt',
  brand_intelligence: 'brand_research',
}

// ─── Default generation settings ────────────────────────────────────

interface GenerationSettings {
  default_prompt_count: number
  onboarding_prompt_count: number
  free_audit_prompt_count: number
  suggestion_prompt_count: number
  brand_defense_ratio: number
  category_capture_ratio: number
  solution_discovery_ratio: number
  min_score_threshold: number
  max_retries: number
  scrape_website: boolean
}

const DEFAULT_GEN_SETTINGS: GenerationSettings = {
  default_prompt_count: 8,
  onboarding_prompt_count: 8,
  free_audit_prompt_count: 10,
  suggestion_prompt_count: 5,
  brand_defense_ratio: 25,
  category_capture_ratio: 38,
  solution_discovery_ratio: 37,
  min_score_threshold: 0.6,
  max_retries: 2,
  scrape_website: false,
}

// ─── Component ──────────────────────────────────────────────────────

export function PromptDesignConfig() {
  const { addToast } = useToast()

  // State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionKey>('models')

  // Models
  const [models, setModels] = useState<ModelConfig[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editForm, setEditForm] = useState<Partial<ModelConfig>>({})
  const [editingId, setEditingId] = useState<string | null>(null)

  // Prompts
  const [prompts, setPrompts] = useState<SystemPromptConfig[]>([])
  const [promptRole, setPromptRole] = useState<'system' | 'user'>('system')

  // Settings
  const [genSettings, setGenSettings] = useState<GenerationSettings>(DEFAULT_GEN_SETTINGS)
  const [settingsChanged, setSettingsChanged] = useState(false)

  // Load
  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    try {
      setLoading(true)
      const [modelsRes, promptsRes] = await Promise.all([
        fetch('/api/admin/config/models'),
        fetch('/api/admin/config/system-prompts'),
      ])
      const [modelsData, promptsData] = await Promise.all([modelsRes.json(), promptsRes.json()])

      if (modelsData.success) {
        setModels(modelsData.data.filter((m: ModelConfig) => (m.purpose || 'query_run') === 'prompt_generation'))
      }
      if (promptsData.success) {
        setPrompts(promptsData.data.filter((p: SystemPromptConfig) =>
          ['prompt_generation', 'prompt_scoring', 'brand_intelligence'].includes(p.prompt_type)
        ))
      }

      // Load generation settings from system_configurations (if exists)
      try {
        const settingsRes = await fetch('/api/admin/config/feature-flags')
        const settingsData = await settingsRes.json()
        const genFlag = settingsData.flags?.find((f: { key: string }) => f.key === 'prompt_generation_settings')
        if (genFlag?.value) {
          setGenSettings(prev => ({ ...prev, ...genFlag.value }))
        }
      } catch {
        // Use defaults
      }
    } catch (error) {
      console.error('Error loading prompt design config:', error)
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
      const res = await fetch('/api/admin/config/models', {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...model, purpose: 'prompt_generation' }),
      })
      const result = await res.json()
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

  const openAddModel = () => {
    setEditingId(null)
    setEditForm({
      model_id: '', name: '', provider: '', tier: 'growth', tiers: ['growth'],
      openrouter_id: '', description: '', max_tokens: 4000, temperature: 0.7,
      supports_search: false, supports_reasoning: true, supports_citations: false,
      rate_limit_rpm: 30, timeout_ms: 30000, input_cost_per_million: 0,
      output_cost_per_million: 0, consumer_behavior: 'analytical',
      is_active: true, sort_order: models.length + 1,
      purpose: 'prompt_generation', is_default_onboarding: false, fallback_priority: models.length,
    })
    setIsSheetOpen(true)
  }

  const openEditModel = (model: ModelConfig) => {
    setEditingId(model.id!)
    setEditForm(model)
    setIsSheetOpen(true)
  }

  const adjustFallbackPriority = async (modelId: string, direction: 'up' | 'down') => {
    const sorted = [...models].sort((a, b) => (a.fallback_priority ?? 999) - (b.fallback_priority ?? 999))
    const idx = sorted.findIndex(m => m.id === modelId)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return

    const current = sorted[idx]
    const swap = sorted[swapIdx]
    const tempPriority = current.fallback_priority
    current.fallback_priority = swap.fallback_priority
    swap.fallback_priority = tempPriority

    // Save both
    for (const m of [current, swap]) {
      await fetch('/api/admin/config/models', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(m),
      })
    }
    loadAll()
  }

  // ─ Prompts ─
  const getActivePromptType = (): string => {
    if (activeSection === 'generation_prompt') return 'prompt_generation'
    if (activeSection === 'scoring_prompt') return 'prompt_scoring'
    if (activeSection === 'brand_research') return 'brand_intelligence'
    return ''
  }

  const activePrompt = prompts.find(p => p.prompt_type === getActivePromptType() && p.role === promptRole)

  const updatePromptContent = (content: string) => {
    const type = getActivePromptType()
    if (!type) return
    const exists = prompts.some(p => p.prompt_type === type && p.role === promptRole)
    if (exists) {
      setPrompts(prev => prev.map(p =>
        p.prompt_type === type && p.role === promptRole ? { ...p, content, version: (p.version || 1) + 1 } : p
      ))
    } else {
      setPrompts(prev => [...prev, {
        prompt_type: type, role: promptRole,
        name: SECTIONS.find(s => PROMPT_SECTION_MAP[type] === s.key)?.name || type,
        description: '', content, variables: [], is_active: true, version: 1,
      }])
    }
  }

  const handleSavePrompt = async () => {
    const type = getActivePromptType()
    const prompt = prompts.find(p => p.prompt_type === type && p.role === promptRole)
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
        addToast({ type: "error", title: "Error", message: result.error || "Failed to save" })
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to save prompt" })
    } finally {
      setSaving(false)
    }
  }

  // ─ Settings ─
  const updateGenSetting = <K extends keyof GenerationSettings>(key: K, value: GenerationSettings[K]) => {
    setGenSettings(prev => ({ ...prev, [key]: value }))
    setSettingsChanged(true)
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/admin/config/feature-flags', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'prompt_generation_settings',
          value: genSettings,
          description: 'Prompt generation flow configuration (counts, ratios, thresholds)',
        }),
      })
      const result = await res.json()
      if (result.flag) {
        addToast({ type: "success", title: "Saved", message: "Generation settings updated" })
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
  const sortedModels = [...models].sort((a, b) => (a.fallback_priority ?? 999) - (b.fallback_priority ?? 999))
  const activeModels = models.filter(m => m.is_active)
  const isPromptSection = ['generation_prompt', 'scoring_prompt', 'brand_research'].includes(activeSection)
  const userPromptExists = isPromptSection && prompts.some(p => p.prompt_type === getActivePromptType() && p.role === 'user')

  return (
    <div className="space-y-6">
      {/* ── Context Banner ── */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-zinc-900 p-2 shrink-0"><Sparkles className="h-4 w-4 text-white" /></div>
          <div>
            <h3 className="font-medium text-zinc-900 text-sm">Prompt Design Pipeline</h3>
            <p className="text-sm text-zinc-500 mt-1">
              Configuration for the prompt generation engine — from understanding a brand&apos;s market position
              to generating high-intent consumer search queries and scoring them for relevance and conversion potential.
            </p>
            <div className="flex items-center gap-2 mt-3 text-xs text-zinc-400 flex-wrap">
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-zinc-600 bg-cyan-50">Brand Research</span>
              <ChevronRight className="h-3 w-3 text-zinc-300" />
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-zinc-600 bg-amber-50">
                Generation <span className="ml-1 font-medium text-zinc-900">{activeModels.length}</span>
              </span>
              <ChevronRight className="h-3 w-3 text-zinc-300" />
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-zinc-600 bg-orange-50">Scoring</span>
              <ChevronRight className="h-3 w-3 text-zinc-300" />
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-zinc-600 bg-purple-50">Delivery</span>
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
                onClick={() => { setActiveSection(section.key); setPromptRole('system') }}
                className={`w-full text-left rounded-lg border p-3 transition-all ${
                  isActive ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <SIcon className={`h-4 w-4 ${isActive ? 'text-white' : section.color}`} />
                  <span className="text-sm font-medium">{section.name}</span>
                </div>
                <div className={`text-[10px] mt-1 ${isActive ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {section.key === 'models' && `${activeModels.length} model(s) · fallback chain`}
                  {section.key === 'generation_prompt' && `${prompts.filter(p => p.prompt_type === 'prompt_generation').length} prompt(s)`}
                  {section.key === 'scoring_prompt' && `${prompts.filter(p => p.prompt_type === 'prompt_scoring').length} prompt(s)`}
                  {section.key === 'brand_research' && `${prompts.filter(p => p.prompt_type === 'brand_intelligence').length} prompt(s)`}
                  {section.key === 'settings' && 'Counts, ratios, thresholds'}
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

          {/* ═══ MODELS SECTION ═══ */}
          {activeSection === 'models' && (
            <div className="space-y-4">
              {/* Fallback chain visualization */}
              <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <ArrowUpDown className="h-3 w-3 text-zinc-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Fallback Chain</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {sortedModels.map((model, i) => (
                    <div key={model.id} className="flex items-center gap-2">
                      <div className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs ${
                        model.is_active ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-zinc-100 border-zinc-200 text-zinc-400'
                      }`}>
                        <span className="text-[10px] font-medium text-zinc-400">{i + 1}.</span>
                        <Brain className="h-3 w-3" />
                        <span className="font-medium">{model.name}</span>
                      </div>
                      {i < sortedModels.length - 1 && <ChevronRight className="h-3 w-3 text-zinc-300 shrink-0" />}
                    </div>
                  ))}
                  {sortedModels.length === 0 && <span className="text-xs text-zinc-400">No models configured</span>}
                </div>
              </div>

              {/* Add button */}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={openAddModel} className="text-xs">
                  <Plus className="h-3 w-3 mr-1.5" /> Add Model
                </Button>
              </div>

              {/* Model Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {sortedModels.map((model, idx) => (
                  <Card key={model.id} className={!model.is_active ? 'opacity-50' : ''}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] py-0 text-zinc-400">#{idx + 1}</Badge>
                            <h4 className="text-sm font-medium text-zinc-900 truncate">{model.name}</h4>
                          </div>
                          <p className="text-[11px] text-zinc-400 font-mono truncate mt-0.5">{model.openrouter_id || model.model_id}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button onClick={() => adjustFallbackPriority(model.id!, 'up')} disabled={idx === 0} className="p-1 rounded hover:bg-zinc-100 disabled:opacity-30">
                            <ArrowUpDown className="h-3 w-3 text-zinc-400" />
                          </button>
                          <button onClick={() => openEditModel(model)} className="p-1 rounded hover:bg-zinc-100">
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
                {models.length === 0 && (
                  <div className="col-span-2 rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-400">
                    No generation models configured. Click &ldquo;Add Model&rdquo; to set up the first one.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ PROMPT SECTIONS (generation, scoring, brand_research) ═══ */}
          {isPromptSection && (
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
                {userPromptExists ? (
                  <button
                    onClick={() => setPromptRole('user')}
                    className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-all ${
                      promptRole === 'user' ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 hover:border-zinc-300 text-zinc-600'
                    }`}
                  >
                    <User className="h-3 w-3" /> User Prompt
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-zinc-400 px-2">
                    <User className="h-3 w-3" /> No user prompt (template is dynamic)
                  </span>
                )}
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
                                p.prompt_type === getActivePromptType() && p.role === promptRole ? { ...p, is_active: !p.is_active } : p
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
                    placeholder={`Enter ${promptRole} prompt...`}
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

          {/* ═══ SETTINGS SECTION ═══ */}
          {activeSection === 'settings' && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={<Hash className="h-4 w-4" />} label="Default Count" value={`${genSettings.default_prompt_count} prompts`} bg="bg-purple-50" fg="text-purple-600" />
                <StatCard icon={<Zap className="h-4 w-4" />} label="Onboarding" value={`${genSettings.onboarding_prompt_count} prompts`} bg="bg-blue-50" fg="text-blue-600" />
                <StatCard icon={<Sparkles className="h-4 w-4" />} label="Free Audit" value={`${genSettings.free_audit_prompt_count} prompts`} bg="bg-amber-50" fg="text-amber-600" />
                <StatCard icon={<Target className="h-4 w-4" />} label="Min Score" value={`${genSettings.min_score_threshold}`} bg="bg-green-50" fg="text-green-600" />
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
                {/* Prompt Counts */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-purple-100 p-1.5"><Hash className="h-3.5 w-3.5 text-purple-600" /></div>
                      <div>
                        <CardTitle className="text-sm">Prompt Counts per Flow</CardTitle>
                        <CardDescription className="text-xs">How many prompts to generate for each user flow</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm">Default</Label>
                        <Input type="number" min={1} max={50} value={genSettings.default_prompt_count} onChange={(e) => updateGenSetting('default_prompt_count', parseInt(e.target.value) || 8)} className="h-9" />
                        <p className="text-[10px] text-zinc-400">Daily scheduled runs</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">Onboarding</Label>
                        <Input type="number" min={1} max={50} value={genSettings.onboarding_prompt_count} onChange={(e) => updateGenSetting('onboarding_prompt_count', parseInt(e.target.value) || 8)} className="h-9" />
                        <p className="text-[10px] text-zinc-400">New brand sign-up</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm">Free Audit</Label>
                        <Input type="number" min={1} max={50} value={genSettings.free_audit_prompt_count} onChange={(e) => updateGenSetting('free_audit_prompt_count', parseInt(e.target.value) || 10)} className="h-9" />
                        <p className="text-[10px] text-zinc-400">Pre-signup audit flow</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">Suggestions</Label>
                        <Input type="number" min={1} max={50} value={genSettings.suggestion_prompt_count} onChange={(e) => updateGenSetting('suggestion_prompt_count', parseInt(e.target.value) || 5)} className="h-9" />
                        <p className="text-[10px] text-zinc-400">Dashboard refresh</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Category Distribution & Scoring */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-amber-100 p-1.5"><Target className="h-3.5 w-3.5 text-amber-600" /></div>
                      <div>
                        <CardTitle className="text-sm">Distribution &amp; Quality</CardTitle>
                        <CardDescription className="text-xs">Category balance and minimum score thresholds</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Brand Defense</Label>
                          <span className="text-sm font-medium text-zinc-700">{genSettings.brand_defense_ratio}%</span>
                        </div>
                        <Input type="range" min={0} max={100} value={genSettings.brand_defense_ratio} onChange={(e) => updateGenSetting('brand_defense_ratio', parseInt(e.target.value))} className="h-2 accent-blue-600" />
                        <p className="text-[10px] text-zinc-400">User already knows the brand</p>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Category Capture</Label>
                          <span className="text-sm font-medium text-zinc-700">{genSettings.category_capture_ratio}%</span>
                        </div>
                        <Input type="range" min={0} max={100} value={genSettings.category_capture_ratio} onChange={(e) => updateGenSetting('category_capture_ratio', parseInt(e.target.value))} className="h-2 accent-amber-600" />
                        <p className="text-[10px] text-zinc-400">User shopping the category</p>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Solution Discovery</Label>
                          <span className="text-sm font-medium text-zinc-700">{genSettings.solution_discovery_ratio}%</span>
                        </div>
                        <Input type="range" min={0} max={100} value={genSettings.solution_discovery_ratio} onChange={(e) => updateGenSetting('solution_discovery_ratio', parseInt(e.target.value))} className="h-2 accent-green-600" />
                        <p className="text-[10px] text-zinc-400">User describing a problem</p>
                      </div>
                    </div>
                    <div className="h-px bg-zinc-100" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm">Min Score</Label>
                        <Input type="number" step={0.1} min={0} max={1} value={genSettings.min_score_threshold} onChange={(e) => updateGenSetting('min_score_threshold', parseFloat(e.target.value) || 0.6)} className="h-9" />
                        <p className="text-[10px] text-zinc-400">Reject below this score</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">Max Retries</Label>
                        <Select value={String(genSettings.max_retries)} onValueChange={(v) => updateGenSetting('max_retries', parseInt(v))}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[0, 1, 2, 3, 5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-zinc-400">Retry on LLM failure</p>
                      </div>
                    </div>
                    <ToggleRow id="scrape" label="Scrape Brand Website" description="Enrich brand context with live website data" checked={genSettings.scrape_website} onChange={(v) => updateGenSetting('scrape_website', v)} />
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
            <SheetTitle>{editingId ? 'Edit Model' : 'Add Generation Model'}</SheetTitle>
            <SheetDescription>Configure an LLM for prompt generation with fallback ordering.</SheetDescription>
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
                <Input type="number" step={0.1} min={0} max={2} value={editForm.temperature ?? 0.7} onChange={(e) => setEditForm(prev => ({ ...prev, temperature: parseFloat(e.target.value) || 0 }))} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Max Tokens</Label>
                <Input type="number" step={500} min={500} max={16000} value={editForm.max_tokens ?? 4000} onChange={(e) => setEditForm(prev => ({ ...prev, max_tokens: parseInt(e.target.value) || 4000 }))} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Fallback Priority</Label>
                <Input type="number" min={0} value={editForm.fallback_priority ?? 0} onChange={(e) => setEditForm(prev => ({ ...prev, fallback_priority: parseInt(e.target.value) || 0 }))} className="h-9" />
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
              <ToggleRow id="edit-active" label="Active" description="Model available for prompt generation" checked={editForm.is_active ?? true} onChange={(v) => setEditForm(prev => ({ ...prev, is_active: v }))} />
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
