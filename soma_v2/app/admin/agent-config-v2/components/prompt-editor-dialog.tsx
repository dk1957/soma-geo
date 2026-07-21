"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FlyoutPanel } from "./flyout-panel"
import type { AgentSystem } from "@/lib/agents/types"

interface PromptEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  system: AgentSystem
  promptType: "system" | "user"
  onSave: (system: AgentSystem) => void
}

export function PromptEditorDialog({
  open,
  onOpenChange,
  system,
  promptType,
  onSave,
}: PromptEditorDialogProps) {
  const existingPrompt = system.prompts?.find((p) => p.type === promptType)
  const [content, setContent] = useState(existingPrompt?.content || "")
  const [isSaving, setIsSaving] = useState(false)

  // Sync content when system/promptType changes
  useEffect(() => {
    const prompt = system.prompts?.find((p) => p.type === promptType)
    setContent(prompt?.content || "")
  }, [system, promptType])

  const lines = content ? content.split("\n").length : 0
  const words = content ? content.trim().split(/\s+/).filter(Boolean).length : 0
  const chars = content.length

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/agent-config/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemId: system.id,
          type: promptType,
          content,
        }),
      })
      if (!res.ok) throw new Error("Failed to save prompt")

      const updatedSystem = { ...system }
      if (!updatedSystem.prompts) updatedSystem.prompts = []

      const existingIndex = updatedSystem.prompts.findIndex(
        (p) => p.type === promptType
      )
      if (existingIndex >= 0) {
        updatedSystem.prompts[existingIndex] = {
          ...updatedSystem.prompts[existingIndex],
          content,
        }
      } else {
        updatedSystem.prompts.push({
          id: crypto.randomUUID(),
          type: promptType,
          content,
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }

      onSave(updatedSystem)
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <FlyoutPanel
      open={open}
      onClose={() => onOpenChange(false)}
      title={promptType === "system" ? "System Prompt" : "User Prompt"}
      subtitle={
        promptType === "system"
          ? "Define the base behavior and guidelines for this agent system."
          : "Define context-specific instructions sent with each request."
      }
      width="w-[50vw] min-w-[560px]"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-[11px] text-zinc-400">
            <span>{lines} lines</span>
            <span>{words} words</span>
            <span>{chars.toLocaleString()} chars</span>
            {existingPrompt && (
              <span>v{existingPrompt.version}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !content.trim()}>
              {isSaving ? "Saving..." : "Save Prompt"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="h-full flex flex-col">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            promptType === "system"
              ? "You are a helpful AI assistant that..."
              : "Given the following context about the brand..."
          }
          className="w-full flex-1 min-h-[480px] resize-y rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-[13px] leading-relaxed text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          spellCheck={false}
        />
      </div>
    </FlyoutPanel>
  )
}
