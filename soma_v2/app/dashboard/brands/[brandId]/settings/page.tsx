"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { InteractiveButton } from "@/components/interactive-button"
import { useToast } from "@/components/layout/notification-toast"
import { useBrand } from "@/lib/contexts/brand-context"
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
import { TagInput } from "@/components/ui/tag-input"
import {
  Save,
  Trash2,
  AlertTriangle,
  ArrowLeft,
  Copy,
  Globe,
  Cpu,
  Building2,
  Package,
  Briefcase,
  User,
  Building,
  Landmark,
  Megaphone,
  MapPin,
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Brain
} from "lucide-react"
import { ModelSelector } from '@/components/settings/model-selector'
import { BrandKnowledgeManager } from '@/components/dashboard/overview/brand-knowledge-manager'
import { 
  ENTITY_TYPE_OPTIONS, 
  getEntityTerminology, 
  isPoliticalEntity, 
  isCommercialEntity,
  type EntityType 
} from '@/lib/utils/entity-language'

// Entity type icons mapping
const ENTITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  company: Building2,
  product: Package,
  service: Briefcase,
  personality: User,
  organization: Building,
  government: Landmark,
  campaign: Megaphone,
  location: MapPin
}

// ─── Side nav sections ──────────────────────────────────────────────
type SettingsSection = 'identity' | 'company' | 'intelligence' | 'profile' | 'knowledge' | 'models' | 'advanced'

const SETTINGS_NAV: { id: SettingsSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'identity', label: 'Brand Identity', icon: Globe },
  { id: 'company', label: 'Parent Company', icon: Building2 },
  { id: 'intelligence', label: 'Market Intelligence', icon: BarChart3 },
  { id: 'profile', label: 'Brand Profile', icon: BookOpen },
  { id: 'knowledge', label: 'Knowledge Base', icon: Brain },
  { id: 'models', label: 'AI Models', icon: Cpu },
  { id: 'advanced', label: 'Advanced', icon: Settings2 },
]

interface BrandData {
  id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  industry?: string
  brand_type: 'client' | 'own'
  entity_type?: EntityType
  primary_domain?: string
  contact_info?: Record<string, any>
  brand_categories?: string[]
  brand_category?: string
  brand_topics?: string[]
  products_services?: string
  target_audience?: string
  target_markets?: string[]
  known_competitors?: string[]
  entity_aliases?: string[]
  business_model?: string
  business_stage?: string
  company_size?: string
  company_name?: string
  company_website?: string
  company_location?: string
  tone?: string
  timezone?: string
  currency?: string
  is_active: boolean
  created_at: string
  updated_at: string
  account?: {
    id: string
    name: string
    account_type: string
  }
  stats?: {
    workspaces: number
    team_members: number
  }
  user_role?: string
  can_edit?: boolean
  can_delete?: boolean
}

// Brand Category options - comprehensive list
const brandCategoryOptions = [
  { value: 'technology_software', label: 'Technology & Software' },
  { value: 'information_technology_services', label: 'IT Services' },
  { value: 'artificial_intelligence', label: 'Artificial Intelligence' },
  { value: 'saas', label: 'SaaS' },
  { value: 'fintech', label: 'Fintech' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'healthcare_medical', label: 'Healthcare & Medical' },
  { value: 'pharmaceutical', label: 'Pharmaceutical' },
  { value: 'biotechnology', label: 'Biotechnology' },
  { value: 'finance_banking', label: 'Finance & Banking' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'investment', label: 'Investment' },
  { value: 'retail', label: 'Retail' },
  { value: 'consumer_goods', label: 'Consumer Goods' },
  { value: 'food_beverages', label: 'Food & Beverages' },
  { value: 'fashion_apparel', label: 'Fashion & Apparel' },
  { value: 'beauty_cosmetics', label: 'Beauty & Cosmetics' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'construction', label: 'Construction' },
  { value: 'education', label: 'Education' },
  { value: 'edtech', label: 'EdTech' },
  { value: 'media_entertainment', label: 'Media & Entertainment' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'computer_games', label: 'Computer Games' },
  { value: 'sports_fitness', label: 'Sports & Fitness' },
  { value: 'travel_hospitality', label: 'Travel & Hospitality' },
  { value: 'restaurants', label: 'Restaurants' },
  { value: 'telecommunications', label: 'Telecommunications' },
  { value: 'energy_utilities', label: 'Energy & Utilities' },
  { value: 'renewable_energy', label: 'Renewable Energy' },
  { value: 'logistics_transportation', label: 'Logistics & Transportation' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'legal_services', label: 'Legal Services' },
  { value: 'marketing_advertising', label: 'Marketing & Advertising' },
  { value: 'hr_recruitment', label: 'HR & Recruitment' },
  { value: 'nonprofit', label: 'Non-Profit' },
  { value: 'government', label: 'Government' },
  { value: 'aerospace_defense', label: 'Aerospace & Defense' },
  { value: 'other', label: 'Other' }
]

