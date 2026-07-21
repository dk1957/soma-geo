"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// ScrollArea import removed (unused)
import {
  Users,
  Target,
  BarChart3,
  Zap,
  Plus,
  X,
  Building,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Sparkles,
  Search
} from "lucide-react"
import { useBrand } from "@/lib/contexts/brand-context"
import { cachedFetchJson } from '@/lib/utils/cached-fetch'
import { QuotaLimitDialog } from "@/components/subscription/quota-limit-dialog"
import { getEntityTerminology, EntityType } from "@/lib/utils/entity-language"
import { useCanPerformAction } from "@/hooks/use-subscription"

interface Competitor {
  id: string
  competitor_name: string
  competitor_domain?: string
  competitor_category?: string
  is_direct_competitor: boolean
  mention_frequency: number
  avg_sentiment: number
  avg_position: number
  competitive_threat_level?: 'low' | 'medium' | 'high' | 'critical'
  market_position?: string
  strengths?: string[]
  weaknesses?: string[]
  created_at: string
  updated_at: string
}

interface CompetitorSuggestion {
  name: string
  frequency: number
  confidence: number
  context: string
  sources: string[]
}

type ThreatLevel = 'low' | 'medium' | 'high' | 'critical'

export default function CompetitorsPage() {
  const { currentBrand } = useBrand()
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [suggestions, setSuggestions] = useState<CompetitorSuggestion[]>([])
  const [rejectedSuggestions, setRejectedSuggestions] = useState<string[]>([]) // store names
  const [loading, setLoading] = useState(true)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [isAddingCompetitor, setIsAddingCompetitor] = useState(false)
  const [deletingCompetitorId, setDeletingCompetitorId] = useState<string | null>(null)
  const [addError, setAddError] = useState<string | null>(null)
  const [quotaLimit, setQuotaLimit] = useState<{ current: number; max: number; plan_name?: string; plan_tier?: string } | null>(null)
  const [newCompetitor, setNewCompetitor] = useState<{ name: string; domain: string; category: string; isDirect: boolean; threatLevel: ThreatLevel }>({
    name: '',
    domain: '',
    category: '',
    isDirect: true,
    threatLevel: 'medium'
  })
  
  // Get entity-aware terminology
  const terminology = useMemo(() => 
    getEntityTerminology(currentBrand?.entity_type as EntityType), 
    [currentBrand?.entity_type]
  )
  
  // Capitalize first letter helper
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

  // Pre-check competitor creation quota
  const { canPerform: canAddMore, current: competitorCount, max: competitorMax, loading: quotaCheckLoading, recheck: recheckQuota, planName: compPlanName, planTier: compPlanTier } = useCanPerformAction(
    'add_competitor',
    undefined,
    currentBrand?.id
  )

  const handleAddCompetitorClick = () => {
    if (!canAddMore && !quotaCheckLoading) {
      setQuotaLimit({
        current: competitorCount,
        max: competitorMax,
        plan_name: compPlanName,
        plan_tier: compPlanTier,
      })
      return
    }
    setAddDialogOpen(true)
  }

  // Reset state when brand changes to prevent showing stale data from different brands
  useEffect(() => {
    setCompetitors([])
    setSuggestions([])
    setRejectedSuggestions([])
    setAddError(null)
    setLoading(true)
    setNewCompetitor({
      name: '',
      domain: '',
      category: '',
      isDirect: true,
      threatLevel: 'medium'
    })
  }, [currentBrand?.id])

  const fetchCompetitors = useCallback(async () => {
    if (!currentBrand?.id) return

    try {
      setLoading(true)
      const data = await cachedFetchJson(
        `/api/brands/${currentBrand.id}/competitors`,
        { credentials: 'include' },
        30_000
      )

      if (data.success) {
        setCompetitors(data.competitors || [])
      }
    } catch (error) {
      console.error('Error fetching competitors:', error)
    } finally {
      setLoading(false)
    }
  }, [currentBrand?.id, rejectedSuggestions])

  const fetchSuggestions = useCallback(async () => {
    if (!currentBrand?.id) return

    try {
      setSuggestionsLoading(true)
      const data = await cachedFetchJson(
        `/api/brands/${currentBrand.id}/competitor-suggestions`,
        { credentials: 'include' },
        60_000
      )

      if (data.success) {
        const remote: CompetitorSuggestion[] = data.suggestions || []
        // Deduplicate by normalized canonical name (case-insensitive), merge frequencies & confidence
        const map = new Map<string, { name: string; frequency: number; confidence: number; sources: string[] }>()
        for (const s of remote) {
          const key = (s.name || '').trim().toLowerCase()
          if (!key) continue
          if (map.has(key)) {
            const prev = map.get(key)!
            prev.frequency += s.frequency || 0
            // average the confidence
            prev.confidence = (prev.confidence + (s.confidence || 0)) / 2
            prev.sources = Array.from(new Set([...prev.sources, ...(s.sources || [])]))
            map.set(key, prev)
          } else {
            map.set(key, { name: s.name, frequency: s.frequency || 0, confidence: s.confidence || 0, sources: s.sources || [] })
          }
        }

        // Convert map back to array and filter out locally rejected suggestions
        const merged = Array.from(map.values()).map(v => ({ name: v.name, frequency: v.frequency, confidence: v.confidence, context: '', sources: v.sources }))
        const filtered = merged.filter((s: any) => {
          const nameKey = (s.name || '').trim().toLowerCase()
          // Hide if user rejected it
          if (rejectedSuggestions.map(r => r.toLowerCase()).includes(nameKey)) return false
          // Hide if it's already in current competitors
          if (competitors.some(c => (c.competitor_name || '').trim().toLowerCase() === nameKey)) return false
          return true
        })
        setSuggestions(filtered)
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    } finally {
      setSuggestionsLoading(false)
    }
  }, [currentBrand?.id, rejectedSuggestions, competitors])

  // Load rejected suggestions from localStorage scoped by brand
  useEffect(() => {
    if (!currentBrand?.id) return
    try {
      const key = `rejected_suggestions_${currentBrand.id}`
      const raw = localStorage.getItem(key)
      if (raw) setRejectedSuggestions(JSON.parse(raw))
    } catch (err) {
      console.warn('Could not load rejected suggestions:', err)
    }
  }, [currentBrand?.id])

  const rejectSuggestion = (name: string) => {
    if (!currentBrand?.id) return
    const key = `rejected_suggestions_${currentBrand.id}`
    const next = Array.from(new Set([...rejectedSuggestions, name]))
    setRejectedSuggestions(next)
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch (err) {
      console.warn('Could not persist rejected suggestion:', err)
    }
    // remove from current suggestions state
    setSuggestions(prev => prev.filter(s => s.name !== name))
  }

  const addCompetitor = async (competitorData: any) => {
    if (!currentBrand?.id) return

    setIsAddingCompetitor(true)
    setAddError(null)
    try {
      const response = await fetch(`/api/brands/${currentBrand.id}/competitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(competitorData),
        credentials: 'include'
      })

      if (response.ok) {
        fetchCompetitors()
        recheckQuota()
        setAddDialogOpen(false)
        setNewCompetitor({ name: '', domain: '', category: '', isDirect: true, threatLevel: 'medium' })
        // Ensure this competitor is not shown again as a suggestion
        try {
          const key = `rejected_suggestions_${currentBrand.id}`
          const name = (competitorData.competitor_name || competitorData.name || '').trim()
          if (name) {
            const next = Array.from(new Set([...rejectedSuggestions, name]))
            setRejectedSuggestions(next)
            localStorage.setItem(key, JSON.stringify(next))
            // Remove from current suggestions list
            setSuggestions(prev => prev.filter(s => s.name.toLowerCase() !== name.toLowerCase()))
          }
        } catch (err) {
          console.warn('Could not persist added suggestion hide state:', err)
        }
      } else {
        const data = await response.json()
        if (response.status === 403 && data.quota_exceeded) {
          setQuotaLimit({
            current: data.current_count ?? data.max_competitors ?? 0,
            max: data.max_competitors ?? 0,
            plan_name: data.plan_name,
            plan_tier: data.plan_tier,
          })
        } else {
          setAddError(data.error || 'Failed to add competitor')
        }
      }
    } catch (error) {
      console.error('Error adding competitor:', error)
      setAddError('An unexpected error occurred. Please try again.')
    } finally {
      setIsAddingCompetitor(false)
    }
  }

  const removeCompetitor = async (competitorId: string) => {
    if (!currentBrand?.id) return

    try {
      setDeletingCompetitorId(competitorId)
      const response = await fetch(`/api/brands/${currentBrand.id}/competitors/${competitorId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        fetchCompetitors()
      }
    } catch (error) {
      console.error('Error removing competitor:', error)
    } finally {
      setDeletingCompetitorId(null)
    }
  }

  const addFromSuggestion = (suggestion: CompetitorSuggestion) => {
    // Prefill the Add Competitor dialog so the user can edit before saving
    const threatLevel = suggestion.frequency > 10 ? 'high' : suggestion.frequency > 5 ? 'medium' : 'low'
    setNewCompetitor({ name: suggestion.name, domain: '', category: '', isDirect: true, threatLevel })
    setAddDialogOpen(true)
    // remove from suggestions list optimistically
    setSuggestions(prev => prev.filter(s => s.name !== suggestion.name))
  }

  useEffect(() => {
    fetchCompetitors()
    fetchSuggestions()
  }, [fetchCompetitors, fetchSuggestions])

  const getThreatBadgeVariant = (level?: string) => {
    switch (level) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'outline'
    }
  }

  const getTrendIcon = (sentiment: number) => {
    if (sentiment > 0.1) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (sentiment < -0.1) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-600" />
  }

  return (
    <div className="container mx-auto px-6 py-6">
      {/* Quota Limit Dialog */}
      <QuotaLimitDialog
        open={!!quotaLimit}
        onClose={() => setQuotaLimit(null)}
        resourceType="competitor"
        currentCount={quotaLimit?.current ?? 0}
        maxCount={quotaLimit?.max ?? 0}
        planName={quotaLimit?.plan_name}
        planTier={quotaLimit?.plan_tier}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{capitalize(terminology.competitorPlural)}</h1>
            <p className="text-muted-foreground mt-1">
              Track and analyze {terminology.competitorPlural} to benchmark your AI visibility performance
            </p>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={(open) => {
            if (open && !canAddMore && !quotaCheckLoading) {
              setQuotaLimit({
                current: competitorCount,
                max: competitorMax,
                plan_name: compPlanName,
                plan_tier: compPlanTier,
              })
              return
            }
            setAddDialogOpen(open)
            if (!open) setAddError(null)
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add {capitalize(terminology.competitor)}
                {!quotaCheckLoading && competitorMax > 0 && (
                  <span className={`ml-2 text-xs ${competitorCount >= competitorMax ? 'text-red-200' : 'opacity-70'}`}>
                    {competitorCount}/{competitorMax}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New {capitalize(terminology.competitor)}</DialogTitle>
                <DialogDescription>
                  Add a {terminology.competitor} to track their AI visibility performance against your {terminology.entityName}.
                </DialogDescription>
              </DialogHeader>
              
              {addError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{addError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">{capitalize(terminology.competitor)} Name</Label>
                  <Input
                    id="name"
                    value={newCompetitor.name}
                    onChange={(e) => setNewCompetitor(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={`e.g., ${capitalize(terminology.competitor)} Name`}
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="domain" className="text-sm font-medium">Website (Optional)</Label>
                  <Input
                    id="domain"
                    value={newCompetitor.domain}
                    onChange={(e) => setNewCompetitor(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="e.g., example.com"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">Category (Optional)</Label>
                  <Input
                    id="category"
                    value={newCompetitor.category}
                    onChange={(e) => setNewCompetitor(prev => ({ ...prev, category: e.target.value }))}
                    placeholder={`e.g., Direct ${terminology.competitor}`}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="threat-level" className="text-sm font-medium">Threat Level</Label>
                  <Select value={newCompetitor.threatLevel} onValueChange={(value: any) => setNewCompetitor(prev => ({ ...prev, threatLevel: value }))}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="min-w-[100px]">
                  Cancel
                </Button>
                  <Button
                  onClick={() => addCompetitor({
                    competitor_name: newCompetitor.name,
                    competitor_domain: newCompetitor.domain || null,
                    competitor_category: newCompetitor.category || null,
                    is_direct_competitor: newCompetitor.isDirect,
                    competitive_threat_level: newCompetitor.threatLevel
                  })}
                  disabled={!newCompetitor.name || isAddingCompetitor}
                  className="min-w-[120px]"
                >
                  <div className="flex items-center gap-2">
                    {isAddingCompetitor ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Adding...</span>
                      </>
                    ) : (
                      `Add ${capitalize(terminology.competitor)}`
                    )}
                  </div>
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Smart Suggestions (horizontal) */}
        {suggestions.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-black-600" />
                <CardTitle className="text-lg">{capitalize(terminology.competitor)} Suggestions</CardTitle>
              </div>
              <CardDescription>
                Based on AI response analysis, these {terminology.entityNamePlural} are frequently mentioned alongside yours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="flex gap-4 py-2 px-1">
                  {suggestions.slice(0, 12).map((suggestion) => (
                    <div key={suggestion.name.toLowerCase()} className="min-w-[260px] max-w-[320px] bg-white border rounded-lg p-3 flex-shrink-0 flex items-center gap-3">
                      {/* Left icon (remove) */}
                      <div className="flex-none">
                        <Button size="sm" variant="ghost" onClick={() => { rejectSuggestion(suggestion.name) }} className="text-muted-foreground">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Main content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${suggestion.name.toLowerCase().replace(/[\s.]+/g, '')}.com&sz=32`}
                              alt={suggestion.name}
                              className="w-4 h-4 object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                          </div>
                          <h4 className="font-medium truncate">{suggestion.name}</h4>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{suggestion.frequency} mentions</div>
                      </div>

                      {/* Right icon (add) */}
                      <div className="flex-none">
                        <Button size="sm" variant="outline" onClick={() => addFromSuggestion(suggestion)} disabled={competitors.some(c => c.competitor_name.toLowerCase() === suggestion.name.toLowerCase())}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Competitors List (table) */}
        <Card>
          <CardHeader>
            <CardTitle>{capitalize(terminology.competitorPlural)} ({competitors.length})</CardTitle>
            <CardDescription>Track and compare key metrics side-by-side</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : competitors.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No {terminology.competitorPlural} added yet</h3>
                <p className="text-muted-foreground mb-4">Add {terminology.competitorPlural} to start tracking their AI visibility performance</p>
                <Button onClick={handleAddCompetitorClick}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First {capitalize(terminology.competitor)}
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Threat</TableHead>
                    <TableHead>Mentions</TableHead>
                    <TableHead>Avg Position</TableHead>
                    <TableHead>Sentiment</TableHead>
                    <TableHead>AI Visibility Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competitors.map((competitor) => (
                    <TableRow key={competitor.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden">
                            {competitor.competitor_domain ? (
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${competitor.competitor_domain}&sz=32`}
                                alt={competitor.competitor_name}
                                className="h-5 w-5 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  if (target.parentElement) {
                                    target.parentElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>'
                                  }
                                }}
                              />
                            ) : (
                              <Building className="h-4 w-4 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{competitor.competitor_name}</div>
                            {competitor.competitor_domain && <div className="text-xs text-muted-foreground">{competitor.competitor_domain}</div>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {competitor.competitor_domain ? (
                          <a 
                            href={`https://${competitor.competitor_domain}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-gray-900 hover:underline cursor-pointer transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {competitor.competitor_domain}
                          </a>
                        ) : '—'}
                      </TableCell>
                      <TableCell>{competitor.competitor_category || '—'}</TableCell>
                      <TableCell><Badge variant={getThreatBadgeVariant(competitor.competitive_threat_level)} className="text-xs">{competitor.competitive_threat_level || 'Unknown'}</Badge></TableCell>
                      <TableCell>{competitor.mention_frequency}</TableCell>
                      <TableCell>{typeof competitor.avg_position === 'number' ? competitor.avg_position.toFixed(1) : 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(competitor.avg_sentiment)}
                          <span className="text-sm">{competitor.avg_sentiment > 0 ? '+' : ''}{(competitor.avg_sentiment * 100).toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>—</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeCompetitor(competitor.id)} 
                            disabled={deletingCompetitorId === competitor.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 transition-all"
                          >
                            {deletingCompetitorId === competitor.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        
      </div>
    </div>
  )
}