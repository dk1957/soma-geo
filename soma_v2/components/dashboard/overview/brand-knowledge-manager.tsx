"use client"

/**
 * Brand Knowledge Base Manager
 * ============================
 * CRUD interface for managing verified brand facts.
 * These facts are used by the strategic insight agent to fact-check
 * what AI models say about the brand.
 *
 * Local-first: edits stage in memory, saved on demand.
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { useCountries } from "@/lib/hooks/use-countries"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  Database,
  Download,
  Pencil,
  X,
  BookOpen,
  ChevronDown,
  Save,
  Search,
  GripVertical,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────────────

interface BrandFact {
  id: string
  brand_id: string
  account_id: string
  category: string
  fact_key: string
  fact_value: string
  fact_context: string | null
  source: string
  source_url: string | null
  confidence: number
  verified: boolean
  created_at: string
  updated_at: string
}

const CATEGORIES = [
  { value: 'identity', label: 'Brand Identity', icon: '🏢', hint: 'Name, tagline, mission, founded year' },
  { value: 'contact', label: 'Contact Info', icon: '📧', hint: 'Email, phone, social links' },
  { value: 'pricing', label: 'Pricing', icon: '💰', hint: 'Plans, tiers, pricing model' },
  { value: 'products', label: 'Products & Services', icon: '📦', hint: 'Core offerings and features' },
  { value: 'team', label: 'Team & Leadership', icon: '👥', hint: 'Key people, founders, executives' },
  { value: 'locations', label: 'Locations', icon: '📍', hint: 'HQ, offices, markets served' },
  { value: 'claims', label: 'Brand Claims', icon: '💬', hint: 'Stats, awards, certifications' },
  { value: 'competitors', label: 'Competitors', icon: '⚔️', hint: 'Known competitors in your space' },
  { value: 'differentiators', label: 'Differentiators', icon: '✨', hint: 'What sets you apart' },
  { value: 'audience', label: 'Target Audience', icon: '🎯', hint: 'Ideal customer, demographics' },
] as const

type CategoryValue = typeof CATEGORIES[number]['value']

interface BrandKnowledgeManagerProps {
  brandId: string
}

// ─── Display helpers ────────────────────────────────────────────────────────

/** Convert snake_case fact keys to human-readable labels */
function formatFactKey(key: string): string {
  // Strip common prefixes that are just category duplicates
  const stripped = key
    .replace(/^competitor_/, '')
    .replace(/^brand_/, '')
    .replace(/^target_/, '')
    .replace(/^company_/, '')
  return stripped
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

/** Clean up fact values from api_import format */
function formatFactValue(key: string, value: string, resolveCountry?: (code: string) => string): string {
  // Clean competitor format: "Chipper Cash direct threat:medium" → "Chipper Cash"
  // The threat info moves to a badge
  const threatMatch = value.match(/^(.+?)\s+direct\s+threat:\w+$/i)
  if (threatMatch) return threatMatch[1].trim()

  // Resolve comma-separated country codes for target_markets
  if (resolveCountry && key === 'target_markets') {
    return value
      .split(/[,\s]+/)
      .filter(Boolean)
      .map(code => resolveCountry(code.trim()))
      .join(', ')
  }

  return value
}

/** Extract threat level from competitor-style values */
function extractThreatLevel(value: string): string | null {
  const match = value.match(/threat:(\w+)/i)
  return match ? match[1] : null
}

const THREAT_STYLES: Record<string, string> = {
  high: 'bg-red-50 text-red-600 border-red-200',
  medium: 'bg-amber-50 text-amber-600 border-amber-200',
  low: 'bg-green-50 text-green-600 border-green-200',
}

// ─── Dropdown options for known fact keys ───────────────────────────────────

const DROPDOWN_FIELDS: Record<string, { label: string; options: { value: string; label: string }[] }> = {
  business_model: {
    label: 'Business Model',
    options: [
      { value: 'b2b', label: 'B2B (Business to Business)' },
      { value: 'b2c', label: 'B2C (Business to Consumer)' },
      { value: 'b2b2c', label: 'B2B2C (Business to Business to Consumer)' },
      { value: 'marketplace', label: 'Marketplace' },
    ],
  },
  entity_type: {
    label: 'Entity Type',
    options: [
      { value: 'company', label: 'Company / Brand' },
      { value: 'product', label: 'Product' },
      { value: 'service', label: 'Service' },
      { value: 'personality', label: 'Person / Personality' },
      { value: 'organization', label: 'Organization' },
      { value: 'government', label: 'Government / Agency' },
      { value: 'campaign', label: 'Political Campaign' },
      { value: 'location', label: 'Location / Destination' },
    ],
  },
  business_stage: {
    label: 'Business Stage',
    options: [
      { value: 'startup', label: 'Startup' },
      { value: 'growth', label: 'Growth' },
      { value: 'established', label: 'Established' },
      { value: 'enterprise', label: 'Enterprise' },
    ],
  },
  business_type: {
    label: 'Business Type',
    options: [
      { value: 'brand', label: 'Brand' },
      { value: 'business', label: 'Business' },
      { value: 'product', label: 'Product' },
      { value: 'organization', label: 'Organization' },
    ],
  },
  company_size: {
    label: 'Company Size',
    options: [
      { value: 'startup', label: 'Startup (1–10)' },
      { value: 'small', label: 'Small (11–50)' },
      { value: 'medium', label: 'Medium (51–200)' },
      { value: 'large', label: 'Large (201–1000)' },
      { value: 'enterprise', label: 'Enterprise (1000+)' },
    ],
  },
  tone: {
    label: 'Brand Voice',
    options: [
      { value: 'professional', label: 'Professional' },
      { value: 'casual', label: 'Casual' },
      { value: 'friendly', label: 'Friendly' },
      { value: 'formal', label: 'Formal' },
      { value: 'authoritative', label: 'Authoritative' },
      { value: 'innovative', label: 'Innovative' },
      { value: 'playful', label: 'Playful' },
      { value: 'luxury', label: 'Luxury' },
      { value: 'technical', label: 'Technical' },
    ],
  },
}

/** Check if a fact_key should render as a dropdown */
function getDropdownConfig(factKey: string) {
  return DROPDOWN_FIELDS[factKey] || null
}

/** Get display label for a dropdown value */
function getDropdownDisplayLabel(factKey: string, value: string): string {
  const config = DROPDOWN_FIELDS[factKey]
  if (!config) return value
  const option = config.options.find(o => o.value === value)
  return option?.label || value
}

// ─── Inline edit row ────────────────────────────────────────────────────────

function EditableFactRow({
  fact,
  onSave,
  onCancel,
  onDelete,
  isNew,
}: {
  fact: { category: string; fact_key: string; fact_value: string; fact_context: string }
  onSave: (data: { category: string; fact_key: string; fact_value: string; fact_context: string }) => void
  onCancel: () => void
  onDelete?: () => void
  isNew?: boolean
}) {
  const [local, setLocal] = useState(fact)
  const keyRef = useRef<HTMLInputElement>(null)

  useEffect(() => { keyRef.current?.focus() }, [])

  return (
    <div className="rounded-lg border border-[#FF760D]/30 bg-[#FF760D]/[0.03] p-3.5 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr] gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Label</label>
          <Input
            ref={keyRef}
            className="h-9 text-sm bg-white"
            placeholder="e.g. Headquarters, Founded, CEO"
            value={local.fact_key}
            onChange={(e) => setLocal(prev => ({ ...prev, fact_key: e.target.value }))}
          />
        </div>
        {isNew && (
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Category</label>
            <Select
              value={local.category}
              onValueChange={(v) => setLocal(prev => ({ ...prev, category: v }))}
            >
              <SelectTrigger className="h-9 text-sm bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>
                    <span className="inline-flex items-center gap-1.5">{c.icon} {c.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Value</label>
        {(() => {
          const dropdown = getDropdownConfig(local.fact_key)
          if (dropdown) {
            return (
              <Select
                value={local.fact_value}
                onValueChange={(v) => setLocal(prev => ({ ...prev, fact_value: v }))}
              >
                <SelectTrigger className="h-9 text-sm bg-white">
                  <SelectValue placeholder={`Select ${dropdown.label.toLowerCase()}…`} />
                </SelectTrigger>
                <SelectContent>
                  {dropdown.options.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          }
          return (
            <Textarea
              className="text-sm min-h-[56px] bg-white resize-y"
              placeholder="The verified truth — this is what AI will reference"
              value={local.fact_value}
              onChange={(e) => setLocal(prev => ({ ...prev, fact_value: e.target.value }))}
            />
          )
        })()}
      </div>
      <div className="space-y-1">
        <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
          Context <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <Input
          className="h-9 text-sm bg-white"
          placeholder="Source link, date verified, internal notes…"
          value={local.fact_context}
          onChange={(e) => setLocal(prev => ({ ...prev, fact_context: e.target.value }))}
        />
      </div>
      <div className="flex items-center justify-between pt-1">
        <div>
          {onDelete && !isNew && (
            <button
              type="button"
              onClick={onDelete}
              className="text-xs text-red-500 hover:text-red-700 hover:underline transition-colors"
            >
              Delete fact
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs h-8 px-3">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => onSave(local)}
            disabled={!local.fact_key.trim() || !local.fact_value.trim()}
            className="text-xs h-8 px-4 bg-[#FF760D] hover:bg-[#FF760D]/90 text-white"
          >
            <Save className="h-3 w-3 mr-1" />
            {isNew ? 'Add Fact' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────

export function BrandKnowledgeManager({ brandId }: BrandKnowledgeManagerProps) {
  const [facts, setFacts] = useState<BrandFact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<CategoryValue | 'all'>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addingInCategory, setAddingInCategory] = useState<string | null>(null)
  const [showGlobalAdd, setShowGlobalAdd] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  const fetchFacts = useCallback(async () => {
    if (!brandId) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/insights/knowledge?brand_id=${brandId}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch')
      const { data } = await res.json()
      const loadedFacts = data?.facts || []
      setFacts(loadedFacts)
      // Start with all categories collapsed
      const allCats = new Set<string>(loadedFacts.map((f: BrandFact) => f.category))
      setCollapsedCategories(allCats)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setIsLoading(false)
    }
  }, [brandId])

  useEffect(() => { fetchFacts() }, [fetchFacts])

  // Country code resolution
  const { getCountryName } = useCountries()

  const handleExtract = async () => {
    setIsExtracting(true)
    try {
      const res = await fetch(`/api/insights/knowledge?brand_id=${brandId}&action=extract`, {
        method: 'PATCH',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to extract')
      await fetchFacts()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Extraction failed')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleAddFact = async (data: { category: string; fact_key: string; fact_value: string; fact_context: string }) => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/insights/knowledge?brand_id=${brandId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to save')
      setShowGlobalAdd(false)
      setAddingInCategory(null)
      await fetchFacts()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateFact = async (factId: string, data: { fact_key: string; fact_value: string; fact_context: string }) => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/insights/knowledge?brand_id=${brandId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, id: factId, category: facts.find(f => f.id === factId)?.category }),
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to update')
      setEditingId(null)
      await fetchFacts()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteFact = async (factId: string) => {
    try {
      const res = await fetch(`/api/insights/knowledge?brand_id=${brandId}&id=${factId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to delete')
      setFacts(prev => prev.filter(f => f.id !== factId))
      setEditingId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  // Search + filter
  const filteredFacts = facts.filter(f => {
    const matchesCategory = activeCategory === 'all' || f.category === activeCategory
    const matchesSearch = !searchQuery || 
      f.fact_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.fact_value.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Group by category
  const groupedFacts: Record<string, BrandFact[]> = {}
  for (const f of filteredFacts) {
    if (!groupedFacts[f.category]) groupedFacts[f.category] = []
    groupedFacts[f.category].push(f)
  }

  const categoryMeta = (cat: string) =>
    CATEGORIES.find(c => c.value === cat) || { value: cat, label: cat, icon: '📋', hint: '' }

  // Count facts per category (unfiltered)
  const categoryCounts: Record<string, number> = {}
  for (const f of facts) {
    categoryCounts[f.category] = (categoryCounts[f.category] || 0) + 1
  }

  if (isLoading) {
    return (
      <Card className="border-gray-200">
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400 mr-2" />
          <span className="text-gray-500 text-sm">Loading knowledge base…</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center border border-blue-100">
            <Database className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Brand Knowledge Base</h2>
            <p className="text-xs text-gray-500">
              {facts.length} verified fact{facts.length !== 1 ? 's' : ''} · Used for AI fact-checking
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExtract}
            disabled={isExtracting}
            className="text-xs h-8"
          >
            {isExtracting ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Download className="h-3 w-3 mr-1.5" />}
            Auto-Extract from Profile
          </Button>
          <Button
            size="sm"
            onClick={() => { setShowGlobalAdd(true); setAddingInCategory(null); setEditingId(null) }}
            className="text-xs h-8 bg-[#FF760D] hover:bg-[#FF760D]/90 text-white"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Fact
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between bg-red-50 text-red-700 text-sm px-4 py-2.5 rounded-lg border border-red-100">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 p-0.5">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Search + Category filter bar */}
      <div className="space-y-3">
        {facts.length > 5 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              className="h-9 pl-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
              placeholder="Search facts…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveCategory('all')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All <span className="text-[10px] opacity-70">{facts.length}</span>
          </button>
          {CATEGORIES.map(c => {
            const count = categoryCounts[c.value] || 0
            if (count === 0 && activeCategory !== c.value) return null
            return (
              <button
                key={c.value}
                onClick={() => setActiveCategory(activeCategory === c.value ? 'all' : c.value)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeCategory === c.value
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {c.icon} {c.label} <span className="text-[10px] opacity-70">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Global Add Form */}
      {showGlobalAdd && (
        <EditableFactRow
          fact={{ category: 'identity', fact_key: '', fact_value: '', fact_context: '' }}
          onSave={handleAddFact}
          onCancel={() => setShowGlobalAdd(false)}
          isNew
        />
      )}

      {/* Facts grouped by category */}
      {Object.keys(groupedFacts).length === 0 && !showGlobalAdd ? (
        <Card className="border-gray-200 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
              <BookOpen className="h-7 w-7 text-gray-300" />
            </div>
            <div className="text-center max-w-xs">
              <p className="text-sm font-medium text-gray-700">
                {searchQuery ? 'No facts match your search' : 'No facts yet'}
              </p>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                {searchQuery
                  ? 'Try a different search term or clear the filter.'
                  : 'Click "Auto-Extract from Profile" to populate facts from your brand data, or add them manually.'}
              </p>
            </div>
            {!searchQuery && (
              <div className="flex gap-2 mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExtract}
                  disabled={isExtracting}
                  className="text-xs h-8"
                >
                  {isExtracting ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Download className="h-3 w-3 mr-1.5" />}
                  Auto-Extract
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowGlobalAdd(true)}
                  className="text-xs h-8 bg-[#FF760D] hover:bg-[#FF760D]/90 text-white"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Manually
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {Object.entries(groupedFacts).map(([category, catFacts]) => {
            const meta = categoryMeta(category)
            const isCollapsed = collapsedCategories.has(category)
            const isAddingHere = addingInCategory === category

            return (
              <div key={category} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                {/* Category header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{meta.icon}</span>
                    <span className="text-sm font-bold text-gray-900 underline underline-offset-4 decoration-gray-300">{meta.label}</span>
                    <span className="text-[11px] text-gray-400 tabular-nums">{catFacts.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setAddingInCategory(isAddingHere ? null : category)
                        setShowGlobalAdd(false)
                        setEditingId(null)
                      }}
                      className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-[#FF760D] transition-colors"
                      title={`Add fact to ${meta.label}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
                  </div>
                </button>

                {/* Inline add for this category */}
                {isAddingHere && !isCollapsed && (
                  <div className="px-4 pb-3">
                    <EditableFactRow
                      fact={{ category, fact_key: '', fact_value: '', fact_context: '' }}
                      onSave={handleAddFact}
                      onCancel={() => setAddingInCategory(null)}
                      isNew
                    />
                  </div>
                )}

                {/* Facts */}
                {!isCollapsed && (
                  <div className="border-t border-gray-100">
                    {catFacts.map((fact, idx) => {
                      const isEditing = editingId === fact.id

                      if (isEditing) {
                        return (
                          <div key={fact.id} className="px-4 py-3">
                            <EditableFactRow
                              fact={{
                                category: fact.category,
                                fact_key: fact.fact_key,
                                fact_value: fact.fact_value,
                                fact_context: fact.fact_context || '',
                              }}
                              onSave={(data) => handleUpdateFact(fact.id, data)}
                              onCancel={() => setEditingId(null)}
                              onDelete={() => handleDeleteFact(fact.id)}
                            />
                          </div>
                        )
                      }

                      return (
                        <div
                          key={fact.id}
                          className={`group flex items-start gap-3 px-4 py-3 hover:bg-gray-50/70 transition-colors cursor-pointer ${
                            idx < catFacts.length - 1 ? 'border-b border-gray-50' : ''
                          }`}
                          onClick={() => { setEditingId(fact.id); setShowGlobalAdd(false); setAddingInCategory(null) }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{formatFactKey(fact.fact_key)}</span>
                              {fact.verified && (
                                <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                              )}
                              {(() => {
                                const threat = extractThreatLevel(fact.fact_value)
                                if (threat) {
                                  return (
                                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 capitalize ${THREAT_STYLES[threat] || ''}`}>
                                      {threat} threat
                                    </Badge>
                                  )
                                }
                                return null
                              })()}
                              {fact.source && fact.source !== 'manual' && fact.source !== 'api_import' && (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-gray-400 border-gray-200">
                                  {fact.source}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-900 leading-relaxed">
                              {getDropdownConfig(fact.fact_key)
                                ? getDropdownDisplayLabel(fact.fact_key, fact.fact_value)
                                : formatFactValue(fact.fact_key, fact.fact_value, getCountryName)}
                            </p>
                            {fact.fact_context && (
                              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{fact.fact_context}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                            <span className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                              <Pencil className="h-3 w-3" />
                            </span>
                            <span
                              role="button"
                              onClick={(e) => { e.stopPropagation(); handleDeleteFact(fact.id) }}
                              className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Saving indicator */}
      {isSaving && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 z-50">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving…
        </div>
      )}
    </div>
  )
}
