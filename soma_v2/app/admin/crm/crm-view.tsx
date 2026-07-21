"use client"

import { useEffect, useMemo, useRef, useState, useTransition, useCallback } from "react"
import {
  BadgeDollarSign,
  Briefcase,
  Building2,
  Car,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  Globe,
  GraduationCap,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Send,
  ShoppingCart,
  Sparkles,
  Star,
  Stethoscope,
  TrendingDown,
  Users,
  Utensils,
  Zap,
} from "lucide-react"
import { AdminShell } from "../components/admin-shell"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/layout/notification-toast"
import type { CRMContact, CRMDeal, CRMCampaign, CRMTemplate, CRMResearchRecord, DashboardData } from "./components/crm-shared"
import { STAGES, Field } from "./components/crm-shared"
import { CRMContacts } from "./components/crm-contacts"
import { CRMPipeline } from "./components/crm-pipeline"
import { CRMCampaigns } from "./components/crm-campaigns"
import { CRMResearch, type DiscoveryLead } from "./components/crm-research"
import { CRMTemplates } from "./components/crm-templates"

type CRMSection = "discovery" | "contacts" | "pipeline" | "campaigns" | "templates"

const CRM_NAV: { id: CRMSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "discovery", label: "Search", icon: Sparkles },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "pipeline", label: "Pipeline", icon: BadgeDollarSign },
  { id: "campaigns", label: "Campaigns", icon: Send },
  { id: "templates", label: "Templates", icon: FileText },
]

interface CRMViewProps {
  userEmail?: string
}

// NOTE: Types are imported from crm-shared.tsx — CRMContact, CRMDeal, etc.

