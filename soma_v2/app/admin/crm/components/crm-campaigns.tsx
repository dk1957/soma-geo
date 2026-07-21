"use client"

import { useState } from "react"
import {
  ArrowRight,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Eye,
  Mail,
  MessageSquare,
  Plus,
  Send,
  Target,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  type CRMCampaign,
  type CRMTemplate,
  type DashboardData,
  MetricCard,
  StatPill,
  EmptyState,
  StatusBadge,
  formatCurrency,
  formatDateTime,
} from "./crm-shared"

interface CampaignsProps {
  campaigns: CRMCampaign[]
  templates: CRMTemplate[]
  dashboard: DashboardData | null
  sendingCampaignId: string | null
  onSendCampaign: (id: string) => void
  onAddCampaign: () => void
}

export function CRMCampaigns({ campaigns, templates, dashboard, sendingCampaignId, onSendCampaign, onAddCampaign }: CampaignsProps) {
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null)

  const totalSent = dashboard?.campaigns.totalEmailsSent ?? 0
  const totalOpened = dashboard?.campaigns.totalOpened ?? 0
  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Total Campaigns" value={dashboard?.campaigns.total ?? 0} icon={Send} detail={`${dashboard?.campaigns.sent ?? 0} sent`} />
        <MetricCard title="Messages Delivered" value={totalSent} icon={Mail} detail="Across all campaigns" accent="blue" />
        <MetricCard title="Opened" value={totalOpened} icon={Eye} detail={`${openRate}% open rate`} accent={openRate >= 25 ? "emerald" : "amber"} />
        <MetricCard title="Sources" value={Object.keys(dashboard?.contactsBySource || {}).length} icon={Target} detail="Acquisition channels" />
      </section>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-zinc-900">Campaigns</h3>
          <p className="text-sm text-zinc-500 mt-0.5">Email and SMS outreach with tracking.</p>
        </div>
        <Button className="bg-zinc-900 text-white hover:bg-zinc-800" onClick={onAddCampaign}>
          <Plus className="mr-2 h-4 w-4" /> New Campaign
        </Button>
      </div>

      {/* Campaign cards */}
      <div className="space-y-3">
        {campaigns.map((campaign) => {
          const isExpanded = expandedCampaign === campaign.id
          const campOpenRate = campaign.total_sent > 0 ? Math.round((campaign.total_opened / campaign.total_sent) * 100) : 0
          const clickRate = campaign.total_sent > 0 ? Math.round((campaign.total_clicked / campaign.total_sent) * 100) : 0

          return (
            <div key={campaign.id} className="rounded-xl border border-zinc-200 overflow-hidden">
              {/* Campaign header */}
              <div className="p-4 flex items-start gap-4">
                <button
                  className="mt-1 shrink-0 text-zinc-400 hover:text-zinc-700 transition-colors"
                  onClick={() => setExpandedCampaign(isExpanded ? null : campaign.id)}
                >
                  <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-zinc-900">{campaign.name}</span>
                    <StatusBadge status={campaign.status} />
                    <Badge variant="outline" className="text-xs capitalize">
                      {campaign.campaign_type === "sms" ? <MessageSquare className="mr-1 h-3 w-3" /> : <Mail className="mr-1 h-3 w-3" />}
                      {campaign.campaign_type}
                    </Badge>
                  </div>
                  {campaign.description && (
                    <div className="mt-1 text-sm text-zinc-500 truncate">{campaign.description}</div>
                  )}
                  <div className="mt-2 text-xs text-zinc-400">
                    Created {formatDateTime(campaign.created_at)}
                    {campaign.sent_at && <span> · Sent {formatDateTime(campaign.sent_at)}</span>}
                  </div>

                  {/* Stats row */}
                  <div className="mt-3 grid gap-2 grid-cols-4">
                    <StatPill label="Recipients" value={campaign.total_recipients} icon={Users} />
                    <StatPill label="Sent" value={campaign.total_sent} icon={Send} />
                    <StatPill label="Opened" value={`${campaign.total_opened} (${campOpenRate}%)`} icon={Eye} />
                    <StatPill label="Clicked" value={`${campaign.total_clicked} (${clickRate}%)`} icon={ArrowRight} />
                  </div>
                </div>

                <div className="shrink-0">
                  {campaign.status === "draft" || campaign.status === "scheduled" ? (
                    <Button
                      size="sm"
                      className="bg-zinc-900 text-white hover:bg-zinc-800"
                      onClick={() => onSendCampaign(campaign.id)}
                      disabled={sendingCampaignId === campaign.id}
                    >
                      <Send className="mr-1.5 h-3.5 w-3.5" />
                      {sendingCampaignId === campaign.id ? "Sending..." : "Send Now"}
                    </Button>
                  ) : campaign.status === "sent" ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border">Delivered</Badge>
                  ) : null}
                </div>
              </div>

              {/* Expanded content: preview */}
              {isExpanded && (
                <div className="border-t border-zinc-200 bg-zinc-50/40 p-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    {/* Subject + Content preview */}
                    <div>
                      <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Content Preview</div>
                      {campaign.subject && (
                        <div className="text-sm font-medium text-zinc-800 mb-2">Subject: {campaign.subject}</div>
                      )}
                      <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600 max-h-60 overflow-y-auto">
                        {campaign.campaign_type === "email" ? (
                          campaign.body_html ? (
                            <div dangerouslySetInnerHTML={{ __html: campaign.body_html }} />
                          ) : (
                            <span className="text-zinc-400">No HTML content</span>
                          )
                        ) : (
                          <div className="whitespace-pre-wrap">{campaign.body_text || "No content"}</div>
                        )}
                      </div>
                    </div>

                    {/* Targeting info */}
                    <div>
                      <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Targeting</div>
                      <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-2 text-sm">
                        {Object.entries(campaign.target_segments || {}).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-zinc-500 capitalize">{key.replaceAll("_", " ")}</span>
                            <span className="text-zinc-800 font-medium">{String(value)}</span>
                          </div>
                        ))}
                        {Object.keys(campaign.target_segments || {}).length === 0 && (
                          <span className="text-zinc-400">All contacts</span>
                        )}
                      </div>

                      {/* Delivery breakdown */}
                      {campaign.total_sent > 0 && (
                        <div className="mt-4">
                          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Delivery</div>
                          <div className="space-y-2">
                            {[
                              { label: "Delivered", value: campaign.total_delivered, total: campaign.total_sent, color: "bg-emerald-500" },
                              { label: "Bounced", value: campaign.total_bounced, total: campaign.total_sent, color: "bg-red-500" },
                              { label: "Unsubscribed", value: campaign.total_unsubscribed, total: campaign.total_sent, color: "bg-zinc-400" },
                            ].map((row) => {
                              const pct = row.total > 0 ? (row.value / row.total) * 100 : 0
                              return (
                                <div key={row.label}>
                                  <div className="flex items-center justify-between text-xs text-zinc-600 mb-1">
                                    <span>{row.label}</span>
                                    <span>{row.value} ({Math.round(pct)}%)</span>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                                    <div className={`h-full rounded-full ${row.color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {campaigns.length === 0 && (
          <EmptyState
            title="No campaigns yet"
            description="Create your first email or SMS campaign to reach your prospects."
            action={<Button size="sm" onClick={onAddCampaign}><Plus className="mr-2 h-4 w-4" />Create Campaign</Button>}
          />
        )}
      </div>
    </div>
  )
}
