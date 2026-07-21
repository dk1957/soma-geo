"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, Circle, Bot, Settings, Zap, Clock, TrendingUp } from "lucide-react"
import type { AgentSystem } from "@/lib/agents/types"

const SYSTEM_ICONS: Record<string, typeof Bot> = {
  content: Bot,
  analysis: Settings,
}

// Placeholder metrics per system — replace with real analytics data
const SYSTEM_METRICS: Record<string, { runs: number; successRate: number; avgLatencyMs: number; lastRun: string }> = {
  content: { runs: 840, successRate: 97.5, avgLatencyMs: 2800, lastRun: "3m ago" },
  analysis: { runs: 410, successRate: 99.1, avgLatencyMs: 1900, lastRun: "5m ago" },
}

interface AgentSystemsListProps {
  systems: AgentSystem[]
  systemStats: Array<{ id: string; subAgentCount: number; activeSubAgents: number }>
  onSelectSystem: (systemId: string) => void
  isLoading?: boolean
}

export function AgentSystemsList({
  systems,
  systemStats,
  onSelectSystem,
  isLoading,
}: AgentSystemsListProps) {
  const totalSubAgents = systemStats.reduce((sum, s) => sum + s.subAgentCount, 0)
  const totalActive = systemStats.reduce((sum, s) => sum + s.activeSubAgents, 0)
  const totalRuns = Object.values(SYSTEM_METRICS).reduce((s, m) => s + m.runs, 0)
  const avgSuccess = Object.values(SYSTEM_METRICS).reduce((s, m) => s + m.successRate, 0) / Math.max(Object.keys(SYSTEM_METRICS).length, 1)

  return (
    <div className="space-y-8">
      {/* Page intro + global summary */}
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-base font-semibold text-zinc-900">Overview</h3>
          <p className="text-sm text-zinc-500 mt-1">
            {systems.length} agent system{systems.length !== 1 ? "s" : ""} configured
            <span className="mx-1.5 text-zinc-300">&middot;</span>
            {totalActive} of {totalSubAgents} sub-agents active
          </p>
        </div>
        <div className="flex items-center gap-6 text-right">
          <div>
            <p className="text-lg font-bold text-zinc-900 tabular-nums">{totalRuns.toLocaleString()}</p>
            <p className="text-[11px] text-zinc-400">total runs</p>
          </div>
          <div>
            <p className="text-lg font-bold text-zinc-900 tabular-nums">{avgSuccess.toFixed(1)}%</p>
            <p className="text-[11px] text-zinc-400">avg success</p>
          </div>
        </div>
      </div>

      {/* System Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {systems.map((system) => {
          const stat = systemStats.find((s) => s.id === system.id)
          const Icon = SYSTEM_ICONS[system.id] || Bot
          const metrics = SYSTEM_METRICS[system.id]

          return (
            <Card
              key={system.id}
              className="group cursor-pointer transition-colors hover:border-zinc-300 border border-zinc-200"
              onClick={() => onSelectSystem(system.id)}
            >
              <div className="p-5 space-y-4">
                {/* Title row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-zinc-100 flex items-center justify-center">
                      <Icon className="h-[18px] w-[18px] text-zinc-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-900 leading-tight">{system.name}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5 font-mono">{system.codename}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={system.enabled ? "default" : "secondary"}
                      className={`text-[11px] ${system.enabled ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-50" : ""}`}
                    >
                      {system.enabled ? "Active" : "Disabled"}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                  </div>
                </div>

                {/* Description */}
                {system.description && (
                  <p className="text-sm text-zinc-600 leading-relaxed">{system.description}</p>
                )}

                {/* Performance metrics row */}
                {metrics && (
                  <div className="flex items-center gap-5 py-2.5 px-3 rounded-lg bg-zinc-50 border border-zinc-100">
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-xs font-semibold text-zinc-900 tabular-nums">{metrics.runs.toLocaleString()}</span>
                      <span className="text-[11px] text-zinc-400">runs</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-xs font-semibold text-zinc-900 tabular-nums">{metrics.successRate}%</span>
                      <span className="text-[11px] text-zinc-400">success</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs font-semibold text-zinc-900 tabular-nums">{(metrics.avgLatencyMs / 1000).toFixed(1)}s</span>
                      <span className="text-[11px] text-zinc-400">avg</span>
                    </div>
                    <span className="ml-auto text-[11px] text-zinc-400">{metrics.lastRun}</span>
                  </div>
                )}

                {/* Sub-agents preview */}
                {system.sub_agents && system.sub_agents.length > 0 && (
                  <div className="pt-3 border-t border-zinc-100">
                    <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2.5">
                      Sub-Agents ({stat?.activeSubAgents}/{stat?.subAgentCount})
                    </p>
                    <div className="space-y-1.5">
                      {system.sub_agents.map((sa) => (
                        <div key={sa.id} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <Circle className={`h-1.5 w-1.5 fill-current ${sa.enabled ? "text-green-500" : "text-zinc-300"}`} />
                            <span className={sa.enabled ? "text-zinc-700" : "text-zinc-400"}>{sa.name}</span>
                          </span>
                          <span className="text-xs text-zinc-400 font-mono">{sa.model?.split("/").pop() || "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