// Business model options
const businessModelOptions = [
  { value: 'b2b', label: 'B2B (Business to Business)' },
  { value: 'b2c', label: 'B2C (Business to Consumer)' },
  { value: 'b2b2c', label: 'B2B2C (Business to Business to Consumer)' },
  { value: 'marketplace', label: 'Marketplace' }
]

// Business stage options
const businessStageOptions = [
  { value: 'startup', label: 'Startup' },
  { value: 'growth', label: 'Growth' },
  { value: 'established', label: 'Established' },
  { value: 'enterprise', label: 'Enterprise' }
]

// Company size options
const companySizeOptions = [
  { value: 'startup', label: 'Startup (1-10)' },
  { value: 'small', label: 'Small (11-50)' },
  { value: 'medium', label: 'Medium (51-200)' },
  { value: 'large', label: 'Large (201-1000)' },
  { value: 'enterprise', label: 'Enterprise (1000+)' }
]

// Brand tone options
const toneOptions = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'formal', label: 'Formal' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'innovative', label: 'Innovative' },
  { value: 'playful', label: 'Playful' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'technical', label: 'Technical' }
]

export default function BrandSettingsPage({ params }: { params: Promise<{ brandId: string }> }) {
  const router = useRouter()
  const { addToast, ToastContainer } = useToast()
  const { refreshUserData } = useBrand()
  
  const [brandData, setBrandData] = useState<BrandData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadedBrandId, setLoadedBrandId] = useState<string | null>(null)
  const [currentBrandId, setCurrentBrandId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<BrandData>>({})
  const [activeSection, setActiveSection] = useState<SettingsSection>('identity')
  const [isNavCollapsed, setIsNavCollapsed] = useState(false)

  // Get contextual terminology based on entity type
  const entityType = formData.entity_type || 'company'
  const terminology = useMemo(() => getEntityTerminology(entityType), [entityType])
  const isPolitical = useMemo(() => isPoliticalEntity(entityType), [entityType])
  const isCommercial = useMemo(() => isCommercialEntity(entityType), [entityType])

  // Account type determines company info handling
  const isAgencyAccount = brandData?.account?.account_type === 'agency'

  // Determine which fields to show based on entity type and account type
  // Company fields only shown for agency accounts (in-house company = account-level)
  const showCompanyFields = isAgencyAccount && (isCommercial || ['organization', 'government'].includes(entityType))
  const showBusinessModel = isCommercial
  const showProductsServices = !isPolitical && entityType !== 'location'
  const showBusinessStage = isCommercial || entityType === 'organization'

  useEffect(() => {
    const initializeBrandId = async () => {
      const resolvedParams = await params
      setCurrentBrandId(resolvedParams.brandId)
    }
    initializeBrandId()
  }, [params])

  useEffect(() => {
    const loadBrandData = async () => {
      if (!currentBrandId || loadedBrandId === currentBrandId) return
      
      setIsLoading(true)
      try {
        const response = await fetch(`/api/brands/${currentBrandId}/settings`)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        
        const result = await response.json()
        if (result.success) {
          const data = result.data
          setBrandData(data)
          setFormData(data)
          setLoadedBrandId(currentBrandId)
        } else {
          addToast({ type: "error", title: "Error", message: result.error || "Failed to load brand" })
        }
      } catch (error) {
        console.error('Error loading brand:', error)
        addToast({ type: "error", title: "Error", message: "Failed to load brand settings" })
      } finally {
        setIsLoading(false)
      }
    }
    loadBrandData()
  }, [currentBrandId])

  const handleSaveBrand = async () => {
    if (!brandData || !formData || !currentBrandId) return
    
    setIsSaving(true)
    try {
      // Only send editable fields, not metadata like account, stats, etc.
      const { 
        name, slug, description, logo_url, industry, brand_type, entity_type,
        primary_domain, brand_categories, brand_category, brand_topics,
        products_services, target_audience, target_markets, known_competitors,
        entity_aliases, business_model, business_stage,
        company_size, company_name, company_website, company_location,
        tone, timezone, currency, is_active, contact_info, primary_value,
        industry_category
      } = formData
      
      const payload = {
        name, slug, description, logo_url, industry, brand_type, entity_type,
        primary_domain, brand_categories, brand_category, brand_topics,
        products_services, target_audience, target_markets, known_competitors,
        entity_aliases, business_model, business_stage,
        company_size, company_name, company_website, company_location,
        tone, timezone, currency, is_active, contact_info, primary_value,
        industry_category
      }

      const response = await fetch(`/api/brands/${currentBrandId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const result = await response.json()
      if (result.success) {
        setBrandData(result.data)
        setFormData(result.data)
        await refreshUserData()
        addToast({ type: "success", title: "Saved", message: "Brand settings updated" })
      } else {
        addToast({ type: "error", title: "Error", message: result.error || "Failed to save" })
      }
    } catch (error) {
      addToast({ type: "error", title: "Error", message: "Failed to save brand settings" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteBrand = async () => {
    if (!brandData || !currentBrandId) return
    
    try {
      const response = await fetch(`/api/brands/${currentBrandId}/settings`, { method: 'DELETE' })
      const result = await response.json()
      
      if (result.success) {
        await refreshUserData()
        addToast({ type: "success", title: "Deleted", message: "Brand has been deleted" })
        router.push('/dashboard')
      } else {
        addToast({ type: "error", title: "Error", message: result.error || "Failed to delete" })
      }
    } catch (error) {
      addToast({ type: "error", title: "Error", message: "Failed to delete brand" })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!brandData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Brand Not Found</h2>
        <p className="text-muted-foreground mb-4">The brand doesn't exist or you don't have access.</p>
        <Button onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    )
  }

  // Filter nav items based on entity type / account type
  const visibleNav = SETTINGS_NAV.filter(item => {
    if (item.id === 'company' && !showCompanyFields) return false
    return true
  })

  return (
    <div className="min-h-screen bg-white">
      <ToastContainer />

      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-zinc-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarImage src={formData.logo_url} alt={formData.name} />
              <AvatarFallback>{formData.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-semibold">{brandData.name}</h1>
              <p className="text-sm text-muted-foreground">Brand Settings</p>
            </div>
          </div>
          {brandData.can_edit && (
            <InteractiveButton onClick={handleSaveBrand} disabled={isSaving} loadingText="Saving..." successText="Saved!">
              <Save className="h-4 w-4 mr-2" />
              Save
            </InteractiveButton>
          )}
        </div>
      </div>

      {/* Layout: Side Nav + Content */}
      <div className="flex">
        {/* Floating Left Side Nav */}
        <nav className={`${isNavCollapsed ? "w-[60px]" : "w-52"} shrink-0 border-r border-zinc-200 bg-zinc-50/60 min-h-[calc(100vh-4rem)] transition-all duration-200`}>
          <div className="sticky top-16 p-3 space-y-1">
            <button
              onClick={() => setIsNavCollapsed((prev) => !prev)}
              className="mb-2 flex w-full items-center justify-center rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50"
              aria-label={isNavCollapsed ? "Expand navigation" : "Collapse navigation"}
            >
              {isNavCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            {visibleNav.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center ${isNavCollapsed ? "justify-center" : "justify-start"} gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isNavCollapsed && <span>{item.label}</span>}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 min-w-0 p-6 space-y-6">

      {/* 1. Brand Identity */}
      {activeSection === 'identity' && (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Brand Identity
          </CardTitle>
          <CardDescription>Core information that identifies this brand across AI platforms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Brand Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!brandData.can_edit}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="primary_domain">Brand Website</Label>
              <Input
                id="primary_domain"
                value={formData.primary_domain || ''}
                onChange={(e) => setFormData({ ...formData, primary_domain: e.target.value })}
                disabled={!brandData.can_edit}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="entity_type">Entity Type</Label>
              <Select
                value={formData.entity_type || ''}
                onValueChange={(value) => setFormData({ ...formData, entity_type: value as EntityType })}
                disabled={!brandData.can_edit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select entity type" />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPE_OPTIONS.map((option) => {
                    const IconComponent = ENTITY_ICONS[option.value] || Building2
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          {option.label}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Controls terminology used in reports and analysis</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand_category">Industry / Category</Label>
              <Select
                value={formData.brand_category || ''}
                onValueChange={(value) => setFormData({ ...formData, brand_category: value })}
                disabled={!brandData.can_edit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {brandCategoryOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={!brandData.can_edit}
              rows={2}
              placeholder={`Brief description of this ${terminology.entityName}...`}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Also Known As</Label>
            <TagInput
              value={formData.entity_aliases || []}
              onChange={(value) => setFormData({ ...formData, entity_aliases: value })}
              disabled={!brandData.can_edit}
              placeholder="Other names, abbreviations, or variations..."
            />
            <p className="text-xs text-muted-foreground">Alternative names AI models might use to refer to this {terminology.entityName}</p>
          </div>
        </CardContent>
      </Card>
      )}

      {/* 2. Parent Company — Agency accounts only (in-house company = account-level) */}
      {activeSection === 'company' && showCompanyFields && (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {isPolitical ? 'Campaign Organization' : entityType === 'government' ? 'Government Agency' : 'Parent Company'}
          </CardTitle>
          <CardDescription>
            {isPolitical 
              ? 'The organization behind this campaign' 
              : entityType === 'government' 
              ? 'The government body behind this entity'
              : 'The company that owns or operates this brand'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="company_name">
                {isPolitical ? 'Organization Name' : entityType === 'government' ? 'Agency Name' : 'Company Name'}
              </Label>
              <Input
                id="company_name"
                value={formData.company_name || ''}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                disabled={!brandData.can_edit}
                placeholder={isPolitical ? 'Campaign committee name' : entityType === 'government' ? 'Official agency name' : 'Legal company name'}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company_website">
                {isPolitical ? 'Organization Website' : entityType === 'government' ? 'Agency Website' : 'Company Website'}
              </Label>
              <Input
                id="company_website"
                value={formData.company_website || ''}
                onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
                disabled={!brandData.can_edit}
                placeholder={isPolitical ? 'https://campaign.com' : 'https://company.com'}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="company_location">
                {isPolitical ? 'Headquarters' : entityType === 'government' ? 'Agency Location' : 'Headquarters'}
              </Label>
              <Input
                id="company_location"
                value={formData.company_location || ''}
                onChange={(e) => setFormData({ ...formData, company_location: e.target.value })}
                disabled={!brandData.can_edit}
                placeholder="City, Country"
              />
            </div>
            {!isPolitical && (
            <div className="space-y-1.5">
              <Label htmlFor="company_size">
                {entityType === 'government' ? 'Agency Size' : 'Company Size'}
              </Label>
              <Select
                value={formData.company_size || ''}
                onValueChange={(value) => setFormData({ ...formData, company_size: value })}
                disabled={!brandData.can_edit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {companySizeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            )}
          </div>
        </CardContent>
      </Card>
      )}

      {/* 3. Market Intelligence */}
      {activeSection === 'intelligence' && (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">
            {isPolitical ? 'Campaign Intelligence' : entityType === 'location' ? 'Destination Intelligence' : 'Market Intelligence'}
          </CardTitle>
          <CardDescription>
            {isPolitical 
              ? 'Context that helps AI accurately monitor and analyze campaign visibility'
              : entityType === 'location'
              ? 'Context that helps AI accurately monitor and analyze destination visibility'
              : 'Context that helps AI accurately monitor and analyze brand visibility'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showProductsServices && (
          <div className="space-y-1.5">
            <Label>
              {entityType === 'service' ? 'Services Offered' : entityType === 'product' ? 'Product Details' : 'Products & Services'}
            </Label>
            <Textarea
              value={formData.products_services || ''}
              onChange={(e) => setFormData({ ...formData, products_services: e.target.value })}
              disabled={!brandData.can_edit}
              rows={2}
              placeholder={
                entityType === 'service' 
                  ? 'What services does the brand offer?'
                  : entityType === 'product'
                  ? 'Describe the product details and features'
                  : 'What products or services does the brand offer?'
              }
            />
          </div>
          )}

          {isPolitical && (
          <div className="space-y-1.5">
            <Label>Key Policy Positions</Label>
            <Textarea
              value={formData.products_services || ''}
              onChange={(e) => setFormData({ ...formData, products_services: e.target.value })}
              disabled={!brandData.can_edit}
              rows={2}
              placeholder="What are the key policy positions and campaign priorities?"
            />
          </div>
          )}

          {entityType === 'location' && (
          <div className="space-y-1.5">
            <Label>Key Attractions & Features</Label>
            <Textarea
              value={formData.products_services || ''}
              onChange={(e) => setFormData({ ...formData, products_services: e.target.value })}
              disabled={!brandData.can_edit}
              rows={2}
              placeholder="What are the main attractions, features, and reasons to visit?"
            />
          </div>
          )}

          <div className="space-y-1.5">
            <Label>
              {isPolitical ? 'Campaign Topics' : entityType === 'location' ? 'Destination Topics' : 'Brand Topics'}
            </Label>
            <TagInput
              value={formData.brand_topics || []}
              onChange={(value) => setFormData({ ...formData, brand_topics: value })}
              disabled={!brandData.can_edit}
              placeholder={isPolitical ? 'Add policy areas...' : 'Add topics...'}
            />
            <p className="text-xs text-muted-foreground">
              {isPolitical 
                ? 'Key policy areas and campaign themes'
                : entityType === 'location'
                ? 'Key topics like tourism, culture, activities'
                : 'Key topics and themes associated with this brand'}
            </p>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>
                {isPolitical ? 'Target Regions' : entityType === 'location' ? 'Source Markets' : 'Target Markets'}
              </Label>
              <TagInput
                value={formData.target_markets || []}
                onChange={(value) => setFormData({ ...formData, target_markets: value })}
                disabled={!brandData.can_edit}
                placeholder={isPolitical ? 'Add regions...' : 'Add markets...'}
              />
              <p className="text-xs text-muted-foreground">
                {isPolitical 
                  ? 'Key regions or constituencies'
                  : entityType === 'location'
                  ? 'Where do visitors come from?'
                  : 'Geographic markets or regions'}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>{terminology.competitorPlural.charAt(0).toUpperCase() + terminology.competitorPlural.slice(1)}</Label>
              <TagInput
                value={formData.known_competitors || []}
                onChange={(value) => setFormData({ ...formData, known_competitors: value })}
                disabled={!brandData.can_edit}
                placeholder={`Add ${terminology.competitorPlural}...`}
              />
              <p className="text-xs text-muted-foreground">
                {isPolitical 
                  ? 'Political opponents to track'
                  : entityType === 'location'
                  ? 'Competing destinations to track'
                  : 'Known competitors to track'}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>
              {isPolitical ? 'Target Voters' : entityType === 'location' ? 'Target Visitors' : 'Target Audience'}
            </Label>
            <Textarea
              value={formData.target_audience || ''}
              onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
              disabled={!brandData.can_edit}
              rows={2}
              placeholder={
                isPolitical 
                  ? 'Describe your target voter demographics...'
                  : entityType === 'location'
                  ? 'Describe your ideal visitors...'
                  : 'Describe your ideal customers...'
              }
            />
          </div>
        </CardContent>
      </Card>
      )}

      {/* 4. Brand Profile */}
      {activeSection === 'profile' && (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">
            {isPolitical ? 'Campaign Profile' : 'Brand Profile'}
          </CardTitle>
          <CardDescription>
            {isPolitical 
              ? 'Characteristics that define how the campaign is positioned'
              : 'Characteristics that define how the brand is positioned'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showBusinessModel && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="business_model">Business Model</Label>
              <Select
                value={formData.business_model || ''}
                onValueChange={(value) => setFormData({ ...formData, business_model: value })}
                disabled={!brandData.can_edit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {businessModelOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {showBusinessStage && (
            <div className="space-y-1.5">
              <Label htmlFor="business_stage">Business Stage</Label>
              <Select
                value={formData.business_stage || ''}
                onValueChange={(value) => setFormData({ ...formData, business_stage: value })}
                disabled={!brandData.can_edit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {businessStageOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            )}
          </div>
          )}

          {/* In-house: show company size here since company card is hidden */}
          {!isAgencyAccount && !isPolitical && (isCommercial || ['organization', 'government'].includes(entityType)) && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="company_size">
                {entityType === 'government' ? 'Agency Size' : 'Company Size'}
              </Label>
              <Select
                value={formData.company_size || ''}
                onValueChange={(value) => setFormData({ ...formData, company_size: value })}
                disabled={!brandData.can_edit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {companySizeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          )}

          {isAgencyAccount && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="brand_type">Relationship</Label>
              <Select
                value={formData.brand_type}
                onValueChange={(value: 'client' | 'own') => setFormData({ ...formData, brand_type: value })}
                disabled={!brandData.can_edit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client Brand</SelectItem>
                  <SelectItem value="own">Own Brand</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Whether this is a client brand or your agency&apos;s own brand</p>
            </div>
          </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="tone">
              {isPolitical ? 'Campaign Tone' : 'Brand Voice'}
            </Label>
            <Select
              value={formData.tone || ''}
              onValueChange={(value) => setFormData({ ...formData, tone: value })}
              disabled={!brandData.can_edit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                {toneOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {isPolitical ? 'How the campaign communicates' : 'How the brand communicates — used to calibrate AI analysis'}
            </p>
          </div>
        </CardContent>
      </Card>
      )}

      {/* 5. Knowledge Base */}
      {activeSection === 'knowledge' && (
        <BrandKnowledgeManager brandId={brandData.id} />
      )}

      {/* AI Models */}
      {activeSection === 'models' && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
              <Cpu className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Models</h2>
              <p className="text-xs text-gray-500">Select which AI models to use for monitoring</p>
            </div>
          </div>
          <Card>
            <CardContent className="pt-5">
              {brandData.id && <ModelSelector brandId={brandData.id} />}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Advanced / Danger Zone */}
      {activeSection === 'advanced' && (
      <Card className="border-muted">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Advanced</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Brand ID</p>
              <p className="text-xs text-muted-foreground font-mono">{brandData.id}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(brandData.id)
                addToast({ type: "success", title: "Copied", message: "Brand ID copied" })
              }}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-xs text-muted-foreground">
                Created {new Date(brandData.created_at).toLocaleDateString()}
              </p>
            </div>
            <Badge variant={brandData.is_active ? "default" : "secondary"}>
              {brandData.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>

          {brandData.can_delete && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-destructive">Delete Brand</p>
                  <p className="text-xs text-muted-foreground">Permanently remove this brand and all data</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{brandData.name}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all data associated with this brand. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDeleteBrand}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      )}

        </div>{/* end content area */}
      </div>{/* end flex */}
    </div>
  )
}