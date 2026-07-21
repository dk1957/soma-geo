/**
 * Schema Builder Page
 * 
 * Analyze existing structured data, validate schemas,
 * and generate new Schema.org markup for better AI discoverability.
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { useBrand } from "@/lib/contexts/brand-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  FileCode, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  Download,
  Search,
  Plus,
  Loader2,
  ExternalLink,
  Code,
  Sparkles,
  Building,
  Package,
  FileText,
  Star,
  Calendar,
  HelpCircle,
  Brain,
  ArrowRight,
  Bot,
  Globe,
  Info,
  Zap,
  MapPin,
  ShoppingBag,
  MessageSquare,
  BookOpen,
  Eye,
  DollarSign,
  Clock,
  User,
  Phone,
  Mail,
  Wrench,
  Trash2,
  RotateCcw,
  Settings,
  CheckCheck,
  Lightbulb
} from "lucide-react"
import { useToast } from "@/components/layout/notification-toast"
import Link from "next/link"

interface SchemaTemplate {
  id: string
  name: string
  type: string
  description: string
  icon: string
  aiImpact: string
  fields: SchemaField[]
  supportsMultiple?: boolean
}

interface SchemaField {
  name: string
  key: string
  type: 'text' | 'textarea' | 'url' | 'email' | 'number' | 'select' | 'faq-list' | 'product-list' | 'service-list'
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
  hint?: string
}

interface ValidationResult {
  valid: boolean
  errors: Array<{ path: string; message: string; fix?: string }>
  warnings: Array<{ path: string; message: string; fix?: string }>
}

interface VerificationResult {
  isDiscoverable: boolean
  schemasFound: number
  schemaTypes: string[]
  recommendations: string[]
}

interface ProductItem {
  name: string
  description: string
  price: string
  currency: string
  image: string
  sku: string
  availability: string
}

interface ServiceItem {
  name: string
  description: string
  provider: string
  areaServed: string
  price: string
}

const SCHEMA_ICONS: Record<string, any> = {
  Organization: Building,
  LocalBusiness: MapPin,
  Product: ShoppingBag,
  ItemList: Package,
  Service: Wrench,
  Article: FileText,
  FAQPage: HelpCircle,
  Review: Star,
  Event: Calendar,
  WebSite: Globe,
  BreadcrumbList: BookOpen,
  default: FileCode
}

// Schema field definitions for each type
const ORGANIZATION_FIELDS: SchemaField[] = [
  { name: 'Organization Name', key: 'name', type: 'text', placeholder: 'Your company name', required: true },
  { name: 'Website URL', key: 'url', type: 'url', placeholder: 'https://yoursite.com', required: true },
  { name: 'Description', key: 'description', type: 'textarea', placeholder: 'Brief description of your organization' },
  { name: 'Logo URL', key: 'logo', type: 'url', placeholder: 'https://yoursite.com/logo.png' },
  { name: 'Email', key: 'email', type: 'email', placeholder: 'contact@yoursite.com' },
  { name: 'Phone', key: 'telephone', type: 'text', placeholder: '+1-800-555-0123' },
  { name: 'Founded Year', key: 'foundingDate', type: 'text', placeholder: '2020' },
  { name: 'Social Media (comma-separated URLs)', key: 'sameAs', type: 'textarea', placeholder: 'https://twitter.com/brand, https://linkedin.com/company/brand', hint: 'Add your social media profile URLs' },
]

const LOCAL_BUSINESS_FIELDS: SchemaField[] = [
  { name: 'Business Name', key: 'name', type: 'text', placeholder: 'Your business name', required: true },
  { name: 'Business Type', key: 'businessType', type: 'select', options: [
    { value: 'LocalBusiness', label: 'General Local Business' },
    { value: 'Restaurant', label: 'Restaurant' },
    { value: 'Store', label: 'Store' },
    { value: 'ProfessionalService', label: 'Professional Service' },
    { value: 'HealthAndBeautyBusiness', label: 'Health & Beauty' },
    { value: 'FinancialService', label: 'Financial Service' },
    { value: 'LegalService', label: 'Legal Service' },
    { value: 'RealEstateAgent', label: 'Real Estate' },
  ]},
  { name: 'Website URL', key: 'url', type: 'url', placeholder: 'https://yoursite.com', required: true },
  { name: 'Description', key: 'description', type: 'textarea', placeholder: 'What your business does' },
  { name: 'Street Address', key: 'streetAddress', type: 'text', placeholder: '123 Main Street', required: true },
  { name: 'City', key: 'addressLocality', type: 'text', placeholder: 'San Francisco', required: true },
  { name: 'State/Region', key: 'addressRegion', type: 'text', placeholder: 'CA' },
  { name: 'Postal Code', key: 'postalCode', type: 'text', placeholder: '94102' },
  { name: 'Country', key: 'addressCountry', type: 'text', placeholder: 'US' },
  { name: 'Phone', key: 'telephone', type: 'text', placeholder: '+1-800-555-0123' },
  { name: 'Opening Hours', key: 'openingHours', type: 'text', placeholder: 'Mo-Fr 09:00-17:00', hint: 'Format: Mo-Fr 09:00-17:00' },
  { name: 'Price Range', key: 'priceRange', type: 'text', placeholder: '$$', hint: 'Use $ to $$$$ scale' },
]

const PRODUCT_FIELDS: SchemaField[] = [
  { name: 'Products', key: 'products', type: 'product-list', hint: 'Add one or more products. Each product will be added to the schema.' },
]

const SERVICE_FIELDS: SchemaField[] = [
  { name: 'Services', key: 'services', type: 'service-list', hint: 'Add one or more services your business offers.' },
]

const ARTICLE_FIELDS: SchemaField[] = [
  { name: 'Article Title', key: 'headline', type: 'text', placeholder: 'Your article headline', required: true },
  { name: 'Article URL', key: 'url', type: 'url', placeholder: 'https://yoursite.com/blog/article', required: true },
  { name: 'Description', key: 'description', type: 'textarea', placeholder: 'Brief summary of the article' },
  { name: 'Author Name', key: 'authorName', type: 'text', placeholder: 'John Doe', required: true },
  { name: 'Author URL', key: 'authorUrl', type: 'url', placeholder: 'https://yoursite.com/author/john' },
  { name: 'Image URL', key: 'image', type: 'url', placeholder: 'https://yoursite.com/article-image.jpg', hint: 'Recommended: 1200x630px or larger' },
  { name: 'Date Published', key: 'datePublished', type: 'text', placeholder: '2024-01-15', hint: 'Format: YYYY-MM-DD' },
  { name: 'Date Modified', key: 'dateModified', type: 'text', placeholder: '2024-01-20', hint: 'Format: YYYY-MM-DD' },
  { name: 'Publisher Name', key: 'publisherName', type: 'text', placeholder: 'Your Site Name' },
  { name: 'Publisher Logo', key: 'publisherLogo', type: 'url', placeholder: 'https://yoursite.com/logo.png' },
  { name: 'Word Count', key: 'wordCount', type: 'number', placeholder: '1500', hint: 'Approximate word count' },
]

const FAQ_FIELDS: SchemaField[] = [
  { name: 'Page URL', key: 'url', type: 'url', placeholder: 'https://yoursite.com/faq', required: true },
  { name: 'FAQ Questions', key: 'questions', type: 'faq-list', placeholder: '', hint: 'Add your frequently asked questions below' },
]

const WEBSITE_FIELDS: SchemaField[] = [
  { name: 'Site Name', key: 'name', type: 'text', placeholder: 'Your website name', required: true },
  { name: 'Website URL', key: 'url', type: 'url', placeholder: 'https://yoursite.com', required: true },
  { name: 'Description', key: 'description', type: 'textarea', placeholder: 'What your website is about' },
  { name: 'Search URL Template', key: 'searchUrl', type: 'url', placeholder: 'https://yoursite.com/search?q={search_term}', hint: 'Use {search_term} as placeholder' },
  { name: 'Alternate Name', key: 'alternateName', type: 'text', placeholder: 'Brand nickname or abbreviation' },
]

const BREADCRUMB_FIELDS: SchemaField[] = [
  { name: 'Breadcrumb Items', key: 'items', type: 'text', placeholder: '', hint: 'Add breadcrumb navigation items in order (Home → Category → Page)' },
]

// Templates with AI impact descriptions
const SCHEMA_TEMPLATES: SchemaTemplate[] = [
  {
    id: 'organization',
    name: 'Organization',
    type: 'Organization',
    description: 'Basic company/brand information',
    icon: 'Organization',
    aiImpact: 'Helps AI understand your brand identity and legitimacy',
    fields: ORGANIZATION_FIELDS
  },
  {
    id: 'local_business',
    name: 'Local Business',
    type: 'LocalBusiness',
    description: 'Business with physical location',
    icon: 'LocalBusiness',
    aiImpact: 'Essential for location-based AI recommendations',
    fields: LOCAL_BUSINESS_FIELDS
  },
  {
    id: 'product',
    name: 'Product(s)',
    type: 'Product',
    description: 'Single or multiple products with pricing',
    icon: 'Product',
    aiImpact: 'Enables AI to recommend your products in shopping queries',
    fields: PRODUCT_FIELDS,
    supportsMultiple: true
  },
  {
    id: 'service',
    name: 'Service(s)',
    type: 'Service',
    description: 'Professional services your business offers',
    icon: 'Service',
    aiImpact: 'Helps AI recommend your services for relevant queries',
    fields: SERVICE_FIELDS,
    supportsMultiple: true
  },
  {
    id: 'article',
    name: 'Article',
    type: 'Article',
    description: 'Blog posts and news articles',
    icon: 'Article',
    aiImpact: 'Increases chances of being cited as an authoritative source',
    fields: ARTICLE_FIELDS
  },
  {
    id: 'faq',
    name: 'FAQ Page',
    type: 'FAQPage',
    description: 'Frequently asked questions',
    icon: 'FAQPage',
    aiImpact: 'High impact - AI often features FAQ answers directly',
    fields: FAQ_FIELDS
  },
  {
    id: 'website',
    name: 'WebSite',
    type: 'WebSite',
    description: 'Site-wide information',
    icon: 'WebSite',
    aiImpact: 'Helps AI understand your site structure',
    fields: WEBSITE_FIELDS
  },
  {
    id: 'breadcrumb',
    name: 'Breadcrumb',
    type: 'BreadcrumbList',
    description: 'Navigation path structure',
    icon: 'BreadcrumbList',
    aiImpact: 'Improves content hierarchy understanding',
    fields: BREADCRUMB_FIELDS
  }
]

const DEFAULT_PRODUCT: ProductItem = {
  name: '',
  description: '',
  price: '',
  currency: 'USD',
  image: '',
  sku: '',
  availability: 'InStock'
}

const DEFAULT_SERVICE: ServiceItem = {
  name: '',
  description: '',
  provider: '',
  areaServed: '',
  price: ''
}

export default function SchemaBuilderPage() {
  const { currentBrand } = useBrand()
  const { addToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [analyzeUrl, setAnalyzeUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [schemaInput, setSchemaInput] = useState('')
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [generatedSchema, setGeneratedSchema] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [faqItems, setFaqItems] = useState<Array<{ question: string; answer: string }>>([{ question: '', answer: '' }])
  const [productItems, setProductItems] = useState<ProductItem[]>([{ ...DEFAULT_PRODUCT }])
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([{ ...DEFAULT_SERVICE }])
  const [breadcrumbItems, setBreadcrumbItems] = useState<Array<{ name: string; url: string }>>([{ name: '', url: '' }])
  const [viewingSchema, setViewingSchema] = useState<any>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [placementMethod, setPlacementMethod] = useState<'head' | 'body-top' | 'body-bottom' | 'specific'>('head')
  // URL-based schema fetching
  const [fetchUrl, setFetchUrl] = useState('')
  const [isFetchingSchemas, setIsFetchingSchemas] = useState(false)
  const [fetchedSchemas, setFetchedSchemas] = useState<any[]>([])
  const [selectedFetchedSchema, setSelectedFetchedSchema] = useState<number | null>(null)

  // Get the current template's fields
  const currentTemplate = SCHEMA_TEMPLATES.find(t => t.id === selectedTemplate)

  useEffect(() => {
    const siteUrl = currentBrand?.company_website || (currentBrand?.primary_domain ? `https://${currentBrand.primary_domain}` : '')
    if (siteUrl) {
      setAnalyzeUrl(siteUrl)
    }
  }, [currentBrand])

  // Reset form when template changes
  useEffect(() => {
    if (currentTemplate && currentBrand) {
      const initialData: Record<string, any> = {}
      
      // Pre-fill common fields from brand
      if (currentTemplate.fields.some(f => f.key === 'name')) {
        initialData.name = currentBrand.name || ''
      }
      if (currentTemplate.fields.some(f => f.key === 'url')) {
        initialData.url = currentBrand.company_website || (currentBrand.primary_domain ? `https://${currentBrand.primary_domain}` : '')
      }
      if (currentTemplate.fields.some(f => f.key === 'description')) {
        initialData.description = currentBrand.description || ''
      }
      if (currentTemplate.fields.some(f => f.key === 'brand')) {
        initialData.brand = currentBrand.name || ''
      }
      if (currentTemplate.fields.some(f => f.key === 'publisherName')) {
        initialData.publisherName = currentBrand.name || ''
      }
      if (currentTemplate.fields.some(f => f.key === 'provider')) {
        initialData.provider = currentBrand.name || ''
      }
      
      // Pre-fill breadcrumb with home page
      if (selectedTemplate === 'breadcrumb') {
        const siteUrl = currentBrand.company_website || `https://${currentBrand.primary_domain || 'yoursite.com'}`
        setBreadcrumbItems([{ name: 'Home', url: siteUrl }])
      }
      
      setFormData(initialData)
      setFaqItems([{ question: '', answer: '' }])
      setProductItems([{ ...DEFAULT_PRODUCT }])
      setServiceItems([{ ...DEFAULT_SERVICE }])
      setGeneratedSchema('')
    }
  }, [selectedTemplate, currentBrand, currentTemplate])

  // Comprehensive schema validation
  const validateSchemaComprehensive = (schema: any): ValidationResult => {
    const errors: Array<{ path: string; message: string; fix?: string }> = []
    const warnings: Array<{ path: string; message: string; fix?: string }> = []

    // Check for @context
    if (!schema['@context']) {
      errors.push({ 
        path: '@context', 
        message: 'Missing @context property', 
        fix: '"@context": "https://schema.org"'
      })
    } else if (schema['@context'] !== 'https://schema.org' && schema['@context'] !== 'http://schema.org') {
      warnings.push({ 
        path: '@context', 
        message: 'Consider using https://schema.org for better compatibility',
        fix: '"@context": "https://schema.org"'
      })
    }

    // Check for @type
    if (!schema['@type']) {
      errors.push({ path: '@type', message: 'Missing @type property' })
    }

    const type = schema['@type']

    // Type-specific validation
    if (type === 'Organization' || type === 'LocalBusiness') {
      if (!schema.name) errors.push({ path: 'name', message: 'Organization name is required' })
      if (!schema.url) errors.push({ path: 'url', message: 'URL is required' })
      if (!schema.logo) warnings.push({ path: 'logo', message: 'Adding a logo improves brand recognition', fix: '"logo": "https://yoursite.com/logo.png"' })
      if (!schema.description) warnings.push({ path: 'description', message: 'Adding a description helps AI understand your brand' })
      if (!schema.sameAs) warnings.push({ path: 'sameAs', message: 'Add social media links to improve authority signals' })
    }

    if (type === 'Product') {
      if (!schema.name) errors.push({ path: 'name', message: 'Product name is required' })
      if (!schema.description) warnings.push({ path: 'description', message: 'Product description improves AI recommendations' })
      if (!schema.image) warnings.push({ path: 'image', message: 'Product images significantly improve visibility' })
      if (!schema.offers) {
        warnings.push({ path: 'offers', message: 'Adding price information helps with shopping queries' })
      } else {
        if (!schema.offers.price) errors.push({ path: 'offers.price', message: 'Price is required for product offers' })
        if (!schema.offers.priceCurrency) warnings.push({ path: 'offers.priceCurrency', message: 'Specify currency (e.g., USD)', fix: '"priceCurrency": "USD"' })
        if (!schema.offers.availability) warnings.push({ path: 'offers.availability', message: 'Add availability status for better shopping results' })
      }
      if (!schema.brand) warnings.push({ path: 'brand', message: 'Adding brand information improves product authority' })
    }

    if (type === 'Article') {
      if (!schema.headline) errors.push({ path: 'headline', message: 'Article headline is required' })
      if (!schema.author) errors.push({ path: 'author', message: 'Author information is required' })
      if (!schema.datePublished) errors.push({ path: 'datePublished', message: 'Publication date is required' })
      if (!schema.image) warnings.push({ path: 'image', message: 'Articles with images get more visibility' })
      if (!schema.publisher) warnings.push({ path: 'publisher', message: 'Publisher information adds credibility' })
      if (schema.datePublished && !/^\d{4}-\d{2}-\d{2}/.test(schema.datePublished)) {
        warnings.push({ path: 'datePublished', message: 'Use ISO 8601 date format (YYYY-MM-DD)', fix: `"datePublished": "${new Date().toISOString().split('T')[0]}"` })
      }
    }

    if (type === 'FAQPage') {
      if (!schema.mainEntity || !Array.isArray(schema.mainEntity) || schema.mainEntity.length === 0) {
        errors.push({ path: 'mainEntity', message: 'FAQ Page must have at least one question' })
      } else {
        schema.mainEntity.forEach((q: any, i: number) => {
          if (!q.name) errors.push({ path: `mainEntity[${i}].name`, message: `Question ${i + 1} is missing the question text` })
          if (!q.acceptedAnswer?.text) errors.push({ path: `mainEntity[${i}].acceptedAnswer.text`, message: `Question ${i + 1} is missing an answer` })
        })
      }
    }

    if (type === 'Service') {
      if (!schema.name) errors.push({ path: 'name', message: 'Service name is required' })
      if (!schema.description) warnings.push({ path: 'description', message: 'Service description helps AI understand what you offer' })
      if (!schema.provider) warnings.push({ path: 'provider', message: 'Add provider information for credibility' })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  // Apply a suggestion/fix to the schema
  const applySuggestion = (fix: string) => {
    try {
      const currentSchema = JSON.parse(schemaInput)
      const fixObj = JSON.parse(`{${fix}}`)
      const updatedSchema = { ...currentSchema, ...fixObj }
      setSchemaInput(JSON.stringify(updatedSchema, null, 2))
      addToast({ type: 'success', title: 'Applied!', message: 'Suggestion applied. Re-validate to check.' })
    } catch (e) {
      addToast({ type: 'error', title: 'Error', message: 'Could not apply suggestion automatically' })
    }
  }

  const analyzeSchema = async () => {
    if (!analyzeUrl) {
      addToast({ type: 'error', title: 'Error', message: 'Please enter a URL to analyze.' })
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/discoverability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze-schema',
          brand_id: currentBrand?.id,
          url: analyzeUrl
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAnalysisResult(data.analysis)
        addToast({ type: 'success', title: 'Analysis Complete', message: 'Schema analysis completed.' })
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Analysis failed')
      }
    } catch (error) {
      addToast({ 
        type: 'error', 
        title: 'Error', 
        message: error instanceof Error ? error.message : 'Failed to analyze schema.' 
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Fetch schemas from a URL (like schema.org validator)
  const fetchSchemasFromUrl = async (url: string) => {
    if (!url.trim()) {
      addToast({ type: 'error', title: 'Error', message: 'Please enter a URL to fetch schemas from.' })
      return
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      addToast({ type: 'error', title: 'Invalid URL', message: 'Please enter a valid URL (e.g., https://example.com)' })
      return
    }

    setIsFetchingSchemas(true)
    setFetchedSchemas([])
    setSelectedFetchedSchema(null)
    setValidationResult(null)

    try {
      const response = await fetch('/api/discoverability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze-schema',
          brand_id: currentBrand?.id,
          url: url
        })
      })

      if (response.ok) {
        const data = await response.json()
        const schemas = data.analysis?.schemas || []
        
        if (schemas.length === 0) {
          addToast({ 
            type: 'warning', 
            title: 'No Schemas Found', 
            message: 'No JSON-LD structured data found on this page. Make sure the page has schema markup.' 
          })
        } else {
          setFetchedSchemas(schemas)
          addToast({ 
            type: 'success', 
            title: 'Schemas Found!', 
            message: `Found ${schemas.length} schema(s) on this page.` 
          })
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch schemas')
      }
    } catch (error) {
      addToast({ 
        type: 'error', 
        title: 'Error', 
        message: error instanceof Error ? error.message : 'Failed to fetch schemas from URL. Make sure the URL is accessible.' 
      })
    } finally {
      setIsFetchingSchemas(false)
    }
  }

  const validateSchema = async () => {
    if (!schemaInput.trim()) {
      addToast({ type: 'error', title: 'Error', message: 'Please enter JSON-LD to validate.' })
      return
    }

    setIsValidating(true)
    try {
      let schema
      try {
        schema = JSON.parse(schemaInput)
      } catch {
        setValidationResult({
          valid: false,
          errors: [{ path: 'root', message: 'Invalid JSON syntax. Check for missing commas, brackets, or quotes.' }],
          warnings: []
        })
        setIsValidating(false)
        return
      }

      // Use our comprehensive local validation
      const result = validateSchemaComprehensive(schema)
      setValidationResult(result)

    } catch (error) {
      addToast({ type: 'error', title: 'Error', message: 'Validation failed.' })
    } finally {
      setIsValidating(false)
    }
  }

  // Verify schema is discoverable by LLMs
  const verifySchemaDiscoverability = async (url: string) => {
    setIsVerifying(true)
    setVerificationResult(null)
    
    try {
      const response = await fetch('/api/discoverability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze-schema',
          brand_id: currentBrand?.id,
          url: url
        })
      })

      if (response.ok) {
        const data = await response.json()
        const analysis = data.analysis
        
        // Build verification result matching VerificationResult interface
        const result: VerificationResult = {
          isDiscoverable: analysis?.schemas?.length > 0,
          schemasFound: analysis?.schemas?.length || 0,
          schemaTypes: analysis?.schema_types || [],
          recommendations: analysis?.recommendations || []
        }
        
        setVerificationResult(result)
        addToast({ 
          type: result.isDiscoverable ? 'success' : 'warning', 
          title: result.isDiscoverable ? 'Schemas Found!' : 'No Schemas Found', 
          message: result.isDiscoverable 
            ? `Found ${result.schemasFound} schema(s) on your page` 
            : 'No structured data detected on this URL'
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Verification failed')
      }
    } catch (error) {
      addToast({ 
        type: 'error', 
        title: 'Error', 
        message: error instanceof Error ? error.message : 'Could not verify schema discoverability' 
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const generateFromTemplate = async () => {
    if (!selectedTemplate || !currentTemplate) {
      addToast({ type: 'error', title: 'Error', message: 'Please select a template.' })
      return
    }

    // Validate required fields first (skip for product/service which use separate item builders)
    if (selectedTemplate !== 'product' && selectedTemplate !== 'service') {
      const missingFields = currentTemplate.fields
        .filter(f => f.required && f.type !== 'faq-list' && f.type !== 'product-list' && f.type !== 'service-list')
        .filter(f => !formData[f.key]?.trim())
        .map(f => f.name)
      
      if (missingFields.length > 0) {
        addToast({ 
          type: 'error', 
          title: 'Missing Required Fields', 
          message: `Please fill in: ${missingFields.join(', ')}` 
        })
        return
      }
    }

    setIsGenerating(true)
    try {
      // Generate schema locally based on template type
      let schema: any = {
        "@context": "https://schema.org",
        "@type": currentTemplate.type
      }

      switch (selectedTemplate) {
        case 'organization':
          // Parse social media URLs
          let sameAs: string[] = []
          if (formData.sameAs) {
            sameAs = formData.sameAs.split(',').map((url: string) => url.trim()).filter(Boolean)
          }
          
          schema = {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: formData.name,
            url: formData.url,
            ...(formData.description && { description: formData.description }),
            ...(formData.logo && { logo: { "@type": "ImageObject", url: formData.logo } }),
            ...(formData.email && { email: formData.email }),
            ...(formData.telephone && { telephone: formData.telephone }),
            ...(formData.foundingDate && { foundingDate: formData.foundingDate }),
            ...(sameAs.length > 0 && { sameAs }),
          }
          break

        case 'local_business':
          const businessType = formData.businessType || 'LocalBusiness'
          schema = {
            "@context": "https://schema.org",
            "@type": businessType,
            name: formData.name,
            url: formData.url,
            ...(formData.description && { description: formData.description }),
            address: {
              "@type": "PostalAddress",
              streetAddress: formData.streetAddress,
              addressLocality: formData.addressLocality,
              ...(formData.addressRegion && { addressRegion: formData.addressRegion }),
              ...(formData.postalCode && { postalCode: formData.postalCode }),
              ...(formData.addressCountry && { addressCountry: formData.addressCountry }),
            },
            ...(formData.telephone && { telephone: formData.telephone }),
            ...(formData.openingHours && { openingHours: formData.openingHours }),
            ...(formData.priceRange && { priceRange: formData.priceRange }),
          }
          break

        case 'product':
          const validProducts = productItems.filter(p => p.name.trim())
          if (validProducts.length === 0) {
            addToast({ type: 'error', title: 'Error', message: 'Please add at least one product.' })
            setIsGenerating(false)
            return
          }
          
          if (validProducts.length === 1) {
            const p = validProducts[0]
            schema = {
              "@context": "https://schema.org",
              "@type": "Product",
              name: p.name,
              ...(p.description && { description: p.description }),
              ...(p.image && { image: p.image }),
              ...(currentBrand?.name && { brand: { "@type": "Brand", name: currentBrand.name } }),
              ...(p.sku && { sku: p.sku }),
              offers: {
                "@type": "Offer",
                price: p.price || "0",
                priceCurrency: p.currency || "USD",
                availability: `https://schema.org/${p.availability || 'InStock'}`,
                url: formData.url || currentBrand?.company_website
              }
            }
          } else {
            // Multiple products - use ItemList
            schema = {
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: `${currentBrand?.name || 'Our'} Products`,
              numberOfItems: validProducts.length,
              itemListElement: validProducts.map((p, index) => ({
                "@type": "ListItem",
                position: index + 1,
                item: {
                  "@type": "Product",
                  name: p.name,
                  ...(p.description && { description: p.description }),
                  ...(p.image && { image: p.image }),
                  ...(currentBrand?.name && { brand: { "@type": "Brand", name: currentBrand.name } }),
                  ...(p.sku && { sku: p.sku }),
                  offers: {
                    "@type": "Offer",
                    price: p.price || "0",
                    priceCurrency: p.currency || "USD",
                    availability: `https://schema.org/${p.availability || 'InStock'}`
                  }
                }
              }))
            }
          }
          break

        case 'service':
          const validServices = serviceItems.filter(s => s.name.trim())
          if (validServices.length === 0) {
            addToast({ type: 'error', title: 'Error', message: 'Please add at least one service.' })
            setIsGenerating(false)
            return
          }
          
          if (validServices.length === 1) {
            const s = validServices[0]
            schema = {
              "@context": "https://schema.org",
              "@type": "Service",
              name: s.name,
              ...(s.description && { description: s.description }),
              provider: {
                "@type": "Organization",
                name: s.provider || currentBrand?.name || ''
              },
              ...(s.areaServed && { areaServed: s.areaServed }),
              ...(s.price && { 
                offers: {
                  "@type": "Offer",
                  price: s.price,
                  priceCurrency: "USD"
                }
              })
            }
          } else {
            // Multiple services - generate array
            schema = validServices.map(s => ({
              "@context": "https://schema.org",
              "@type": "Service",
              name: s.name,
              ...(s.description && { description: s.description }),
              provider: {
                "@type": "Organization",
                name: s.provider || currentBrand?.name || ''
              },
              ...(s.areaServed && { areaServed: s.areaServed }),
              ...(s.price && { 
                offers: {
                  "@type": "Offer",
                  price: s.price,
                  priceCurrency: "USD"
                }
              })
            }))
          }
          break

        case 'article':
          schema = {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: formData.headline,
            url: formData.url,
            ...(formData.description && { description: formData.description }),
            ...(formData.image && { image: formData.image }),
            author: {
              "@type": "Person",
              name: formData.authorName,
              ...(formData.authorUrl && { url: formData.authorUrl }),
            },
            ...(formData.datePublished && { datePublished: formData.datePublished }),
            ...(formData.dateModified && { dateModified: formData.dateModified }),
            ...(formData.wordCount && { wordCount: parseInt(formData.wordCount) }),
            ...(formData.publisherName && {
              publisher: {
                "@type": "Organization",
                name: formData.publisherName,
                ...(formData.publisherLogo && { logo: { "@type": "ImageObject", url: formData.publisherLogo } }),
              }
            }),
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": formData.url
            }
          }
          break

        case 'faq':
          const validFaqs = faqItems.filter(f => f.question.trim() && f.answer.trim())
          if (validFaqs.length === 0) {
            addToast({ type: 'error', title: 'Error', message: 'Please add at least one FAQ item.' })
            setIsGenerating(false)
            return
          }
          schema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            ...(formData.url && { url: formData.url }),
            mainEntity: validFaqs.map(faq => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              }
            }))
          }
          break

        case 'website':
          schema = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: formData.name,
            url: formData.url,
            ...(formData.description && { description: formData.description }),
            ...(formData.alternateName && { alternateName: formData.alternateName }),
            ...(formData.searchUrl && {
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: formData.searchUrl
                },
                "query-input": "required name=search_term"
              }
            }),
          }
          break

        case 'breadcrumb':
          const validBreadcrumbs = breadcrumbItems.filter(b => b.name.trim() && b.url.trim())
          if (validBreadcrumbs.length === 0) {
            addToast({ type: 'error', title: 'Error', message: 'Please add at least one breadcrumb item with name and URL.' })
            setIsGenerating(false)
            return
          }
          schema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: validBreadcrumbs.map((item, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: item.name,
              item: item.url,
            }))
          }
          break
      }

      setGeneratedSchema(JSON.stringify(schema, null, 2))
      addToast({ type: 'success', title: 'Generated!', message: 'Your schema is ready to use.' })
    } catch (error) {
      console.error('Schema generation error:', error)
      addToast({ 
        type: 'error', 
        title: 'Generation Failed', 
        message: error instanceof Error ? error.message : 'An unexpected error occurred while generating the schema.' 
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate placement code based on selected method
  const getPlacementCode = (schema: string): string => {
    const scriptTag = `<script type="application/ld+json">
${schema}
</script>`
    
    switch (placementMethod) {
      case 'head':
        return `<!-- Add to your <head> section -->
${scriptTag}`
      case 'body-top':
        return `<!-- Add right after opening <body> tag -->
${scriptTag}`
      case 'body-bottom':
        return `<!-- Add before closing </body> tag -->
${scriptTag}`
      case 'specific':
        return `<!-- Add near the relevant content on your page -->
<!-- For example, place Product schema near product info, FAQ schema near FAQ section -->
${scriptTag}`
      default:
        return scriptTag
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    addToast({ type: 'success', title: 'Copied!', message: 'Schema copied to clipboard.' })
  }

  const getIconComponent = (iconName: string) => {
    return SCHEMA_ICONS[iconName] || SCHEMA_ICONS.default
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  if (!currentBrand) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FileCode className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">No Brand Selected</h2>
          <p className="text-muted-foreground">Please select a brand to build schema markup.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileCode className="h-6 w-6 text-primary" />
            Schema Builder
          </h1>
          <p className="text-muted-foreground mt-1">
            Create structured data markup to help AI engines understand and recommend your brand
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href="https://schema.org" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Schema.org Docs
            </a>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/technical-seo">
              <Brain className="h-4 w-4 mr-2" />
              Technical SEO
            </Link>
          </Button>
        </div>
      </div>

      {/* Value Proposition */}
      <Alert className="border-purple-500/20 bg-purple-500/5">
        <Sparkles className="h-4 w-4 text-purple-500" />
        <AlertTitle>Why Schema Matters for AI Visibility</AlertTitle>
        <AlertDescription>
          Schema.org markup helps AI engines understand your brand, products, and expertise.
          When AI assistants answer questions about your industry, proper schema markup increases 
          the chances they'll recommend your brand with accurate information.
        </AlertDescription>
      </Alert>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-gray-200 h-12 rounded-lg p-1 gap-1 w-full">
          <TabsTrigger value="overview" className="gap-2 text-gray-500 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-5 py-2 text-sm font-medium transition-all flex-1">Overview</TabsTrigger>
          <TabsTrigger value="analyze" className="gap-2 text-gray-500 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-5 py-2 text-sm font-medium transition-all flex-1">Analyze Site</TabsTrigger>
          <TabsTrigger value="generate" className="gap-2 text-gray-500 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-5 py-2 text-sm font-medium transition-all flex-1">Generate Schema</TabsTrigger>
          <TabsTrigger value="validate" className="gap-2 text-gray-500 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-5 py-2 text-sm font-medium transition-all flex-1">Validate</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Status */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Schema Score</p>
                    <p className={`text-3xl font-bold mt-1 ${getScoreColor(analysisResult?.score || 0)}`}>
                      {analysisResult?.score || '—'}
                      {analysisResult?.score !== undefined && <span className="text-sm font-normal text-muted-foreground">/100</span>}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-500/10">
                    <FileCode className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
                {!analysisResult && (
                  <Button 
                    variant="link" 
                    className="px-0 mt-2" 
                    onClick={() => {
                      setActiveTab('analyze')
                      setTimeout(analyzeSchema, 100)
                    }}
                  >
                    Analyze your site <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Schemas Found</p>
                    <p className="text-3xl font-bold mt-1">
                      {analysisResult?.schemas_found || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-500/10">
                    <Code className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Types: {analysisResult?.schema_types?.join(', ') || 'None detected'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Recommendations</p>
                    <p className="text-3xl font-bold mt-1">
                      {analysisResult?.recommendations?.length || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-yellow-500/10">
                    <AlertTriangle className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Improvements to boost AI visibility
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Schema Templates for AI */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Schema Types for AI Visibility</CardTitle>
              <CardDescription>
                Each schema type helps AI understand different aspects of your brand. Click any to generate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {SCHEMA_TEMPLATES.map((template) => {
                  const IconComponent = getIconComponent(template.icon)
                  const hasSchema = analysisResult?.schema_types?.includes(template.type)
                  
                  return (
                    <div 
                      key={template.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-primary/50 group ${
                        hasSchema ? 'border-green-500/30 bg-green-500/5' : ''
                      }`}
                      onClick={() => {
                        setSelectedTemplate(template.id)
                        setActiveTab('generate')
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${hasSchema ? 'bg-green-500/10' : 'bg-primary/10'}`}>
                          <IconComponent className={`h-5 w-5 ${hasSchema ? 'text-green-500' : 'text-primary'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm">{template.name}</h4>
                            {hasSchema ? (
                              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                Generate
                                <ArrowRight className="h-3 w-3 ml-1" />
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                          <p className="text-xs text-primary mt-2 flex items-start gap-1">
                            <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {template.aiImpact}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Missing Schemas Alert */}
          {analysisResult && !analysisResult.has_organization && (
            <Alert className="border-yellow-500/30 bg-yellow-500/5">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertTitle>Missing Key Schema</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>Organization schema is essential for AI to understand your brand identity.</span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setSelectedTemplate('organization')
                    setActiveTab('generate')
                  }}
                >
                  Add Organization Schema
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col items-center justify-center gap-2"
                  onClick={() => {
                    setActiveTab('analyze')
                    setTimeout(analyzeSchema, 100)
                  }}
                >
                  <Search className="h-5 w-5" />
                  <span>Analyze My Site</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col items-center justify-center gap-2"
                  onClick={() => {
                    setSelectedTemplate('organization')
                    setActiveTab('generate')
                  }}
                >
                  <Building className="h-5 w-5" />
                  <span>Add Organization</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col items-center justify-center gap-2"
                  onClick={() => {
                    setSelectedTemplate('faq')
                    setActiveTab('generate')
                  }}
                >
                  <HelpCircle className="h-5 w-5" />
                  <span>Add FAQ Schema</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How Schema Improves AI Visibility</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="p-3 rounded-full bg-purple-500/10 w-fit mx-auto mb-3">
                    <FileCode className="h-6 w-6 text-purple-500" />
                  </div>
                  <h4 className="font-semibold mb-2">1. Add Structured Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Schema.org markup tells machines exactly what your content means - your brand name, products, FAQs, and expertise.
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="p-3 rounded-full bg-blue-500/10 w-fit mx-auto mb-3">
                    <Bot className="h-6 w-6 text-blue-500" />
                  </div>
                  <h4 className="font-semibold mb-2">2. AI Crawlers Index It</h4>
                  <p className="text-sm text-muted-foreground">
                    When GPTBot, ClaudeBot, and others crawl your site, they use schema to understand your brand context accurately.
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="p-3 rounded-full bg-green-500/10 w-fit mx-auto mb-3">
                    <Sparkles className="h-6 w-6 text-green-500" />
                  </div>
                  <h4 className="font-semibold mb-2">3. Better AI Recommendations</h4>
                  <p className="text-sm text-muted-foreground">
                    AI assistants can recommend your brand with confidence, citing accurate information from your structured data.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analyze" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analyze Your Site's Schema</CardTitle>
              <CardDescription>
                Scan your website to see what structured data exists and what's missing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="https://yoursite.com"
                  value={analyzeUrl}
                  onChange={(e) => setAnalyzeUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={analyzeSchema} disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                </Button>
              </div>

              {analysisResult && (
                <div className="space-y-6 mt-6">
                  {/* Score Card */}
                  <div className="flex items-center gap-6 p-6 rounded-lg border bg-muted/30">
                    <div className={`text-5xl font-bold ${getScoreColor(analysisResult.score || 0)}`}>
                      {analysisResult.score || 0}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Schema Completeness Score</p>
                      <p className="text-sm text-muted-foreground">
                        {analysisResult.schemas_found || 0} schema type(s) detected on your page
                      </p>
                      <div className="flex gap-2 mt-2">
                        {analysisResult.has_organization && <Badge variant="outline" className="bg-green-500/10">Organization ✓</Badge>}
                        {analysisResult.has_website && <Badge variant="outline" className="bg-green-500/10">WebSite ✓</Badge>}
                        {analysisResult.has_faq && <Badge variant="outline" className="bg-green-500/10">FAQ ✓</Badge>}
                      </div>
                    </div>
                  </div>

                  {/* Found Schemas */}
                  {analysisResult.schemas && analysisResult.schemas.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Detected Schemas ({analysisResult.schemas.length})
                      </h4>
                      <div className="space-y-3">
                        {analysisResult.schemas.map((schema: any, i: number) => {
                          const IconComponent = getIconComponent(schema['@type'])
                          const schemaStr = JSON.stringify(schema, null, 2)
                          const isLong = schemaStr.length > 300
                          return (
                            <div key={i} className="p-4 rounded-lg border">
                              <div className="flex items-center gap-3 mb-2">
                                <IconComponent className="h-5 w-5 text-primary" />
                                <span className="font-semibold">{schema['@type']}</span>
                                {schema.name && <span className="text-sm text-muted-foreground">- {schema.name}</span>}
                                <Badge variant="default" className="ml-auto">Valid</Badge>
                              </div>
                              <pre className="bg-muted/50 p-3 rounded text-xs overflow-x-auto font-mono max-h-32 overflow-y-auto">
                                {isLong ? schemaStr.slice(0, 300) + '...' : schemaStr}
                              </pre>
                              {isLong && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="mt-2"
                                  onClick={() => setViewingSchema(schema)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Full Schema
                                </Button>
                              )}
                              <div className="flex gap-2 mt-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => copyToClipboard(schemaStr)}
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Recommendations to Improve AI Visibility
                      </h4>
                      <div className="space-y-2">
                        {analysisResult.recommendations.map((rec: string, i: number) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm">{rec}</p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                // Map recommendation to template
                                if (rec.includes('Organization')) setSelectedTemplate('organization')
                                else if (rec.includes('WebSite')) setSelectedTemplate('website')
                                else if (rec.includes('FAQ')) setSelectedTemplate('faq')
                                else if (rec.includes('Breadcrumb')) setSelectedTemplate('breadcrumb')
                                setActiveTab('generate')
                              }}
                            >
                              Fix
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!analysisResult && !isAnalyzing && (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Enter your website URL above and click "Analyze" to see your schema status
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Generate Schema Markup
              </CardTitle>
              <CardDescription>
                Select a schema type and fill in the specific fields to generate ready-to-use JSON-LD
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Template Selection */}
              <div>
                <Label className="text-base font-medium">Select Schema Type</Label>
                <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 mt-3">
                  {SCHEMA_TEMPLATES.map((template) => {
                    const IconComponent = getIconComponent(template.icon)
                    const isSelected = selectedTemplate === template.id
                    
                    return (
                      <div 
                        key={template.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedTemplate(template.id)}
                      >
                        <div className="flex items-center gap-2">
                          <IconComponent className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className={`text-sm font-medium ${isSelected ? 'text-primary' : ''}`}>
                            {template.name}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {currentTemplate && (
                <>
                  {/* Template Info Banner */}
                  <Alert className="border-primary/20 bg-primary/5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <AlertTitle>Creating {currentTemplate.name} Schema</AlertTitle>
                    <AlertDescription>{currentTemplate.aiImpact}</AlertDescription>
                  </Alert>

                  {/* Dynamic Form Fields */}
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {currentTemplate.fields.filter(f => f.type !== 'faq-list' && f.type !== 'product-list' && f.type !== 'service-list' && f.type !== 'textarea').map((field) => (
                        <div key={field.key}>
                          <Label className="flex items-center gap-1">
                            {field.name}
                            {field.required && <span className="text-red-500">*</span>}
                          </Label>
                          {field.type === 'select' ? (
                            <Select 
                              value={formData[field.key] || ''} 
                              onValueChange={(v) => setFormData({...formData, [field.key]: v})}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options?.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                              className="mt-1"
                              value={formData[field.key] || ''}
                              onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                              placeholder={field.placeholder}
                            />
                          )}
                          {field.hint && <p className="text-xs text-muted-foreground mt-1">{field.hint}</p>}
                        </div>
                      ))}
                    </div>

                    {/* Textarea fields (full width) */}
                    {currentTemplate.fields.filter(f => f.type === 'textarea').map((field) => (
                      <div key={field.key}>
                        <Label className="flex items-center gap-1">
                          {field.name}
                          {field.required && <span className="text-red-500">*</span>}
                        </Label>
                        <Textarea
                          className="mt-1"
                          value={formData[field.key] || ''}
                          onChange={(e) => setFormData({...formData, [field.key]: e.target.value})}
                          placeholder={field.placeholder}
                          rows={3}
                        />
                        {field.hint && <p className="text-xs text-muted-foreground mt-1">{field.hint}</p>}
                      </div>
                    ))}

                    {/* Product Items Builder */}
                    {selectedTemplate === 'product' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-base font-medium">Products</Label>
                            <p className="text-xs text-muted-foreground">Add one or more products. Multiple products create an ItemList schema.</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setProductItems([...productItems, { ...DEFAULT_PRODUCT }])}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Product
                          </Button>
                        </div>
                        <div className="space-y-4">
                          {productItems.map((item, index) => (
                            <div key={index} className="p-4 rounded-lg border bg-muted/30 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">Product {index + 1}</span>
                                {productItems.length > 1 && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-red-500 hover:text-red-600"
                                    onClick={() => setProductItems(productItems.filter((_, i) => i !== index))}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                  <Label className="text-xs">Product Name <span className="text-red-500">*</span></Label>
                                  <Input
                                    placeholder="Premium Widget"
                                    value={item.name}
                                    onChange={(e) => {
                                      const updated = [...productItems]
                                      updated[index].name = e.target.value
                                      setProductItems(updated)
                                    }}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">SKU</Label>
                                  <Input
                                    placeholder="WIDGET-001"
                                    value={item.sku}
                                    onChange={(e) => {
                                      const updated = [...productItems]
                                      updated[index].sku = e.target.value
                                      setProductItems(updated)
                                    }}
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs">Description</Label>
                                <Textarea
                                  placeholder="A brief description of the product..."
                                  value={item.description}
                                  onChange={(e) => {
                                    const updated = [...productItems]
                                    updated[index].description = e.target.value
                                    setProductItems(updated)
                                  }}
                                  rows={2}
                                  className="mt-1"
                                />
                              </div>
                              <div className="grid gap-3 md:grid-cols-3">
                                <div>
                                  <Label className="text-xs">Price</Label>
                                  <Input
                                    type="number"
                                    placeholder="99.99"
                                    value={item.price}
                                    onChange={(e) => {
                                      const updated = [...productItems]
                                      updated[index].price = e.target.value
                                      setProductItems(updated)
                                    }}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Currency</Label>
                                  <Select 
                                    value={item.currency} 
                                    onValueChange={(v) => {
                                      const updated = [...productItems]
                                      updated[index].currency = v
                                      setProductItems(updated)
                                    }}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="USD">USD</SelectItem>
                                      <SelectItem value="EUR">EUR</SelectItem>
                                      <SelectItem value="GBP">GBP</SelectItem>
                                      <SelectItem value="NGN">NGN</SelectItem>
                                      <SelectItem value="KES">KES</SelectItem>
                                      <SelectItem value="ZAR">ZAR</SelectItem>
                                      <SelectItem value="GHS">GHS</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs">Availability</Label>
                                  <Select 
                                    value={item.availability} 
                                    onValueChange={(v) => {
                                      const updated = [...productItems]
                                      updated[index].availability = v
                                      setProductItems(updated)
                                    }}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="InStock">In Stock</SelectItem>
                                      <SelectItem value="OutOfStock">Out of Stock</SelectItem>
                                      <SelectItem value="PreOrder">Pre-Order</SelectItem>
                                      <SelectItem value="BackOrder">Back Order</SelectItem>
                                      <SelectItem value="Discontinued">Discontinued</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs">Image URL</Label>
                                <Input
                                  type="url"
                                  placeholder="https://example.com/product-image.jpg"
                                  value={item.image}
                                  onChange={(e) => {
                                    const updated = [...productItems]
                                    updated[index].image = e.target.value
                                    setProductItems(updated)
                                  }}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Service Items Builder */}
                    {selectedTemplate === 'service' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-base font-medium">Services</Label>
                            <p className="text-xs text-muted-foreground">Add one or more services your business offers.</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setServiceItems([...serviceItems, { ...DEFAULT_SERVICE }])}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Service
                          </Button>
                        </div>
                        <div className="space-y-4">
                          {serviceItems.map((item, index) => (
                            <div key={index} className="p-4 rounded-lg border bg-muted/30 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">Service {index + 1}</span>
                                {serviceItems.length > 1 && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-red-500 hover:text-red-600"
                                    onClick={() => setServiceItems(serviceItems.filter((_, i) => i !== index))}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                  <Label className="text-xs">Service Name <span className="text-red-500">*</span></Label>
                                  <Input
                                    placeholder="Website Development"
                                    value={item.name}
                                    onChange={(e) => {
                                      const updated = [...serviceItems]
                                      updated[index].name = e.target.value
                                      setServiceItems(updated)
                                    }}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Provider Name</Label>
                                  <Input
                                    placeholder={currentBrand?.name || 'Your Company'}
                                    value={item.provider}
                                    onChange={(e) => {
                                      const updated = [...serviceItems]
                                      updated[index].provider = e.target.value
                                      setServiceItems(updated)
                                    }}
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs">Description</Label>
                                <Textarea
                                  placeholder="A brief description of the service..."
                                  value={item.description}
                                  onChange={(e) => {
                                    const updated = [...serviceItems]
                                    updated[index].description = e.target.value
                                    setServiceItems(updated)
                                  }}
                                  rows={2}
                                  className="mt-1"
                                />
                              </div>
                              <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                  <Label className="text-xs">Area Served</Label>
                                  <Input
                                    placeholder="Worldwide, Africa, Nigeria..."
                                    value={item.areaServed}
                                    onChange={(e) => {
                                      const updated = [...serviceItems]
                                      updated[index].areaServed = e.target.value
                                      setServiceItems(updated)
                                    }}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Starting Price</Label>
                                  <Input
                                    placeholder="500"
                                    value={item.price}
                                    onChange={(e) => {
                                      const updated = [...serviceItems]
                                      updated[index].price = e.target.value
                                      setServiceItems(updated)
                                    }}
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* FAQ Items Builder */}
                    {selectedTemplate === 'faq' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-medium">FAQ Questions</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setFaqItems([...faqItems, { question: '', answer: '' }])}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Question
                          </Button>
                        </div>
                        <div className="space-y-4">
                          {faqItems.map((item, index) => (
                            <div key={index} className="p-4 rounded-lg border bg-muted/30 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">Question {index + 1}</span>
                                {faqItems.length > 1 && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-red-500 hover:text-red-600"
                                    onClick={() => setFaqItems(faqItems.filter((_, i) => i !== index))}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <Input
                                placeholder="What is your return policy?"
                                value={item.question}
                                onChange={(e) => {
                                  const updated = [...faqItems]
                                  updated[index].question = e.target.value
                                  setFaqItems(updated)
                                }}
                              />
                              <Textarea
                                placeholder="We offer a 30-day return policy on all items..."
                                value={item.answer}
                                onChange={(e) => {
                                  const updated = [...faqItems]
                                  updated[index].answer = e.target.value
                                  setFaqItems(updated)
                                }}
                                rows={2}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Breadcrumb Items Builder */}
                    {selectedTemplate === 'breadcrumb' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-base font-medium">Breadcrumb Navigation</Label>
                            <p className="text-xs text-muted-foreground">Add items in order: Home → Category → Sub-category → Page</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setBreadcrumbItems([...breadcrumbItems, { name: '', url: '' }])}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Item
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {breadcrumbItems.map((item, index) => (
                            <div key={index} className="flex items-center gap-2">
                              {index > 0 && (
                                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              )}
                              <div className="flex-1 grid gap-2 md:grid-cols-2">
                                <Input
                                  placeholder={index === 0 ? 'Home' : `Step ${index + 1} name`}
                                  value={item.name}
                                  onChange={(e) => {
                                    const updated = [...breadcrumbItems]
                                    updated[index].name = e.target.value
                                    setBreadcrumbItems(updated)
                                  }}
                                />
                                <Input
                                  type="url"
                                  placeholder={index === 0 ? 'https://yoursite.com' : `https://yoursite.com/path`}
                                  value={item.url}
                                  onChange={(e) => {
                                    const updated = [...breadcrumbItems]
                                    updated[index].url = e.target.value
                                    setBreadcrumbItems(updated)
                                  }}
                                />
                              </div>
                              {breadcrumbItems.length > 1 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 text-red-500 hover:text-red-600"
                                  onClick={() => setBreadcrumbItems(breadcrumbItems.filter((_, i) => i !== index))}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Example: Home → Products → Electronics → Smartphones
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Placement Method Selector */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Where to Place the Schema</Label>
                    <div className="grid gap-3 md:grid-cols-2">
                      {[
                        { value: 'head', label: 'In <head> Section', desc: 'Recommended for most schemas', icon: Code },
                        { value: 'body-top', label: 'Top of <body>', desc: 'After opening body tag', icon: ArrowRight },
                        { value: 'body-bottom', label: 'Bottom of <body>', desc: 'Before closing body tag', icon: ArrowRight },
                        { value: 'specific', label: 'Near Related Content', desc: 'Best for Product/Article/FAQ', icon: Lightbulb },
                      ].map((option) => {
                        const IconComp = option.icon
                        return (
                          <div 
                            key={option.value}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              placementMethod === option.value ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                            }`}
                            onClick={() => setPlacementMethod(option.value as any)}
                          >
                            <div className="flex items-center gap-2">
                              <IconComp className={`h-4 w-4 ${placementMethod === option.value ? 'text-primary' : 'text-muted-foreground'}`} />
                              <span className={`text-sm font-medium ${placementMethod === option.value ? 'text-primary' : ''}`}>
                                {option.label}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 ml-6">{option.desc}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <Button onClick={generateFromTemplate} disabled={isGenerating} size="lg">
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Generate {currentTemplate.name} Schema
                  </Button>
                </>
              )}

              {!selectedTemplate && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileCode className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Select a schema type above to get started</p>
                </div>
              )}

              {/* Generated Output */}
              {generatedSchema && (
                <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Generated JSON-LD Schema
                    </h4>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(getPlacementCode(generatedSchema))}>
                        <Copy className="h-4 w-4 mr-1" /> Copy with Tags
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedSchema)}>
                        <Code className="h-4 w-4 mr-1" /> Copy JSON Only
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        const blob = new Blob([generatedSchema], { type: 'application/json' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `${selectedTemplate}-schema.json`
                        a.click()
                      }}>
                        <Download className="h-4 w-4 mr-1" /> Download
                      </Button>
                    </div>
                  </div>
                  
                  {/* Ready-to-use code block */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Ready to Use (Copy & Paste)</Label>
                    <Textarea
                      value={getPlacementCode(generatedSchema)}
                      readOnly
                      className="font-mono text-sm h-48 bg-slate-950 text-green-400"
                    />
                  </div>
                  
                  {/* Raw JSON */}
                  <details className="group">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                      View raw JSON-LD
                    </summary>
                    <Textarea
                      value={generatedSchema}
                      readOnly
                      className="font-mono text-sm h-48 mt-2"
                    />
                  </details>
                  
                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSchemaInput(generatedSchema)
                        setActiveTab('validate')
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Validate This Schema
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      asChild
                    >
                      <a 
                        href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(currentBrand?.company_website || '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Test on Google
                      </a>
                    </Button>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Implementation Guide</AlertTitle>
                    <AlertDescription className="mt-2">
                      <ol className="list-decimal list-inside text-sm space-y-1">
                        <li>Copy the ready-to-use code above (includes script tags)</li>
                        <li>Place it in your {placementMethod === 'head' ? '<head> section' : placementMethod === 'body-top' ? 'opening <body> tag' : placementMethod === 'body-bottom' ? 'closing </body> area' : 'page near related content'}</li>
                        <li>Deploy your changes</li>
                        <li>Use the Validate tab to verify it's discoverable</li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Features */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Link href="/dashboard/crawler-analytics" className="block">
                  <div className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Bot className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Crawler Analytics</p>
                      <p className="text-sm text-muted-foreground">Ensure AI crawlers can access your schema</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
                <Link href="/dashboard/search-console" className="block">
                  <div className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Globe className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Search Console</p>
                      <p className="text-sm text-muted-foreground">Monitor how Google sees your schema</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validate" className="space-y-4">
          {/* Fetch Schemas from URL */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                Fetch Schemas from URL
              </CardTitle>
              <CardDescription>
                Enter a URL to view all JSON-LD schemas on that page (like validator.schema.org)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Website URL</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="url"
                    placeholder="https://withsoma.ai"
                    value={fetchUrl}
                    onChange={(e) => setFetchUrl(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && fetchSchemasFromUrl(fetchUrl)}
                  />
                  <Button 
                    onClick={() => fetchSchemasFromUrl(fetchUrl)}
                    disabled={isFetchingSchemas}
                  >
                    {isFetchingSchemas ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Fetch Schemas
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Example: <button 
                    type="button"
                    className="text-blue-500 hover:underline"
                    onClick={() => {
                      setFetchUrl('https://withsoma.ai')
                      fetchSchemasFromUrl('https://withsoma.ai')
                    }}
                  >
                    https://withsoma.ai
                  </button>
                </p>
              </div>

              {/* Fetched Schemas Display */}
              {fetchedSchemas.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Found {fetchedSchemas.length} Schema{fetchedSchemas.length > 1 ? 's' : ''}
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFetchedSchemas([])
                        setSelectedFetchedSchema(null)
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                  
                  {/* Schema List */}
                  <div className="grid gap-2">
                    {fetchedSchemas.map((schema, index) => {
                      const schemaType = schema['@type'] || 'Unknown'
                      const schemaName = schema.name || schema.headline || schema.title || ''
                      const IconComponent = getIconComponent(schemaType)
                      const isSelected = selectedFetchedSchema === index
                      
                      return (
                        <div 
                          key={index}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedFetchedSchema(isSelected ? null : index)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/10' : 'bg-muted'}`}>
                                <IconComponent className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                              </div>
                              <div>
                                <p className={`font-medium ${isSelected ? 'text-primary' : ''}`}>{schemaType}</p>
                                {schemaName && <p className="text-sm text-muted-foreground truncate max-w-[300px]">{schemaName}</p>}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSchemaInput(JSON.stringify(schema, null, 2))
                                  setValidationResult(null)
                                }}
                              >
                                <Code className="h-4 w-4 mr-1" />
                                Load
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyToClipboard(JSON.stringify(schema, null, 2))
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Expanded Schema View */}
                          {isSelected && (
                            <div className="mt-3 pt-3 border-t">
                              <ScrollArea className="h-[200px]">
                                <pre className="bg-muted p-3 rounded text-xs font-mono whitespace-pre-wrap break-all">
                                  {JSON.stringify(schema, null, 2)}
                                </pre>
                              </ScrollArea>
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSchemaInput(JSON.stringify(schema, null, 2))
                                    const result = validateSchemaComprehensive(schema)
                                    setValidationResult(result)
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Validate This Schema
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Validation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Validate JSON-LD Manually</CardTitle>
              <CardDescription>
                Paste schema markup to check for errors and get improvement suggestions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Paste your JSON-LD schema</Label>
                <Textarea
                  placeholder='{"@context": "https://schema.org", "@type": "Organization", "name": "...", ...}'
                  className="font-mono text-sm h-48 mt-2"
                  value={schemaInput}
                  onChange={(e) => setSchemaInput(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={validateSchema} disabled={isValidating || !schemaInput.trim()}>
                  {isValidating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Validate Schema
                </Button>
                {schemaInput && (
                  <>
                    <Button variant="outline" onClick={() => copyToClipboard(schemaInput)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setSchemaInput('')
                      setValidationResult(null)
                    }}>
                      Clear
                    </Button>
                  </>
                )}
              </div>

              {validationResult && (
                <div className="mt-4 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {validationResult.valid ? (
                        <>
                          <CheckCircle className="h-6 w-6 text-green-500" />
                          <span className="font-semibold text-green-600 text-lg">Schema is valid!</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-6 w-6 text-red-500" />
                          <span className="font-semibold text-red-600 text-lg">Schema has issues</span>
                        </>
                      )}
                    </div>
                    {(validationResult.errors?.length > 0 || validationResult.warnings?.length > 0) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Apply all fixable errors and warnings
                          const allFixes = [
                            ...(validationResult.errors?.filter(e => e.fix) || []),
                            ...(validationResult.warnings?.filter(w => w.fix) || [])
                          ]
                          if (allFixes.length > 0) {
                            allFixes.forEach(item => applySuggestion(item.fix!))
                            addToast({ type: 'success', title: 'Fixes Applied', message: `Applied ${allFixes.length} automatic fixes.` })
                          } else {
                            addToast({ type: 'info', title: 'No Auto-Fixes', message: 'No automatic fixes available.' })
                          }
                        }}
                      >
                        <Wrench className="h-4 w-4 mr-1" />
                        Apply All Fixes
                      </Button>
                    )}
                  </div>

                  {validationResult.errors?.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <h4 className="text-sm font-medium text-red-600 flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Errors ({validationResult.errors.length})
                      </h4>
                      {validationResult.errors.map((err, i) => (
                        <div key={i} className="p-3 rounded bg-red-500/10 text-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1">
                              <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="font-mono text-xs bg-red-500/20 px-1 rounded">{err.path}</span>
                                <span className="ml-2">{err.message}</span>
                              </div>
                            </div>
                            {err.fix && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-500/20"
                                onClick={() => {
                                  applySuggestion(err.fix!)
                                  addToast({ type: 'success', title: 'Fixed!', message: 'Applied the suggested fix.' })
                                }}
                              >
                                <Wrench className="h-3 w-3 mr-1" />
                                Fix
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {validationResult.warnings?.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <h4 className="text-sm font-medium text-yellow-600 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Suggestions ({validationResult.warnings.length})
                      </h4>
                      {validationResult.warnings.map((warn, i) => (
                        <div key={i} className="p-3 rounded bg-yellow-500/10 text-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1">
                              <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="font-mono text-xs bg-yellow-500/20 px-1 rounded">{warn.path}</span>
                                <span className="ml-2">{warn.message}</span>
                              </div>
                            </div>
                            {warn.fix && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-7 text-xs text-yellow-600 hover:text-yellow-700 hover:bg-yellow-500/20"
                                onClick={() => {
                                  applySuggestion(warn.fix!)
                                  addToast({ type: 'success', title: 'Applied!', message: 'Applied the suggestion.' })
                                }}
                              >
                                <CheckCheck className="h-3 w-3 mr-1" />
                                Apply
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {validationResult.valid && validationResult.errors?.length === 0 && validationResult.warnings?.length === 0 && (
                    <div className="flex items-center gap-2 p-3 rounded bg-green-500/10">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <p className="text-sm text-green-700">
                        Your schema markup is valid and follows best practices. Add it to your website to improve AI discoverability.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schema Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                Verify Schema Discoverability
              </CardTitle>
              <CardDescription>
                Check if your deployed schema is discoverable by AI engines and search crawlers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Website URL to verify</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    value={formData.verifyUrl || currentBrand?.company_website || ''}
                    onChange={(e) => setFormData({...formData, verifyUrl: e.target.value})}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => verifySchemaDiscoverability(formData.verifyUrl || currentBrand?.company_website || '')}
                    disabled={isVerifying}
                  >
                    {isVerifying ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCheck className="h-4 w-4 mr-2" />
                    )}
                    Verify
                  </Button>
                </div>
              </div>

              {verificationResult && (
                <div className="p-4 rounded-lg border space-y-4">
                  <div className="flex items-center gap-3">
                    {verificationResult.isDiscoverable ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-6 w-6" />
                        <span className="font-semibold text-lg">Schema is Discoverable!</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-6 w-6" />
                        <span className="font-semibold text-lg">Schema Not Found</span>
                      </div>
                    )}
                  </div>

                  {verificationResult.schemasFound > 0 && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Schemas Found</p>
                        <p className="text-2xl font-bold text-primary">{verificationResult.schemasFound}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Schema Types</p>
                        <p className="text-sm font-medium mt-1">{verificationResult.schemaTypes?.join(', ') || 'None'}</p>
                      </div>
                    </div>
                  )}

                  {verificationResult.recommendations?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        Recommendations
                      </h4>
                      {verificationResult.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded bg-yellow-500/10 text-sm">
                          <ArrowRight className="h-4 w-4 text-yellow-500 mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Alert className="border-blue-500/20 bg-blue-500/5">
                    <Info className="h-4 w-4 text-blue-500" />
                    <AlertTitle>Pro Tip</AlertTitle>
                    <AlertDescription className="text-sm">
                      You can also test your schema at{' '}
                      <a 
                        href="https://search.google.com/test/rich-results" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 underline"
                      >
                        Google Rich Results Test
                      </a>
                      {' '}or{' '}
                      <a 
                        href="https://validator.schema.org" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 underline"
                      >
                        Schema.org Validator
                      </a>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Full Schema Viewer Dialog */}
      <Dialog open={!!viewingSchema} onOpenChange={(open) => !open && setViewingSchema(null)}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {viewingSchema && (
                <>
                  {(() => {
                    const IconComponent = getIconComponent(viewingSchema['@type'])
                    return <IconComponent className="h-5 w-5 text-primary" />
                  })()}
                  {viewingSchema['@type']} Schema
                  {viewingSchema.name && <span className="text-muted-foreground font-normal">- {viewingSchema.name}</span>}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Full JSON-LD structured data found on your page
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col space-y-4 min-h-0">
            <ScrollArea className="flex-1 rounded-lg border">
              <div className="relative">
                <pre className="bg-muted p-4 text-sm font-mono whitespace-pre-wrap break-all">
                  {viewingSchema && JSON.stringify(viewingSchema, null, 2)}
                </pre>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="absolute top-2 right-2"
                  onClick={() => viewingSchema && copyToClipboard(JSON.stringify(viewingSchema, null, 2))}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
            </ScrollArea>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" onClick={() => setViewingSchema(null)}>Close</Button>
              <Button onClick={() => {
                if (viewingSchema) {
                  setSchemaInput(JSON.stringify(viewingSchema, null, 2))
                  setActiveTab('validate')
                  setViewingSchema(null)
                }
              }}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Validate This Schema
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
