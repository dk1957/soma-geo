"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from "@/components/layout/notification-toast"
import { QuotaUsageWidget } from "@/components/subscription/quota-usage-widget"
import {
  Save,
  Upload,
  Eye,
  EyeOff,
  Shield,
  Bell,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Mail,
  User,
  Globe,
  Building2,
  Calendar,
  MapPin,
  Award,
  TrendingUp,
  BarChart3,
  Target,
  Zap,
  Edit,
  Camera,
  LinkIcon,
  Twitter,
  Linkedin,
  Github,
  Phone,
} from "lucide-react"

// Types for enterprise profile data
interface ProfileData {
  id: string
  user_id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  region: string | null
  timezone: string
  language_preference: string
  role: string
  phone: string | null
  bio: string | null
  website: string | null
  linkedin_url: string | null
  twitter_handle: string | null
  github_username: string | null
  onboarding_status: string
  onboarding_completed_at: string | null
  enhanced_preferences: {
    theme: string
    dashboard_layout: string
    default_view: string
    notification_preferences: {
      email_enabled: boolean
      push_enabled: boolean
      sms_enabled: boolean
      digest_frequency: string
      job_completion: boolean
      audit_results: boolean
      optimization_ready: boolean
      system_maintenance: boolean
      quiet_hours_start: string | null
      quiet_hours_end: string | null
      quiet_days: string[]
    }
  }
  usage_statistics: {
    total_audits_run: number
    total_optimizations_created: number
    favorite_features: string[]
    last_login_ip: string
    login_count: number
  }
  last_active_at: string
  created_at: string
  updated_at: string
  account_memberships: AccountMembership[]
  brand_management_roles: BrandRole[]
}

interface AccountMembership {
  id: string
  name: string
  slug: string
  account_type: string
  billing_plan: string
  user_role: string
  joined_at: string
}

interface BrandRole {
  id: string
  name: string
  slug: string
  role: string
  assigned_at: string
  account_name: string
}

interface SecurityEvent {
  id: string
  event_type: string
  ip_address: string
  user_agent: string
  created_at: string
  details: any
}

