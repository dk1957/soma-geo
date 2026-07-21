"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Zap, ChevronDown, ChevronUp } from "lucide-react"
import type { AgentSystem, SubAgentSkillFlag } from "@/lib/agents/types"

interface SkillsManagerProps {
  system: AgentSystem
  onUpdateSystem: (system: AgentSystem) => void
  searchQuery?: string
}

export function SkillsManager({
  system,
  onUpdateSystem,
  searchQuery = "",
}: SkillsManagerProps) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)

  const subAgents = (system.sub_agents || []).filter((sa) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      sa.name.toLowerCase().includes(q) ||
      (sa.skill_flags || []).some(
        (f) => f.label.toLowerCase().includes(q) || f.skill_key.toLowerCase().includes(q)
      )
    )
  })

  const toggleFlag = (subAgentId: string, skillKey: string) => {
    const updatedSubAgents = (system.sub_agents || []).map((sa) => {
      if (sa.id !== subAgentId) return sa
      const flags = (sa.skill_flags || []).map((f) =>
        f.skill_key === skillKey ? { ...f, enabled: !f.enabled } : f
      )
      return { ...sa, skill_flags: flags }
    })
    onUpdateSystem({ ...system, sub_agents: updatedSubAgents })
  }

  // Compute stats
  const totalFlags = subAgents.reduce((sum, sa) => sum + (sa.skill_flags?.length || 0), 0)
  const enabledFlags = subAgents.reduce(
    (sum, sa) => sum + (sa.skill_flags || []).filter((f) => f.enabled).length,
    0
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          Per-sub-agent feature flags that control analysis capabilities.
        </p>
        <div className="text-[12px] text-zinc-400">
          {enabledFlags}/{totalFlags} enabled
        </div>
      </div>

      {subAgents.length > 0 ? (
        <div className="space-y-2">
          {subAgents.map((sa) => {
            const flags = sa.skill_flags || []
            const enabledCount = flags.filter((f) => f.enabled).length
            const isExpanded = expandedAgent === sa.id

            return (
              <div key={sa.id} className="border border-zinc-200 rounded-lg bg-white overflow-hidden">
                {/* Agent header */}
                <button
                  type="button"
                  onClick={() => setExpandedAgent(isExpanded ? null : sa.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-900">{sa.name}</span>
                    {sa.role && (
                      <span className="text-[11px] text-zinc-400">{sa.role}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={`text-[11px] ${
                        enabledCount === flags.length
                          ? "border-green-200 text-green-700"
                          : enabledCount === 0
                          ? "text-zinc-400"
                          : "border-amber-200 text-amber-700"
                      }`}
                    >
                      {enabledCount}/{flags.length}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-zinc-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-zinc-400" />
                    )}
                  </div>
                </button>

                {/* Expanded skill flags */}
                {isExpanded && flags.length > 0 && (
                  <div className="border-t border-zinc-100 px-4 py-3 space-y-1.5">
                    {flags.map((flag) => (
                      <button
                        key={flag.skill_key}
                        type="button"
                        onClick={() => toggleFlag(sa.id, flag.skill_key)}
                        className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-zinc-50"
                      >
                        {/* Toggle */}
                        <div
                          className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            flag.enabled ? "bg-zinc-900 border-zinc-900" : "border-zinc-300"
                          }`}
                        >
                          {flag.enabled && (
                            <svg
                              className="h-3 w-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
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
                )}

                {isExpanded && flags.length === 0 && (
                  <div className="border-t border-zinc-100 px-4 py-6 text-center">
                    <p className="text-sm text-zinc-400">No skill flags configured.</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Zap className="h-5 w-5 text-zinc-300 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">
            {searchQuery ? "No sub-agents match your search" : "No sub-agents with skill flags"}
          </p>
        </div>
      )}
    </div>
  )
}
