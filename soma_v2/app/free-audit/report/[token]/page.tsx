"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import BrandVisibilityAuditReport from "@/components/reports/brand-visibility-audit-report"
import {
  Search, Shield, Loader2, AlertTriangle, RefreshCw,
  CheckCircle, Crown, ArrowRight, X
} from "lucide-react"

interface AuditReport {
  id: string
  brandName: string
  brandWebsite: string | null
  industry: string | null
  status: "pending" | "running" | "completed" | "failed"
  results: Record<string, any> | null
  createdAt: string
  expiresAt: string
  isClaimed: boolean
  brandId: string | null
}

// ============================================================================
// MAIN REPORT PAGE
// ============================================================================
export default function FreeAuditReportPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [report, setReport] = useState<AuditReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [pollCount, setPollCount] = useState(0)

  const fetchReport = useCallback(async () => {
    try {
      const res = await fetch(`/api/onboarding/free-audit/${token}`)
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Report not found")
        setLoading(false)
        return
      }
      const data = await res.json()
      setReport(data.report)
      setLoading(false)
    } catch {
      setError("Failed to load report")
      setLoading(false)
    }
  }, [token])

  // Initial load
  useEffect(() => { fetchReport() }, [fetchReport])

  // Poll while pending/running
  useEffect(() => {
    if (!report || (report.status !== "pending" && report.status !== "running")) return
    if (pollCount > 60) return // Stop after ~5 min

    const timer = setTimeout(() => {
      fetchReport()
      setPollCount((c) => c + 1)
    }, 5000)
    return () => clearTimeout(timer)
  }, [report, pollCount, fetchReport])

  // ── Loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your report...</p>
        </div>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-950 mb-2">Report Not Found</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link href="/free-audit">
            <Button>Run a New Audit</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!report) return null

  // ── Processing state ───────────────────────────────────────────────
  if (report.status === "pending" || report.status === "running") {
    return (
      <div className="min-h-screen bg-white">
        <ReportHeader brandName={report.brandName} />
        <div className="max-w-3xl mx-auto px-4 py-20">
          <div className="text-center">
            <div className="relative h-20 w-20 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-gray-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-t-gray-950 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-950 mb-3">
              Analyzing {report.brandName}
            </h2>
            <p className="text-gray-500 max-w-md mx-auto mb-8">
              We&apos;re querying ChatGPT, Gemini, and Grok to discover how they perceive your brand. This typically takes 1-2 minutes.
            </p>
            <div className="max-w-sm mx-auto space-y-3 text-left">
              {[
                { label: "Prompts prepared", done: pollCount > 1 },
                { label: "Querying AI models", done: pollCount > 6 },
                { label: "Analyzing responses", done: pollCount > 10 },
                { label: "Building your report", done: false },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  {step.done ? (
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <div className="h-5 w-5 border-2 border-gray-200 rounded-full flex-shrink-0 flex items-center justify-center">
                      {i === [true, pollCount > 1, pollCount > 6, pollCount > 10].filter(Boolean).length ? (
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-pulse" />
                      ) : null}
                    </div>
                  )}
                  <span className={`text-sm ${step.done ? "text-gray-500" : "text-gray-400"}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Failed state ───────────────────────────────────────────────────
  if (report.status === "failed") {
    return (
      <div className="min-h-screen bg-white">
        <ReportHeader brandName={report.brandName} />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-950 mb-3">Audit couldn&apos;t be completed</h2>
          <p className="text-gray-500 mb-6">Our AI models encountered an issue. Please try again.</p>
          <Link href="/free-audit">
            <Button>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // ── Completed — render the same report component as onboarding/dashboard ──
  if (!report.results) return null

  return (
    <div className="min-h-screen bg-white">
      {/* Plan Selection Modal */}
      {showPlanModal && (
        <PlanSelectionModal
          accessToken={token}
          brandName={report.brandName}
          onClose={() => setShowPlanModal(false)}
        />
      )}

      {/* The same report component used in onboarding and dashboard */}
      <BrandVisibilityAuditReport
        auditResults={report.results}
        brandName={report.brandName}
        brandId={report.brandId || undefined}
        freeAuditToken={report.brandId ? token : undefined}
        isOnboarding={false}
        isFreeAudit={true}
        onBack={() => router.push("/free-audit")}
        onStartOver={() => router.push("/free-audit")}
        onSignOut={() => router.push("/")}
      />
    </div>
  )
}

// ============================================================================
// REPORT HEADER
// ============================================================================
function ReportHeader({ brandName }: { brandName: string }) {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 bg-black rounded text-white flex items-center justify-center text-sm font-bold">
            S
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight">Soma AI</span>
            <span className="text-[10px] text-gray-400 font-medium tracking-wider">AEO PLATFORM</span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:inline">
            Report for <span className="font-medium text-gray-700">{brandName}</span>
          </span>
          <Link href="/signup">
            <Button size="sm" className="bg-gray-950 hover:bg-gray-800 text-white font-medium">
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}

// ============================================================================
// PLAN SELECTION MODAL
// ============================================================================
function PlanSelectionModal({
  accessToken,
  brandName,
  onClose,
}: {
  accessToken: string
  brandName: string
  onClose: () => void
}) {
  const router = useRouter()

  const plans = [
    {
      name: "Growth",
      price: "$99",
      period: "/month",
      tier: "growth",
      popular: true,
      features: [
        "1 brand",
        "20 prompts per brand",
        "10 competitors tracked",
        "500 runs/month",
        "ChatGPT, Gemini, Grok",
        "Weekly AI visibility reports",
        "Sentiment analysis",
        "Export reports",
      ],
    },
    {
      name: "Pro",
      price: "$249",
      period: "/month",
      tier: "pro",
      popular: false,
      features: [
        "5 brands",
        "100 prompts per brand",
        "50 competitors tracked",
        "5,000 runs/month",
        "All AI models",
        "Daily reports + API access",
        "Advanced analytics",
        "Scheduled reports",
        "Webhook integrations",
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      tier: "enterprise",
      popular: false,
      features: [
        "Unlimited brands",
        "Unlimited prompts",
        "Unlimited competitors",
        "Unlimited runs",
        "All models + custom",
        "White-label reports",
        "SSO & priority support",
        "Dedicated account manager",
      ],
    },
  ]

  const handleSelectPlan = (tier: string) => {
    sessionStorage.setItem("free_audit_claim_token", accessToken)
    sessionStorage.setItem("free_audit_token", accessToken)
    try { localStorage.setItem("soma_audit_token", accessToken) } catch {}
    sessionStorage.setItem("free_audit_brand_name", brandName)
    router.push(`/signup?plan=${tier}&source=free-audit&redirect_url=/free-audit/activate`)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-950">Unlock full AI visibility</h2>
            <p className="text-sm text-gray-500">Choose a plan to get started</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.tier}
                className={`rounded-xl border p-6 relative ${
                  plan.popular ? "border-gray-950 ring-1 ring-gray-950" : "border-gray-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gray-950 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <h3 className="text-lg font-bold text-gray-950">{plan.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold text-gray-950">{plan.price}</span>
                  <span className="text-gray-400 text-sm">{plan.period}</span>
                </div>

                <Button
                  onClick={() => handleSelectPlan(plan.tier)}
                  className={`w-full mb-5 ${
                    plan.popular
                      ? "bg-gray-950 hover:bg-gray-800 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-950"
                  }`}
                >
                  {plan.tier === "enterprise" ? "Contact Sales" : "Get Started"}
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>

                <ul className="space-y-2.5">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              14-day free trial
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              Cancel anytime
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              SOC 2 compliant
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
