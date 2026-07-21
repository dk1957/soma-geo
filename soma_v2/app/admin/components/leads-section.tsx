"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Loader2, RefreshCw, UserPlus, Users, Mail, ArrowRight,
  CheckCircle, Clock, Search, ExternalLink, Eye, Globe,
} from "lucide-react"

interface Lead {
  id: string
  lead_token: string
  email: string | null
  brand_name: string | null
  brand_website: string | null
  source: string
  status: string
  last_step: string | null
  steps_completed: string[]
  ip_address: string | null
  fingerprint: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  account_id: string | null
  clerk_id: string | null
  converted_at: string | null
  created_at: string
  updated_at: string
  last_activity_at: string
  audit: { status: string; brand_name: string } | null
}

interface LeadStats {
  total: number
  new: number
  engaged: number
  audit_started: number
  audit_completed: number
  converted: number
  with_email: number
  conversion_rate: number
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: "New", color: "bg-zinc-100 text-zinc-700" },
  engaged: { label: "Engaged", color: "bg-blue-100 text-blue-700" },
  audit_started: { label: "Audit Started", color: "bg-amber-100 text-amber-700" },
  audit_completed: { label: "Audit Done", color: "bg-emerald-100 text-emerald-700" },
  converted: { label: "Converted", color: "bg-green-100 text-green-800" },
  expired: { label: "Expired", color: "bg-red-100 text-red-700" },
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

export function LeadsSection() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [daysFilter, setDaysFilter] = useState("30")

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ days: daysFilter })
      if (statusFilter !== "all") params.set("status", statusFilter)
      const res = await fetch(`/api/admin/leads?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads || [])
        setStats(data.stats || null)
      }
    } catch (e) {
      console.error("Failed to fetch leads:", e)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, daysFilter])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const filtered = leads.filter(l => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      l.brand_name?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.utm_source?.toLowerCase().includes(q) ||
      l.utm_campaign?.toLowerCase().includes(q) ||
      l.ip_address?.includes(q)
    )
  })

  const funnelSteps = [
    { key: "total", label: "Total", icon: <Users className="h-4 w-4" />, value: stats?.total || 0 },
    { key: "engaged", label: "Engaged", icon: <Eye className="h-4 w-4" />, value: stats?.engaged || 0 },
    { key: "audit_started", label: "Audit Started", icon: <Clock className="h-4 w-4" />, value: stats?.audit_started || 0 },
    { key: "audit_completed", label: "Audit Done", icon: <CheckCircle className="h-4 w-4" />, value: stats?.audit_completed || 0 },
    { key: "converted", label: "Converted", icon: <UserPlus className="h-4 w-4" />, value: stats?.converted || 0 },
  ]

  return (
    <div className="space-y-6">
      {/* Funnel Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {funnelSteps.map((step, i) => (
          <Card key={step.key} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-500">{step.icon}</span>
                {i < funnelSteps.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-zinc-300 absolute right-1 top-1/2 -translate-y-1/2" />
                )}
              </div>
              <div className="text-2xl font-bold text-zinc-900">{step.value}</div>
              <div className="text-xs text-zinc-500">{step.label}</div>
              {i > 0 && stats?.total ? (
                <div className="text-[10px] text-zinc-400 mt-1">
                  {Math.round((step.value / stats.total) * 100)}% of total
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Row */}
      <div className="flex items-center gap-4 text-sm text-zinc-500">
        <span className="flex items-center gap-1">
          <Mail className="h-3.5 w-3.5" /> {stats?.with_email || 0} with email
        </span>
        <span>
          Conversion rate: <strong className="text-zinc-900">{stats?.conversion_rate || 0}%</strong>
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search by brand, email, source..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="engaged">Engaged</SelectItem>
            <SelectItem value="audit_started">Audit Started</SelectItem>
            <SelectItem value="audit_completed">Audit Completed</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={daysFilter} onValueChange={setDaysFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchLeads} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="border border-zinc-200 rounded-lg bg-white overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-zinc-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading leads...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-zinc-400">
            <UserPlus className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p>No leads found for the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50">
                  <TableHead className="text-xs font-semibold">Brand</TableHead>
                  <TableHead className="text-xs font-semibold">Email</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold">Last Step</TableHead>
                  <TableHead className="text-xs font-semibold">Audit</TableHead>
                  <TableHead className="text-xs font-semibold">Source</TableHead>
                  <TableHead className="text-xs font-semibold">Created</TableHead>
                  <TableHead className="text-xs font-semibold">Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((lead) => {
                  const sc = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new
                  return (
                    <TableRow key={lead.id} className="hover:bg-zinc-50/50">
                      <TableCell>
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-zinc-900 truncate max-w-[180px]">
                            {lead.brand_name || <span className="text-zinc-400 italic">unnamed</span>}
                          </div>
                          {lead.brand_website && (
                            <a
                              href={lead.brand_website.startsWith("http") ? lead.brand_website : `https://${lead.brand_website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-zinc-400 hover:text-zinc-600 flex items-center gap-0.5 truncate max-w-[180px]"
                            >
                              <Globe className="h-3 w-3 shrink-0" />
                              {lead.brand_website.replace(/^https?:\/\//, "")}
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {lead.email ? (
                          <a href={`mailto:${lead.email}`} className="text-sm text-zinc-600 hover:text-zinc-900 truncate block max-w-[200px]">
                            {lead.email}
                          </a>
                        ) : (
                          <span className="text-xs text-zinc-300">&mdash;</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-[11px] font-medium ${sc.color}`}>
                          {sc.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-zinc-500 capitalize">
                          {lead.last_step?.replace(/-|_/g, " ") || <span className="text-zinc-300">&mdash;</span>}
                        </span>
                      </TableCell>
                      <TableCell>
                        {lead.audit ? (
                          <Badge
                            variant="secondary"
                            className={`text-[11px] ${
                              lead.audit.status === "completed"
                                ? "bg-emerald-50 text-emerald-700"
                                : lead.audit.status === "running"
                                ? "bg-blue-50 text-blue-700"
                                : lead.audit.status === "failed"
                                ? "bg-red-50 text-red-700"
                                : "bg-zinc-50 text-zinc-500"
                            }`}
                          >
                            {lead.audit.status}
                          </Badge>
                        ) : (
                          <span className="text-xs text-zinc-300">&mdash;</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-zinc-500">
                          {lead.utm_source || lead.source || <span className="text-zinc-300">&mdash;</span>}
                          {lead.utm_campaign && (
                            <div className="text-[10px] text-zinc-400 truncate max-w-[120px]">{lead.utm_campaign}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-zinc-500 whitespace-nowrap">{timeAgo(lead.created_at)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-zinc-500 whitespace-nowrap">{timeAgo(lead.last_activity_at)}</span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="text-xs text-zinc-400 text-right">
        Showing {filtered.length} of {leads.length} leads
      </div>
    </div>
  )
}
