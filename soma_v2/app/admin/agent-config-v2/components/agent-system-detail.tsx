"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { ChevronLeft, Zap, Settings, FileText, TrendingUp, Workflow } from "lucide-react"
import type { AgentSystem } from "@/lib/agents/types"
import { SubAgentsList } from "./sub-agents-list"
import { SkillsManager } from "./skills-manager"
import { PromptsManager } from "./prompts-manager"
import { PerformanceMonitor } from "./performance-monitor"
import { PipelineConfigEditor } from "./pipeline-config-editor"

interface AgentSystemDetailProps {
  system: AgentSystem
  onBack: () => void
  onUpdateSystem: (system: AgentSystem) => void
  searchQuery?: string
}

export function AgentSystemDetail({
  system,
  onBack,
  onUpdateSystem,
  searchQuery = "",
}: AgentSystemDetailProps) {
  const [activeTab, setActiveTab] = useState("performance")

  const activeSubAgents = system.sub_agents?.filter((sa) => sa.enabled)?.length || 0
  const totalSubAgents = system.sub_agents?.length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-zinc-200">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          All Systems
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <h2 className="text-xl font-bold text-zinc-900">{system.name}</h2>
              <Badge
                variant={system.enabled ? "default" : "secondary"}
                className={`text-[11px] ${system.enabled ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-50" : ""}`}
              >
                {system.enabled ? "Active" : "Disabled"}
              </Badge>
            </div>
            {system.description && (
              <p className="text-sm text-zinc-500 max-w-2xl">{system.description}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-zinc-900 tabular-nums">{activeSubAgents}/{totalSubAgents}</p>
            <p className="text-xs text-zinc-400">sub-agents active</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-auto bg-transparent border-b border-zinc-200 rounded-none p-0 h-auto gap-0">
          {[
            { value: "performance", icon: TrendingUp, label: "Performance" },
            { value: "sub-agents", icon: Zap, label: "Sub-Agents" },
            { value: "skills", icon: Settings, label: "Skills" },
            { value: "prompts", icon: FileText, label: "Prompts" },
            // Only show Pipeline tab for content system
            ...(system.pipeline_config ? [{ value: "pipeline", icon: Workflow, label: "Pipeline" }] : []),
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 data-[state=active]:border-zinc-900 data-[state=active]:text-zinc-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="performance" className="mt-6">
          <PerformanceMonitor system={system} />
          {/* Quick-access sub-agent cards below performance */}
          <div className="mt-8 pt-6 border-t border-zinc-200">
            <h3 className="text-sm font-semibold text-zinc-700 mb-4">Sub-Agents</h3>
            <SubAgentsList
              system={system}
              onUpdateSystem={onUpdateSystem}
              searchQuery={searchQuery}
              variant="compact"
            />
          </div>
        </TabsContent>

        <TabsContent value="sub-agents" className="mt-6">
          <SubAgentsList
            system={system}
            onUpdateSystem={onUpdateSystem}
            searchQuery={searchQuery}
          />
        </TabsContent>

        <TabsContent value="skills" className="mt-6">
          <SkillsManager
            system={system}
            onUpdateSystem={onUpdateSystem}
            searchQuery={searchQuery}
          />
        </TabsContent>

        <TabsContent value="prompts" className="mt-6">
          <PromptsManager
            system={system}
            onUpdateSystem={onUpdateSystem}
          />
        </TabsContent>

        {system.pipeline_config && (
          <TabsContent value="pipeline" className="mt-6">
            <PipelineConfigEditor
              system={system}
              onUpdateSystem={onUpdateSystem}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
