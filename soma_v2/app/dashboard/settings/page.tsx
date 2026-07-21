"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InteractiveButton } from "@/components/interactive-button"
import { useToast } from "@/components/layout/notification-toast"
import { QuotaUsageWidget } from "@/components/subscription/quota-usage-widget"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { ModelSelector } from "@/components/settings/model-selector"
import {
  Save,
  Building2,
  Users,
  CreditCard,
  Shield,
  Settings,
  Key,
  AlertTriangle,
  CheckCircle,
  UserPlus,
  Crown,
  DollarSign,
  Globe,
  Lock,
  Trash2,
  Download,
  Upload,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Edit,
  MoreHorizontal,
  BrainCircuit
} from "lucide-react"

// Types for enterprise organization data
interface OrganizationData {
  id: string
  name: string
  slug: string
  description: string | null
  account_type: string
  billing_plan: string
  billing_cycle: string
  trial_ends_at: string | null
  subscription_status: string
  enhanced_settings: {
    branding: {
      logo_url: string | null
      primary_color: string
      secondary_color: string
      custom_domain: string | null
    }
    security_policies: {
      enforce_2fa: boolean
      session_timeout_minutes: number
      ip_whitelist: string[]
      allowed_domains: string[]
      password_policy: {
        min_length: number
        require_uppercase: boolean
        require_lowercase: boolean
        require_numbers: boolean
        require_symbols: boolean
        max_age_days: number
      }
    }
    integrations: {
      sso_enabled: boolean
      saml_config: any
      api_access_enabled: boolean
      webhook_urls: string[]
    }
    limits: {
      max_users: number
      max_brands: number
      max_audits_per_month: number
      storage_limit_gb: number
    }
  }
  billing_contact: {
    name: string
    email: string
    phone: string | null
    address: string | null
    tax_id: string | null
  }
  usage_current_period: {
    users_active: number
    brands_active: number
    audits_run: number
    storage_used_gb: number
  }
  created_at: string
  updated_at: string
}

interface TeamMember {
  id: string
  userId: string | null
  role: string
  isActive: boolean
  joinedAt: string | null
  createdAt: string
  status?: string
  invitedBy?: string | null
  wasInvited?: boolean
  profile: {
    userId: string | null
    fullName: string
    email: string
    avatarUrl: string | null
    lastActiveAt: string | null
    preferences: any
  }
}

interface APIToken {
  id: string
  name: string
  prefix: string
  scopes: string[]
  last_used_at: string | null
  expires_at: string | null
  created_at: string
}

interface Brand {
  id: string
  name: string
  slug: string
  brand_type: 'own' | 'client'
  industry: string | null
  primary_domain: string | null
  description: string | null
  logo_url: string | null
  headquarters: string | null
  founded_year: number | null
  employee_count: string | null
  annual_revenue: string | null
  target_markets: string[]
  competitors: string[]
  locale_settings: {
    primary_locale: string
    supported_locales: string[]
  }
  monitoring_keywords: string[]
  notification_settings: {
    email_alerts: boolean
    slack_webhook?: string
    alert_threshold: number
  }
  is_active: boolean
  created_at: string
  updated_at: string
  account: {
    id: string
    name: string
  }
  workspaces: any[]
  user_role: string
  stats?: {
    latest_ldi_score: number
    last_monitored: string
  }
}

// Custom hook to safely handle search params
function useClientSearchParams() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSearchParams(new URLSearchParams(window.location.search))
    }
  }, [])

  return searchParams
}

