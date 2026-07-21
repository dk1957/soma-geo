"use client"

import { useState } from "react"
import {
  ChevronRight,
  Copy,
  Eye,
  FileText,
  Mail,
  Plus,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  type CRMTemplate,
  EmptyState,
  formatDateTime,
} from "./crm-shared"

interface TemplatesProps {
  templates: CRMTemplate[]
  onAddTemplate: () => void
  onDeleteTemplate: (id: string) => void
}

export function CRMTemplates({ templates, onAddTemplate, onDeleteTemplate }: TemplatesProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<"html" | "text">("html")

  const categoryColors: Record<string, string> = {
    marketing: "bg-blue-50 text-blue-700 border-blue-200",
    promotional: "bg-purple-50 text-purple-700 border-purple-200",
    reminder: "bg-amber-50 text-amber-700 border-amber-200",
    onboarding: "bg-emerald-50 text-emerald-700 border-emerald-200",
    follow_up: "bg-orange-50 text-orange-700 border-orange-200",
    win_back: "bg-red-50 text-red-700 border-red-200",
    general: "bg-zinc-50 text-zinc-700 border-zinc-200",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-zinc-900">Outreach Templates</h3>
          <p className="text-sm text-zinc-500 mt-0.5">Reusable email and SMS templates for campaigns. Use &#123;&#123;variable&#125;&#125; syntax for personalization.</p>
        </div>
        <Button className="bg-zinc-900 text-white hover:bg-zinc-800" onClick={onAddTemplate}>
          <Plus className="mr-2 h-4 w-4" /> New Template
        </Button>
      </div>

      {/* Category summary */}
      {templates.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(
            templates.reduce((acc, t) => {
              acc[t.category] = (acc[t.category] || 0) + 1
              return acc
            }, {} as Record<string, number>)
          ).map(([category, count]) => (
            <div key={category} className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${categoryColors[category] || "bg-zinc-50 text-zinc-700 border-zinc-200"}`}>
              {category.replaceAll("_", " ")} ({count})
            </div>
          ))}
        </div>
      )}

      {/* Template list */}
      <div className="space-y-2.5">
        {templates.map((template) => {
          const isExpanded = expandedId === template.id
          return (
            <div key={template.id} className="rounded-xl border border-zinc-200 overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-50/60 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : template.id)}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="shrink-0 h-9 w-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-zinc-900 truncate">{template.name}</div>
                    <div className="text-xs text-zinc-500 truncate mt-0.5">
                      <Mail className="inline h-3 w-3 mr-1" />
                      {template.subject}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <div className="flex flex-wrap gap-1">
                    {template.variables.slice(0, 3).map((v) => (
                      <span key={v} className="text-[10px] bg-zinc-100 text-zinc-500 rounded px-1.5 py-0.5">{`{{${v}}}`}</span>
                    ))}
                    {template.variables.length > 3 && (
                      <span className="text-[10px] text-zinc-400">+{template.variables.length - 3}</span>
                    )}
                  </div>
                  <Badge className={`text-xs border ${categoryColors[template.category] || "bg-zinc-50 text-zinc-700 border-zinc-200"}`}>
                    {template.category.replaceAll("_", " ")}
                  </Badge>
                  <ChevronRight className={`h-4 w-4 text-zinc-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-zinc-200 bg-zinc-50/40 p-4 space-y-4">
                  {/* Preview toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 rounded-lg border border-zinc-200 p-0.5">
                      <button
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${previewMode === "html" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}
                        onClick={() => setPreviewMode("html")}
                      >
                        HTML
                      </button>
                      <button
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${previewMode === "text" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}
                        onClick={() => setPreviewMode("text")}
                      >
                        Plain Text
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-zinc-500"
                        onClick={() => {
                          const content = previewMode === "html" ? template.body_html : (template.body_text || template.body_html)
                          navigator.clipboard.writeText(content)
                        }}
                      >
                        <Copy className="mr-1 h-3 w-3" /> Copy
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-red-500 hover:text-red-700"
                        onClick={() => onDeleteTemplate(template.id)}
                      >
                        <Trash2 className="mr-1 h-3 w-3" /> Delete
                      </Button>
                    </div>
                  </div>

                  {/* Content preview */}
                  <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
                    {/* Email header preview */}
                    <div className="border-b border-zinc-200 px-4 py-2.5 text-sm">
                      <div className="text-zinc-500">Subject: <span className="text-zinc-800">{template.subject}</span></div>
                    </div>
                    <div className="p-4 max-h-80 overflow-y-auto">
                      {previewMode === "html" ? (
                        <div className="text-sm text-zinc-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: template.body_html }} />
                      ) : (
                        <pre className="text-sm text-zinc-700 whitespace-pre-wrap font-sans">
                          {template.body_text || template.body_html.replace(/<[^>]*>/g, '')}
                        </pre>
                      )}
                    </div>
                  </div>

                  {/* Variables */}
                  <div>
                    <div className="text-xs font-medium text-zinc-500 mb-2">Available Variables</div>
                    <div className="flex flex-wrap gap-1.5">
                      {template.variables.map((v) => (
                        <code key={v} className="text-xs bg-zinc-100 text-zinc-700 rounded px-2 py-1 font-mono">{`{{${v}}}`}</code>
                      ))}
                    </div>
                  </div>

                  {template.description && (
                    <div className="text-xs text-zinc-500">{template.description}</div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {templates.length === 0 && (
          <EmptyState
            title="No templates yet"
            description="Create reusable templates with personalization variables for your outreach campaigns."
            action={<Button size="sm" onClick={onAddTemplate}><Plus className="mr-2 h-4 w-4" />Create Template</Button>}
          />
        )}
      </div>
    </div>
  )
}