export function CRMView({ userEmail }: CRMViewProps) {
  const { addToast, ToastContainer } = useToast()
  const [activeSection, setActiveSection] = useState<CRMSection>("discovery")
  const [searchQuery, setSearchQuery] = useState("")
  const [contactStatusFilter, setContactStatusFilter] = useState<string>("all")
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [contacts, setContacts] = useState<CRMContact[]>([])
  const [deals, setDeals] = useState<CRMDeal[]>([])
  const [campaigns, setCampaigns] = useState<CRMCampaign[]>([])
  const [templates, setTemplates] = useState<CRMTemplate[]>([])
  const [research, setResearch] = useState<CRMResearchRecord[]>([])
  const [isPending, startTransition] = useTransition()
  const [syncing, setSyncing] = useState(false)
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [dealDialogOpen, setDealDialogOpen] = useState(false)
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [researchDialogOpen, setResearchDialogOpen] = useState(false)
  const [isResearching, setIsResearching] = useState(false)
  const [sendingCampaignId, setSendingCampaignId] = useState<string | null>(null)
  const [isCRMNavCollapsed, setIsCRMNavCollapsed] = useState(false)

  const [contactForm, setContactForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    job_title: "",
    company_name: "",
    company_domain: "",
    company_industry: "",
    company_country: "",
    contact_type: "prospect",
    lead_source: "manual",
    lead_status: "new",
    notes: "",
  })
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    description: "",
    campaign_type: "email",
    subject: "",
    body_html: "",
    body_text: "",
    target_segments: { contact_type: "prospect", min_score: 40 },
  })
  const [dealForm, setDealForm] = useState({
    contact_id: "",
    deal_name: "",
    deal_value: 299,
    stage: "discovery",
    probability: 20,
    plan_interest: "growth",
    expected_close_date: "",
    notes: "",
  })
  const [templateForm, setTemplateForm] = useState({
    name: "",
    category: "marketing",
    subject: "",
    body_html: "",
    body_text: "",
    variables: "name,company,email",
  })
  const [researchForm, setResearchForm] = useState({
    query: "",
    industry: "",
    location: "",
    researchType: "company",
  })
  const [lastResearchResults, setLastResearchResults] = useState<any[]>([])
  const [focusedContactId, setFocusedContactId] = useState<string | null>(null)
  const [openContactsSidebarSignal, setOpenContactsSidebarSignal] = useState(0)

  const discoverySuggestions = [
    { icon: Building2, query: "Property management companies with poor Google reviews", label: "Poor reviews", description: "Find businesses with low ratings to pitch reputation management", industry: "Real Estate & Property Management", location: "" },
    { icon: Zap, query: "B2B SaaS with weak AI search visibility", label: "Weak AI visibility", description: "Companies invisible to ChatGPT, Gemini, and Perplexity", industry: "SaaS & Technology", location: "" },
    { icon: Star, query: "Agencies with strong reviews but low AI mentions", label: "Untapped potential", description: "Great reputation but missing from AI-generated answers", industry: "Marketing & Advertising", location: "" },
    { icon: Stethoscope, query: "Clinics with outdated website content", label: "Outdated content", description: "Healthcare providers with stale websites hurting their rankings", industry: "Healthcare & Medical", location: "" },
    { icon: Scale, query: "Law firms without structured data or FAQ pages", label: "Missing SEO basics", description: "Legal practices not optimized for modern search", industry: "Legal Services", location: "" },
    { icon: Utensils, query: "Restaurants with poor local SEO in major cities", label: "Local SEO gaps", description: "Food businesses losing to competitors in local AI results", industry: "Restaurants & Food Service", location: "" },
    { icon: GraduationCap, query: "Private schools and tutoring centers without AI presence", label: "Education gaps", description: "Educational institutions missing from AI recommendation engines", industry: "Education & Training", location: "" },
    { icon: Car, query: "Auto dealerships with no Google Business optimization", label: "Auto dealers", description: "Car dealerships with weak local search and review presence", industry: "Automotive", location: "" },
    { icon: ShoppingCart, query: "eCommerce brands losing to Amazon in AI search answers", label: "eCommerce visibility", description: "Online stores invisible when AI recommends products", industry: "eCommerce & Retail", location: "" },
    { icon: Briefcase, query: "Consulting firms with no thought leadership content", label: "Consulting gap", description: "Professional services with no blog, no FAQ, no AI footprint", industry: "Consulting & Professional Services", location: "" },
    { icon: Globe, query: "Insurance companies with poor online comparison presence", label: "Insurance SEO", description: "Insurance providers losing leads to comparison aggregators", industry: "Insurance & Financial Services", location: "" },
    { icon: MapPin, query: "Dental practices with limited local search presence", label: "Dental SEO", description: "Dental clinics losing patients to better-ranked competitors", industry: "Dental & Orthodontics", location: "" },
  ]
  const [showAdvancedFields, setShowAdvancedFields] = useState(false)
  const [locationResults, setLocationResults] = useState<{ display_name: string; place_id: number }[]>([])
  const [locationSearching, setLocationSearching] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const locationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const INDUSTRY_OPTIONS = [
    "Accounting & Tax",
    "Architecture & Design",
    "Automotive",
    "Beauty & Spa",
    "Consulting & Professional Services",
    "Construction & Contracting",
    "Dental & Orthodontics",
    "eCommerce & Retail",
    "Education & Training",
    "Energy & Utilities",
    "Entertainment & Events",
    "Financial Services & Banking",
    "Fitness & Wellness",
    "Healthcare & Medical",
    "Home Services & Maintenance",
    "Hospitality & Hotels",
    "Insurance & Financial Services",
    "Legal Services",
    "Logistics & Supply Chain",
    "Manufacturing",
    "Marketing & Advertising",
    "Nonprofit & NGO",
    "Pharmaceutical",
    "Real Estate & Property Management",
    "Restaurants & Food Service",
    "SaaS & Technology",
    "Staffing & Recruitment",
    "Telecommunications",
    "Travel & Tourism",
    "Veterinary & Pet Services",
  ]

  const searchLocations = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setLocationResults([])
      setShowLocationDropdown(false)
      return
    }
    setLocationSearching(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`)
      const data = await res.json()
      setLocationResults(data.map((item: any) => ({ display_name: item.display_name, place_id: item.place_id })))
      setShowLocationDropdown(true)
    } catch {
      setLocationResults([])
    } finally {
      setLocationSearching(false)
    }
  }, [])

  useEffect(() => {
    refreshAll()
  }, [])

  const filteredContacts = useMemo(() => {
    let list = contacts
    if (contactStatusFilter !== "all") {
      list = list.filter((c) => c.lead_status === contactStatusFilter)
    }
    if (!searchQuery.trim()) return list
    const query = searchQuery.toLowerCase()
    return list.filter((contact) =>
      [
        contact.full_name,
        contact.email,
        contact.phone,
        contact.company_name,
        contact.company_domain,
        contact.job_title,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    )
  }, [contacts, searchQuery, contactStatusFilter])

  const filteredResearch = useMemo(() => {
    if (!searchQuery.trim()) return research
    const query = searchQuery.toLowerCase()
    return research.filter((item) =>
      [item.company_name, item.domain, item.description, item.contact?.company_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    )
  }, [research, searchQuery])

  const refreshAll = () => {
    startTransition(async () => {
      try {
        const [dashboardRes, contactsRes, dealsRes, campaignsRes, templatesRes, researchRes] = await Promise.all([
          fetch("/api/admin/crm/dashboard", { cache: "no-store" }),
          fetch("/api/admin/crm/contacts?limit=200", { cache: "no-store" }),
          fetch("/api/admin/crm/deals", { cache: "no-store" }),
          fetch("/api/admin/crm/campaigns", { cache: "no-store" }),
          fetch("/api/admin/crm/templates", { cache: "no-store" }),
          fetch("/api/admin/crm/research", { cache: "no-store" }),
        ])

        const [dashboardJson, contactsJson, dealsJson, campaignsJson, templatesJson, researchJson] = await Promise.all([
          dashboardRes.json(),
          contactsRes.json(),
          dealsRes.json(),
          campaignsRes.json(),
          templatesRes.json(),
          researchRes.json(),
        ])

        if (!dashboardRes.ok) throw new Error(dashboardJson.error || "Failed to load CRM dashboard")
        if (!contactsRes.ok) throw new Error(contactsJson.error || "Failed to load contacts")
        if (!dealsRes.ok) throw new Error(dealsJson.error || "Failed to load deals")
        if (!campaignsRes.ok) throw new Error(campaignsJson.error || "Failed to load campaigns")
        if (!templatesRes.ok) throw new Error(templatesJson.error || "Failed to load templates")
        if (!researchRes.ok) throw new Error(researchJson.error || "Failed to load research")

        setDashboard(dashboardJson)
        setContacts(contactsJson.data || [])
        setDeals(dealsJson.data || [])
        setCampaigns(campaignsJson.data || [])
        setTemplates(templatesJson.data || [])
        setResearch(researchJson.data || [])
      } catch (error) {
        addToast({
          type: "error",
          title: "CRM load failed",
          message: error instanceof Error ? error.message : "Unable to load CRM data.",
        })
      }
    })
  }

  const syncAccounts = async () => {
    setSyncing(true)
    try {
      const response = await fetch("/api/admin/crm/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_accounts" }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Sync failed")
      addToast({
        type: "success",
        title: "CRM synced",
        message: `${result.synced} accounts were synchronized into CRM contacts.`,
      })
      refreshAll()
    } catch (error) {
      addToast({
        type: "error",
        title: "Sync failed",
        message: error instanceof Error ? error.message : "Unable to sync accounts.",
      })
    } finally {
      setSyncing(false)
    }
  }

  const createContact = async () => {
    try {
      const response = await fetch("/api/admin/crm/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to create contact")
      addToast({ type: "success", title: "Contact created", message: "The contact is now in the CRM." })
      setContactDialogOpen(false)
      setContactForm({
        full_name: "",
        email: "",
        phone: "",
        job_title: "",
        company_name: "",
        company_domain: "",
        company_industry: "",
        company_country: "",
        contact_type: "prospect",
        lead_source: "manual",
        lead_status: "new",
        notes: "",
      })
      refreshAll()
    } catch (error) {
      addToast({
        type: "error",
        title: "Create failed",
        message: error instanceof Error ? error.message : "Unable to create contact.",
      })
    }
  }

  const createCampaign = async () => {
    try {
      const response = await fetch("/api/admin/crm/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaignForm),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to create campaign")
      addToast({ type: "success", title: "Campaign created", message: "The campaign is ready for review or sending." })
      setCampaignDialogOpen(false)
      setCampaignForm({
        name: "",
        description: "",
        campaign_type: "email",
        subject: "",
        body_html: "",
        body_text: "",
        target_segments: { contact_type: "prospect", min_score: 40 },
      })
      refreshAll()
    } catch (error) {
      addToast({
        type: "error",
        title: "Campaign failed",
        message: error instanceof Error ? error.message : "Unable to create campaign.",
      })
    }
  }

  const createDeal = async () => {
    try {
      const response = await fetch("/api/admin/crm/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...dealForm,
          contact_id: dealForm.contact_id || null,
          expected_close_date: dealForm.expected_close_date || null,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to create deal")
      addToast({ type: "success", title: "Deal created", message: "The opportunity is now in the pipeline." })
      setDealDialogOpen(false)
      setDealForm({
        contact_id: "",
        deal_name: "",
        deal_value: 299,
        stage: "discovery",
        probability: 20,
        plan_interest: "growth",
        expected_close_date: "",
        notes: "",
      })
      refreshAll()
    } catch (error) {
      addToast({
        type: "error",
        title: "Deal failed",
        message: error instanceof Error ? error.message : "Unable to create deal.",
      })
    }
  }

  const createTemplate = async () => {
    try {
      const response = await fetch("/api/admin/crm/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...templateForm,
          variables: templateForm.variables.split(",").map((item) => item.trim()).filter(Boolean),
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to create template")
      addToast({ type: "success", title: "Template created", message: "The outreach template is available for campaigns." })
      setTemplateDialogOpen(false)
      setTemplateForm({
        name: "",
        category: "marketing",
        subject: "",
        body_html: "",
        body_text: "",
        variables: "name,company,email",
      })
      refreshAll()
    } catch (error) {
      addToast({
        type: "error",
        title: "Template failed",
        message: error instanceof Error ? error.message : "Unable to create template.",
      })
    }
  }

  const runResearch = async () => {
    setResearchDialogOpen(false)
    setIsResearching(true)
    try {
      const response = await fetch("/api/admin/crm/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(researchForm),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Research failed")
      setLastResearchResults(result.prospects || [])
      const created = result.contactsCreated || 0
      const qualified = result.qualified || 0
      const totalFound = result.totalFound || 0
      if (result.debug) console.log("[CRM Research] Debug:", result.debug)
      addToast({
        type: created > 0 || qualified > 0 ? "success" : "warning",
        title: created > 0 ? "Research completed" : "No new prospects found",
        message: created > 0
          ? `Found ${totalFound} results → ${qualified} qualified → ${created} new CRM records created.`
          : totalFound > 0
            ? `Found ${totalFound} results and ${qualified} qualified, but all were already in CRM or below threshold.`
            : `No results from search engines. Try a different or more specific query.`,
      })
      refreshAll()
    } catch (error) {
      addToast({
        type: "error",
        title: "Research failed",
        message: error instanceof Error ? error.message : "Unable to complete research.",
      })
    } finally {
      setIsResearching(false)
    }
  }

  const sendCampaign = async (campaignId: string) => {
    setSendingCampaignId(campaignId)
    try {
      const response = await fetch("/api/admin/crm/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Send failed")
      addToast({
        type: "success",
        title: "Campaign sent",
        message: `${result.results.sent} messages sent. ${result.results.failed} failed.`,
      })
      refreshAll()
    } catch (error) {
      addToast({
        type: "error",
        title: "Campaign send failed",
        message: error instanceof Error ? error.message : "Unable to send campaign.",
      })
    } finally {
      setSendingCampaignId(null)
    }
  }

  const updateContactStatus = async (contactId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/admin/crm/contacts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contactId, lead_status: newStatus }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Update failed")
      setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, lead_status: newStatus } : c)))
      addToast({ type: "success", title: "Status updated", message: `Contact moved to ${newStatus}.` })
    } catch (error) {
      addToast({
        type: "error",
        title: "Update failed",
        message: error instanceof Error ? error.message : "Unable to update status.",
      })
    }
  }

  const updateContactType = async (contactId: string, newType: string) => {
    try {
      const response = await fetch("/api/admin/crm/contacts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contactId, contact_type: newType }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Update failed")
      setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, contact_type: newType } : c)))
      addToast({ type: "success", title: "Type updated", message: `Contact type updated to ${newType}.` })
    } catch (error) {
      addToast({
        type: "error",
        title: "Update failed",
        message: error instanceof Error ? error.message : "Unable to update contact type.",
      })
    }
  }

  const deleteContact = async (contactId: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return
    try {
      const response = await fetch(`/api/admin/crm/contacts?id=${contactId}`, { method: "DELETE" })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Delete failed")
      setContacts((prev) => prev.filter((c) => c.id !== contactId))
      addToast({ type: "success", title: "Contact deleted", message: "The contact has been removed." })
    } catch (error) {
      addToast({
        type: "error",
        title: "Delete failed",
        message: error instanceof Error ? error.message : "Unable to delete contact.",
      })
    }
  }

  const deleteBusiness = async (businessName: string, contactIds: string[]) => {
    if (!contactIds.length) return

    const confirmed = confirm(`Delete ${businessName} and ${contactIds.length} contact record(s)? This cannot be undone.`)
    if (!confirmed) return

    try {
      const results = await Promise.allSettled(
        contactIds.map(async (id) => {
          const response = await fetch(`/api/admin/crm/contacts?id=${id}`, { method: "DELETE" })
          const result = await response.json()
          if (!response.ok) throw new Error(result.error || `Delete failed for ${id}`)
          return id
        })
      )

      const deletedIds = results
        .filter((result): result is PromiseFulfilledResult<string> => result.status === "fulfilled")
        .map((result) => result.value)

      const failedCount = results.length - deletedIds.length

      if (deletedIds.length > 0) {
        setContacts((prev) => prev.filter((contact) => !deletedIds.includes(contact.id)))
      }

      if (failedCount === 0) {
        addToast({
          type: "success",
          title: "Business deleted",
          message: `${businessName} and ${deletedIds.length} contact(s) were removed.`,
        })
      } else {
        addToast({
          type: "warning",
          title: "Partial delete",
          message: `${deletedIds.length} removed, ${failedCount} failed.`,
        })
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Delete failed",
        message: error instanceof Error ? error.message : "Unable to delete business contacts.",
      })
    }
  }

  const keepLead = async (lead: DiscoveryLead) => {
    // "Keep" marks the contact as a qualified lead
    if (lead.contactId) {
      try {
        await fetch("/api/admin/crm/contacts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: lead.contactId, lead_status: "qualified", contact_type: "lead" }),
        })
        setContacts((prev) => prev.map((c) => (c.id === lead.contactId ? { ...c, lead_status: "qualified", contact_type: "lead" } : c)))
        // Remove from discovery list
        setLastResearchResults((prev) => prev.filter((r) =>
          (r.domain || r.company_name) !== lead.domain && (r.company_name || r.domain) !== lead.companyName
        ))
        addToast({ type: "success", title: "Lead kept", message: `${lead.companyName} marked as qualified lead.` })
      } catch {
        addToast({ type: "error", title: "Update failed", message: "Unable to update lead status." })
      }
    } else {
      // No contact exists yet — create one from the lead data
      try {
        const res = await fetch("/api/admin/crm/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: lead.companyName,
            company_name: lead.companyName,
            company_domain: lead.domain !== "No domain" ? lead.domain : null,
            company_address: lead.locationAddress || null,
            company_country: lead.location !== "Unknown location" ? lead.location : null,
            company_latitude: lead.latitude || null,
            company_longitude: lead.longitude || null,
            company_description: lead.description || null,
            email: lead.email || null,
            phone: lead.phone || null,
            contact_type: "lead",
            lead_source: "research",
            lead_status: "qualified",
            lead_score: lead.fitScore || 0,
            tags: ["ai-researched"],
            research_data: {
              social_links: lead.socialLinks || {},
              business_type: lead.businessType || null,
              key_contacts: lead.keyContacts || [],
            },
          }),
        })
        if (!res.ok) throw new Error("Failed to create contact")
        // Remove from discovery list
        setLastResearchResults((prev) => prev.filter((r) =>
          (r.domain || r.company_name) !== lead.domain && (r.company_name || r.domain) !== lead.companyName
        ))
        addToast({ type: "success", title: "Lead kept", message: `${lead.companyName} added as a qualified lead.` })
        refreshAll()
      } catch {
        addToast({ type: "error", title: "Save failed", message: "Unable to create contact for this lead." })
      }
    }
  }

  const rejectLead = async (lead: DiscoveryLead) => {
    // Find matching research record to delete
    const researchRecord = research.find((r) =>
      r.domain === lead.domain || r.company_name === lead.companyName
    )

    try {
      // Delete research record and associated contacts via API
      if (researchRecord) {
        const res = await fetch(`/api/admin/crm/research?id=${researchRecord.id}&removeContacts=true`, { method: "DELETE" })
        if (!res.ok) throw new Error("Failed to delete research record")
        setResearch((prev) => prev.filter((r) => r.id !== researchRecord.id))
      }

      // Also remove from contacts list if contact exists
      if (lead.contactId) {
        await fetch(`/api/admin/crm/contacts?id=${lead.contactId}`, { method: "DELETE" })
        setContacts((prev) => prev.filter((c) => c.id !== lead.contactId))
      } else if (lead.domain && lead.domain !== "No domain") {
        // Remove all contacts with this domain from local state
        setContacts((prev) => prev.filter((c) => c.company_domain?.toLowerCase() !== lead.domain.toLowerCase()))
      }

      // Remove from fresh results
      setLastResearchResults((prev) => prev.filter((r) =>
        (r.domain || r.company_name) !== lead.domain && (r.company_name || r.domain) !== lead.companyName
      ))

      addToast({ type: "success", title: "Lead rejected", message: `${lead.companyName} and associated records removed.` })
    } catch (error) {
      addToast({
        type: "error",
        title: "Reject failed",
        message: error instanceof Error ? error.message : "Unable to remove lead.",
      })
    }
  }

  const updateDealStage = async (dealId: string, newStage: string, contactId?: string | null) => {
    try {
      const response = await fetch("/api/admin/crm/deals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: dealId, stage: newStage, contact_id: contactId }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Update failed")
      setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)))
      addToast({ type: "success", title: "Deal updated", message: `Moved to ${newStage.replaceAll("_", " ")}.` })
      refreshAll() // refreshing because dashboard needs to update pipeline
    } catch (error) {
      addToast({
        type: "error",
        title: "Update failed",
        message: error instanceof Error ? error.message : "Unable to update deal stage.",
      })
    }
  }

  const deleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return
    try {
      const response = await fetch(`/api/admin/crm/templates?id=${templateId}`, { method: "DELETE" })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Delete failed")
      setTemplates((prev) => prev.filter((t) => t.id !== templateId))
      addToast({ type: "success", title: "Template deleted", message: "Template removed." })
    } catch (error) {
      addToast({
        type: "error",
        title: "Delete failed",
        message: error instanceof Error ? error.message : "Unable to delete template.",
      })
    }
  }

  const quickCreateDeal = (contact: CRMContact) => {
    setDealForm({
      contact_id: contact.id,
      deal_name: `${contact.company_name || contact.full_name || "New"} - Soma AI`,
      deal_value: contact.estimated_mrr ? contact.estimated_mrr * 12 : 299,
      stage: "discovery",
      probability: 20,
      plan_interest: "growth",
      expected_close_date: "",
      notes: "",
    })
    setDealDialogOpen(true)
  }

  const openLeadInContactIntelligence = (lead: { contactId?: string | null; companyName: string; domain: string }) => {
    const byId = lead.contactId ? contacts.find((contact) => contact.id === lead.contactId) : null
    const byDomain = lead.domain && lead.domain !== "No domain"
      ? contacts.find((contact) => contact.company_domain?.toLowerCase() === lead.domain.toLowerCase())
      : null
    const byCompany = !byDomain
      ? contacts.find((contact) => contact.company_name?.toLowerCase() === lead.companyName.toLowerCase())
      : null

    const matched = byId || byDomain || byCompany

    if (!matched) {
      addToast({
        type: "info",
        title: "No CRM contact yet",
        message: "Run discovery again or sync contacts first, then retry opening intelligence.",
      })
      return
    }

    setContactStatusFilter("all")
    setActiveSection("contacts")
    setFocusedContactId(matched.id)
    setOpenContactsSidebarSignal((prev) => prev + 1)
  }

  const stageCards = dashboard?.pipeline?.stages || {}

  const navBadges: Partial<Record<CRMSection, number>> = {
    contacts: contacts.length,
    pipeline: deals.length,
    campaigns: campaigns.length,
    discovery: research.length,
    templates: templates.length,
  }

  return (
    <>
      <AdminShell
        userEmail={userEmail}
        activeTab="crm"
        title={<h2 className="text-lg font-semibold text-zinc-900">Sales CRM</h2>}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={activeSection === "discovery" ? "Search companies or domains..." : "Search contacts, companies, or titles..."}
        headerActions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshAll} disabled={isPending}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={syncAccounts} disabled={syncing}>
              <Users className={`mr-2 h-4 w-4 ${syncing ? "animate-pulse" : ""}`} />
              Sync Signups
            </Button>
            <Button size="sm" className="bg-zinc-900 text-white hover:bg-zinc-800" onClick={() => setContactDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </div>
        }
      >
        <div className="flex gap-0 -m-6">
          {/* Vertical CRM nav */}
          <nav className={`${isCRMNavCollapsed ? "w-[68px]" : "w-52"} shrink-0 border-r border-zinc-200 bg-zinc-50/60 min-h-[calc(100vh-4rem)] transition-all duration-200`}>
            <div className="sticky top-0 p-3 space-y-1">
              <button
                onClick={() => setIsCRMNavCollapsed((prev) => !prev)}
                className="mb-2 flex w-full items-center justify-center rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50"
                aria-label={isCRMNavCollapsed ? "Expand CRM navigation" : "Collapse CRM navigation"}
              >
                {isCRMNavCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
              {CRM_NAV.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center ${isCRMNavCollapsed ? "justify-center" : "justify-between"} gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4" />
                      {!isCRMNavCollapsed ? item.label : null}
                    </span>
                    {!isCRMNavCollapsed && navBadges[item.id] ? (
                      <span className={`text-xs tabular-nums ${isActive ? "text-zinc-400" : "text-zinc-400"}`}>
                        {navBadges[item.id]}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </nav>

          {/* Content area */}
          <div className="flex-1 min-w-0 p-6 space-y-6">
            {activeSection === "contacts" && (
              <CRMContacts
                contacts={filteredContacts}
                allContacts={contacts}
                deals={deals}
                externalSelectedContactId={focusedContactId}
                openSidebarSignal={openContactsSidebarSignal}
                contactStatusFilter={contactStatusFilter}
                onStatusFilterChange={setContactStatusFilter}
                onUpdateStatus={updateContactStatus}
                onUpdateContactType={updateContactType}
                onQuickDeal={quickCreateDeal}
                onAddContact={() => setContactDialogOpen(true)}
                onDeleteContact={deleteContact}
                onDeleteBusiness={deleteBusiness}
              />
            )}
            {activeSection === "pipeline" && (
              <CRMPipeline
                deals={deals}
                stageCards={stageCards}
                totalWeightedPipeline={dashboard?.pipeline?.totalWeightedPipeline || 0}
                onAddDeal={() => setDealDialogOpen(true)}
                onUpdateDealStage={updateDealStage}
              />
            )}
            {activeSection === "campaigns" && (
              <CRMCampaigns
                campaigns={campaigns}
                templates={templates}
                dashboard={dashboard}
                sendingCampaignId={sendingCampaignId}
                onSendCampaign={sendCampaign}
                onAddCampaign={() => setCampaignDialogOpen(true)}
              />
            )}
            {activeSection === "discovery" && (
              <CRMResearch
                research={filteredResearch}
                contacts={contacts}
                lastResults={lastResearchResults}
                isResearching={isResearching}
                onRunResearch={() => setResearchDialogOpen(true)}
                onOpenContactIntelligence={openLeadInContactIntelligence}
                onKeepLead={keepLead}
                onRejectLead={rejectLead}
              />
            )}
            {activeSection === "templates" && (
              <CRMTemplates
                templates={templates}
                onAddTemplate={() => setTemplateDialogOpen(true)}
                onDeleteTemplate={deleteTemplate}
              />
            )}
          </div>
        </div>
      </AdminShell>

      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add CRM Contact</DialogTitle>
            <DialogDescription>Create a new reachable person or company record.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name"><Input value={contactForm.full_name} onChange={(e) => setContactForm((prev) => ({ ...prev, full_name: e.target.value }))} /></Field>
            <Field label="Job title"><Input value={contactForm.job_title} onChange={(e) => setContactForm((prev) => ({ ...prev, job_title: e.target.value }))} /></Field>
            <Field label="Email"><Input value={contactForm.email} onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))} /></Field>
            <Field label="Phone"><Input value={contactForm.phone} onChange={(e) => setContactForm((prev) => ({ ...prev, phone: e.target.value }))} /></Field>
            <Field label="Company"><Input value={contactForm.company_name} onChange={(e) => setContactForm((prev) => ({ ...prev, company_name: e.target.value }))} /></Field>
            <Field label="Company domain"><Input value={contactForm.company_domain} onChange={(e) => setContactForm((prev) => ({ ...prev, company_domain: e.target.value }))} /></Field>
            <Field label="Industry"><Input value={contactForm.company_industry} onChange={(e) => setContactForm((prev) => ({ ...prev, company_industry: e.target.value }))} /></Field>
            <Field label="Country"><Input value={contactForm.company_country} onChange={(e) => setContactForm((prev) => ({ ...prev, company_country: e.target.value }))} /></Field>
            <Field label="Record type">
              <Select value={contactForm.contact_type} onValueChange={(value) => setContactForm((prev) => ({ ...prev, contact_type: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Lead source">
              <Select value={contactForm.lead_source} onValueChange={(value) => setContactForm((prev) => ({ ...prev, lead_source: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="signup">Signup</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="free_audit">Free audit</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Notes"><Textarea value={contactForm.notes} onChange={(e) => setContactForm((prev) => ({ ...prev, notes: e.target.value }))} rows={4} /></Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialogOpen(false)}>Cancel</Button>
            <Button className="bg-zinc-900 text-white hover:bg-zinc-800" onClick={createContact}>Create contact</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
            <DialogDescription>Design email or SMS outreach with segmentation.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Campaign name"><Input value={campaignForm.name} onChange={(e) => setCampaignForm((prev) => ({ ...prev, name: e.target.value }))} /></Field>
            <Field label="Channel">
              <Select value={campaignForm.campaign_type} onValueChange={(value) => setCampaignForm((prev) => ({ ...prev, campaign_type: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Description"><Input value={campaignForm.description} onChange={(e) => setCampaignForm((prev) => ({ ...prev, description: e.target.value }))} /></Field>
            </div>
            {campaignForm.campaign_type === "email" ? (
              <div className="md:col-span-2">
                <Field label="Subject"><Input value={campaignForm.subject} onChange={(e) => setCampaignForm((prev) => ({ ...prev, subject: e.target.value }))} /></Field>
              </div>
            ) : null}
            <Field label="Target type">
              <Select
                value={campaignForm.target_segments.contact_type}
                onValueChange={(value) => setCampaignForm((prev) => ({ ...prev, target_segments: { ...prev.target_segments, contact_type: value } }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospect">Prospects</SelectItem>
                  <SelectItem value="lead">Leads</SelectItem>
                  <SelectItem value="customer">Customers</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Minimum score">
              <Input
                type="number"
                value={campaignForm.target_segments.min_score}
                onChange={(e) => setCampaignForm((prev) => ({ ...prev, target_segments: { ...prev.target_segments, min_score: Number(e.target.value || 0) } }))}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label={campaignForm.campaign_type === "email" ? "HTML body" : "Message body"}>
                <Textarea value={campaignForm.campaign_type === "email" ? campaignForm.body_html : campaignForm.body_text} onChange={(e) => setCampaignForm((prev) => ({ ...prev, [campaignForm.campaign_type === "email" ? "body_html" : "body_text"]: e.target.value }))} rows={10} />
              </Field>
            </div>
            {campaignForm.campaign_type === "email" ? (
              <div className="md:col-span-2">
                <Field label="Plain text fallback"><Textarea value={campaignForm.body_text} onChange={(e) => setCampaignForm((prev) => ({ ...prev, body_text: e.target.value }))} rows={5} /></Field>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCampaignDialogOpen(false)}>Cancel</Button>
            <Button className="bg-zinc-900 text-white hover:bg-zinc-800" onClick={createCampaign}>Create campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dealDialogOpen} onOpenChange={setDealDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Deal</DialogTitle>
            <DialogDescription>Move a reachable contact into the revenue pipeline.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="Linked contact">
                <Select value={dealForm.contact_id} onValueChange={(value) => setDealForm((prev) => ({ ...prev, contact_id: value }))}>
                  <SelectTrigger><SelectValue placeholder="Select a person or company" /></SelectTrigger>
                  <SelectContent>
                    {contacts.slice(0, 100).map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {(contact.full_name || contact.company_name || "Unnamed")} - {contact.company_name || contact.company_domain || contact.email || "CRM record"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Deal name"><Input value={dealForm.deal_name} onChange={(e) => setDealForm((prev) => ({ ...prev, deal_name: e.target.value }))} /></Field>
            <Field label="Deal value (USD)"><Input type="number" value={dealForm.deal_value} onChange={(e) => setDealForm((prev) => ({ ...prev, deal_value: Number(e.target.value || 0) }))} /></Field>
            <Field label="Stage">
              <Select value={dealForm.stage} onValueChange={(value) => setDealForm((prev) => ({ ...prev, stage: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>{stage.replaceAll("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Probability %"><Input type="number" value={dealForm.probability} onChange={(e) => setDealForm((prev) => ({ ...prev, probability: Number(e.target.value || 0) }))} /></Field>
            <Field label="Plan interest">
              <Select value={dealForm.plan_interest} onValueChange={(value) => setDealForm((prev) => ({ ...prev, plan_interest: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Expected close date"><Input type="date" value={dealForm.expected_close_date} onChange={(e) => setDealForm((prev) => ({ ...prev, expected_close_date: e.target.value }))} /></Field>
            <div className="md:col-span-2">
              <Field label="Notes"><Textarea value={dealForm.notes} onChange={(e) => setDealForm((prev) => ({ ...prev, notes: e.target.value }))} rows={5} /></Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDealDialogOpen(false)}>Cancel</Button>
            <Button className="bg-zinc-900 text-white hover:bg-zinc-800" onClick={createDeal}>Create deal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Template</DialogTitle>
            <DialogDescription>Store reusable sales and lifecycle messaging.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Template name"><Input value={templateForm.name} onChange={(e) => setTemplateForm((prev) => ({ ...prev, name: e.target.value }))} /></Field>
            <Field label="Category">
              <Select value={templateForm.category} onValueChange={(value) => setTemplateForm((prev) => ({ ...prev, category: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="promotional">Promotional</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="follow_up">Follow up</SelectItem>
                  <SelectItem value="win_back">Win back</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Subject"><Input value={templateForm.subject} onChange={(e) => setTemplateForm((prev) => ({ ...prev, subject: e.target.value }))} /></Field>
            </div>
            <div className="md:col-span-2">
              <Field label="HTML body"><Textarea value={templateForm.body_html} onChange={(e) => setTemplateForm((prev) => ({ ...prev, body_html: e.target.value }))} rows={10} /></Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Plain text"><Textarea value={templateForm.body_text} onChange={(e) => setTemplateForm((prev) => ({ ...prev, body_text: e.target.value }))} rows={5} /></Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Variables (comma-separated)"><Input value={templateForm.variables} onChange={(e) => setTemplateForm((prev) => ({ ...prev, variables: e.target.value }))} /></Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
            <Button className="bg-zinc-900 text-white hover:bg-zinc-800" onClick={createTemplate}>Create template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={researchDialogOpen} onOpenChange={(open) => { setResearchDialogOpen(open); if (!open) setShowAdvancedFields(false) }}>
        <DialogContent className="sm:max-w-2xl gap-0 p-0 overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl">Discovery Engine</DialogTitle>
              <DialogDescription>Describe the businesses you want to find — AI will scrape and qualify them.</DialogDescription>
            </DialogHeader>

            <div className="mt-5 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <Input
                className="pl-10 h-11 text-sm"
                placeholder="e.g. dental clinics in Atlanta with no AI search presence..."
                value={researchForm.query}
                onChange={(e) => setResearchForm((prev) => ({ ...prev, query: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter" && researchForm.query.trim() && !isResearching) runResearch() }}
                autoFocus
              />
            </div>

            <button
              onClick={() => setShowAdvancedFields(!showAdvancedFields)}
              className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAdvancedFields ? "rotate-180" : ""}`} />
              {showAdvancedFields ? "Hide filters" : "Add filters (industry, location, type)"}
            </button>

            {showAdvancedFields && (
              <div className="mt-3 grid gap-3 sm:grid-cols-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Industry</label>
                  <Select value={researchForm.industry} onValueChange={(value) => setResearchForm((prev) => ({ ...prev, industry: value }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select industry" /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {INDUSTRY_OPTIONS.map((ind) => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Location</label>
                  <div className="relative">
                    <Input
                      className="h-9 text-sm"
                      placeholder="Search city, state, country..."
                      value={researchForm.location}
                      onChange={(e) => {
                        const val = e.target.value
                        setResearchForm((prev) => ({ ...prev, location: val }))
                        if (locationTimeoutRef.current) clearTimeout(locationTimeoutRef.current)
                        locationTimeoutRef.current = setTimeout(() => searchLocations(val), 300)
                      }}
                      onFocus={() => { if (locationResults.length > 0) setShowLocationDropdown(true) }}
                      onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
                    />
                    {locationSearching && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-zinc-400" />}
                  </div>
                  {showLocationDropdown && locationResults.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border border-zinc-200 bg-white shadow-sm max-h-48 overflow-y-auto">
                      {locationResults.map((loc) => (
                        <button
                          key={loc.place_id}
                          className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 truncate"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setResearchForm((prev) => ({ ...prev, location: loc.display_name }))
                            setShowLocationDropdown(false)
                          }}
                        >
                          {loc.display_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Type</label>
                  <Select value={researchForm.researchType} onValueChange={(value) => setResearchForm((prev) => ({ ...prev, researchType: value }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="industry">Industry</SelectItem>
                      <SelectItem value="competitor">Competitor</SelectItem>
                      <SelectItem value="keyword">Keyword</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-zinc-100 bg-zinc-50/50 px-6 py-4">
            <div className="text-xs font-medium text-zinc-500 mb-3">Quick starts</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {discoverySuggestions.map((s) => {
                const Icon = s.icon
                const isActive = researchForm.query === s.query
                return (
                  <button
                    key={s.label}
                    onClick={() => {
                      setResearchForm((prev) => ({ ...prev, query: s.query, industry: s.industry, location: s.location }))
                      if (s.industry || s.location) setShowAdvancedFields(true)
                    }}
                    className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      isActive
                        ? "border-zinc-900 bg-zinc-900/5"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${isActive ? "text-zinc-900" : "text-zinc-400"}`} />
                    <div className="min-w-0">
                      <div className={`text-sm font-medium ${isActive ? "text-zinc-900" : "text-zinc-700"}`}>{s.label}</div>
                      <div className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{s.description}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="border-t border-zinc-200 px-6 py-3 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setResearchDialogOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              className="bg-zinc-900 text-white hover:bg-zinc-800 gap-2"
              onClick={runResearch}
              disabled={!researchForm.query.trim() || isResearching}
            >
              {isResearching ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Scanning...</> : <><Sparkles className="h-3.5 w-3.5" /> Run discovery</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ToastContainer />
    </>
  )
}