export default function OrganizationSettingsPage() {
  const { addToast, ToastContainer } = useToast()
  const searchParams = useClientSearchParams()
  const [activeTab, setActiveTab] = useState("general")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Real organization data from database
  const [organizationData, setOrganizationData] = useState<OrganizationData | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [apiTokens, setAPITokens] = useState<APIToken[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newTokenName, setNewTokenName] = useState('')
  const [newBrandName, setNewBrandName] = useState('')

  // Initialize tab from URL parameter
  useEffect(() => {
    if (!searchParams) return
    const tabParam = searchParams.get('tab')
    if (tabParam && ['general', 'brands', 'team', 'security', 'billing', 'api'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // Load organization data on mount
  useEffect(() => {
    loadOrganizationData()
    loadTeamMembers()
    loadAPITokens()
  }, [])

  // Load brands when organization data is available
  useEffect(() => {
    if (organizationData?.id) {
      loadBrands()
    }
  }, [organizationData?.id])

  const loadOrganizationData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/accounts/organization')
      if (!response.ok) throw new Error('Failed to load organization')

      const result = await response.json()
      if (result.success) {
        setOrganizationData(result.data)
      } else {
        addToast({
          type: "error",
          title: "Error",
          message: "Failed to load organization data",
        })
      }
    } catch (error) {
      console.error('Error loading organization:', error)
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to load organization data",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTeamMembers = async () => {
    try {
      const response = await fetch('/api/accounts/team')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setTeamMembers(result.data)
        }
      }
    } catch (error) {
      console.error('Error loading team members:', error)
    }
  }

  const loadAPITokens = async () => {
    try {
      const response = await fetch('/api/accounts/tokens')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setAPITokens(result.data)
        }
      }
    } catch (error) {
      console.error('Error loading API tokens:', error)
    }
  }

  const loadBrands = async () => {
    try {
      if (!organizationData?.id) return

      const response = await fetch(`/api/brands?account_id=${organizationData.id}&include_stats=true`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setBrands(result.data)
        }
      }
    } catch (error) {
      console.error('Error loading brands:', error)
    }
  }

  const updateOrganization = async (updates: Partial<OrganizationData>) => {
    try {
      setSaving(true)
      const response = await fetch('/api/accounts/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      const result = await response.json()

      if (result.success) {
        setOrganizationData(prev => prev ? { ...prev, ...result.data } : null)
        addToast({
          type: "success",
          title: "Organization Updated",
          message: "Organization settings have been updated successfully.",
        })
        return true
      } else {
        addToast({
          type: "error",
          title: "Update Failed",
          message: result.error || "Failed to update organization",
        })
        return false
      }
    } catch (error) {
      console.error('Error updating organization:', error)
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to update organization",
      })
      return false
    } finally {
      setSaving(false)
    }
  }

  const inviteTeamMember = async () => {
    if (!newMemberEmail.trim()) {
      addToast({
        type: "error",
        title: "Email Required",
        message: "Please enter an email address",
      })
      return
    }

    try {
      setSaving(true)
      addToast({
        type: "info",
        title: "Sending Invitation...",
        message: `Sending invitation to ${newMemberEmail}`,
      })

      const response = await fetch('/api/accounts/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newMemberEmail })
      })

      const result = await response.json()

      if (result.success) {
        setNewMemberEmail('')
        addToast({
          type: "success",
          title: "Invitation Sent",
          message: `Invitation sent to ${newMemberEmail}`,
        })
        loadTeamMembers() // Refresh the list
      } else {
        addToast({
          type: "error",
          title: "Invitation Failed",
          message: result.error || "Failed to send invitation",
        })
      }
    } catch (error) {
      console.error('Error inviting member:', error)
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to send invitation",
      })
    } finally {
      setSaving(false)
    }
  }

  const createAPIToken = async () => {
    if (!newTokenName.trim()) {
      addToast({
        type: "error",
        title: "Name Required",
        message: "Please enter a token name",
      })
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/accounts/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTokenName })
      })

      const result = await response.json()

      if (result.success) {
        setNewTokenName('')
        addToast({
          type: "success",
          title: "Token Created",
          message: "API token created successfully. Make sure to copy it now.",
        })
        loadAPITokens() // Refresh the list
      } else {
        addToast({
          type: "error",
          title: "Creation Failed",
          message: result.error || "Failed to create API token",
        })
      }
    } catch (error) {
      console.error('Error creating token:', error)
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to create API token",
      })
    } finally {
      setSaving(false)
    }
  }

  const createBrand = async () => {
    if (!newBrandName.trim()) {
      addToast({
        type: "error",
        title: "Name Required",
        message: "Please enter a brand name",
      })
      return
    }

    if (!organizationData?.id) {
      addToast({
        type: "error",
        title: "Error",
        message: "Organization data not available",
      })
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBrandName,
          account_id: organizationData.id,
          brand_type: 'own'
        })
      })

      const result = await response.json()

      if (result.success) {
        setNewBrandName('')
        addToast({
          type: "success",
          title: "Brand Created",
          message: `Brand "${newBrandName}" created successfully.`,
        })
        loadBrands() // Refresh the list
      } else {
        addToast({
          type: "error",
          title: "Creation Failed",
          message: result.error || "Failed to create brand",
        })
      }
    } catch (error) {
      console.error('Error creating brand:', error)
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to create brand",
      })
    } finally {
      setSaving(false)
    }
  }

  const removeTeamMember = async (memberId: string, userId: string | null, isInvitation: boolean) => {
    try {
      setSaving(true)
      addToast({
        type: "info",
        title: isInvitation ? "Revoking Invitation..." : "Removing Member...",
        message: "Please wait",
      })

      const params = new URLSearchParams()

      if (isInvitation) {
        params.append('inviteId', memberId)
      } else {
        params.append('userId', userId!)
      }

      const response = await fetch(`/api/accounts/team?${params.toString()}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        addToast({
          type: "success",
          title: isInvitation ? "Invitation Revoked" : "Member Removed",
          message: result.data.message,
        })
        loadTeamMembers() // Refresh the list
      } else {
        addToast({
          type: "error",
          title: "Operation Failed",
          message: result.error || "Failed to complete operation",
        })
      }
    } catch (error) {
      console.error('Error removing team member:', error)
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to remove team member",
      })
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not yet joined'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid date'
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Invalid date'
    }
  }

  const getUsagePercentage = (current: number, limit: number) => {
    return Math.round((current / limit) * 100)
  }

  const getInitials = (name: string | null) => {
    if (!name || name === 'Unknown User' || name === 'Pending Invitation') {
      return '?'
    }

    const words = name.trim().split(/\s+/)
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase()
    }

    return words.slice(0, 2)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-6">
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!organizationData) {
    return (
      <div className="container mx-auto px-6 py-6">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Error Loading Organization</h1>
            <p className="text-muted-foreground">Failed to load organization data. Please try refreshing the page.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-6">
      <div className="space-y-6">
        <ToastContainer />

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organization Settings</h1>
          <p className="text-muted-foreground">Manage your organization configuration, team, billing, and security</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="brands">Brands</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="api">API & Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Organization Information</CardTitle>
                <CardDescription>Basic information about your organization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Organization Name</Label>
                    <Input
                      id="org-name"
                      value={organizationData.name}
                      onChange={(e) => setOrganizationData(prev => prev ? { ...prev, name: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-slug">Organization Slug</Label>
                    <Input
                      id="org-slug"
                      value={organizationData.slug}
                      onChange={(e) => setOrganizationData(prev => prev ? { ...prev, slug: e.target.value } : null)}
                      placeholder="your-org-name"
                    />
                    <p className="text-xs text-muted-foreground">Used in URLs and API calls</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-description">Description</Label>
                  <Textarea
                    id="org-description"
                    value={organizationData.description || ''}
                    onChange={(e) => setOrganizationData(prev => prev ? { ...prev, description: e.target.value } : null)}
                    placeholder="Brief description of your organization..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end">
                  <InteractiveButton
                    onClick={() => updateOrganization(organizationData)}
                    loadingText="Saving..."
                    successText="Saved!"
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </InteractiveButton>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Information */}
            <SubscriptionInfoCard accountId={organizationData.id} />

            {/* Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Current Usage</CardTitle>
                <CardDescription>Your organization's current usage and subscription limits</CardDescription>
              </CardHeader>
              <CardContent>
                {organizationData.id && (
                  <QuotaUsageWidget accountId={organizationData.id} variant="full" />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="brands" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Brand Management</CardTitle>
                <CardDescription>Overview and management of your organization's brands</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Brand Creation */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter brand name..."
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    className="flex-1"
                  />
                  <InteractiveButton
                    onClick={createBrand}
                    loadingText="Creating..."
                    successText="Created!"
                    disabled={saving}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Brand
                  </InteractiveButton>
                </div>

                {/* Brands Overview Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Total Brands</span>
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{brands.length}</div>
                    <div className="text-xs text-muted-foreground">
                      {brands.filter(b => b.is_active).length} active
                    </div>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Own Brands</span>
                      <Crown className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">
                      {brands.filter(b => b.brand_type === 'own').length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      vs {brands.filter(b => b.brand_type === 'client').length} client brands
                    </div>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Avg LDI Score</span>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">
                      {brands.filter(b => b.stats?.latest_ldi_score).length > 0
                        ? Math.round(brands.filter(b => b.stats?.latest_ldi_score).reduce((acc, b) => acc + (b.stats?.latest_ldi_score || 0), 0) / brands.filter(b => b.stats?.latest_ldi_score).length)
                        : '--'
                      }
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {brands.filter(b => b.stats?.latest_ldi_score).length} scored brands
                    </div>
                  </div>
                </div>

                {/* Brands List */}
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">All Brands</h4>
                  {brands.length === 0 ? (
                    <div className="text-center p-8 border border-dashed border-border rounded-lg">
                      <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground">No brands yet</h3>
                      <p className="text-muted-foreground mb-4">Create your first brand to get started with monitoring and analytics.</p>
                    </div>
                  ) : (
                    brands.map((brand) => (
                      <div key={brand.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={brand.logo_url || undefined} alt={brand.name} />
                            <AvatarFallback>
                              <Building2 className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">{brand.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {brand.industry && `${brand.industry} • `}
                              {brand.primary_domain || 'No domain set'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Created {formatDate(brand.created_at)}
                              {brand.stats?.last_monitored && ` • Last monitored ${formatDate(brand.stats.last_monitored)}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={brand.is_active ? 'default' : 'secondary'}>
                            {brand.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">
                            {brand.brand_type}
                          </Badge>
                          {brand.stats?.latest_ldi_score && (
                            <Badge variant="outline">
                              LDI: {brand.stats.latest_ldi_score}
                            </Badge>
                          )}
                          <div className="flex items-center space-x-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" title="Manage AI Models">
                                  <BrainCircuit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>AI Model Configuration</DialogTitle>
                                  <DialogDescription>
                                    Configure AI models for this brand's monitoring and analysis.
                                  </DialogDescription>
                                </DialogHeader>
                                <ModelSelector brandId={brand.id} accountId={brand.account.id} />
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/dashboard/brands/${brand.id}`, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/dashboard/brands/${brand.id}/settings`, '_blank')}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage your organization's team members and their roles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Invite New Member */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter email address..."
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="flex-1"
                  />
                  <InteractiveButton
                    onClick={inviteTeamMember}
                    loadingText="Sending..."
                    successText="Invited!"
                    disabled={saving}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Member
                  </InteractiveButton>
                </div>

                {/* Team Members List */}
                <div className="space-y-3">
                  {teamMembers.length === 0 ? (
                    <div className="text-center p-8 border border-dashed border-border rounded-lg">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground">No team members yet</h3>
                      <p className="text-muted-foreground mb-4">Invite your first team member to get started.</p>
                    </div>
                  ) : (
                    teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.profile.avatarUrl || undefined} alt={member.profile.fullName} />
                            <AvatarFallback>{getInitials(member.profile.fullName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.profile.fullName}</div>
                            <div className="text-sm text-muted-foreground">{member.profile.email}</div>
                            <div className="text-xs text-muted-foreground">
                              {member.status === 'invited' ? (
                                <>Invited {formatDate(member.createdAt)}</>
                              ) : (
                                <>
                                  Joined {formatDate(member.joinedAt)}
                                  {member.profile.lastActiveAt && ` • Last active ${formatDate(member.profile.lastActiveAt)}`}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={member.status === 'invited' ? 'secondary' : (member.isActive ? 'default' : 'secondary')}>
                            {member.status === 'invited' ? 'Pending' : (member.isActive ? 'Active' : 'Inactive')}
                          </Badge>
                          {member.wasInvited && member.status !== 'invited' && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Invited User
                            </Badge>
                          )}
                          <Badge variant="outline">
                            {member.role}
                          </Badge>
                          {member.role !== 'owner' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {member.status === 'invited' ? 'Revoke Invitation' : 'Remove Team Member'}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {member.status === 'invited'
                                      ? `This will cancel the pending invitation for ${member.profile.email}. They will not be able to join using the invitation link.`
                                      : `This will remove ${member.profile.fullName} from the organization. They will lose access to all resources.`
                                    }
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground"
                                    onClick={() => removeTeamMember(member.id, member.userId, member.status === 'invited')}
                                  >
                                    {member.status === 'invited' ? 'Revoke Invitation' : 'Remove Member'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Policies</CardTitle>
                <CardDescription>Configure security settings for your organization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">Enforce Two-Factor Authentication</div>
                      <div className="text-sm text-muted-foreground">Require all team members to use 2FA</div>
                    </div>
                    <Switch
                      checked={organizationData.enhanced_settings?.security_policies?.enforce_2fa || false}
                      onCheckedChange={(checked) => setOrganizationData(prev => prev ? {
                        ...prev,
                        enhanced_settings: {
                          ...prev.enhanced_settings,
                          security_policies: {
                            ...prev.enhanced_settings.security_policies,
                            enforce_2fa: checked
                          }
                        }
                      } : null)}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <InteractiveButton
                    onClick={() => updateOrganization(organizationData)}
                    loadingText="Saving..."
                    successText="Saved!"
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Security Settings
                  </InteractiveButton>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            {/* Subscription Information */}
            <SubscriptionInfoCard accountId={organizationData.id} />

            {/* Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Current Usage</CardTitle>
                <CardDescription>Your organization's current usage and subscription limits</CardDescription>
              </CardHeader>
              <CardContent>
                {organizationData.id && (
                  <QuotaUsageWidget accountId={organizationData.id} variant="full" />
                )}
              </CardContent>
            </Card>

            {/* Billing Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Billing Contact Information</CardTitle>
                <CardDescription>Contact details for billing and invoicing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="billing-name">Contact Name</Label>
                    <Input
                      id="billing-name"
                      value={organizationData.billing_contact?.name || ''}
                      onChange={(e) => setOrganizationData(prev => prev ? {
                        ...prev,
                        billing_contact: {
                          ...prev.billing_contact,
                          name: e.target.value
                        }
                      } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-email">Contact Email</Label>
                    <Input
                      id="billing-email"
                      type="email"
                      value={organizationData.billing_contact?.email || ''}
                      onChange={(e) => setOrganizationData(prev => prev ? {
                        ...prev,
                        billing_contact: {
                          ...prev.billing_contact,
                          email: e.target.value
                        }
                      } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-phone">Phone Number</Label>
                    <Input
                      id="billing-phone"
                      value={organizationData.billing_contact?.phone || ''}
                      onChange={(e) => setOrganizationData(prev => prev ? {
                        ...prev,
                        billing_contact: {
                          ...prev.billing_contact,
                          phone: e.target.value
                        }
                      } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax-id">Tax ID</Label>
                    <Input
                      id="tax-id"
                      value={organizationData.billing_contact?.tax_id || ''}
                      onChange={(e) => setOrganizationData(prev => prev ? {
                        ...prev,
                        billing_contact: {
                          ...prev.billing_contact,
                          tax_id: e.target.value
                        }
                      } : null)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing-address">Billing Address</Label>
                  <Textarea
                    id="billing-address"
                    value={organizationData.billing_contact?.address || ''}
                    onChange={(e) => setOrganizationData(prev => prev ? {
                      ...prev,
                      billing_contact: {
                        ...prev.billing_contact,
                        address: e.target.value
                      }
                    } : null)}
                    rows={3}
                  />
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => window.open('/dashboard/subscription', '_blank')}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage Subscription
                  </Button>
                  <InteractiveButton
                    onClick={() => updateOrganization(organizationData)}
                    loadingText="Saving..."
                    successText="Saved!"
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Billing Info
                  </InteractiveButton>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Tokens</CardTitle>
                <CardDescription>Manage API tokens for integrations and automation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Create New Token */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Token name..."
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                    className="flex-1"
                  />
                  <InteractiveButton
                    onClick={createAPIToken}
                    loadingText="Creating..."
                    successText="Created!"
                    disabled={saving}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Token
                  </InteractiveButton>
                </div>

                {/* API Tokens List */}
                <div className="space-y-3">
                  {apiTokens.map((token) => (
                    <div key={token.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <div className="font-medium">{token.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {token.prefix}••••••••
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created {formatDate(token.created_at)}
                          {token.last_used_at && ` • Last used ${formatDate(token.last_used_at)}`}
                          {token.expires_at && ` • Expires ${formatDate(token.expires_at)}`}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete API Token</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the API token "{token.name}". Any applications using this token will lose access.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive text-destructive-foreground">
                                Delete Token
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ============================================================================
// SUBSCRIPTION INFO CARD COMPONENT
// ============================================================================

interface SubscriptionInfoCardProps {
  accountId: string
}

function SubscriptionInfoCard({ accountId }: SubscriptionInfoCardProps) {
  const [subscriptionData, setSubscriptionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!accountId) return

      try {
        const response = await fetch(`/api/accounts/subscriptions/current?account_id=${accountId}`)
        const result = await response.json()

        if (result.success && result.subscription) {
          setSubscriptionData(result.subscription)
        }
      } catch (error) {
        console.error('Error fetching subscription:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [accountId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!subscriptionData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            No Active Subscription
          </CardTitle>
          <CardDescription>Your account doesn't have an active subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <InteractiveButton onClick={() => window.location.href = '/dashboard/subscription'}>
            <CreditCard className="h-4 w-4 mr-2" />
            View Subscription Plans
          </InteractiveButton>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'trialing': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'past_due': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'canceled': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'expired': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const daysUntilRenewal = Math.ceil(
    (new Date(subscriptionData.current_period_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              Subscription Plan
              <Badge
                variant="outline"
                className={getStatusColor(subscriptionData.status)}
              >
                {subscriptionData.status === 'trialing' ? 'Trial' : subscriptionData.status}
              </Badge>
            </CardTitle>
            <CardDescription>
              Your current subscription and billing details
            </CardDescription>
          </div>
          <InteractiveButton
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/dashboard/subscription'}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Manage
          </InteractiveButton>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Plan Details */}
          <div className="p-4 border border-border rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Crown className="h-4 w-4" />
              <span>Current Plan</span>
            </div>
            <div>
              <p className="text-2xl font-bold capitalize">{subscriptionData.plan_name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {subscriptionData.billing_cycle === 'monthly' && 'Billed monthly'}
                {subscriptionData.billing_cycle === 'quarterly' && 'Billed quarterly'}
                {subscriptionData.billing_cycle === 'biannual' && 'Billed bi-annually'}
                {subscriptionData.billing_cycle === 'annual' && 'Billed annually'}
              </p>
            </div>
          </div>

          {/* Billing Period */}
          <div className="p-4 border border-border rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Current Period</span>
            </div>
            <div>
              <p className="text-sm font-medium">
                {new Date(subscriptionData.current_period_start).toLocaleDateString()} -{' '}
                {new Date(subscriptionData.current_period_end).toLocaleDateString()}
              </p>
              {daysUntilRenewal > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {daysUntilRenewal} day{daysUntilRenewal !== 1 ? 's' : ''} remaining
                </p>
              )}
            </div>
          </div>

          {/* Auto-Renewal Status */}
          <div className="p-4 border border-border rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Settings className="h-4 w-4" />
              <span>Auto-Renewal</span>
            </div>
            <div className="flex items-center gap-2">
              {subscriptionData.auto_renew ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Enabled</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium">Disabled</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}