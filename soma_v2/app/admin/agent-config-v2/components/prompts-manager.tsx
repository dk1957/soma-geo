"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit2, FileText, Plus } from "lucide-react"
import type { AgentSystem } from "@/lib/agents/types"
import { PromptEditorDialog } from "./prompt-editor-dialog"

interface PromptsManagerProps {
  system: AgentSystem
  onUpdateSystem: (system: AgentSystem) => void
}

function countLines(text: string): number {
  return text ? text.split("\n").length : 0
}

function PromptCard({
  label,
  prompt,
  onEdit,
  onCreate,
}: {
  label: string
  prompt?: { content: string; version: number; updated_at: string }
  onEdit: () => void
  onCreate: () => void
}) {
  if (!prompt) {
    return (
      <Card className="border border-dashed border-zinc-200 bg-zinc-50/50">
        <div className="p-6 text-center">
          <FileText className="h-5 w-5 text-zinc-300 mx-auto mb-2" />
          <p className="text-sm text-zinc-500 mb-3">No {label.toLowerCase()} configured</p>
          <Button variant="outline" size="sm" onClick={onCreate}>
            <Plus className="mr-2 h-3.5 w-3.5" />
            Create {label}
          </Button>
        </div>
      </Card>
    )
  }

  const lines = countLines(prompt.content)
  const chars = prompt.content.length

  return (
    <Card className="border border-zinc-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 bg-white">
        <div className="flex items-center gap-2.5">
          <h4 className="text-sm font-semibold text-zinc-900">{label}</h4>
          <Badge variant="outline" className="text-[11px]">v{prompt.version}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-zinc-400">
            {lines} lines &middot; {chars.toLocaleString()} chars
          </span>
          <span className="text-[11px] text-zinc-400">
            Updated {new Date(prompt.updated_at).toLocaleDateString()}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-zinc-400 hover:text-zinc-900 -mr-2 h-7 w-7 p-0"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content with line numbers */}
      <div className="relative bg-zinc-50">
        <div className="overflow-auto max-h-64">
          <div className="flex">
            {/* Line numbers */}
            <div className="shrink-0 py-4 pl-4 pr-3 select-none">
              {prompt.content.split("\n").map((_, i) => (
                <div key={i} className="text-[11px] leading-5 text-zinc-300 text-right tabular-nums">
                  {i + 1}
                </div>
              ))}
            </div>
            {/* Content */}
            <pre className="flex-1 py-4 pr-5 overflow-x-auto">
              <code className="text-[13px] leading-5 text-zinc-700 font-mono whitespace-pre-wrap break-words">
                {prompt.content}
              </code>
            </pre>
          </div>
        </div>
        {/* Fade at bottom if content is long */}
        {lines > 12 && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-zinc-50 pointer-events-none" />
        )}
      </div>
    </Card>
  )
}

export function PromptsManager({
  system,
  onUpdateSystem,
}: PromptsManagerProps) {
  const [editingType, setEditingType] = useState<"system" | "user" | null>(null)

  const systemPrompt = system.prompts?.find((p) => p.type === "system")
  const userPrompt = system.prompts?.find((p) => p.type === "user")

  return (
    <>
      <div className="space-y-5">
        <div className="rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3">
          <p className="text-sm text-blue-800 font-medium">Shared Base Prompts</p>
          <p className="text-[12px] text-blue-600 mt-0.5">
            These prompts are inherited by all sub-agents as a baseline. Sub-agents can override them with their own prompts in the sub-agent flyout.
          </p>
        </div>

        <PromptCard
          label="System Prompt (Base)"
          prompt={systemPrompt}
          onEdit={() => setEditingType("system")}
          onCreate={() => setEditingType("system")}
        />
        <PromptCard
          label="User Prompt (Base)"
          prompt={userPrompt}
          onEdit={() => setEditingType("user")}
          onCreate={() => setEditingType("user")}
        />
      </div>

      {editingType && (
        <PromptEditorDialog
          open={!!editingType}
          onOpenChange={(open) => !open && setEditingType(null)}
          system={system}
          promptType={editingType}
          onSave={onUpdateSystem}
        />
      )}
    </>
  )
}
