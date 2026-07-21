"use client"

import { ReactNode, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Building2, CreditCard, Settings, Clock, FileWarning, Globe,
  Cpu, FileText, Search, User, ChevronDown, LogOut, RefreshCw,
  ArrowLeft, BarChart3, Users, Target, SlidersHorizontal, MessageSquareCode, Bot,
  Zap, Sparkles, Lightbulb, UserPlus,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useClerk } from "@clerk/nextjs"

export type Tab = 'crm' | 'accounts' | 'leads' | 'subscriptions' | 'features' | 'query_response' | 'prompt_design' | 'agents' | 'insight_agent' | 'pipeline' | 'cron' | 'errors' | 'sources'

const NAV_SECTIONS: { label: string; items: { id: Tab; label: string; icon: ReactNode }[] }[] = [
  {
    label: 'Revenue',
    items: [
      { id: 'crm', label: 'Sales CRM', icon: <Target className="h-4 w-4" /> },
    ]
  },
  {
    label: 'Business',
    items: [
      { id: 'accounts', label: 'Accounts & Brands', icon: <Building2 className="h-4 w-4" /> },
      { id: 'leads', label: 'Leads', icon: <UserPlus className="h-4 w-4" /> },
      { id: 'subscriptions', label: 'Subscriptions', icon: <CreditCard className="h-4 w-4" /> },
      { id: 'features', label: 'Feature Flags', icon: <Settings className="h-4 w-4" /> },
    ]
  },
  {
    label: 'AI Engine',
    items: [
      { id: 'query_response', label: 'Query Response', icon: <Zap className="h-4 w-4" /> },
      { id: 'prompt_design', label: 'Prompt Design', icon: <Sparkles className="h-4 w-4" /> },
      { id: 'agents', label: 'Agent Config', icon: <Bot className="h-4 w-4" /> },
      { id: 'insight_agent', label: 'Insight Agent', icon: <Lightbulb className="h-4 w-4" /> },
    ]
  },
  {
    label: 'Monitoring',
    items: [
      { id: 'pipeline', label: 'Pipeline Health', icon: <BarChart3 className="h-4 w-4" /> },
      { id: 'cron', label: 'Cron Jobs', icon: <Clock className="h-4 w-4" /> },
      { id: 'errors', label: 'Error Logs', icon: <FileWarning className="h-4 w-4" /> },
      { id: 'sources', label: 'Source Analysis', icon: <Globe className="h-4 w-4" /> },
    ]
  },
]

const TAB_TITLES: Record<Tab, string> = {
  crm: 'Sales CRM',
  accounts: 'Accounts & Brands',
  leads: 'Leads',
  subscriptions: 'Subscriptions',
  features: 'Feature Flags',
  query_response: 'Query Response',
  prompt_design: 'Prompt Design',
  agents: 'Agent Config',
  insight_agent: 'Insight Agent',
  pipeline: 'Pipeline Health',
  cron: 'Cron Jobs',
  errors: 'Error Logs',
  sources: 'Source Analysis',
}

interface AdminShellProps {
  userEmail?: string
  activeTab: Tab
  /** When provided, uses tab-click for navigation (main admin page). Otherwise uses Link to /admin?tab=X */
  onTabChange?: (tab: Tab) => void
  /** Title override (e.g. breadcrumb for account detail) */
  title?: ReactNode
  /** Extra actions in the top bar */
  headerActions?: ReactNode
  /** Show search bar */
  searchQuery?: string
  onSearchChange?: (q: string) => void
  searchPlaceholder?: string
  children: ReactNode
}

export function AdminShell({
  userEmail,
  activeTab,
  onTabChange,
  title,
  headerActions,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  children,
}: AdminShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { signOut } = useClerk()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleTabClick = (tab: Tab) => {
    if (tab === 'crm') {
      router.push('/admin/crm')
      return
    }

    if (tab === 'agents') {
      router.push('/admin/agent-config')
      return
    }

    if (onTabChange) {
      onTabChange(tab)
    } else {
      // Navigate to admin page with tab param
      router.push(`/admin?tab=${tab}`)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-zinc-200 flex flex-col fixed h-screen">
        <Link href="/admin" className="block px-4 py-4 border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
          <h1 className="text-base font-bold text-zinc-900">Soma AI Admin</h1>
          {userEmail && <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{userEmail}</p>}
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <h3 className="px-2 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">{section.label}</h3>
              <div className="space-y-0.5">
                {section.items.map(item => (
                  (() => {
                    const isActive = 
                      item.id === 'crm' ? pathname.startsWith('/admin/crm') : 
                      item.id === 'agents' ? pathname.startsWith('/admin/agent-config') :
                      activeTab === item.id

                    return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg transition-colors ${
                      isActive
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                    {item.id === 'crm' ? <Badge className="ml-auto bg-orange-500 text-white text-[10px] px-1.5 py-0 border-0">New</Badge> : null}
                  </button>
                    )
                  })()
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-zinc-100">
          <Button onClick={handleRefresh} variant="outline" size="sm" className="w-full" disabled={isRefreshing}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60">
        {/* Top bar */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {title || <h2 className="text-lg font-semibold text-zinc-900">{TAB_TITLES[activeTab]}</h2>}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {onSearchChange && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder={searchPlaceholder || "Search..."}
                    className="pl-9 w-72"
                    value={searchQuery || ""}
                    onChange={(e) => onSearchChange(e.target.value)}
                  />
                </div>
              )}
              {headerActions}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-white" />
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs">{userEmail}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut({ redirectUrl: '/signin' })} className="text-red-600 focus:text-red-600">
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
