"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus, Loader2, Save, Trash2, RefreshCw, Edit2, Users, Eye, EyeOff,
  DollarSign, Shield, ChevronDown, ChevronUp, Crown, Zap, Building2, Check
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/layout/notification-toast"

interface Plan {
  id: string
  plan_name: string
  plan_slug: string
  display_name: string
  description: string | null
  plan_tier: 'growth' | 'pro' | 'enterprise'
  monthly_price_usd: number
  quarterly_price_usd: number | null
  biannual_price_usd: number | null
  annual_price_usd: number | null
  biennial_price_usd: number | null
  max_brands: number
  max_prompts_per_brand: number
  max_competitors_per_brand: number
  max_team_members: number
  allowed_models: string[]
  max_model_platforms: number
  max_locales_per_prompt: number
  features: Record<string, boolean>
  monthly_run_limit: number | null
  monthly_report_limit: number | null
  data_retention_months: number | null
  is_active: boolean
  is_public: boolean
  sort_order: number | null
  created_at: string
  updated_at: string
  subscriber_count: number
  active_subscribers: number
  trial_subscribers: number
}

const TIER_CONFIG = {
  growth: { label: 'Growth', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Zap },
  pro: { label: 'Pro', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Crown },
  enterprise: { label: 'Enterprise', color: 'bg-violet-50 text-violet-700 border-violet-200', icon: Building2 },
}

const ALL_MODELS = [
  { id: 'openai', label: 'OpenAI (ChatGPT)' },
  { id: 'anthropic', label: 'Anthropic (Claude)' },
  { id: 'google', label: 'Google (Gemini)' },
  { id: 'perplexity', label: 'Perplexity' },
  { id: 'xai', label: 'xAI (Grok)' },
  { id: 'meta', label: 'Meta (Llama)' },
]

const FEATURE_KEYS: { key: string; label: string }[] = [
  { key: 'api_access', label: 'API Access' },
  { key: 'white_label', label: 'White Label' },
  { key: 'custom_branding', label: 'Custom Branding' },
  { key: 'priority_support', label: 'Priority Support' },
  { key: 'dedicated_account_manager', label: 'Dedicated Account Manager' },
  { key: 'advanced_analytics', label: 'Advanced Analytics' },
  { key: 'competitor_tracking', label: 'Competitor Tracking' },
  { key: 'sentiment_analysis', label: 'Sentiment Analysis' },
  { key: 'export_reports', label: 'Export Reports' },
  { key: 'scheduled_reports', label: 'Scheduled Reports' },
  { key: 'webhook_integrations', label: 'Webhook Integrations' },
  { key: 'sso_enabled', label: 'SSO/SAML' },
]

const DEFAULT_PLAN: Omit<Plan, 'id' | 'created_at' | 'updated_at' | 'subscriber_count' | 'active_subscribers' | 'trial_subscribers'> = {
  plan_name: '',
  plan_slug: '',
  display_name: '',
  description: '',
  plan_tier: 'growth',
  monthly_price_usd: 0,
  quarterly_price_usd: null,
  biannual_price_usd: null,
  annual_price_usd: null,
  biennial_price_usd: null,
  max_brands: 1,
  max_prompts_per_brand: 20,
  max_competitors_per_brand: 10,
  max_team_members: 5,
  allowed_models: ['openai', 'anthropic', 'google'],
  max_model_platforms: 3,
  max_locales_per_prompt: 1,
  features: {
    api_access: false,
    white_label: false,
    custom_branding: false,
    priority_support: false,
    dedicated_account_manager: false,
    advanced_analytics: false,
    competitor_tracking: true,
    sentiment_analysis: false,
    export_reports: true,
    scheduled_reports: false,
    webhook_integrations: false,
    sso_enabled: false,
  },
  monthly_run_limit: 500,
  monthly_report_limit: 10,
  data_retention_months: 12,
  is_active: true,
  is_public: true,
  sort_order: 0,
}

