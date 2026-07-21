"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Play, Loader2, RefreshCw, ChevronDown, ChevronRight, AlertTriangle, CheckCircle,
  XCircle, User, CreditCard, Building2, DollarSign, Activity, Users, Eye, AlertCircle,
  Search, Ghost, Pause, PlayCircle, Settings, FileWarning, BarChart3,
  Clock, TrendingUp, Calendar, MoreHorizontal, LogOut, Trash2, Ban,
  ShieldAlert, ShieldCheck, ChevronUp, ChevronLeft,
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { AgentConfigManager } from "@/components/admin/agent-config-manager"
import { SubscriptionPlanManager } from "@/components/admin/subscription-plan-manager"
import { QueryResponseConfig } from "@/components/admin/query-response-config"
import { PromptDesignConfig } from "@/components/admin/prompt-design-config"
import { InsightAgentConfig } from "@/components/admin/insight-agent-config"
import { Globe, ExternalLink, Link2, BookOpen, MapPin, Cpu, FileText } from "lucide-react"
import { AdminShell, type Tab } from "./components/admin-shell"
import { LeadsSection } from "./components/leads-section"

// ═══════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════

interface AccountUser {
  id: string
  role: string
  email: string
  name: string
}

interface Brand {
  id: string
  name: string
  last_run: string | null
  last_status: string | null
  has_recent_failure: boolean
  total_failures: number
  last_error: string | null
  total_cost: number
  model_usage: Record<string, { count: number; cost: number }>
  run_count: number
  auto_run_paused?: boolean
  auto_run_paused_at?: string | null
  auto_run_pause_reason?: string | null
  primary_domain?: string
  brand_categories?: string[]
  target_markets?: string[]
  products_services?: string
  target_audience?: string
  known_competitors?: string[]
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
}

interface Account {
  id: string
  name: string
  created_at: string
  total_cost: number
  subscription: Subscription | null
  users: AccountUser[]
  brands: Brand[]
  issues: {
    subscription: boolean
    run: boolean
  }
}

interface Metrics {
  totalAccounts: number
  totalBrands: number
  totalUsers: number
  activeSubscriptions: number
  mrr: number
  totalApiCost: number
  runHealth: number
}

interface SubscriptionPlan {
  id: string
  name: string
  display_name: string
  monthly_price_usd: number
  features: any
}

interface ErrorLog {
  id: string
  type: string
  severity: string
  timestamp: string
  message: string
  context: any
  brand: { id: string; name: string } | null
  account: { id: string; name: string } | null
}

interface CronLog {
  id: string
  job_name: string
  status: 'started' | 'completed' | 'failed' | 'skipped'
  started_at: string
  completed_at: string | null
  duration_ms: number | null
  brands_checked: number
  brands_needed_run: number
  brands_processed: number
  brands_successful: number
  brands_failed: number
  brands_remaining: number
  results: Array<{ brand: string; success: boolean; error?: string; run_id?: string }>
  error_message: string | null
  error_details: any
  metadata: any
}

interface CronLogsSummary {
  total: number
  by_status: { completed: number; failed: number; skipped: number; started: number }
  total_brands_processed: number
  total_brands_failed: number
  avg_duration_ms: number
  last_24h: { runs: number; completed: number; failed: number; skipped: number }
}

interface CronSchedule {
  cron_expression: string
  description: string
  next_run: string
}

interface AggregatedSource {
  id: string
  domain: string
  total_citations: number
  unique_urls: string[]
  unique_brands: string[]
  unique_accounts: string[]
  citation_types: Record<string, number>
  avg_position: number | null
  first_seen: string
  last_seen: string
  brand_breakdown: Record<string, { count: number; urls: string[] }>
  geography?: string[]
  topics?: string[]
  brand_categories?: string[]
  is_authoritative: boolean
  trust_score: number
}

interface SourceAnalysisSummary {
  total_citations: number
  unique_domains: number
  authoritative_sources: number
  type_breakdown: Record<string, number>
  all_topics: string[]
  all_geographies: string[]
}

interface AdminViewProps {
  accounts: Account[]
  metrics: Metrics
  subscriptionPlans: SubscriptionPlan[]
  userEmail?: string
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

function FormattedDateTime({ date }: { date: string | Date | null }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!date) return <span className="text-zinc-400">Never</span>
  if (!mounted) return <span>...</span>
  return <span>{new Date(date).toLocaleString()}</span>
}

function FormattedDate({ date }: { date: string | Date | null }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!date) return <span className="text-zinc-400">Never</span>
  if (!mounted) return <span>...</span>
  return <span>{new Date(date).toLocaleDateString()}</span>
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

