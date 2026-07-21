"use client"

/**
 * PipelineConfigEditor — Admin UI for editing content pipeline configuration
 * Content types, optimization strategies, and execution settings
 * Only shown for the "content" system in admin agent-config
 */

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  FileText,
  Zap,
  Settings2,
  Save,
  RotateCcw,
  GripVertical,
} from "lucide-react"
import type { AgentSystem, ContentPipelineConfig } from "@/lib/agents/types"

interface PipelineConfigEditorProps {
  system: AgentSystem
  onUpdateSystem: (system: AgentSystem) => void
}

export function PipelineConfigEditor({ system, onUpdateSystem }: PipelineConfigEditorProps) {
  const initialConfig = system.pipeline_config
  const [config, setConfig] = useState<ContentPipelineConfig | undefined>(initialConfig)
  const [hasChanges, setHasChanges] = useState(false)

  if (!config) {
    return (
      <div className="text-center py-12 text-zinc-400">
        <Settings2 className="h-8 w-8 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Pipeline configuration is not available for this system.</p>
      </div>
    )
  }

  const markChanged = () => setHasChanges(true)

  const handleContentTypeToggle = (idx: number) => {
    const updated = { ...config }
    updated.content_types = [...updated.content_types]
    updated.content_types[idx] = { ...updated.content_types[idx], enabled: !updated.content_types[idx].enabled }
    setConfig(updated)
    markChanged()
  }

  const handleStrategyToggle = (idx: number) => {
    const updated = { ...config }
    updated.optimization_strategies = [...updated.optimization_strategies]
    updated.optimization_strategies[idx] = { ...updated.optimization_strategies[idx], enabled: !updated.optimization_strategies[idx].enabled }
    setConfig(updated)
    markChanged()
  }

  const handleExecutionSettingChange = (key: string, value: number) => {
    const updated = { ...config }
    updated.execution_settings = { ...updated.execution_settings }
    ;(updated.execution_settings as any)[key] = {
      ...(updated.execution_settings as any)[key],
      value,
    }
    setConfig(updated)
    markChanged()
  }

  const handleSave = () => {
    onUpdateSystem({
      ...system,
      pipeline_config: config,
    })
    setHasChanges(false)
  }

  const handleReset = () => {
    setConfig(initialConfig)
    setHasChanges(false)
  }

  return (
    <div className="space-y-8">
      {/* Save bar */}
      {hasChanges && (
        <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 font-medium">Unsaved changes</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {/* Content Types */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-4 w-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-900">Content Types</h3>
          <Badge variant="secondary" className="text-[10px]">
            {config.content_types.filter(t => t.enabled).length} / {config.content_types.length} enabled
          </Badge>
        </div>
        <div className="grid gap-2">
          {config.content_types.map((ct, idx) => (
            <div
              key={ct.value}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                ct.enabled ? "border-zinc-200 bg-white" : "border-zinc-100 bg-zinc-50 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <GripVertical className="h-3.5 w-3.5 text-zinc-300" />
                <div>
                  <p className="text-sm font-medium text-zinc-900">{ct.label}</p>
                  {ct.description && (
                    <p className="text-xs text-zinc-500">{ct.description}</p>
                  )}
                </div>
              </div>
              <Switch
                checked={ct.enabled}
                onCheckedChange={() => handleContentTypeToggle(idx)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Optimization Strategies */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-900">Optimization Strategies</h3>
          <Badge variant="secondary" className="text-[10px]">
            {config.optimization_strategies.filter(s => s.enabled).length} / {config.optimization_strategies.length} enabled
          </Badge>
        </div>
        <div className="grid gap-2">
          {config.optimization_strategies.map((s, idx) => (
            <div
              key={s.value}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                s.enabled ? "border-zinc-200 bg-white" : "border-zinc-100 bg-zinc-50 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <GripVertical className="h-3.5 w-3.5 text-zinc-300" />
                <div>
                  <p className="text-sm font-medium text-zinc-900">{s.label}</p>
                  <p className="text-xs text-zinc-500">
                    {s.description} · <span className="text-zinc-400">{s.time_estimate}</span>
                  </p>
                </div>
              </div>
              <Switch
                checked={s.enabled}
                onCheckedChange={() => handleStrategyToggle(idx)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Execution Settings */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="h-4 w-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-900">Execution Settings</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(config.execution_settings).map(([key, setting]) => (
            <div key={key} className="p-3 rounded-lg border border-zinc-200 bg-white">
              <Label className="text-xs font-medium text-zinc-700 capitalize">
                {key.replace(/_/g, " ")}
              </Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="number"
                  min={setting.min}
                  max={setting.max}
                  step={key === "convergence_threshold" ? 0.1 : 1}
                  value={setting.value}
                  onChange={(e) => handleExecutionSettingChange(key, Number(e.target.value))}
                  className="h-8 text-sm"
                />
                <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                  {setting.min}–{setting.max}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">{setting.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
