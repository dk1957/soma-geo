"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, Loader2, X, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface OpenRouterModel {
  id: string
  name: string
  description: string
  context_length: number
  pricing: { prompt: string; completion: string }
  top_provider: number | null
  architecture: string | null
}

interface OpenRouterModelSearchProps {
  value: string
  onChange: (modelId: string) => void
  placeholder?: string
  className?: string
}

export function OpenRouterModelSearch({ value, onChange, placeholder, className }: OpenRouterModelSearchProps) {
  const [models, setModels] = useState<OpenRouterModel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [fetched, setFetched] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchModels = useCallback(async () => {
    if (fetched) return
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/admin/config/openrouter-models")
      const result = await res.json()
      if (result.success) {
        setModels(result.data)
        setFetched(true)
      } else {
        setError(result.error || "Failed to fetch models")
      }
    } catch {
      setError("Failed to fetch models")
    } finally {
      setLoading(false)
    }
  }, [fetched])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleOpen = () => {
    setIsOpen(true)
    setSearch("")
    fetchModels()
  }

  const handleSelect = (model: OpenRouterModel) => {
    onChange(model.id)
    setIsOpen(false)
    setSearch("")
  }

  const handleClear = () => {
    onChange("")
    setSearch("")
    inputRef.current?.focus()
  }

  const filtered = search
    ? models.filter(
        (m) =>
          m.id.toLowerCase().includes(search.toLowerCase()) ||
          m.name.toLowerCase().includes(search.toLowerCase())
      )
    : models

  const formatCost = (costPerToken: string) => {
    const cost = parseFloat(costPerToken) * 1_000_000
    if (cost === 0) return "Free"
    if (cost < 0.01) return `$${cost.toFixed(4)}/M`
    return `$${cost.toFixed(2)}/M`
  }

  const selectedModel = models.find((m) => m.id === value)

  return (
    <div ref={containerRef} className={`relative ${className || ""}`}>
      {/* Display field */}
      {!isOpen ? (
        <button
          type="button"
          onClick={handleOpen}
          className="w-full flex items-center justify-between h-8 rounded-md border border-zinc-200 bg-white px-2.5 text-xs hover:border-zinc-300 transition-colors text-left"
        >
          <span className={`truncate font-mono ${value ? "text-zinc-900" : "text-zinc-400"}`}>
            {value || placeholder || "Select model..."}
          </span>
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {value && (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
                className="p-0.5 rounded hover:bg-zinc-100"
              >
                <X className="h-3 w-3 text-zinc-400" />
              </span>
            )}
            <ChevronDown className="h-3 w-3 text-zinc-400" />
          </div>
        </button>
      ) : (
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400" />
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search models..."
            className="h-8 text-xs pl-7 pr-7 font-mono"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Escape") setIsOpen(false)
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-zinc-100"
            >
              <X className="h-3 w-3 text-zinc-400" />
            </button>
          )}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-zinc-200 bg-white shadow-lg max-h-[280px] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
            </div>
          )}
          {error && (
            <div className="px-3 py-4 text-center text-xs text-red-500">{error}</div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="px-3 py-4 text-center text-xs text-zinc-400">
              No models found{search ? ` for "${search}"` : ""}
            </div>
          )}
          {!loading &&
            !error &&
            filtered.slice(0, 80).map((model) => (
              <button
                key={model.id}
                onClick={() => handleSelect(model)}
                className={`w-full text-left px-3 py-2 hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-b-0 ${
                  model.id === value ? "bg-zinc-50" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-zinc-900 truncate">
                        {model.name}
                      </span>
                      {model.id === value && (
                        <Badge
                          variant="secondary"
                          className="text-[8px] px-1 py-0 bg-blue-50 text-blue-700"
                        >
                          current
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 font-mono truncate">
                      {model.id}
                    </p>
                  </div>
                  <div className="text-right shrink-0 text-[10px] text-zinc-400 leading-tight">
                    <div>In: {formatCost(model.pricing.prompt)}</div>
                    <div>Out: {formatCost(model.pricing.completion)}</div>
                  </div>
                </div>
              </button>
            ))}
          {filtered.length > 80 && (
            <p className="text-center text-[10px] text-zinc-400 py-2">
              Showing 80 of {filtered.length} — narrow your search
            </p>
          )}
        </div>
      )}
    </div>
  )
}
