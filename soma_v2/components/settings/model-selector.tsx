"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Loader2, Check, Lock, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/layout/notification-toast"
import { cn } from "@/lib/utils"

interface ModelSelectorProps {
    brandId: string
    accountId?: string
}

interface ModelInfo {
    id: string
    name: string
    provider: string
    tier: string
    description?: string
    is_available: boolean
}

/** Map model/provider names to logo paths */
const getModelLogo = (name: string, provider?: string): string | null => {
    const combined = `${provider || ''} ${name}`.toLowerCase()
    if (combined.includes('openai') || combined.includes('gpt') || combined.includes('chatgpt')) return '/models/chatgpt-logo.png'
    if (combined.includes('anthropic') || combined.includes('claude')) return '/models/claude-logo.png'
    if (combined.includes('google') || combined.includes('gemini')) return '/models/gemini-logo.png'
    if (combined.includes('grok') || combined.includes('xai')) return '/models/grok-logo.png'
    if (combined.includes('perplexity') || combined.includes('sonar')) return '/models/perplexity-logo.png'
    if (combined.includes('llama') || combined.includes('meta')) return '/models/meta-logo.svg'
    return null
}

export function ModelSelector({ brandId }: ModelSelectorProps) {
    const { addToast } = useToast()
    const [selectedModels, setSelectedModels] = useState<string[]>([])
    const [availableModels, setAvailableModels] = useState<ModelInfo[]>([])
    const [limit, setLimit] = useState<number>(3)
    const [planTier, setPlanTier] = useState<string>('growth')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [autoSelectedDefaults, setAutoSelectedDefaults] = useState(false)

    useEffect(() => {
        if (brandId) {
            loadModels()
        }
    }, [brandId])

    const loadModels = async () => {
        try {
            setLoading(true)

            const response = await fetch(`/api/brands/${brandId}/models`)
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                console.error('Brand models API error:', response.status, errorData)
                throw new Error(errorData.error || `Failed to load models (${response.status})`)
            }

            const data = await response.json()
            const fetchedSelected = data.selected_models || []
            const fetchedLimit = data.limit || 3
            const fetchedModels = data.available_models || []
            const fetchedPlanTier = data.plan_tier || 'growth'
            
            setLimit(fetchedLimit)
            setAvailableModels(fetchedModels)
            setPlanTier(fetchedPlanTier)

            // Filter to only available models for this plan
            const availableForPlan = fetchedModels.filter((m: ModelInfo) => m.is_available)
            
            let initialSelection: string[] = fetchedSelected
            // Check if selected models are valid for current plan
            const validSelected = fetchedSelected.filter((id: string) => 
                availableForPlan.some((m: ModelInfo) => m.id === id)
            )
            
            if (validSelected.length === 0) {
                // Auto-select defaults if no valid selection
                initialSelection = availableForPlan.slice(0, fetchedLimit).map((m: ModelInfo) => m.id)
                setAutoSelectedDefaults(true)
            } else if (validSelected.length !== fetchedSelected.length) {
                // Some models were invalid, use only valid ones
                initialSelection = validSelected
                setAutoSelectedDefaults(true)
            }
            
            setSelectedModels(initialSelection)
        } catch (error) {
            console.error('Error loading models:', error)
            addToast({ type: "error", title: "Error", message: "Failed to load model settings" })
        } finally {
            setLoading(false)
        }
    }

    const handleToggleModel = (modelId: string) => {
        const model = availableModels.find(m => m.id === modelId)
        
        // Don't allow selecting unavailable models
        if (model && !model.is_available) {
            addToast({
                type: "info",
                title: "Upgrade Required",
                message: `${model.name} requires a ${model.tier} plan or higher.`
            })
            return
        }
        
        setSelectedModels(prev => {
            if (prev.includes(modelId)) {
                return prev.filter(id => id !== modelId)
            }
            if (prev.length >= limit) {
                const oldestModel = prev[0]
                const newSelection = [...prev.slice(1), modelId]
                addToast({
                    type: "info",
                    title: "Model Swapped",
                    message: `Limit reached. Replaced ${availableModels.find(m => m.id === oldestModel)?.name || 'oldest'} with ${model?.name || 'new model'}.`
                })
                setAutoSelectedDefaults(false)
                return newSelection
            }
            setAutoSelectedDefaults(false)
            return [...prev, modelId]
        })
    }

    const saveModels = async () => {
        try {
            setSaving(true)
            const response = await fetch(`/api/brands/${brandId}/models`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ models: selectedModels })
            })
            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to save models')
            }
            addToast({ type: "success", title: "Saved", message: "Model preferences updated" })
            setAutoSelectedDefaults(false)
        } catch (error) {
            console.error('Error saving models:', error)
            addToast({ type: "error", title: "Error", message: error instanceof Error ? error.message : "Failed to save" })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // Separate available and locked models
    const accessibleModels = availableModels.filter(m => m.is_available)
    const lockedModels = availableModels.filter(m => !m.is_available)

    return (
        <div className="space-y-4">
            {autoSelectedDefaults && (
                <p className="text-xs text-amber-600">Defaults auto-selected. Save to confirm.</p>
            )}
            
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        {selectedModels.length}/{limit} active
                    </span>
                    <Badge variant="outline" className="text-xs capitalize">
                        {planTier} plan
                    </Badge>
                </div>
                <Button size="sm" onClick={saveModels} disabled={saving}>
                    {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    Save
                </Button>
            </div>

            {/* Available Models */}
            <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Available Models</p>
                <div className="flex flex-wrap gap-2">
                    {accessibleModels.map((model) => {
                        const isActive = selectedModels.includes(model.id)
                        const logo = getModelLogo(model.name, model.provider)
                        return (
                            <button
                                key={model.id}
                                type="button"
                                onClick={() => handleToggleModel(model.id)}
                                className={cn(
                                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
                                    isActive
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                                )}
                            >
                                {isActive && <Check className="h-3 w-3" />}
                                {!isActive && logo && (
                                    <Image src={logo} alt={model.name} width={16} height={16} className="rounded-sm" />
                                )}
                                {model.name}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Locked Models (higher tier) */}
            {lockedModels.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-amber-500" />
                        <p className="text-xs text-muted-foreground font-medium">Upgrade to Unlock</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {lockedModels.map((model) => {
                            const logo = getModelLogo(model.name, model.provider)
                            return (
                            <button
                                key={model.id}
                                type="button"
                                onClick={() => handleToggleModel(model.id)}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border bg-muted/50 text-muted-foreground border-border cursor-not-allowed opacity-60"
                            >
                                <Lock className="h-3 w-3" />
                                {logo && (
                                    <Image src={logo} alt={model.name} width={16} height={16} className="rounded-sm opacity-50" />
                                )}
                                {model.name}
                                <Badge variant="outline" className="text-[10px] ml-1 capitalize">{model.tier}</Badge>
                            </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
