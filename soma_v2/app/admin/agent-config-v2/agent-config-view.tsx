"use client"

import { useEffect, useState, useTransition, useMemo } from "react"
import {
  Bot,
  RefreshCw,
  Settings,
  Circle,
} from "lucide-react"
import { AdminShell } from "../components/admin-shell"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/layout/notification-toast"
import type { AgentSystem, SubAgent } from "@/lib/agents/types"
import { AgentSystemsList } from "./components/agent-systems-list"
import { AgentSystemDetail } from "./components/agent-system-detail"

type SectionView = "systems" | "system-detail"

const AGENT_SYSTEMS_NAV = [
  { id: "content", label: "Content Agent", icon: Bot },
  { id: "analysis", label: "Analysis Agent", icon: Settings },
]

interface AgentConfigViewProps {
  userEmail?: string
}

export function AgentConfigView({ userEmail }: AgentConfigViewProps) {
  const { addToast, ToastContainer } = useToast()
  const [currentView, setCurrentView] = useState<SectionView>("systems")
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null)
  const [agentSystems, setAgentSystems] = useState<AgentSystem[]>([])
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState("")

  // Load agent systems on mount
  useEffect(() => {
    refreshSystems()
  }, [])

  const refreshSystems = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/agent-config/systems", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load agent systems")
        const data = await res.json()
        setAgentSystems(data.systems || [])
      } catch (error) {
        addToast({
          type: "error",
          title: "Load failed",
          message: error instanceof Error ? error.message : "Unable to load agent systems.",
        })
      }
    })
  }

  const currentSystem = selectedSystemId
    ? agentSystems.find((s) => s.id === selectedSystemId)
    : null

  const systemStats = useMemo(() => {
    return agentSystems.map((system) => ({
      id: system.id,
      subAgentCount: system.sub_agents?.length || 0,
      activeSubAgents: system.sub_agents?.filter((sa) => sa.enabled)?.length || 0,
    }))
  }, [agentSystems])

  const handleViewSystem = (systemId: string) => {
    setSelectedSystemId(systemId)
    setCurrentView("system-detail")
  }

  const handleBackToSystems = () => {
    setCurrentView("systems")
    setSelectedSystemId(null)
  }

  const handleUpdateSystem = (updatedSystem: AgentSystem) => {
    setAgentSystems((prev) =>
      prev.map((s) => (s.id === updatedSystem.id ? updatedSystem : s))
    )
  }

  return (
    <>
      <AdminShell
        userEmail={userEmail}
        activeTab="agents"
        title={
          <h2 className="text-lg font-semibold text-zinc-900">
            {currentView === "systems" ? "Agent Configuration" : currentSystem?.name || "Agent System"}
          </h2>
        }
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search agent systems or sub-agents..."
        headerActions={
          <Button variant="outline" size="sm" onClick={refreshSystems} disabled={isPending}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      >
        <div className="flex gap-0 -m-6">
          {/* Agent Systems Nav */}
          <nav className="w-52 shrink-0 border-r border-zinc-200 bg-zinc-50/40 min-h-[calc(100vh-4rem)]">
            <div className="sticky top-0 px-3 pt-5 pb-3">
              <p className="px-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Agent Systems
              </p>
              <div className="space-y-1">
                {agentSystems.map((system) => {
                  const isActive = selectedSystemId === system.id && currentView === "system-detail"
                  const stat = systemStats.find((s) => s.id === system.id)
                  const navItem = AGENT_SYSTEMS_NAV.find((n) => n.id === system.id)
                  const Icon = navItem?.icon || Bot

                  return (
                    <button
                      key={system.id}
                      onClick={() => handleViewSystem(system.id)}
                      className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isActive
                          ? "bg-white text-zinc-900 border border-zinc-200"
                          : "text-zinc-600 hover:bg-white/60 hover:text-zinc-900"
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-zinc-900" : "text-zinc-400"}`} />
                        <span className="font-medium truncate">{system.name}</span>
                      </span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        <Circle className={`h-1.5 w-1.5 fill-current ${system.enabled ? "text-green-500" : "text-zinc-300"}`} />
                        <span className="text-xs tabular-nums text-zinc-400">{stat?.subAgentCount}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </nav>

          {/* Content Area */}
          <div className="flex-1 min-w-0 p-6">
            {currentView === "systems" && (
              <AgentSystemsList
                systems={agentSystems}
                systemStats={systemStats}
                onSelectSystem={handleViewSystem}
                isLoading={isPending}
              />
            )}

            {currentView === "system-detail" && currentSystem && (
              <AgentSystemDetail
                system={currentSystem}
                onBack={handleBackToSystems}
                onUpdateSystem={handleUpdateSystem}
                searchQuery={searchQuery}
              />
            )}
          </div>
        </div>
      </AdminShell>

      <ToastContainer />
    </>
  )
}