interface NotificationData {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  action_url?: string
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

export default function ProfilePage() {
  const { addToast, ToastContainer } = useToast()
  const searchParams = useClientSearchParams()
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Real profile data from database
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [userNotifications, setUserNotifications] = useState<NotificationData[]>([])
  // Fix notification preferences type
  const [notificationPrefs, setNotificationPrefs] = useState<{
    email_enabled: boolean
    push_enabled: boolean
    sms_enabled: boolean
    digest_frequency: string
    job_completion: boolean
    audit_results: boolean
    optimization_ready: boolean
    system_maintenance: boolean
    quiet_hours_start: string | null
    quiet_hours_end: string | null
    quiet_days: string[]
  }>({
    email_enabled: true,
    push_enabled: false,
    sms_enabled: false,
    digest_frequency: 'daily',
    job_completion: true,
    audit_results: true,
    optimization_ready: true,
    system_maintenance: false,
    quiet_hours_start: null,
    quiet_hours_end: null,
    quiet_days: []
  })
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  // Initialize tab from URL parameter
  useEffect(() => {
    if (!searchParams) return
    const tabParam = searchParams.get('tab')
    if (tabParam && ['overview', 'edit', 'notifications', 'security', 'activity'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // Load profile data on mount
  useEffect(() => {
    loadProfileData()
    loadSecurityEvents()
    loadNotifications()
  }, [])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/accounts/profile')
      if (!response.ok) throw new Error('Failed to load profile')
      
      const result = await response.json()
      if (result.success) {
        setProfileData(result.data)
      } else {
        addToast({
          type: "error",
          title: "Error",
          message: "Failed to load profile data",
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to load profile data",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadSecurityEvents = async () => {
    // Security events endpoint is not yet implemented
    // Will populate when backend is ready
  }

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/accounts/profile/notifications')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setUserNotifications(result.data)
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  // Load notification preferences from profile data
  useEffect(() => {
    if (profileData?.enhanced_preferences?.notification_preferences) {
      setNotificationPrefs(profileData.enhanced_preferences.notification_preferences)
    }
  }, [profileData])

  const updateProfile = async (updates: Partial<ProfileData>) => {
    try {
      setSaving(true)
      const response = await fetch('/api/accounts/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      const result = await response.json()
      
      if (result.success) {
        setProfileData(prev => prev ? { ...prev, ...result.data } : null)
        addToast({
          type: "success",
          title: "Profile Updated",
          message: "Your profile has been updated successfully.",
        })
        return true
      } else {
        addToast({
          type: "error",
          title: "Update Failed",
          message: result.error || "Failed to update profile",
        })
        return false
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to update profile",
      })
      return false
    } finally {
      setSaving(false)
    }
  }

  const updatePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      addToast({
        type: "error",
        title: "Password Mismatch",
        message: "New passwords do not match",
      })
      return
    }

    if (passwordForm.new_password.length < 8) {
      addToast({
        type: "error",
        title: "Password Too Short",
        message: "Password must be at least 8 characters long",
      })
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/accounts/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
        addToast({
          type: "success",
          title: "Password Updated",
          message: "Your password has been changed successfully.",
        })
      } else {
        addToast({
          type: "error",
          title: "Password Update Failed",
          message: result.error || "Failed to update password",
        })
      }
    } catch (error) {
      console.error('Error updating password:', error)
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to update password",
      })
    } finally {
      setSaving(false)
    }
  }

  const enable2FA = async () => {
    addToast({
      type: "info",
      title: "Coming Soon",
      message: "Two-factor authentication will be available in a future update.",
    })
  }

  const exportUserData = async () => {
    addToast({
      type: "info",
      title: "Coming Soon",
      message: "Data export will be available in a future update.",
    })
  }

  const deleteAccount = async () => {
    try {
      const response = await fetch('/api/accounts/profile', {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (result.success) {
        addToast({
          type: "success",
          title: "Account Deletion",
          message: "Account deletion initiated successfully. You will be logged out shortly.",
        })
        // Redirect to logout after a delay
        setTimeout(() => {
          window.location.href = '/signin'
        }, 3000)
      } else {
        addToast({
          type: "error",
          title: "Deletion Failed",
          message: result.error || "Failed to delete account",
        })
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to delete account",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const uploadPhoto = async () => {
    addToast({
      type: "info",
      title: "Coming Soon",
      message: "Photo upload will be available in a future update.",
    })
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
                <Skeleton className="h-20 w-20 rounded-full" />
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

  if (!profileData) {
    return (
      <div className="container mx-auto px-6 py-6">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Error Loading Profile</h1>
            <p className="text-muted-foreground">Failed to load your profile data. Please try refreshing the page.</p>
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
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground">Manage your personal information, preferences, and security settings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="edit">Edit Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <Avatar className="h-24 w-24 mx-auto mb-4">
                        <AvatarImage src={profileData.avatar_url || undefined} alt="Profile" />
                        <AvatarFallback className="text-lg">{getInitials(profileData.full_name)}</AvatarFallback>
                      </Avatar>

                      <h2 className="text-xl font-bold text-foreground mb-1">
                        {profileData.full_name || 'Your Name'}
                      </h2>
                      <p className="text-muted-foreground mb-2">{profileData.role}</p>
                      <div className="flex items-center justify-center text-sm text-muted-foreground mb-4">
                        <Building2 className="h-4 w-4 mr-1" />
                        {profileData.account_memberships?.[0]?.name || 'No Organization'}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{profileData.email}</span>
                        </div>
                        {profileData.phone && (
                          <div className="flex items-center justify-center">
                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{profileData.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-center">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{profileData.region || 'No location set'}</span>
                        </div>
                        <div className="flex items-center justify-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Joined {formatDate(profileData.created_at)}</span>
                        </div>
                      </div>

                      {/* Social Links */}
                      <div className="flex justify-center space-x-2 mt-4">
                        {profileData.website && (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <LinkIcon className="h-4 w-4" />
                          </Button>
                        )}
                        {profileData.twitter_handle && (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Twitter className="h-4 w-4" />
                          </Button>
                        )}
                        {profileData.linkedin_url && (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Linkedin className="h-4 w-4" />
                          </Button>
                        )}
                        {profileData.github_username && (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Github className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {profileData.usage_statistics?.total_audits_run || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Total Audits</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {profileData.usage_statistics?.total_optimizations_created || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Optimizations</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {profileData.usage_statistics?.login_count || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Logins</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {profileData.account_memberships?.length || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Organizations</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Subscription & Quota Usage */}
                {profileData.account_memberships?.[0]?.id && (
                  <div className="mt-6">
                    <QuotaUsageWidget accountId={profileData.account_memberships[0].id} variant="compact" />
                  </div>
                )}
              </div>

              {/* Main Content */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {profileData.bio || 'No bio available. Update your profile to add a bio.'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Performance Overview</CardTitle>
                    <CardDescription>Your key metrics and achievements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Audits Run</p>
                          <p className="text-2xl font-bold">{profileData.usage_statistics?.total_audits_run || 0}</p>
                          <p className="text-xs text-green-600">+8% this month</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Target className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Optimizations</p>
                          <p className="text-2xl font-bold">{profileData.usage_statistics?.total_optimizations_created || 0}</p>
                          <p className="text-xs text-green-600">+15% this month</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Zap className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Organizations</p>
                          <p className="text-2xl font-bold">{profileData.account_memberships?.length || 0}</p>
                          <p className="text-xs text-blue-600">Active member</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Organization Memberships */}
                {profileData.account_memberships && profileData.account_memberships.length > 0 && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Organization Memberships</CardTitle>
                      <CardDescription>Your roles in different organizations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {profileData.account_memberships.map((membership) => (
                          <div key={membership.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                            <div>
                              <h4 className="font-medium">{membership.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {membership.account_type} • {membership.billing_plan}
                              </p>
                            </div>
                            <Badge>{membership.user_role}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="edit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile Information</CardTitle>
                <CardDescription>Update your personal and professional details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profileData.avatar_url || undefined} alt="Profile" />
                    <AvatarFallback>{getInitials(profileData.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Button
                      variant="outline"
                      className="bg-transparent"
                      onClick={uploadPhoto}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Change Photo
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">JPG, PNG or GIF. Max size 2MB.</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.full_name || ''}
                      onChange={(e) => setProfileData(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      disabled
                      className="opacity-60"
                    />
                    <p className="text-xs text-muted-foreground">Contact support to change your email address</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileData.phone || ''}
                      onChange={(e) => setProfileData(prev => prev ? { ...prev, phone: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={profileData.timezone}
                      onValueChange={(value) => setProfileData(prev => prev ? { ...prev, timezone: value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                        <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (GMT+2)</SelectItem>
                        <SelectItem value="Africa/Cairo">Africa/Cairo (GMT+2)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
                        <SelectItem value="Europe/Berlin">Europe/Berlin (GMT+1)</SelectItem>
                        <SelectItem value="Asia/Dubai">Asia/Dubai (GMT+4)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                        <SelectItem value="America/Los_Angeles">America/Los_Angeles (GMT-8)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={profileData.language_preference}
                      onValueChange={(value) => setProfileData(prev => prev ? { ...prev, language_preference: value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Select
                      value={profileData.region || ''}
                      onValueChange={(value) => setProfileData(prev => prev ? { ...prev, region: value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="north_america">North America</SelectItem>
                        <SelectItem value="europe">Europe</SelectItem>
                        <SelectItem value="asia_pacific">Asia Pacific</SelectItem>
                        <SelectItem value="middle_east">Middle East</SelectItem>
                        <SelectItem value="africa">Africa</SelectItem>
                        <SelectItem value="latin_america">Latin America</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={profileData.bio || ''}
                    onChange={(e) => setProfileData(prev => prev ? { ...prev, bio: e.target.value } : null)}
                    rows={4}
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Social Links</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        placeholder="https://yourwebsite.com"
                        value={profileData.website || ''}
                        onChange={(e) => setProfileData(prev => prev ? { ...prev, website: e.target.value } : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitter">Twitter</Label>
                      <Input
                        id="twitter"
                        placeholder="@username"
                        value={profileData.twitter_handle || ''}
                        onChange={(e) => setProfileData(prev => prev ? { ...prev, twitter_handle: e.target.value } : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        placeholder="linkedin.com/in/username"
                        value={profileData.linkedin_url || ''}
                        onChange={(e) => setProfileData(prev => prev ? { ...prev, linkedin_url: e.target.value } : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="github">GitHub</Label>
                      <Input
                        id="github"
                        placeholder="github.com/username"
                        value={profileData.github_username || ''}
                        onChange={(e) => setProfileData(prev => prev ? { ...prev, github_username: e.target.value } : null)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={() => updateProfile(profileData)}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Customize how and when you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Communication Channels</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">Email Notifications</div>
                        <div className="text-sm text-muted-foreground">Receive notifications via email</div>
                      </div>
                      <Switch
                        checked={notificationPrefs.email_enabled}
                        onCheckedChange={(checked) => setNotificationPrefs(prev => ({ ...prev, email_enabled: checked }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Content Preferences</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">Job Completion</div>
                        <div className="text-sm text-muted-foreground">Notify when audits and optimizations complete</div>
                      </div>
                      <Switch
                        checked={notificationPrefs.job_completion}
                        onCheckedChange={(checked) => setNotificationPrefs(prev => ({ ...prev, job_completion: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">Audit Results</div>
                        <div className="text-sm text-muted-foreground">Notify about audit results and insights</div>
                      </div>
                      <Switch
                        checked={notificationPrefs.audit_results}
                        onCheckedChange={(checked) => setNotificationPrefs(prev => ({ ...prev, audit_results: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">Optimization Ready</div>
                        <div className="text-sm text-muted-foreground">Notify when content is ready for optimization</div>
                      </div>
                      <Switch
                        checked={notificationPrefs.optimization_ready}
                        onCheckedChange={(checked) => setNotificationPrefs(prev => ({ ...prev, optimization_ready: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">System Maintenance</div>
                        <div className="text-sm text-muted-foreground">Notify about system updates and maintenance</div>
                      </div>
                      <Switch
                        checked={notificationPrefs.system_maintenance}
                        onCheckedChange={(checked) => setNotificationPrefs(prev => ({ ...prev, system_maintenance: checked }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Digest Settings</h4>
                  <div className="space-y-2">
                    <Label htmlFor="digest">Digest Frequency</Label>
                    <Select
                      value={notificationPrefs.digest_frequency}
                      onValueChange={(value) => setNotificationPrefs(prev => ({ ...prev, digest_frequency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={() => updateProfile({ 
                      ...profileData, 
                      enhanced_preferences: { 
                        ...profileData.enhanced_preferences, 
                        notification_preferences: notificationPrefs 
                      } 
                    })} 
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security and authentication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Password</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="current_password">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current_password"
                          type={showPassword ? "text" : "password"}
                          value={passwordForm.current_password}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div></div>
                    <div className="space-y-2">
                      <Label htmlFor="new_password">New Password</Label>
                      <Input
                        id="new_password"
                        type="password"
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm_password">Confirm New Password</Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        value={passwordForm.confirm_password}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={updatePassword} 
                    disabled={saving}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Update Password
                  </Button>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Two-Factor Authentication</h4>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <div className="font-medium flex items-center gap-2">Enable 2FA <Badge variant="secondary" className="text-xs">Coming Soon</Badge></div>
                      <div className="text-sm text-muted-foreground">Add an extra layer of security to your account</div>
                    </div>
                    <Button 
                      onClick={enable2FA} 
                      disabled={saving}
                      variant="outline"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Enable 2FA
                    </Button>
                  </div>
                </div>

                {/* Security Events */}
                {securityEvents.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground">Recent Security Activity</h4>
                    <div className="space-y-2">
                      {securityEvents.slice(0, 5).map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-3 border border-border rounded-lg text-sm">
                          <div>
                            <div className="font-medium">{event.event_type.replace('_', ' ').toUpperCase()}</div>
                            <div className="text-muted-foreground">
                              {event.ip_address} • {formatDate(event.created_at)}
                            </div>
                          </div>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Activity</CardTitle>
                <CardDescription>Your recent actions and data management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Recent Notifications */}
                {userNotifications.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground">Recent Notifications</h4>
                    <div className="space-y-2">
                      {userNotifications.slice(0, 5).map((notification) => (
                        <div key={notification.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <Bell className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{notification.title}</p>
                              <p className="text-xs text-muted-foreground">{notification.message}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(notification.created_at)}</p>
                            </div>
                          </div>
                          <Badge variant={notification.is_read ? "secondary" : "default"} className="text-xs">
                            {notification.is_read ? "Read" : "Unread"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Data Management */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Data Management</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <div className="font-medium flex items-center gap-2">Export Data <Badge variant="secondary" className="text-xs">Coming Soon</Badge></div>
                        <div className="text-sm text-muted-foreground">Download a copy of your data</div>
                      </div>
                      <Button 
                        onClick={exportUserData} 
                        disabled={saving}
                        variant="outline"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                      <div>
                        <div className="font-medium text-destructive">Delete Account</div>
                        <div className="text-sm text-muted-foreground">Permanently delete your account and all data</div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Account
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your account 
                              and remove all your data from our servers including:
                              <br /><br />
                              • All profile information and preferences
                              <br />
                              • Brand management roles and data
                              <br />
                              • Analytics and optimization history
                              <br />
                              • Account memberships and team access
                              <br />
                              • Content and research data
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={deleteAccount}
                            >
                              Yes, delete my account
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
