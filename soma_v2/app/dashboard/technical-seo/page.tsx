"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { useBrand } from "@/lib/contexts/brand-context"
import { useToast } from "@/components/layout/notification-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import {
  Globe, Bot, FileCode, Loader2, CheckCircle, XCircle,
  AlertTriangle, Copy, Search, ArrowRight, Shield,
  Target, Zap, ChevronDown, ChevronRight, X,
  Lightbulb, BookOpen, Users, Link2, Building2,
  Sparkles, Wrench, BarChart3, RefreshCw, Check,
  ExternalLink, FileText, ShieldCheck, TrendingUp,
  Code2, ClipboardCopy, ArrowUpRight, Mail, PenLine,
  Send, MessageSquare, Newspaper, Award, Handshake,
  HelpCircle
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────────────

interface AuditCheck {
  id: string
  name: string
  status: "pass" | "warning" | "fail" | "unknown"
  score: number
  maxScore: number
  details: string
  recommendation?: string
  priority: "critical" | "high" | "medium" | "low"
  effort: "trivial" | "easy" | "moderate" | "complex"
  category: string
  metadata?: Record<string, unknown>
}

interface AuditPillar {
  id: string
  name: string
  score: number
  maxScore: number
  status: "pass" | "warning" | "fail" | "unknown"
  checks: AuditCheck[]
  description: string
}

interface AuditEvidence {
  crawledUrls: Array<{ url: string; status: "ok" | "error"; type: string }>
  serpResults: Array<{ url: string; title: string; position: number }>
  exaMentions: Array<{ url: string; title: string; domain: string; date?: string }>
  sitemapUrls: string[]
  robotsTxtUrl: string
  robotsTxtContent: string
  schemaTypesFound: string[]
  socialProfiles: Array<{ url: string; platform: string }>
  reviewListings: Array<{ url: string; title: string; platform: string }>
  redditThreads: Array<{ url: string; title: string }>
  wikiPages: Array<{ url: string; title: string }>
  knowledgeGraph?: { title?: string; description?: string; type?: string }
}

interface AuditResult {
  id: string
  brandId: string
  siteUrl: string
  overallScore: number
  grade: string
  pillars: AuditPillar[]
  issues: AuditCheck[]
  evidence?: AuditEvidence
  summary: {
    totalChecks: number
    passed: number
    warnings: number
    failed: number
    criticalIssues: number
  }
  citationVerification?: {
    citationRate: number
    queriesTested: number
    queriesCited: number
    calibrationMultiplier: number
    rawTechnicalScore: number
    probes: Array<{
      query: string
      model: string
      cited: boolean
      snippet?: string
    }>
    source: 'run' | 'live-probe' | 'both'
  }
  createdAt: string
}

interface CrawlerRule {
  crawler: string
  company?: string
  status: "allowed" | "blocked"
}

// ─── Constants ──────────────────────────────────────────────────────────────

const AUDIT_STEPS = [
  { id: "crawlability", label: "Crawlability", desc: "Checking AI bot access & robots.txt configuration", icon: Bot },
  { id: "structured-data", label: "Structured Data", desc: "Analyzing schema markup & JSON-LD implementation", icon: FileCode },
  { id: "content-authority", label: "Content Authority", desc: "Evaluating content depth, E-E-A-T & topical coverage", icon: BookOpen },
  { id: "source-footprint", label: "Source Footprint", desc: "Checking citations, backlinks & external references", icon: Link2 },
  { id: "knowledge-graph", label: "Knowledge Graph", desc: "Verifying presence in knowledge bases & entity databases", icon: Globe },
  { id: "social-proof", label: "Social Proof", desc: "Analyzing brand mentions & community engagement", icon: Users },
  { id: "brand-consistency", label: "Brand Consistency", desc: "Checking NAP consistency & messaging alignment", icon: Building2 },
]

const PILLAR_META: Record<string, { icon: typeof Globe; color: string }> = {
  "crawlability": { icon: Bot, color: "text-blue-600" },
  "structured-data": { icon: FileCode, color: "text-violet-600" },
  "content-authority": { icon: BookOpen, color: "text-emerald-600" },
  "source-footprint": { icon: Link2, color: "text-orange-600" },
  "knowledge-graph": { icon: Globe, color: "text-cyan-600" },
  "social-proof": { icon: Users, color: "text-pink-600" },
  "brand-consistency": { icon: Building2, color: "text-amber-600" },
}

const PILLAR_RATIONALE: Record<string, { why: string }> = {
  "crawlability": {
    why: "AI search engines use bots to crawl your site. If they're blocked by robots.txt or missing a sitemap, your content won't appear in AI-generated answers.",
  },
  "structured-data": {
    why: "Schema markup helps AI engines understand your content's context and meaning. Without it, AI models may misinterpret or ignore your brand information.",
  },
  "content-authority": {
    why: "AI engines prioritize content that demonstrates expertise and trustworthiness (E-E-A-T). Strong content authority means you're more likely to be cited as a source.",
  },
  "source-footprint": {
    why: "External citations and backlinks signal to AI engines that your brand is widely recognized. More references mean higher likelihood of being mentioned in AI responses.",
  },
  "knowledge-graph": {
    why: "Presence in knowledge bases like Wikipedia and Google's Knowledge Graph helps AI engines verify your brand exists and get facts right when mentioning you.",
  },
  "social-proof": {
    why: "Active community engagement and mentions across forums and reviews signal brand relevance and user satisfaction to AI engines.",
  },
  "brand-consistency": {
    why: "Consistent brand information across the web helps AI engines build a reliable profile. Conflicting data reduces confidence in mentioning your brand.",
  },
}

