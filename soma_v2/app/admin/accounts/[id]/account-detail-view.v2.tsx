"use client"

import { useState, useEffect, useCallback } from "react"
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
import {
  ArrowLeft, Building2, Users, BarChart3, CreditCard, DollarSign,
  Play, Loader2, Ghost, Pause, ShieldAlert, ShieldCheck,
  Trash2, Eye, MoreHorizontal, CheckCircle, AlertTriangle, XCircle,
  Clock, Activity, User, Ban, Globe, MapPin, Tag,
  RefreshCw, ChevronDown, ChevronUp,
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
}

interface Brand {
  id: string
  name: string
  created_at: string
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
  features?: any
}

interface AccountData {
  id: string
  name: string
  created_at: string
  account_type: string | null
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

// ═══════════════════════════════════════════
//  PIPELINE REPORT SECTION
// ═══════════════════════════════════════════

interface PipelineStep {
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  started_at: string | null
  completed_at: string | null
  duration_ms: number | null
  result: Record<string, unknown> | null
  error: string | null
  retry_count: number
  verified: boolean
}

interface PipelineVerification {
  responses_stored: number
  extraction_rows_created: number
  brand_metrics_rows: number
  competitor_metrics_rows: number
  prompt_metrics_rows: number
  insights_generated: boolean
  broadcast_sent: boolean
}

interface PipelineReportData {
  status: string
  started_at: string
  completed_at: string | null
  duration_ms: number | null
  steps: PipelineStep[]
  verification: PipelineVerification
}

interface RunWithPipeline {
  id: string
  status: string
  pipeline_status: string | null
  pipeline_report: PipelineReportData | null
  prompt_count: number
  model_count: number
  total_jobs: number
  completed_jobs: number
  failed_jobs: number
  total_cost: number
  created_at: string
  completed_at: string | null
}

const STEP_STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <CheckCircle className="h-3 w-3" /> },
  failed:    { bg: 'bg-red-50',     text: 'text-red-700',     icon: <XCircle className="h-3 w-3" /> },
  running:   { bg: 'bg-blue-50',    text: 'text-blue-700',    icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  skipped:   { bg: 'bg-zinc-50',    text: 'text-zinc-500',    icon: <span className="text-[10px]">—</span> },
  pending:   { bg: 'bg-zinc-50',    text: 'text-zinc-400',    icon: <Clock className="h-3 w-3" /> },
}

const PIPELINE_STATUS_STYLES: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  partial:   'bg-amber-50 text-amber-700 border-amber-200',
  failed:    'bg-red-50 text-red-700 border-red-200',
  running:   'bg-blue-50 text-blue-700 border-blue-200',
  pending:   'bg-zinc-100 text-zinc-500 border-zinc-200',
  skipped:   'bg-zinc-100 text-zinc-400 border-zinc-200',
}