function MetricCard({ label, value, icon, alert }: { label: string; value: string | number; icon: React.ReactNode; alert?: boolean }) {
  return (
    <Card className={`border ${alert ? 'border-red-200 bg-red-50/30' : 'border-zinc-200'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-semibold mt-0.5 ${alert ? 'text-red-600' : 'text-zinc-900'}`}>{value}</p>
          </div>
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${alert ? 'bg-red-100' : 'bg-zinc-100'}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════════
//  ACCOUNTS SECTION — Clickable account cards
// ═══════════════════════════════════════════

function AccountsSection({
  accounts,
  metrics,
  searchQuery,
  onGhost,
  onSuspend,
  onManageSubscription,
  onDelete,
}: {
  accounts: Account[]
  metrics: Metrics
  searchQuery: string
  onGhost: (account: Account) => void
  onSuspend: (account: Account) => void
  onManageSubscription: (account: Account) => void
  onDelete: (account: Account) => void
}) {
  const filteredAccounts = accounts.filter(account => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      account.name.toLowerCase().includes(q) ||
      account.users.some(u => u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)) ||
      account.brands.some(b => b.name.toLowerCase().includes(q))
    )
  })

  const isSuspended = (account: Account) =>
    account.subscription?.status === 'suspended' ||
    (account.brands.length > 0 && account.brands.every(b => b.auto_run_paused && b.auto_run_pause_reason === 'Account suspended by admin'))

  const accountsWithIssues = filteredAccounts.filter(a => a.issues.subscription || a.issues.run).length

  return (
    <div className="space-y-4">
      {/* Metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        <MetricCard label="MRR" value={`$${metrics.mrr.toLocaleString()}`} icon={<DollarSign className="h-4 w-4 text-emerald-600" />} />
        <MetricCard label="API Cost" value={`$${metrics.totalApiCost.toFixed(2)}`} icon={<TrendingUp className="h-4 w-4 text-amber-600" />} />
        <MetricCard label="Active Subs" value={metrics.activeSubscriptions} icon={<CreditCard className="h-4 w-4 text-blue-600" />} />
        <MetricCard label="Accounts" value={metrics.totalAccounts} icon={<Building2 className="h-4 w-4 text-violet-600" />} />
        <MetricCard label="Brands" value={metrics.totalBrands} icon={<BarChart3 className="h-4 w-4 text-orange-600" />} />
        <MetricCard label="Health" value={`${metrics.runHealth.toFixed(0)}%`} icon={<Activity className="h-4 w-4 text-emerald-600" />} />
        <MetricCard label="Issues" value={accountsWithIssues} icon={<AlertCircle className="h-4 w-4 text-red-500" />} alert={accountsWithIssues > 0} />
      </div>

      {/* Account cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-500">{filteredAccounts.length} account{filteredAccounts.length !== 1 ? 's' : ''}</h3>
        </div>

        {filteredAccounts.length === 0 ? (
          <Card className="border-zinc-200">
            <CardContent className="py-12 text-center text-zinc-400">
              No accounts match your search
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredAccounts.map(account => {
              const suspended = isSuspended(account)
              const hasIssues = account.issues.subscription || account.issues.run
              const healthyBrands = account.brands.filter(b => b.last_status === 'completed' && !b.auto_run_paused).length
              const pausedBrands = account.brands.filter(b => b.auto_run_paused).length
              const failedBrands = account.brands.filter(b => b.has_recent_failure).length

              return (
                <Link
                  key={account.id}
                  href={`/admin/accounts/${account.id}`}
                  className={`block rounded-xl border transition-all hover:border-zinc-300 hover:bg-white ${
                    suspended ? 'border-red-200 bg-red-50/30' : hasIssues ? 'border-amber-200 bg-amber-50/20' : 'border-zinc-200 bg-white'
                  }`}
                >
                  <div className="px-5 py-4">
                    <div className="flex items-center gap-4">
                      {/* Account icon */}
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                        suspended ? 'bg-red-100' : 'bg-zinc-100'
                      }`}>
                        {suspended
                          ? <Ban className="h-5 w-5 text-red-500" />
                          : <Building2 className="h-5 w-5 text-zinc-600" />
                        }
                      </div>

                      {/* Name + meta */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-900 truncate">{account.name}</span>
                          {suspended && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Suspended</Badge>}
                          {hasIssues && !suspended && (
                            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 gap-0.5">
                              <AlertCircle className="h-2.5 w-2.5" /> Issues
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-zinc-500 mt-1">
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" /> {account.brands.length} brand{account.brands.length !== 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {account.users.length} member{account.users.length !== 1 ? 's' : ''}
                          </span>
                          <span>Created <RelativeTime date={account.created_at} /></span>
                        </div>
                      </div>

                      {/* Stats pills */}
                      <div className="hidden md:flex items-center gap-2 shrink-0">
                        {healthyBrands > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium">
                            <CheckCircle className="h-3 w-3" /> {healthyBrands}
                          </span>
                        )}
                        {failedBrands > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-700 text-xs font-medium">
                            <AlertTriangle className="h-3 w-3" /> {failedBrands}
                          </span>
                        )}
                        {pausedBrands > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium">
                            <Pause className="h-3 w-3" /> {pausedBrands}
                          </span>
                        )}
                      </div>

                      {/* Subscription */}
                      <div className="hidden lg:flex items-center gap-2 shrink-0">
                        {account.subscription ? (
                          <>
                            <span className="text-sm text-zinc-600">{account.subscription.plan_name}</span>
                            <StatusBadge status={account.subscription.status} />
                          </>
                        ) : (
                          <span className="text-xs text-zinc-400 italic">No plan</span>
                        )}
                      </div>

                      {/* Cost */}
                      <div className="hidden xl:block text-sm font-medium text-zinc-600 shrink-0 w-20 text-right">
                        ${account.total_cost?.toFixed(2) || '0.00'}
                      </div>

                      {/* Quick actions */}
                      <div className="shrink-0" onClick={e => e.preventDefault()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel className="text-xs text-zinc-500">Quick Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); onGhost(account) }}>
                              <Ghost className="h-4 w-4 mr-2" /> Ghost into account
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); onManageSubscription(account) }}>
                              <CreditCard className="h-4 w-4 mr-2" /> Manage subscription
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => { e.preventDefault(); onSuspend(account) }}
                              className={suspended ? 'text-emerald-600 focus:text-emerald-600' : 'text-red-600 focus:text-red-600'}
                            >
                              {suspended ? (
                                <><ShieldCheck className="h-4 w-4 mr-2" /> Unsuspend account</>
                              ) : (
                                <><ShieldAlert className="h-4 w-4 mr-2" /> Suspend account</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => { e.preventDefault(); onDelete(account) }}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Navigate indicator */}
                      <ChevronRight className="h-4 w-4 text-zinc-300 shrink-0" />
                    </div>

                    {/* Brand preview row */}
                    {account.brands.length > 0 && (
                      <div className="mt-3 ml-15 flex flex-wrap gap-1.5">
                        {account.brands.slice(0, 5).map(brand => (
                          <span
                            key={brand.id}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                              brand.auto_run_paused
                                ? 'bg-amber-50/50 text-amber-600 border-amber-200'
                                : brand.has_recent_failure
                                  ? 'bg-red-50/50 text-red-600 border-red-200'
                                  : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                            }`}
                          >
                            {brand.name}
                            {brand.last_status === 'completed' && <CheckCircle className="h-2.5 w-2.5 text-emerald-500" />}
                            {brand.has_recent_failure && <AlertTriangle className="h-2.5 w-2.5 text-red-500" />}
                            {brand.auto_run_paused && <Pause className="h-2.5 w-2.5 text-amber-500" />}
                          </span>
                        ))}
                        {account.brands.length > 5 && (
                          <span className="text-[11px] text-zinc-400 px-2 py-0.5">+{account.brands.length - 5} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
//  SUBSCRIPTIONS SECTION
// ═══════════════════════════════════════════

function SubscriptionsSection({
  accounts,
  metrics,
  searchQuery,
  onManageSubscription,
}: {
  accounts: Account[]
  metrics: Metrics
  searchQuery: string
  onManageSubscription: (account: Account) => void
}) {
  const [view, setView] = useState<'plans' | 'accounts' | 'stripe'>('plans')
  const [stripeData, setStripeData] = useState<any>(null)
  const [stripeLoading, setStripeLoading] = useState(false)
  const [syncingAll, setSyncingAll] = useState(false)
  const [syncingAccount, setSyncingAccount] = useState<string | null>(null)
  const [grantTrialDialog, setGrantTrialDialog] = useState<{ accountId: string; accountName: string } | null>(null)
  const [trialDays, setTrialDays] = useState('14')
  const [grantingTrial, setGrantingTrial] = useState(false)
  const [cancelingId, setCancelingId] = useState<string | null>(null)

  const fetchStripeOverview = useCallback(async () => {
    setStripeLoading(true)
    try {
      const res = await fetch('/api/admin/stripe-sync')
      const data = await res.json()
      if (data.success) setStripeData(data)
    } catch (e) {
      console.error('Failed to fetch Stripe overview:', e)
    } finally {
      setStripeLoading(false)
    }
  }, [])

  useEffect(() => {
    if (view === 'stripe' && !stripeData) fetchStripeOverview()
  }, [view, stripeData, fetchStripeOverview])

  const handleSyncAll = async () => {
    setSyncingAll(true)
    try {
      const res = await fetch('/api/admin/stripe-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_all' }),
      })
      const data = await res.json()
      if (data.success) {
        alert(`Synced ${data.synced} of ${data.total} accounts (${data.errors} errors)`)
        fetchStripeOverview()
      }
    } catch (e) {
      console.error('Sync all failed:', e)
    } finally {
      setSyncingAll(false)
    }
  }

  const handleSyncAccount = async (accountId: string) => {
    setSyncingAccount(accountId)
    try {
      const res = await fetch('/api/admin/stripe-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_account', account_id: accountId }),
      })
      const data = await res.json()
      if (data.success) fetchStripeOverview()
    } catch (e) {
      console.error('Sync failed:', e)
    } finally {
      setSyncingAccount(null)
    }
  }

  const handleGrantTrial = async () => {
    if (!grantTrialDialog) return
    setGrantingTrial(true)
    try {
      const res = await fetch('/api/admin/stripe-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'grant_trial', account_id: grantTrialDialog.accountId, days: parseInt(trialDays) || 14 }),
      })
      const data = await res.json()
      if (data.success) {
        setGrantTrialDialog(null)
        fetchStripeOverview()
      }
    } catch (e) {
      console.error('Grant trial failed:', e)
    } finally {
      setGrantingTrial(false)
    }
  }

  const handleCancelSubscription = async (accountId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return
    setCancelingId(accountId)
    try {
      const res = await fetch('/api/admin/stripe-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel_subscription', account_id: accountId }),
      })
      const data = await res.json()
      if (data.success) fetchStripeOverview()
    } catch (e) {
      console.error('Cancel failed:', e)
    } finally {
      setCancelingId(null)
    }
  }

  const filtered = accounts.filter(a => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return a.name.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <MetricCard label="Monthly Recurring Revenue" value={`$${metrics.mrr.toLocaleString()}`} icon={<DollarSign className="h-4 w-4 text-emerald-600" />} />
        <MetricCard label="Active Subscriptions" value={metrics.activeSubscriptions} icon={<CreditCard className="h-4 w-4 text-blue-600" />} />
        <MetricCard
          label="Conversion Rate"
          value={`${metrics.totalAccounts > 0 ? ((metrics.activeSubscriptions / metrics.totalAccounts) * 100).toFixed(1) : 0}%`}
          icon={<TrendingUp className="h-4 w-4 text-violet-600" />}
        />
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setView('plans')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            view === 'plans' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Plan Packages
        </button>
        <button
          onClick={() => setView('accounts')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            view === 'accounts' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Account Subscriptions
        </button>
        <button
          onClick={() => setView('stripe')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            view === 'stripe' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Stripe Sync
        </button>
      </div>

      {view === 'plans' ? (
        <SubscriptionPlanManager />
      ) : view === 'stripe' ? (
        <>
          {/* Stripe sync dashboard */}
          {stripeLoading && !stripeData ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-zinc-300" /></div>
          ) : stripeData ? (
            <div className="space-y-4">
              {/* Stripe stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <MetricCard label="Active" value={stripeData.stats.active} icon={<CheckCircle className="h-4 w-4 text-emerald-600" />} />
                <MetricCard label="Trials" value={stripeData.stats.trialing} icon={<Clock className="h-4 w-4 text-blue-600" />} />
                <MetricCard label="Expired" value={stripeData.stats.expired} icon={<XCircle className="h-4 w-4 text-zinc-500" />} />
                <MetricCard label="Past Due" value={stripeData.stats.past_due} icon={<AlertTriangle className="h-4 w-4 text-red-500" />} alert={stripeData.stats.past_due > 0} />
                <MetricCard label="MRR" value={`$${stripeData.stats.mrr.toLocaleString()}`} icon={<DollarSign className="h-4 w-4 text-emerald-600" />} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard label="Expiring Soon" value={stripeData.stats.expiring_soon} icon={<AlertCircle className="h-4 w-4 text-amber-500" />} alert={stripeData.stats.expiring_soon > 0} />
                <MetricCard label="Trial Ending" value={stripeData.stats.trial_ending_soon} icon={<Clock className="h-4 w-4 text-amber-500" />} alert={stripeData.stats.trial_ending_soon > 0} />
                <MetricCard label="Stripe Synced" value={stripeData.stats.stripe_synced} icon={<ShieldCheck className="h-4 w-4 text-blue-600" />} />
                <MetricCard label="Unsynced" value={stripeData.stats.unsynced} icon={<AlertCircle className="h-4 w-4 text-zinc-500" />} />
              </div>

              {/* Actions bar */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={fetchStripeOverview} disabled={stripeLoading}>
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${stripeLoading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={handleSyncAll} disabled={syncingAll}>
                  {syncingAll ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Activity className="h-3.5 w-3.5 mr-1.5" />}
                  Sync All with Stripe
                </Button>
              </div>

              {/* Subscriptions table */}
              <Card className="border-zinc-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">All Subscriptions ({stripeData.subscriptions.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-zinc-50/50">
                        <TableHead>Account</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Days Left</TableHead>
                        <TableHead>Stripe</TableHead>
                        <TableHead>Period End</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stripeData.subscriptions.map((sub: any) => (
                        <TableRow key={sub.id} className={sub.effective_status === 'expired' || sub.effective_status === 'past_due' ? 'bg-red-50/30' : sub.is_trial && sub.days_remaining <= 3 ? 'bg-amber-50/30' : ''}>
                          <TableCell className="font-medium">{sub.account_name}</TableCell>
                          <TableCell>
                            <span className="text-sm">{sub.plan_name}</span>
                            {sub.is_trial && <Badge variant="outline" className="ml-1.5 text-[10px] px-1 py-0 bg-blue-50 text-blue-700 border-blue-200">TRIAL</Badge>}
                          </TableCell>
                          <TableCell><StatusBadge status={sub.effective_status} /></TableCell>
                          <TableCell>
                            <span className={`text-sm font-medium ${sub.days_remaining <= 0 ? 'text-red-600' : sub.days_remaining <= 3 ? 'text-amber-600' : sub.days_remaining <= 7 ? 'text-amber-500' : 'text-zinc-600'}`}>
                              {sub.days_remaining <= 0 ? 'Expired' : `${sub.days_remaining}d`}
                            </span>
                          </TableCell>
                          <TableCell>
                            {sub.stripe_subscription_id ? (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">Synced</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-zinc-50 text-zinc-500 border-zinc-200">Local</Badge>
                            )}
                          </TableCell>
                          <TableCell><FormattedDate date={sub.current_period_end} /></TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel className="text-xs text-zinc-500">Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleSyncAccount(sub.account_id)} disabled={syncingAccount === sub.account_id}>
                                  <RefreshCw className="h-3.5 w-3.5 mr-2" /> Sync with Stripe
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setGrantTrialDialog({ accountId: sub.account_id, accountName: sub.account_name })}>
                                  <Clock className="h-3.5 w-3.5 mr-2" /> Grant Trial
                                </DropdownMenuItem>
                                {['active', 'trialing', 'past_due'].includes(sub.effective_status) && (
                                  <DropdownMenuItem className="text-red-600" onClick={() => handleCancelSubscription(sub.account_id)} disabled={cancelingId === sub.account_id}>
                                    <Ban className="h-3.5 w-3.5 mr-2" /> Cancel Subscription
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-500">Failed to load Stripe data. <Button variant="link" onClick={fetchStripeOverview}>Retry</Button></div>
          )}

          {/* Grant Trial Dialog */}
          <Dialog open={!!grantTrialDialog} onOpenChange={() => { setGrantTrialDialog(null); setTrialDays('14') }}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Grant Trial</DialogTitle>
                <DialogDescription>Grant a free trial to <strong>{grantTrialDialog?.accountName}</strong></DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Trial Duration (days)</Label>
                  <Input type="number" value={trialDays} onChange={e => setTrialDays(e.target.value)} min="1" max="90" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setGrantTrialDialog(null)}>Cancel</Button>
                <Button onClick={handleGrantTrial} disabled={grantingTrial}>
                  {grantingTrial ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Grant {trialDays}-day Trial
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <Card className="border-zinc-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">All Subscriptions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50/50">
                  <TableHead>Account</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Period End</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(account => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>{account.subscription?.plan_name || <span className="text-zinc-400 italic">None</span>}</TableCell>
                    <TableCell>{account.subscription ? `$${account.subscription.price}/mo` : '-'}</TableCell>
                    <TableCell>
                      {account.subscription ? <StatusBadge status={account.subscription.status} /> : <span className="text-zinc-400">-</span>}
                    </TableCell>
                    <TableCell>{account.subscription?.billing_cycle || '-'}</TableCell>
                    <TableCell><FormattedDate date={account.subscription?.end_date || null} /></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => onManageSubscription(account)}>
                        <Settings className="h-3.5 w-3.5 mr-1" /> Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
//  ERROR LOGS SECTION
// ═══════════════════════════════════════════

function ErrorLogsSection() {
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<any>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/error-logs')
      const data = await res.json()
      if (data.success) {
        setLogs(data.logs)
        setSummary(data.summary)
      }
    } catch (e) {
      console.error('Failed to fetch error logs:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  if (loading && !logs.length) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-zinc-300" /></div>
  }

  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Last 24h" value={summary.last_24h} icon={<AlertCircle className="h-4 w-4 text-red-500" />} alert={summary.last_24h > 0} />
          <MetricCard label="Last 7 Days" value={summary.last_7d} icon={<Calendar className="h-4 w-4 text-zinc-500" />} />
          <MetricCard label="Critical" value={summary.by_severity?.critical || 0} icon={<AlertTriangle className="h-4 w-4 text-red-500" />} alert={(summary.by_severity?.critical || 0) > 0} />
          <MetricCard label="Total" value={summary.total} icon={<FileWarning className="h-4 w-4 text-zinc-500" />} />
        </div>
      )}

      <Card className="border-zinc-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Recent Errors</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchLogs}><RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50">
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Brand / Account</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-zinc-400">No errors found</TableCell>
                </TableRow>
              ) : (
                logs.slice(0, 50).map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs"><RelativeTime date={log.timestamp} /></TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{log.type.replace(/_/g, ' ')}</Badge></TableCell>
                    <TableCell>
                      <Badge
                        variant={log.severity === 'critical' ? 'destructive' : 'outline'}
                        className={
                          log.severity === 'error' ? 'bg-red-50 text-red-700 border-red-200'
                            : log.severity === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : ''
                        }
                      >
                        {log.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {log.brand && <span className="font-medium">{log.brand.name}</span>}
                        {log.account && <span className="text-zinc-500 text-xs block">{log.account.name}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-zinc-600 truncate max-w-md" title={log.message}>{log.message}</p>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════
//  CRON JOBS SECTION
// ═══════════════════════════════════════════

function CronJobsSection() {
  const [logs, setLogs] = useState<CronLog[]>([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<CronLogsSummary | null>(null)
  const [schedule, setSchedule] = useState<CronSchedule | null>(null)
  const [triggering, setTriggering] = useState(false)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/cron-logs?limit=50&days=30')
      const data = await res.json()
      if (data.success) {
        setLogs(data.logs)
        setSummary(data.summary)
        setSchedule(data.schedule)
      }
    } catch (e) {
      console.error('Failed to fetch cron logs:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const triggerCron = async () => {
    setTriggering(true)
    try {
      await fetch('/api/admin/cron-logs', { method: 'POST' })
      setTimeout(fetchLogs, 2000)
    } catch (e) {
      console.error('Failed to trigger cron:', e)
    } finally {
      setTriggering(false)
    }
  }

  if (loading && !logs.length) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-zinc-300" /></div>
  }

  return (
    <div className="space-y-4">
      {schedule && (
        <Card className="border-zinc-200 bg-blue-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Daily Run Cron</p>
                  <p className="text-xs text-zinc-500">
                    <code className="bg-white/80 px-1 rounded text-[11px]">{schedule.cron_expression}</code>
                    {' · '}{schedule.description}
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5">Next: <FormattedDateTime date={schedule.next_run} /></p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={triggerCron} disabled={triggering}>
                {triggering ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-1.5" />}
                Run Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MetricCard label="Total (30d)" value={summary.total} icon={<Calendar className="h-4 w-4 text-zinc-500" />} />
          <MetricCard label="Completed" value={summary.by_status.completed} icon={<CheckCircle className="h-4 w-4 text-emerald-600" />} />
          <MetricCard label="Failed" value={summary.by_status.failed} icon={<XCircle className="h-4 w-4 text-red-500" />} alert={summary.by_status.failed > 0} />
          <MetricCard label="Skipped" value={summary.by_status.skipped} icon={<AlertCircle className="h-4 w-4 text-amber-500" />} />
          <MetricCard label="Brands Processed" value={summary.total_brands_processed} icon={<BarChart3 className="h-4 w-4 text-violet-600" />} />
        </div>
      )}

      <Card className="border-zinc-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Run History</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50">
                <TableHead>Started</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Checked</TableHead>
                <TableHead className="text-center">Processed</TableHead>
                <TableHead className="text-center">OK / Fail</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-zinc-400">No cron logs found</TableCell>
                </TableRow>
              ) : (
                logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div>
                        <FormattedDateTime date={log.started_at} />
                        <p className="text-[11px] text-zinc-400"><RelativeTime date={log.started_at} /></p>
                      </div>
                    </TableCell>
                    <TableCell><SimStatusBadge status={log.status} /></TableCell>
                    <TableCell className="text-center font-medium">{log.brands_checked || 0}</TableCell>
                    <TableCell className="text-center font-medium">{log.brands_processed || 0}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-emerald-600 font-medium">{log.brands_successful || 0}</span>
                      <span className="text-zinc-300 mx-1">/</span>
                      <span className={`font-medium ${(log.brands_failed || 0) > 0 ? 'text-red-600' : 'text-zinc-400'}`}>
                        {log.brands_failed || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.duration_ms != null
                        ? log.duration_ms >= 1000 ? `${(log.duration_ms / 1000).toFixed(1)}s` : `${log.duration_ms}ms`
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Eye className="h-3.5 w-3.5" /></Button>
                        </SheetTrigger>
                        <SheetContent className="w-[480px] overflow-y-auto">
                          <SheetHeader>
                            <SheetTitle>Cron Run Details</SheetTitle>
                            <SheetDescription><FormattedDateTime date={log.started_at} /></SheetDescription>
                          </SheetHeader>
                          <div className="mt-6 space-y-5">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 bg-zinc-50 rounded-lg">
                                <p className="text-[11px] text-zinc-500">Status</p>
                                <p className="text-lg font-semibold capitalize">{log.status}</p>
                              </div>
                              <div className="p-3 bg-zinc-50 rounded-lg">
                                <p className="text-[11px] text-zinc-500">Duration</p>
                                <p className="text-lg font-semibold">
                                  {log.duration_ms != null
                                    ? log.duration_ms >= 1000 ? `${(log.duration_ms / 1000).toFixed(1)}s` : `${log.duration_ms}ms`
                                    : 'N/A'
                                  }
                                </p>
                              </div>
                            </div>

                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                              <p className="text-[11px] text-blue-700 font-medium mb-2">Brand Processing</p>
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div><p className="text-zinc-500 text-xs">Checked</p><p className="font-medium">{log.brands_checked || 0}</p></div>
                                <div><p className="text-zinc-500 text-xs">Needed</p><p className="font-medium">{log.brands_needed_run || 0}</p></div>
                                <div><p className="text-zinc-500 text-xs">Processed</p><p className="font-medium">{log.brands_processed || 0}</p></div>
                                <div><p className="text-zinc-500 text-xs">Successful</p><p className="font-medium text-emerald-600">{log.brands_successful || 0}</p></div>
                                <div><p className="text-zinc-500 text-xs">Failed</p><p className={`font-medium ${(log.brands_failed || 0) > 0 ? 'text-red-600' : ''}`}>{log.brands_failed || 0}</p></div>
                                <div><p className="text-zinc-500 text-xs">Remaining</p><p className="font-medium">{log.brands_remaining || 0}</p></div>
                              </div>
                            </div>

                            {log.error_message && (
                              <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                                <p className="text-[11px] text-red-700 font-medium mb-1">Error</p>
                                <code className="text-xs text-red-800 break-all">{log.error_message}</code>
                              </div>
                            )}

                            {log.results && log.results.length > 0 && (
                              <>
                                <Separator />
                                <div>
                                  <p className="text-sm font-medium mb-2">Brand Results</p>
                                  <div className="space-y-1.5">
                                    {log.results.map((r, i) => (
                                      <div key={i} className={`px-3 py-2 rounded-lg text-sm flex items-center justify-between ${r.success ? 'bg-emerald-50' : 'bg-red-50'}`}>
                                        <span className="font-medium">{r.brand}</span>
                                        {r.success
                                          ? <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">OK</Badge>
                                          : <Badge variant="destructive" className="text-[10px]">Failed</Badge>
                                        }
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </SheetContent>
                      </Sheet>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════
//  SOURCE ANALYSIS SECTION
// ═══════════════════════════════════════════

function SourceAnalysisSection() {
  const [sources, setSources] = useState<AggregatedSource[]>([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<SourceAnalysisSummary | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [sortBy, setSortBy] = useState('total_citations')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchDomain, setSearchDomain] = useState('')
  const [selectedSource, setSelectedSource] = useState<AggregatedSource | null>(null)

  const fetchSources = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: '50',
        offset: String(page * 50),
        sortBy, sortOrder,
        ...(searchDomain && { domain: searchDomain })
      })
      const res = await fetch(`/api/admin/source-analysis?${params}`)
      const data = await res.json()
      if (data.success) {
        setSources(data.sources)
        setSummary(data.summary)
        setTotalPages(Math.ceil(data.pagination.total / 50))
      }
    } catch (e) {
      console.error('Failed to fetch source analysis:', e)
    } finally {
      setLoading(false)
    }
  }, [page, sortBy, sortOrder, searchDomain])

  useEffect(() => { fetchSources() }, [fetchSources])

  if (loading && !sources.length) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-zinc-300" /></div>
  }

  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Total Citations" value={summary.total_citations.toLocaleString()} icon={<Link2 className="h-4 w-4 text-blue-600" />} />
          <MetricCard label="Unique Domains" value={summary.unique_domains.toLocaleString()} icon={<Globe className="h-4 w-4 text-violet-600" />} />
          <MetricCard label="Authoritative" value={summary.authoritative_sources} icon={<CheckCircle className="h-4 w-4 text-emerald-600" />} />
          <MetricCard label="Geographies" value={summary.all_geographies.length} icon={<MapPin className="h-4 w-4 text-amber-600" />} />
        </div>
      )}

      <Card className="border-zinc-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Source Citations</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchSources} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search domains..."
                className="pl-9"
                value={searchDomain}
                onChange={(e) => setSearchDomain(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (setPage(0), fetchSources())}
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="total_citations">Citations</SelectItem>
                <SelectItem value="trust_score">Trust Score</SelectItem>
                <SelectItem value="unique_brands">Brands</SelectItem>
                <SelectItem value="last_seen">Last Seen</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => setSortOrder(p => p === 'asc' ? 'desc' : 'asc')}>
              {sortOrder === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50">
                <TableHead>Domain</TableHead>
                <TableHead className="text-center">Citations</TableHead>
                <TableHead className="text-center">Trust</TableHead>
                <TableHead className="text-center">Brands</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-zinc-400">No sources found</TableCell>
                </TableRow>
              ) : (
                sources.map(source => (
                  <TableRow key={source.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-zinc-400 shrink-0" />
                        <div>
                          <a href={`https://${source.domain}`} target="_blank" rel="noopener noreferrer"
                            className="text-sm font-medium text-zinc-900 hover:text-blue-600 hover:underline flex items-center gap-1">
                            {source.domain} <ExternalLink className="h-3 w-3" />
                          </a>
                          {source.is_authoritative && (
                            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 mt-0.5">Authoritative</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-semibold">{source.total_citations}</TableCell>
                    <TableCell className="text-center">
                      <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                        source.trust_score >= 70 ? 'bg-emerald-100 text-emerald-800'
                          : source.trust_score >= 40 ? 'bg-amber-100 text-amber-800'
                            : 'bg-zinc-100 text-zinc-700'
                      }`}>
                        {source.trust_score}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">{source.unique_brands.length}</TableCell>
                    <TableCell><RelativeTime date={source.last_seen} /></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setSelectedSource(source)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-sm text-zinc-500">Page {page + 1} of {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Source detail sheet */}
      <Sheet open={!!selectedSource} onOpenChange={() => setSelectedSource(null)}>
        <SheetContent className="w-[480px] overflow-y-auto">
          {selectedSource && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />{selectedSource.domain}</SheetTitle>
                <SheetDescription>Source citation details</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-zinc-50 rounded-lg">
                    <p className="text-[11px] text-zinc-500">Citations</p>
                    <p className="text-lg font-semibold">{selectedSource.total_citations}</p>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-lg">
                    <p className="text-[11px] text-zinc-500">Trust Score</p>
                    <p className={`text-lg font-semibold ${selectedSource.trust_score >= 70 ? 'text-emerald-600' : selectedSource.trust_score >= 40 ? 'text-amber-600' : 'text-zinc-600'}`}>
                      {selectedSource.trust_score}/100
                    </p>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-lg">
                    <p className="text-[11px] text-zinc-500">Unique URLs</p>
                    <p className="text-lg font-semibold">{selectedSource.unique_urls.length}</p>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-lg">
                    <p className="text-[11px] text-zinc-500">Avg Position</p>
                    <p className="text-lg font-semibold">{selectedSource.avg_position != null ? selectedSource.avg_position.toFixed(1) : 'N/A'}</p>
                  </div>
                </div>

                {Object.keys(selectedSource.citation_types).length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-[11px] text-blue-700 font-medium mb-2">Citation Types</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(selectedSource.citation_types).map(([type, count]) => (
                        <Badge key={type} variant="outline" className="bg-white text-xs">{type}: {count}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSource.geography && selectedSource.geography.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <p className="text-[11px] text-amber-700 font-medium mb-2">Geography</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSource.geography.map((g, i) => (
                        <Badge key={i} variant="outline" className="bg-white text-xs"><MapPin className="h-3 w-3 mr-0.5" />{g}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSource.topics && selectedSource.topics.length > 0 && (
                  <div className="p-3 bg-violet-50 border border-violet-100 rounded-lg">
                    <p className="text-[11px] text-violet-700 font-medium mb-2">Topics</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSource.topics.map((t, i) => (
                        <Badge key={i} variant="outline" className="bg-white text-xs"><BookOpen className="h-3 w-3 mr-0.5" />{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-2">Brand Breakdown</p>
                  <div className="space-y-1.5">
                    {Object.entries(selectedSource.brand_breakdown)
                      .sort((a, b) => b[1].count - a[1].count)
                      .slice(0, 10)
                      .map(([brand, data]) => (
                        <div key={brand} className="flex items-center justify-between px-3 py-2 bg-zinc-50 rounded-lg text-sm">
                          <div>
                            <p className="font-medium">{brand}</p>
                            <p className="text-[11px] text-zinc-400">{data.urls.length} URLs</p>
                          </div>
                          <Badge variant="outline">{data.count}</Badge>
                        </div>
                      ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-2">All Cited URLs</p>
                  <ScrollArea className="h-48 border rounded-lg p-3">
                    <div className="space-y-1.5">
                      {selectedSource.unique_urls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline truncate">
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span className="truncate">{url}</span>
                        </a>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ═══════════════════════════════════════════
//  PIPELINE HEALTH SECTION
// ═══════════════════════════════════════════

interface PipelineStatus {
  extraction: { total: number; pending: number; failed: number; complete: number; processing: number }
  aggregation: { today_metrics_count: number; run_date: string }
  affected_brands: Array<{ brand_id: string; brand_name: string; pending: number; failed: number; errors: string[] }>
  recent_runs: Array<{
    id: string; brand_id: string; brand_name: string; status: string; pipeline_status: string | null
    prompt_count: number; model_count: number; total_jobs: number; completed_jobs: number
    failed_jobs: number; total_cost: number; created_at: string; completed_at: string | null
  }>
}

function PipelineHealthSection() {
  const [data, setData] = useState<PipelineStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pipeline/status')
      const json = await res.json()
      if (json.success) setData(json)
    } catch (e) {
      console.error('Failed to fetch pipeline status:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  const triggerExtraction = async (brandId?: string) => {
    const key = brandId ? `extract-${brandId}` : 'extract-all'
    setActionLoading(key)
    setActionResult(null)
    try {
      const res = await fetch('/api/admin/extraction/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 200, use_ai_agents: true }),
      })
      const json = await res.json()
      if (json.success) {
        setActionResult({ type: 'success', message: `Extraction: ${json.processed} processed, ${json.failed} failed` })
        fetchStatus()
      } else {
        setActionResult({ type: 'error', message: json.error || 'Extraction failed' })
      }
    } catch (e) {
      setActionResult({ type: 'error', message: 'Network error triggering extraction' })
    } finally {
      setActionLoading(null)
    }
  }

  const triggerAggregation = async (brandId?: string, accountId?: string) => {
    const key = brandId ? `agg-${brandId}` : 'agg-all'
    setActionLoading(key)
    setActionResult(null)
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch('/api/admin/aggregation/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runDate: today, brandId, accountId }),
      })
      const json = await res.json()
      if (json.success) {
        setActionResult({ type: 'success', message: `Aggregation: ${json.brandMetrics ?? 0} brand, ${json.promptMetrics ?? 0} prompt metrics` })
        fetchStatus()
      } else {
        setActionResult({ type: 'error', message: json.error || 'Aggregation failed' })
      }
    } catch (e) {
      setActionResult({ type: 'error', message: 'Network error triggering aggregation' })
    } finally {
      setActionLoading(null)
    }
  }

  const triggerFullPipeline = async () => {
    setActionLoading('full')
    setActionResult(null)
    try {
      // Run extraction first, then aggregation
      const extRes = await fetch('/api/admin/extraction/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 200, use_ai_agents: true }),
      })
      const extJson = await extRes.json()

      const today = new Date().toISOString().split('T')[0]
      const aggRes = await fetch('/api/admin/aggregation/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runDate: today }),
      })
      const aggJson = await aggRes.json()

      const parts = []
      if (extJson.success) parts.push(`Extracted: ${extJson.processed}/${extJson.processed + extJson.failed}`)
      if (aggJson.success) parts.push(`Aggregated: ${aggJson.brandMetrics ?? 0} brands`)
      setActionResult({ type: (extJson.success && aggJson.success) ? 'success' : 'error', message: parts.join(' · ') || 'Pipeline completed with errors' })
      fetchStatus()
    } catch (e) {
      setActionResult({ type: 'error', message: 'Pipeline run failed' })
    } finally {
      setActionLoading(null)
    }
  }

  if (loading && !data) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-zinc-300" /></div>
  }

  if (!data) {
    return <div className="text-center text-zinc-400 py-16">Failed to load pipeline status</div>
  }

  const { extraction, aggregation, affected_brands, recent_runs } = data
  const healthPct = extraction.total > 0
    ? Math.round((extraction.complete / extraction.total) * 100)
    : 100
  const hasIssues = extraction.failed > 0 || extraction.pending > 0

  const PIPELINE_STATUS_COLORS: Record<string, string> = {
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    partial: 'bg-amber-50 text-amber-700 border-amber-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    running: 'bg-blue-50 text-blue-700 border-blue-200',
    pending: 'bg-zinc-100 text-zinc-500 border-zinc-200',
  }

  const RUN_STATUS_COLORS: Record<string, string> = {
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    running: 'bg-blue-50 text-blue-700 border-blue-200',
    pending: 'bg-zinc-100 text-zinc-500 border-zinc-200',
  }

  return (
    <div className="space-y-4">
      {/* Action result toast */}
      {actionResult && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${
          actionResult.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {actionResult.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
          {actionResult.message}
          <button onClick={() => setActionResult(null)} className="ml-auto text-xs opacity-60 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard label="Total Responses" value={extraction.total} icon={<BarChart3 className="h-4 w-4 text-zinc-500" />} />
        <MetricCard label="Extracted" value={extraction.complete} icon={<CheckCircle className="h-4 w-4 text-emerald-500" />} />
        <MetricCard label="Failed" value={extraction.failed} icon={<XCircle className="h-4 w-4 text-red-500" />} alert={extraction.failed > 0} />
        <MetricCard label="Pending" value={extraction.pending} icon={<Clock className="h-4 w-4 text-amber-500" />} alert={extraction.pending > 0} />
        <MetricCard label="Today Metrics" value={aggregation.today_metrics_count} icon={<TrendingUp className="h-4 w-4 text-blue-500" />} />
      </div>

      {/* Health Bar + Actions */}
      <Card className="border-zinc-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium">Extraction Health</p>
              <Badge variant="outline" className={healthPct === 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : healthPct > 80 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}>
                {healthPct}%
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchStatus} disabled={loading}>
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              {hasIssues && (
                <Button size="sm" onClick={() => triggerExtraction()} disabled={actionLoading !== null}>
                  {actionLoading === 'extract-all'
                    ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Running...</>
                    : <><Play className="h-3.5 w-3.5 mr-1.5" /> Re-run Extraction</>
                  }
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => triggerAggregation()} disabled={actionLoading !== null}>
                {actionLoading === 'agg-all'
                  ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Running...</>
                  : <><BarChart3 className="h-3.5 w-3.5 mr-1.5" /> Re-run Aggregation</>
                }
              </Button>
              <Button size="sm" variant="default" onClick={triggerFullPipeline} disabled={actionLoading !== null}>
                {actionLoading === 'full'
                  ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Running...</>
                  : <><Activity className="h-3.5 w-3.5 mr-1.5" /> Full Pipeline</>
                }
              </Button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
            <div className="h-full flex">
              {extraction.complete > 0 && (
                <div className="bg-emerald-500 h-full" style={{ width: `${(extraction.complete / extraction.total) * 100}%` }} />
              )}
              {extraction.processing > 0 && (
                <div className="bg-blue-500 h-full" style={{ width: `${(extraction.processing / extraction.total) * 100}%` }} />
              )}
              {extraction.pending > 0 && (
                <div className="bg-amber-400 h-full" style={{ width: `${(extraction.pending / extraction.total) * 100}%` }} />
              )}
              {extraction.failed > 0 && (
                <div className="bg-red-500 h-full" style={{ width: `${(extraction.failed / extraction.total) * 100}%` }} />
              )}
            </div>
          </div>
          <div className="flex gap-4 mt-2 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Complete ({extraction.complete})</span>
            {extraction.processing > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Processing ({extraction.processing})</span>}
            {extraction.pending > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Pending ({extraction.pending})</span>}
            {extraction.failed > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Failed ({extraction.failed})</span>}
          </div>
        </CardContent>
      </Card>

      {/* Affected Brands */}
      {affected_brands.length > 0 && (
        <Card className="border-red-200 bg-red-50/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Brands with Failed/Pending Extractions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-red-50/30">
                  <TableHead>Brand</TableHead>
                  <TableHead className="text-center">Failed</TableHead>
                  <TableHead className="text-center">Pending</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affected_brands.map(brand => (
                  <TableRow key={brand.brand_id}>
                    <TableCell className="font-medium text-sm">{brand.brand_name}</TableCell>
                    <TableCell className="text-center">
                      {brand.failed > 0
                        ? <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{brand.failed}</Badge>
                        : <span className="text-zinc-400">0</span>
                      }
                    </TableCell>
                    <TableCell className="text-center">
                      {brand.pending > 0
                        ? <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">{brand.pending}</Badge>
                        : <span className="text-zinc-400">0</span>
                      }
                    </TableCell>
                    <TableCell>
                      {brand.errors.length > 0
                        ? <p className="text-xs text-red-600 truncate max-w-xs" title={brand.errors[0]}>{brand.errors[0]}</p>
                        : <span className="text-xs text-zinc-400">—</span>
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => triggerExtraction(brand.brand_id)}
                          disabled={actionLoading !== null}
                        >
                          {actionLoading === `extract-${brand.brand_id}`
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <Play className="h-3 w-3 mr-1" />
                          }
                          Extract
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => triggerAggregation(brand.brand_id)}
                          disabled={actionLoading !== null}
                        >
                          {actionLoading === `agg-${brand.brand_id}`
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <BarChart3 className="h-3 w-3 mr-1" />
                          }
                          Aggregate
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Runs */}
      <Card className="border-zinc-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Recent Runs</CardTitle>
          <CardDescription className="text-xs text-zinc-500">Last 10 runs across all brands</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50">
                <TableHead>Brand</TableHead>
                <TableHead>Run Status</TableHead>
                <TableHead>Pipeline</TableHead>
                <TableHead className="text-center">Jobs</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent_runs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-zinc-400">No runs found</TableCell>
                </TableRow>
              ) : (
                recent_runs.map(run => (
                  <TableRow key={run.id}>
                    <TableCell className="font-medium text-sm">{run.brand_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${RUN_STATUS_COLORS[run.status] || RUN_STATUS_COLORS.pending}`}>
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {run.pipeline_status ? (
                        <Badge variant="outline" className={`text-xs ${PIPELINE_STATUS_COLORS[run.pipeline_status] || PIPELINE_STATUS_COLORS.pending}`}>
                          {run.pipeline_status}
                        </Badge>
                      ) : (
                        <span className="text-xs text-zinc-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      <span className="text-emerald-600">{run.completed_jobs}</span>
                      {run.failed_jobs > 0 && <span className="text-red-500">/{run.failed_jobs}f</span>}
                      <span className="text-zinc-400">/{run.total_jobs}</span>
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">${run.total_cost?.toFixed(4) || '0'}</TableCell>
                    <TableCell className="text-xs"><RelativeTime date={run.created_at} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════
//  FEATURE FLAGS SECTION
// ═══════════════════════════════════════════

function FeatureFlagsSection() {
  const [flags, setFlags] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/admin/config/feature-flags')
      .then(r => r.json())
      .then(data => {
        if (data.flags) {
          const map: Record<string, any> = {}
          for (const f of data.flags) map[f.key] = f
          setFlags(map)
        }
      })
      .catch(e => console.error('Failed to fetch feature flags:', e))
      .finally(() => setLoading(false))
  }, [])

  const toggle = async (key: string, enabled: boolean, description?: string) => {
    setSaving(key)
    try {
      const res = await fetch('/api/admin/config/feature-flags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: { enabled }, description }),
      })
      if (res.ok) {
        setFlags(prev => ({ ...prev, [key]: { ...prev[key], key, value: { enabled }, description, category: 'features' } }))
      }
    } catch (e) {
      console.error('Failed to toggle flag:', e)
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-zinc-300" /></div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
        <CardDescription>Enable or disable platform features globally</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-zinc-600" />
                <Label className="text-base font-medium">Agency Mode</Label>
              </div>
              <p className="text-sm text-zinc-500">
                When enabled, users can choose between In-house and Agency account types during onboarding.
              </p>
            </div>
            <Switch
              className="h-6 w-11 data-[state=unchecked]:bg-zinc-300 data-[state=checked]:bg-emerald-600"
              checked={flags['agency_mode']?.value?.enabled ?? true}
              onCheckedChange={(checked) => toggle('agency_mode', checked, 'Enable or disable agency account type in onboarding')}
              disabled={saving === 'agency_mode'}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════

export function AdminView({ accounts, metrics, subscriptionPlans, userEmail }: AdminViewProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<Tab>("accounts")

  // Dialog state
  const [ghostDialog, setGhostDialog] = useState<{ account: Account } | null>(null)
  const [isGhosting, setIsGhosting] = useState(false)

  const [suspendDialog, setSuspendDialog] = useState<{ account: Account; suspended: boolean } | null>(null)
  const [suspendLoading, setSuspendLoading] = useState(false)

  const [subDialog, setSubDialog] = useState<{ account: Account } | null>(null)
  const [subAction, setSubAction] = useState("")
  const [subPlanId, setSubPlanId] = useState("")
  const [subLoading, setSubLoading] = useState(false)

  const [deleteDialog, setDeleteDialog] = useState<{ account: Account } | null>(null)
  const [deletePreview, setDeletePreview] = useState<any>(null)
  const [deletePreviewLoading, setDeletePreviewLoading] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)

  // ── Ghost ──
  const startGhost = async () => {
    if (!ghostDialog) return
    setIsGhosting(true)
    try {
      const res = await fetch('/api/admin/ghost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: ghostDialog.account.id })
      })
      const data = await res.json()
      if (res.ok && data.redirectUrl) window.location.href = data.redirectUrl
    } catch (e) {
      console.error('Ghost failed:', e)
    } finally {
      setIsGhosting(false)
      setGhostDialog(null)
    }
  }

  // ── Suspend account ──
  const suspendAccount = async () => {
    if (!suspendDialog) return
    setSuspendLoading(true)
    try {
      const res = await fetch('/api/admin/accounts/suspend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: suspendDialog.account.id, suspended: !suspendDialog.suspended })
      })
      if (res.ok) {
        router.refresh()
        setSuspendDialog(null)
      }
    } catch (e) {
      console.error('Suspend failed:', e)
    } finally {
      setSuspendLoading(false)
    }
  }

  // ── Subscription ──
  const updateSubscription = async () => {
    if (!subDialog || !subAction) return
    setSubLoading(true)
    try {
      const body: any = { accountId: subDialog.account.id, action: subAction }
      if (subAction === 'change_plan' && subPlanId) body.planId = subPlanId
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (res.ok) {
        router.refresh()
        setSubDialog(null)
        setSubAction("")
        setSubPlanId("")
      }
    } catch (e) {
      console.error('Subscription update failed:', e)
    } finally {
      setSubLoading(false)
    }
  }

  // ── Delete account ──
  const openDeleteDialog = async (account: Account) => {
    setDeleteDialog({ account })
    setDeleteConfirmName("")
    setDeletePreview(null)
    setDeletePreviewLoading(true)
    try {
      const res = await fetch(`/api/admin/accounts/preview-delete?accountId=${account.id}`)
      const data = await res.json()
      if (data.success) {
        setDeletePreview(data.data)
      }
    } catch (e) {
      console.error('Preview fetch failed:', e)
    } finally {
      setDeletePreviewLoading(false)
    }
  }

  const deleteAccount = async () => {
    if (!deleteDialog) return
    setDeleteLoading(true)
    try {
      const res = await fetch('/api/admin/accounts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: deleteDialog.account.id, confirmName: deleteConfirmName })
      })
      if (res.ok) {
        router.refresh()
        setDeleteDialog(null)
        setDeletePreview(null)
        setDeleteConfirmName("")
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete account')
      }
    } catch (e) {
      console.error('Delete failed:', e)
    } finally {
      setDeleteLoading(false)
    }
  }

  const isAccountSuspended = (account: Account) =>
    account.subscription?.status === 'suspended' ||
    (account.brands.length > 0 && account.brands.every(b => b.auto_run_paused && b.auto_run_pause_reason === 'Account suspended by admin'))

  const showSearch = activeTab === 'accounts' || activeTab === 'subscriptions' || activeTab === 'leads'

  return (
    <>
      <AdminShell
        userEmail={userEmail}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={showSearch ? searchQuery : undefined}
        onSearchChange={showSearch ? setSearchQuery : undefined}
        searchPlaceholder="Search accounts, brands, users..."
      >
        {activeTab === 'accounts' && (
          <AccountsSection
            accounts={accounts}
            metrics={metrics}
            searchQuery={searchQuery}
            onGhost={(account) => setGhostDialog({ account })}
            onSuspend={(account) => setSuspendDialog({ account, suspended: isAccountSuspended(account) })}
            onManageSubscription={(account) => setSubDialog({ account })}
            onDelete={(account) => openDeleteDialog(account)}
          />
        )}
        {activeTab === 'leads' && <LeadsSection />}
        {activeTab === 'subscriptions' && (
          <SubscriptionsSection
            accounts={accounts}
            metrics={metrics}
            searchQuery={searchQuery}
            onManageSubscription={(account) => setSubDialog({ account })}
          />
        )}
        {activeTab === 'features' && <FeatureFlagsSection />}
        {activeTab === 'query_response' && <QueryResponseConfig />}
        {activeTab === 'prompt_design' && <PromptDesignConfig />}
        {activeTab === 'agents' && <AgentConfigManager />}
        {activeTab === 'insight_agent' && <InsightAgentConfig />}
        {activeTab === 'pipeline' && <PipelineHealthSection />}
        {activeTab === 'cron' && <CronJobsSection />}
        {activeTab === 'errors' && <ErrorLogsSection />}
        {activeTab === 'sources' && <SourceAnalysisSection />}
      </AdminShell>

      {/* ═══ DIALOGS ═══ */}

      {/* Ghost Session */}
      <Dialog open={!!ghostDialog} onOpenChange={() => setGhostDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Ghost className="h-5 w-5" /> Ghost Session</DialogTitle>
            <DialogDescription>
              You will be logged into <strong>{ghostDialog?.account.name}</strong>&apos;s account. Session lasts 1 hour.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGhostDialog(null)}>Cancel</Button>
            <Button onClick={startGhost} disabled={isGhosting}>
              {isGhosting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Ghost className="h-4 w-4 mr-2" />}
              Start Ghost Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Account */}
      <Dialog open={!!suspendDialog} onOpenChange={() => setSuspendDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {suspendDialog?.suspended
                ? <><ShieldCheck className="h-5 w-5 text-emerald-600" /> Unsuspend Account</>
                : <><ShieldAlert className="h-5 w-5 text-red-600" /> Suspend Account</>
              }
            </DialogTitle>
            <DialogDescription>
              {suspendDialog?.suspended
                ? <>This will reactivate <strong>{suspendDialog?.account.name}</strong>, resume all brand auto-runs, and restore the subscription.</>
                : <>This will pause all brand runs for <strong>{suspendDialog?.account.name}</strong> and suspend their subscription.</>
              }
            </DialogDescription>
          </DialogHeader>
          {!suspendDialog?.suspended && (
            <div className="py-2">
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800">
                <p className="font-medium mb-1">Suspending will:</p>
                <ul className="list-disc list-inside text-xs space-y-0.5">
                  <li>Pause auto-run on all {suspendDialog?.account.brands.length} brand(s)</li>
                  <li>Set subscription status to suspended</li>
                  <li>No data will be deleted</li>
                </ul>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialog(null)}>Cancel</Button>
            <Button
              variant={suspendDialog?.suspended ? "default" : "destructive"}
              onClick={suspendAccount}
              disabled={suspendLoading}
            >
              {suspendLoading
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : suspendDialog?.suspended
                  ? <ShieldCheck className="h-4 w-4 mr-2" />
                  : <ShieldAlert className="h-4 w-4 mr-2" />
              }
              {suspendDialog?.suspended ? 'Unsuspend Account' : 'Suspend Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account */}
      <Dialog open={!!deleteDialog} onOpenChange={() => { setDeleteDialog(null); setDeletePreview(null); setDeleteConfirmName("") }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" /> Delete Account Permanently
            </DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{deleteDialog?.account.name}</strong> and all associated data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deletePreviewLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          ) : deletePreview ? (
            <div className="space-y-3">
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-800">
                <p className="font-medium mb-2">The following will be permanently deleted:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {deletePreview.counts.brands > 0 && (
                    <div className="flex justify-between"><span>Brands</span><span className="font-mono font-medium">{deletePreview.counts.brands}</span></div>
                  )}
                  {deletePreview.counts.members > 0 && (
                    <div className="flex justify-between"><span>Members</span><span className="font-mono font-medium">{deletePreview.counts.members}</span></div>
                  )}
                  {deletePreview.counts.workspaces > 0 && (
                    <div className="flex justify-between"><span>Workspaces</span><span className="font-mono font-medium">{deletePreview.counts.workspaces}</span></div>
                  )}
                  {deletePreview.counts.subscriptions > 0 && (
                    <div className="flex justify-between"><span>Subscriptions</span><span className="font-mono font-medium">{deletePreview.counts.subscriptions}</span></div>
                  )}
                  {deletePreview.counts.runs > 0 && (
                    <div className="flex justify-between"><span>Runs</span><span className="font-mono font-medium">{deletePreview.counts.runs}</span></div>
                  )}
                  {deletePreview.counts.responses > 0 && (
                    <div className="flex justify-between"><span>LLM Responses</span><span className="font-mono font-medium">{deletePreview.counts.responses}</span></div>
                  )}
                  {deletePreview.counts.analysis > 0 && (
                    <div className="flex justify-between"><span>Analysis Records</span><span className="font-mono font-medium">{deletePreview.counts.analysis}</span></div>
                  )}
                  {deletePreview.counts.responseFiles > 0 && (
                    <div className="flex justify-between"><span>Response Files</span><span className="font-mono font-medium">{deletePreview.counts.responseFiles}</span></div>
                  )}
                  {deletePreview.counts.storageFiles > 0 && (
                    <div className="flex justify-between"><span>Storage Files</span><span className="font-mono font-medium">{deletePreview.counts.storageFiles}</span></div>
                  )}
                  {deletePreview.counts.prompts > 0 && (
                    <div className="flex justify-between"><span>Custom Prompts</span><span className="font-mono font-medium">{deletePreview.counts.prompts}</span></div>
                  )}
                </div>
              </div>

              {deletePreview.brands.length > 0 && (
                <div className="p-3 bg-zinc-50 rounded-lg text-sm">
                  <p className="text-xs font-medium text-zinc-500 mb-1.5">Brands to be deleted:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {deletePreview.brands.map((b: any) => (
                      <Badge key={b.id} variant="outline" className="text-xs">{b.name}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-1">
                <Label className="text-sm">Type <strong>{deleteDialog?.account.name}</strong> to confirm</Label>
                <Input
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder={deleteDialog?.account.name}
                  className="font-mono"
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-zinc-500">Failed to load preview</div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialog(null); setDeletePreview(null); setDeleteConfirmName("") }}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={deleteAccount}
              disabled={deleteLoading || deleteConfirmName !== deleteDialog?.account.name}
            >
              {deleteLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Subscription */}
      <Dialog open={!!subDialog} onOpenChange={() => { setSubDialog(null); setSubAction(""); setSubPlanId("") }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Manage Subscription</DialogTitle>
            <DialogDescription>Manage subscription for <strong>{subDialog?.account.name}</strong></DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {subDialog?.account.subscription && (
              <div className="p-3 bg-zinc-50 rounded-lg text-sm flex items-center justify-between">
                <span>Current: <strong>{subDialog.account.subscription.plan_name}</strong></span>
                <StatusBadge status={subDialog.account.subscription.status} />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSubDialog(null); setSubAction(""); setSubPlanId("") }}>Cancel</Button>
            <Button onClick={updateSubscription} disabled={subLoading || !subAction}>
              {subLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