// ─── Reusable Components ────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, subtext, accent }: {
  icon: React.ElementType; label: string; value: string | number; subtext?: string; accent?: string
}) {
  return (
    <Card className="relative overflow-hidden border border-gray-200 shadow-none">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{value}</p>
            {subtext && <p className="text-[11px] text-muted-foreground mt-0.5">{subtext}</p>}
          </div>
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${accent || 'bg-gray-100'}`}>
            <Icon className="h-4 w-4 text-gray-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ActionButton({ check, onNavigateToAction, onHowToFix }: { check: AuditCheck; onNavigateToAction: (checkId: string) => void; onHowToFix: (check: AuditCheck) => void }) {
  const category = check.category?.toLowerCase() || ''
  const checkId = check.id?.toLowerCase() || ''

  if (category.includes('crawl') || checkId.includes('robots') || checkId.includes('crawler') || checkId.includes('sitemap')) {
    return (
      <Button variant="outline" size="sm" className="h-7 text-xs border-gray-200" onClick={() => onNavigateToAction(check.id)}>
        <Shield className="h-3 w-3 mr-1.5" /> Fix: Generate robots.txt
      </Button>
    )
  }
  if (category.includes('schema') || category.includes('structured') || checkId.includes('schema') || checkId.includes('json-ld')) {
    return (
      <Button variant="outline" size="sm" className="h-7 text-xs border-gray-200" onClick={() => onNavigateToAction(check.id)}>
        <FileCode className="h-3 w-3 mr-1.5" /> Fix: Generate Schema
      </Button>
    )
  }
  if (check.recommendation) {
    return (
      <Button variant="outline" size="sm" className="h-7 text-xs border-gray-200" onClick={() => onHowToFix(check)}>
        <Lightbulb className="h-3 w-3 mr-1.5" /> How to fix
      </Button>
    )
  }
  return null
}

const AI_CRAWLERS = [
  { id: "gptbot", name: "GPTBot", company: "OpenAI / ChatGPT", configKey: "allow_gptbot" },
  { id: "chatgpt_user", name: "ChatGPT-User", company: "OpenAI / ChatGPT", configKey: "allow_chatgpt_user" },
  { id: "claudebot", name: "Claude-Web", company: "Anthropic / Claude", configKey: "allow_claudebot" },
  { id: "google_extended", name: "Google-Extended", company: "Google / Gemini", configKey: "allow_google_extended" },
  { id: "perplexitybot", name: "PerplexityBot", company: "Perplexity AI", configKey: "allow_perplexitybot" },
  { id: "ccbot", name: "CCBot", company: "Common Crawl", configKey: "allow_ccbot" },
  { id: "amazonbot", name: "Amazonbot", company: "Amazon", configKey: "allow_amazonbot" },
  { id: "bytespider", name: "Bytespider", company: "ByteDance", configKey: "allow_bytespider" },
]

const SCHEMA_TEMPLATES = [
  { id: "organization", name: "Organization", desc: "Brand identity for AI recognition", impact: "Very High" },
  { id: "faq", name: "FAQ Page", desc: "Directly featured in AI answers", impact: "Very High" },
  { id: "product", name: "Product", desc: "Shopping query recommendations", impact: "High" },
  { id: "service", name: "Service", desc: "Service recommendations", impact: "Medium" },
  { id: "article", name: "Article", desc: "Authority & citation building", impact: "Medium" },
  { id: "local_business", name: "Local Business", desc: "Location-based discovery", impact: "High" },
]

const TEMPLATE_FIELDS: Record<string, { label: string; placeholder: string; key: string; type?: string }[]> = {
  organization: [
    { key: "name", label: "Organization Name", placeholder: "Acme Inc." },
    { key: "url", label: "Website URL", placeholder: "https://acme.com" },
    { key: "logo", label: "Logo URL", placeholder: "https://acme.com/logo.png" },
    { key: "description", label: "Description", placeholder: "Brief description of your organization" },
    { key: "email", label: "Email", placeholder: "info@acme.com" },
    { key: "phone", label: "Phone", placeholder: "+1-555-0100" },
  ],
  faq: [
    { key: "url", label: "FAQ Page URL", placeholder: "https://acme.com/faq" },
    { key: "q1", label: "Question 1", placeholder: "What is your service?" },
    { key: "a1", label: "Answer 1", placeholder: "We provide..." },
    { key: "q2", label: "Question 2", placeholder: "How much does it cost?" },
    { key: "a2", label: "Answer 2", placeholder: "Pricing starts at..." },
    { key: "q3", label: "Question 3", placeholder: "How do I get started?" },
    { key: "a3", label: "Answer 3", placeholder: "Sign up at..." },
  ],
  product: [
    { key: "name", label: "Product Name", placeholder: "Premium Widget" },
    { key: "description", label: "Description", placeholder: "Product description" },
    { key: "price", label: "Price", placeholder: "29.99" },
    { key: "currency", label: "Currency", placeholder: "USD" },
    { key: "image", label: "Image URL", placeholder: "https://acme.com/product.jpg" },
    { key: "sku", label: "SKU", placeholder: "WIDGET-001" },
  ],
  service: [
    { key: "name", label: "Service Name", placeholder: "Consulting Service" },
    { key: "description", label: "Description", placeholder: "Service description" },
    { key: "provider", label: "Provider", placeholder: "Acme Inc." },
    { key: "areaServed", label: "Area Served", placeholder: "United States" },
    { key: "price", label: "Price", placeholder: "99.00" },
  ],
  article: [
    { key: "headline", label: "Headline", placeholder: "Article headline" },
    { key: "author", label: "Author", placeholder: "John Doe" },
    { key: "datePublished", label: "Date Published", placeholder: "2024-01-15", type: "date" },
    { key: "image", label: "Image URL", placeholder: "https://acme.com/article.jpg" },
    { key: "publisher", label: "Publisher", placeholder: "Acme News" },
  ],
  local_business: [
    { key: "name", label: "Business Name", placeholder: "Acme Coffee Shop" },
    { key: "streetAddress", label: "Street Address", placeholder: "123 Main St" },
    { key: "city", label: "City", placeholder: "New York" },
    { key: "state", label: "State", placeholder: "NY" },
    { key: "postalCode", label: "Postal Code", placeholder: "10001" },
    { key: "phone", label: "Phone", placeholder: "+1-555-0100" },
    { key: "priceRange", label: "Price Range", placeholder: "$$" },
  ],
}

// Content assist types — maps issue categories to available content generation options
const CONTENT_TYPES: Record<string, { id: string; label: string; desc: string; icon: typeof Mail; categories: string[] }[]> = {
  'source-footprint': [
    { id: 'outreach-email', label: 'Outreach Email', desc: 'Pitch to publications covering your industry', icon: Mail, categories: ['source-footprint'] },
    { id: 'guest-post-pitch', label: 'Guest Post Pitch', desc: 'Propose article ideas to target sites', icon: PenLine, categories: ['source-footprint'] },
    { id: 'press-release', label: 'Press Release', desc: 'Announce something newsworthy', icon: Newspaper, categories: ['source-footprint'] },
  ],
  'knowledge-graph': [
    { id: 'press-release', label: 'Press Release', desc: 'Build entity recognition signals', icon: Newspaper, categories: ['knowledge-graph'] },
    { id: 'partnership-proposal', label: 'Partnership Proposal', desc: 'Collaborate with established entities', icon: Handshake, categories: ['knowledge-graph'] },
  ],
  'social-proof': [
    { id: 'reddit-post', label: 'Reddit / Forum Post', desc: 'Authentic community contribution', icon: MessageSquare, categories: ['social-proof'] },
    { id: 'review-profile', label: 'Review Site Profile', desc: 'G2, Capterra, Trustpilot listing copy', icon: Award, categories: ['social-proof'] },
    { id: 'partnership-proposal', label: 'Platform Pitch', desc: 'Pitch to community platforms', icon: Handshake, categories: ['social-proof'] },
  ],
  'content-authority': [
    { id: 'guest-post-pitch', label: 'Guest Post Pitch', desc: 'Build authority through publications', icon: PenLine, categories: ['content-authority'] },
    { id: 'faq-content', label: 'FAQ Content', desc: 'Create AI-optimized Q&A content', icon: HelpCircle, categories: ['content-authority'] },
    { id: 'outreach-email', label: 'Outreach Email', desc: 'Connect with industry publications', icon: Mail, categories: ['content-authority'] },
  ],
  'brand-consistency': [
    { id: 'faq-content', label: 'FAQ / About Content', desc: 'Consistent brand messaging', icon: HelpCircle, categories: ['brand-consistency'] },
  ],
}

const getContentTypesForIssue = (issue: AuditCheck) => {
  return CONTENT_TYPES[issue.category] || []
}

const isContentAssistIssue = (issue: AuditCheck) => {
  const cat = issue.category?.toLowerCase() || ''
  return (
    cat.includes('source') || cat.includes('footprint') ||
    cat.includes('knowledge') || cat.includes('social') ||
    cat.includes('content-authority') || cat.includes('brand-consistency')
  ) && issue.status !== 'pass'
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default function IndexingAuditPage() {
  const { currentBrand, isLoading: brandLoading } = useBrand()
  const { addToast } = useToast()

  // View state machine: loading → empty | report, empty → running → report
  const [view, setView] = useState<"loading" | "empty" | "running" | "report">("loading")
  const [reportTab, setReportTab] = useState("overview")
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)
  // Running state
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [auditPending, setAuditPending] = useState(false)
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pendingResultRef = useRef<AuditResult | null>(null)

  // Animated score for overview
  const [animatedScore, setAnimatedScore] = useState(0)

  // Report state
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null)
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [scrollActivePriority, setScrollActivePriority] = useState<string | null>(null)
  const issuesContainerRef = useRef<HTMLDivElement>(null)
  const [expandedAction, setExpandedAction] = useState<string | null>(null)
  const [toolFlyout, setToolFlyout] = useState<{ type: 'robots' | 'schema' | 'content-assist' | 'how-to-fix' | null; issueId: string | null }>({ type: null, issueId: null })
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // How-to-fix state
  const [howToGuide, setHowToGuide] = useState<string>("")
  const [generatingHowTo, setGeneratingHowTo] = useState(false)
  const [activeIssueForHowTo, setActiveIssueForHowTo] = useState<AuditCheck | null>(null)

  // Content assist state
  const [contentType, setContentType] = useState<string>("")
  const [contentTarget, setContentTarget] = useState<string>("")
  const [generatedContent, setGeneratedContent] = useState<string>("")
  const [generatingContent, setGeneratingContent] = useState(false)
  const [activeIssueForContent, setActiveIssueForContent] = useState<AuditCheck | null>(null)

  // Tools — crawler config
  const [crawlerConfig, setCrawlerConfig] = useState<Record<string, boolean>>({
    allow_gptbot: true, allow_chatgpt_user: true, allow_claudebot: true,
    allow_google_extended: true, allow_perplexitybot: true, allow_ccbot: true,
    allow_amazonbot: true, allow_bytespider: true,
  })
  const [sitemapUrl, setSitemapUrl] = useState("")
  const [generatedRobotsTxt, setGeneratedRobotsTxt] = useState("")
  const [generatingRobots, setGeneratingRobots] = useState(false)

  // Tools — schema
  const [analyzeUrl, setAnalyzeUrl] = useState("")
  const [analysisResult, setAnalysisResult] = useState<Record<string, unknown> | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [generatedSchema, setGeneratedSchema] = useState("")
  const [generatingSchema, setGeneratingSchema] = useState(false)
  const [validationInput, setValidationInput] = useState("")
  const [validationResult, setValidationResult] = useState<Record<string, unknown> | null>(null)
  const [validating, setValidating] = useState(false)

  // ─── Load existing audit on mount ─────────────────────────────────────

  useEffect(() => {
    if (brandLoading) return
    if (!currentBrand?.id) {
      setView("empty")
      return
    }

    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`/api/discoverability/indexing/audit?brand_id=${currentBrand.id}&mode=latest`)
        if (!cancelled && res.ok) {
          const result = await res.json()
          if (result.data) {
            setAuditResult(result.data)
            setView("report")
            return
          }
        }
      } catch (e) {
        console.error("Load audit error:", e)
      }
      if (!cancelled) setView("empty")
    }
    load()
    return () => { cancelled = true }
  }, [currentBrand?.id, brandLoading])

  // ─── Score count-up animation ─────────────────────────────────────────

  useEffect(() => {
    if (view !== "report" || !auditResult) return
    setAnimatedScore(0)
    const target = auditResult.overallScore
    const steps = 28
    const increment = target / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setAnimatedScore(target)
        clearInterval(timer)
      } else {
        setAnimatedScore(Math.round(current))
      }
    }, 36)

    return () => clearInterval(timer)
  }, [view, auditResult?.overallScore, auditResult])

  // ─── Run audit ────────────────────────────────────────────────────────

  // Transition to report once all steps are visually done AND API has returned
  const transitionToReport = useCallback((data: AuditResult) => {
    setAuditResult(data)
    setAuditPending(false)
    pendingResultRef.current = null
    setTimeout(() => {
      setView("report")
      setReportTab("overview")
    }, 800)
  }, [])

  const runAudit = useCallback(async () => {
    if (!currentBrand?.id) return

    setView("running")
    setCurrentStep(0)
    setCompletedSteps([])
    setAuditPending(true)
    pendingResultRef.current = null

    // Animate steps sequentially at the given speed
    let step = 0
    const startStepper = (interval: number) => {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current)
      stepTimerRef.current = setInterval(() => {
        setCompletedSteps(prev => [...prev, step])
        step++
        if (step < AUDIT_STEPS.length) {
          setCurrentStep(step)
        } else {
          if (stepTimerRef.current) clearInterval(stepTimerRef.current)
          setCurrentStep(AUDIT_STEPS.length)
          // Steps done — if API already returned, transition now
          const pending = pendingResultRef.current
          if (pending) {
            transitionToReport(pending)
          }
        }
      }, interval)
    }

    // Start slow visual progression (2.2s per step)
    startStepper(2200)

    try {
      const res = await fetch("/api/discoverability/indexing/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: currentBrand.id }),
      })

      if (res.ok) {
        const result = await res.json()
        if (result.data) {
          if (step >= AUDIT_STEPS.length) {
            // All steps already animated — transition immediately
            setCompletedSteps(AUDIT_STEPS.map((_, i) => i))
            setCurrentStep(AUDIT_STEPS.length)
            transitionToReport(result.data)
          } else {
            // Steps still animating — store result and speed up
            pendingResultRef.current = result.data
            setAuditResult(result.data)
            startStepper(300)
          }
          return
        }
        addToast({ type: "error", title: "Audit Failed", message: "No audit data returned" })
      } else {
        const err = await res.json().catch(() => ({ error: "Unknown error" }))
        addToast({ type: "error", title: "Audit Failed", message: err.message || err.error || "Something went wrong" })
      }
      if (stepTimerRef.current) clearInterval(stepTimerRef.current)
      setAuditPending(false)
      setView(auditResult ? "report" : "empty")
    } catch {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current)
      setAuditPending(false)
      addToast({ type: "error", title: "Connection Error", message: "Failed to reach the server" })
      setView(auditResult ? "report" : "empty")
    }
  }, [currentBrand?.id, auditResult, addToast, transitionToReport])

  // Cleanup step timer
  useEffect(() => {
    return () => { if (stepTimerRef.current) clearInterval(stepTimerRef.current) }
  }, [])

  // ─── Tool handlers ────────────────────────────────────────────────────

  const copyToClipboard = (text: string, id?: string) => {
    navigator.clipboard.writeText(text)
    if (id) {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
    addToast({ type: "success", title: "Copied", message: "Copied to clipboard" })
  }

  const handleGenerateRobots = async () => {
    if (!currentBrand?.id) return
    setGeneratingRobots(true)
    try {
      const res = await fetch("/api/discoverability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-robots", brand_id: currentBrand.id,
          config: { ...crawlerConfig, sitemap_url: sitemapUrl },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setGeneratedRobotsTxt(data.robots_txt || data.data?.robots_txt || "")
        addToast({ type: "success", title: "Generated", message: "robots.txt ready" })
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to generate robots.txt" })
    } finally {
      setGeneratingRobots(false)
    }
  }

  const handleAnalyzeSchema = async () => {
    if (!analyzeUrl || !currentBrand?.id) return
    setAnalyzing(true)
    try {
      const res = await fetch("/api/discoverability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze-schema", brand_id: currentBrand.id, url: analyzeUrl }),
      })
      if (res.ok) {
        const data = await res.json()
        setAnalysisResult(data.analysis || data.data || data)
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to analyze schema" })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleGenerateSchema = async () => {
    if (!selectedTemplate || !currentBrand?.id) return
    setGeneratingSchema(true)
    try {
      const res = await fetch("/api/discoverability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-schema", brand_id: currentBrand.id,
          template_id: selectedTemplate, data: formData,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const schema = data.schema || data.data?.schema || data.data
        setGeneratedSchema(typeof schema === "string" ? schema : JSON.stringify(schema, null, 2))
        addToast({ type: "success", title: "Generated", message: "Schema markup ready" })
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to generate schema" })
    } finally {
      setGeneratingSchema(false)
    }
  }

  const handleValidateSchema = async () => {
    if (!validationInput) return
    setValidating(true)
    try {
      const res = await fetch("/api/discoverability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validate-schema", schema: validationInput }),
      })
      if (res.ok) {
        const data = await res.json()
        setValidationResult(data.validation || data.data || data)
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to validate schema" })
    } finally {
      setValidating(false)
    }
  }

  const handleGenerateContent = async () => {
    if (!contentType || !currentBrand?.id || !activeIssueForContent) return
    setGeneratingContent(true)
    setGeneratedContent("")
    try {
      // Gather evidence URLs for this issue from metadata
      const evidenceUrls: Array<{ url: string; title?: string }> = []
      const md = activeIssueForContent.metadata
      if (md) {
        const listFields = ['topMentions', 'topThreads', 'reviews', 'topResults'] as const
        for (const field of listFields) {
          if (Array.isArray(md[field])) {
            for (const item of (md[field] as Array<{ url: string; title?: string }>).slice(0, 5)) {
              evidenceUrls.push({ url: item.url, title: item.title })
            }
          }
        }
        if (md.url) evidenceUrls.push({ url: md.url as string })
        if (md.sourceUrl) evidenceUrls.push({ url: md.sourceUrl as string })
      }
      // Also pull from audit evidence
      if (auditResult?.evidence) {
        const ev = auditResult.evidence
        const cat = activeIssueForContent.category
        if (cat.includes('source') || cat.includes('content-authority')) {
          ev.exaMentions.slice(0, 5).forEach(m => evidenceUrls.push({ url: m.url, title: m.title }))
        }
        if (cat.includes('social')) {
          ev.redditThreads.slice(0, 3).forEach(r => evidenceUrls.push({ url: r.url, title: r.title }))
          ev.reviewListings.slice(0, 3).forEach(r => evidenceUrls.push({ url: r.url, title: r.title }))
        }
        if (cat.includes('knowledge')) {
          ev.serpResults.slice(0, 3).forEach(r => evidenceUrls.push({ url: r.url, title: r.title }))
          ev.wikiPages.slice(0, 2).forEach(w => evidenceUrls.push({ url: w.url, title: w.title }))
        }
      }

      const res = await fetch("/api/discoverability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-content",
          brand_id: currentBrand.id,
          content_type: contentType,
          issue_id: activeIssueForContent.id,
          issue_category: activeIssueForContent.category,
          issue_name: activeIssueForContent.name,
          issue_details: activeIssueForContent.details,
          issue_recommendation: activeIssueForContent.recommendation || "",
          target_domain: contentTarget || undefined,
          evidence_urls: evidenceUrls.slice(0, 8),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setGeneratedContent(data.content || "")
        addToast({ type: "success", title: "Content Ready", message: "Your draft has been generated" })
      } else {
        addToast({ type: "error", title: "Generation Failed", message: "Could not generate content" })
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to generate content" })
    } finally {
      setGeneratingContent(false)
    }
  }

  // ─── Computed values ──────────────────────────────────────────────────

  const navigateToAction = (checkId: string) => {
    setReportTab("recommendations")
    setPriorityFilter("all")
    // Determine tool type and open flyout
    const issue = auditResult?.issues?.find(i => i.id === checkId)
    if (issue) {
      const cat = issue.category?.toLowerCase() || ''
      const cid = issue.id?.toLowerCase() || ''
      if (cat.includes('crawl') || cid.includes('robot') || cid.includes('sitemap') || cid.includes('crawler')) {
        setToolFlyout({ type: 'robots', issueId: checkId })
      } else if (cat.includes('schema') || cat.includes('structured') || cid.includes('schema') || cid.includes('json-ld')) {
        setToolFlyout({ type: 'schema', issueId: checkId })
      }
    }
  }

  const openToolFlyout = (issue: AuditCheck) => {
    const cat = issue.category?.toLowerCase() || ''
    const cid = issue.id?.toLowerCase() || ''
    if (cat.includes('crawl') || cid.includes('robot') || cid.includes('sitemap') || cid.includes('crawler')) {
      setToolFlyout({ type: 'robots', issueId: issue.id })
    } else if (cat.includes('schema') || cat.includes('structured') || cid.includes('schema') || cid.includes('json-ld')) {
      setToolFlyout({ type: 'schema', issueId: issue.id })
    }
  }

  const openContentAssist = (issue: AuditCheck) => {
    setActiveIssueForContent(issue)
    setContentType("")
    setContentTarget("")
    setGeneratedContent("")
    setToolFlyout({ type: 'content-assist', issueId: issue.id })
  }

  const openHowToFix = (issue: AuditCheck) => {
    setActiveIssueForHowTo(issue)
    setHowToGuide("")
    setToolFlyout({ type: 'how-to-fix', issueId: issue.id })
    // Auto-generate on open
    generateHowToGuide(issue)
  }

  const generateHowToGuide = async (issue: AuditCheck) => {
    if (!currentBrand?.id) return
    setGeneratingHowTo(true)
    setHowToGuide("")
    try {
      const res = await fetch("/api/discoverability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-how-to",
          brand_id: currentBrand.id,
          issue_name: issue.name,
          issue_category: issue.category,
          issue_details: issue.details,
          issue_recommendation: issue.recommendation || "",
          issue_priority: issue.priority,
          issue_effort: issue.effort,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setHowToGuide(data.guide || "")
      } else {
        addToast({ type: "error", title: "Generation Failed", message: "Could not generate implementation guide" })
      }
    } catch {
      addToast({ type: "error", title: "Error", message: "Failed to generate guide" })
    } finally {
      setGeneratingHowTo(false)
    }
  }

  const closeFlyout = () => {
    setToolFlyout({ type: null, issueId: null })
    setActiveIssueForContent(null)
    setActiveIssueForHowTo(null)
  }

  // Auto-highlight side nav on scroll when viewing "all" issues
  useEffect(() => {
    if (priorityFilter !== "all") {
      setScrollActivePriority(null)
      return
    }
    const container = issuesContainerRef.current
    if (!container) return

    const sentinels = container.querySelectorAll<HTMLElement>('[data-priority-section]')
    if (sentinels.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Among visible sentinels, pick the one closest to the top
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          const priority = (visible[0].target as HTMLElement).dataset.prioritySection || null
          setScrollActivePriority(priority)
        }
      },
      { root: null, rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    sentinels.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [priorityFilter, auditResult])

  const filteredIssues = (auditResult?.issues?.filter(
    i => priorityFilter === "all" || i.priority === priorityFilter
  ) || []).sort((a, b) => {
    // Failing issues first, then by potential points gain (descending)
    if (a.status === 'pass' && b.status !== 'pass') return 1
    if (a.status !== 'pass' && b.status === 'pass') return -1
    const aGain = a.maxScore - a.score
    const bGain = b.maxScore - b.score
    if (aGain !== bGain) return bGain - aGain
    const p: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
    return (p[a.priority] ?? 3) - (p[b.priority] ?? 3)
  })

  const quickWins = auditResult?.issues
    ?.filter(i => i.status !== "pass" && (i.effort === "trivial" || i.effort === "easy"))
    .sort((a, b) => {
      const p: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
      return (p[a.priority] ?? 3) - (p[b.priority] ?? 3)
    })
    .slice(0, 5) || []

  const crawlerRules = auditResult?.pillars
    ?.find(p => p.id === "crawlability")
    ?.checks?.find(c => c.id === "ai-crawler-access")
    ?.metadata?.crawlerRules as CrawlerRule[] | undefined

  // ─── Evidence helpers ─────────────────────────────────────────────────

  type EvidenceItem = { type: 'url'; url: string; label?: string } | { type: 'text'; label: string; url?: undefined }

  const getPillarEvidence = (pillarId: string, ev: AuditEvidence): Array<{ url: string; title?: string }> => {
    switch (pillarId) {
      case 'crawlability':
        return [
          ...ev.crawledUrls.filter(u => u.type === 'robots.txt' || u.type === 'sitemap').map(u => ({ url: u.url })),
          ...ev.sitemapUrls.slice(0, 20).map(u => ({ url: u })),
        ]
      case 'structured-data':
        return []
      case 'content-authority':
        return ev.exaMentions.map(m => ({ url: m.url, title: m.title }))
      case 'source-footprint':
        return ev.exaMentions.map(m => ({ url: m.url, title: m.title }))
      case 'knowledge-graph':
        return [
          ...ev.serpResults.map(r => ({ url: r.url, title: `#${r.position} ${r.title}` })),
          ...ev.wikiPages.map(w => ({ url: w.url, title: w.title })),
        ]
      case 'social-proof':
        return [
          ...ev.redditThreads.map(r => ({ url: r.url, title: r.title })),
          ...ev.reviewListings.map(r => ({ url: r.url, title: `${r.platform}: ${r.title}` })),
        ]
      case 'brand-consistency':
        return ev.socialProfiles.map(s => ({ url: s.url, title: s.platform }))
      default:
        return []
    }
  }

  const getCheckEvidence = (check: AuditCheck): EvidenceItem[] => {
    const md = check.metadata
    if (!md) return []

    const items: EvidenceItem[] = []

    // URLs from metadata
    if (md.sourceUrl) items.push({ type: 'url', url: md.sourceUrl as string })
    if (md.sitemapUrl) items.push({ type: 'url', url: md.sitemapUrl as string, label: `${md.sitemapUrlCount || 0} URLs indexed` })
    if (md.url) items.push({ type: 'url', url: md.url as string })
    if (md.foundAt) items.push({ type: 'url', url: md.foundAt as string, label: 'Found' })
    if (md.contentPreview) items.push({ type: 'text', label: `Content: ${(md.contentPreview as string).substring(0, 120)}…` })

    // Top mentions / threads / reviews
    const listFields = ['topMentions', 'topThreads', 'reviews', 'topResults'] as const
    for (const field of listFields) {
      if (Array.isArray(md[field])) {
        for (const item of (md[field] as Array<{ url: string; title?: string }>).slice(0, 5)) {
          items.push({ type: 'url', url: item.url, label: item.title })
        }
      }
    }

    // Checked paths — only show paths that were NOT found (as failed indicators, not links)
    if (Array.isArray(md.checkedPaths)) {
      const foundUrl = md.foundAt as string | null
      for (const p of md.checkedPaths as string[]) {
        if (p === foundUrl) continue // already shown via foundAt above
        if (check.status === 'fail' || check.status === 'warning') {
          items.push({ type: 'text', label: `Not found: ${p}` })
        }
      }
    }

    // Social URLs — only actual profile pages, not tweets/hashtags/posts
    if (Array.isArray(md.socialUrls)) {
      const profilePatterns = /\/(company|in|channel|c|p|user|pages|@)?\/?[a-zA-Z0-9._-]+\/?$/
      for (const s of (md.socialUrls as Array<{ url: string; platform: string }>).slice(0, 8)) {
        // Skip tweet links, hashtag pages, status/post URLs
        if (/\/(status|hashtag|watch\?|post|comments)\b/i.test(s.url)) continue
        if (profilePatterns.test(s.url)) {
          items.push({ type: 'url', url: s.url, label: s.platform })
        }
      }
    }

    // Schema types
    if (Array.isArray(md.schemas)) {
      for (const s of (md.schemas as string[]).slice(0, 3)) {
        items.push({ type: 'text', label: `Schema: ${s.substring(0, 100)}…` })
      }
    }

    // Knowledge graph
    if (md.knowledgeGraph) {
      const kg = md.knowledgeGraph as { title?: string; description?: string; type?: string }
      items.push({ type: 'text', label: `Knowledge Panel: ${kg.title} (${kg.type})` })
    }

    return items
  }

  // ─── Render helpers ───────────────────────────────────────────────────

  const scoreColor = (s: number) =>
    s >= 80 ? "text-green-600"
    : s >= 60 ? "text-yellow-600"
    : s >= 40 ? "text-orange-600"
    : "text-red-600"

  const scoreBarColor = (s: number) =>
    s >= 80 ? "bg-green-500" : s >= 50 ? "bg-yellow-500" : "bg-red-500"

  const scoreLabel = (s: number) =>
    s >= 80 ? "Excellent" : s >= 60 ? "Good" : s >= 40 ? "Needs Work" : "Critical"

  const ringStroke = (s: number) =>
    s >= 80 ? "#16a34a" : s >= 60 ? "#eab308" : s >= 40 ? "#f97316" : "#dc2626"

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "pass") return <CheckCircle className="h-4 w-4 text-green-600" />
    if (status === "warning") return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    if (status === "fail") return <XCircle className="h-4 w-4 text-red-600" />
    return <div className="h-4 w-4 rounded-full bg-gray-200" />
  }

  const PriorityBadge = ({ priority }: { priority: string }) => {
    const s: Record<string, string> = {
      critical: "bg-red-100 text-red-700",
      high: "bg-orange-100 text-orange-700",
      medium: "bg-yellow-100 text-yellow-700",
      low: "bg-blue-100 text-blue-700",
    }
    return <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${s[priority] || ""}`}>{priority}</span>
  }

  // ─── LOADING STATE ────────────────────────────────────────────────────

  if (view === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ─── EMPTY STATE — First-time experience ──────────────────────────────

  if (view === "empty") {
    const PILLARS = [
      { label: "Source Footprint", weight: 25, icon: Link2, color: "text-violet-600", bg: "bg-violet-50" },
      { label: "Content Authority", weight: 20, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
      { label: "Knowledge Graph", weight: 20, icon: Globe, color: "text-emerald-600", bg: "bg-emerald-50" },
      { label: "Structured Data", weight: 15, icon: FileCode, color: "text-amber-600", bg: "bg-amber-50" },
      { label: "Crawlability", weight: 10, icon: Bot, color: "text-cyan-600", bg: "bg-cyan-50" },
      { label: "Social Proof", weight: 7, icon: Users, color: "text-pink-600", bg: "bg-pink-50" },
      { label: "Brand Consistency", weight: 3, icon: Building2, color: "text-gray-600", bg: "bg-gray-100" },
    ]

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Search className="h-5 w-5 text-gray-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">AI Answer Discoverability Audit</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Audit the signals that determine whether AI engines like ChatGPT, Gemini, and Claude cite {currentBrand?.name || "your brand"} in their answers — and see exactly where to improve.
            </p>
          </div>

          {/* Pillar preview */}
          <div className="border border-dashed rounded-lg p-4 text-left">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Signals We Audit</p>
            <div className="space-y-2">
              {PILLARS.map(pillar => {
                const Icon = pillar.icon
                return (
                  <div key={pillar.label} className="flex items-center gap-3">
                    <div className={`h-6 w-6 rounded ${pillar.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-3 w-3 ${pillar.color}`} />
                    </div>
                    <span className="text-sm text-gray-700 flex-1">{pillar.label}</span>
                    <span className="text-xs text-gray-400 tabular-nums">{pillar.weight}%</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              size="lg"
              onClick={runAudit}
              disabled={!currentBrand?.id}
              className="w-full bg-black text-white hover:bg-gray-800"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Run Audit
            </Button>
            <p className="text-xs text-muted-foreground">Takes about 30 seconds · No setup needed</p>
          </div>
        </div>
      </div>
    )
  }

  // ─── RUNNING STATE — Animated stepper ─────────────────────────────────

  if (view === "running") {
    const stepsAnimated = completedSteps.length >= AUDIT_STEPS.length
    const allDone = stepsAnimated && !auditPending
    const progress = Math.round((completedSteps.length / AUDIT_STEPS.length) * 100)
    const completedCount = completedSteps.length
    const totalCount = AUDIT_STEPS.length

    const rSize = 100
    const rStroke = 6
    const rRadius = (rSize - rStroke) / 2
    const rCirc = 2 * Math.PI * rRadius
    const rOffset = rCirc - (progress / 100) * rCirc

    const stepAccent: Record<string, { iconBg: string; bg: string; activeBorder: string }> = {
      "crawlability": { iconBg: "bg-blue-100", bg: "bg-blue-50", activeBorder: "border-blue-300" },
      "structured-data": { iconBg: "bg-violet-100", bg: "bg-violet-50", activeBorder: "border-violet-300" },
      "content-authority": { iconBg: "bg-emerald-100", bg: "bg-emerald-50", activeBorder: "border-emerald-300" },
      "source-footprint": { iconBg: "bg-orange-100", bg: "bg-orange-50", activeBorder: "border-orange-300" },
      "knowledge-graph": { iconBg: "bg-cyan-100", bg: "bg-cyan-50", activeBorder: "border-cyan-300" },
      "social-proof": { iconBg: "bg-pink-100", bg: "bg-pink-50", activeBorder: "border-pink-300" },
      "brand-consistency": { iconBg: "bg-amber-100", bg: "bg-amber-50", activeBorder: "border-amber-300" },
    }

    const activeStep = AUDIT_STEPS[currentStep]

    return (
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Brand Discoverability Audit
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {allDone
              ? "All checks passed — preparing your report\u2026"
              : stepsAnimated
                ? "Finalizing results\u2026"
                : `Analyzing ${currentBrand?.name || "your brand"} across 7 AI-readiness dimensions`}
          </p>
        </div>

        {/* Hero Progress Card */}
        <div className={`rounded-2xl p-8 ${allDone ? 'bg-emerald-950' : 'bg-black'} text-white transition-colors duration-700`}>
          <div className="flex items-center gap-8">
            {/* Progress Ring */}
            <div className="flex-shrink-0 relative">
              <svg width={rSize} height={rSize} className="-rotate-90">
                <circle
                  cx={rSize / 2} cy={rSize / 2} r={rRadius}
                  stroke="rgba(255,255,255,0.1)" strokeWidth={rStroke} fill="none"
                />
                <circle
                  cx={rSize / 2} cy={rSize / 2} r={rRadius}
                  stroke={allDone ? '#34d399' : '#ffffff'}
                  strokeWidth={rStroke} fill="none"
                  strokeLinecap="round"
                  strokeDasharray={rCirc}
                  strokeDashoffset={rOffset}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {allDone ? (
                  <CheckCircle className="h-8 w-8 text-emerald-400" />
                ) : (
                  <span className="text-2xl font-bold tabular-nums">{progress}%</span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1">
                {!allDone && <Loader2 className="h-4 w-4 text-white/60 animate-spin" />}
                <h2 className="text-lg font-semibold">
                  {allDone ? "Analysis Complete" : stepsAnimated ? "Finalizing\u2026" : "Running Analysis\u2026"}
                </h2>
              </div>
              <p className="text-sm text-white/50 mb-4">
                {completedCount} of {totalCount} dimensions checked
                {!allDone && activeStep && <span className="text-white/40"> &middot; Currently: {activeStep.label}</span>}
              </p>

              {/* Progress bar */}
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${allDone ? 'bg-emerald-400' : 'bg-white'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step Cards */}
        {/* Sequential Steps */}
        <div>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-5">
            Audit Dimensions
          </h3>
          <div className="relative">
            {AUDIT_STEPS.map((step, index) => {
              const Icon = step.icon
              const isComplete = completedSteps.includes(index)
              const isCurrent = currentStep === index && !isComplete
              const isPending = !isComplete && !isCurrent
              const meta = PILLAR_META[step.id]
              const accent = stepAccent[step.id] || { iconBg: "bg-gray-100", bg: "bg-gray-50", activeBorder: "border-gray-300" }
              const isLast = index === AUDIT_STEPS.length - 1

              return (
                <div key={step.id} className="relative flex gap-4">
                  {/* Connector line + indicator */}
                  <div className="flex flex-col items-center">
                    {/* Step indicator circle */}
                    <div className={`relative z-10 h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-500 ${
                      isComplete
                        ? 'bg-emerald-600 border-emerald-600'
                        : isCurrent
                          ? `bg-white ${accent.activeBorder}`
                          : 'bg-gray-50 border-gray-200'
                    }`}>
                      {isComplete ? (
                        <Check className="h-4 w-4 text-white" />
                      ) : isCurrent ? (
                        <Loader2 className={`h-4 w-4 animate-spin ${meta?.color || 'text-gray-600'}`} />
                      ) : (
                        <span className="text-xs font-mono font-medium text-gray-400 tabular-nums">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                    {/* Vertical connector line */}
                    {!isLast && (
                      <div className={`w-0.5 flex-1 min-h-[16px] transition-colors duration-500 ${
                        isComplete ? 'bg-emerald-300' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>

                  {/* Step content */}
                  <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-3'}`}>
                    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3.5 transition-all duration-500 ${
                      isCurrent
                        ? `bg-white ${accent.activeBorder} border-2`
                        : isComplete
                          ? 'bg-white border-gray-100'
                          : 'bg-gray-50/60 border-gray-100'
                    } ${isPending ? 'opacity-50' : ''}`}>
                      {/* Pillar icon */}
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-500 ${
                        isComplete
                          ? 'bg-emerald-50'
                          : isCurrent
                            ? accent.iconBg
                            : 'bg-gray-100'
                      }`}>
                        <Icon className={`h-5 w-5 transition-colors duration-500 ${
                          isComplete
                            ? 'text-emerald-600'
                            : isCurrent
                              ? (meta?.color || 'text-gray-600')
                              : 'text-gray-400'
                        }`} />
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-semibold ${isPending ? 'text-gray-400' : 'text-gray-900'}`}>
                          {step.label}
                        </h4>
                        <p className={`text-xs leading-relaxed mt-0.5 ${
                          isCurrent ? 'text-gray-500' : isComplete ? 'text-gray-400' : 'text-gray-300'
                        }`}>
                          {step.desc}
                        </p>
                      </div>

                      {/* Status */}
                      <div className="flex-shrink-0">
                        {isComplete && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                            <Check className="h-3 w-3" /> Done
                          </span>
                        )}
                        {isCurrent && (
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${meta?.color || 'text-blue-700'} ${accent.bg} px-2.5 py-1 rounded-full`}>
                            <Loader2 className="h-3 w-3 animate-spin" /> Analyzing
                          </span>
                        )}
                        {isPending && (
                          <span className="text-[11px] font-medium text-gray-300">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Current Activity / Completion Footer */}
        {!allDone && !stepsAnimated && activeStep && (
          <div className="flex items-center gap-4 p-5 rounded-xl bg-gray-50 border border-gray-100">
            <div className="h-10 w-10 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
              <Search className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Currently analyzing: {activeStep.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Crawling your site, checking AI search results, and evaluating your brand&#39;s presence across AI knowledge sources. Usually takes 30&ndash;60 seconds.
              </p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <div className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {stepsAnimated && auditPending && (
          <div className="flex items-center gap-4 p-5 rounded-xl bg-gray-50 border border-gray-100">
            <div className="h-10 w-10 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Finalizing analysis</p>
              <p className="text-xs text-gray-500 mt-0.5">
                All dimensions scanned — compiling results and generating recommendations. Almost there.
              </p>
            </div>
          </div>
        )}

        {allDone && (
          <div className="flex items-center gap-4 p-5 rounded-xl bg-emerald-50 border border-emerald-100">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-900">Compiling your report</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                Your results are being compiled with actionable recommendations and implementation guides.
              </p>
            </div>
            <Loader2 className="h-4 w-4 text-emerald-600 animate-spin flex-shrink-0" />
          </div>
        )}
      </div>
    )
  }

  // ─── REPORT VIEW ─────────────────────────────────────────────────────

  if (!auditResult) return null

  const ringSize = 128
  const ringStrokeWidth = 8
  const ringRadius = (ringSize - ringStrokeWidth) / 2
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = ringCircumference - (animatedScore / 100) * ringCircumference

  // Details sidenav — default to weakest pillar for immediate actionability
  const showResources = expandedPillar === 'resources'
  const weakestPillar = auditResult.pillars.reduce((worst, p) => {
    const pctW = worst.maxScore > 0 ? worst.score / worst.maxScore : 1
    const pctP = p.maxScore > 0 ? p.score / p.maxScore : 1
    return pctP < pctW ? p : worst
  }, auditResult.pillars[0])
  const activePillar = !showResources
    ? (auditResult.pillars.find(p => p.id === expandedPillar) || weakestPillar)
    : null
  const ActivePillarIcon = activePillar ? (PILLAR_META[activePillar.id]?.icon || Globe) : Globe
  const activePct = activePillar && activePillar.maxScore > 0 ? Math.round((activePillar.score / activePillar.maxScore) * 100) : 0
  const activeRationale = activePillar ? PILLAR_RATIONALE[activePillar.id] : null
  const activeEvidence = activePillar && auditResult.evidence ? getPillarEvidence(activePillar.id, auditResult.evidence) : []

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-8 space-y-6">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AEO Readiness Audit</h1>
          <p className="text-sm text-muted-foreground mt-1">
            How well {currentBrand?.name} is positioned for AI-powered search engines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Last run {new Date(auditResult.createdAt).toLocaleDateString("en-US", {
              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </span>
          <Button onClick={runAudit} variant="outline" size="icon" className="h-8 w-8 border-gray-200">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ── EXPLAINER ── */}
      <div className="p-4 rounded-lg border border-gray-200 bg-gray-50/50">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-4 w-4 text-gray-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-gray-700">What this report measures</p>
            <p className="text-xs text-gray-500 mt-0.5">
              This audit scores how likely AI engines (ChatGPT, Gemini, Perplexity) are to discover, trust, and cite your brand.
              Each of the 7 dimensions is weighted by its influence on LLM citation decisions — Source Footprint (25%), Content Authority (20%),
              Knowledge Graph (20%), Structured Data (15%), Crawlability (10%), Social Proof (7%), and Brand Consistency (3%).
              We verify page accessibility, check for llms.txt, validate structured data, and confirm external citations aren&apos;t broken.
            </p>
          </div>
        </div>
      </div>

      {/* ── KPI ROW ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard icon={ShieldCheck} label="Overall Score" value={`${auditResult.overallScore}/100`} subtext={`Grade: ${auditResult.grade}`} accent={auditResult.overallScore >= 60 ? "bg-green-50" : "bg-orange-50"} />
        <KpiCard icon={CheckCircle} label="Passed" value={auditResult.summary.passed} subtext={`of ${auditResult.summary.totalChecks} checks`} accent="bg-green-50" />
        <KpiCard icon={AlertTriangle} label="Warnings" value={auditResult.summary.warnings} subtext="Need attention" accent="bg-yellow-50" />
        <KpiCard icon={XCircle} label="Failed" value={auditResult.summary.failed} subtext={`${auditResult.summary.criticalIssues} critical`} accent="bg-red-50" />
        <KpiCard icon={Zap} label="Quick Wins" value={quickWins.length} subtext="Easy improvements" accent="bg-orange-50" />
      </div>

      {/* ── CITATION REALITY CHECK ── */}
      {auditResult.citationVerification && auditResult.citationVerification.citationRate >= 0 && (() => {
        const cv = auditResult.citationVerification!
        const citePct = Math.round(cv.citationRate * 100)
        const isLow = citePct < 30
        const isMedium = citePct >= 30 && citePct < 60
        return (
          <div className={`p-4 rounded-lg border ${isLow ? 'border-red-200 bg-red-50/50' : isMedium ? 'border-amber-200 bg-amber-50/50' : 'border-green-200 bg-green-50/50'}`}>
            <div className="flex items-start gap-3">
              <MessageSquare className={`h-4 w-4 shrink-0 mt-0.5 ${isLow ? 'text-red-500' : isMedium ? 'text-amber-500' : 'text-green-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-medium text-gray-700">Citation Reality Check</p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${isLow ? 'bg-red-100 text-red-700' : isMedium ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    {citePct}% citation rate
                  </span>
                  {cv.rawTechnicalScore !== auditResult.overallScore && (
                    <span className="text-[10px] text-gray-400">
                      Technical: {cv.rawTechnicalScore} → Calibrated: {auditResult.overallScore}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isLow
                    ? `AI engines were asked ${cv.queriesTested} relevant queries — your brand was cited in only ${cv.queriesCited}. A high technical score doesn't matter if AI isn't mentioning you.`
                    : isMedium
                    ? `Your brand appeared in ${cv.queriesCited} of ${cv.queriesTested} AI queries. There's room to improve your citation rate across AI engines.`
                    : `Your brand was cited in ${cv.queriesCited} of ${cv.queriesTested} AI queries — strong visibility confirmed.`
                  }
                </p>
                {cv.probes.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {cv.probes.slice(0, 4).map((probe, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px]">
                        {probe.cited
                          ? <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                          : <XCircle className="h-3 w-3 text-red-400 shrink-0" />
                        }
                        <span className="text-gray-600 truncate">&ldquo;{probe.query}&rdquo;</span>
                        <span className="text-gray-400 shrink-0">{probe.model.split('/').pop()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      <Tabs value={reportTab} onValueChange={setReportTab} className="space-y-6">
        <TabsList className="bg-white border border-gray-200 h-12 rounded-lg p-1 gap-1 w-full">
          <TabsTrigger value="overview" className="gap-2 text-gray-500 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-5 py-2 text-sm font-medium transition-all flex-1">
            <BarChart3 className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="details" className="gap-2 text-gray-500 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-5 py-2 text-sm font-medium transition-all flex-1">
            <Target className="h-4 w-4" /> Details
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="gap-2 text-gray-500 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-5 py-2 text-sm font-medium transition-all flex-1">
            <Lightbulb className="h-4 w-4" /> Actions
            {auditResult.summary.failed > 0 && (
              <span className="ml-1 text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                {auditResult.summary.failed}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW TAB ── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
            {/* Score card */}
            <Card className="border border-gray-200 shadow-none py-0">
              <CardHeader className="bg-black text-white rounded-t-lg py-4">
                <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
                  <ShieldCheck className="h-5 w-5" /> AEO Score
                </CardTitle>
                <CardDescription className="text-gray-300 font-light">AI Engine Optimization readiness</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <svg width={ringSize} height={ringSize} className="transform -rotate-90">
                      <circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} fill="none" stroke="#f3f4f6" strokeWidth={ringStrokeWidth} />
                      <circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} fill="none" stroke={ringStroke(auditResult.overallScore)} strokeWidth={ringStrokeWidth} strokeLinecap="round" strokeDasharray={ringCircumference} strokeDashoffset={ringOffset} className="transition-all duration-1000 ease-out" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-3xl font-bold tabular-nums ${scoreColor(auditResult.overallScore)}`}>{animatedScore}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">/100</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`text-lg font-semibold ${scoreColor(auditResult.overallScore)}`}>{auditResult.grade}</span>
                      <span className="text-muted-foreground">&middot;</span>
                      <span className={`text-sm font-medium ${scoreColor(auditResult.overallScore)}`}>{scoreLabel(auditResult.overallScore)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
                      {auditResult.overallScore >= 80
                        ? "Well-optimized for AI engine discovery and citation."
                        : auditResult.overallScore >= 60
                          ? "Solid foundation with room to improve AI visibility."
                          : auditResult.overallScore >= 40
                            ? "Key gaps exist — fix critical issues to improve rankings."
                            : "Significant improvements needed to appear in AI results."}
                    </p>
                    {auditResult.summary.failed > 0 && auditResult.overallScore < 80 && (
                      <p className="text-[10px] text-green-600 font-medium mt-2">
                        Potential: {Math.min(auditResult.overallScore + auditResult.issues.filter(i => i.status !== 'pass').reduce((s, i) => s + (i.maxScore - i.score), 0), 100)}/100 if all issues are fixed
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dimensions card */}
            <Card className="border border-gray-200 shadow-none py-0">
              <CardHeader className="bg-black text-white rounded-t-lg py-4">
                <CardTitle className="flex items-center gap-3 text-lg font-light text-white">
                  <BarChart3 className="h-5 w-5" /> Audit Dimensions
                </CardTitle>
                <CardDescription className="text-gray-300 font-light">Click any dimension to see detailed checks and recommendations</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <div className="divide-y divide-gray-50">
                  {auditResult.pillars.map(pillar => {
                    const meta = PILLAR_META[pillar.id]
                    const PillarIcon = meta?.icon || Globe
                    const pct = pillar.maxScore > 0 ? Math.round((pillar.score / pillar.maxScore) * 100) : 0
                    return (
                      <button key={pillar.id} type="button" className="flex items-center gap-3 w-full px-5 py-3 text-left hover:bg-gray-50 transition-colors" onClick={() => { setReportTab("details"); setExpandedPillar(pillar.id) }}>
                        <PillarIcon className={`h-4 w-4 shrink-0 ${meta?.color || "text-gray-400"}`} />
                        <span className="text-sm w-36 shrink-0 truncate">{pillar.name}</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${scoreBarColor(pct)}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm font-medium tabular-nums w-10 text-right">{pct}%</span>
                        <StatusIcon status={pillar.status} />
                        <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Critical alert */}
          {auditResult.summary.criticalIssues > 0 && (
            <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-red-200 bg-red-50/50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-700">
                  {auditResult.summary.criticalIssues} critical issue{auditResult.summary.criticalIssues !== 1 ? "s" : ""} need immediate action
                </span>
              </div>
              <Button variant="ghost" size="sm" className="text-red-600 h-7 text-xs hover:bg-red-100 hover:text-red-700" onClick={() => { setReportTab("recommendations"); setPriorityFilter("critical") }}>
                Fix now <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}

          {/* Quick wins */}
          {quickWins.length > 0 && (
            <Card className="border border-gray-200 shadow-none py-0">
              <CardHeader className="bg-black text-white rounded-t-lg py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-lg font-light text-white"><Zap className="h-5 w-5" /> Quick Wins</CardTitle>
                    <CardDescription className="text-gray-300 font-light">Low-effort improvements with the highest impact on your AI visibility</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-white/10 h-7 text-xs" onClick={() => setReportTab("recommendations")}>
                    View all <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-0">
                <div className="divide-y divide-gray-50">
                  {quickWins.map((win, i) => {
                    const qwPointsToGain = win.maxScore - win.score
                    return (
                    <div key={`qw-${win.id}-${i}`} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="h-7 w-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                          <Zap className="h-3.5 w-3.5 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-900">{win.name}</span>
                            <PriorityBadge priority={win.priority} />
                            {qwPointsToGain > 0 && (
                              <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">+{qwPointsToGain} pts</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{win.recommendation || win.details}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <ActionButton check={win} onNavigateToAction={navigateToAction} onHowToFix={openHowToFix} />
                          </div>
                        </div>
                      </div>
                    </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

        </TabsContent>

        {/* ── DETAILS TAB — sidenav layout ── */}
        <TabsContent value="details" className="mt-6">
          <div className="flex flex-col lg:flex-row gap-6 min-h-[500px]">
            {/* Sidenav */}
            <div className="lg:w-[260px] shrink-0">
              <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 lg:sticky lg:top-4 lg:self-start">
                <button type="button" onClick={() => setExpandedPillar('resources')} className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-left text-sm whitespace-nowrap transition-colors ${showResources ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="flex-1">Crawled Resources</span>
                  {auditResult.evidence && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${showResources ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                      {auditResult.evidence.crawledUrls.length}
                    </span>
                  )}
                </button>

                <div className="hidden lg:block border-t border-gray-100 my-1.5" />

                {auditResult.pillars.map(pillar => {
                  const meta = PILLAR_META[pillar.id]
                  const PillarIcon = meta?.icon || Globe
                  const pct = pillar.maxScore > 0 ? Math.round((pillar.score / pillar.maxScore) * 100) : 0
                  const isActive = expandedPillar === pillar.id || (!expandedPillar && !showResources && pillar.id === auditResult.pillars[0]?.id)
                  return (
                    <button key={pillar.id} type="button" onClick={() => setExpandedPillar(pillar.id)} className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-left text-sm whitespace-nowrap transition-colors ${isActive ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                      <PillarIcon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : (meta?.color || 'text-gray-400')}`} />
                      <span className="flex-1 truncate">{pillar.name}</span>
                      <span className={`text-xs tabular-nums ${isActive ? 'text-white/70' : 'text-gray-400'}`}>{pct}%</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Content panel */}
            <div className="flex-1 min-w-0">
              {showResources ? (
                <div className="space-y-4">
                  <div className="sticky top-0 z-10 bg-white pb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Crawled Resources</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pages and files we analyzed during your audit — including robots.txt, sitemap, and homepage.
                    </p>
                  </div>
                  <Card className="border border-gray-200 shadow-none">
                    <CardContent className="px-0 py-0">
                      <div className="divide-y divide-gray-50">
                        {auditResult.evidence?.crawledUrls.map((u, i) => (
                          <div key={i} className="flex items-center gap-3 px-5 py-2.5 text-xs hover:bg-gray-50 transition-colors">
                            {u.status === 'ok' ? <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />}
                            <span className="text-gray-500 capitalize w-20 shrink-0 text-[11px] font-medium uppercase tracking-wider">{u.type}</span>
                            {u.status === 'ok' ? (
                              <a href={u.url} target="_blank" rel="noopener noreferrer" className="text-gray-900 hover:underline truncate flex-1">{u.url}</a>
                            ) : (
                              <span className="text-gray-400 truncate flex-1">{u.url}</span>
                            )}
                            {u.status === 'ok' && <ExternalLink className="h-3 w-3 text-gray-400 shrink-0" />}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : activePillar && (
                <div className="space-y-5">
                  {/* Pillar header — sticky */}
                  <div className="sticky top-0 z-10 bg-white pb-4 -mb-1">
                    <div className="flex items-center gap-3">
                      <ActivePillarIcon className={`h-5 w-5 ${PILLAR_META[activePillar.id]?.color || 'text-gray-400'}`} />
                      <h3 className="text-lg font-semibold text-gray-900">{activePillar.name}</h3>
                      <StatusIcon status={activePillar.status} />
                      <span className={`text-sm font-medium tabular-nums ml-auto ${scoreColor(activePct)}`}>{activePct}%</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{activePillar.description}</p>
                    {activeRationale && (
                      <div className="mt-3 p-3 rounded-lg bg-blue-50/60 border border-blue-100">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-blue-800">Why this matters</p>
                            <p className="text-xs text-blue-700 mt-0.5">{activeRationale.why}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-100" />
                  </div>

                  {/* Score bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${scoreBarColor(activePct)}`} style={{ width: `${activePct}%` }} />
                    </div>
                    <span className="text-sm font-medium tabular-nums text-gray-500">{activePillar.score}/{activePillar.maxScore}</span>
                  </div>

                  {/* Checks */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Checks ({activePillar.checks.length})</h4>
                    {activePillar.checks.map(check => {
                      const checkEvidence = getCheckEvidence(check)
                      return (
                        <div key={check.id} className="p-4 rounded-lg border border-gray-200">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5"><StatusIcon status={check.status} /></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-gray-900">{check.name}</span>
                                <PriorityBadge priority={check.priority} />
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{check.effort}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{check.details}</p>
                              {check.recommendation && check.status !== "pass" && (
                                <div className="mt-2.5 p-2.5 rounded-md bg-amber-50 border border-amber-100">
                                  <div className="flex items-start gap-2">
                                    <Lightbulb className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                      <p className="text-xs text-gray-700">{check.recommendation}</p>
                                      <div className="mt-1.5">
                                        <ActionButton check={check} onNavigateToAction={navigateToAction} onHowToFix={openHowToFix} />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {checkEvidence.length > 0 && (
                                <div className="mt-2 space-y-0.5 border-l-2 border-gray-100 pl-3">
                                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Sources</span>
                                  {checkEvidence.slice(0, 5).map((ev, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5 text-xs">
                                      {ev.type === 'url' ? (
                                        <>
                                          <ExternalLink className="h-2.5 w-2.5 text-gray-400 shrink-0" />
                                          <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 hover:underline truncate">{ev.url}</a>
                                          {ev.label && <span className="text-gray-400 shrink-0">· {ev.label}</span>}
                                        </>
                                      ) : (
                                        <>
                                          <FileText className="h-2.5 w-2.5 text-gray-400 shrink-0" />
                                          <span className="text-gray-500">{ev.label}</span>
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 tabular-nums shrink-0">{check.score}/{check.maxScore}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Pillar evidence */}
                  {activeEvidence.length > 0 && (
                    <div className="p-4 rounded-lg border border-gray-200 bg-gray-50/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Search className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">All sources for {activePillar.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-500">{activeEvidence.length}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                        {activeEvidence.map((evItem, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs py-0.5">
                            <ExternalLink className="h-2.5 w-2.5 text-gray-400 shrink-0" />
                            <a href={evItem.url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 hover:underline truncate">{evItem.url}</a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── ACTIONS TAB — premium redesign with flyout tools ── */}
        <TabsContent value="recommendations">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Side nav */}
            <nav className="w-full lg:w-[200px] shrink-0 lg:sticky lg:top-4 lg:self-start">
              <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              {(["all", "critical", "high", "medium", "low"] as const).map(f => {
                const count = f === "all" ? auditResult.issues.length : auditResult.issues.filter(i => i.priority === f).length
                if (f !== "all" && count === 0) return null
                const colorDot: Record<string, string> = { critical: "bg-red-500", high: "bg-orange-500", medium: "bg-amber-400", low: "bg-blue-400" }
                // When on "all", highlight the priority section currently in view
                const isScrollActive = priorityFilter === "all" && f !== "all" && scrollActivePriority === f
                const isSelected = priorityFilter === f
                return (
                  <button
                    key={f}
                    onClick={() => {
                      if (priorityFilter === "all" && f !== "all") {
                        // Scroll to section instead of filtering
                        const section = issuesContainerRef.current?.querySelector(`[data-priority-section="${f}"]`)
                        if (section) {
                          section.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          return
                        }
                      }
                      setPriorityFilter(f)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
                      isSelected
                        ? "bg-black text-white"
                        : isScrollActive
                          ? "bg-gray-900/10 text-gray-900 ring-1 ring-gray-900/20"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {f !== "all" && <span className={`h-2 w-2 rounded-full ${isSelected ? "bg-white/60" : isScrollActive ? colorDot[f] : colorDot[f]}`} />}
                      {f === "all" ? "All issues" : f}
                    </span>
                    <span className={`tabular-nums ${isSelected ? "text-white/50" : isScrollActive ? "text-gray-700" : "text-gray-400"}`}>{count}</span>
                  </button>
                )
              })}
              </div>

              {/* Impact summary — desktop only */}
              {auditResult.issues.filter(i => i.status !== 'pass').length > 0 && (
                <div className="hidden lg:block mt-4 pt-4 border-t border-gray-100">
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-gray-500">Resolved</span>
                      <span className="font-medium text-gray-700 tabular-nums">{auditResult.issues.filter(i => i.status === 'pass').length}/{auditResult.issues.length}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${Math.round((auditResult.issues.filter(i => i.status === 'pass').length / auditResult.issues.length) * 100)}%` }} />
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Fixing {auditResult.issues.filter(i => i.status !== 'pass' && (i.priority === 'critical' || i.priority === 'high')).length} high-impact issues could add up to <span className="font-medium text-gray-600">{Math.min(30, auditResult.issues.filter(i => i.status !== 'pass').reduce((s, i) => s + (i.maxScore - i.score), 0))} pts</span>
                  </p>
                </div>
              )}
            </nav>

            {/* Issues list */}
            <div className="flex-1 min-w-0" ref={issuesContainerRef}>
              {filteredIssues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-green-50 flex items-center justify-center">
                    <CheckCircle className="h-7 w-7 text-green-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">{priorityFilter === "all" ? "No issues found" : `No ${priorityFilter} priority issues`}</p>
                    <p className="text-xs text-gray-500 mt-1">{priorityFilter === "all" ? "Your site is well-optimized for AI engines." : "Try checking other priority levels."}</p>
                  </div>
                </div>
              ) : (
            <div className="space-y-3">
              {filteredIssues.map((issue, i) => {
                // Insert priority section header when priority changes (in "all" view)
                const prevPriority = i > 0 ? filteredIssues[i - 1].priority : null
                const showSectionHeader = priorityFilter === "all" && issue.priority !== prevPriority
                const sectionColorBar: Record<string, string> = { critical: "bg-red-500", high: "bg-orange-500", medium: "bg-amber-400", low: "bg-blue-400" }
                const sectionCount = priorityFilter === "all" ? filteredIssues.filter(x => x.priority === issue.priority).length : 0

                const isCrawlIssue = issue.category?.toLowerCase().includes('crawl') || issue.id?.toLowerCase().includes('robot') || issue.id?.toLowerCase().includes('sitemap') || issue.id?.toLowerCase().includes('crawler')
                const isSchemaIssue = issue.category?.toLowerCase().includes('schema') || issue.category?.toLowerCase().includes('structured') || issue.id?.toLowerCase().includes('schema') || issue.id?.toLowerCase().includes('json-ld')
                const hasTool = (isCrawlIssue || isSchemaIssue) && issue.status !== 'pass'
                const hasContentAssist = isContentAssistIssue(issue)
                const pointsToGain = issue.maxScore - issue.score
                const isCopied = copiedId === issue.id

                return (
                  <React.Fragment key={`issue-${issue.id}-${i}`}>
                  {showSectionHeader && (
                    <div
                      data-priority-section={issue.priority}
                      className={`flex items-center gap-3 ${i > 0 ? 'pt-4' : ''} pb-1 scroll-mt-20`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${sectionColorBar[issue.priority] || 'bg-gray-400'}`} />
                      <span className="text-xs font-semibold text-gray-900 uppercase tracking-wider capitalize">{issue.priority}</span>
                      <span className="text-[10px] text-gray-400 tabular-nums">{sectionCount}</span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                  )}
                  <div
                    className={`group relative rounded-xl border transition-all duration-200 ${
                      issue.status === 'pass'
                        ? 'border-green-100 bg-green-50/30'
                        : issue.priority === 'critical'
                          ? 'border-red-200 bg-white hover:border-red-300'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Status indicator */}
                        <div className={`mt-0.5 shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${
                          issue.status === 'pass' ? 'bg-green-100' : issue.status === 'fail' ? 'bg-red-50' : 'bg-amber-50'
                        }`}>
                          <StatusIcon status={issue.status} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-gray-900">{issue.name}</span>
                                <PriorityBadge priority={issue.priority} />
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{issue.category}</span>
                                <span className="text-gray-200">·</span>
                                <span className="text-[10px] text-gray-400">{issue.effort} effort</span>
                                {pointsToGain > 0 && issue.status !== 'pass' && (
                                  <>
                                    <span className="text-gray-200">·</span>
                                    <span className="text-[10px] font-medium text-green-600">+{pointsToGain} pts potential</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <span className={`text-sm font-bold tabular-nums shrink-0 ${issue.status === 'pass' ? 'text-green-600' : 'text-gray-300'}`}>
                              {issue.score}/{issue.maxScore}
                            </span>
                          </div>

                          <p className="text-xs text-gray-500 mt-2 leading-relaxed">{issue.details}</p>

                          {/* Recommendation box */}
                          {issue.recommendation && issue.status !== 'pass' && (
                            <div className="mt-3 p-3.5 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-100/80">
                              <div className="flex items-start gap-2.5">
                                <div className="h-5 w-5 rounded-md bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                                  <Lightbulb className="h-3 w-3 text-amber-700" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider mb-1">Recommended fix</p>
                                  <p className="text-xs text-gray-700 leading-relaxed">{issue.recommendation}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Action buttons */}
                          {issue.status !== 'pass' && (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                              {hasTool && (
                                <Button
                                  size="sm"
                                  className="h-8 text-xs gap-1.5 rounded-lg"
                                  onClick={() => openToolFlyout(issue)}
                                >
                                  <Wrench className="h-3 w-3" />
                                  {isCrawlIssue ? "Open robots.txt Generator" : "Open Schema Generator"}
                                  <ArrowUpRight className="h-3 w-3 opacity-50" />
                                </Button>
                              )}
                              {hasContentAssist && (
                                <Button
                                  size="sm"
                                  variant={hasTool ? "outline" : "default"}
                                  className={`h-8 text-xs gap-1.5 rounded-lg ${hasTool ? 'border-gray-200' : ''}`}
                                  onClick={() => openContentAssist(issue)}
                                >
                                  <PenLine className="h-3 w-3" />
                                  Draft Content
                                  <ArrowUpRight className="h-3 w-3 opacity-50" />
                                </Button>
                              )}
                              {issue.recommendation && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs gap-1.5 rounded-lg border-gray-200"
                                  onClick={() => openHowToFix(issue)}
                                >
                                  <Lightbulb className="h-3 w-3" /> How to fix
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Impact bar at bottom for failing issues */}
                    {issue.status !== 'pass' && pointsToGain > 0 && (
                      <div className="px-5 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-400 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, (pointsToGain / issue.maxScore) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400 shrink-0">Impact</span>
                        </div>
                      </div>
                    )}
                  </div>
                  </React.Fragment>
                )
              })}
            </div>
          )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── TOOL FLYOUT — robots.txt Generator ── */}
      <Sheet open={toolFlyout.type === 'robots'} onOpenChange={open => { if (!open) closeFlyout() }}>
        <SheetContent side="right" className="overflow-y-auto p-0 sm:max-w-lg md:max-w-xl">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
            <div className="px-6 py-5">
              <SheetHeader className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <SheetTitle className="text-base">robots.txt Generator</SheetTitle>
                    <SheetDescription className="text-xs">Control which AI bots can crawl and index your site</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
            </div>
          </div>

          <div className="px-6 py-5 space-y-6">
            {/* Explainer */}
            <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  Your robots.txt file tells AI crawlers whether they can access your content.
                  Toggle each bot on to allow access, or off to block it. Then generate the file and paste it at your website root.
                </p>
              </div>
            </div>

            {/* Crawler toggles */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">AI Crawlers</h4>
              <div className="grid grid-cols-1 gap-2">
                {AI_CRAWLERS.map(crawler => {
                  const isAllowed = crawlerConfig[crawler.configKey] ?? true
                  return (
                    <div key={crawler.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                      isAllowed ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-gray-50/30'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isAllowed ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <Bot className={`h-4 w-4 ${isAllowed ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{crawler.name}</div>
                          <div className="text-[11px] text-gray-500">{crawler.company}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium uppercase tracking-wider ${isAllowed ? 'text-green-600' : 'text-gray-400'}`}>
                          {isAllowed ? 'Allowed' : 'Blocked'}
                        </span>
                        <Switch
                          checked={isAllowed}
                          onCheckedChange={checked => setCrawlerConfig(prev => ({ ...prev, [crawler.configKey]: checked }))}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Brand context */}
            {(currentBrand?.company_website || auditResult?.siteUrl) && (
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{currentBrand?.name}</p>
                    <p className="text-[11px] text-gray-500 truncate">{currentBrand?.company_website || auditResult?.siteUrl}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sitemap input */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Sitemap URL</Label>
              <Input
                placeholder={`${(currentBrand?.company_website || auditResult?.siteUrl || 'https://yourdomain.com').replace(/\/$/, '')}/sitemap.xml`}
                value={sitemapUrl}
                onChange={e => setSitemapUrl(e.target.value)}
                className="h-10 text-sm"
              />
              <p className="text-[11px] text-gray-400">Optional — adds a Sitemap directive to help bots find your pages faster</p>
            </div>

            {/* Generate button */}
            <Button className="w-full h-11 text-sm gap-2" onClick={handleGenerateRobots} disabled={generatingRobots}>
              {generatingRobots ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                <><Shield className="h-4 w-4" /> Generate robots.txt</>
              )}
            </Button>

            {/* Generated output */}
            {generatedRobotsTxt && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-semibold text-gray-900">Generated — Ready to use</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-7 text-xs gap-1.5 rounded-lg transition-all duration-300 ${
                      copiedId === 'robots-txt' ? 'bg-green-50 border-green-200 text-green-700' : 'border-gray-200'
                    }`}
                    onClick={() => copyToClipboard(generatedRobotsTxt, 'robots-txt')}
                  >
                    {copiedId === 'robots-txt' ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                  </Button>
                </div>
                <pre className="bg-gray-950 text-green-400 p-4 rounded-xl text-xs overflow-x-auto whitespace-pre-wrap font-mono max-h-64 leading-relaxed">
                  {generatedRobotsTxt}
                </pre>
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    <span className="font-semibold text-gray-700">Next step:</span> Save this file as <code className="px-1 py-0.5 rounded bg-gray-200 text-gray-700 font-mono text-[10px]">robots.txt</code> in the root directory of your website, then re-run your audit to verify.
                  </p>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── TOOL FLYOUT — Schema Generator ── */}
      <Sheet open={toolFlyout.type === 'schema'} onOpenChange={open => { if (!open) closeFlyout() }}>
        <SheetContent side="right" className="overflow-y-auto p-0 sm:max-w-lg md:max-w-xl">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
            <div className="px-6 py-5">
              <SheetHeader className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
                    <Code2 className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <SheetTitle className="text-base">Schema Markup Generator</SheetTitle>
                    <SheetDescription className="text-xs">Create structured data to help AI engines understand your content</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
            </div>
          </div>

          <div className="px-6 py-5 space-y-6">
            {/* Brand context */}
            {(currentBrand?.company_website || auditResult?.siteUrl) && (
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                    {currentBrand?.logo_url ? (
                      <img src={currentBrand.logo_url} alt="" className="h-5 w-5 rounded object-contain" />
                    ) : (
                      <Building2 className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{currentBrand?.company_name || currentBrand?.name}</p>
                    <p className="text-[11px] text-gray-500 truncate">{currentBrand?.company_website || auditResult?.siteUrl}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Explainer */}
            <div className="p-3 rounded-lg bg-violet-50/60 border border-violet-100">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-3.5 w-3.5 text-violet-600 shrink-0 mt-0.5" />
                <p className="text-xs text-violet-700 leading-relaxed">
                  Schema markup (JSON-LD) helps AI search engines understand what your content is about.
                  Choose a template, fill in your details, and add the generated code to your site&rsquo;s <code className="px-1 py-0.5 rounded bg-violet-100 text-violet-800 font-mono text-[10px]">&lt;head&gt;</code> tag.
                </p>
              </div>
            </div>

            {/* Template picker */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Choose a Schema Type</h4>
              <div className="grid grid-cols-2 gap-2">
                {SCHEMA_TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className={`p-3.5 rounded-xl border text-left transition-all duration-200 ${
                      selectedTemplate === t.id
                        ? "border-black bg-black text-white"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      setSelectedTemplate(t.id)
                      setGeneratedSchema("")
                      // Auto-prefill form fields from brand data
                      const prefilled: Record<string, string> = {}
                      if (t.id === 'organization') {
                        if (currentBrand?.company_name || currentBrand?.name) prefilled.name = currentBrand?.company_name || currentBrand?.name || ''
                        if (currentBrand?.company_website) prefilled.url = currentBrand.company_website
                        if (currentBrand?.logo_url) prefilled.logo = currentBrand.logo_url
                        if (currentBrand?.description) prefilled.description = currentBrand.description
                      } else if (t.id === 'local_business') {
                        if (currentBrand?.company_name || currentBrand?.name) prefilled.name = currentBrand?.company_name || currentBrand?.name || ''
                        if (currentBrand?.company_location) prefilled.city = currentBrand.company_location
                      } else if (t.id === 'service' || t.id === 'product') {
                        if (currentBrand?.company_name || currentBrand?.name) prefilled.provider = currentBrand?.company_name || currentBrand?.name || ''
                      } else if (t.id === 'article') {
                        if (currentBrand?.company_name || currentBrand?.name) prefilled.publisher = currentBrand?.company_name || currentBrand?.name || ''
                      }
                      setFormData(prefilled)
                    }}
                  >
                    <div className={`text-sm font-medium ${selectedTemplate === t.id ? 'text-white' : 'text-gray-900'}`}>{t.name}</div>
                    <div className={`text-[11px] mt-0.5 ${selectedTemplate === t.id ? 'text-white/70' : 'text-gray-500'}`}>{t.desc}</div>
                    <span className={`inline-block text-[10px] font-semibold mt-2 px-2 py-0.5 rounded-full ${
                      selectedTemplate === t.id
                        ? 'bg-white/20 text-white'
                        : t.impact === "Very High"
                          ? "bg-green-100 text-green-700"
                          : t.impact === "High"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                    }`}>
                      {t.impact}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fields */}
            {selectedTemplate && (
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Fill in Details</h4>
                <div className="grid grid-cols-1 gap-3">
                  {(TEMPLATE_FIELDS[selectedTemplate] || []).map(field => (
                    <div key={field.key} className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-700">{field.label}</Label>
                      <Input
                        type={field.type || "text"}
                        placeholder={field.placeholder}
                        value={formData[field.key] || ""}
                        onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="h-10 text-sm"
                      />
                    </div>
                  ))}
                </div>
                <Button className="w-full h-11 text-sm gap-2" onClick={handleGenerateSchema} disabled={generatingSchema}>
                  {generatingSchema ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    <><FileCode className="h-4 w-4" /> Generate JSON-LD</>
                  )}
                </Button>
              </div>
            )}

            {/* Generated output */}
            {generatedSchema && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-semibold text-gray-900">Generated — Ready to use</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-7 text-xs gap-1.5 rounded-lg transition-all duration-300 ${
                      copiedId === 'schema-json' ? 'bg-green-50 border-green-200 text-green-700' : 'border-gray-200'
                    }`}
                    onClick={() => copyToClipboard(generatedSchema, 'schema-json')}
                  >
                    {copiedId === 'schema-json' ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                  </Button>
                </div>
                <pre className="bg-gray-950 text-emerald-400 p-4 rounded-xl text-xs overflow-x-auto whitespace-pre-wrap font-mono max-h-72 leading-relaxed">
                  {generatedSchema}
                </pre>
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    <span className="font-semibold text-gray-700">Next step:</span> Add this <code className="px-1 py-0.5 rounded bg-gray-200 text-gray-700 font-mono text-[10px]">&lt;script type=&quot;application/ld+json&quot;&gt;</code> block inside your page&rsquo;s <code className="px-1 py-0.5 rounded bg-gray-200 text-gray-700 font-mono text-[10px]">&lt;head&gt;</code> tag, then re-run the audit to verify.
                  </p>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── TOOL FLYOUT — Content Assistant ── */}
      <Sheet open={toolFlyout.type === 'content-assist'} onOpenChange={open => { if (!open) closeFlyout() }}>
        <SheetContent side="right" className="overflow-y-auto p-0 sm:max-w-lg md:max-w-xl lg:max-w-2xl">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
            <div className="px-6 py-5">
              <SheetHeader className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <PenLine className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <SheetTitle className="text-base">AI Content Assistant</SheetTitle>
                    <SheetDescription className="text-xs">Generate personalized content to improve your AI visibility</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
            </div>
          </div>

          <div className="px-6 py-5 space-y-6">
            {/* Brand context */}
            {(currentBrand?.company_website || auditResult?.siteUrl) && (
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                    {currentBrand?.logo_url ? (
                      <img src={currentBrand.logo_url} alt="" className="h-5 w-5 rounded object-contain" />
                    ) : (
                      <Building2 className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{currentBrand?.company_name || currentBrand?.name}</p>
                    <p className="text-[11px] text-gray-500 truncate">{currentBrand?.company_website || auditResult?.siteUrl}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Issue context */}
            {activeIssueForContent && (
              <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-emerald-800">{activeIssueForContent.name}</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                      {activeIssueForContent.recommendation || activeIssueForContent.details}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Evidence sources — show relevant URLs from the audit */}
            {(() => {
              const sources: Array<{ url: string; title?: string }> = []
              if (activeIssueForContent?.metadata) {
                const md = activeIssueForContent.metadata
                const listFields = ['topMentions', 'topThreads', 'reviews', 'topResults'] as const
                for (const field of listFields) {
                  if (Array.isArray(md[field])) {
                    for (const item of (md[field] as Array<{ url: string; title?: string }>).slice(0, 4)) {
                      sources.push({ url: item.url, title: item.title })
                    }
                  }
                }
              }
              if (auditResult?.evidence && activeIssueForContent) {
                const cat = activeIssueForContent.category
                if (cat.includes('source') || cat.includes('content-authority')) {
                  auditResult.evidence.exaMentions.slice(0, 3).forEach(m => {
                    if (!sources.some(s => s.url === m.url)) sources.push({ url: m.url, title: m.title })
                  })
                }
                if (cat.includes('social')) {
                  auditResult.evidence.redditThreads.slice(0, 2).forEach(r => {
                    if (!sources.some(s => s.url === r.url)) sources.push({ url: r.url, title: r.title })
                  })
                  auditResult.evidence.reviewListings.slice(0, 2).forEach(r => {
                    if (!sources.some(s => s.url === r.url)) sources.push({ url: r.url, title: r.title })
                  })
                }
                if (cat.includes('knowledge')) {
                  auditResult.evidence.serpResults.slice(0, 2).forEach(r => {
                    if (!sources.some(s => s.url === r.url)) sources.push({ url: r.url, title: r.title })
                  })
                }
              }
              if (sources.length === 0) return null
              return (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Search className="h-3 w-3 text-gray-400" /> Relevant Sources
                  </h4>
                  <div className="space-y-1.5">
                    {sources.slice(0, 6).map((s, idx) => {
                      let domain = ''
                      try { domain = new URL(s.url).hostname.replace('www.', '') } catch { domain = s.url }
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setContentTarget(domain)}
                          className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                            contentTarget === domain
                              ? 'border-emerald-300 bg-emerald-50'
                              : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <ExternalLink className="h-3 w-3 text-gray-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">{domain}</p>
                            {s.title && <p className="text-[10px] text-gray-500 truncate">{s.title}</p>}
                          </div>
                          {contentTarget === domain && <Check className="h-3 w-3 text-emerald-600 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[11px] text-gray-400">Click a source to target your content towards that domain</p>
                </div>
              )
            })()}

            {/* Content type picker */}
            {activeIssueForContent && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">What do you need?</h4>
                <div className="grid grid-cols-1 gap-2">
                  {getContentTypesForIssue(activeIssueForContent).map(ct => {
                    const TypeIcon = ct.icon
                    return (
                      <button
                        key={ct.id}
                        type="button"
                        onClick={() => { setContentType(ct.id); setGeneratedContent("") }}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 ${
                          contentType === ct.id
                            ? "border-black bg-black text-white"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                          contentType === ct.id ? 'bg-white/20' : 'bg-gray-100'
                        }`}>
                          <TypeIcon className={`h-4 w-4 ${contentType === ct.id ? 'text-white' : 'text-gray-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${contentType === ct.id ? 'text-white' : 'text-gray-900'}`}>{ct.label}</p>
                          <p className={`text-[11px] ${contentType === ct.id ? 'text-white/60' : 'text-gray-500'}`}>{ct.desc}</p>
                        </div>
                        {contentType === ct.id && <Check className="h-4 w-4 text-white/60 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Target domain input (if not selected from sources) */}
            {contentType && (contentType === 'outreach-email' || contentType === 'guest-post-pitch' || contentType === 'partnership-proposal') && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Target Domain {contentTarget && <span className="text-gray-400 normal-case font-normal">(or select from sources above)</span>}
                </Label>
                <Input
                  placeholder="e.g. techcrunch.com, industry-blog.com"
                  value={contentTarget}
                  onChange={e => setContentTarget(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
            )}

            {/* Generate button */}
            {contentType && (
              <Button
                className="w-full h-11 text-sm gap-2"
                onClick={handleGenerateContent}
                disabled={generatingContent}
              >
                {generatingContent ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating draft...</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Generate Draft</>
                )}
              </Button>
            )}

            {/* Generated output */}
            {generatedContent && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-semibold text-gray-900">Draft Ready</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-7 text-xs gap-1.5 rounded-lg transition-all duration-300 ${
                      copiedId === 'content-draft' ? 'bg-green-50 border-green-200 text-green-700' : 'border-gray-200'
                    }`}
                    onClick={() => copyToClipboard(generatedContent, 'content-draft')}
                  >
                    {copiedId === 'content-draft' ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                  </Button>
                </div>
                <div className="bg-gray-950 p-5 rounded-xl overflow-x-auto max-h-96">
                  <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed font-sans">
                    {generatedContent}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    <span className="font-semibold text-gray-700">Remember:</span> Review and personalize before sending.
                    AI-generated drafts are a starting point — add your authentic voice and any specific details that make it genuinely valuable.
                  </p>
                </div>
                {/* Regenerate */}
                <Button
                  variant="outline"
                  className="w-full h-9 text-xs gap-1.5 border-gray-200"
                  onClick={handleGenerateContent}
                  disabled={generatingContent}
                >
                  <RefreshCw className={`h-3 w-3 ${generatingContent ? 'animate-spin' : ''}`} />
                  Regenerate with different angle
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── TOOL FLYOUT — How to Fix ── */}
      <Sheet open={toolFlyout.type === 'how-to-fix'} onOpenChange={open => { if (!open) closeFlyout() }}>
        <SheetContent side="right" className="overflow-y-auto p-0 sm:max-w-lg md:max-w-xl lg:max-w-2xl">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
            <div className="px-6 py-5">
              <SheetHeader className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Lightbulb className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <SheetTitle className="text-base">How to Fix</SheetTitle>
                    <SheetDescription className="text-xs">Step-by-step implementation guide</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Issue context */}
            {activeIssueForHowTo && (
              <div className="p-4 rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50/80 to-orange-50/40">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="h-4 w-4 text-amber-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-gray-900">{activeIssueForHowTo.name}</p>
                      <PriorityBadge priority={activeIssueForHowTo.priority} />
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{activeIssueForHowTo.details}</p>
                    {activeIssueForHowTo.recommendation && (
                      <div className="mt-2 pt-2 border-t border-amber-100">
                        <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider mb-0.5">Recommendation</p>
                        <p className="text-xs text-gray-700 leading-relaxed">{activeIssueForHowTo.recommendation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Loading state */}
            {generatingHowTo && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-amber-600 animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">Generating implementation guide</p>
                  <p className="text-xs text-gray-500 mt-1">Analyzing issue and building step-by-step instructions...</p>
                </div>
              </div>
            )}

            {/* Guide output */}
            {howToGuide && !generatingHowTo && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-semibold text-gray-900">Guide Ready</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-7 text-xs gap-1.5 rounded-lg transition-all duration-300 ${
                      copiedId === 'how-to-guide' ? 'bg-green-50 border-green-200 text-green-700' : 'border-gray-200'
                    }`}
                    onClick={() => copyToClipboard(howToGuide, 'how-to-guide')}
                  >
                    {copiedId === 'how-to-guide' ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                  </Button>
                </div>
                <div className="bg-white border border-gray-200 p-6 rounded-xl overflow-x-auto">
                  <div className="text-sm text-gray-800 leading-relaxed space-y-3">
                    {howToGuide.split('\n').map((line, i) => {
                      const trimmed = line.trim()
                      if (!trimmed || trimmed === '---') return trimmed === '---' ? <hr key={i} className="my-4 border-gray-200" /> : null
                      // H2
                      if (trimmed.startsWith('## ')) return <h3 key={i} className="text-base font-semibold text-gray-900 mt-5 mb-1">{trimmed.replace(/^## /, '').replace(/\*\*/g, '')}</h3>
                      // H1
                      if (trimmed.startsWith('# ')) return <h2 key={i} className="text-lg font-bold text-gray-900 mb-2">{trimmed.replace(/^# /, '').replace(/\*\*/g, '')}</h2>
                      // Numbered list items
                      if (/^\d+\.\s/.test(trimmed)) {
                        const content = trimmed.replace(/^\d+\.\s/, '')
                        return (
                          <div key={i} className="flex gap-3 items-start ml-1">
                            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                              {trimmed.match(/^(\d+)\./)?.[1]}
                            </span>
                            <p className="flex-1" dangerouslySetInnerHTML={{ __html: content
                              .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                              .replace(/`(.*?)`/g, '<code class="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
                              .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline underline-offset-2">$1</a>')
                            }} />
                          </div>
                        )
                      }
                      // Bullet items
                      if (trimmed.startsWith('- ')) {
                        const content = trimmed.replace(/^- /, '')
                        return (
                          <div key={i} className="flex gap-2.5 items-start ml-6">
                            <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-gray-400 mt-2" />
                            <p className="flex-1" dangerouslySetInnerHTML={{ __html: content
                              .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                              .replace(/`(.*?)`/g, '<code class="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
                              .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline underline-offset-2">$1</a>')
                            }} />
                          </div>
                        )
                      }
                      // Italic note
                      if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
                        return <p key={i} className="text-xs text-gray-500 italic mt-3">{trimmed.replace(/^\*|\*$/g, '')}</p>
                      }
                      // Regular paragraph
                      return (
                        <p key={i} dangerouslySetInnerHTML={{ __html: trimmed
                          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                          .replace(/`(.*?)`/g, '<code class="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
                          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline underline-offset-2">$1</a>')
                        }} />
                      )
                    })}
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full h-9 text-xs gap-1.5 border-gray-200"
                  onClick={() => activeIssueForHowTo && generateHowToGuide(activeIssueForHowTo)}
                  disabled={generatingHowTo}
                >
                  <RefreshCw className={`h-3 w-3 ${generatingHowTo ? 'animate-spin' : ''}`} />
                  Regenerate guide
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      </div>
    </div>
    </TooltipProvider>
  )
}
