"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowUpDown,
  Briefcase,
  Check,
  ExternalLink,
  Globe,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  PanelRight,
  Phone,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  type CRMContact,
  type CRMDeal,
  EmptyState,
  ScoreBadge,
  StatusBadge,
  formatCurrency,
  formatRelativeDate,
} from "./crm-shared"

interface ContactsProps {
  contacts: CRMContact[]
  allContacts: CRMContact[]
  deals: CRMDeal[]
  externalSelectedContactId?: string | null
  openSidebarSignal?: number
  contactStatusFilter: string
  onStatusFilterChange: (v: string) => void
  onUpdateStatus: (id: string, status: string) => void
  onUpdateContactType: (id: string, contactType: string) => void
  onQuickDeal: (c: CRMContact) => void
  onAddContact: () => void
  onDeleteContact: (id: string) => void
  onDeleteBusiness: (businessName: string, contactIds: string[]) => void
}

type PanelTab = "sales" | "reviews" | "outreach"
type OutreachStyle = "roi" | "pain" | "visibility"
type OutreachChannel = "email" | "sms" | "linkedin"

interface BusinessGroup {
  key: string
  businessName: string
  domain: string | null
  city: string | null
  country: string | null
  industry: string | null
  category: string | null
  email: string | null
  phone: string | null
  estimatedMrr: number | null
  contacts: CRMContact[]
  primaryContact: CRMContact
  maxLeadScore: number
  averageLeadScore: number
  dominantStatus: string
  latestCreatedAt: string
  reachableContacts: number
  dealCount: number
  pipelineValue: number
}

const normalizeBusinessValue = (value: string | null | undefined) => (value || "").trim().toLowerCase()

const getBusinessKey = (contact: CRMContact) => {
  const domain = normalizeBusinessValue(contact.company_domain)
  if (domain) return `domain:${domain}`

  const name = normalizeBusinessValue(contact.company_name)
  const city = normalizeBusinessValue(contact.company_city)
  const country = normalizeBusinessValue(contact.company_country)

  if (name) return `company:${name}|${city}|${country}`
  return `contact:${contact.id}`
}

