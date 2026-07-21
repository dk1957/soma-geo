"use client"
import { Label } from "@/components/ui/label"


import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

/* ─── Types ─── */

export interface CRMContact {
  id: string
  email: string | null
  phone: string | null
  full_name: string | null
  job_title: string | null
  linkedin_url: string | null
  company_name: string | null
  company_domain: string | null
  company_industry: string | null
  company_country: string | null
  company_city: string | null
  company_size: string | null
  company_description: string | null
  company_logo_url: string | null
  company_address: string | null
  company_latitude: number | null
  company_longitude: number | null
  contact_type: string
  lead_source: string
  lead_status: string
  lead_score: number
  budget_range: string | null
  pain_points: string[] | null
  use_case: string | null
  visibility_score: number | null
  estimated_mrr: number | null
  next_follow_up_at: string | null
  last_contacted_at: string | null
  last_activity_at: string | null
  assigned_to: string | null
  tags: string[]
  notes: string | null
  research_data?: {
    key_contacts?: Array<{ name: string; title: string; email?: string; linkedin?: string }>
    social_links?: Record<string, string | null>
    business_type?: string | null
    recommended_approach?: string
    roi_potential?: string
    visibility_gap?: string
    recommended_plan?: string
    rating?: number
    reviews_count?: number
    visibility_score?: number
    fit_reasons?: string[]
    [key: string]: unknown
  }
  created_at: string
  updated_at: string
}

export interface CRMDeal {
  id: string
  contact_id: string | null
  deal_name: string
  deal_value: number
  currency: string
  stage: string
  probability: number
  plan_interest: string | null
  billing_cycle_interest: string | null
  expected_close_date: string | null
  actual_close_date: string | null
  assigned_to: string | null
  notes: string | null
  loss_reason: string | null
  tags: string[]
  created_at: string
  updated_at: string
  contact?: {
    id: string
    full_name: string | null
    email: string | null
    company_name: string | null
    company_domain: string | null
    lead_score: number | null
  }
}

export interface CRMCampaign {
  id: string
  name: string
  description: string | null
  campaign_type: string
  status: string
  subject: string | null
  body_html: string | null
  body_text: string | null
  from_email: string | null
  from_name: string | null
  target_segments: Record<string, any>
  total_recipients: number
  total_sent: number
  total_delivered: number
  total_opened: number
  total_clicked: number
  total_bounced: number
  total_unsubscribed: number
  scheduled_at: string | null
  sent_at: string | null
  created_at: string
  updated_at: string
}

export interface CRMTemplate {
  id: string
  name: string
  description: string | null
  category: string
  subject: string
  body_html: string
  body_text: string | null
  variables: string[]
  is_active: boolean
  created_at: string
}

export interface CRMResearchRecord {
  id: string
  company_name: string | null
  domain: string | null
  description: string | null
  industry: string | null
  employee_count: string | null
  location: string | null
  location_address: string | null
  latitude: number | null
  longitude: number | null
  fit_score: number
  recommended_plan: string | null
  recommended_approach: string | null
  current_ai_visibility_score: number | null
  estimated_monthly_ai_searches: number | null
  competitor_visibility_gap: number | null
  roi_potential: Record<string, string>
  fit_reasons: string[] | null
  sources_used: string[] | null
  raw_data?: {
    key_contacts?: Array<{ name: string; title: string; email?: string; linkedin?: string }>
    location_address?: string | null
    latitude?: number | null
    longitude?: number | null
  }
  contact?: {
    id: string
    full_name: string | null
    email: string | null
    company_name: string | null
    lead_status: string
    lead_score: number
  }
  created_at: string
}

export interface CRMTask {
  id: string
  contact_id: string | null
  deal_id: string | null
  title: string
  description: string | null
  task_type: string
  priority: string
  status: string
  due_date: string | null
  completed_at: string | null
  assigned_to: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  contact?: {
    id: string
    full_name: string | null
    email: string | null
    company_name: string | null
    company_domain: string | null
  }
  deal?: {
    id: string
    deal_name: string
    deal_value: number
    stage: string
  }
}

export interface CRMActivity {
  id: string
  contact_id: string | null
  deal_id: string | null
  activity_type: string
  subject: string | null
  body: string | null
  channel: string | null
  metadata: Record<string, any>
  performed_by: string | null
  created_at: string
  contact?: {
    id: string
    full_name: string | null
    email: string | null
    company_name: string | null
  }
}

