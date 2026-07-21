"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Circle, Settings2, FileText, Zap } from "lucide-react"
import { OpenRouterModelSearch } from "@/components/admin/openrouter-model-search"
import { FlyoutPanel } from "./flyout-panel"
import type { SubAgent, AgentPrompt } from "@/lib/agents/types"

interface SubAgentDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subAgent: SubAgent
  onSave: (subAgent: SubAgent) => Promise<void>
}

type FlyoutTab = "config" | "prompts" | "skills"

export function SubAgentDetailDialog({
  open,
  onOpenChange,
  subAgent,
  onSave,
}: SubAgentDetailDialogProps) {
  const [form, setForm] = useState(subAgent)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<FlyoutTab>("config")

  // Sync form when subAgent changes
  useEffect(() => {
    setForm(subAgent)
    setActiveTab("config")
  }, [subAgent])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(form)
    } finally {
      setIsSaving(false)
    }
  }

  // Helper to update a prompt in the form
  const updatePrompt = (type: "system" | "user", content: string) => {
    const prompts = [...(form.prompts || [])]
    const idx = prompts.findIndex((p) => p.type === type)
    if (idx >= 0) {
      prompts[idx] = { ...prompts[idx], content }
    } else {
      prompts.push({
        id: `new-${type}-${form.id}`,
        type,
        content,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
    setForm({ ...form, prompts })
  }

  const getPromptContent = (type: "system" | "user"): string => {
    return form.prompts?.find((p) => p.type === type)?.content || ""
  }

  const getPromptMeta = (type: "system" | "user") => {
    const prompt = form.prompts?.find((p) => p.type === type)
    const content = prompt?.content || ""
    const isFromDb = prompt?.id ? !prompt.id.startsWith("sys-") && !prompt.id.startsWith("usr-") && !prompt.id.startsWith("new-") : false
    return {
      lines: content ? content.split("\n").length : 0,
      words: content ? content.trim().split(/\s+/).filter(Boolean).length : 0,
      chars: content.length,
      isFromDb,
    }
  }

  // Toggle a skill flag
  const toggleSkillFlag = (skillKey: string) => {
    const flags = [...(form.skill_flags || [])]
    const idx = flags.findIndex((f) => f.skill_key === skillKey)
    if (idx >= 0) {
      flags[idx] = { ...flags[idx], enabled: !flags[idx].enabled }
    }
    setForm({ ...form, skill_flags: flags })
  }

  const TABS: { key: FlyoutTab; label: string; icon: typeof Settings2 }[] = [
    { key: "config", label: "Config", icon: Settings2 },
    { key: "prompts", label: "Prompts", icon: FileText },
    { key: "skills", label: "Skills", icon: Zap },
  ]

  return (
    <FlyoutPanel
      open={open}
      onClose={() => onOpenChange(false)}
      title={form.name}
      subtitle={form.role || undefined}
      width="w-[50vw] min-w-[560px]"
      footer={
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status indicator */}
        <div className="flex items-center gap-2.5">
          <Circle className={`h-2.5 w-2.5 fill-current ${form.enabled ? "text-green-500" : "text-zinc-300"}`} />
          <Badge
            variant="outline"
            className={`text-[11px] ${form.enabled ? "border-green-200 text-green-700" : "text-zinc-400"}`}
          >
            {form.enabled ? "Active" : "Inactive"}
          </Badge>
          <span className="text-[11px] text-zinc-400 font-mono ml-auto">{form.id}</span>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center border-b border-zinc-200 gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 pb-2.5 pt-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Config Tab */}
        {activeTab === "config" && (
          <div className="space-y-6">
            {/* Identity */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider pb-2 border-b border-zinc-100">
                Identity
              </h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm text-zinc-700">Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="role" className="text-sm text-zinc-700">Role</Label>
                  <Input
                    id="role"
                    value={form.role || ""}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    placeholder="e.g., Brand Detection Specialist"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-sm text-zinc-700">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description || ""}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="mt-1.5 min-h-24 resize-y"
                    placeholder="Brief description of this sub-agent's purpose and capabilities..."
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">{(form.description || "").length} characters</p>
                </div>
              </div>
            </div>

            {/* Model Configuration */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider pb-2 border-b border-zinc-100">
                Model Configuration
              </h4>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-zinc-700">Model</Label>
                  <p className="text-[11px] text-zinc-400 mt-0.5 mb-1.5">Search and select from available OpenRouter models</p>
                  <OpenRouterModelSearch
                    value={form.model || ""}
                    onChange={(modelId) => setForm({ ...form, model: modelId })}
                    placeholder="Search OpenRouter models..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="temperature" className="text-sm text-zinc-700">Temperature</Label>
                    <Input
                      id="temperature"
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={form.temperature || 0.7}
                      onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })}
                      className="mt-1.5"
                    />
                    <p className="text-[11px] text-zinc-400 mt-1">0 = deterministic, 2 = creative</p>
                  </div>
                  <div>
                    <Label htmlFor="maxTokens" className="text-sm text-zinc-700">Max Tokens</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      value={form.max_tokens || 4096}
                      onChange={(e) => setForm({ ...form, max_tokens: parseInt(e.target.value) })}
                      className="mt-1.5"
                    />
                    <p className="text-[11px] text-zinc-400 mt-1">Maximum output length</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider pb-2 border-b border-zinc-100">
                Status
              </h4>
              <Select
                value={form.enabled ? "enabled" : "disabled"}
                onValueChange={(value) => setForm({ ...form, enabled: value === "enabled" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enabled">Enabled</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Prompts Tab */}
        {activeTab === "prompts" && (
          <div className="space-y-6">
            <p className="text-sm text-zinc-500">
              Configure the system and user prompts for this sub-agent. These override
              the shared base prompt when set.
            </p>

            {/* System Prompt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-zinc-700 font-semibold">System Prompt</Label>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    getPromptMeta("system").isFromDb
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : getPromptContent("system")
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-zinc-50 text-zinc-400 border border-zinc-200"
                  }`}>
                    {getPromptMeta("system").isFromDb ? "Saved" : getPromptContent("system") ? "Default" : "Empty"}
                  </span>
                </div>
                {getPromptContent("system") && (
                  <span className="text-[11px] text-zinc-400">
                    {getPromptMeta("system").lines} lines &middot; {getPromptMeta("system").chars.toLocaleString()} chars
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400">
                Defines this sub-agent's role, rules, and output format.
              </p>
              <textarea
                value={getPromptContent("system")}
                onChange={(e) => updatePrompt("system", e.target.value)}
                placeholder="You are a specialized brand detection analyst. Your task is to analyze AI-generated text responses..."
                className="w-full min-h-[200px] resize-y rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-[13px] leading-relaxed text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                spellCheck={false}
              />
            </div>

            {/* User Prompt Template */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-zinc-700 font-semibold">User Prompt Template</Label>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    getPromptMeta("user").isFromDb
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : getPromptContent("user")
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-zinc-50 text-zinc-400 border border-zinc-200"
                  }`}>
                    {getPromptMeta("user").isFromDb ? "Saved" : getPromptContent("user") ? "Default" : "Empty"}
                  </span>
                </div>
                {getPromptContent("user") && (
                  <span className="text-[11px] text-zinc-400">
                    {getPromptMeta("user").lines} lines &middot; {getPromptMeta("user").chars.toLocaleString()} chars
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400">
                Template for the user message sent with each request. Use {"{{variables}}"} for dynamic data.
              </p>
              <textarea
                value={getPromptContent("user")}
                onChange={(e) => updatePrompt("user", e.target.value)}
                placeholder={"BRANDS TO DETECT:\n{{brand_list}}\n\nRESPONSE TEXT TO ANALYZE:\n---\n{{response_text}}\n---"}
                className="w-full min-h-[200px] resize-y rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-[13px] leading-relaxed text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                spellCheck={false}
              />
            </div>
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === "skills" && (
          <div className="space-y-6">
            <p className="text-sm text-zinc-500">
              Feature flags that control what capabilities this sub-agent has.
              Disabling a skill will skip it during the analysis pipeline.
            </p>

            {form.skill_flags && form.skill_flags.length > 0 ? (
              <div className="space-y-2">
                {form.skill_flags.map((flag) => (
                  <button
                    key={flag.skill_key}
                    type="button"
                    onClick={() => toggleSkillFlag(flag.skill_key)}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 rounded-lg border text-left transition-colors ${
                      flag.enabled
                        ? "border-zinc-900 bg-zinc-50"
                        : "border-zinc-200 bg-white hover:border-zinc-300"
                    }`}
                  >
                    {/* Toggle */}
                    <div className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                      flag.enabled ? "bg-zinc-900 border-zinc-900" : "border-zinc-300"
                    }`}>
                      {flag.enabled && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-zinc-900">{flag.label}</span>
                        <span className="text-[11px] text-zinc-400 font-mono">{flag.skill_key}</span>
                      </div>
                      {flag.description && (
                        <p className="text-[12px] text-zinc-500 leading-relaxed">{flag.description}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-zinc-200 rounded-lg">
                <Zap className="h-5 w-5 text-zinc-300 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">No skill flags configured for this sub-agent.</p>
                <p className="text-[12px] text-zinc-400 mt-1">
                  Skills are seeded via database migrations.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </FlyoutPanel>
  )
}
