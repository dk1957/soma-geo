"use client"

import { useState, useEffect } from "react"
import {
  Save, Loader2, RefreshCw, Bot, Sparkles, BarChart3,
  Search, Target, Layers, Activity, FileText, Settings,
  ChevronRight, Puzzle, AlertCircle, Eye, Plus, Trash2, Pencil, X, Check
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/layout/notification-toast"
import { OpenRouterModelSearch } from "./openrouter-model-search"

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface AgentConfig {
  agent_type: string
  model_id: string
  provider: 'openai' | 'groq' | 'openrouter'
  temperature: number
  max_tokens: number
  is_active: boolean
}

interface SubAgentDef {
  key: string
  name: string
  role: string
  pipelineOrder: number
  icon: typeof Bot
  defaultModel: string
  defaultTemp: number
  defaultTokens: number
}

interface DBSkill {
  id: string
  agent_system: string
  skill_key: string
  name: string
  description: string
  is_enabled: boolean
  sort_order: number
}

interface ExecSetting {
  key: string
  label: string
  description: string
  defaultValue: number
  min: number
  max: number
  step: number
}

interface AgentSystemDef {
  key: string
  name: string
  codename: string
  type: 'multi_agent'
  status: 'active' | 'draft'
  statusLabel: string
  description: string
  icon: typeof Bot
  color: string
  bg: string
  borderColor: string
  subAgents: SubAgentDef[]
  execution: ExecSetting[]
}

// ═══════════════════════════════════════════════════════════════
// Agent System Definitions
// ═══════════════════════════════════════════════════════════════

const AGENT_SYSTEMS: AgentSystemDef[] = [
  {
    key: 'content',
    name: 'Content Agent',
    codename: 'MACO',
    type: 'multi_agent',
    status: 'active',
    statusLabel: 'Connected',
    description: 'Multi-Agent Content Optimization system. Iteratively evaluates, analyzes, edits, and selects the best content version to maximize AI search visibility using a 4-agent pipeline.',
    icon: Layers,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    borderColor: 'border-blue-200',
    subAgents: [
      {
        key: 'maco_evaluator',
        name: 'Evaluator',
        role: 'Scores content across 6 GSEO dimensions: citation prominence, attribution accuracy, faithfulness, key info coverage, semantic contribution, and answer dominance.',
        pipelineOrder: 1,
        icon: BarChart3,
        defaultModel: 'meta-llama/llama-3.3-70b-instruct',
        defaultTemp: 0.1,
        defaultTokens: 2000,
      },
      {
        key: 'maco_analyst',
        name: 'Analyst',
        role: 'Diagnoses weaknesses in content performance, identifies improvement opportunities, and recommends specific optimization strategies prioritized by impact.',
        pipelineOrder: 2,
        icon: Search,
        defaultModel: 'meta-llama/llama-3.3-70b-instruct',
        defaultTemp: 0.6,
        defaultTokens: 2000,
      },
      {
        key: 'maco_editor',
        name: 'Editor',
        role: 'Implements surgical content revisions based on analyst recommendations. Preserves brand voice and tone while optimizing for AI visibility.',
        pipelineOrder: 3,
        icon: FileText,
        defaultModel: 'meta-llama/llama-3.3-70b-instruct',
        defaultTemp: 0.3,
        defaultTokens: 2000,
      },
      {
        key: 'maco_selector',
        name: 'Selector',
        role: 'Analyzes the full optimization trajectory across all iterations. Selects the best content version based on score stability, quality, and convergence.',
        pipelineOrder: 4,
        icon: Target,
        defaultModel: 'meta-llama/llama-3.3-70b-instruct',
        defaultTemp: 0.2,
        defaultTokens: 2000,
      },
    ],
    execution: [
      { key: 'max_iterations', label: 'Max Iterations', description: 'Maximum optimization cycles before stopping', defaultValue: 10, min: 1, max: 25, step: 1 },
      { key: 'convergence_threshold', label: 'Convergence Threshold', description: 'Score variance below which optimization stops', defaultValue: 0.5, min: 0.1, max: 2.0, step: 0.1 },
      { key: 'plateau_window', label: 'Plateau Window', description: 'Iterations to detect score plateau', defaultValue: 3, min: 2, max: 10, step: 1 },
      { key: 'num_queries', label: 'Evaluation Queries', description: 'Benchmark queries per evaluation cycle', defaultValue: 10, min: 3, max: 25, step: 1 },
    ],
  },
  {
    key: 'analysis',
    name: 'Analysis Agent',
    codename: 'ARIA',
    type: 'multi_agent',
    status: 'draft',
    statusLabel: 'Draft',
    description: 'AI Response Intelligence & Analysis system. Parses LLM responses, detects brand mentions, calculates visibility metrics, and generates actionable insights. Ready to plug in when the analysis pipeline is built.',
    icon: Activity,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    subAgents: [
      {
        key: 'analysis_parser',
        name: 'Response Parser',
        role: 'Parses raw LLM responses into structured data. Extracts sections, identifies entities, normalizes response format, and prepares clean input for downstream analysis agents.',
        pipelineOrder: 1,
        icon: FileText,
        defaultModel: 'meta-llama/llama-3.3-70b-instruct',
        defaultTemp: 0.1,
        defaultTokens: 2000,
      },
      {
        key: 'analysis_brand_detector',
        name: 'Brand Detector',
        role: 'Detects explicit and implicit brand mentions in responses. Classifies mention type (recommended, compared, cited, background) and determines position prominence.',
        pipelineOrder: 2,
        icon: Search,
        defaultModel: 'meta-llama/llama-3.3-70b-instruct',
        defaultTemp: 0.1,
        defaultTokens: 2000,
      },
      {
        key: 'analysis_scorer',
        name: 'Metrics Scorer',
        role: 'Calculates composite visibility scores from parsed data. Computes mention frequency, position weighting, sentiment scores, competitive share-of-voice, and citation quality metrics.',
        pipelineOrder: 3,
        icon: BarChart3,
        defaultModel: 'meta-llama/llama-3.3-70b-instruct',
        defaultTemp: 0.1,
        defaultTokens: 2000,
      },
      {
        key: 'analysis_reporter',
        name: 'Insight Reporter',
        role: 'Synthesizes analysis results into actionable insights. Generates improvement recommendations, identifies emerging trends, and produces structured reports for dashboard display.',
        pipelineOrder: 4,
        icon: Sparkles,
        defaultModel: 'meta-llama/llama-3.3-70b-instruct',
        defaultTemp: 0.3,
        defaultTokens: 3000,
      },
    ],
    execution: [
      { key: 'batch_size', label: 'Batch Size', description: 'Responses to analyze per batch', defaultValue: 50, min: 10, max: 200, step: 10 },
      { key: 'max_retries', label: 'Max Retries', description: 'Retry count for failed analysis calls', defaultValue: 3, min: 1, max: 10, step: 1 },
      { key: 'timeout_ms', label: 'Timeout (ms)', description: 'Maximum time per analysis call', defaultValue: 30000, min: 5000, max: 120000, step: 5000 },
      { key: 'parallel_workers', label: 'Parallel Workers', description: 'Concurrent analysis tasks', defaultValue: 5, min: 1, max: 20, step: 1 },
    ],
  },
]

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════

export function AgentConfigManager() {
  const { addToast } = useToast()
  const [activeSystemKey, setActiveSystemKey] = useState('content')
  const [configs, setConfigs] = useState<Record<string, AgentConfig>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [dbSkills, setDbSkills] = useState<DBSkill[]>([])
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ name: string; description: string }>({ name: '', description: '' })
  const [addingSkill, setAddingSkill] = useState(false)
  const [newSkill, setNewSkill] = useState({ skill_key: '', name: '', description: '' })
  const [execValues, setExecValues] = useState<Record<string, number>>({})

  const activeSystem = AGENT_SYSTEMS.find(s => s.key === activeSystemKey)!
  const activeSkills = dbSkills.filter(s => s.agent_system === activeSystemKey)

  useEffect(() => {
    loadConfigs()
    loadSkills()
  }, [])

  const loadSkills = async () => {
    try {
      const response = await fetch('/api/admin/config/agent-skills')
      const result = await response.json()
      if (result.success && result.data) {
        setDbSkills(result.data)
      }
    } catch (error) {
      console.error('Error loading skills:', error)
    }
  }

  const loadConfigs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/config/agents')
      const result = await response.json()
      if (result.success && result.data) {
        const configMap: Record<string, AgentConfig> = {}
        for (const c of result.data) {
          configMap[c.agent_type] = {
            agent_type: c.agent_type,
            model_id: c.model_id || '',
            provider: c.provider || 'openrouter',
            temperature: Number(c.temperature) || 0.1,
            max_tokens: c.max_tokens || 2000,
            is_active: c.is_active ?? true,
          }
        }
        setConfigs(configMap)
      }
    } catch (error) {
      console.error('Error loading agent configs:', error)
      addToast({ type: "error", title: "Error", message: "Failed to load agent configs" })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const configsToSave = Object.values(configs).filter(c => c.model_id)
      const response = await fetch('/api/admin/config/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: configsToSave })
      })
      const result = await response.json()
      if (result.success) {
        addToast({ type: "success", title: "Saved", message: "Agent configurations updated" })
        setHasChanges(false)
        loadConfigs()
      } else {
        addToast({ type: "error", title: "Error", message: "Failed to save configurations" })
      }
    } catch (error) {
      addToast({ type: "error", title: "Error", message: "Failed to save configurations" })
    } finally {
      setSaving(false)
    }
  }

  const getConfig = (agentKey: string): AgentConfig => {
    if (configs[agentKey]) return configs[agentKey]
    const sub = AGENT_SYSTEMS.flatMap(s => s.subAgents).find(s => s.key === agentKey)
    return {
      agent_type: agentKey,
      model_id: sub?.defaultModel || '',
      provider: 'openrouter',
      temperature: sub?.defaultTemp || 0.1,
      max_tokens: sub?.defaultTokens || 2000,
      is_active: true,
    }
  }

  const updateConfig = (agentKey: string, updates: Partial<AgentConfig>) => {
    setConfigs(prev => ({
      ...prev,
      [agentKey]: { ...getConfig(agentKey), ...prev[agentKey], ...updates }
    }))
    setHasChanges(true)
  }

  const toggleSkillEnabled = async (skill: DBSkill) => {
    try {
      const response = await fetch('/api/admin/config/agent-skills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: skill.id, is_enabled: !skill.is_enabled })
      })
      const result = await response.json()
      if (result.success) {
        setDbSkills(prev => prev.map(s => s.id === skill.id ? { ...s, is_enabled: !s.is_enabled } : s))
      }
    } catch (error) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to toggle skill' })
    }
  }

  const startEditSkill = (skill: DBSkill) => {
    setEditingSkillId(skill.id)
    setEditForm({ name: skill.name, description: skill.description })
  }

  const saveEditSkill = async (skill: DBSkill) => {
    try {
      const response = await fetch('/api/admin/config/agent-skills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: skill.id, name: editForm.name, description: editForm.description })
      })
      const result = await response.json()
      if (result.success) {
        setDbSkills(prev => prev.map(s => s.id === skill.id ? { ...s, name: editForm.name, description: editForm.description } : s))
        setEditingSkillId(null)
        addToast({ type: 'success', title: 'Updated', message: 'Skill updated' })
      }
    } catch (error) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to update skill' })
    }
  }

  const deleteSkill = async (skill: DBSkill) => {
    try {
      const response = await fetch(`/api/admin/config/agent-skills?id=${skill.id}`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        setDbSkills(prev => prev.filter(s => s.id !== skill.id))
        addToast({ type: 'success', title: 'Deleted', message: 'Skill removed' })
      }
    } catch (error) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to delete skill' })
    }
  }

  const addNewSkill = async () => {
    if (!newSkill.skill_key || !newSkill.name) return
    try {
      const response = await fetch('/api/admin/config/agent-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_system: activeSystemKey,
          skill_key: newSkill.skill_key,
          name: newSkill.name,
          description: newSkill.description,
          is_enabled: true,
          sort_order: activeSkills.length,
        })
      })
      const result = await response.json()
      if (result.success && result.data) {
        setDbSkills(prev => [...prev, result.data])
        setNewSkill({ skill_key: '', name: '', description: '' })
        setAddingSkill(false)
        addToast({ type: 'success', title: 'Added', message: 'New skill created' })
      } else if (response.status === 409) {
        addToast({ type: 'error', title: 'Duplicate', message: 'A skill with this key already exists' })
      }
    } catch (error) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to add skill' })
    }
  }

  const getExecValue = (systemKey: string, settingKey: string, defaultValue: number) => {
    return execValues[`${systemKey}_${settingKey}`] ?? defaultValue
  }

  const updateExecValue = (systemKey: string, settingKey: string, value: number) => {
    setExecValues(prev => ({ ...prev, [`${systemKey}_${settingKey}`]: value }))
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
  }

  const allSubAgents = AGENT_SYSTEMS.flatMap(s => s.subAgents)
  const configuredCount = allSubAgents.filter(sa => configs[sa.key]?.model_id && configs[sa.key]?.is_active).length

  return (
    <div className="space-y-6">
      {/* Context Banner */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-zinc-900 p-2 shrink-0"><Bot className="h-4 w-4 text-white" /></div>
          <div>
            <h3 className="font-medium text-zinc-900 text-sm">Agent Systems</h3>
            <p className="text-sm text-zinc-500 mt-1">
              Agent systems are orchestrated AI pipelines that coordinate multiple specialized sub-agents.
              Each sub-agent has its own LLM model, temperature, and role — working together
              to accomplish complex tasks like content optimization and response analysis.
            </p>
            <div className="flex items-center gap-2 mt-3 text-xs text-zinc-400 flex-wrap">
              {AGENT_SYSTEMS.map((sys, i) => (
                <span key={sys.key} className="flex items-center gap-1">
                  {i > 0 && <span className="text-zinc-300 mr-1">·</span>}
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-zinc-600 ${sys.bg}`}>
                    {sys.name} <span className="ml-1 font-medium text-zinc-900">{sys.subAgents.length}</span>
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main layout: sidebar + detail panel */}
      <div className="flex gap-4">
        {/* Left sidebar */}
        <div className="w-56 shrink-0 space-y-2 sticky top-4 self-start">
          {AGENT_SYSTEMS.map(system => {
            const SystemIcon = system.icon
            const isActive = activeSystemKey === system.key
            const activeCount = system.subAgents.filter(sa => configs[sa.key]?.is_active).length

            return (
              <button
                key={system.key}
                onClick={() => setActiveSystemKey(system.key)}
                className={`w-full text-left rounded-lg border p-3 transition-all ${
                  isActive
                    ? 'border-zinc-900 bg-zinc-900 text-white'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <SystemIcon className={`h-4 w-4 ${isActive ? 'text-white' : system.color}`} />
                  <span className="text-sm font-medium">{system.name}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[10px] ${isActive ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {system.codename}
                  </span>
                  <span className={`text-[10px] ${isActive ? 'text-zinc-500' : 'text-zinc-400'}`}>·</span>
                  <Badge
                    variant={isActive ? "outline" : "secondary"}
                    className={`text-[9px] px-1.5 py-0 ${
                      system.status === 'active'
                        ? isActive ? 'border-green-500 text-green-300' : 'bg-green-50 text-green-700 border-green-200'
                        : isActive ? 'border-zinc-600 text-zinc-400' : 'bg-zinc-100 text-zinc-500'
                    }`}
                  >
                    {system.statusLabel}
                  </Badge>
                </div>
                <div className={`text-[10px] mt-1 ${isActive ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {system.subAgents.length} sub-agents{activeCount > 0 ? ` · ${activeCount} active` : ''}
                </div>
              </button>
            )
          })}

          <div className="pt-2 space-y-2">
            <Button variant="outline" size="sm" onClick={loadConfigs} disabled={loading} className="w-full text-xs">
              <RefreshCw className={`h-3 w-3 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {hasChanges && (
              <Button onClick={handleSave} disabled={saving} size="sm" className="w-full text-xs">
                {saving ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Save className="h-3 w-3 mr-1.5" />}
                Save All
              </Button>
            )}
          </div>
        </div>

        {/* Right detail panel */}
        <div className="flex-1 space-y-6">
          {/* System Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`rounded-md p-2 ${activeSystem.bg}`}>
                <activeSystem.icon className={`h-4 w-4 ${activeSystem.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm text-zinc-900">{activeSystem.name}</h3>
                  <Badge variant="outline" className="text-[10px] py-0">{activeSystem.codename}</Badge>
                  <Badge variant="outline" className={`text-[10px] py-0 ${
                    activeSystem.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'text-zinc-500'
                  }`}>
                    {activeSystem.statusLabel}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] py-0 text-zinc-400">Multi-Agent</Badge>
                </div>
                <p className="text-xs text-zinc-500 mt-1 max-w-2xl leading-relaxed">{activeSystem.description}</p>
              </div>
            </div>
          </div>

          {/* Draft Banner */}
          {activeSystem.status === 'draft' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-800">Draft — Not connected to runtime</p>
                <p className="text-[11px] text-amber-600 mt-0.5">This agent system is being designed. Configure sub-agents and skills now — they will take effect once the analysis pipeline is built and wired.</p>
              </div>
            </div>
          )}

          {/* Pipeline Visualization */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Eye className="h-3 w-3 text-zinc-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Pipeline</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {activeSystem.subAgents.map((sub, i) => {
                const SubIcon = sub.icon
                const config = getConfig(sub.key)
                const isConfigured = !!configs[sub.key]?.model_id

                return (
                  <div key={sub.key} className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs ${
                      config.is_active
                        ? isConfigured
                          ? `${activeSystem.bg} ${activeSystem.borderColor} ${activeSystem.color}`
                          : 'bg-white border-zinc-200 text-zinc-700'
                        : 'bg-zinc-100 border-zinc-200 text-zinc-400'
                    }`}>
                      <span className="text-[10px] font-medium text-zinc-400">{sub.pipelineOrder}.</span>
                      <SubIcon className="h-3 w-3" />
                      <span className="font-medium">{sub.name}</span>
                    </div>
                    {i < activeSystem.subAgents.length - 1 && (
                      <ChevronRight className="h-3 w-3 text-zinc-300 shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sub-Agent Cards */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Bot className="h-3 w-3 text-zinc-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Sub-Agents</span>
              <span className="text-[10px] text-zinc-300 ml-1">{activeSystem.subAgents.length} in pipeline</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {activeSystem.subAgents.map(sub => {
                const config = getConfig(sub.key)
                const SubIcon = sub.icon

                return (
                  <Card key={sub.key} className={!config.is_active ? 'opacity-50' : ''}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <SubIcon className={`h-3.5 w-3.5 ${activeSystem.color}`} />
                            <h4 className="text-sm font-medium text-zinc-900">{sub.name}</h4>
                            <Badge variant="outline" className="text-[9px] py-0 text-zinc-400">
                              #{sub.pipelineOrder}
                            </Badge>
                          </div>
                          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{sub.role}</p>
                        </div>
                        <Switch
                          checked={config.is_active}
                          onCheckedChange={(checked) => updateConfig(sub.key, { is_active: checked })}
                          className="shrink-0 ml-2"
                        />
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div className="col-span-2 space-y-1">
                          <Label className="text-[10px] text-zinc-400">Model</Label>
                          <OpenRouterModelSearch
                            value={config.model_id}
                            onChange={(modelId) => updateConfig(sub.key, { model_id: modelId })}
                            placeholder={sub.defaultModel}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-zinc-400">Temp</Label>
                          <Input
                            type="number" step="0.1" min="0" max="2"
                            value={config.temperature}
                            onChange={(e) => updateConfig(sub.key, { temperature: parseFloat(e.target.value) || 0 })}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-zinc-400">Max Tokens</Label>
                          <Input
                            type="number" step="500" min="500" max="16000"
                            value={config.max_tokens}
                            onChange={(e) => updateConfig(sub.key, { max_tokens: parseInt(e.target.value) || 2000 })}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Skills */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Puzzle className="h-3 w-3 text-zinc-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Skills</span>
                <span className="text-[10px] text-zinc-300 ml-1">
                  {activeSkills.filter(s => s.is_enabled).length} of {activeSkills.length} enabled
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-[10px] h-6 px-2"
                onClick={() => { setAddingSkill(true); setNewSkill({ skill_key: '', name: '', description: '' }) }}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Skill
              </Button>
            </div>

            {addingSkill && (
              <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 mb-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-zinc-400">Key (unique identifier)</Label>
                    <Input
                      value={newSkill.skill_key}
                      onChange={(e) => setNewSkill(prev => ({ ...prev, skill_key: e.target.value }))}
                      placeholder="e.g. my_skill"
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-zinc-400">Name</Label>
                    <Input
                      value={newSkill.name}
                      onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. My New Skill"
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-zinc-400">Description</Label>
                  <Input
                    value={newSkill.description}
                    onChange={(e) => setNewSkill(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What does this skill do?"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setAddingSkill(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" className="h-6 text-[10px] px-2" onClick={addNewSkill} disabled={!newSkill.skill_key || !newSkill.name}>
                    <Check className="h-3 w-3 mr-1" /> Create
                  </Button>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-zinc-200 divide-y divide-zinc-100">
              {activeSkills.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-zinc-400">No skills configured for this system.</div>
              )}
              {activeSkills.map(skill => (
                <div key={skill.id} className="flex items-start justify-between px-4 py-3 group">
                  <div className="min-w-0 mr-3 flex-1">
                    {editingSkillId === skill.id ? (
                      <div className="space-y-1.5">
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          className="h-7 text-xs font-medium"
                        />
                        <Input
                          value={editForm.description}
                          onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                          className="h-7 text-[11px]"
                        />
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5" onClick={() => setEditingSkillId(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                          <Button size="sm" className="h-5 text-[10px] px-1.5" onClick={() => saveEditSkill(skill)}>
                            <Check className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          <div className="text-xs font-medium text-zinc-900">{skill.name}</div>
                          <span className="text-[9px] font-mono text-zinc-300">{skill.skill_key}</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{skill.description}</p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    {editingSkillId !== skill.id && (
                      <>
                        <button
                          onClick={() => startEditSkill(skill)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-zinc-100"
                        >
                          <Pencil className="h-3 w-3 text-zinc-400" />
                        </button>
                        <button
                          onClick={() => deleteSkill(skill)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3 text-zinc-400 hover:text-red-500" />
                        </button>
                      </>
                    )}
                    <Switch
                      checked={skill.is_enabled}
                      onCheckedChange={() => toggleSkillEnabled(skill)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Execution Settings */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Settings className="h-3 w-3 text-zinc-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Execution</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {activeSystem.execution.map(setting => (
                <div key={setting.key} className="rounded-lg border border-zinc-200 p-3 space-y-1.5">
                  <Label className="text-[10px] text-zinc-400">{setting.label}</Label>
                  <Input
                    type="number"
                    value={getExecValue(activeSystemKey, setting.key, setting.defaultValue)}
                    onChange={(e) => updateExecValue(activeSystemKey, setting.key, parseFloat(e.target.value) || setting.defaultValue)}
                    min={setting.min}
                    max={setting.max}
                    step={setting.step}
                    className="h-8 text-xs"
                  />
                  <p className="text-[10px] text-zinc-400 leading-relaxed">{setting.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