export interface DashboardData {
  stats: {
    total: number
    prospects: number
    leads: number
    customers: number
    churned: number
    newThisWeek: number
    newThisMonth: number
  }
  recentSignups: Array<{
    id: string
    name: string
    created_at: string
    industry: string | null
    company_size: string | null
    billing_plan: string | null
    billing_status: string | null
    email: string | null
    full_name: string | null
    subscription_status: string | null
    plan_name: string | null
  }>
  recentTrials: Array<{
    id: string
    status: string
    current_period_end: string | null
    billing_cycle: string | null
    created_at: string
    account: { id: string; name: string; industry: string | null; company_size: string | null } | null
    plan: { display_name?: string; plan_tier?: string } | Array<{ display_name?: string; plan_tier?: string }>
  }>
  pipeline: {
    stages: Record<string, { count: number; value: number; weighted: number }>
    totalWeightedPipeline: number
  }
  campaigns: {
    total: number
    sent: number
    totalEmailsSent: number
    totalOpened: number
  }
  recentActivities: CRMActivity[]
  contactsBySource: Record<string, number>
  topProspects: CRMContact[]
}

export const STAGES = ["discovery", "qualification", "proposal", "negotiation", "closed_won", "closed_lost"]
export const LEAD_STATUSES = ["new", "contacted", "qualified", "nurturing", "opportunity", "negotiation", "closed_won", "closed_lost", "churned"]

/* ─── Shared UI Components ─── */

export function MetricCard({
  title,
  value,
  icon: Icon,
  detail,
  accent,
}: {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  detail: string
  accent?: "emerald" | "amber" | "red" | "blue"
}) {
  const accentClasses = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
  }
  return (
    <Card className="border-zinc-200 shadow-none">
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <div className="text-sm text-zinc-500">{title}</div>
          <div className="mt-1.5 text-2xl font-semibold tracking-tight text-zinc-950">{value}</div>
          <div className="mt-1.5 text-xs text-zinc-500">{detail}</div>
        </div>
        <div className={`rounded-xl p-2.5 ${accent ? accentClasses[accent] : "bg-zinc-100 text-zinc-600"}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  )
}

export function StatPill({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-lg border border-zinc-200 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-zinc-900">{value}</div>
    </div>
  )
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-200 py-10 px-6 text-center">
      <div className="text-sm font-medium text-zinc-700">{title}</div>
      <div className="mt-1.5 text-sm text-zinc-500">{description}</div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "bg-emerald-100 text-emerald-700" : score >= 40 ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-600"
  return (
    <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-semibold ${color}`}>
      {score}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    new: "bg-blue-50 text-blue-700 border-blue-200",
    contacted: "bg-sky-50 text-sky-700 border-sky-200",
    qualified: "bg-amber-50 text-amber-700 border-amber-200",
    nurturing: "bg-purple-50 text-purple-700 border-purple-200",
    opportunity: "bg-orange-50 text-orange-700 border-orange-200",
    negotiation: "bg-indigo-50 text-indigo-700 border-indigo-200",
    closed_won: "bg-emerald-50 text-emerald-700 border-emerald-200",
    closed_lost: "bg-red-50 text-red-700 border-red-200",
    churned: "bg-zinc-100 text-zinc-600 border-zinc-200",
    prospect: "bg-zinc-50 text-zinc-600 border-zinc-200",
    lead: "bg-amber-50 text-amber-700 border-amber-200",
    customer: "bg-emerald-50 text-emerald-700 border-emerald-200",
    partner: "bg-blue-50 text-blue-700 border-blue-200",
    // campaign
    draft: "bg-zinc-50 text-zinc-600 border-zinc-200",
    sending: "bg-amber-50 text-amber-700 border-amber-200",
    sent: "bg-emerald-50 text-emerald-700 border-emerald-200",
    paused: "bg-orange-50 text-orange-700 border-orange-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    scheduled: "bg-blue-50 text-blue-700 border-blue-200",
    // task
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    in_progress: "bg-blue-50 text-blue-700 border-blue-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  }
  return (
    <Badge className={`text-xs border ${classes[status] || "bg-zinc-50 text-zinc-600 border-zinc-200"}`}>
      {status.replaceAll("_", " ")}
    </Badge>
  )
}

export function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    urgent: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-amber-400",
    low: "bg-zinc-300",
  }
  return <span className={`inline-block h-2 w-2 rounded-full ${colors[priority] || "bg-zinc-300"}`} />
}

/* ─── Util Functions ─── */

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0)
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—"
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function formatRelativeDate(value: string | null | undefined) {
  if (!value) return "—"
  const now = new Date()
  const date = new Date(value)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(value)
}

export function isOverdue(dateStr: string | null) {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

export function isDueToday(dateStr: string | null) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