function PipelineReportSection({ brandId }: { brandId: string }) {
  const [runs, setRuns] = useState<RunWithPipeline[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/runs/pipeline-report?brand_id=${brandId}&limit=5`)
      if (res.ok) {
        const data = await res.json()
        setRuns(data.runs || [])
      }
    } catch (e) {
      console.error('Failed to fetch pipeline reports:', e)
    } finally {
      setLoading(false)
      setFetched(true)
    }
  }, [brandId])

  useEffect(() => {
    if (brandId && !fetched) fetchReports()
  }, [brandId, fetched, fetchReports])

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-zinc-500" /> Pipeline Reports
        </p>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={fetchReports} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        </Button>
      </div>

      {loading && !fetched ? (
        <div className="text-center py-6 text-zinc-400">
          <Loader2 className="h-5 w-5 mx-auto mb-1 animate-spin" />
          <p className="text-xs">Loading reports...</p>
        </div>
      ) : runs.length === 0 ? (
        <div className="text-center py-4 text-zinc-400">
          <p className="text-xs">No runs found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {runs.map(run => {
            const isExpanded = expanded === run.id
            const report = run.pipeline_report
            const pStatus = run.pipeline_status || 'pending'
            const statusStyle = PIPELINE_STATUS_STYLES[pStatus] || PIPELINE_STATUS_STYLES.pending

            return (
              <div key={run.id} className="border border-zinc-200 rounded-lg overflow-hidden">
                {/* Run header - clickable */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : run.id)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-zinc-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${statusStyle}`}>
                      {pStatus}
                    </Badge>
                    <span className="text-xs text-zinc-500 truncate">
                      {new Date(run.created_at).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                      })}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {run.prompt_count}P × {run.model_count}M
                    </span>
                    {report?.duration_ms != null && (
                      <span className="text-[10px] text-zinc-400">
                        {(report.duration_ms / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-zinc-400 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-zinc-400 shrink-0" />}
                </button>

                {/* Expanded detail */}
                {isExpanded && report && (
                  <div className="border-t border-zinc-100 px-3 py-3 space-y-3 bg-zinc-50/50">
                    {/* Steps */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Pipeline Steps</p>
                      {report.steps.map((step) => {
                        const s = STEP_STATUS_STYLES[step.status] || STEP_STATUS_STYLES.pending
                        return (
                          <div key={step.name} className={`flex items-start gap-2 px-2.5 py-2 rounded-md ${s.bg}`}>
                            <span className={`mt-0.5 ${s.text}`}>{s.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-medium capitalize ${s.text}`}>{step.name}</span>
                                <div className="flex items-center gap-2">
                                  {step.verified && <Badge variant="outline" className="text-[9px] h-4 bg-emerald-50 text-emerald-600 border-emerald-200">Verified</Badge>}
                                  {step.retry_count > 0 && <Badge variant="outline" className="text-[9px] h-4 bg-amber-50 text-amber-600 border-amber-200">Retry ×{step.retry_count}</Badge>}
                                  {step.duration_ms != null && <span className="text-[10px] text-zinc-400">{step.duration_ms}ms</span>}
                                </div>
                              </div>
                              {step.error && (
                                <p className="text-[10px] text-red-600 mt-0.5 break-all">{step.error}</p>
                              )}
                              {step.result && (
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                                  {Object.entries(step.result).map(([k, v]) => (
                                    <span key={k} className="text-[10px] text-zinc-500">
                                      {k.replace(/_/g, ' ')}: <strong className="text-zinc-700">{String(v)}</strong>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Verification summary */}
                    {report.verification && (
                      <div>
                        <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide mb-1.5">Verification</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          <VerifyItem label="Responses stored" value={report.verification.responses_stored} />
                          <VerifyItem label="Extraction rows" value={report.verification.extraction_rows_created} />
                          <VerifyItem label="Brand metrics" value={report.verification.brand_metrics_rows} />
                          <VerifyItem label="Competitor metrics" value={report.verification.competitor_metrics_rows} />
                          <VerifyItem label="Prompt metrics" value={report.verification.prompt_metrics_rows} />
                          <VerifyBool label="Insights" value={report.verification.insights_generated} />
                          <VerifyBool label="Broadcast" value={report.verification.broadcast_sent} />
                        </div>
                      </div>
                    )}

                    {/* Run meta */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-zinc-400 pt-1 border-t border-zinc-200">
                      <span>Run: {run.status}</span>
                      <span>Jobs: {run.completed_jobs}/{run.total_jobs} ({run.failed_jobs} failed)</span>
                      <span>Cost: ${run.total_cost?.toFixed(4) || '0'}</span>
                      <span className="break-all">ID: {run.id}</span>
                    </div>
                  </div>
                )}

                {/* No report yet */}
                {isExpanded && !report && (
                  <div className="border-t border-zinc-100 px-3 py-4 text-center text-zinc-400 bg-zinc-50/50">
                    <p className="text-xs">No pipeline report — run may predate this feature or pipeline didn&apos;t execute</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function VerifyItem({ label, value }: { label: string; value: number }) {
  const ok = value > 0
  return (
    <div className={`px-2 py-1 rounded text-[10px] flex items-center justify-between ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

function VerifyBool({ label, value }: { label: string; value: boolean }) {
  return (
    <div className={`px-2 py-1 rounded text-[10px] flex items-center justify-between ${value ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
      <span>{label}</span>
      <span className="font-semibold">{value ? 'Yes' : 'No'}</span>
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
  const [subLoading, setSubLoading] = useState(false)

  const [detailBrand, setDetailBrand] = useState<Brand | null>(null)

  const isSuspended = account.subscription?.status === 'suspended' ||
    (account.brands.length > 0 && account.brands.every(b => b.auto_run_paused && b.auto_run_pause_reason === 'Account suspended by admin'))

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
    try {
      const body: any = { accountId: account.id, action: subAction }
      if (subAction === 'change_plan' && subPlanId) body.planId = subPlanId
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (res.ok) {
        router.refresh()
        setSubDialog(false)
        setSubAction("")
        setSubPlanId("")
      }
    } catch (e) {
      console.error('Subscription update failed:', e)
    } finally {
      setSubLoading(false)
    }
  }

  const simHealth = account.total_runs > 0
    ? (((account.total_runs - account.total_failures) / account.total_runs) * 100).toFixed(0)
    : '100'

  // Title with breadcrumb
  const titleEl = (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => router.push('/admin')} className="gap-1.5 text-zinc-500 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Accounts
      </Button>
      <span className="text-zinc-300">/</span>
      <div className="flex items-center gap-2">
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${isSuspended ? 'bg-red-100' : 'bg-zinc-100'}`}>
          {isSuspended ? <Ban className="h-3.5 w-3.5 text-red-500" /> : <Building2 className="h-3.5 w-3.5 text-zinc-600" />}
        </div>
        <span className="font-semibold text-zinc-900">{account.name}</span>
        {isSuspended && <Badge variant="destructive" className="text-[10px]">Suspended</Badge>}
        {account.account_type && <Badge variant="outline" className="text-[10px] capitalize">{account.account_type}</Badge>}
      </div>
    </div>
  )

  // Header actions
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

          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <StatCard label="Brands" value={account.brands.length} icon={<BarChart3 className="h-4 w-4 text-orange-600" />} />
            <StatCard label="Members" value={account.users.length} icon={<Users className="h-4 w-4 text-violet-600" />} />
            <StatCard label="Total Runs" value={account.total_runs} icon={<Activity className="h-4 w-4 text-blue-600" />} />
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
            {/* Left column — Subscription + Members */}
            <div className="space-y-6">

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
                        <div key={user.id || `user-${idx}`} className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                            ) : (
                              <User className="h-4 w-4 text-zinc-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900 truncate">
                              {user.name !== 'Unknown' ? user.name : user.email}
                            </p>
                            {user.name !== 'Unknown' && (
                              <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-[10px] capitalize shrink-0">{user.role}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right column — Brands (takes 2 cols) */}
            <div className="lg:col-span-2">
              <Card className="border-zinc-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-zinc-500" /> Brands ({account.brands.length})
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
                      {account.brands.map(brand => (
                        <div key={brand.id} className={`p-4 ${brand.auto_run_paused ? 'bg-zinc-50/60' : ''}`}>
                          {/* Brand header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                                <BarChart3 className="h-5 w-5 text-zinc-500" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-semibold text-zinc-900 truncate">{brand.name}</h3>
                                  {brand.auto_run_paused && (
                                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Paused</Badge>
                                  )}
                                </div>
                                {brand.primary_domain && (
                                  <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                                    <Globe className="h-3 w-3" /> {brand.primary_domain}
                                  </p>
                                )}
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                          </div>

                          {/* Brand stats row */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                            <div className="px-3 py-2 bg-zinc-50 rounded-lg">
                              <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Runs</p>
                              <p className="text-sm font-semibold">{brand.run_count || 0}</p>
                            </div>
                            <div className="px-3 py-2 bg-zinc-50 rounded-lg">
                              <p className="text-[10px] text-zinc-400 uppercase tracking-wide">API Cost</p>
                              <p className="text-sm font-semibold">${brand.total_cost?.toFixed(2) || '0.00'}</p>
                            </div>
                            <div className="px-3 py-2 bg-zinc-50 rounded-lg">
                              <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Last Run</p>
                              <p className="text-sm font-semibold"><RelativeTime date={brand.last_run} /></p>
                            </div>
                            <div className="px-3 py-2 bg-zinc-50 rounded-lg">
                              <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Status</p>
                              <p className="text-sm"><SimStatusBadge status={brand.last_status} /></p>
                            </div>
                          </div>

                          {/* Run result feedback */}
                          {runResults[brand.id] && (
                            <div className={`px-3 py-2 rounded-lg text-sm mb-3 ${
                              runResults[brand.id]!.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                            }`}>
                              {runResults[brand.id]!.success ? <CheckCircle className="h-3.5 w-3.5 inline-block mr-1.5" /> : <XCircle className="h-3.5 w-3.5 inline-block mr-1.5" />}
                              {runResults[brand.id]!.message}
                            </div>
                          )}

                          {/* Running indicator */}
                          {runningBrands.has(brand.id) && (
                            <div className="px-3 py-2 rounded-lg text-sm mb-3 bg-blue-50 text-blue-700 flex items-center gap-2">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Running run...
                            </div>
                          )}

                          {/* Error */}
                          {brand.last_error && (
                            <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 mb-3">
                              <span className="font-medium">Last error:</span> {brand.last_error}
                            </div>
                          )}

                          {/* Pause reason */}
                          {brand.auto_run_pause_reason && (
                            <div className="px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
                              <span className="font-medium">Pause reason:</span> {brand.auto_run_pause_reason}
                            </div>
                          )}

                          {/* Business context tags */}
                          {((brand.brand_categories && brand.brand_categories.length > 0) || (brand.target_markets && brand.target_markets.length > 0)) && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {brand.brand_categories?.map((cat, i) => (
                                <Badge key={i} variant="outline" className="text-[10px]">
                                  <Tag className="h-2.5 w-2.5 mr-0.5" />{cat}
                                </Badge>
                              ))}
                              {brand.target_markets?.map((m, i) => (
                                <Badge key={i} variant="outline" className="text-[10px]">
                                  <MapPin className="h-2.5 w-2.5 mr-0.5" />{m}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
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
      <Dialog open={subDialog} onOpenChange={(open) => { setSubDialog(open); if (!open) { setSubAction(""); setSubPlanId("") } }}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSubDialog(false); setSubAction(""); setSubPlanId("") }}>Cancel</Button>
            <Button onClick={updateSubscription} disabled={subLoading || !subAction}>
              {subLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Brand Detail Sheet */}
      <Sheet open={!!detailBrand} onOpenChange={() => setDetailBrand(null)}>
        <SheetContent className="w-[480px] overflow-y-auto">
          {detailBrand && (
            <>
              <SheetHeader>
                <SheetTitle>{detailBrand.name}</SheetTitle>
                <SheetDescription>Owned by <strong>{account.name}</strong></SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-zinc-50 rounded-lg">
                    <p className="text-[11px] text-zinc-500 mb-0.5">Total Runs</p>
                    <p className="text-lg font-semibold">{detailBrand.run_count || 0}</p>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-lg">
                    <p className="text-[11px] text-zinc-500 mb-0.5">Total API Cost</p>
                    <p className="text-lg font-semibold">${detailBrand.total_cost?.toFixed(4) || '0.00'}</p>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-lg">
                    <p className="text-[11px] text-zinc-500 mb-0.5">Total Failures</p>
                    <p className="text-lg font-semibold">{detailBrand.total_failures}</p>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-lg">
                    <p className="text-[11px] text-zinc-500 mb-0.5">Auto-Run</p>
                    <p className="text-lg font-semibold">{detailBrand.auto_run_paused ? 'Paused' : 'Active'}</p>
                  </div>
                </div>

                {detailBrand.model_usage && Object.keys(detailBrand.model_usage).length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-[11px] text-blue-700 font-medium mb-2">Model Usage</p>
                    <div className="space-y-1.5">
                      {Object.entries(detailBrand.model_usage).map(([model, usage]) => (
                        <div key={model} className="flex justify-between text-sm">
                          <span className="text-blue-800 truncate max-w-[200px]">{model.split('/').pop()}</span>
                          <span className="text-blue-900 font-medium">{usage.count} calls &middot; ${usage.cost.toFixed(4)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pipeline Reports */}
                <PipelineReportSection brandId={detailBrand.id} />

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-2">Business Context</p>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-zinc-500 text-xs">Domain</span><p>{detailBrand.primary_domain || 'Not set'}</p></div>
                    <div><span className="text-zinc-500 text-xs">Products/Services</span><p>{detailBrand.products_services || 'Not provided'}</p></div>
                    <div><span className="text-zinc-500 text-xs">Target Audience</span><p>{detailBrand.target_audience || 'Not provided'}</p></div>
                    {detailBrand.target_markets && detailBrand.target_markets.length > 0 && (
                      <div>
                        <span className="text-zinc-500 text-xs">Markets</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {detailBrand.target_markets.map((m, i) => <Badge key={i} variant="outline" className="text-xs">{m}</Badge>)}
                        </div>
                      </div>
                    )}
                    {detailBrand.known_competitors && detailBrand.known_competitors.length > 0 && (
                      <div>
                        <span className="text-zinc-500 text-xs">Competitors</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {detailBrand.known_competitors.map((c, i) => <Badge key={i} variant="outline" className="text-xs">{c}</Badge>)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
