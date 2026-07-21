"use client"

import { Suspense, useState, useEffect, useRef, useCallback } from "react"
import { SignIn, useAuth } from "@clerk/nextjs"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"

function SignInContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()
  const redirectUrl = searchParams.get('redirect_url') || searchParams.get('redirect') || '/dashboard'
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle redirect after sign in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setIsRedirecting(true)
      router.push(redirectUrl)
    }
  }, [isLoaded, isSignedIn, redirectUrl, router])

  // Show loading while submitting or redirecting or not mounted
  if (!mounted || isSubmitting || isRedirecting || (isLoaded && isSignedIn)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isRedirecting || (isLoaded && isSignedIn) ? 'Loading your dashboard...' : 'Signing you in...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Sign In Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-20 xl:px-24 bg-background">
        <div className="w-full max-w-md mx-auto shadow-none">
          {/* Minimal Header (branding removed for a cleaner auth box) */}
          <div className="mb-6">
            <h1 className="sr-only">Sign in</h1>
          </div>

          {/* Clerk SignIn Component */}
          <SignIn
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
            signUpUrl="/signup"
            afterSignInUrl={redirectUrl}
          />

        </div>
      </div>

      {/* Right Column - Benefits */}
      <div className="hidden lg:flex flex-1 bg-slate-900 text-white relative overflow-hidden border-l border-slate-800">
        {/* Geometric Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-black/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        {/* Solid black background with white text for clear contrast */}
        <div className="absolute inset-0 bg-black text-white">
        </div>

        <div className="flex flex-col justify-center px-16 xl:px-24 w-full relative z-10">
          <div className="space-y-12">
            {/* Main headline */}
            <div className="space-y-6">
              <div className="w-12 h-1 bg-white/10"></div>
              
              <h2 className="text-4xl xl:text-5xl font-light tracking-tight leading-tight text-white">
                Intelligence for
                <span className="block font-bold mt-2">Market Leaders</span>
              </h2>
              
              <p className="text-lg text-slate-300 font-light leading-relaxed max-w-md">
                Monitor your AI visibility and stay ahead of the competition.
                Your dashboard is ready.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading fallback component
function SignInLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading sign in page...</p>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInLoading />}>
      <SignInContent />
    </Suspense>
  )
}