export function CRMContacts({
  contacts,
  allContacts,
  deals,
  externalSelectedContactId,
  openSidebarSignal,
  contactStatusFilter,
  onStatusFilterChange,
  onUpdateStatus,
  onUpdateContactType,
  onQuickDeal,
  onAddContact,
  onDeleteContact,
  onDeleteBusiness,
}: ContactsProps) {
  const [selectedBusinessKey, setSelectedBusinessKey] = useState<string | null>(null)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<PanelTab>("sales")
  const [outreachStyle, setOutreachStyle] = useState<OutreachStyle>("roi")
  const [outreachChannel, setOutreachChannel] = useState<OutreachChannel>("email")
  const [copiedDraft, setCopiedDraft] = useState(false)
  const [aiDraft, setAiDraft] = useState("")
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false)
  const [sortBy, setSortBy] = useState<"created_at" | "lead_score" | "company_name">("lead_score")
  const [sortAsc, setSortAsc] = useState(false)

  const buttonFeedbackClass = "transition-transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"

  const dealsByContactId = useMemo(() => {
    const map = new Map<string, CRMDeal[]>()

    for (const deal of deals) {
      if (!deal.contact_id) continue
      const list = map.get(deal.contact_id)
      if (list) list.push(deal)
      else map.set(deal.contact_id, [deal])
    }

    return map
  }, [deals])

  const businessGroups = useMemo<BusinessGroup[]>(() => {
    const grouped = new Map<string, CRMContact[]>()

    for (const contact of contacts) {
      const key = getBusinessKey(contact)
      const list = grouped.get(key)
      if (list) list.push(contact)
      else grouped.set(key, [contact])
    }

    const groups: BusinessGroup[] = []

    for (const [key, groupContacts] of grouped.entries()) {
      const contactsSorted = [...groupContacts].sort((a, b) => {
        const scoreDiff = (b.lead_score || 0) - (a.lead_score || 0)
        if (scoreDiff !== 0) return scoreDiff
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      const primaryContact = contactsSorted[0]
      const maxLeadScore = Math.max(...contactsSorted.map((contact) => contact.lead_score || 0))
      const averageLeadScore = Math.round(
        contactsSorted.reduce((sum, contact) => sum + (contact.lead_score || 0), 0) / contactsSorted.length
      )

      const statusCounts = contactsSorted.reduce<Record<string, number>>((acc, contact) => {
        acc[contact.lead_status] = (acc[contact.lead_status] || 0) + 1
        return acc
      }, {})

      const dominantStatus =
        Object.entries(statusCounts).sort((left, right) => right[1] - left[1])[0]?.[0] || primaryContact.lead_status

      const latestCreatedAt = contactsSorted.reduce((latest, contact) => {
        return new Date(contact.created_at).getTime() > new Date(latest).getTime() ? contact.created_at : latest
      }, primaryContact.created_at)

      let dealCount = 0
      let pipelineValue = 0

      for (const contact of contactsSorted) {
        const contactDeals = dealsByContactId.get(contact.id) || []
        dealCount += contactDeals.length
        pipelineValue += contactDeals.reduce((sum, deal) => sum + (deal.deal_value || 0), 0)
      }

      const reachableContacts = contactsSorted.filter((contact) => contact.email || contact.phone || contact.linkedin_url).length

      groups.push({
        key,
        businessName: primaryContact.company_name || primaryContact.full_name || "Unnamed business",
        domain: primaryContact.company_domain,
        city: primaryContact.company_city,
        country: primaryContact.company_country,
        industry: primaryContact.company_industry || null,
        category: (primaryContact.research_data as any)?.business_type || null,
        email: primaryContact.email || contactsSorted.find((c) => c.email)?.email || null,
        phone: primaryContact.phone || contactsSorted.find((c) => c.phone)?.phone || null,
        estimatedMrr: primaryContact.estimated_mrr || null,
        contacts: contactsSorted,
        primaryContact,
        maxLeadScore,
        averageLeadScore,
        dominantStatus,
        latestCreatedAt,
        reachableContacts,
        dealCount,
        pipelineValue,
      })
    }

    return groups
  }, [contacts, dealsByContactId])

  const sortedBusinessGroups = useMemo(() => {
    return [...businessGroups].sort((a, b) => {
      let valA: string | number = 0
      let valB: string | number = 0

      if (sortBy === "lead_score") {
        valA = a.maxLeadScore
        valB = b.maxLeadScore
      } else if (sortBy === "company_name") {
        valA = a.businessName.toLowerCase()
        valB = b.businessName.toLowerCase()
      } else {
        valA = new Date(a.latestCreatedAt).getTime()
        valB = new Date(b.latestCreatedAt).getTime()
      }

      if (valA < valB) return sortAsc ? -1 : 1
      if (valA > valB) return sortAsc ? 1 : -1
      return 0
    })
  }, [businessGroups, sortBy, sortAsc])

  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {}
    allContacts.forEach((contact) => {
      map[contact.lead_status] = (map[contact.lead_status] || 0) + 1
    })
    return map
  }, [allContacts])

  const selectedBusiness = useMemo(() => {
    if (!selectedBusinessKey) return null
    return sortedBusinessGroups.find((group) => group.key === selectedBusinessKey) || null
  }, [selectedBusinessKey, sortedBusinessGroups])

  const selectedContact = useMemo(() => {
    if (!selectedBusiness) return null
    if (selectedContactId) {
      const found = selectedBusiness.contacts.find((contact) => contact.id === selectedContactId)
      if (found) return found
    }
    return selectedBusiness.primaryContact
  }, [selectedBusiness, selectedContactId])

  useEffect(() => {
    if (!externalSelectedContactId) return

    const targetGroup = sortedBusinessGroups.find((group) => group.contacts.some((contact) => contact.id === externalSelectedContactId))
    if (!targetGroup) return

    setSelectedContactId(externalSelectedContactId)
    setSelectedBusinessKey(targetGroup.key)
    setIsSidebarOpen(true)
  }, [externalSelectedContactId, openSidebarSignal, sortedBusinessGroups])

  useEffect(() => {
    if (!sortedBusinessGroups.length) {
      setSelectedBusinessKey(null)
      setSelectedContactId(null)
      return
    }

    // Skip auto-select when an external contact was just focused
    if (externalSelectedContactId) return

    if (!selectedBusinessKey || !sortedBusinessGroups.some((group) => group.key === selectedBusinessKey)) {
      const first = sortedBusinessGroups[0]
      setSelectedBusinessKey(first.key)
      setSelectedContactId(first.primaryContact.id)
    }
  }, [sortedBusinessGroups, selectedBusinessKey, externalSelectedContactId])

  const selectedDeals = useMemo(() => {
    if (!selectedBusiness) return []
    const ids = new Set(selectedBusiness.contacts.map((contact) => contact.id))
    return deals.filter((deal) => !!deal.contact_id && ids.has(deal.contact_id))
  }, [selectedBusiness, deals])

  const reviewPainPoints = useMemo(() => {
    if (!selectedContact) return []
    if (selectedContact.pain_points && selectedContact.pain_points.length > 0) {
      return selectedContact.pain_points
    }
    const rd = selectedContact.research_data as Record<string, unknown> | undefined
    if (rd?.fit_reasons && Array.isArray(rd.fit_reasons) && rd.fit_reasons.length > 0) {
      return rd.fit_reasons as string[]
    }
    return []
  }, [selectedContact])

  const strengths = useMemo(() => {
    if (!selectedContact) return []
    const rd = selectedContact.research_data as Record<string, unknown> | undefined
    const values: string[] = []

    if (rd?.rating) values.push(`${rd.rating}★ average rating`)
    if (rd?.reviews_count) values.push(`${rd.reviews_count} customer reviews`)
    if (rd?.visibility_score) values.push(`Visibility score: ${rd.visibility_score}/100`)
    if (selectedContact.company_description) values.push("Strong company narrative available")
    if (selectedContact.company_domain) values.push("Website and digital presence detected")
    if (selectedContact.linkedin_url) values.push("LinkedIn profile available for outreach")
    if (selectedContact.email) values.push("Direct email contact available")
    if (selectedContact.phone) values.push("Direct phone contact available")

    return values
  }, [selectedContact])

  const salesApproaches = useMemo(() => {
    if (!selectedContact) return []
    const rd = selectedContact.research_data as Record<string, unknown> | undefined
    const approaches: { key: string; title: string; body: string }[] = []

    if (rd?.recommended_approach) {
      approaches.push({ key: "recommended", title: "Recommended Approach", body: String(rd.recommended_approach) })
    }
    if (rd?.roi_potential) {
      approaches.push({ key: "roi", title: "ROI Potential", body: String(rd.roi_potential) })
    }
    if (rd?.visibility_gap) {
      approaches.push({ key: "gap", title: "Visibility Gap", body: String(rd.visibility_gap) })
    }
    if (rd?.recommended_plan) {
      approaches.push({ key: "plan", title: "Recommended Plan", body: String(rd.recommended_plan) })
    }

    return approaches
  }, [selectedContact])

  const generateAIDraft = async (channel?: OutreachChannel, style?: OutreachStyle) => {
    if (!selectedContact) return
    setIsGeneratingDraft(true)
    setAiDraft("")

    try {
      const res = await fetch("/api/admin/crm/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: channel || outreachChannel,
          style: style || outreachStyle,
          contactName: selectedContact.full_name,
          companyName: selectedContact.company_name,
          companyDomain: selectedContact.company_domain,
          jobTitle: selectedContact.job_title,
          industry: selectedContact.company_industry,
          painPoints: selectedContact.pain_points,
          notes: selectedContact.notes || selectedContact.company_description,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Generation failed")
      setAiDraft(result.message || "")
    } catch {
      setAiDraft("Unable to generate draft. Check that the OpenRouter API key is configured.")
    } finally {
      setIsGeneratingDraft(false)
    }
  }

  const toggleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortAsc(!sortAsc)
      return
    }
    setSortBy(column)
    setSortAsc(false)
  }

  const handleCopyDraft = async () => {
    if (!aiDraft) return

    try {
      await navigator.clipboard.writeText(aiDraft)
      setCopiedDraft(true)
      window.setTimeout(() => setCopiedDraft(false), 1500)
    } catch {
      setCopiedDraft(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { value: "all", label: "All" },
          { value: "new", label: "New" },
          { value: "contacted", label: "Contacted" },
          { value: "qualified", label: "Qualified" },
          { value: "nurturing", label: "Nurturing" },
          { value: "opportunity", label: "Opportunity" },
          { value: "negotiation", label: "Negotiation" },
          { value: "closed_won", label: "Won" },
          { value: "closed_lost", label: "Lost" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => onStatusFilterChange(opt.value)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors active:scale-[0.98] ${
              contactStatusFilter === opt.value
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
            }`}
          >
            {opt.label}
            {opt.value !== "all" && statusCounts[opt.value] ? (
              <span className="ml-1 opacity-60">{statusCounts[opt.value]}</span>
            ) : opt.value === "all" ? (
              <span className="ml-1 opacity-60">{allContacts.length}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className={`grid items-start gap-4 ${isSidebarOpen && selectedBusiness ? "xl:grid-cols-[minmax(0,1fr)_380px]" : "grid-cols-1"}`}>
        <div className="rounded-xl border border-zinc-200 overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-500">
                  <th className="py-2.5 px-4 font-medium">
                    <button className="flex items-center gap-1 hover:text-zinc-700" onClick={() => toggleSort("company_name")}>
                      Business {sortBy === "company_name" && <ArrowUpDown className="h-3 w-3" />}
                    </button>
                  </th>
                  <th className="py-2.5 px-4 font-medium">Category</th>
                  <th className="py-2.5 px-4 font-medium">Industry</th>
                  <th className="py-2.5 px-4 font-medium">Market value</th>
                  <th className="py-2.5 px-4 font-medium">Website</th>
                  <th className="py-2.5 px-4 font-medium">Email</th>
                  <th className="py-2.5 px-4 font-medium">Phone</th>
                  <th className="py-2.5 px-4 font-medium">
                    <button className="flex items-center gap-1 hover:text-zinc-700" onClick={() => toggleSort("lead_score")}>
                      Score {sortBy === "lead_score" && <ArrowUpDown className="h-3 w-3" />}
                    </button>
                  </th>
                  <th className="py-2.5 px-4 font-medium" />
                </tr>
              </thead>
              <tbody>
                {sortedBusinessGroups.map((group) => {
                  const isSelected = selectedBusiness?.key === group.key
                  const location = [group.city, group.country].filter(Boolean).join(", ") || "Location unavailable"

                  return (
                    <tr
                      key={group.key}
                      className={`border-b border-zinc-100 cursor-pointer ${isSelected ? "bg-zinc-100/70" : "hover:bg-zinc-50/40"}`}
                      onClick={() => {
                        setSelectedBusinessKey(group.key)
                        setSelectedContactId(group.primaryContact.id)
                        setIsSidebarOpen(true)
                      }}
                    >
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-zinc-900">{group.businessName}</div>
                        <div className="text-xs text-zinc-500 truncate max-w-[200px]">{location}</div>
                      </td>
                      <td className="py-2.5 px-4 text-xs text-zinc-600">{group.category || <span className="text-zinc-300">—</span>}</td>
                      <td className="py-2.5 px-4 text-xs text-zinc-600">{group.industry || <span className="text-zinc-300">—</span>}</td>
                      <td className="py-2.5 px-4 text-xs text-zinc-600">
                        {group.estimatedMrr ? formatCurrency(group.estimatedMrr) + "/mo" : <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="py-2.5 px-4">
                        {group.domain ? (
                          <a
                            href={`https://${group.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline truncate block max-w-[160px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {group.domain}
                          </a>
                        ) : <span className="text-xs text-zinc-300">—</span>}
                      </td>
                      <td className="py-2.5 px-4">
                        {group.email ? (
                          <a
                            href={`mailto:${group.email}`}
                            className="text-xs text-zinc-600 hover:text-zinc-900 truncate block max-w-[180px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {group.email}
                          </a>
                        ) : <span className="text-xs text-zinc-300">—</span>}
                      </td>
                      <td className="py-2.5 px-4">
                        {group.phone ? (
                          <a
                            href={`tel:${group.phone}`}
                            className="text-xs text-zinc-600 hover:text-zinc-900 whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {group.phone}
                          </a>
                        ) : <span className="text-xs text-zinc-300">—</span>}
                      </td>
                      <td className="py-2.5 px-4">
                        <ScoreBadge score={group.maxLeadScore} />
                      </td>
                      <td className="py-2.5 px-4" onClick={(event) => event.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className={`h-7 w-7 ${buttonFeedbackClass}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onQuickDeal(group.primaryContact)}>
                              <Briefcase className="mr-2 h-4 w-4" /> Create deal
                            </DropdownMenuItem>
                            {group.primaryContact.email ? (
                              <DropdownMenuItem onClick={() => window.open(`mailto:${group.primaryContact.email}`)}>
                                <Mail className="mr-2 h-4 w-4" /> Send email
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedBusinessKey(group.key)
                                setSelectedContactId(group.primaryContact.id)
                                setIsSidebarOpen(true)
                              }}
                            >
                              <PanelRight className="mr-2 h-4 w-4" /> Open intelligence
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => onDeleteBusiness(group.businessName, group.contacts.map((contact) => contact.id))}
                            >
                              Delete business + contacts
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => onDeleteContact(group.primaryContact.id)}>
                              Delete primary contact
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {sortedBusinessGroups.length === 0 ? (
            <div className="py-12 px-4">
              <EmptyState
                title="No businesses match"
                description="Try a different filter or add a contact to create a new business group."
                action={<Button size="sm" className={buttonFeedbackClass} onClick={onAddContact}><Plus className="mr-2 h-4 w-4" />Add Contact</Button>}
              />
            </div>
          ) : null}

          {!isSidebarOpen && sortedBusinessGroups.length > 0 ? (
            <div className="flex items-center gap-2 border-t border-zinc-200 px-4 py-3 text-xs text-zinc-500">
              <PanelRight className="h-3.5 w-3.5" />
              Sidebar is closed. Click a business row to open Sales Intelligence.
            </div>
          ) : null}
        </div>

        {isSidebarOpen && selectedBusiness ? (
          <div className="xl:sticky xl:top-24 h-[calc(100vh-7rem)] rounded-xl border border-zinc-200 bg-white overflow-hidden">
            {selectedContact ? (
              <div className="flex h-full flex-col">
                <div className="border-b border-zinc-200 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-sm font-semibold text-white shrink-0">
                          {(selectedBusiness.businessName || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-base font-semibold text-zinc-900">{selectedBusiness.businessName}</div>
                          <div className="text-xs text-zinc-500">{selectedBusiness.contacts.length} contact{selectedBusiness.contacts.length !== 1 ? "s" : ""}</div>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={`h-7 w-7 shrink-0 text-zinc-400 hover:text-zinc-900 ${buttonFeedbackClass}`}
                      onClick={() => setIsSidebarOpen(false)}
                      aria-label="Close contact intelligence sidebar"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <StatusBadge status={selectedBusiness.dominantStatus} />
                    <ScoreBadge score={selectedBusiness.maxLeadScore} />
                    {selectedBusiness.dealCount > 0 && (
                      <span className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-xs text-zinc-600">
                        {selectedBusiness.dealCount} deal{selectedBusiness.dealCount !== 1 ? "s" : ""} · {formatCurrency(selectedBusiness.pipelineValue)}
                      </span>
                    )}
                  </div>

                  {selectedBusiness.contacts.length > 1 ? (
                    <div className="mt-3 min-w-0">
                      <Select value={selectedContact.id} onValueChange={(id) => setSelectedContactId(id)}>
                        <SelectTrigger className="h-9 text-sm w-full truncate">
                          <SelectValue placeholder="Select contact" />
                        </SelectTrigger>
                        <SelectContent className="max-w-[var(--radix-select-trigger-width)]">
                          {selectedBusiness.contacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id}>
                              <span className="truncate">{contact.full_name || "Unnamed"}{contact.job_title ? ` · ${contact.job_title}` : ""}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}

                  <div className="mt-3 flex gap-1">
                    {(["sales", "reviews", "outreach"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === tab ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"}`}
                      >
                        {tab === "sales" ? "Sales" : tab === "reviews" ? "Reviews" : "Outreach"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-full overflow-y-auto p-4 pb-10 space-y-4">
                  {activeTab === "sales" ? (
                    <>
                      <div className="rounded-lg border border-zinc-200 p-3">
                        <div className="text-xs uppercase tracking-wide text-zinc-500">Summary</div>
                        <p className="mt-2 text-sm text-zinc-700 leading-6">
                          {selectedContact.notes || selectedContact.company_description || selectedContact.use_case || <span className="italic text-zinc-400">Run discovery to generate a summary.</span>}
                        </p>
                      </div>

                      {salesApproaches.length > 0 ? (
                        <div className="grid gap-2">
                          {salesApproaches.map((approach) => (
                            <div key={approach.key} className="rounded-lg border border-zinc-200 p-3">
                              <div className="text-sm font-medium text-zinc-900">{approach.title}</div>
                              <p className="mt-1 text-sm text-zinc-600">{approach.body}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-zinc-200 p-4 text-center text-sm text-zinc-400 italic">
                          Run discovery to generate sales approaches.
                        </div>
                      )}

                      <div className="rounded-lg border border-zinc-200 p-3">
                        <div className="text-xs uppercase tracking-wide text-zinc-500">Pipeline context</div>
                        <div className="mt-2 text-sm text-zinc-700">{selectedDeals.length} active deal(s)</div>
                        <div className="text-sm text-zinc-700">Potential value: {formatCurrency(selectedDeals.reduce((sum, deal) => sum + (deal.deal_value || 0), 0))}</div>
                      </div>
                    </>
                  ) : null}

                  {activeTab === "reviews" ? (
                    <>
                      <div className="rounded-lg border border-zinc-200 p-3">
                        <div className="text-xs uppercase tracking-wide text-zinc-500">Pain points match</div>
                        {reviewPainPoints.length > 0 ? (
                          <ul className="mt-2 space-y-1.5 text-sm text-zinc-700">
                            {reviewPainPoints.map((point, index) => (
                              <li key={`${point}-${index}`} className="flex items-start gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-zinc-400" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-zinc-400 italic">No pain points identified yet.</p>
                        )}
                      </div>

                      <div className="rounded-lg border border-zinc-200 p-3">
                        <div className="text-xs uppercase tracking-wide text-zinc-500">Strengths</div>
                        {strengths.length > 0 ? (
                          <ul className="mt-2 space-y-1.5 text-sm text-zinc-700">
                            {strengths.map((item, index) => (
                              <li key={`${item}-${index}`} className="flex items-start gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-zinc-400 italic">No strengths detected yet.</p>
                        )}
                      </div>
                    </>
                  ) : null}

                  {activeTab === "outreach" ? (
                    <>
                      <div className="rounded-lg border border-zinc-200 p-3 space-y-3">
                        <div className="text-xs uppercase tracking-wide text-zinc-500">Channel</div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setOutreachChannel("email")}
                            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors active:scale-[0.98] ${
                              outreachChannel === "email"
                                ? "border-zinc-900 bg-zinc-900 text-white"
                                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                            }`}
                          >
                            <Mail className="h-3.5 w-3.5" /> Email
                          </button>
                          <button
                            onClick={() => setOutreachChannel("sms")}
                            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors active:scale-[0.98] ${
                              outreachChannel === "sms"
                                ? "border-zinc-900 bg-zinc-900 text-white"
                                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                            }`}
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> SMS
                          </button>
                          <button
                            onClick={() => setOutreachChannel("linkedin")}
                            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors active:scale-[0.98] ${
                              outreachChannel === "linkedin"
                                ? "border-zinc-900 bg-zinc-900 text-white"
                                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                            }`}
                          >
                            <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                          </button>
                        </div>
                      </div>

                      <div className="rounded-lg border border-zinc-200 p-3 space-y-3">
                        <div className="text-xs uppercase tracking-wide text-zinc-500">Approach style</div>
                        <div className="flex flex-wrap gap-1.5">
                          <button onClick={() => setOutreachStyle("roi")} className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors active:scale-[0.98] ${outreachStyle === "roi" ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}>ROI</button>
                          <button onClick={() => setOutreachStyle("pain")} className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors active:scale-[0.98] ${outreachStyle === "pain" ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}>Pain points</button>
                          <button onClick={() => setOutreachStyle("visibility")} className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors active:scale-[0.98] ${outreachStyle === "visibility" ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}>Visibility gap</button>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          className={`bg-zinc-900 text-white hover:bg-zinc-800 ${buttonFeedbackClass}`}
                          onClick={() => generateAIDraft()}
                          disabled={isGeneratingDraft}
                        >
                          {isGeneratingDraft ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                          {isGeneratingDraft ? "Generating..." : "Generate with AI"}
                        </Button>
                      </div>

                      {(aiDraft || isGeneratingDraft) && (
                        <div className="rounded-lg border border-zinc-200 p-3">
                          <div className="flex items-center justify-between">
                            <div className="text-xs uppercase tracking-wide text-zinc-500">
                              {outreachChannel === "email" ? "Email draft" : outreachChannel === "sms" ? "SMS draft" : "LinkedIn message"}
                            </div>
                            {aiDraft && (
                              <button
                                onClick={() => generateAIDraft()}
                                className="text-xs text-zinc-500 hover:text-zinc-700 flex items-center gap-1"
                                disabled={isGeneratingDraft}
                              >
                                <RefreshCw className={`h-3 w-3 ${isGeneratingDraft ? "animate-spin" : ""}`} /> Regenerate
                              </button>
                            )}
                          </div>
                          {isGeneratingDraft ? (
                            <div className="mt-3 flex items-center gap-2 py-8 justify-center text-sm text-zinc-500">
                              <Loader2 className="h-4 w-4 animate-spin" /> Writing personalized message...
                            </div>
                          ) : (
                            <>
                              <textarea
                                className="mt-2 w-full min-h-[200px] rounded-md border border-zinc-200 p-3 text-sm text-zinc-700 resize-y"
                                value={aiDraft}
                                onChange={(e) => setAiDraft(e.target.value)}
                              />
                              <div className="mt-3 flex gap-2">
                                <Button size="sm" className={`bg-zinc-900 text-white hover:bg-zinc-800 ${buttonFeedbackClass}`} onClick={handleCopyDraft}>
                                  {copiedDraft ? <Check className="mr-2 h-4 w-4" /> : outreachChannel === "email" ? <Mail className="mr-2 h-4 w-4" /> : outreachChannel === "sms" ? <MessageSquare className="mr-2 h-4 w-4" /> : <Linkedin className="mr-2 h-4 w-4" />}
                                  {copiedDraft ? "Copied" : "Copy draft"}
                                </Button>
                                {outreachChannel === "email" && selectedContact?.email ? (
                                  <Button size="sm" className={buttonFeedbackClass} variant="outline" onClick={() => window.open(`mailto:${selectedContact.email}`)}>
                                    <Send className="mr-2 h-4 w-4" /> Open in email
                                  </Button>
                                ) : null}
                                {outreachChannel === "sms" && selectedContact?.phone ? (
                                  <Button size="sm" className={buttonFeedbackClass} variant="outline" onClick={() => window.open(`sms:${selectedContact.phone}`)}>
                                    <Send className="mr-2 h-4 w-4" /> Open SMS
                                  </Button>
                                ) : null}
                                {outreachChannel === "linkedin" && selectedContact?.linkedin_url ? (
                                  <Button size="sm" className={buttonFeedbackClass} variant="outline" onClick={() => window.open(selectedContact.linkedin_url!, "_blank")}>
                                    <Send className="mr-2 h-4 w-4" /> Open LinkedIn
                                  </Button>
                                ) : null}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  ) : null}

                  <div className="rounded-lg border border-zinc-200 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-zinc-500">{selectedContact.full_name || "Contact"}</div>
                      {selectedContact.job_title && <div className="text-xs text-zinc-400">{selectedContact.job_title}</div>}
                    </div>
                    <div className="mt-2 space-y-1.5 text-sm">
                      {selectedContact.company_domain ? (
                        <a href={`https://${selectedContact.company_domain}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors">
                          <Globe className="h-3.5 w-3.5 text-zinc-400" /> <span className="truncate">{selectedContact.company_domain}</span>
                        </a>
                      ) : null}
                      {selectedContact.email ? (
                        <a href={`mailto:${selectedContact.email}`} className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors">
                          <Mail className="h-3.5 w-3.5 text-zinc-400" /> <span className="truncate">{selectedContact.email}</span>
                        </a>
                      ) : null}
                      {selectedContact.phone ? (
                        <a href={`tel:${selectedContact.phone}`} className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors">
                          <Phone className="h-3.5 w-3.5 text-zinc-400" /> {selectedContact.phone}
                        </a>
                      ) : null}
                      {selectedContact.linkedin_url ? (
                        <a href={selectedContact.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors">
                          <Linkedin className="h-3.5 w-3.5 text-zinc-400" /> LinkedIn profile
                        </a>
                      ) : null}
                      {(selectedContact.company_city || selectedContact.company_country) ? (
                        <div className="flex items-center gap-2 text-zinc-600">
                          <MapPin className="h-3.5 w-3.5 text-zinc-400" /> {[selectedContact.company_city, selectedContact.company_country].filter(Boolean).join(", ")}
                        </div>
                      ) : null}
                      {selectedContact.company_address ? (
                        <div className="flex items-start gap-2 text-zinc-500 text-xs">
                          <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" /> <span className="line-clamp-2">{selectedContact.company_address}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Social links */}
                  {selectedContact.research_data?.social_links && Object.values(selectedContact.research_data.social_links).some(Boolean) && (
                    <div className="rounded-lg border border-zinc-200 p-3">
                      <div className="text-xs font-medium text-zinc-500 mb-2">Social media</div>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(selectedContact.research_data.social_links).map(([platform, url]) => url ? (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-colors capitalize"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {platform}
                          </a>
                        ) : null)}
                      </div>
                    </div>
                  )}

                  {/* Key contacts / people */}
                  {selectedContact.research_data?.key_contacts && selectedContact.research_data.key_contacts.length > 0 && (
                    <div className="rounded-lg border border-zinc-200 p-3">
                      <div className="text-xs font-medium text-zinc-500 mb-2 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        Key people ({selectedContact.research_data.key_contacts.length})
                      </div>
                      <div className="space-y-2">
                        {selectedContact.research_data.key_contacts.map((person, i) => (
                          <div key={`${person.name}-${i}`} className="rounded-md border border-zinc-100 bg-zinc-50/50 p-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-medium text-sm text-zinc-900 truncate">{person.name}</div>
                              {person.linkedin && (
                                <a href={person.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 shrink-0">
                                  <Linkedin className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                            <div className="text-xs text-zinc-500 mt-0.5">{person.title}</div>
                            {person.email && (
                              <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <a href={`mailto:${person.email}`} className="truncate hover:underline">{person.email}</a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Business type */}
                  {selectedContact.research_data?.business_type && (
                    <div className="rounded-lg border border-zinc-200 p-3">
                      <div className="text-xs font-medium text-zinc-500">Business type</div>
                      <div className="mt-1 text-sm text-zinc-700">{selectedContact.research_data.business_type}</div>
                    </div>
                  )}

                  <div className="rounded-lg border border-zinc-200 p-3">
                    <div className="text-xs font-medium text-zinc-500 mb-2">Actions</div>
                    <div className="flex items-center gap-1">
                      <button
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs text-zinc-600 hover:bg-blue-50 hover:text-blue-600 transition-colors ${buttonFeedbackClass}`}
                        onClick={() => onUpdateStatus(selectedContact.id, "contacted")}
                        title="Mark contacted"
                      >
                        <Check className="h-3.5 w-3.5" /> Contacted
                      </button>
                      <button
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs text-zinc-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors ${buttonFeedbackClass}`}
                        onClick={() => onUpdateContactType(selectedContact.id, "lead")}
                        title="Mark as lead"
                      >
                        <UserCheck className="h-3.5 w-3.5" /> Lead
                      </button>
                      <button
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs text-zinc-600 hover:bg-amber-50 hover:text-amber-600 transition-colors ${buttonFeedbackClass}`}
                        onClick={() => onQuickDeal(selectedContact)}
                        title="Quick deal"
                      >
                        <Briefcase className="h-3.5 w-3.5" /> Deal
                      </button>
                      <button
                        className={`flex items-center justify-center rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors ${buttonFeedbackClass}`}
                        onClick={() => onDeleteContact(selectedContact.id)}
                        title="Delete contact"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <EmptyState
                  title="Pick a contact"
                  description="Select a row to open Sales Intelligence, Reviews, and Email workflows."
                />
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}