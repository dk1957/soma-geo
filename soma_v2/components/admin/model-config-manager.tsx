"use client"

import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, Save, X, Loader2, Globe, Search, Info, Star, Zap, Brain, FileText, BarChart3, ArrowUpDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet"
import { useToast } from "@/components/layout/notification-toast"

type ModelPurpose = 'query_run' | 'analysis' | 'prompt_generation' | 'content' | 'insights'

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
    purpose: ModelPurpose
    is_default_onboarding: boolean
    fallback_priority: number | null
}

const PURPOSE_META: Record<ModelPurpose, {
    label: string
    description: string
    icon: typeof Globe
    color: string
    bg: string
    badge: string
}> = {
    query_run: {
        label: 'Query Run Models',
        description: 'Consumer-facing AI models (ChatGPT, Gemini, Claude, etc.) used for daily runs, onboarding, and sign-up simulations. Enabled per account based on plan tier.',
        icon: Zap,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    analysis: {
        label: 'Analysis Models',
        description: 'Models used for response analysis — extracting brand mentions, sentiment, source URLs, and competitive positioning. Configure NLP parameters and fallback chain.',
        icon: BarChart3,
        color: 'text-green-600',
        bg: 'bg-green-50',
        badge: 'bg-green-100 text-green-800 border-green-200',
    },
    prompt_generation: {
        label: 'Prompt Generation Models',
        description: 'Models for generating and suggesting consumer search prompts — from onboarding discovery to dashboard prompt management. Supports fallback ordering.',
        icon: Brain,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    content: {
        label: 'Content Models',
        description: 'Models for content generation and creation — GSEO content, recommendations, and brand optimization content.',
        icon: FileText,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        badge: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    insights: {
        label: 'Insight Models',
        description: 'Models for analyzing both LLM visibility metrics and Google Search Console data to generate actionable insights and recommendations.',
        icon: Star,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        badge: 'bg-orange-100 text-orange-800 border-orange-200',
    },
}

const PURPOSE_ORDER: ModelPurpose[] = ['query_run', 'analysis', 'prompt_generation', 'content', 'insights']

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

const PROVIDER_INFO: Record<string, { nativeSearch: boolean }> = {
    openai: { nativeSearch: true },
    anthropic: { nativeSearch: true },
    perplexity: { nativeSearch: true },
    'x-ai': { nativeSearch: true },
    google: { nativeSearch: false },
    meta: { nativeSearch: false },
    mistral: { nativeSearch: false },
}

interface OpenRouterModel {
    id: string
    name: string
    description: string
    context_length: number
    pricing: { prompt: string; completion: string }
    top_provider: number | null
    architecture: string | null
}

function OpenRouterBrowser({ onSelect, onClose }: { onSelect: (model: OpenRouterModel) => void; onClose: () => void }) {
    const [models, setModels] = useState<OpenRouterModel[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchModels = async () => {
            try {
                setLoading(true)
                const res = await fetch('/api/admin/config/openrouter-models')
                const result = await res.json()
                if (result.success) {
                    setModels(result.data)
                } else {
                    setError(result.error || 'Failed to fetch models')
                }
            } catch {
                setError('Failed to fetch models')
            } finally {
                setLoading(false)
            }
        }
        fetchModels()
    }, [])

    const filtered = search
        ? models.filter(m => m.id.toLowerCase().includes(search.toLowerCase()) || m.name.toLowerCase().includes(search.toLowerCase()))
        : models

    const formatCost = (costPerToken: string) => {
        const cost = parseFloat(costPerToken) * 1_000_000
        if (cost === 0) return 'Free'
        if (cost < 0.01) return `$${cost.toFixed(4)}/M`
        return `$${cost.toFixed(2)}/M`
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search models (e.g. gpt-4, claude, gemini...)" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" autoFocus />
            </div>
            {loading && <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
            {error && <div className="text-center py-8 text-red-500 text-sm">{error}</div>}
            {!loading && !error && (
                <div className="max-h-[400px] overflow-y-auto space-y-1">
                    {filtered.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm">No models found{search ? ` for "${search}"` : ''}</div>}
                    {filtered.slice(0, 100).map(model => (
                        <button key={model.id} onClick={() => onSelect(model)} className="w-full text-left px-3 py-2.5 rounded-md hover:bg-zinc-100 transition-colors">
                            <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm truncate">{model.name}</span>
                                        {model.architecture && <Badge variant="outline" className="text-[10px] shrink-0">{model.architecture}</Badge>}
                                    </div>
                                    <p className="text-xs text-muted-foreground font-mono truncate">{model.id}</p>
                                </div>
                                <div className="text-right shrink-0 text-xs text-muted-foreground">
                                    <div>In: {formatCost(model.pricing.prompt)}</div>
                                    <div>Out: {formatCost(model.pricing.completion)}</div>
                                </div>
                            </div>
                        </button>
                    ))}
                    {filtered.length > 100 && <p className="text-center text-xs text-muted-foreground py-2">Showing 100 of {filtered.length} models. Narrow your search.</p>}
                </div>
            )}
        </div>
    )
}

/* ═══════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════ */

export function ModelConfigManager() {
    const { addToast } = useToast()
    const [models, setModels] = useState<ModelConfig[]>([])
    const [webSearchConfigs, setWebSearchConfigs] = useState<WebSearchConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [savingWebSearch, setSavingWebSearch] = useState<string | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<Partial<ModelConfig>>({})
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [addPurpose, setAddPurpose] = useState<ModelPurpose>('query_run')

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [modelsRes, webSearchRes] = await Promise.all([
                fetch('/api/admin/config/models'),
                fetch('/api/admin/config/web-search')
            ])
            const modelsResult = await modelsRes.json()
            const webSearchResult = await webSearchRes.json()
            if (modelsResult.success) setModels(modelsResult.data)
            else addToast({ type: "error", title: "Error", message: "Failed to load models" })
            if (webSearchResult.success && webSearchResult.data) setWebSearchConfigs(webSearchResult.data)
        } catch (error) {
            console.error('Error loading data:', error)
            addToast({ type: "error", title: "Error", message: "Failed to load models" })
        } finally {
            setLoading(false)
        }
    }

    const getWebSearchConfig = (modelId: string) => webSearchConfigs.find(c => c.model_id === modelId)

    const updateWebSearchConfig = async (modelId: string, updates: Partial<WebSearchConfig>) => {
        const existing = getWebSearchConfig(modelId)
        const model = models.find(m => m.model_id === modelId)
        const newConfig: WebSearchConfig = {
            model_id: modelId, provider: model?.provider || 'unknown',
            web_search_enabled: true, search_engine: 'auto', max_results: 5,
            search_context_size: 'medium', use_online_suffix: false, use_responses_api: true,
            custom_search_prompt: null, is_active: true,
            ...existing, ...updates
        }
        try {
            setSavingWebSearch(modelId)
            const response = await fetch('/api/admin/config/web-search', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig)
            })
            const result = await response.json()
            if (result.success) {
                setWebSearchConfigs(prev => {
                    const exists = prev.some(c => c.model_id === modelId)
                    return exists ? prev.map(c => c.model_id === modelId ? newConfig : c) : [...prev, newConfig]
                })
                addToast({ type: "success", title: "Saved", message: "Web search config updated" })
            } else {
                addToast({ type: "error", title: "Error", message: result.error || "Failed to save web search config" })
            }
        } catch (error) {
            console.error('Error saving web search config:', error)
            addToast({ type: "error", title: "Error", message: "Failed to save web search config" })
        } finally {
            setSavingWebSearch(null)
        }
    }

    const handleSave = async (model: Partial<ModelConfig>) => {
        try {
            setSaving(true)
            const method = model.id ? 'PUT' : 'POST'
            const response = await fetch('/api/admin/config/models', {
                method, headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(model)
            })
            const result = await response.json()
            if (result.success) {
                addToast({ type: "success", title: "Success", message: model.id ? "Model updated" : "Model created" })
                setIsSheetOpen(false)
                setEditingId(null)
                setEditForm({})
                loadData()
            } else {
                addToast({ type: "error", title: "Error", message: result.error || "Failed to save model" })
            }
        } catch (error) {
            console.error('Error saving model:', error)
            addToast({ type: "error", title: "Error", message: "Failed to save model" })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this model?')) return
        try {
            const response = await fetch(`/api/admin/config/models?id=${id}`, { method: 'DELETE' })
            const result = await response.json()
            if (result.success) {
                addToast({ type: "success", title: "Success", message: "Model deleted" })
                loadData()
            } else {
                addToast({ type: "error", title: "Error", message: "Failed to delete model" })
            }
        } catch (error) {
            console.error('Error deleting model:', error)
            addToast({ type: "error", title: "Error", message: "Failed to delete model" })
        }
    }

    const openEdit = (model: ModelConfig) => {
        setEditingId(model.id!)
        setEditForm(model)
        setIsSheetOpen(true)
    }

    const openAdd = (purpose: ModelPurpose) => {
        setAddPurpose(purpose)
        setEditingId(null)
        setEditForm({
            model_id: '', name: '', provider: '', tier: 'growth', tiers: ['growth'],
            openrouter_id: '', description: '', max_tokens: 4000, temperature: 0.0,
            supports_search: purpose === 'query_run', supports_reasoning: true, supports_citations: purpose === 'query_run',
            rate_limit_rpm: 30, timeout_ms: 30000, input_cost_per_million: 0.0,
            output_cost_per_million: 0.0, consumer_behavior: 'direct_and_factual',
            is_active: true, sort_order: models.length + 1,
            purpose, is_default_onboarding: false, fallback_priority: null
        })
        setIsSheetOpen(true)
    }

    const closeSheet = () => {
        setIsSheetOpen(false)
        setEditingId(null)
        setEditForm({})
    }

    const [activePurpose, setActivePurpose] = useState<ModelPurpose>('query_run')

    if (loading) {
        return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
    }

    const activeCount = models.filter(m => m.is_active).length
    const webSearchCount = webSearchConfigs.filter(c => c.web_search_enabled).length
    const editingModelId = editingId ? models.find(m => m.id === editingId)?.model_id : null

    const modelsByPurpose = (purpose: ModelPurpose) => {
        const group = models.filter(m => (m.purpose || 'query_run') === purpose)
        if (purpose === 'analysis' || purpose === 'prompt_generation') {
            return group.sort((a, b) => (a.fallback_priority ?? 999) - (b.fallback_priority ?? 999))
        }
        return group.sort((a, b) => a.sort_order - b.sort_order)
    }

    const activeMeta = PURPOSE_META[activePurpose]
    const activeModels = modelsByPurpose(activePurpose)
    const ActiveIcon = activeMeta.icon
    const hasFallback = activePurpose === 'analysis' || activePurpose === 'prompt_generation'
    const hasOnboardingDefault = activePurpose === 'query_run'
    const defaultModel = hasOnboardingDefault ? activeModels.find(m => m.is_default_onboarding) : null

    return (
        <div className="space-y-6">
            {/* Pipeline Context Banner */}
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-start gap-3">
                    <div className="rounded-md bg-zinc-900 p-2 shrink-0"><Globe className="h-4 w-4 text-white" /></div>
                    <div>
                        <h3 className="font-medium text-zinc-900 text-sm">LLM Models by Application</h3>
                        <p className="text-sm text-zinc-500 mt-1">
                            Models are organized by where they&apos;re used in the platform — from consumer query simulations to content generation and data analysis.
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                            <div className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-green-500" />
                                <span><strong className="text-zinc-900">{activeCount}</strong> active</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Globe className="h-3 w-3 text-blue-500" />
                                <span><strong className="text-zinc-900">{webSearchCount}</strong> web search</span>
                            </div>
                            <span className="text-zinc-400">{models.length} total</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Side-by-side: sidebar nav + model grid */}
            <div className="flex gap-4 min-h-[500px]">
                {/* Left sidebar — purpose categories */}
                <div className="w-56 shrink-0 space-y-1.5">
                    {PURPOSE_ORDER.map(purpose => {
                        const meta = PURPOSE_META[purpose]
                        const isActive = activePurpose === purpose
                        const Icon = meta.icon
                        const count = modelsByPurpose(purpose).length

                        return (
                            <button
                                key={purpose}
                                onClick={() => setActivePurpose(purpose)}
                                className={`w-full text-left rounded-lg border p-3 transition-all ${
                                    isActive
                                        ? 'border-zinc-900 bg-zinc-900 text-white'
                                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`rounded p-1 ${isActive ? 'bg-white/20' : meta.bg}`}>
                                        <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : meta.color}`} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium truncate">{meta.label.replace(' Models', '')}</span>
                                            <Badge variant={isActive ? 'secondary' : 'outline'} className={`text-[10px] py-0 ml-1 ${isActive ? 'bg-white/20 text-white border-white/30' : ''}`}>{count}</Badge>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* Right content — models for selected purpose */}
                <div className="flex-1 space-y-4">
                    {/* Section Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`rounded-md p-1.5 ${activeMeta.bg}`}>
                                <ActiveIcon className={`h-4 w-4 ${activeMeta.color}`} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-medium text-sm text-zinc-900">{activeMeta.label}</h3>
                                    {hasOnboardingDefault && defaultModel && (
                                        <Badge className="text-[10px] py-0 bg-amber-100 text-amber-800 border-amber-200">
                                            <Star className="h-2.5 w-2.5 mr-0.5" /> Default: {defaultModel.name}
                                        </Badge>
                                    )}
                                    {hasFallback && activeModels.length > 1 && (
                                        <Badge variant="outline" className="text-[10px] py-0">
                                            <ArrowUpDown className="h-2.5 w-2.5 mr-0.5" /> Fallback chain
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-zinc-500 mt-0.5 max-w-2xl">{activeMeta.description}</p>
                            </div>
                        </div>
                        <Button onClick={() => openAdd(activePurpose)} size="sm">
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Add Model
                        </Button>
                    </div>

                    {/* Model Grid */}
                    {activeModels.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-zinc-200 p-12 text-center">
                            <ActiveIcon className={`h-8 w-8 mx-auto mb-3 ${activeMeta.color} opacity-40`} />
                            <p className="text-sm text-zinc-500">No models configured</p>
                            <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">{activeMeta.description}</p>
                            <Button onClick={() => openAdd(activePurpose)} size="sm" variant="outline" className="mt-4 text-xs">
                                <Plus className="h-3 w-3 mr-1" /> Add first model
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {activeModels.map((model) => {
                                const webSearch = getWebSearchConfig(model.model_id)
                                const tiers = model.tiers || [model.tier]
                                const formatCost = (c: number) => {
                                    if (c === 0) return 'Free'
                                    if (c < 0.01) return `$${c.toFixed(4)}`
                                    return `$${c.toFixed(2)}`
                                }

                                return (
                                    <Card
                                        key={model.id}
                                        className={`cursor-pointer transition-all hover:border-zinc-400 ${!model.is_active ? 'opacity-50' : ''}`}
                                        onClick={() => openEdit(model)}
                                    >
                                        <CardContent className="p-4 space-y-3">
                                            {/* Header */}
                                            <div className="flex items-start justify-between">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        {model.is_default_onboarding && (
                                                            <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                                        )}
                                                        <h4 className="font-medium text-sm text-zinc-900 truncate">{model.name}</h4>
                                                    </div>
                                                    <p className="text-xs text-zinc-500 mt-0.5">{model.provider}</p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                                    {hasFallback && model.fallback_priority != null && (
                                                        <Badge variant="outline" className="text-[10px] py-0">#{model.fallback_priority}</Badge>
                                                    )}
                                                    <span className={`h-2 w-2 rounded-full ${model.is_active ? 'bg-green-500' : 'bg-zinc-300'}`} />
                                                    <Button
                                                        variant="ghost" size="sm" className="h-7 w-7 p-0"
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(model.id!) }}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 text-zinc-400 hover:text-red-500" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Tiers (only for query_run) */}
                                            {activePurpose === 'query_run' && (
                                                <div className="flex gap-1 flex-wrap">
                                                    {tiers.map((t: string) => (
                                                        <Badge key={t} variant="outline" className="text-[10px] capitalize py-0">{t}</Badge>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Cost */}
                                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                <span>In: {formatCost(model.input_cost_per_million)}/M</span>
                                                <span className="text-zinc-300">·</span>
                                                <span>Out: {formatCost(model.output_cost_per_million)}/M</span>
                                            </div>

                                            {/* Capabilities */}
                                            <div className="flex gap-1 flex-wrap">
                                                {model.supports_search && <Badge variant="secondary" className="text-[10px] py-0">Search</Badge>}
                                                {model.supports_reasoning && <Badge variant="secondary" className="text-[10px] py-0">Reasoning</Badge>}
                                                {model.supports_citations && <Badge variant="secondary" className="text-[10px] py-0">Citations</Badge>}
                                                {webSearch?.web_search_enabled && (
                                                    <Badge className="text-[10px] py-0 bg-blue-100 text-blue-800 border-blue-200">
                                                        <Globe className="h-2.5 w-2.5 mr-0.5" />Web
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit / Add Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={(open) => { if (!open) closeSheet() }}>
                <SheetContent className="w-[560px] sm:max-w-[560px] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>{editingId ? 'Edit Model' : 'Add New Model'}</SheetTitle>
                        <SheetDescription>
                            {editingId
                                ? `Update model configuration · ${PURPOSE_META[(editForm.purpose as ModelPurpose) || 'query_run'].label}`
                                : `Add to ${PURPOSE_META[addPurpose].label}`}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 space-y-6">
                        <ModelForm
                            model={editForm}
                            onChange={setEditForm}
                            onSave={() => handleSave(editForm)}
                            onCancel={closeSheet}
                            saving={saving}
                        />

                        {/* Web Search Config (only for existing query_run models) */}
                        {editingId && editingModelId && (editForm.purpose || 'query_run') === 'query_run' && (
                            <>
                                <Separator />
                                <WebSearchPanel
                                    modelId={editingModelId}
                                    provider={editForm.provider || 'unknown'}
                                    config={getWebSearchConfig(editingModelId)}
                                    onUpdate={(updates) => updateWebSearchConfig(editingModelId, updates)}
                                    saving={savingWebSearch === editingModelId}
                                />
                            </>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}

/* ═══════════════════════════════════════════════
   Web Search Panel (for Sheet)
   ═══════════════════════════════════════════════ */

function WebSearchPanel({ modelId, provider, config, onUpdate, saving }: {
    modelId: string
    provider: string
    config: WebSearchConfig | undefined
    onUpdate: (updates: Partial<WebSearchConfig>) => void
    saving: boolean
}) {
    const providerInfo = PROVIDER_INFO[provider] || { nativeSearch: false }
    const enabled = config?.web_search_enabled ?? true

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-medium flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-500" />
                        Web Search
                        {providerInfo.nativeSearch && (
                            <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700">Native Available</Badge>
                        )}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-0.5">Allow this model to search the web for up-to-date information</p>
                </div>
                <Switch checked={enabled} onCheckedChange={(checked) => onUpdate({ web_search_enabled: checked })} disabled={saving} />
            </div>

            {enabled && (
                <div className="space-y-4 pl-6 border-l-2 border-blue-100">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Search Engine</Label>
                            <Select value={config?.search_engine || 'auto'} onValueChange={(v: 'auto' | 'native' | 'exa') => onUpdate({ search_engine: v })} disabled={saving}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="auto">Auto</SelectItem>
                                    <SelectItem value="native" disabled={!providerInfo.nativeSearch}>Native{!providerInfo.nativeSearch && ' (N/A)'}</SelectItem>
                                    <SelectItem value="exa">Exa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Max Results</Label>
                            <Select value={String(config?.max_results || 5)} onValueChange={(v) => onUpdate({ max_results: parseInt(v) })} disabled={saving}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {[1, 2, 3, 5, 7, 10].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Context Size</Label>
                            <Select value={config?.search_context_size || 'medium'} onValueChange={(v: 'low' | 'medium' | 'high') => onUpdate({ search_context_size: v })} disabled={saving}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Switch id={`responses-api-${modelId}`} checked={config?.use_responses_api ?? true}
                                onCheckedChange={(checked) => onUpdate({ use_responses_api: checked, use_online_suffix: checked ? false : (config?.use_online_suffix ?? false) })} disabled={saving} />
                            <Label htmlFor={`responses-api-${modelId}`} className="text-xs">Responses API</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch id={`online-suffix-${modelId}`} checked={config?.use_online_suffix ?? false}
                                onCheckedChange={(checked) => onUpdate({ use_online_suffix: checked, use_responses_api: checked ? false : (config?.use_responses_api ?? true) })} disabled={saving} />
                            <Label htmlFor={`online-suffix-${modelId}`} className="text-xs">:online suffix</Label>
                        </div>
                        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />}
                    </div>
                </div>
            )}
        </div>
    )
}

/* ═══════════════════════════════════════════════
   Model Form (reused in Sheet)
   ═══════════════════════════════════════════════ */

function ModelForm({ model, onChange, onSave, onCancel, saving }: {
    model: Partial<ModelConfig>
    onChange: (model: Partial<ModelConfig>) => void
    onSave: () => void
    onCancel: () => void
    saving: boolean
}) {
    const [showBrowser, setShowBrowser] = useState(false)

    const handleSelectOpenRouterModel = (orModel: OpenRouterModel) => {
        const provider = orModel.id.split('/')[0] || model.provider || ''
        const shortId = orModel.id.split('/').slice(1).join('/') || orModel.id
        const inputCost = parseFloat(orModel.pricing.prompt) * 1_000_000
        const outputCost = parseFloat(orModel.pricing.completion) * 1_000_000
        onChange({
            ...model,
            openrouter_id: orModel.id,
            name: model.name || orModel.name,
            model_id: model.model_id || shortId.replace(/[^a-z0-9-]/gi, '-').toLowerCase(),
            provider: model.provider || provider,
            description: model.description || orModel.description?.slice(0, 200) || '',
            max_tokens: orModel.top_provider || model.max_tokens || 4000,
            input_cost_per_million: inputCost || model.input_cost_per_million || 0,
            output_cost_per_million: outputCost || model.output_cost_per_million || 0,
        })
        setShowBrowser(false)
    }

    return (
        <div className="space-y-4">
            {/* Purpose selector */}
            <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Select value={model.purpose || 'query_run'} onValueChange={(v: ModelPurpose) => onChange({ ...model, purpose: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {PURPOSE_ORDER.map(p => (
                            <SelectItem key={p} value={p}>{PURPOSE_META[p].label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className="text-xs">Model ID</Label>
                    <Input value={model.model_id || ''} onChange={(e) => onChange({ ...model, model_id: e.target.value })} placeholder="grok" className="h-9" />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs">Name</Label>
                    <Input value={model.name || ''} onChange={(e) => onChange({ ...model, name: e.target.value })} placeholder="X AI (Grok)" className="h-9" />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs">Provider</Label>
                    <Input value={model.provider || ''} onChange={(e) => onChange({ ...model, provider: e.target.value })} placeholder="x-ai" className="h-9" />
                </div>
                {(model.purpose || 'query_run') === 'query_run' && (
                    <div className="space-y-1.5">
                        <Label className="text-xs">Plans</Label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {['growth', 'pro', 'enterprise'].map((tierOption) => {
                                const tiers = model.tiers || [model.tier] || []
                                const isSelected = tiers.includes(tierOption)
                                return (
                                    <button key={tierOption} type="button"
                                        onClick={() => {
                                            const currentTiers = model.tiers || [model.tier] || []
                                            let newTiers = isSelected ? currentTiers.filter(t => t !== tierOption) : [...currentTiers, tierOption]
                                            if (newTiers.length === 0) newTiers = ['growth']
                                            onChange({ ...model, tiers: newTiers, tier: newTiers[0] as string })
                                        }}
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                                            isSelected ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
                                        }`}
                                    >{tierOption.charAt(0).toUpperCase() + tierOption.slice(1)}</button>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Onboarding default (query_run only) */}
            {(model.purpose || 'query_run') === 'query_run' && (
                <div className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/50 p-3">
                    <div>
                        <Label className="text-xs font-medium flex items-center gap-1.5">
                            <Star className="h-3.5 w-3.5 text-amber-500" />
                            Default Onboarding Model
                        </Label>
                        <p className="text-[11px] text-zinc-500 mt-0.5">Use this as the best model for onboarding new brands</p>
                    </div>
                    <Switch checked={model.is_default_onboarding ?? false} onCheckedChange={(checked) => onChange({ ...model, is_default_onboarding: checked })} />
                </div>
            )}

            {/* Fallback priority (analysis and prompt_generation) */}
            {((model.purpose || 'query_run') === 'analysis' || (model.purpose || 'query_run') === 'prompt_generation') && (
                <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1.5">
                        <ArrowUpDown className="h-3 w-3" />
                        Fallback Priority
                    </Label>
                    <div className="flex items-center gap-2">
                        <Input type="number" min={1} value={model.fallback_priority ?? ''} onChange={(e) => onChange({ ...model, fallback_priority: e.target.value ? parseInt(e.target.value) : null })} placeholder="1 = primary" className="h-9 w-24" />
                        <span className="text-[11px] text-zinc-400">Lower number = tried first. Leave empty for no fallback ordering.</span>
                    </div>
                </div>
            )}

            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-xs">OpenRouter ID</Label>
                    <Button variant="outline" size="sm" onClick={() => setShowBrowser(true)} className="h-7 text-xs gap-1">
                        <Search className="h-3 w-3" /> Browse
                    </Button>
                </div>
                <Input value={model.openrouter_id || ''} onChange={(e) => onChange({ ...model, openrouter_id: e.target.value })} placeholder="openai/gpt-4o" className="h-9 font-mono text-xs" />
            </div>

            <Dialog open={showBrowser} onOpenChange={setShowBrowser}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>Browse OpenRouter Models</DialogTitle></DialogHeader>
                    <OpenRouterBrowser onSelect={handleSelectOpenRouterModel} onClose={() => setShowBrowser(false)} />
                </DialogContent>
            </Dialog>

            <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Input value={model.description || ''} onChange={(e) => onChange({ ...model, description: e.target.value })} placeholder="High-speed model with real-time access" className="h-9" />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className="text-xs">Max Tokens</Label>
                    <Input type="number" value={model.max_tokens || 4000} onChange={(e) => onChange({ ...model, max_tokens: parseInt(e.target.value) })} className="h-9" />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs">Temperature</Label>
                    <Input type="number" step="0.1" value={model.temperature || 0.0} onChange={(e) => onChange({ ...model, temperature: parseFloat(e.target.value) })} className="h-9" />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs">Rate Limit (RPM)</Label>
                    <Input type="number" value={model.rate_limit_rpm || 30} onChange={(e) => onChange({ ...model, rate_limit_rpm: parseInt(e.target.value) })} className="h-9" />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs">Timeout (ms)</Label>
                    <Input type="number" value={model.timeout_ms || 30000} onChange={(e) => onChange({ ...model, timeout_ms: parseInt(e.target.value) })} className="h-9" />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs">Input Cost / M Tokens</Label>
                    <Input type="number" step="0.01" value={model.input_cost_per_million || 0.0} onChange={(e) => onChange({ ...model, input_cost_per_million: parseFloat(e.target.value) })} className="h-9" />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs">Output Cost / M Tokens</Label>
                    <Input type="number" step="0.01" value={model.output_cost_per_million || 0.0} onChange={(e) => onChange({ ...model, output_cost_per_million: parseFloat(e.target.value) })} className="h-9" />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label className="text-xs">Consumer Behavior</Label>
                <Input value={model.consumer_behavior || ''} onChange={(e) => onChange({ ...model, consumer_behavior: e.target.value })} placeholder="direct_and_factual" className="h-9" />
            </div>

            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                <div className="flex items-center justify-between">
                    <Label className="text-xs">Search</Label>
                    <Switch checked={model.supports_search} onCheckedChange={(checked) => onChange({ ...model, supports_search: checked })} />
                </div>
                <div className="flex items-center justify-between">
                    <Label className="text-xs">Reasoning</Label>
                    <Switch checked={model.supports_reasoning} onCheckedChange={(checked) => onChange({ ...model, supports_reasoning: checked })} />
                </div>
                <div className="flex items-center justify-between">
                    <Label className="text-xs">Citations</Label>
                    <Switch checked={model.supports_citations} onCheckedChange={(checked) => onChange({ ...model, supports_citations: checked })} />
                </div>
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Active</Label>
                    <Switch checked={model.is_active} onCheckedChange={(checked) => onChange({ ...model, is_active: checked })} />
                </div>
            </div>

            <Separator />

            <div className="flex gap-2">
                <Button onClick={onSave} disabled={saving} size="sm">
                    {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Save
                </Button>
                <Button variant="outline" onClick={onCancel} disabled={saving} size="sm">
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Cancel
                </Button>
            </div>
        </div>
    )
}
