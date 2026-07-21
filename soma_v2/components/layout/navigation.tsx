"use client"

import { useState, useEffect, useCallback, useRef, useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  BarChart3,
  FileText,
  MessageSquare,
  Users,
  ChevronRight,
  Settings,
  ChevronDown,
  LogOut,
  User,
  Sparkles,
  CreditCard,
  Globe,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  X,
} from "lucide-react"
import { useBrand } from "@/lib/contexts/brand-context"
import { useAuth } from "@/lib/contexts/auth-context"
import { useToast } from "@/components/layout/notification-toast"
import { CacheManager } from "@/lib/utils/cache-manager"

function useClientSearchParams() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSearchParams(new URLSearchParams(window.location.search))
    }
  }, [pathname])

  return searchParams
}

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useClientSearchParams()
  const { user, isLoading: authLoading, signOut } = useAuth()
  const { currentBrand, currentAccount } = useBrand()
  const [isPending, startTransition] = useTransition()
  const { addToast } = useToast()
  const [userProfileState, setUserProfile] = useState<any>(null)
  const [subAlert, setSubAlert] = useState<'expired' | 'high_usage' | null>(null)
  const [subAlertDismissed, setSubAlertDismissed] = useState(false)
  const [navLoading, setNavLoading] = useState<string | null>(null)
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const currentBrandId = searchParams?.get('brand') || currentBrand?.id

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id || authLoading) return
      try {
        const response = await fetch(`/api/accounts/profile`)
        if (response.ok) {
          const data = await response.json()
          setUserProfile(data.data)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }
    fetchUserProfile()
  }, [user?.id, authLoading])

  // Check subscription status and usage for sidebar alerts
  useEffect(() => {
    if (!currentAccount?.id) return
    const checkSub = async () => {
      try {
        // Check subscription validity
        const statusRes = await fetch(`/api/accounts/subscriptions/status?account_id=${currentAccount.id}`)
        if (!statusRes.ok) return
        const statusData = await statusRes.json()
        if (statusData.success && !statusData.status.is_valid && (statusData.status.status === 'expired' || statusData.status.status === 'none')) {
          setSubAlert('expired')
          return
        }

        // Check quota usage for upgrade nudge
        const currentRes = await fetch(`/api/accounts/subscriptions/current?account_id=${currentAccount.id}`)
        if (!currentRes.ok) return
        const currentData = await currentRes.json()
        if (currentData.success && currentData.quotas) {
          const q = currentData.quotas
          const brandUsage = q.max_brands > 0 ? q.current_brands_count / q.max_brands : 0
          if (brandUsage >= 0.8) {
            setSubAlert('high_usage')
            return
          }
        }
        setSubAlert(null)
      } catch {}
    }
    checkSub()
  }, [currentAccount?.id])

  const handleSignOut = async () => {
    try {
      CacheManager.clearAllClientData()
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      addToast({ type: 'error', title: 'Sign Out Error', message: 'Error signing out. Please try again.' })
    }
  }

  const buildUrlWithBrand = (href: string) => {
    if (!currentBrandId) return href
    const url = new URL(href, 'http://localhost')
    url.searchParams.set('brand', currentBrandId)
    return url.pathname + url.search
  }

  // Robust navigation: uses router.push inside startTransition with hard-nav fallback
  const navigateTo = useCallback((href: string, e: React.MouseEvent) => {
    // Allow ctrl/cmd+click to open in new tab
    if (e.ctrlKey || e.metaKey || e.shiftKey) return

    e.preventDefault()

    const targetPath = href.split('?')[0]
    if (targetPath === pathname) return

    // Clear any previous fallback timer
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current)
    }

    // Set a fallback: if soft navigation doesn't complete in 2s, do a hard navigation
    navigationTimeoutRef.current = setTimeout(() => {
      if (window.location.pathname !== targetPath) {
        window.location.href = href
      }
    }, 2000)

    startTransition(() => {
      router.push(href)
    })
  }, [pathname, router, startTransition])

  // Clear fallback timer when pathname actually changes (navigation succeeded)
  useEffect(() => {
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current)
      navigationTimeoutRef.current = null
    }
    setNavLoading(null)
  }, [pathname])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current)
      }
    }
  }, [])

  const navigationItems = [
    {
      name: "Overview",
      href: "/dashboard",
      icon: BarChart3,
      description: "LDI Score & Performance Overview",
      active: pathname === "/dashboard",
      section: "analytics"
    },
    {
      name: "Sources",
      href: "/dashboard/sources",
      icon: MessageSquare,
      description: "Brand Mentions & Citations Analysis",
      active: pathname.startsWith("/dashboard/sources"),
      section: "analytics"
    },
    {
      name: "Prompts",
      href: "/dashboard/prompts",
      icon: MessageSquare,
      description: "Query Performance Tracking",
      active: pathname.startsWith("/dashboard/prompts"),
      section: "analytics"
    },
    {
      name: "Competitors",
      href: "/dashboard/competitors",
      icon: Users,
      description: "Competitive Benchmarking",
      active: pathname.startsWith("/dashboard/competitors"),
      section: "analytics"
    },
    {
      name: "Brand Discoverability",
      href: "/dashboard/technical-seo",
      icon: Globe,
      description: "AEO readiness, crawlers & structured data",
      active: pathname.startsWith("/dashboard/technical-seo"),
      section: "indexing"
    },
    {
      name: "Search Performance",
      href: "/dashboard/search-console",
      icon: CheckCircle,
      description: "See how your brand performs in search",
      active: pathname.startsWith("/dashboard/search-console"),
      section: "indexing"
    },
    {
      name: "Content Optimization",
      href: "/dashboard/content",
      icon: Sparkles,
      description: "AI-Optimized Content Creation & Analysis",
      active: pathname.startsWith("/dashboard/content"),
      section: "content"
    }
  ]

  const renderNavItem = (item: typeof navigationItems[0]) => {
    const fullHref = buildUrlWithBrand(item.href)
    return (
      <Link
        key={item.href}
        href={fullHref}
        onClick={(e) => navigateTo(fullHref, e)}
        className={`flex items-center w-full p-3 rounded-lg transition-all duration-150 group relative cursor-pointer ${
          item.active
            ? "bg-primary/10 text-primary border border-primary/20"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent hover:border-border/30"
        }`}
      >
        <item.icon className={`h-4 w-4 mr-3 flex-shrink-0 transition-transform group-hover:scale-110 ${
          item.active ? "text-primary" : ""
        }`} />
        <div className="text-left flex-1 min-w-0 pr-2">
          <div className="text-sm font-medium truncate flex items-center gap-2">
            {item.name}
            {item.isSoon && (
              <span className="text-xs text-muted-foreground font-normal bg-muted/60 px-2 py-0.5 rounded-md">Soon</span>
            )}
          </div>
          <div className="text-xs opacity-70 leading-tight">{item.description}</div>
        </div>
        <ChevronRight className="h-3 w-3 opacity-50 flex-shrink-0 transition-transform group-hover:translate-x-1" />
      </Link>
    )
  }

  return (
    <div className="w-64 lg:w-72 xl:w-80 border-r border-border/50 bg-card/50 backdrop-blur-sm h-screen flex flex-col overflow-hidden shadow-sm">
      <div className="p-3 lg:p-3 border-b border-border/50 flex-shrink-0 bg-card">
        <Link href="/" className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-black rounded text-white flex items-center justify-center text-sm font-bold">S</div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-foreground">Soma AI</span>
            <span className="text-xs text-muted-foreground/80 font-medium tracking-wider">AEO PLATFORM</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 lg:p-4 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {navigationItems.filter(item => item.section === "analytics").map(renderNavItem)}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2 mt-6">Indexing & Tracking</p>
          {navigationItems.filter(item => item.section === "indexing").map(renderNavItem)}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2 mt-6">Performance & Content</p>
          {navigationItems.filter(item => item.section === "content").map(renderNavItem)}
        </div>
      </nav>

      {subAlert === 'expired' && (
        <div className="mx-3 mb-2 flex-shrink-0">
          <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-red-800 dark:text-red-200">Subscription Expired</p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-0.5 leading-relaxed">
                  Runs and analysis are paused. Your data is safe.
                </p>
              </div>
            </div>
            <button
              onClick={() => { setNavLoading('renew'); router.push('/dashboard/subscription'); }}
              disabled={!!navLoading}
              className="w-full flex items-center justify-center gap-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 transition-colors disabled:opacity-70"
            >
              {navLoading === 'renew' ? (
                <><span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Redirecting...</>
              ) : (
                <>Renew Plan<ArrowRight className="h-3 w-3" /></>
              )}
            </button>
          </div>
        </div>
      )}

      {subAlert === 'high_usage' && !subAlertDismissed && (
        <div className="mx-3 mb-2 flex-shrink-0">
          <div className="rounded-lg border border-border/60 bg-muted/40 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground">You&apos;re growing fast</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Unlock more brands and features with an upgraded plan.
                </p>
              </div>
              <button onClick={() => setSubAlertDismissed(true)} className="p-0.5 rounded hover:bg-muted transition-colors flex-shrink-0">
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
            <button
              onClick={() => { setNavLoading('plans'); router.push('/dashboard/subscription'); }}
              disabled={!!navLoading}
              className="w-full flex items-center justify-center gap-1.5 rounded-md border border-border/60 hover:bg-muted text-xs font-medium px-3 py-1.5 transition-colors text-foreground disabled:opacity-70"
            >
              {navLoading === 'plans' ? (
                <><span className="h-3 w-3 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />Redirecting...</>
              ) : (
                <>View Plans<ArrowRight className="h-3 w-3" /></>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="border-t border-border/50 p-3 lg:p-4 bg-card/80 flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/60 border border-transparent hover:border-border/30 transition-all cursor-pointer">
              <Avatar className="h-8 w-8 border border-border/20">
                <AvatarImage src={userProfileState?.profile?.avatar_url} alt={userProfileState?.profile?.full_name || 'User'} />
                <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                  {userProfileState?.profile?.full_name?.split(' ').map((n: string) => n[0]).join('') || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="text-left flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {userProfileState?.account_memberships?.[0]?.name || currentBrand?.account?.name || 'Loading...'}
                </div>
                <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" side="top" className="w-60 shadow-lg border-border/50 mb-2">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">
                  {userProfileState?.account_memberships?.[0]?.name || currentBrand?.account?.name || 'Organization'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => router.push('/dashboard/profile')} className="cursor-pointer">
              <User className="h-4 w-4 mr-2" />
              Profile Settings
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')} className="cursor-pointer">
              <Settings className="h-4 w-4 mr-2" />
              Organization Settings
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => router.push('/dashboard/subscription')} className="cursor-pointer">
              <CreditCard className="h-4 w-4 mr-2" />
              Subscription & Billing
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
