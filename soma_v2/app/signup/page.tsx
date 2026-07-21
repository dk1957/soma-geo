"use client"

import { Suspense, useState, useEffect, useRef } from "react"
import { SignUp, useAuth } from "@clerk/nextjs"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"

function SignUpContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()
  const redirectUrl = searchParams.get('redirect_url') || '/onboarding'
  const [isClerkLoaded, setIsClerkLoaded] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const formContainerRef = useRef<HTMLDivElement>(null)

  // Handle redirect after sign up
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setIsRedirecting(true)
      router.push(redirectUrl)
    }
  }, [isLoaded, isSignedIn, redirectUrl, router])

  // Show loading only after signup is fully complete and redirecting
  if (isRedirecting || (isLoaded && isSignedIn)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Setting up your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Sign Up Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-20 xl:px-24 bg-background">
        <div className="w-full max-w-md mx-auto shadow-none">
          {/* Header intentionally minimal for signup */}

          {/* Loading spinner while Clerk form loads */}
          {!isClerkLoaded && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Clerk SignUp Component */}
          <div ref={formContainerRef} className={isClerkLoaded ? "opacity-100" : "opacity-0 h-0 overflow-hidden"}>
          <SignUp
            captchaElementId="clerk-captcha"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none p-0 bg-transparent",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "h-14 border-2 border-gray-300 hover:border-primary focus:border-primary text-base font-medium",
                socialButtonsBlockButtonText: "font-medium",
                dividerRow: "my-6",
                dividerText: "text-muted-foreground uppercase text-sm",
                formFieldInput: "h-14 border-2 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary text-base",
                formFieldLabel: "text-sm font-medium text-foreground",
                formButtonPrimary: "h-14 text-base font-medium bg-primary hover:bg-primary/90",
                footerAction: "hidden",
                identityPreview: "border-2 border-gray-200 rounded-lg",
                formFieldAction: "text-primary hover:text-primary/90",
                alert: "border-destructive/50 text-destructive",
              },
            }}
            routing="hash"
            forceRedirectUrl={redirectUrl}
            signInUrl="/signin"
          />
          <div id="clerk-captcha" />
          </div>
          <div className="hidden" ref={(el) => { if (el) setTimeout(() => setIsClerkLoaded(true), 100) }} />
          <p className="mt-6 text-xs text-center text-muted-foreground">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>

      {/* Right Column - Benefits */}
      <div className="hidden lg:flex flex-1 bg-slate-900 text-white relative overflow-hidden border-l border-slate-800">
        {/* Geometric Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-black/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        {/* Solid black background with white text for clear contrast */}
        <div className="absolute inset-0 bg-black text-white"></div>

        <div className="flex flex-col justify-center px-16 xl:px-24 w-full relative z-10">
          <div className="space-y-12">
            {/* Main headline */}
            <div className="space-y-6">
              <div className="w-12 h-1 bg-white/10"></div>
              
              <h2 className="text-4xl xl:text-5xl font-light tracking-tight leading-tight text-white">
                Be the brand
                <span className="block font-bold mt-2">AI recommends</span>
              </h2>
              
              <p className="text-lg text-slate-300 font-light leading-relaxed max-w-md">
                Join thousands of brands already optimizing their visibility across ChatGPT, Claude, Gemini, and Perplexity.
              </p>
            </div>
            
            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-white">Real-time AI visibility tracking</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-white">Competitor analysis & benchmarking</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-white">Actionable optimization insights</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading fallback component
function SignUpLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading sign up page...</p>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<SignUpLoading />}>
      <SignUpContent />
    </Suspense>
  )
}