export function SubscriptionPlanManager() {
  const { addToast } = useToast()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editDialog, setEditDialog] = useState<{ plan: Partial<Plan>; isNew: boolean } | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<Plan | null>(null)
  const [expandedSection, setExpandedSection] = useState<string>('quotas')

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/subscription-plans')
      const data = await res.json()
      if (data.success) {
        setPlans(data.plans)
      } else {
        addToast({ type: 'error', title: 'Error', message: 'Failed to load plans' })
      }
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to load plans' })
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  const openCreateDialog = () => {
    setEditDialog({ plan: { ...DEFAULT_PLAN }, isNew: true })
    setExpandedSection('quotas')
  }

  const openEditDialog = (plan: Plan) => {
    setEditDialog({ plan: { ...plan }, isNew: false })
    setExpandedSection('quotas')
  }

  const updateField = (field: string, value: any) => {
    if (!editDialog) return
    setEditDialog(prev => {
      if (!prev) return null
      const updated = { ...prev.plan, [field]: value }
      // Auto-generate slug from name for new plans
      if (field === 'plan_name' && prev.isNew) {
        updated.plan_slug = (value as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      }
      return { ...prev, plan: updated }
    })
  }

  const toggleModel = (modelId: string) => {
    if (!editDialog) return
    const current = editDialog.plan.allowed_models || []
    const updated = current.includes(modelId)
      ? current.filter((m: string) => m !== modelId)
      : [...current, modelId]
    updateField('allowed_models', updated)
    updateField('max_model_platforms', updated.length)
  }

  const toggleFeature = (key: string) => {
    if (!editDialog) return
    const current = editDialog.plan.features || {}
    updateField('features', { ...current, [key]: !current[key] })
  }

  const savePlan = async () => {
    if (!editDialog) return
    const { plan, isNew } = editDialog

    if (!plan.plan_name || !plan.plan_slug || !plan.display_name || !plan.plan_tier) {
      addToast({ type: 'error', title: 'Validation', message: 'Name, slug, display name, and tier are required' })
      return
    }

    setSaving(true)
    try {
      const method = isNew ? 'POST' : 'PUT'
      const res = await fetch('/api/admin/subscription-plans', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        addToast({ type: 'success', title: isNew ? 'Plan Created' : 'Plan Updated', message: `${plan.display_name} has been ${isNew ? 'created' : 'updated'} successfully` })
        setEditDialog(null)
        fetchPlans()
      } else {
        addToast({ type: 'error', title: 'Error', message: data.error || 'Failed to save plan' })
      }
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to save plan' })
    } finally {
      setSaving(false)
    }
  }

  const deletePlan = async () => {
    if (!deleteDialog) return
    setDeleting(deleteDialog.id)
    try {
      const res = await fetch(`/api/admin/subscription-plans?id=${deleteDialog.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (res.ok && data.success) {
        addToast({ type: 'success', title: 'Plan Deactivated', message: `${deleteDialog.display_name} has been deactivated` })
        setDeleteDialog(null)
        fetchPlans()
      } else {
        addToast({ type: 'error', title: 'Error', message: data.error || 'Failed to deactivate plan' })
      }
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'Failed to deactivate plan' })
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </div>
    )
  }

  const activePlans = plans.filter(p => p.is_active)
  const inactivePlans = plans.filter(p => !p.is_active)
  const totalSubscribers = plans.reduce((sum, p) => sum + p.subscriber_count, 0)
  const totalMRR = plans.reduce((sum, p) => sum + (p.monthly_price_usd * p.active_subscribers), 0)

  return (
    <div className="space-y-4">
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-zinc-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">Active Plans</p>
                <p className="text-2xl font-semibold text-zinc-900 mt-0.5">{activePlans.length}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-zinc-100 flex items-center justify-center">
                <Shield className="h-4 w-4 text-zinc-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">Total Subscribers</p>
                <p className="text-2xl font-semibold text-zinc-900 mt-0.5">{totalSubscribers}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">Plan MRR</p>
                <p className="text-2xl font-semibold text-zinc-900 mt-0.5">${totalMRR.toLocaleString()}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">Inactive Plans</p>
                <p className="text-2xl font-semibold text-zinc-900 mt-0.5">{inactivePlans.length}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-zinc-100 flex items-center justify-center">
                <EyeOff className="h-4 w-4 text-zinc-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plans Table */}
      <Card className="border-zinc-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-medium">Subscription Plans</CardTitle>
              <CardDescription className="text-xs mt-0.5">Manage pricing, quotas, features, and model access for each plan</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchPlans}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
              </Button>
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> New Plan
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50">
                <TableHead>Plan</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-center">Brands</TableHead>
                <TableHead className="text-center">Prompts</TableHead>
                <TableHead className="text-center">Competitors</TableHead>
                <TableHead className="text-center">Models</TableHead>
                <TableHead className="text-center">Subscribers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10 text-zinc-400">
                    No subscription plans found. Create your first plan.
                  </TableCell>
                </TableRow>
              ) : (
                plans.map(plan => {
                  const tierCfg = TIER_CONFIG[plan.plan_tier]
                  const TierIcon = tierCfg.icon
                  return (
                    <TableRow key={plan.id} className={!plan.is_active ? 'opacity-50' : ''}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{plan.display_name}</p>
                          <p className="text-xs text-zinc-400">{plan.plan_slug}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${tierCfg.color}`}>
                          <TierIcon className="h-3 w-3 mr-1" /> {tierCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">${plan.monthly_price_usd}/mo</TableCell>
                      <TableCell className="text-center">{plan.max_brands}</TableCell>
                      <TableCell className="text-center">{plan.max_prompts_per_brand}</TableCell>
                      <TableCell className="text-center">{plan.max_competitors_per_brand}</TableCell>
                      <TableCell className="text-center">{plan.max_model_platforms}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="text-sm font-medium">{plan.subscriber_count}</span>
                          {plan.trial_subscribers > 0 && (
                            <span className="text-xs text-blue-500">({plan.trial_subscribers} trial)</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {plan.is_active ? (
                            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-zinc-100 text-zinc-500 border-zinc-200">Inactive</Badge>
                          )}
                          {plan.is_public ? (
                            <Eye className="h-3 w-3 text-zinc-400" />
                          ) : (
                            <EyeOff className="h-3 w-3 text-zinc-300" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(plan)}>
                            <Edit2 className="h-3 w-3 mr-1" /> Edit
                          </Button>
                          {plan.is_active && (
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteDialog(plan)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editDialog?.isNew ? <Plus className="h-5 w-5" /> : <Edit2 className="h-5 w-5" />}
              {editDialog?.isNew ? 'Create Subscription Plan' : `Edit: ${editDialog?.plan.display_name}`}
            </DialogTitle>
            <DialogDescription>
              {editDialog?.isNew
                ? 'Set up a new subscription plan with pricing, quotas, and features.'
                : 'Modifying quotas will update limits for all brands on this plan.'}
            </DialogDescription>
          </DialogHeader>

          {editDialog && (
            <div className="space-y-5 py-2">
              {/* Basic Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-zinc-900">Basic Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Plan Name</Label>
                    <Input
                      value={editDialog.plan.plan_name || ''}
                      onChange={(e) => updateField('plan_name', e.target.value)}
                      placeholder="e.g. Growth"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Display Name</Label>
                    <Input
                      value={editDialog.plan.display_name || ''}
                      onChange={(e) => updateField('display_name', e.target.value)}
                      placeholder="e.g. Growth Plan"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Slug</Label>
                    <Input
                      value={editDialog.plan.plan_slug || ''}
                      onChange={(e) => updateField('plan_slug', e.target.value)}
                      placeholder="e.g. growth"
                      disabled={!editDialog.isNew}
                      className={!editDialog.isNew ? 'bg-zinc-50' : ''}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tier</Label>
                    <Select value={editDialog.plan.plan_tier || 'growth'} onValueChange={(v) => updateField('plan_tier', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="growth">Growth</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    value={editDialog.plan.description || ''}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Brief plan description..."
                    className="h-16 resize-none"
                  />
                </div>
              </div>

              <Separator />

              {/* Pricing */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-zinc-900">Pricing (USD)</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Monthly</Label>
                    <Input
                      type="number"
                      value={editDialog.plan.monthly_price_usd ?? 0}
                      onChange={(e) => updateField('monthly_price_usd', parseFloat(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Quarterly (3mo)</Label>
                    <Input
                      type="number"
                      value={editDialog.plan.quarterly_price_usd ?? ''}
                      onChange={(e) => updateField('quarterly_price_usd', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Biannual (6mo)</Label>
                    <Input
                      type="number"
                      value={editDialog.plan.biannual_price_usd ?? ''}
                      onChange={(e) => updateField('biannual_price_usd', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Annual (12mo)</Label>
                    <Input
                      type="number"
                      value={editDialog.plan.annual_price_usd ?? ''}
                      onChange={(e) => updateField('annual_price_usd', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Biennial (24mo)</Label>
                    <Input
                      type="number"
                      value={editDialog.plan.biennial_price_usd ?? ''}
                      onChange={(e) => updateField('biennial_price_usd', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Quotas */}
              <div className="space-y-3">
                <button
                  className="flex items-center justify-between w-full text-sm font-medium text-zinc-900"
                  onClick={() => setExpandedSection(expandedSection === 'quotas' ? '' : 'quotas')}
                >
                  Resource Quotas
                  {expandedSection === 'quotas' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expandedSection === 'quotas' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Max Brands</Label>
                      <Input type="number" value={editDialog.plan.max_brands ?? 1} onChange={(e) => updateField('max_brands', parseInt(e.target.value) || 1)} min={1} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Prompts per Brand</Label>
                      <Input type="number" value={editDialog.plan.max_prompts_per_brand ?? 20} onChange={(e) => updateField('max_prompts_per_brand', parseInt(e.target.value) || 1)} min={1} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Competitors per Brand</Label>
                      <Input type="number" value={editDialog.plan.max_competitors_per_brand ?? 10} onChange={(e) => updateField('max_competitors_per_brand', parseInt(e.target.value) || 1)} min={1} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Team Members</Label>
                      <Input type="number" value={editDialog.plan.max_team_members ?? 5} onChange={(e) => updateField('max_team_members', parseInt(e.target.value) || 1)} min={1} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Locales per Prompt</Label>
                      <Input type="number" value={editDialog.plan.max_locales_per_prompt ?? 1} onChange={(e) => updateField('max_locales_per_prompt', parseInt(e.target.value) || 1)} min={1} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Sort Order</Label>
                      <Input type="number" value={editDialog.plan.sort_order ?? 0} onChange={(e) => updateField('sort_order', parseInt(e.target.value) || 0)} />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Usage Limits */}
              <div className="space-y-3">
                <button
                  className="flex items-center justify-between w-full text-sm font-medium text-zinc-900"
                  onClick={() => setExpandedSection(expandedSection === 'usage' ? '' : 'usage')}
                >
                  Usage Limits
                  {expandedSection === 'usage' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expandedSection === 'usage' && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Monthly Runs</Label>
                      <Input
                        type="number"
                        value={editDialog.plan.monthly_run_limit ?? ''}
                        onChange={(e) => updateField('monthly_run_limit', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="Unlimited"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Monthly Reports</Label>
                      <Input
                        type="number"
                        value={editDialog.plan.monthly_report_limit ?? ''}
                        onChange={(e) => updateField('monthly_report_limit', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="Unlimited"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Data Retention (months)</Label>
                      <Input
                        type="number"
                        value={editDialog.plan.data_retention_months ?? ''}
                        onChange={(e) => updateField('data_retention_months', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="Unlimited"
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Model Access */}
              <div className="space-y-3">
                <button
                  className="flex items-center justify-between w-full text-sm font-medium text-zinc-900"
                  onClick={() => setExpandedSection(expandedSection === 'models' ? '' : 'models')}
                >
                  Model Platform Access ({(editDialog.plan.allowed_models || []).length} selected)
                  {expandedSection === 'models' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expandedSection === 'models' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {ALL_MODELS.map(model => {
                      const selected = (editDialog.plan.allowed_models || []).includes(model.id)
                      return (
                        <button
                          key={model.id}
                          onClick={() => toggleModel(model.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                            selected
                              ? 'border-blue-200 bg-blue-50 text-blue-700'
                              : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                          }`}
                        >
                          {selected && <Check className="h-3.5 w-3.5" />}
                          {model.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <Separator />

              {/* Features */}
              <div className="space-y-3">
                <button
                  className="flex items-center justify-between w-full text-sm font-medium text-zinc-900"
                  onClick={() => setExpandedSection(expandedSection === 'features' ? '' : 'features')}
                >
                  Feature Flags ({FEATURE_KEYS.filter(f => editDialog.plan.features?.[f.key]).length} enabled)
                  {expandedSection === 'features' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expandedSection === 'features' && (
                  <div className="grid grid-cols-2 gap-2">
                    {FEATURE_KEYS.map(feat => (
                      <div
                        key={feat.key}
                        className="flex items-center justify-between px-3 py-2 rounded-lg border border-zinc-200"
                      >
                        <Label className="text-xs cursor-pointer">{feat.label}</Label>
                        <Switch
                          checked={!!editDialog.plan.features?.[feat.key]}
                          onCheckedChange={() => toggleFeature(feat.key)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Visibility */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!editDialog.plan.is_active}
                    onCheckedChange={(v) => updateField('is_active', v)}
                  />
                  <Label className="text-xs">Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!editDialog.plan.is_public}
                    onCheckedChange={(v) => updateField('is_public', v)}
                  />
                  <Label className="text-xs">Public (visible on pricing page)</Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button onClick={savePlan} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {editDialog?.isNew ? 'Create Plan' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" /> Deactivate Plan
            </DialogTitle>
            <DialogDescription>
              This will deactivate <strong>{deleteDialog?.display_name}</strong> and hide it from public view.
              {deleteDialog && deleteDialog.subscriber_count > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  This plan has {deleteDialog.subscriber_count} active subscriber(s). They must be migrated first.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={deletePlan}
              disabled={!!deleting || (deleteDialog?.subscriber_count ?? 0) > 0}
            >
              {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Deactivate Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
