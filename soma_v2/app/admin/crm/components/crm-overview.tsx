"use client"

import { useMemo } from "react"
import {
  Activity,
  ArrowRight,
  BadgeDollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  type CRMContact,
  type CRMDeal,
  type DashboardData,
  MetricCard,
  formatCurrency,
  formatDate,
  formatRelativeDate,
  STAGES,
} from "./crm-shared"

interface OverviewProps {
  dashboard: DashboardData | null
  deals: CRMDeal[]
  onNavigate: (section: string) => void
  onQuickDeal: (contact: CRMContact) => void
}

export function CRMOverview({ dashboard, deals, onNavigate, onQuickDeal }: OverviewProps) {
  const stageCards = dashboard?.pipeline?.stages || {}
  const activeDeals = deals.filter((d) => !["closed_won", "closed_lost"].includes(d.stage))
  const wonDeals = deals.filter((d) => d.stage === "closed_won")
  const wonValue = wonDeals.reduce((s, d) => s + (d.deal_value || 0), 0)
  const totalPipelineValue = activeDeals.reduce((s, d) => s + (d.deal_value || 0), 0)

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Contacts" value={dashboard?.stats.total ?? 0} icon={Users} detail={"+" + (dashboard?.stats.newThisWeek ?? 0) + " this week"} accent="blue" />
        <MetricCard title="Active Pipeline" value={formatCurrency(dashboard?.pipeline.totalWeightedPipeline ?? 0)} icon={BadgeDollarSign} detail={activeDeals.length + " open deals"} />
        <MetricCard title="Customers" value={dashboard?.stats.customers ?? 0} icon={CheckCircle2} detail={(dashboard?.stats.leads ?? 0) + " leads in nurture"} accent="emerald" />
        <MetricCard title="Won Revenue" value={formatCurrency(wonValue)} icon={TrendingUp} detail={wonDeals.length + " closed this period"} accent="emerald" />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Pipeline snapshot */}
        <Card className="border-zinc-200 shadow-none">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Pipeline Snapshot</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-zinc-500" onClick={() => onNavigate("pipeline")}>
              Full pipeline <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {STAGES.filter((s) => !["closed_won", "closed_lost"].includes(s)).map((stage) => {
                const data = stageCards[stage]
                const pct = totalPipelineValue > 0 ? ((data?.value || 0) / totalPipelineValue) * 100 : 0
                return (
                  <div key={stage} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize text-zinc-800">{stage.replaceAll("_", " ")}</span>
                      <span className="text-xs text-zinc-500 tabular-nums">
                        {data?.count || 0} · {formatCurrency(data?.value || 0)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                      <div className="h-full rounded-full bg-zinc-800 transition-all" style={{ width: Math.min(pct, 100) + "%" }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-100 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-zinc-500">Won</div>
                <div className="font-semibold text-emerald-700">{formatCurrency(stageCards["closed_won"]?.value || 0)}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Lost</div>
                <div className="font-semibold text-red-600">{formatCurrency(stageCards["closed_lost"]?.value || 0)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Signups & Trials */}
        <Card className="border-zinc-200 shadow-none">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">New Signups & Trials</CardTitle>
            <Badge variant="outline" className="text-xs">{(dashboard?.recentSignups?.length || 0) + (dashboard?.recentTrials?.length || 0)} total</Badge>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-zinc-200 overflow-hidden">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/60 text-left text-xs text-zinc-500">
                    <th className="py-2.5 px-3 font-medium">Account</th>
                    <th className="py-2.5 px-3 font-medium">Industry</th>
                    <th className="py-2.5 px-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboard?.recentSignups || []).slice(0, 10).map((signup: any) => (
                    <tr key={signup.id} className="border-b border-zinc-100 hover:bg-zinc-50/40">
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-zinc-900">{signup.company_name}</div>
                        <div className="text-xs text-zinc-500">{signup.contact_email}</div>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-600 capitalize">{signup.industry || "—"}</td>
                      <td className="py-2.5 px-3 text-zinc-500">{formatRelativeDate(signup.created_at)}</td>
                    </tr>
                  ))}
                  {(dashboard?.recentSignups?.length || 0) === 0 && (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-zinc-400">No recent signups.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
