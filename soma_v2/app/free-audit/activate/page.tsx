"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function FreeAuditActivatePage() {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()
  const [status, setStatus] = useState<"loading" | "activating" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      // Not signed in — redirect to signup
      router.push("/signup?source=free-audit&redirect_url=/free-audit/activate")
      return
    }

    // Retrieve audit token from storage
    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("free_audit_token") ||
          sessionStorage.getItem("free_audit_claim_token") ||
          localStorage.getItem("soma_audit_token")
        : null

    // Call claim-and-setup API — works with token (same device) or without (email fallback for cross-device)
    setStatus("activating")

    fetch("/api/onboarding/free-audit/claim-and-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: token || null }),
    })
      .then(async (res) => {
        const data = await res.json()

        if (!res.ok) {
          // If report already claimed or not found, user may already have an account — go to dashboard
          if (res.status === 404) {
            // If there was no token either, this is a fresh signup — go to onboarding
            if (!token) {
              router.push("/onboarding")
              return
            }
            router.push("/dashboard")
            return
          }
          throw new Error(data.error || "Setup failed")
        }

        // Clean up stored tokens
        try { sessionStorage.removeItem("free_audit_token") } catch {}
        try { sessionStorage.removeItem("free_audit_claim_token") } catch {}
        try { localStorage.removeItem("soma_audit_token") } catch {}

        // Redirect to dashboard with brand context
        const brandId = data.brand?.id
        const redirectUrl = brandId
          ? `/dashboard?brand=${brandId}&claimed_audit=true`
          : "/dashboard?claimed_audit=true"

        router.push(redirectUrl)
      })
      .catch((err) => {
        console.error("Free audit activation error:", err)
        setStatus("error")
        setErrorMessage(err.message || "Something went wrong. Please try again.")
      })
  }, [isLoaded, isSignedIn, router])

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-950 mb-3">Something went wrong</h1>
          <p className="text-gray-500 mb-6">{errorMessage}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/free-audit">
              <Button variant="outline">Run a Free Audit</Button>
            </Link>
            <Link href="/onboarding">
              <Button className="bg-gray-950 text-white hover:bg-gray-800">
                Continue to Onboarding
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-950 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-950 mb-2">Setting up your dashboard</h1>
        <p className="text-gray-500">
          {status === "loading"
            ? "Checking your account..."
            : "Importing your audit report..."}
        </p>
      </div>
    </div>
  )
}
