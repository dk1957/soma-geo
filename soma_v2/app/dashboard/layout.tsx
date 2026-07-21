"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Script from "next/script"
import { useUser } from "@clerk/nextjs"
import Navigation from "@/components/layout/navigation"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { PageTransition } from "@/components/layout/page-transition"
import { LoadingLine } from "@/components/layout/loading-line"
import { ErrorBoundary } from "@/components/layout/error-boundary"
import { AuthProvider } from "@/lib/contexts/auth-context"
import { BrandProvider } from "@/lib/contexts/brand-context"
import { NavigationProvider } from "@/lib/contexts/navigation-context"
import { LogoutNotificationListener } from "@/components/layout/logout-notification-listener"
import { SubscriptionBanner, PaywallOverlay } from "@/components/layout/subscription-banner"
import { SpeedInsights } from "@vercel/speed-insights/next"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        {/* Google Analytics for Dashboard - Only in production */}
        {process.env.NODE_ENV === 'production' && (
          <>
            <Script
              src="https://www.googletagmanager.com/gtag/js?id=G-Y0Z4679WJY"
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-Y0Z4679WJY', {
                  send_page_view: false,
                  allow_ad_personalization_signals: false,
                  allow_google_signals: false,
                  anonymize_ip: true
                });
              `}
            </Script>
          </>
        )}
        <BrandLayoutInner>
          {children}
        </BrandLayoutInner>
      </AuthProvider>
    </ErrorBoundary>
  )
}

function BrandLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, isLoaded: isClerkLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true)
  const [hasValidatedAccess, setHasValidatedAccess] = useState(false)
  
  // Global cache for user validation
  const accessCacheKey = `dashboard_access_${user?.id || 'anonymous'}`
  
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isClerkLoaded) {
        return
      }

      if (!isSignedIn || !user) {
        // No user and clerk loaded - redirect to signin
        router.push('/signin?redirect_url=/dashboard')
        setIsCheckingOnboarding(false)
        return
      }

      // Check global cache first
      try {
        const cachedResult = localStorage.getItem(accessCacheKey)
        if (cachedResult) {
          const { hasAccess, timestamp } = JSON.parse(cachedResult)
          const cacheAge = Date.now() - timestamp
          const cacheValidDuration = 10 * 60 * 1000 // 10 minutes cache
          
          if (hasAccess && cacheAge < cacheValidDuration) {
            console.log('✅ Dashboard: Using persistent cache for access validation')
            setIsCheckingOnboarding(false)
            setHasValidatedAccess(true)
            return
          }
        }
      } catch (error) {
        console.warn('Cache read error:', error)
      }

      try {
        // Check if user has account and brands via API
        const response = await fetch('/api/accounts/check-access')
        const data = await response.json()

        console.log('🔍 Dashboard access check:', {
          userId: user.id,
          hasAccount: data.hasAccount,
          hasBrands: data.hasBrands,
          isMember: data.isMember
        })

        // Cache the result
        try {
          localStorage.setItem(accessCacheKey, JSON.stringify({
            hasAccess: data.hasAccount && (data.hasBrands || data.isMember),
            timestamp: Date.now(),
          }))
        } catch (error) {
          console.warn('Cache write error:', error)
        }

        if ((data.hasAccount && data.hasBrands) || (data.hasAccount && data.isMember)) {
          console.log('✅ Dashboard: User has account access - granted')
          setIsCheckingOnboarding(false)
          setHasValidatedAccess(true)
          return
        }

        // Redirect to onboarding if no setup
        console.log('❌ Dashboard: User has no setup, redirecting to onboarding')
        router.push('/onboarding')
        
      } catch (error) {
        console.error('Dashboard check error:', error)
        // On error, allow access rather than redirect
        setIsCheckingOnboarding(false)
        setHasValidatedAccess(true)
      }
    }

    if (!hasValidatedAccess && user?.id) {
      checkOnboardingStatus()
    } else if (!user && isClerkLoaded) {
      setHasValidatedAccess(false)
      setIsCheckingOnboarding(true)
    }
  }, [user?.id, isClerkLoaded, isSignedIn, router, hasValidatedAccess, accessCacheKey])

  // Show loading if still checking
  if (!isClerkLoaded || isCheckingOnboarding) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  // Don't render dashboard content until we've validated access
  if (!hasValidatedAccess) {
    return null
  }

  // Create a user-like object for BrandProvider compatibility
  const userForBrand = user ? {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress || '',
  } : null

  return (
    <BrandProvider user={userForBrand}>
      <NavigationProvider>
        <LoadingLine />
        <LogoutNotificationListener />
        <div className="flex h-screen bg-background">
          <Navigation />
          <div className="flex-1 flex flex-col overflow-hidden">
            <DashboardHeader />
            <SubscriptionBanner />
            <PaywallOverlay />
            <div className="flex-1 overflow-auto">
              <PageTransition>
                <ErrorBoundary>{children}</ErrorBoundary>
              </PageTransition>
            </div>
          </div>
        </div>
      </NavigationProvider>
    </BrandProvider>
  )
}
