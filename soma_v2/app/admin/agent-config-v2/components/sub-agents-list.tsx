"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit2, Circle } from "lucide-react"
import type { AgentSystem, SubAgent } from "@/lib/agents/types"
import { SubAgentDetailDialog } from "./sub-agent-detail-dialog"

interface SubAgentsListProps {
  system: AgentSystem
  onUpdateSystem: (system: AgentSystem) => void
  searchQuery?: string
  variant?: "default" | "compact"
}

export function SubAgentsList({
  system,
  onUpdateSystem,
  searchQuery = "",
  variant = "default",
}: SubAgentsListProps) {
  const [selectedSubAgent, setSelectedSubAgent] = useState<SubAgent | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const filteredSubAgents = (system.sub_agents || []).filter((sa) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      sa.name.toLowerCase().includes(query) ||
      sa.role?.toLowerCase().includes(query) ||
      sa.model?.toLowerCase().includes(query)
    )
  })

  const handleEditSubAgent = (subAgent: SubAgent) => {
    setSelectedSubAgent(subAgent)
    setDialogOpen(true)
  }

  const handleSaveSubAgent = async (updatedSubAgent: SubAgent) => {
    const updatedSubAgents = (system.sub_agents || []).map((sa) =>
      sa.id === updatedSubAgent.id ? updatedSubAgent : sa
    )
    onUpdateSystem({ ...system, sub_agents: updatedSubAgents })
    setDialogOpen(false)

    try {
      const res = await fetch("/api/admin/agent-config/sub-agents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemId: system.id,
          subAgent: updatedSubAgent,
        }),
      })
      if (!res.ok) throw new Error("Failed to update sub-agent")
    } catch (error) {
      console.error("Update failed:", error)
      onUpdateSystem(system)
    }
  }

  return (
    <>
      {variant === "compact" ? (
        /* ── Compact 4-column grid for Performance tab ── */
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {filteredSubAgents.length > 0 ? (
            filteredSubAgents.map((subAgent) => (
              <Card
                key={subAgent.id}
                className={`border cursor-pointer transition-colors ${
                  !subAgent.enabled ? "opacity-60" : "hover:border-zinc-300"
                }`}
                onClick={() => handleEditSubAgent(subAgent)}
              >
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Circle className={`h-2 w-2 fill-current shrink-0 ${subAgent.enabled ? "text-green-500" : "text-zinc-300"}`} />
                    <h4 className="text-sm font-semibold text-zinc-900 truncate">{subAgent.name}</h4>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2 mb-3 min-h-[2rem]">{subAgent.role || "No role set"}</p>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center text-[11px] bg-zinc-100 text-zinc-600 rounded px-1.5 py-0.5 font-mono truncate max-w-[120px]">
                      {subAgent.model?.split("/").pop() || "No model"}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] shrink-0 ${subAgent.enabled ? "border-green-200 text-green-700" : "text-zinc-400"}`}
                    >
                      {subAgent.enabled ? "Active" : "Off"}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-4 text-center py-12">
              <p className="text-sm text-zinc-500">
                {searchQuery ? "No sub-agents match your search" : "No sub-agents configured"}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* ── Default 2-column grid for Sub-Agents tab ── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSubAgents.length > 0 ? (
          filteredSubAgents.map((subAgent) => (
            <Card
              key={subAgent.id}
              className={`border transition-colors ${
                !subAgent.enabled ? "opacity-60" : "hover:border-zinc-300"
              }`}
            >
              <div className="p-5">
                {/* Row 1: Name + Status + Edit */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2.5">
                    <Circle className={`h-2 w-2 fill-current shrink-0 ${subAgent.enabled ? "text-green-500" : "text-zinc-300"}`} />
                    <h4 className="font-semibold text-zinc-900">{subAgent.name}</h4>
                    <Badge
                      variant="outline"
                      className={`text-[11px] ${subAgent.enabled ? "border-green-200 text-green-700" : "text-zinc-400"}`}
                    >
                      {subAgent.enabled ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditSubAgent(subAgent)}
                    className="text-zinc-400 hover:text-zinc-900 -mr-2"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Row 2: Role */}
                {subAgent.role && (
                  <p className="text-sm text-zinc-500 mb-3 ml-[18px]">{subAgent.role}</p>
                )}

                {/* Row 3: Model config inline */}
                <div className="flex items-center gap-3 ml-[18px] mb-3">
                  <span className="inline-flex items-center gap-1.5 text-xs bg-zinc-100 text-zinc-600 rounded-md px-2 py-1 font-mono">
                    {subAgent.model?.split("/").pop() || "No model"}
                  </span>
                  <span className="text-xs text-zinc-400">
                    temp {subAgent.temperature ?? "—"}
                  </span>
                  <span className="text-xs text-zinc-300">&middot;</span>
                  <span className="text-xs text-zinc-400">
                    {subAgent.max_tokens?.toLocaleString() ?? "—"} tokens
                  </span>
                </div>

                {/* Row 4: Description */}
                {subAgent.description && subAgent.description !== subAgent.role && (
                  <p className="text-sm text-zinc-500 leading-relaxed ml-[18px] line-clamp-2 mb-3">
                    {subAgent.description}
                  </p>
                )}

                {/* Row 5: Prompt & Skill status indicators */}
                <div className="flex items-center gap-3 ml-[18px] mb-3">
                  {/* Prompt indicator */}
                  {subAgent.prompts && subAgent.prompts.some(p => p.content) && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                      <svg className="h-3 w-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      {subAgent.prompts.filter(p => p.content).length} prompts
                    </span>
                  )}
                  {/* Skill flags indicator */}
                  {subAgent.skill_flags && subAgent.skill_flags.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                      <svg className="h-3 w-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      {subAgent.skill_flags.filter(f => f.enabled).length}/{subAgent.skill_flags.length} skills
                    </span>
                  )}
                </div>

                {/* Row 6: Skills tags */}
                {subAgent.skills && subAgent.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 ml-[18px]">
                    {subAgent.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[11px] text-zinc-500 bg-zinc-50 border border-zinc-200 rounded px-1.5 py-0.5"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-2 text-center py-12">
            <p className="text-sm text-zinc-500">
              {searchQuery ? "No sub-agents match your search" : "No sub-agents configured"}
            </p>
          </div>
        )}
      </div>
      )}

      {selectedSubAgent && (
        <SubAgentDetailDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          subAgent={selectedSubAgent}
          onSave={handleSaveSubAgent}
        />
      )}
    </>
  )
}
