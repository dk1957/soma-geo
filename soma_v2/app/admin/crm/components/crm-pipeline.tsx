"use client"

import { useMemo } from "react"
import {
  ArrowRight,
  BadgeDollarSign,
  Calendar,
  ChevronRight,
  Plus,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  type CRMDeal,
  MetricCard,
  EmptyState,
  formatCurrency,
  formatDate,
  STAGES,
} from "./crm-shared"

interface PipelineProps {
  deals: CRMDeal[]
  stageCards: Record<string, { count: number; value: number; weighted: number }>
  totalWeightedPipeline: number
  onAddDeal: () => void
  onUpdateDealStage: (dealId: string, stage: string, contactId?: string | null) => void
}

export function CRMPipeline({ deals, stageCards, totalWeightedPipeline, onAddDeal, onUpdateDealStage }: PipelineProps) {
  const activeDeals = useMemo(() => deals.filter((d) => !["closed_won", "closed_lost"].includes(d.stage)), [deals])
  const totalActive = activeDeals.reduce((s, d) => s + (d.deal_value || 0), 0)
  const avgDealSize = activeDeals.length > 0 ? totalActive / activeDeals.length : 0
  const wonDeals = useMemo(() => deals.filter((d) => d.stage === "closed_won"), [deals])
  const wonTotal = wonDeals.reduce((s, d) => s + (d.deal_value || 0), 0)
  const winRate = deals.length > 0 ? Math.round((wonDeals.length / deals.filter((d) => ["closed_won", "closed_lost"].includes(d.stage)).length) * 100) || 0 : 0

  const stageColors: Record<string, string> = {
    discovery: "border-l-zinc-400",
    qualification: "border-l-blue-400",
    proposal: "border-l-amber-400",
    negotiation: "border-l-purple-400",
    closed_won: "border-l-emerald-400",
    closed_lost: "border-l-red-400",
  }
  const stageHeaderColors: Record<string, string> = {
    discovery: "bg-zinc-50 border-zinc-200",
    qualification: "bg-blue-50 border-blue-200",
    proposal: "bg-amber-50 border-amber-200",
    negotiation: "bg-purple-50 border-purple-200",
    closed_won: "bg-emerald-50 border-emerald-200",
    closed_lost: "bg-red-50 border-red-200",
  }
  const stageHeaderText: Record<string, string> = {
    discovery: "text-zinc-800",
    qualification: "text-blue-800",
    proposal: "text-amber-800",
    negotiation: "text-purple-800",
    closed_won: "text-emerald-800",
    closed_lost: "text-red-700",
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Weighted Pipeline" value={formatCurrency(totalWeightedPipeline)} icon={BadgeDollarSign} detail={`${activeDeals.length} active deals`} />
        <MetricCard title="Avg Deal Size" value={formatCurrency(avgDealSize)} icon={TrendingUp} detail="Across active pipeline" />
        <MetricCard title="Won Revenue" value={formatCurrency(wonTotal)} icon={BadgeDollarSign} detail={`${wonDeals.length} closed won`} accent="emerald" />
        <MetricCard title="Win Rate" value={`${winRate}%`} icon={TrendingUp} detail="Won / (Won + Lost)" accent={winRate >= 50 ? "emerald" : winRate >= 25 ? "amber" : "red"} />
      </section>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-zinc-900">Revenue Pipeline</h3>
          <p className="text-sm text-zinc-500 mt-0.5">Kanban view of all opportunities. Change stages inline.</p>
        </div>
        <Button className="bg-zinc-900 text-white hover:bg-zinc-800" onClick={onAddDeal}>
          <Plus className="mr-2 h-4 w-4" /> New Deal
        </Button>
      </div>

      {/* Kanban */}
      <div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-6">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage)
          return (
            <div key={stage} className="space-y-2.5">
              {/* Stage header */}
              <div className={`rounded-lg border px-3 py-2 ${stageHeaderColors[stage] || "border-zinc-200 bg-zinc-50"}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium capitalize ${stageHeaderText[stage] || "text-zinc-800"}`}>
                    {stage.replaceAll("_", " ")}
                  </span>
                  <span className="text-xs font-medium text-zinc-500 bg-white/60 rounded-md px-1.5 py-0.5">{stageCards[stage]?.count || 0}</span>
                </div>
                <div className="text-xs text-zinc-500 mt-0.5 tabular-nums">
                  {formatCurrency(stageCards[stage]?.value || 0)}
                </div>
              </div>

              {/* Deal cards */}
              {stageDeals.map((deal) => (
                <div key={deal.id} className={`rounded-lg border border-l-[3px] ${stageColors[stage] || "border-l-zinc-400"} border-zinc-200 bg-white p-3 hover:border-zinc-300 transition-colors`}>
                  <div className="font-medium text-sm text-zinc-900 truncate">{deal.deal_name}</div>
                  <div className="mt-1 text-xs text-zinc-500 truncate">{deal.contact?.company_name || deal.contact?.full_name || "No contact"}</div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-zinc-800">{formatCurrency(deal.deal_value)}</span>
                    <span className="text-xs text-zinc-400">{deal.probability}%</span>
                  </div>

                  {(deal.expected_close_date || deal.plan_interest) && (
                    <div className="mt-2.5 flex items-center gap-2 text-xs text-zinc-400">
                      {deal.expected_close_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(deal.expected_close_date)}
                        </span>
                      )}
                      {deal.plan_interest && (
                        <Badge variant="outline" className="text-xs capitalize">{deal.plan_interest}</Badge>
                      )}
                    </div>
                  )}

                  {/* Stage changer */}
                  {!["closed_won", "closed_lost"].includes(stage) && (
                    <div className="mt-2.5">
                      <Select value={stage} onValueChange={(v) => onUpdateDealStage(deal.id, v, deal.contact_id)}>
                        <SelectTrigger className="h-7 text-xs border-zinc-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STAGES.map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">{s.replaceAll("_", " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ))}

              {stageDeals.length === 0 && (
                <div className="rounded-lg border border-dashed border-zinc-200 py-4 text-xs text-zinc-400 text-center">
                  Empty
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
