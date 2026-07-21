"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft, Building2, Users, BarChart3, CreditCard, DollarSign,
  Play, Loader2, Ghost, Pause, ShieldAlert, ShieldCheck,
  Trash2, Eye, MoreHorizontal, CheckCircle, AlertTriangle, XCircle,
  Clock, Activity, User, Ban, Globe, MapPin, Tag, Cpu,
  TrendingUp, Link2, Mail, Calendar, Timer, Hash, Zap,
  Briefcase, Target, Award, Info, ChevronRight, Database, Server,
  RefreshCw, FileWarning, ExternalLink,
} from "lucide-react"
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { AdminShell } from "../../components/admin-shell"

// ═══════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════

interface AccountUser {
  id: string
  role: string
  email: string
  name: string
  avatar_url: string | null
  joined_at: string | null
  is_active: boolean
  region: string | null
  timezone: string | null
  last_active_at: string | null
  onboarding_completed: boolean
  profile_role: string | null
}

interface RunHistoryEntry {
  id: string
  status: string
  created_at: string
  completed_at: string | null
  total_cost: number
  total_jobs: number
  completed_jobs: number
  failed_jobs: number
  duration_ms: number | null
  avg_response_ms: number | null
  response_count: number
  success_count: number
  fail_count: number
}

interface RecentError {
  date: string
  error: string
  run_id: string
}

interface Brand {
  id: string
  name: string
  slug: string | null
  description: string | null
  logo_url: string | null
  industry: string | null
  brand_type: string | null
  is_active: boolean
  created_at: string
  updated_at: string | null
  // Business context
  primary_domain: string | null
  brand_website: string | null
  brand_category: string | null
  brand_categories: string[] | null
  target_markets: string[] | null
  products_services: string | null
  business_type: string | null
  business_model: string | null
  target_audience: string | null
  primary_value: string | null
  business_stage: string | null
  known_competitors: string[] | null
  company_name: string | null
  company_website: string | null
  company_location: string | null
  contact_info: any
  selected_models: string[] | null
  // Auto-run
  auto_run_paused: boolean
  auto_run_paused_at: string | null
  auto_run_pause_reason: string | null
  // Diagnostics
  last_run: string | null
  last_status: string | null
  has_recent_failure: boolean
  total_failures: number
  last_error: string | null
  recent_errors: RecentError[]
  total_cost: number
  model_usage: Record<string, { count: number; cost: number; avg_response_ms: number; total_tokens: number; errors: number }>
  run_count: number
  run_history: RunHistoryEntry[]
  avg_response_time_ms: number
  total_responses: number
  total_retries: number
  total_tokens: number
}

interface Subscription {
  id?: string
  plan_id?: string
  plan_name: string
  price: number
  status: string
  start_date?: string
  end_date: string
  auto_renew: boolean
  billing_cycle: string
  features?: any
  max_brands?: number | null
  max_prompts_per_brand?: number | null
  max_competitors_per_brand?: number | null
}

interface AccountData {
  id: string
  name: string
  slug: string | null
  created_at: string
  updated_at: string | null
  account_type: string | null
  description: string | null
  logo_url: string | null
  company_size: string | null
  industry: string | null
  billing_plan: string | null
  billing_status: string | null
  trial_ends_at: string | null
  is_active: boolean
  total_cost: number
  total_runs: number
  total_failures: number
  subscription: Subscription | null
  users: AccountUser[]
  brands: Brand[]
}

interface SubscriptionPlan {
  id: string
  name: string
  display_name: string
  monthly_price_usd: number
  features: any
  max_brands?: number
  max_prompts_per_brand?: number
  max_competitors_per_brand?: number
}

// ═══════════════════════════════════════════
//  UTILITY COMPONENTS
// ═══════════════════════════════════════════

function RelativeTime({ date }: { date: string | Date | null }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!date) return <span className="text-zinc-400">Never</span>
  if (!mounted) return <span>...</span>
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 1) return <span>Just now</span>
  if (diffMins < 60) return <span>{diffMins}m ago</span>
  if (diffHours < 24) return <span>{diffHours}h ago</span>
  if (diffDays < 7) return <span>{diffDays}d ago</span>
  return <span>{then.toLocaleDateString()}</span>
}

function FormattedDate({ date }: { date: string | Date | null }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!date) return <span className="text-zinc-400">—</span>
  if (!mounted) return <span>...</span>
  return <span>{new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    trialing: 'bg-blue-50 text-blue-700 border-blue-200',
    past_due: 'bg-red-50 text-red-700 border-red-200',
    canceled: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    expired: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    suspended: 'bg-red-50 text-red-700 border-red-200',
    paused: 'bg-amber-50 text-amber-700 border-amber-200',
  }
  return (
    <Badge variant="outline" className={`text-xs ${colors[status] || colors.expired}`}>
      {status}
    </Badge>
  )
}

function SimStatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-zinc-400">No runs</span>
  const config: Record<string, { color: string; icon: React.ReactNode }> = {
    completed: { color: 'text-emerald-600', icon: <CheckCircle className="h-3 w-3" /> },
    running: { color: 'text-blue-600', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    pending: { color: 'text-amber-600', icon: <Clock className="h-3 w-3" /> },
    failed: { color: 'text-red-600', icon: <AlertTriangle className="h-3 w-3" /> },
  }
  const c = config[status] || config.failed
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${c.color}`}>
      {c.icon} {status}
    </span>
  )
}

function StatCard({ label, value, icon, alert, sub }: {
  label: string; value: string | number; icon: React.ReactNode; alert?: boolean; sub?: string
}) {
  return (
    <Card className={`border ${alert ? 'border-red-200 bg-red-50/30' : 'border-zinc-200'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-semibold mt-0.5 ${alert ? 'text-red-600' : 'text-zinc-900'}`}>{value}</p>
            {sub && <p className="text-[11px] text-zinc-400 mt-0.5">{sub}</p>}
          </div>
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${alert ? 'bg-red-100' : 'bg-zinc-100'}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function InfoRow({ label, value, icon, href }: { label: string; value: React.ReactNode; icon?: React.ReactNode; href?: string }) {
  if (!value || value === 'Not set' || value === 'Not provided') {
    return (
      <div className="flex items-start gap-3 py-2">
        {icon && <div className="mt-0.5 text-zinc-300">{icon}</div>}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-400">{label}</p>
          <p className="text-sm text-zinc-300">—</p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-start gap-3 py-2">
      {icon && <div className="mt-0.5 text-zinc-500">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-400">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            {value} <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <p className="text-sm text-zinc-900">{value}</p>
        )}
      </div>
    </div>
  )
}

function formatDuration(ms: number | null): string {
  if (!ms) return '—'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
}

function formatTokens(n: number): string {
  if (n < 1000) return String(n)
  if (n < 1000000) return `${(n / 1000).toFixed(1)}K`
  return `${(n / 1000000).toFixed(2)}M`
}

// ═══════════════════════════════════════════
//  BRAND DETAIL VIEW (Full page within sheet)
// ═══════════════════════════════════════════

function BrandDetailPanel({ brand, accountName, onRunRun, isRunning, runResult }: {
  brand: Brand
  accountName: string
  onRunRun: () => void
  isRunning: boolean
  runResult: { success: boolean; message: string } | null
}) {
  const successRate = brand.total_responses > 0
    ? ((brand.total_responses - brand.total_failures) / brand.total_responses * 100).toFixed(0)
    : '100'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        {brand.logo_url ? (
          <img src={brand.logo_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
        ) : (
          <div className="h-12 w-12 rounded-lg bg-zinc-100 flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-zinc-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">{brand.name}</h2>
            {!brand.is_active && <Badge variant="outline" className="text-[10px] bg-zinc-100">Inactive</Badge>}
            {brand.auto_run_paused && <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Paused</Badge>}
            {brand.brand_type && <Badge variant="outline" className="text-[10px] capitalize">{brand.brand_type}</Badge>}
            {brand.business_stage && <Badge variant="outline" className="text-[10px] capitalize">{brand.business_stage}</Badge>}
          </div>
          {brand.description && <p className="text-sm text-zinc-500 mt-1">{brand.description}</p>}
        </div>
      </div>

      {/* Quick action */}
      <div className="flex gap-2">
        <Button size="sm" onClick={onRunRun} disabled={isRunning}>
          {isRunning ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Play className="h-3.5 w-3.5 mr-1.5" />}
          Run Run
        </Button>
        {brand.primary_domain && (
          <Button size="sm" variant="outline" asChild>
            <a href={`https://${brand.primary_domain}`} target="_blank" rel="noopener noreferrer">
              <Globe className="h-3.5 w-3.5 mr-1.5" /> Visit Site
            </a>
          </Button>
        )}
      </div>

      {runResult && (
        <div className={`px-3 py-2 rounded-lg text-sm ${runResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {runResult.success ? <CheckCircle className="h-3.5 w-3.5 inline-block mr-1.5" /> : <XCircle className="h-3.5 w-3.5 inline-block mr-1.5" />}
          {runResult.message}
        </div>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="diagnostics" className="text-xs">Diagnostics</TabsTrigger>
          <TabsTrigger value="models" className="text-xs">Models</TabsTrigger>
          <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Business Context */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Business Context</h3>
            <div className="bg-zinc-50 rounded-lg p-3 space-y-0.5">
              <InfoRow label="Domain" value={brand.primary_domain} icon={<Globe className="h-3.5 w-3.5" />} href={brand.primary_domain ? `https://${brand.primary_domain}` : undefined} />
              <InfoRow label="Brand Website" value={brand.brand_website} icon={<Link2 className="h-3.5 w-3.5" />} href={brand.brand_website || undefined} />
              <InfoRow label="Industry" value={brand.industry} icon={<Briefcase className="h-3.5 w-3.5" />} />
              <InfoRow label="Business Type" value={brand.business_type} icon={<Building2 className="h-3.5 w-3.5" />} />
              <InfoRow label="Business Model" value={brand.business_model?.toUpperCase()} icon={<TrendingUp className="h-3.5 w-3.5" />} />
              <InfoRow label="Products / Services" value={brand.products_services} icon={<Tag className="h-3.5 w-3.5" />} />
              <InfoRow label="Target Audience" value={brand.target_audience} icon={<Target className="h-3.5 w-3.5" />} />
              <InfoRow label="Value Proposition" value={brand.primary_value} icon={<Award className="h-3.5 w-3.5" />} />
            </div>
          </div>

          {/* Company Info */}
          {(brand.company_name || brand.company_website || brand.company_location) && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Company</h3>
              <div className="bg-zinc-50 rounded-lg p-3 space-y-0.5">
                <InfoRow label="Company Name" value={brand.company_name} icon={<Building2 className="h-3.5 w-3.5" />} />
                <InfoRow label="Company Website" value={brand.company_website} icon={<Globe className="h-3.5 w-3.5" />} href={brand.company_website || undefined} />
                <InfoRow label="Location" value={brand.company_location} icon={<MapPin className="h-3.5 w-3.5" />} />
              </div>
            </div>
          )}

          {/* Categories & Markets */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Categories & Markets</h3>
            <div className="space-y-2">
              {brand.brand_category && (
                <div>
                  <p className="text-xs text-zinc-400 mb-1">Primary Category</p>
                  <Badge variant="outline">{brand.brand_category}</Badge>
                </div>
              )}
              {brand.brand_categories && brand.brand_categories.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-400 mb-1">Categories</p>
                  <div className="flex flex-wrap gap-1">
                    {brand.brand_categories.map((cat, i) => (
                      <Badge key={i} variant="outline" className="text-xs"><Tag className="h-2.5 w-2.5 mr-0.5" />{cat}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {brand.target_markets && brand.target_markets.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-400 mb-1">Target Markets</p>
                  <div className="flex flex-wrap gap-1">
                    {brand.target_markets.map((m, i) => (
                      <Badge key={i} variant="outline" className="text-xs"><MapPin className="h-2.5 w-2.5 mr-0.5" />{m}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {brand.known_competitors && brand.known_competitors.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-400 mb-1">Known Competitors</p>
                  <div className="flex flex-wrap gap-1">
                    {brand.known_competitors.map((c, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact Info */}
          {brand.contact_info && Object.keys(brand.contact_info).length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Contact</h3>
              <div className="bg-zinc-50 rounded-lg p-3">
                <pre className="text-xs text-zinc-600 whitespace-pre-wrap">{JSON.stringify(brand.contact_info, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="pt-2 border-t border-zinc-100">
            <div className="grid grid-cols-2 gap-x-4 text-xs text-zinc-400">
              <div>Created: <FormattedDate date={brand.created_at} /></div>
              <div>Updated: <FormattedDate date={brand.updated_at} /></div>
              {brand.slug && <div className="col-span-2 mt-1">Slug: <span className="text-zinc-600 font-mono">{brand.slug}</span></div>}
              <div className="col-span-2 mt-1">ID: <span className="text-zinc-600 font-mono text-[10px]">{brand.id}</span></div>
            </div>
          </div>
        </TabsContent>

        {/* ── Diagnostics Tab ── */}
        <TabsContent value="diagnostics" className="mt-4 space-y-4">
          {/* Key diagnostic metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-zinc-50 rounded-lg">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Runs</p>
              <p className="text-xl font-semibold">{brand.run_count}</p>
            </div>
            <div className="p-3 bg-zinc-50 rounded-lg">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Success Rate</p>
              <p className={`text-xl font-semibold ${Number(successRate) < 80 ? 'text-red-600' : 'text-emerald-600'}`}>{successRate}%</p>
            </div>
            <div className="p-3 bg-zinc-50 rounded-lg">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wide">API Cost</p>
              <p className="text-xl font-semibold">${brand.total_cost.toFixed(4)}</p>
            </div>
            <div className={`p-3 rounded-lg ${brand.total_failures > 0 ? 'bg-red-50' : 'bg-zinc-50'}`}>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Failures</p>
              <p className={`text-xl font-semibold ${brand.total_failures > 0 ? 'text-red-600' : ''}`}>{brand.total_failures}</p>
            </div>
            <div className="p-3 bg-zinc-50 rounded-lg">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Avg Response</p>
              <p className="text-xl font-semibold">{brand.avg_response_time_ms ? `${(brand.avg_response_time_ms / 1000).toFixed(1)}s` : '—'}</p>
            </div>
            <div className="p-3 bg-zinc-50 rounded-lg">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Total Tokens</p>
              <p className="text-xl font-semibold">{formatTokens(brand.total_tokens)}</p>
            </div>
            <div className="p-3 bg-zinc-50 rounded-lg">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Total Responses</p>
              <p className="text-xl font-semibold">{brand.total_responses}</p>
            </div>
            <div className={`p-3 rounded-lg ${brand.total_retries > 0 ? 'bg-amber-50' : 'bg-zinc-50'}`}>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Retries</p>
              <p className={`text-xl font-semibold ${brand.total_retries > 0 ? 'text-amber-600' : ''}`}>{brand.total_retries}</p>
            </div>
          </div>

          {/* LLM Models selected */}
          {brand.selected_models && brand.selected_models.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Selected Models</h3>
              <div className="flex flex-wrap gap-1.5">
                {brand.selected_models.map((m, i) => (
                  <Badge key={i} variant="outline" className="text-[11px] font-mono">
                    <Cpu className="h-3 w-3 mr-1" />{m.split('/').pop()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Auto-run status */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Auto-Run Status</h3>
            <div className={`p-3 rounded-lg ${brand.auto_run_paused ? 'bg-amber-50 border border-amber-100' : 'bg-emerald-50 border border-emerald-100'}`}>
              <div className="flex items-center gap-2 text-sm font-medium">
                {brand.auto_run_paused ? (
                  <><Pause className="h-4 w-4 text-amber-600" /> <span className="text-amber-800">Paused</span></>
                ) : (
                  <><Play className="h-4 w-4 text-emerald-600" /> <span className="text-emerald-800">Active</span></>
                )}
              </div>
              {brand.auto_run_paused_at && (
                <p className="text-xs text-amber-600 mt-1">Since <FormattedDate date={brand.auto_run_paused_at} /></p>
              )}
              {brand.auto_run_pause_reason && (
                <p className="text-xs text-amber-700 mt-1">Reason: {brand.auto_run_pause_reason}</p>
              )}
            </div>
          </div>

          {/* Recent errors */}
          {brand.recent_errors.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">Recent Errors ({brand.recent_errors.length})</h3>
              <div className="space-y-2">
                {brand.recent_errors.map((err, i) => (
                  <div key={i} className="p-3 bg-red-50 border border-red-100 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-red-400">{err.run_id.slice(0, 8)}...</span>
                      <span className="text-[10px] text-red-400"><RelativeTime date={err.date} /></span>
                    </div>
                    <p className="text-xs text-red-700">{err.error}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last run info */}
          <div className="pt-2 border-t border-zinc-100 text-xs text-zinc-400 space-y-1">
            <div>Last run: <RelativeTime date={brand.last_run} /></div>
            <div>Last status: <SimStatusBadge status={brand.last_status} /></div>
          </div>
        </TabsContent>

        {/* ── Models Tab ── */}
        <TabsContent value="models" className="mt-4 space-y-4">
          {Object.keys(brand.model_usage).length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              <Cpu className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No model usage data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(brand.model_usage)
                .sort(([, a], [, b]) => b.count - a.count)
                .map(([model, usage]) => {
                  const errorRate = usage.count > 0 ? ((usage.errors / usage.count) * 100).toFixed(0) : '0'
                  return (
                    <div key={model} className="p-3 bg-zinc-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-zinc-900 truncate max-w-[260px]">{model.split('/').pop()}</span>
                        <span className="text-xs text-zinc-400 font-mono">{model.split('/')[0]}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-zinc-400">Calls</p>
                          <p className="text-sm font-semibold">{usage.count}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-400">Cost</p>
                          <p className="text-sm font-semibold">${usage.cost.toFixed(4)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-400">Tokens</p>
                          <p className="text-sm font-semibold">{formatTokens(usage.total_tokens)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-400">Err %</p>
                          <p className={`text-sm font-semibold ${Number(errorRate) > 10 ? 'text-red-600' : ''}`}>{errorRate}%</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </TabsContent>

        {/* ── History Tab ── */}
        <TabsContent value="history" className="mt-4 space-y-3">
          {brand.run_history.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No run history</p>
            </div>
          ) : (
            brand.run_history.map(sim => (
              <div key={sim.id} className={`p-3 rounded-lg border ${sim.status === 'failed' ? 'border-red-100 bg-red-50/30' : 'border-zinc-100 bg-zinc-50/50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <SimStatusBadge status={sim.status} />
                  <span className="text-[10px] text-zinc-400"><RelativeTime date={sim.created_at} /></span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-400">Jobs</span>
                    <p className="font-medium">{sim.completed_jobs}/{sim.total_jobs}</p>
                  </div>
                  <div>
                    <span className="text-zinc-400">Failed</span>
                    <p className={`font-medium ${sim.failed_jobs > 0 ? 'text-red-600' : ''}`}>{sim.failed_jobs}</p>
                  </div>
                  <div>
                    <span className="text-zinc-400">Duration</span>
                    <p className="font-medium">{formatDuration(sim.duration_ms)}</p>
                  </div>
                  <div>
                    <span className="text-zinc-400">Responses</span>
                    <p className="font-medium">{sim.success_count}/{sim.response_count}</p>
                  </div>
                  <div>
                    <span className="text-zinc-400">Cost</span>
                    <p className="font-medium">${sim.total_cost.toFixed(4)}</p>
                  </div>
                  <div>
                    <span className="text-zinc-400">Avg Resp</span>
                    <p className="font-medium">{sim.avg_response_ms ? `${(sim.avg_response_ms / 1000).toFixed(1)}s` : '—'}</p>
                  </div>
                </div>
                <div className="mt-2 text-[10px] font-mono text-zinc-400">{sim.id}</div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ═══════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════

export function AccountDetailView({
  account,
  subscriptionPlans,
  userEmail,
}: {
  account: AccountData
  subscriptionPlans: SubscriptionPlan[]
  userEmail?: string
}) {
  const router = useRouter()

  // Run
  const [runningBrands, setRunningBrands] = useState<Set<string>>(new Set())
  const [runResults, setRunResults] = useState<Record<string, { success: boolean; message: string } | null>>({})

  // Dialogs
  const [ghostDialog, setGhostDialog] = useState(false)
  const [isGhosting, setIsGhosting] = useState(false)

  const [suspendDialog, setSuspendDialog] = useState(false)
  const [suspendLoading, setSuspendLoading] = useState(false)

  const [deleteDialog, setDeleteDialog] = useState<Brand | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

  const [pauseDialog, setPauseDialog] = useState<Brand | null>(null)
  const [pauseReason, setPauseReason] = useState("")
  const [pauseLoading, setPauseLoading] = useState(false)

  const [subDialog, setSubDialog] = useState(false)
  const [subAction, setSubAction] = useState("")
  const [subPlanId, setSubPlanId] = useState("")
  const [subStatus, setSubStatus] = useState("")
  const [subEndDate, setSubEndDate] = useState("")
  const [subLoading, setSubLoading] = useState(false)
  const [subError, setSubError] = useState<string | null>(null)

  const [detailBrand, setDetailBrand] = useState<Brand | null>(null)

  const isSuspended = account.subscription?.status === 'suspended' ||
    (account.brands.length > 0 && account.brands.every(b => b.auto_run_paused && b.auto_run_pause_reason === 'Account suspended by admin'))

  const simHealth = account.total_runs > 0
    ? (((account.total_runs - account.total_failures) / account.total_runs) * 100).toFixed(0)
    : '100'

  // ── Action handlers ──

  const runRun = async (brandId: string) => {
    setRunningBrands(prev => new Set(prev).add(brandId))
    setRunResults(prev => ({ ...prev, [brandId]: null }))
    try {
      const res = await fetch('/api/admin/run-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId })
      })
      const data = await res.json()
      setRunResults(prev => ({
        ...prev,
        [brandId]: { success: res.ok, message: data.message || (res.ok ? 'Done' : 'Failed') }
      }))
    } catch {
      setRunResults(prev => ({ ...prev, [brandId]: { success: false, message: 'Error' } }))
    } finally {
      setRunningBrands(prev => { const n = new Set(prev); n.delete(brandId); return n })
    }
  }

  const toggleAutoRun = async (brand: Brand, paused: boolean, reason?: string) => {
    setPauseLoading(true)
    try {
      const res = await fetch('/api/admin/brands/toggle-auto-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId: brand.id, paused, reason })
      })
      if (res.ok) {
        router.refresh()
        setPauseDialog(null)
        setPauseReason("")
      }
    } catch (e) {
      console.error('Failed to toggle auto-run:', e)
    } finally {
      setPauseLoading(false)
    }
  }

  const startGhost = async () => {
    setIsGhosting(true)
    try {
      const res = await fetch('/api/admin/ghost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: account.id })
      })
      const data = await res.json()
      if (res.ok && data.redirectUrl) window.location.href = data.redirectUrl
    } catch (e) {
      console.error('Ghost failed:', e)
    } finally {
      setIsGhosting(false)
      setGhostDialog(false)
    }
  }

  const deleteBrand = async () => {
    if (!deleteDialog) return
    setDeleteLoading(true)
    try {
      const res = await fetch('/api/admin/brands/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId: deleteDialog.id })
      })
      if (res.ok) {
        router.refresh()
        setDeleteDialog(null)
        setDeleteConfirmText("")
      }
    } catch (e) {
      console.error('Delete brand failed:', e)
    } finally {
      setDeleteLoading(false)
    }
  }

  const suspendAccount = async () => {
    setSuspendLoading(true)
    try {
      const res = await fetch('/api/admin/accounts/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: account.id, suspended: !isSuspended })
      })
      if (res.ok) {
        router.refresh()
        setSuspendDialog(false)
      }
    } catch (e) {
      console.error('Suspend failed:', e)
    } finally {
      setSuspendLoading(false)
    }
  }

  const updateSubscription = async () => {
    if (!subAction) return
    setSubLoading(true)
    setSubError(null)
    try {
      const body: any = { accountId: account.id, action: subAction }
      if (subAction === 'change_plan' && subPlanId) body.planId = subPlanId
      if (subAction === 'change_status' && subStatus) body.status = subStatus
      if (subAction === 'extend' && subEndDate) body.endDate = subEndDate
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (res.ok) {
        router.refresh()
        setSubDialog(false)
        setSubAction("")
        setSubPlanId("")
        setSubStatus("")
        setSubEndDate("")
      } else {
        setSubError(data.error || 'Failed to update subscription')
      }
    } catch (e) {
      console.error('Subscription update failed:', e)
      setSubError('Network error — please try again')
    } finally {
      setSubLoading(false)
    }
  }

  // ── Title & breadcrumb ──
  const titleEl = (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => router.push('/admin')} className="gap-1.5 text-zinc-500 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Accounts
      </Button>
      <span className="text-zinc-300">/</span>
      <div className="flex items-center gap-2">
        {account.logo_url ? (
          <img src={account.logo_url} alt="" className="h-7 w-7 rounded-lg object-cover" />
        ) : (
          <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${isSuspended ? 'bg-red-100' : 'bg-zinc-100'}`}>
            {isSuspended ? <Ban className="h-3.5 w-3.5 text-red-500" /> : <Building2 className="h-3.5 w-3.5 text-zinc-600" />}
          </div>
        )}
        <span className="font-semibold text-zinc-900">{account.name}</span>
        {isSuspended && <Badge variant="destructive" className="text-[10px]">Suspended</Badge>}
        {!account.is_active && <Badge variant="outline" className="text-[10px] bg-zinc-100">Inactive</Badge>}
        {account.account_type && <Badge variant="outline" className="text-[10px] capitalize">{account.account_type}</Badge>}
      </div>
    </div>
  )

  const headerActionsEl = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Actions <MoreHorizontal className="h-4 w-4 ml-1.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => setGhostDialog(true)}>
          <Ghost className="h-4 w-4 mr-2" /> Ghost into account
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setSubDialog(true)}>
          <CreditCard className="h-4 w-4 mr-2" /> Manage subscription
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setSuspendDialog(true)}
          className={isSuspended ? 'text-emerald-600 focus:text-emerald-600' : 'text-red-600 focus:text-red-600'}
        >
          {isSuspended
            ? <><ShieldCheck className="h-4 w-4 mr-2" /> Unsuspend account</>
            : <><ShieldAlert className="h-4 w-4 mr-2" /> Suspend account</>
          }
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <>
      <AdminShell
        userEmail={userEmail}
        activeTab="accounts"
        title={titleEl}
        headerActions={headerActionsEl}
      >
        <div className="space-y-6">

          {/* ═══ OVERVIEW STATS ═══ */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <StatCard label="Brands" value={account.brands.length} icon={<BarChart3 className="h-4 w-4 text-orange-600" />} />
            <StatCard label="Members" value={account.users.length} icon={<Users className="h-4 w-4 text-violet-600" />} />
            <StatCard label="Total Sims" value={account.total_runs} icon={<Activity className="h-4 w-4 text-blue-600" />} />
            <StatCard label="API Cost" value={`$${account.total_cost.toFixed(2)}`} icon={<DollarSign className="h-4 w-4 text-emerald-600" />} />
            <StatCard label="Sim Health" value={`${simHealth}%`} icon={<CheckCircle className="h-4 w-4 text-emerald-600" />} />
            <StatCard
              label="Failures"
              value={account.total_failures}
              icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
              alert={account.total_failures > 0}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ═══ LEFT COLUMN: Account Info + Subscription + Members ═══ */}
            <div className="space-y-6">

              {/* Account Info Card */}
              <Card className="border-zinc-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-zinc-500" /> Account Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0.5">
                  <InfoRow label="Industry" value={account.industry} icon={<Briefcase className="h-3.5 w-3.5" />} />
                  <InfoRow label="Company Size" value={account.company_size ? account.company_size.charAt(0).toUpperCase() + account.company_size.slice(1) : null} icon={<Users className="h-3.5 w-3.5" />} />
                  {account.description && (
                    <InfoRow label="Description" value={account.description} icon={<Info className="h-3.5 w-3.5" />} />
                  )}
                  <Separator className="my-2" />
                  <div className="text-xs text-zinc-400 space-y-1 pt-1">
                    <div>Created: <FormattedDate date={account.created_at} /></div>
                    {account.updated_at && <div>Updated: <FormattedDate date={account.updated_at} /></div>}
                    {account.slug && <div>Slug: <span className="font-mono text-zinc-500">{account.slug}</span></div>}
                    <div>ID: <span className="font-mono text-[10px] text-zinc-500">{account.id}</span></div>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Card */}
              <Card className="border-zinc-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-zinc-500" /> Subscription
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setSubDialog(true)}>
                      Manage
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {account.subscription ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">{account.subscription.plan_name}</span>
                        <StatusBadge status={account.subscription.status} />
                      </div>
                      <Separator />
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Price</span>
                          <span className="font-medium">${account.subscription.price}/mo</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Cycle</span>
                          <span className="capitalize">{account.subscription.billing_cycle || 'monthly'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Auto-renew</span>
                          <span>{account.subscription.auto_renew ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Period end</span>
                          <span><FormattedDate date={account.subscription.end_date} /></span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-zinc-400">
                      <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No subscription</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Members Card */}
              <Card className="border-zinc-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-zinc-500" /> Members ({account.users.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {account.users.length === 0 ? (
                    <div className="text-center py-6 text-zinc-400">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No members</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {account.users.map((user, idx) => (
                        <div key={user.id || `user-${idx}`} className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                            ) : (
                              <User className="h-4 w-4 text-zinc-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-zinc-900 truncate">
                                {user.name}
                              </p>
                              <Badge variant="outline" className="text-[10px] capitalize shrink-0">{user.role}</Badge>
                              {!user.is_active && <Badge variant="outline" className="text-[10px] bg-zinc-100 shrink-0">Inactive</Badge>}
                            </div>
                            <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-400">
                              {user.joined_at && <span>Joined <RelativeTime date={user.joined_at} /></span>}
                              {user.last_active_at && <span>Active <RelativeTime date={user.last_active_at} /></span>}
                              {user.region && <span className="capitalize">{user.region.replace('_', ' ')}</span>}
                              {user.onboarding_completed && <span className="text-emerald-500">Onboarded</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ═══ RIGHT COLUMN: Brands (2 cols) ═══ */}
            <div className="lg:col-span-2">
              <Card className="border-zinc-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-zinc-500" /> Brands ({account.brands.length})
                    {account.subscription?.max_brands != null && account.brands.length > account.subscription.max_brands && (
                      <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 ml-1">
                        {account.brands.length - account.subscription.max_brands} over limit ({account.subscription.max_brands} max)
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {account.brands.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No brands configured</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-100">
                      {account.brands.map((brand, idx) => {
                        const overQuota = account.subscription?.max_brands != null && idx >= account.subscription.max_brands
                        return (
                        <div
                          key={brand.id}
                          className={`group px-4 py-3 transition-colors cursor-pointer ${overQuota ? 'bg-zinc-50 opacity-50 grayscale' : 'hover:bg-zinc-50/80'} ${!brand.is_active ? 'opacity-50' : ''}`}
                          onClick={() => setDetailBrand(brand)}
                        >
                          <div className="flex items-center gap-3">
                            {/* Icon */}
                            {brand.logo_url ? (
                              <img src={brand.logo_url} alt="" className="h-9 w-9 rounded-lg object-cover shrink-0" />
                            ) : (
                              <div className="h-9 w-9 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                                <BarChart3 className="h-4 w-4 text-zinc-400" />
                              </div>
                            )}

                            {/* Name + meta */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-zinc-900 truncate">{brand.name}</h3>
                                {brand.auto_run_paused && (
                                  <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 py-0">Paused</Badge>
                                )}
                                {brand.has_recent_failure && (
                                  <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" title="Recent failure" />
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                                {brand.primary_domain && <span>{brand.primary_domain}</span>}
                                {brand.primary_domain && brand.industry && <span>·</span>}
                                {brand.industry && <span>{brand.industry}</span>}
                                {(brand.primary_domain || brand.industry) && brand.business_model && <span>·</span>}
                                {brand.business_model && <span className="uppercase">{brand.business_model}</span>}
                              </div>
                            </div>

                            {/* Inline stats */}
                            <div className="hidden sm:flex items-center gap-4 shrink-0 text-xs text-zinc-500">
                              <div className="text-center w-12">
                                <p className="font-semibold text-zinc-900">{brand.run_count}</p>
                                <p className="text-[10px] text-zinc-400">sims</p>
                              </div>
                              <div className="text-center w-14">
                                <p className="font-semibold text-zinc-900">${brand.total_cost.toFixed(2)}</p>
                                <p className="text-[10px] text-zinc-400">cost</p>
                              </div>
                              <div className="text-center w-14">
                                <SimStatusBadge status={brand.last_status} />
                              </div>
                              {brand.total_failures > 0 && (
                                <div className="text-center w-10">
                                  <p className="font-semibold text-red-600">{brand.total_failures}</p>
                                  <p className="text-[10px] text-red-400">fails</p>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => runRun(brand.id)}
                                disabled={runningBrands.has(brand.id)}
                              >
                                {runningBrands.has(brand.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => runRun(brand.id)} disabled={runningBrands.has(brand.id)}>
                                    <Play className="h-4 w-4 mr-2" /> Run run
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setDetailBrand(brand)}>
                                    <Eye className="h-4 w-4 mr-2" /> View details
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {brand.auto_run_paused ? (
                                    <DropdownMenuItem onClick={() => toggleAutoRun(brand, false)}>
                                      <Play className="h-4 w-4 mr-2" /> Resume auto-run
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => setPauseDialog(brand)}>
                                      <Pause className="h-4 w-4 mr-2" /> Pause auto-run
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setDeleteDialog(brand)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete brand
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <ChevronRight className="h-4 w-4 text-zinc-300 ml-1" />
                            </div>
                          </div>

                          {/* Contextual alerts — only show when relevant */}
                          {(overQuota || runResults[brand.id] || runningBrands.has(brand.id) || brand.last_error) && (
                            <div className="mt-2 ml-12 space-y-1.5">
                              {overQuota && (
                                <div className="px-2.5 py-1.5 rounded text-xs bg-amber-50 text-amber-700 flex items-center gap-1.5">
                                  <AlertTriangle className="h-3 w-3" /> Over plan limit — this brand will be restricted
                                </div>
                              )}
                              {runResults[brand.id] && (
                                <div className={`px-2.5 py-1.5 rounded text-xs ${
                                  runResults[brand.id]!.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                }`}>
                                  {runResults[brand.id]!.success ? <CheckCircle className="h-3 w-3 inline-block mr-1" /> : <XCircle className="h-3 w-3 inline-block mr-1" />}
                                  {runResults[brand.id]!.message}
                                </div>
                              )}
                              {runningBrands.has(brand.id) && (
                                <div className="px-2.5 py-1.5 rounded text-xs bg-blue-50 text-blue-700 flex items-center gap-1.5">
                                  <Loader2 className="h-3 w-3 animate-spin" /> Running run...
                                </div>
                              )}
                              {brand.last_error && !runResults[brand.id] && (
                                <div className="px-2.5 py-1.5 rounded text-xs bg-red-50 text-red-600 truncate">
                                  <AlertTriangle className="h-3 w-3 inline-block mr-1" /> {brand.last_error}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AdminShell>

      {/* ═══ DIALOGS ═══ */}

      {/* Ghost */}
      <Dialog open={ghostDialog} onOpenChange={setGhostDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Ghost className="h-5 w-5" /> Ghost Session</DialogTitle>
            <DialogDescription>
              You will be logged into <strong>{account.name}</strong>&apos;s account. Session lasts 1 hour.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGhostDialog(false)}>Cancel</Button>
            <Button onClick={startGhost} disabled={isGhosting}>
              {isGhosting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Ghost className="h-4 w-4 mr-2" />}
              Start Ghost Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend */}
      <Dialog open={suspendDialog} onOpenChange={setSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isSuspended
                ? <><ShieldCheck className="h-5 w-5 text-emerald-600" /> Unsuspend Account</>
                : <><ShieldAlert className="h-5 w-5 text-red-600" /> Suspend Account</>
              }
            </DialogTitle>
            <DialogDescription>
              {isSuspended
                ? <>This will reactivate <strong>{account.name}</strong>, resume all brand auto-runs, and restore the subscription.</>
                : <>This will pause all brand runs for <strong>{account.name}</strong> and suspend their subscription.</>
              }
            </DialogDescription>
          </DialogHeader>
          {!isSuspended && (
            <div className="py-2">
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800">
                <p className="font-medium mb-1">Suspending will:</p>
                <ul className="list-disc list-inside text-xs space-y-0.5">
                  <li>Pause auto-run on all {account.brands.length} brand(s)</li>
                  <li>Set subscription status to suspended</li>
                  <li>No data will be deleted</li>
                </ul>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialog(false)}>Cancel</Button>
            <Button variant={isSuspended ? "default" : "destructive"} onClick={suspendAccount} disabled={suspendLoading}>
              {suspendLoading
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : isSuspended ? <ShieldCheck className="h-4 w-4 mr-2" /> : <ShieldAlert className="h-4 w-4 mr-2" />
              }
              {isSuspended ? 'Unsuspend Account' : 'Suspend Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Brand */}
      <Dialog open={!!deleteDialog} onOpenChange={() => { setDeleteDialog(null); setDeleteConfirmText("") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" /> Delete Brand
            </DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{deleteDialog?.name}</strong> including all runs, responses, analysis data, and stored files. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-800">
              <p className="font-medium mb-1">The following data will be deleted:</p>
              <ul className="list-disc list-inside text-xs space-y-0.5">
                <li>All run runs and response files</li>
                <li>All response analysis records</li>
                <li>All user prompts for this brand</li>
                <li>All stored LLM response files</li>
                <li>The brand record itself</li>
              </ul>
            </div>
            <div>
              <Label className="text-sm">
                Type <strong className="text-red-600">{deleteDialog?.name}</strong> to confirm
              </Label>
              <Input
                className="mt-1.5"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Brand name..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialog(null); setDeleteConfirmText("") }}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={deleteBrand}
              disabled={deleteLoading || deleteConfirmText !== deleteDialog?.name}
            >
              {deleteLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Brand Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pause Auto-Run */}
      <Dialog open={!!pauseDialog} onOpenChange={() => { setPauseDialog(null); setPauseReason("") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pause className="h-5 w-5" /> Pause Auto-Run</DialogTitle>
            <DialogDescription>
              This will stop automatic daily runs for <strong>{pauseDialog?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="pause-reason">Reason (optional)</Label>
            <Textarea
              id="pause-reason"
              className="mt-2"
              placeholder="e.g., Investigating errors, Account under review..."
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPauseDialog(null); setPauseReason("") }}>Cancel</Button>
            <Button variant="destructive" onClick={() => pauseDialog && toggleAutoRun(pauseDialog, true, pauseReason)} disabled={pauseLoading}>
              {pauseLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Pause className="h-4 w-4 mr-2" />}
              Pause Auto-Run
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Subscription */}
      <Dialog open={subDialog} onOpenChange={(open) => { setSubDialog(open); if (!open) { setSubAction(""); setSubPlanId(""); setSubStatus(""); setSubEndDate(""); setSubError(null) } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Manage Subscription</DialogTitle>
            <DialogDescription>Manage subscription for <strong>{account.name}</strong></DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {account.subscription && (
              <div className="p-3 bg-zinc-50 rounded-lg text-sm flex items-center justify-between">
                <span>Current: <strong>{account.subscription.plan_name}</strong></span>
                <StatusBadge status={account.subscription.status} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={subAction} onValueChange={setSubAction}>
                <SelectTrigger><SelectValue placeholder="Select action" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="change_plan">Change Plan</SelectItem>
                  <SelectItem value="change_status">Change Status</SelectItem>
                  <SelectItem value="extend">Extend Period</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {subAction === 'change_plan' && (
              <div className="space-y-2">
                <Label>New Plan</Label>
                <Select value={subPlanId} onValueChange={setSubPlanId}>
                  <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                  <SelectContent>
                    {subscriptionPlans.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.display_name} - ${p.monthly_price_usd}/mo</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {subAction === 'change_status' && (
              <div className="space-y-2">
                <Label>New Status</Label>
                <Select value={subStatus} onValueChange={setSubStatus}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trialing">Trialing</SelectItem>
                    <SelectItem value="past_due">Past Due</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {subAction === 'extend' && (
              <div className="space-y-2">
                <Label>New End Date</Label>
                <Input
                  type="date"
                  value={subEndDate}
                  onChange={(e) => setSubEndDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}
            {subError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {subError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSubDialog(false); setSubAction(""); setSubPlanId(""); setSubStatus(""); setSubEndDate("") }}>Cancel</Button>
            <Button onClick={updateSubscription} disabled={subLoading || !subAction}>
              {subLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Brand Detail Sheet */}
      <Sheet open={!!detailBrand} onOpenChange={() => setDetailBrand(null)}>
        <SheetContent className="w-[560px] sm:max-w-[560px] overflow-y-auto">
          {detailBrand && (
            <>
              <SheetHeader className="mb-0">
                <SheetTitle className="sr-only">{detailBrand.name} Details</SheetTitle>
                <SheetDescription className="sr-only">Full detail view for brand {detailBrand.name}</SheetDescription>
              </SheetHeader>
              <BrandDetailPanel
                brand={detailBrand}
                accountName={account.name}
                onRunRun={() => runRun(detailBrand.id)}
                isRunning={runningBrands.has(detailBrand.id)}
                runResult={runResults[detailBrand.id] || null}
              />
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
