"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/layout/notification-toast"
import { useCountries } from "@/lib/hooks/use-countries"
import BrandVisibilityAuditReport from "@/components/reports/brand-visibility-audit-report"
import {
  ArrowRight, ArrowLeft, Plus, X,
  CheckCircle, Loader2, Search, Shield, Info
} from "lucide-react"

// ─── Input Sanitization ────────────────────────────────────────────
const sanitize = (str: string) => str.replace(/<[^>]*>/g, '').replace(/[<>"'`]/g, '')
const normalizeUrl = (url: string) => {
  const t = url.trim()
  if (!t) return undefined
  return t.startsWith('http') ? t : `https://${t}`
}

// ─── Business Categories ──────────────────────────────────────────
const US_BUSINESS_TYPES: { value: string; label: string; emoji: string; hint?: string; keywords: string[] }[] = [
  { value: "restaurants", label: "Restaurant & Food", emoji: "🍔", keywords: ["restaurant", "food", "cafe", "coffee", "catering", "bakery", "bar", "grill", "pizza", "sushi", "diner", "bistro", "kitchen", "meal", "dining", "cook", "chef", "eat", "takeout", "delivery"] },
  { value: "home_services", label: "Home Services", emoji: "🔧", hint: "Plumbing, HVAC, Electrical", keywords: ["plumbing", "plumber", "hvac", "electrical", "electrician", "handyman", "home repair", "appliance", "garage door", "locksmith", "pest control", "insulation"] },
  { value: "legal_services", label: "Legal", emoji: "📝", keywords: ["law", "legal", "lawyer", "attorney", "litigation", "court", "injury", "divorce", "estate", "contract", "patent", "trademark"] },
  { value: "hospital_health_care", label: "Healthcare & Dental", emoji: "🏥", keywords: ["health", "medical", "doctor", "dental", "dentist", "clinic", "hospital", "therapy", "nurse", "patient", "pediatric", "orthopedic", "dermatology", "chiropractic", "optometry"] },
  { value: "beauty", label: "Beauty & Salon", emoji: "💇", keywords: ["beauty", "salon", "hair", "nail", "spa", "facial", "wax", "lash", "brow", "barber", "stylist", "cosmetic", "makeup", "skincare"] },
  { value: "health_wellness_fitness", label: "Fitness & Wellness", emoji: "💪", keywords: ["fitness", "gym", "workout", "yoga", "pilates", "crossfit", "personal training", "wellness", "nutrition", "weight loss", "martial arts", "boxing", "swimming"] },
  { value: "construction", label: "Construction & Trades", emoji: "🏗️", keywords: ["construction", "builder", "contractor", "remodel", "renovation", "roofing", "painting", "flooring", "concrete", "framing", "demolition", "carpentry", "welding"] },
  { value: "automotive", label: "Auto Services", emoji: "🚗", keywords: ["auto", "car", "mechanic", "oil change", "brake", "tire", "body shop", "detailing", "tow", "transmission", "collision", "vehicle", "truck", "motorcycle"] },
  { value: "real_estate_residential", label: "Real Estate", emoji: "🏠", keywords: ["real estate", "realtor", "property", "home", "house", "apartment", "rental", "mortgage", "broker", "listing", "commercial property", "land"] },
  { value: "information_technology_services", label: "Technology & IT", emoji: "💻", keywords: ["technology", "software", "saas", "app", "web", "cloud", "cyber", "it support", "data", "ai", "machine learning", "developer", "startup", "tech", "digital", "api", "platform"] },
  { value: "retail", label: "Retail & E-Commerce", emoji: "🛍️", keywords: ["retail", "store", "shop", "ecommerce", "online store", "boutique", "wholesale", "merchandise", "fashion", "clothing", "jewelry", "gift"] },
  { value: "consulting_management", label: "Marketing & Consulting", emoji: "📊", keywords: ["marketing", "consulting", "seo", "advertising", "branding", "strategy", "pr", "public relations", "social media", "content", "agency", "growth", "analytics"] },
  { value: "education_management", label: "Education & Tutoring", emoji: "📚", keywords: ["education", "school", "tutor", "training", "course", "academy", "college", "learning", "teach", "certification", "coaching", "stem", "language"] },
  { value: "cleaning_services", label: "Cleaning Services", emoji: "🧹", keywords: ["cleaning", "maid", "janitorial", "pressure wash", "carpet", "window cleaning", "sanitize", "disinfect", "housekeeping"] },
  { value: "financial_services", label: "Accounting & Finance", emoji: "💰", keywords: ["finance", "accounting", "tax", "bookkeeping", "payroll", "audit", "cpa", "investment", "wealth", "insurance", "banking", "loan", "credit", "financial planning"] },
  { value: "travel_hospitality", label: "Travel & Hospitality", emoji: "🌍", keywords: ["travel", "hotel", "hospitality", "tourism", "resort", "vacation", "booking", "airbnb", "bed and breakfast", "lodge", "tour", "cruise"] },
  { value: "pet_services", label: "Pet Services", emoji: "🐾", keywords: ["pet", "dog", "cat", "veterinary", "vet", "grooming", "boarding", "pet sitting", "animal", "puppy", "kennel", "pet food"] },
  { value: "photography_media", label: "Photography & Media", emoji: "📸", keywords: ["photography", "photographer", "video", "film", "media", "production", "wedding photo", "portrait", "studio", "drone", "editing"] },
  { value: "event_planning", label: "Events & Entertainment", emoji: "🎉", keywords: ["event", "wedding", "party", "entertainment", "dj", "catering", "venue", "planner", "concert", "festival", "banquet"] },
  { value: "landscaping", label: "Landscaping & Garden", emoji: "🌿", keywords: ["landscaping", "lawn", "garden", "tree", "mowing", "irrigation", "hardscape", "outdoor", "patio", "fencing", "yard", "nursery"] },
  { value: "logistics_shipping", label: "Logistics & Moving", emoji: "📦", keywords: ["moving", "shipping", "logistics", "freight", "storage", "warehouse", "delivery", "courier", "trucking", "relocation", "packing"] },
  { value: "nonprofit", label: "Nonprofit & Charity", emoji: "❤️", keywords: ["nonprofit", "charity", "ngo", "foundation", "volunteer", "donation", "fundraise", "community", "social impact", "mission"] },
  { value: "manufacturing", label: "Manufacturing", emoji: "🏭", keywords: ["manufacturing", "factory", "production", "assembly", "fabrication", "industrial", "supply chain", "oem", "machinery", "engineering"] },
  { value: "agriculture", label: "Agriculture & Farming", emoji: "🌾", keywords: ["agriculture", "farm", "farming", "crop", "livestock", "organic", "harvest", "dairy", "vineyard", "ranch", "greenhouse"] },
  { value: "staffing_recruiting", label: "Staffing & HR", emoji: "👥", keywords: ["staffing", "recruiting", "hr", "human resources", "talent", "hiring", "temp agency", "headhunter", "workforce", "employment", "job placement"] },
  { value: "security_services", label: "Security Services", emoji: "🚨", keywords: ["security", "guard", "surveillance", "alarm", "cctv", "patrol", "private security", "access control", "bodyguard"] },
  { value: "telecom", label: "Telecom & Internet", emoji: "📡", keywords: ["telecom", "internet", "broadband", "fiber", "wireless", "phone", "voip", "cable", "isp", "network", "5g"] },
  { value: "energy_utilities", label: "Energy & Solar", emoji: "☀️", keywords: ["energy", "solar", "electric", "power", "renewable", "wind", "battery", "utility", "ev charging", "green energy", "sustainability"] },
  { value: "childcare", label: "Childcare & Daycare", emoji: "👶", keywords: ["childcare", "daycare", "preschool", "babysit", "nanny", "after school", "children", "kids", "early learning", "montessori"] },
  { value: "funeral_services", label: "Funeral & Memorial", emoji: "🪦", keywords: ["funeral", "memorial", "cremation", "burial", "mortuary", "cemetery", "obituary", "grief", "end of life"] },
  { value: "saas", label: "SaaS & Software", emoji: "🧩", keywords: ["saas", "software", "subscription", "platform", "cloud software", "b2b software", "app", "product", "api", "dashboard", "devtools", "workflow", "automation", "nocode", "low code"] },
  { value: "fintech_payments", label: "Fintech & Payments", emoji: "💳", keywords: ["fintech", "payments", "payment processing", "stripe", "paypal", "neobank", "banking app", "lending", "crypto", "blockchain", "defi", "remittance", "checkout", "wallet", "pos"] },
  { value: "ecommerce_dtc", label: "E-Commerce & DTC", emoji: "📦", keywords: ["ecommerce", "dtc", "direct to consumer", "shopify", "online store", "dropship", "subscription box", "marketplace", "amazon seller", "fulfillment", "product page", "cart"] },
  { value: "ai_ml", label: "AI & Machine Learning", emoji: "🤖", keywords: ["ai", "artificial intelligence", "machine learning", "ml", "deep learning", "nlp", "computer vision", "generative ai", "llm", "chatbot", "automation", "data science", "predictive"] },
  { value: "cybersecurity", label: "Cybersecurity", emoji: "🔐", keywords: ["cybersecurity", "infosec", "penetration testing", "compliance", "soc", "zero trust", "identity management", "threat detection", "vulnerability", "encryption", "siem", "devsecops"] },
  { value: "devtools_infrastructure", label: "DevTools & Infra", emoji: "🛠️", keywords: ["devtools", "developer tools", "infrastructure", "cicd", "devops", "kubernetes", "docker", "monitoring", "observability", "hosting", "cdn", "serverless", "terraform"] },
  { value: "healthtech", label: "HealthTech", emoji: "🩺", keywords: ["healthtech", "health tech", "telemedicine", "telehealth", "digital health", "emr", "ehr", "patient portal", "wearable", "remote monitoring", "clinical", "medtech", "biotech"] },
  { value: "edtech", label: "EdTech & E-Learning", emoji: "🎓", keywords: ["edtech", "e-learning", "online learning", "lms", "mooc", "course platform", "skill development", "upskilling", "bootcamp", "certification platform", "virtual classroom"] },
  { value: "proptech", label: "PropTech & Real Estate Tech", emoji: "🏠", keywords: ["proptech", "property tech", "property management software", "real estate tech", "smart building", "tenant portal", "listing platform", "mortgage tech", "rental platform"] },
  { value: "marketplace", label: "Marketplace & Platform", emoji: "🔄", keywords: ["marketplace", "two-sided marketplace", "platform", "gig economy", "freelance", "on-demand", "matching", "booking platform", "service marketplace", "peer to peer"] },
  { value: "creator_economy", label: "Creator & Media", emoji: "🎬", keywords: ["creator", "influencer", "content creator", "podcast", "youtube", "newsletter", "streaming", "social media", "monetization", "patreon", "subscriber", "digital media", "publishing"] },
  { value: "hr_tech", label: "HR Tech & People Ops", emoji: "🧑‍💼", keywords: ["hr tech", "hris", "payroll software", "applicant tracking", "ats", "onboarding", "employee engagement", "workforce management", "benefits", "performance management", "people analytics"] },
  { value: "legaltech", label: "LegalTech", emoji: "⚖️", keywords: ["legaltech", "legal tech", "contract management", "e-discovery", "legal ai", "compliance software", "document automation", "legal ops", "case management", "regulatory"] },
  { value: "insurtech", label: "InsurTech", emoji: "🏦", keywords: ["insurtech", "insurance tech", "digital insurance", "claims automation", "underwriting", "quote engine", "embedded insurance", "risk assessment", "policy management"] },
  { value: "cleantech", label: "CleanTech & Climate", emoji: "🌱", keywords: ["cleantech", "climate tech", "carbon", "sustainability", "green tech", "circular economy", "ev", "electric vehicle", "carbon offset", "renewable", "net zero", "esg"] },
  { value: "gaming", label: "Gaming & Interactive", emoji: "🎮", keywords: ["gaming", "game", "esports", "game dev", "indie game", "metaverse", "vr", "ar", "augmented reality", "virtual reality", "game studio", "mobile game", "unity", "unreal"] },
  { value: "food_delivery_tech", label: "FoodTech & Delivery", emoji: "🍕", keywords: ["food tech", "food delivery", "ghost kitchen", "cloud kitchen", "restaurant tech", "pos system", "menu tech", "food ordering", "meal kit", "recipe platform", "food app"] },
  { value: "other", label: "Other", emoji: "🏷️", keywords: [] },
]

// Smart matching: score each type based on how many keywords appear in description
function scoreBusinessTypes(description: string): Map<string, number> {
  const scores = new Map<string, number>()
  if (!description.trim()) return scores
  const lower = description.toLowerCase()
  for (const type of US_BUSINESS_TYPES) {
    if (type.value === 'other') continue
    let score = 0
    for (const kw of type.keywords) {
      if (lower.includes(kw)) score += kw.includes(' ') ? 3 : 2 // multi-word matches score higher
    }
    if (score > 0) scores.set(type.value, score)
  }
  return scores
}

function getSortedBusinessTypes(description: string): typeof US_BUSINESS_TYPES {
  const scores = scoreBusinessTypes(description)
  if (scores.size === 0) return US_BUSINESS_TYPES
  return [...US_BUSINESS_TYPES].sort((a, b) => {
    if (a.value === 'other') return 1
    if (b.value === 'other') return -1
    return (scores.get(b.value) || 0) - (scores.get(a.value) || 0)
  })
}

const TOPIC_SUGGESTIONS: Record<string, string[]> = {
  restaurants: ["Menu & Specials", "Catering", "Delivery", "Reservations", "Private Events", "Happy Hour", "Brunch", "Takeout"],
  home_services: ["Emergency Repairs", "Installation", "Maintenance", "Free Estimates", "Licensed & Insured", "Same-Day Service", "Residential", "Commercial"],
  legal_services: ["Personal Injury", "Family Law", "Business Law", "Estate Planning", "Criminal Defense", "Immigration", "Free Consultation", "Real Estate Law"],
  hospital_health_care: ["Primary Care", "Dental", "Pediatrics", "Urgent Care", "Telehealth", "Insurance Accepted", "New Patients", "Preventive Care"],
  beauty: ["Haircuts & Styling", "Color & Highlights", "Nails", "Facials", "Waxing", "Massage", "Bridal", "Barbering"],
  health_wellness_fitness: ["Personal Training", "Group Classes", "Memberships", "Yoga", "Weight Loss", "Nutrition", "CrossFit", "Physical Therapy"],
  construction: ["New Construction", "Remodeling", "Roofing", "Painting", "Flooring", "Kitchen & Bath", "Licensed & Bonded", "Free Estimates"],
  automotive: ["Oil Change", "Brake Repair", "Tire Service", "Auto Body", "Diagnostics", "Transmission", "AC Repair", "Used Cars"],
  real_estate_residential: ["Home Buying", "Home Selling", "Rentals", "Property Management", "First-Time Buyers", "Luxury Homes", "Commercial", "Appraisals"],
  information_technology_services: ["IT Support", "Cloud Services", "Cybersecurity", "Web Development", "Data Recovery", "Network Setup", "Software Solutions", "Managed IT"],
  retail: ["Online Store", "In-Store Shopping", "Delivery", "Returns", "Loyalty Program", "Seasonal Sales", "Gift Cards", "Custom Orders"],
  consulting_management: ["SEO & Marketing", "Social Media", "Business Strategy", "Brand Management", "Content Marketing", "PPC Advertising", "Email Marketing", "Analytics"],
  education_management: ["Tutoring", "Test Prep", "Online Courses", "After-School Programs", "College Prep", "STEM", "Language Classes", "Music Lessons"],
  cleaning_services: ["House Cleaning", "Office Cleaning", "Deep Cleaning", "Move-In/Move-Out", "Carpet Cleaning", "Window Cleaning", "Pressure Washing", "Recurring Service"],
  financial_services: ["Tax Preparation", "Bookkeeping", "Financial Planning", "Payroll", "Auditing", "Tax Strategy", "Small Business Accounting", "QuickBooks Setup"],
  travel_hospitality: ["Hotels", "Flights", "Vacation Packages", "Tours", "Travel Insurance", "Group Travel", "Luxury Travel", "Business Travel"],
  pet_services: ["Dog Walking", "Pet Grooming", "Boarding", "Vet Visits", "Pet Sitting", "Training", "Pet Food", "Daycare"],
  photography_media: ["Weddings", "Portraits", "Events", "Product Photography", "Headshots", "Video Production", "Drone Footage", "Editing"],
  event_planning: ["Weddings", "Corporate Events", "Birthday Parties", "Conferences", "Fundraisers", "Holiday Parties", "Festivals", "Private Events"],
  landscaping: ["Lawn Care", "Tree Trimming", "Garden Design", "Irrigation", "Hardscaping", "Fencing", "Snow Removal", "Seasonal Cleanup"],
  logistics_shipping: ["Local Moving", "Long Distance", "Packing Services", "Storage", "Office Moving", "Furniture Assembly", "Junk Removal", "Pod Loading"],
  nonprofit: ["Donations", "Volunteer Programs", "Community Events", "Fundraising", "Grants", "Outreach", "Advocacy", "Partnerships"],
  manufacturing: ["Custom Orders", "Prototyping", "Mass Production", "Quality Control", "Supply Chain", "OEM", "Assembly", "Packaging"],
  agriculture: ["Organic Produce", "CSA Boxes", "Farm-to-Table", "Livestock", "Farmers Market", "Wholesale", "Sustainable Farming", "U-Pick"],
  staffing_recruiting: ["Temp Staffing", "Direct Hire", "Executive Search", "Contract Workers", "Payroll Services", "Background Checks", "Onboarding", "HR Consulting"],
  security_services: ["Guard Services", "Alarm Systems", "CCTV Installation", "Event Security", "Patrol Services", "Access Control", "Fire Safety", "Consulting"],
  telecom: ["Internet Plans", "Business Phone", "Fiber Installation", "VoIP", "Network Setup", "Managed WiFi", "Support", "Cloud PBX"],
  energy_utilities: ["Solar Installation", "Energy Audits", "EV Charging", "Battery Storage", "LED Retrofit", "Smart Home", "Wind Energy", "Insulation"],
  childcare: ["Full-Time Care", "Part-Time Care", "After School", "Summer Camp", "Early Learning", "Infant Care", "Drop-In Care", "Tutoring"],
  funeral_services: ["Funeral Planning", "Cremation", "Memorial Services", "Pre-Planning", "Grief Support", "Flower Arrangements", "Obituary Writing", "Transportation"],
  saas: ["Pricing Plans", "Free Trial", "Enterprise", "Integrations", "API Docs", "Security & Compliance", "Case Studies", "Product Updates"],
  fintech_payments: ["Payment Processing", "Pricing", "Developer API", "Fraud Prevention", "Compliance", "International Payments", "Invoicing", "Enterprise Solutions"],
  ecommerce_dtc: ["Product Pages", "Shipping & Returns", "Customer Reviews", "Bestsellers", "New Arrivals", "Sizing Guide", "Gift Cards", "Subscriptions"],
  ai_ml: ["Product Demo", "Use Cases", "Model Performance", "API Access", "Pricing", "Documentation", "Research Blog", "Enterprise AI"],
  cybersecurity: ["Threat Assessment", "Compliance Audit", "Penetration Testing", "SOC Services", "Incident Response", "Employee Training", "Zero Trust", "SIEM Solutions"],
  devtools_infrastructure: ["Getting Started", "Documentation", "Pricing", "CLI Tools", "Integrations", "Status Page", "Community", "Enterprise"],
  healthtech: ["HIPAA Compliance", "Patient Portal", "Telehealth", "EHR Integration", "Clinical Trials", "Remote Monitoring", "Provider Network", "Demo"],
  edtech: ["Course Catalog", "Pricing", "For Teams", "Certifications", "Student Reviews", "Free Trial", "Enterprise Learning", "Mobile App"],
  proptech: ["Property Listings", "Tenant Portal", "Owner Dashboard", "Pricing", "Integrations", "Market Reports", "Demo", "API"],
  marketplace: ["How It Works", "For Sellers", "For Buyers", "Trust & Safety", "Fees & Pricing", "Categories", "Top Rated", "Support"],
  creator_economy: ["Monetization", "Creator Tools", "Analytics", "Audience Growth", "Brand Partnerships", "Subscriptions", "Community", "Live Streaming"],
  hr_tech: ["Payroll", "Onboarding", "Performance Reviews", "Benefits Admin", "Time Tracking", "Compliance", "Integrations", "Pricing"],
  legaltech: ["Contract Templates", "E-Signatures", "Document Automation", "Case Management", "Compliance Tools", "Pricing", "Integrations", "Enterprise"],
  insurtech: ["Get a Quote", "Claims Filing", "Policy Management", "Coverage Options", "Risk Assessment", "Partner API", "Enterprise", "Compliance"],
  cleantech: ["Carbon Footprint Calculator", "Sustainability Reports", "ESG Compliance", "Solutions", "Case Studies", "Pricing", "Partnerships", "Impact Dashboard"],
  gaming: ["Game Library", "Downloads", "System Requirements", "Community", "Updates & Patches", "Tournaments", "Developer SDK", "Creator Tools"],
  food_delivery_tech: ["Order Online", "Restaurant Partners", "Delivery Zones", "Menu Builder", "POS Integration", "Analytics Dashboard", "Pricing", "API"],
  other: ["Products", "Services", "Pricing", "Customer Support", "Locations", "Appointments", "Reviews", "Delivery"],
}

type Step = "company-info" | "brand-setup" | "business-context" | "prompts" | "processing" | "report"

interface ValidationError {
  field: string
  message: string
}

// Form data validation
const MAX_KEYWORDS = 15
const MAX_COMPETITORS = 10
const MAX_MARKETS = 5

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma",
  "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee",
  "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
  "District of Columbia"
]

// Priority countries: US first, then major economies
const PRIORITY_COUNTRIES = [
  'us', 'gb', 'ca', 'au', 'de', 'fr', 'nl', 'ch', 'se', 'no', 'dk', 'fi',
  'ie', 'at', 'be', 'nz', 'sg', 'jp', 'kr', 'ae', 'sa', 'il', 'it', 'es',
]

const validateFormData = (formData: any, step: Step): ValidationError[] => {
  const errors: ValidationError[] = []
  if (step === "company-info") {
    if (!formData.brandEmail?.trim()) {
      errors.push({ field: "brandEmail", message: "Email is required so we can send your report" })
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.brandEmail.trim())) {
      errors.push({ field: "brandEmail", message: "Please enter a valid email address" })
    }
  } else if (step === "brand-setup") {
    if (!formData.brandName?.trim()) {
      errors.push({ field: "brandName", message: "Please enter your business name" })
    } else if (formData.brandName.trim().length > 200) {
      errors.push({ field: "brandName", message: "Business name is too long" })
    }
    if (!formData.brandCategories || formData.brandCategories.length === 0) {
      errors.push({ field: "brandCategories", message: "Please select your business type" })
    }
  } else if (step === "business-context") {
    if (!formData.brandKeywords || formData.brandKeywords.length === 0) {
      errors.push({ field: "productsServices", message: "Select at least one product or service so we know what to test" })
    }
    if (!formData.targetMarkets || formData.targetMarkets.length === 0) {
      errors.push({ field: "targetMarkets", message: "Select at least one market where your customers are" })
    }
  }
  return errors
}

export default function FreeAuditPage() {
  const router = useRouter()
  const { addToast, ToastContainer } = useToast()
  const { countryOptions, getCountryNames } = useCountries()

  const [step, setStep] = useState<Step>("company-info")
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false)
  const [promptGenStatus, setPromptGenStatus] = useState("")
  const [isRunningAudit, setIsRunningAudit] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [showValidation, setShowValidation] = useState(false)
  const [customPrompt, setCustomPrompt] = useState("")
  const [isPolishingPrompt, setIsPolishingPrompt] = useState(false)
  const [aiGeneratedPrompts, setAiGeneratedPrompts] = useState<any[]>([])
  const [auditResults, setAuditResults] = useState<any>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [pollCount, setPollCount] = useState(0)
  const [formStartTime] = useState(Date.now())
  const [selectedBusinessType, setSelectedBusinessType] = useState("")
  const [customBusinessType, setCustomBusinessType] = useState("")
  const [marketSearch, setMarketSearch] = useState("")
  const [keywordInput, setKeywordInput] = useState("")
  const [competitorInput, setCompetitorInput] = useState("")
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)

  // Close tooltip when clicking outside
  useEffect(() => {
    if (!activeTooltip) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-tooltip-trigger]') || target.closest('[data-tooltip-content]')) return
      setActiveTooltip(null)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [activeTooltip])

  const [customKeywords, setCustomKeywords] = useState<string[]>([])
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [showStateDropdown, setShowStateDropdown] = useState(false)
  const [stateSearch, setStateSearch] = useState("")
  const [countryDropDir, setCountryDropDir] = useState<'down' | 'up'>('down')
  const [stateDropDir, setStateDropDir] = useState<'down' | 'up'>('down')
  const [showAllBusinessTypes, setShowAllBusinessTypes] = useState(false)
  const countryTriggerRef = useRef<HTMLButtonElement>(null)
  const stateTriggerRef = useRef<HTMLButtonElement>(null)
  const auditSubmittingRef = useRef(false)
  const [isRestoringReport, setIsRestoringReport] = useState(true)
  const [isPageReady, setIsPageReady] = useState(false)
  const [cachedBrandName, setCachedBrandName] = useState<string | null>(null)
  const [cachedBrandId, setCachedBrandId] = useState<string | null>(null)
  const reportRestoredRef = useRef(false)

  // Calculate dropdown direction based on available space
  const calcDropDirection = useCallback((triggerEl: HTMLElement | null): 'down' | 'up' => {
    if (!triggerEl) return 'down'
    const rect = triggerEl.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const dropdownHeight = 280 // search bar + ~6 items
    // If not enough space below but enough above, go up
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) return 'up'
    return 'down'
  }, [])

  // Computed topic suggestions based on selected business type
  const topicSuggestions = TOPIC_SUGGESTIONS[selectedBusinessType] || []

  // Sort countries: US first, then major economies, then rest alphabetically
  const sortedCountryOptions = useMemo(() => {
    const priorityMap = new Map(PRIORITY_COUNTRIES.map((code, i) => [code, i]))
    return [...countryOptions].sort((a, b) => {
      const aIdx = priorityMap.get(a.value) ?? 999
      const bIdx = priorityMap.get(b.value) ?? 999
      if (aIdx !== bIdx) return aIdx - bIdx
      return a.label.localeCompare(b.label)
    })
  }, [countryOptions])

  // Browser fingerprint
  const [fingerprint, setFingerprint] = useState("")
  useEffect(() => {
    const fp = [
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
    ].join("|")
    let hash = 0
    for (let i = 0; i < fp.length; i++) {
      hash = ((hash << 5) - hash + fp.charCodeAt(i)) | 0
    }
    setFingerprint(Math.abs(hash).toString(16).padStart(8, "0"))
  }, [])

  // ─── Lead Tracking (shadow account) ────────────────────────────
  const leadTokenRef = useRef("")

  useEffect(() => {
    if (!fingerprint) return

    const initLead = async () => {
      // Restore from localStorage if available
      try {
        const stored = localStorage.getItem("soma_lead_token")
        if (stored) { leadTokenRef.current = stored; return }
      } catch {}

      // Create or restore lead via fingerprint dedup
      try {
        const params = new URLSearchParams(window.location.search)
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fingerprint,
            device_info: {
              platform: navigator.platform,
              language: navigator.language,
              languages: navigator.languages?.slice(0, 5),
              screen_width: screen.width,
              screen_height: screen.height,
              viewport_width: window.innerWidth,
              viewport_height: window.innerHeight,
              device_pixel_ratio: window.devicePixelRatio,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              timezone_offset: new Date().getTimezoneOffset(),
              cores: navigator.hardwareConcurrency || null,
              memory: (navigator as any).deviceMemory || null,
              connection_type: (navigator as any).connection?.effectiveType || null,
              color_depth: screen.colorDepth,
              touch_support: navigator.maxTouchPoints > 0,
            },
            source: "free_audit",
            landing_page: window.location.pathname + window.location.search,
            referrer: document.referrer || undefined,
            utm_source: params.get("utm_source") || undefined,
            utm_medium: params.get("utm_medium") || undefined,
            utm_campaign: params.get("utm_campaign") || undefined,
            utm_term: params.get("utm_term") || undefined,
            utm_content: params.get("utm_content") || undefined,
          }),
        })
        if (res.ok) {
          const { leadToken } = await res.json()
          leadTokenRef.current = leadToken
          try { localStorage.setItem("soma_lead_token", leadToken) } catch {}
        }
      } catch {} // Non-blocking — free-audit works without lead tracking
    }

    initLead()
  }, [fingerprint])

  const updateLead = useCallback((data: Record<string, unknown>) => {
    if (!leadTokenRef.current) return
    fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-Lead-Token": leadTokenRef.current },
      body: JSON.stringify(data),
    }).catch(() => {})
  }, [])

  // ─── Restore cached report on mount ─────────────────────────────
  // Check URL param ?report=<token>, then localStorage, then sessionStorage
  useEffect(() => {
    if (reportRestoredRef.current) return
    reportRestoredRef.current = true

    const restoreReport = async (token: string) => {
      if (!/^[a-f0-9]{64}$/.test(token)) return false
      setIsRestoringReport(true)
      try {
        const res = await fetch(`/api/onboarding/free-audit/${token}`)
        if (!res.ok) return false
        const data = await res.json()
        const report = data.report
        if (report.status === 'completed' && report.results) {
          setAuditResults(report.results)
          setAccessToken(token)
          setCachedBrandName(report.brandName)
          setCachedBrandId(report.brandId || null)
          setStep('report')
          // Persist in localStorage for future visits
          try { localStorage.setItem('soma_audit_token', token) } catch {}
          // Update URL without full navigation
          const url = new URL(window.location.href)
          url.searchParams.set('report', token)
          window.history.replaceState({}, '', url.toString())
          return true
        } else if (report.status === 'running' || report.status === 'pending') {
          // Report still processing — resume polling
          setAccessToken(token)
          setCachedBrandName(report.brandName)
          setCachedBrandId(report.brandId || null)
          setStep('processing')
          setPollCount(0)
          return true
        }
      } catch {
        // Silently fail — user continues fresh
      } finally {
        setIsRestoringReport(false)
        requestAnimationFrame(() => setIsPageReady(true))
      }
      return false
    }

    const tryRestore = async () => {
      // 1. Check URL param
      const urlParams = new URLSearchParams(window.location.search)
      const urlToken = urlParams.get('report')
      if (urlToken && await restoreReport(urlToken)) return

      // 2. Check localStorage
      try {
        const storedToken = localStorage.getItem('soma_audit_token')
        if (storedToken && await restoreReport(storedToken)) return
      } catch {}

      // 3. Check sessionStorage (fallback for in-progress)
      try {
        const sessionToken = sessionStorage.getItem('free_audit_token')
        if (sessionToken && await restoreReport(sessionToken)) return
      } catch {}

      // 4. Try fingerprint-based lookup (last resort — covers cleared localStorage)
      try {
        const fp = [
          navigator.language,
          screen.width,
          screen.height,
          new Date().getTimezoneOffset(),
          navigator.hardwareConcurrency || 0,
        ].join("|")
        let hash = 0
        for (let i = 0; i < fp.length; i++) {
          hash = ((hash << 5) - hash + fp.charCodeAt(i)) | 0
        }
        const fpHash = Math.abs(hash).toString(16).padStart(8, "0")
        const lookupRes = await fetch(`/api/onboarding/free-audit/lookup?fingerprint=${fpHash}`)
        if (lookupRes.ok) {
          const lookupData = await lookupRes.json()
          if (lookupData.found && lookupData.accessToken) {
            await restoreReport(lookupData.accessToken)
          }
        }
      } catch {}

      // Nothing found — show form
      setIsRestoringReport(false)
      // Small delay for smooth transition
      requestAnimationFrame(() => setIsPageReady(true))
    }

    tryRestore()
  }, [])

  const [formData, setFormData] = useState({
    // Organization fields (not used in free audit, but required by components)
    organizationName: "",
    organizationWebsite: "",
    // Brand Company fields
    brandCompanyName: "",
    brandCompanyWebsite: "",
    brandCompanyLocation: "",
    // Brand Details
    brandName: "",
    companyName: "",
    brandDescription: "",
    brandCategory: "",
    brandCategories: [] as string[],
    brandWebsite: "",
    brandEmail: "",
    // Entity Type
    entityType: "company" as "company" | "product" | "service" | "personality" | "organization" | "government" | "campaign" | "location",
    // Markets
    targetMarkets: ["us"] as string[],
    location: "",
    // Business Context
    businessCategory: "",
    businessType: "brand" as "brand" | "business" | "product" | "organization",
    brandKeywords: [] as string[],
    productsServices: "",
    businessModel: "" as "b2b" | "b2c" | "b2b2c" | "marketplace" | "other" | "",
    targetAudience: "",
    primaryValue: "",
    businessStage: "" as "startup" | "growth" | "established" | "enterprise" | "",
    knownCompetitors: [] as string[],
  })

  // Smart-sort business types based on description keywords
  const sortedBusinessTypes = useMemo(() => getSortedBusinessTypes(formData.brandDescription), [formData.brandDescription])

  // Show 3 rows (15 items on 5-col grid) initially, or all
  const VISIBLE_ROWS = 15
  const visibleBusinessTypes = showAllBusinessTypes ? sortedBusinessTypes : sortedBusinessTypes.slice(0, VISIBLE_ROWS)

  // ─── Prompt Generation ────────────────────────────────────────────
  // Calls server-side LLM to generate high-intent monitoring queries
  // Rotating status messages that reflect actual backend pipeline stages
  const PROMPT_GEN_STEPS = [
    "Analyzing your brand and category…",
    "Scanning real search trends for your industry…",
    "Identifying what your audience is asking AI…",
    "Analyzing \u201cPeople Also Ask\u201d patterns…",
    "Prioritizing high-intent prompts…",
    "Building your personalized monitoring prompts…",
  ]

  const generateAIPrompts = async () => {
    setIsGeneratingPrompts(true)
    setPromptGenStatus(PROMPT_GEN_STEPS[0])
    // Cycle through status messages every 4s to reflect backend progress
    let stepIdx = 0
    const statusInterval = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, PROMPT_GEN_STEPS.length - 1)
      setPromptGenStatus(PROMPT_GEN_STEPS[stepIdx])
    }, 4000)
    try {
      console.log("[free-audit] Calling /api/content/prompts/generate …")
      const res = await fetch("/api/content/prompts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "free_audit",
          brandName: formData.brandName.trim(),
          brandWebsite: normalizeUrl(formData.brandWebsite),
          brandDescription: formData.brandDescription || undefined,
          brandCategory: formData.brandCategories[0] || undefined,
          brandKeywords: formData.brandKeywords,
          competitors: formData.knownCompetitors,
          targetMarkets: formData.targetMarkets,
          selectedStates,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        console.log(`[free-audit] API returned ${data.prompts?.length ?? 0} prompts (source: ${data.source})`)
        if (data.prompts?.length > 0) {
          setAiGeneratedPrompts(data.prompts)
          return
        }
      } else {
        const errorText = await res.text().catch(() => "")
        console.warn(`[free-audit] API responded ${res.status}: ${errorText}`)
      }

      // Fallback to local generation if API fails
      console.warn("[free-audit] Using local fallback prompt generation")
      setAiGeneratedPrompts(generateBrandPrompts())
    } catch (err) {
      // Fallback to local generation on network error
      console.error("[free-audit] Prompt generation network error:", err)
      setAiGeneratedPrompts(generateBrandPrompts())
    } finally {
      clearInterval(statusInterval)
      setIsGeneratingPrompts(false)
      setPromptGenStatus("")
    }
  }

  const generateBrandPrompts = (): any[] => {
    const { brandName, targetMarkets, brandCategories, brandKeywords, knownCompetitors, brandDescription, targetAudience } = formData
    const marketNames = getCountryNames(targetMarkets)
    const stateContext = selectedStates.length > 0 ? selectedStates[0] : ""
    const primaryMarket = stateContext || marketNames[0] || "my region"
    const category = (brandCategories[0] || "").replace(/_/g, " ").replace(/&/g, "and")
    // Prefer a specific keyword over raw category for more natural prompts
    const serviceTerm = brandKeywords.length > 0 ? brandKeywords[0].toLowerCase() : category || "services"
    const naturalCategory = serviceTerm !== category ? serviceTerm : category
    const year = new Date().getFullYear()

    const prompts: string[] = []
    prompts.push(`Has anyone used ${brandName}? Is it actually worth it in ${primaryMarket}?`)
    if (knownCompetitors.length > 0) {
      prompts.push(`How does ${brandName} compare to ${knownCompetitors[0]}? Looking for honest opinions`)
    } else {
      prompts.push(`What do people think about ${brandName}? Any real experiences?`)
    }
    prompts.push(`What are the best ${naturalCategory} options in ${primaryMarket} for ${year}?`)
    if (brandKeywords.length >= 2) {
      prompts.push(`I need help with ${brandKeywords[0].toLowerCase()} and ${brandKeywords[1].toLowerCase()} — what do people recommend in ${primaryMarket}?`)
    } else {
      prompts.push(`Who are the top ${serviceTerm} ${targetAudience ? `for ${targetAudience.toLowerCase()}` : `options in ${primaryMarket}`}?`)
    }
    prompts.push(`How do I find the right ${serviceTerm} in ${primaryMarket}? What should I look for?`)

    return prompts.map((text, i) => ({
      id: `fb_${i}`,
      text,
      category: "general",
      priority: i + 1,
      rationale: "Generated from brand context",
    }))
  }

  const MAX_PROMPTS = 10

  const addCustomPrompt = () => {
    if (customPrompt.trim() && aiGeneratedPrompts.length < MAX_PROMPTS) {
      setAiGeneratedPrompts((prev) => [
        ...prev,
        {
          id: `custom_${Date.now()}`,
          text: customPrompt.trim(),
          category: "custom",
          priority: prev.length + 1,
          rationale: "User-defined custom prompt",
        },
      ])
      setCustomPrompt("")
    }
  }

  const removePrompt = (promptId: string) => {
    setAiGeneratedPrompts((prev) => prev.filter((p) => p.id !== promptId))
  }

  // ─── Step Handlers ────────────────────────────────────────────────
  const handleNext = async () => {
    if (step === "company-info") {
      const errors = validateFormData(formData, step)
      setValidationErrors(errors)
      setShowValidation(true)
      if (errors.length > 0) return

      setStep("brand-setup")
      setShowValidation(false)
      // Capture email early (non-blocking)
      updateLead({
        email: formData.brandEmail,
        company_name: formData.companyName || undefined,
        last_step: "brand-setup",
        status: "engaged",
      })
    } else if (step === "brand-setup") {
      const errors = validateFormData(formData, step)
      setValidationErrors(errors)
      setShowValidation(true)
      if (errors.length > 0) return

      setStep("business-context")
      setShowValidation(false)
      // Capture brand data early (non-blocking)
      updateLead({
        brand_name: formData.brandName,
        brand_website: formData.brandWebsite,
        last_step: "business-context",
        status: "engaged",
        form_data: {
          brandName: formData.brandName,
          brandWebsite: formData.brandWebsite,
          brandCategories: formData.brandCategories,
          brandDescription: formData.brandDescription,
        },
      })
    } else if (step === "business-context") {
      const errors = validateFormData(formData, step)
      setValidationErrors(errors)
      setShowValidation(true)
      if (errors.length > 0) return

      setIsLoading(true)
      setIsGeneratingPrompts(true)
      try {
        await generateAIPrompts()
        setStep("prompts")
        updateLead({
          last_step: "prompts",
          form_data: {
            brandKeywords: formData.brandKeywords,
            targetMarkets: formData.targetMarkets,
            knownCompetitors: formData.knownCompetitors,
            selectedStates,
          },
        })
      } catch {
        setStep("prompts")
      } finally {
        setIsLoading(false)
        setIsGeneratingPrompts(false)
      }
    }
  }

  const handleBack = () => {
    setShowValidation(false)
    setValidationErrors([])
    if (step === "brand-setup") setStep("company-info")
    else if (step === "business-context") setStep("brand-setup")
    else if (step === "prompts") setStep("business-context")
  }

  // ─── Run Audit ────────────────────────────────────────────────────
  const runAudit = async () => {
    if (auditSubmittingRef.current || isRunningAudit || aiGeneratedPrompts.length === 0) return
    auditSubmittingRef.current = true
    setIsRunningAudit(true)
    setStep("processing")

    try {
      const res = await fetch("/api/onboarding/free-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: formData.brandName.trim(),
          companyName: formData.companyName.trim() || undefined,
          brandWebsite: normalizeUrl(formData.brandWebsite),
          industry: formData.brandCategories[0] || formData.businessCategory || undefined,
          brandDescription: formData.brandDescription || undefined,
          targetMarkets: formData.targetMarkets,
          competitors: formData.knownCompetitors,
          keywords: formData.brandKeywords,
          prompts: aiGeneratedPrompts,
          email: formData.brandEmail.trim() || undefined,
          fingerprint,
          leadToken: leadTokenRef.current || undefined,
          _ts: formStartTime,
          _hp: "",
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        console.error('Free audit error:', res.status, data)
        if (data.upgrade) {
          addToast({ type: "error", title: "Limit reached", message: "Daily limit reached. Sign up for unlimited audits.", duration: 5000 })
        } else {
          addToast({ type: "error", title: "Error", message: data.error || "Something went wrong", duration: 5000 })
        }
        setStep("prompts")
        setIsRunningAudit(false)
        auditSubmittingRef.current = false
        return
      }

      if (data.accessToken) {
        setAccessToken(data.accessToken)
        sessionStorage.setItem("free_audit_token", data.accessToken)
        sessionStorage.setItem("free_audit_id", data.auditId)
        // Persist for future visits (survives browser close)
        try { localStorage.setItem("soma_audit_token", data.accessToken) } catch {}
        // Start polling for results
        setPollCount(0)
      }
    } catch {
      addToast({ type: "error", title: "Network Error", message: "Please check your connection and try again.", duration: 5000 })
      setStep("prompts")
      setIsRunningAudit(false)
      auditSubmittingRef.current = false
    }
  }

  // ─── Poll for Results ─────────────────────────────────────────────
  const fetchReport = useCallback(async () => {
    if (!accessToken) return
    try {
      const res = await fetch(`/api/onboarding/free-audit/${accessToken}`)
      if (!res.ok) return
      const data = await res.json()
      const report = data.report

      if (report.status === "completed" && report.results) {
        setAuditResults(report.results)
        setCachedBrandId(report.brandId || null)
        setStep("report")
        setIsRunningAudit(false)
        // Update URL for shareability/bookmarking
        if (accessToken) {
          const url = new URL(window.location.href)
          url.searchParams.set('report', accessToken)
          window.history.replaceState({}, '', url.toString())
        }
      } else if (report.status === "failed") {
        addToast({ type: "error", title: "Audit Failed", message: "Our AI models encountered an issue. Please try again.", duration: 5000 })
        setStep("prompts")
        setIsRunningAudit(false)
        setAccessToken(null)
      }
    } catch {}
  }, [accessToken, addToast])

  useEffect(() => {
    if (step !== "processing" || !accessToken) return
    if (pollCount > 60) return

    const timer = setTimeout(() => {
      fetchReport()
      setPollCount((c) => c + 1)
    }, 5000)
    return () => clearTimeout(timer)
  }, [step, accessToken, pollCount, fetchReport])

  // ─── Navigation Header ────────────────────────────────────────────
  const NavigationHeader = () => {
    const steps: { key: Step; label: string; num: number }[] = [
      { key: "company-info", label: "Get Started", num: 1 },
      { key: "brand-setup", label: "Your Business", num: 2 },
      { key: "business-context", label: "Your Market", num: 3 },
      { key: "prompts", label: "Prompts", num: 4 },
    ]

    const currentIdx = steps.findIndex(s => s.key === step)

    return (
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-black rounded text-white flex items-center justify-center text-lg font-bold">
                S
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-foreground">Soma AI</span>
                <span className="text-xs text-muted-foreground/80 font-medium tracking-wider">AEO PLATFORM</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-2">
              {steps.map((s, i) => {
                const isActive = step === s.key
                const isDone = currentIdx > i
                return (
                  <div key={s.key} className="flex items-center">
                    {i > 0 && <div className={`w-8 h-px mx-1 ${isDone ? 'bg-primary' : 'bg-border'}`} />}
                    <div className="flex items-center space-x-1.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        isDone ? 'bg-primary text-primary-foreground' : isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {isDone ? '✓' : s.num}
                      </div>
                      <span className={`text-sm transition-colors ${
                        isActive ? 'text-foreground font-medium' : isDone ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {s.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center space-x-3">
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────

  // Initial loading screen — shown while checking for existing reports
  if (isRestoringReport && !isPageReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <ToastContainer />
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
            <div className="absolute inset-0 rounded-full border-2 border-t-gray-900 animate-spin" />
          </div>
          <p className="text-base font-medium text-gray-700">Checking for your report...</p>
          <p className="text-sm text-gray-400 mt-1">This only takes a moment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <ToastContainer />
      {step !== "report" && <NavigationHeader />}

      <div className={step === "report" ? "" : "container mx-auto px-4 py-8"}>
        <div className={cn(
          step === "report" ? "" : `mx-auto ${step === "prompts" ? "max-w-6xl" : "max-w-4xl"}`,
          isPageReady ? "animate-in fade-in duration-500" : ""
        )}>

          {/* Step 1: Get Started — Company Name + Email */}
          {step === "company-info" && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-background border-2 border-border rounded-2xl p-6 sm:p-8 md:p-10">
                <div className="mb-8">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground">
                    Check your AI visibility &mdash; free
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    See if ChatGPT, Gemini, and other AI assistants recommend your business when customers search. Takes about 2 minutes.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Company Name */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label htmlFor="companyName" className="text-base font-bold text-foreground">
                        Company name
                      </label>
                      <div className="relative">
                        <button type="button" data-tooltip-trigger onClick={() => setActiveTooltip(activeTooltip === 'companyName' ? null : 'companyName')} className="text-muted-foreground hover:text-foreground transition-colors"><Info className="h-4 w-4" /></button>
                        {activeTooltip === 'companyName' && (
                          <div data-tooltip-content className="absolute left-1/2 -translate-x-1/2 top-7 z-50 w-72 p-3 bg-foreground text-background text-xs rounded-lg leading-relaxed">
                            <p>The parent company or organization behind this brand. Leave blank if it&apos;s the same as the brand name.</p>
                            <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-3 h-3 bg-foreground rotate-45" />
                          </div>
                        )}
                      </div>
                    </div>
                    <input
                      id="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyName: sanitize(e.target.value) }))}
                      placeholder="e.g., Acme Corp"
                      maxLength={200}
                      autoComplete="organization"
                      className="w-full px-4 py-3 border-2 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-background placeholder:text-gray-400 border-border"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label htmlFor="brandEmail" className="text-base font-bold text-foreground">
                        Email *
                      </label>
                      <div className="relative">
                        <button type="button" data-tooltip-trigger onClick={() => setActiveTooltip(activeTooltip === 'email' ? null : 'email')} className="text-muted-foreground hover:text-foreground transition-colors"><Info className="h-4 w-4" /></button>
                        {activeTooltip === 'email' && (
                          <div data-tooltip-content className="absolute left-1/2 -translate-x-1/2 top-7 z-50 w-72 p-3 bg-foreground text-background text-xs rounded-lg leading-relaxed">
                            <p>We&apos;ll email you when your report is ready. You can also use this to access your report from any device.</p>
                            <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-3 h-3 bg-foreground rotate-45" />
                          </div>
                        )}
                      </div>
                    </div>
                    <input
                      id="brandEmail"
                      type="email"
                      value={formData.brandEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, brandEmail: e.target.value }))}
                      placeholder="you@yourbusiness.com"
                      maxLength={320}
                      autoComplete="email"
                      className={`w-full px-4 py-3 border-2 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-background placeholder:text-gray-400 ${
                        showValidation && validationErrors.find(e => e.field === 'brandEmail') ? 'border-red-400' : 'border-border'
                      }`}
                    />
                    {showValidation && validationErrors.find(e => e.field === 'brandEmail') && (
                      <p className="text-sm text-red-500">{validationErrors.find(e => e.field === 'brandEmail')?.message}</p>
                    )}
                  </div>

                  <Button
                    onClick={handleNext}
                    className="w-full h-12 text-base font-semibold mt-4 rounded-xl"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  {/* Honeypot - invisible to users, bots will fill it */}
                  <div className="absolute -left-[9999px]" aria-hidden="true" tabIndex={-1}>
                    <input
                      type="text"
                      name="website_url"
                      tabIndex={-1}
                      autoComplete="off"
                      onChange={(e) => {
                        if (e.target.value) {
                          // Bot detected — silently disable form
                          setFormData(prev => ({ ...prev, brandName: '' }))
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Your Business — Brand name, description, type, website */}
          {step === "brand-setup" && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-background border-2 border-border rounded-2xl p-6 sm:p-8 md:p-10">
                <button
                  onClick={handleBack}
                  className="flex items-center text-muted-foreground hover:text-foreground mb-6 font-medium transition-colors text-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </button>

                <div className="mb-8">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground">
                    Tell us about your brand
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    We&apos;ll use this to check how AI assistants talk about your brand.
                  </p>
                </div>

                <div className="space-y-8">
                  {/* Brand Name */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label htmlFor="brandName" className="text-base font-bold text-foreground">
                        Brand name *
                      </label>
                      <div className="relative">
                        <button type="button" data-tooltip-trigger onClick={() => setActiveTooltip(activeTooltip === 'businessName' ? null : 'businessName')} className="text-muted-foreground hover:text-foreground transition-colors"><Info className="h-4 w-4" /></button>
                        {activeTooltip === 'businessName' && (
                          <div data-tooltip-content className="absolute left-1/2 -translate-x-1/2 top-7 z-50 w-72 p-3 bg-foreground text-background text-xs rounded-lg leading-relaxed">
                            <p>The brand name we&apos;ll measure across ChatGPT, Gemini, Claude, and other AI assistants.</p>
                            <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-3 h-3 bg-foreground rotate-45" />
                          </div>
                        )}
                      </div>
                    </div>
                    <input
                      id="brandName"
                      type="text"
                      value={formData.brandName}
                      onChange={(e) => setFormData(prev => ({ ...prev, brandName: sanitize(e.target.value) }))}
                      placeholder="e.g., Mike's Plumbing, Sunrise Dental"
                      maxLength={200}
                      autoComplete="organization"
                      className={`w-full px-4 py-3 border-2 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-background placeholder:text-gray-400 ${
                        showValidation && validationErrors.find(e => e.field === 'brandName') ? 'border-red-400' : 'border-border'
                      }`}
                    />
                    {showValidation && validationErrors.find(e => e.field === 'brandName') && (
                      <p className="text-sm text-red-500">{validationErrors.find(e => e.field === 'brandName')?.message}</p>
                    )}
                  </div>

                  {/* Description — comes BEFORE business type so smart sorting works */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label htmlFor="brandDescription" className="text-base font-bold text-foreground">
                        Describe your brand <span className="text-muted-foreground font-normal">(optional)</span>
                      </label>
                      <div className="relative">
                        <button type="button" data-tooltip-trigger onClick={() => setActiveTooltip(activeTooltip === 'description' ? null : 'description')} className="text-muted-foreground hover:text-foreground transition-colors"><Info className="h-4 w-4" /></button>
                        {activeTooltip === 'description' && (
                          <div data-tooltip-content className="absolute left-1/2 -translate-x-1/2 top-7 z-50 w-72 p-3 bg-foreground text-background text-xs rounded-lg leading-relaxed">
                            <p>A short description helps us understand what your brand does and pre-select the right category below.</p>
                            <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-3 h-3 bg-foreground rotate-45" />
                          </div>
                        )}
                      </div>
                    </div>
                    <textarea
                      id="brandDescription"
                      value={formData.brandDescription}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, brandDescription: e.target.value }))
                        // Reset show-all when description changes so the smart sort is visible
                        setShowAllBusinessTypes(false)
                      }}
                      placeholder="e.g., Family-owned plumbing brand serving the greater Austin area. We specialize in residential repairs and bathroom remodeling."
                      rows={3}
                      maxLength={2000}
                      className="w-full px-4 py-3 border-2 border-border rounded-xl text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-background placeholder:text-gray-400"
                    />
                    {formData.brandDescription.trim() && scoreBusinessTypes(formData.brandDescription).size > 0 && (
                      <p className="text-xs text-primary">We&apos;ve reordered the business types below based on your description.</p>
                    )}
                  </div>

                  {/* Business Type Grid — smart-sorted, 3 rows default */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <label className="text-base font-bold text-foreground">
                        Brand category *
                      </label>
                      <div className="relative">
                        <button type="button" data-tooltip-trigger onClick={() => setActiveTooltip(activeTooltip === 'businessType' ? null : 'businessType')} className="text-muted-foreground hover:text-foreground transition-colors"><Info className="h-4 w-4" /></button>
                        {activeTooltip === 'businessType' && (
                          <div data-tooltip-content className="absolute left-1/2 -translate-x-1/2 top-7 z-50 w-72 p-3 bg-foreground text-background text-xs rounded-lg leading-relaxed">
                            <p>Your category determines which AI prompts we test. A restaurant gets tested on &ldquo;best places to eat near me&rdquo; while a dentist gets &ldquo;best dentist accepting new patients.&rdquo;</p>
                            <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-3 h-3 bg-foreground rotate-45" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                      {visibleBusinessTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => {
                            setSelectedBusinessType(type.value)
                            if (type.value !== 'other') {
                              setFormData(prev => ({ ...prev, brandCategories: [type.value], brandKeywords: [] }))
                              setCustomBusinessType('')
                              setCustomKeywords([])
                            } else {
                              setFormData(prev => ({ ...prev, brandCategories: customBusinessType ? [customBusinessType] : [], brandKeywords: [] }))
                            }
                            setCustomKeywords([])
                          }}
                          className={`flex flex-col items-center justify-center px-2 py-2.5 rounded-lg border transition-all text-center min-h-[56px] ${
                            selectedBusinessType === type.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/40'
                          }`}
                        >
                          <span className="text-lg mb-0.5">{type.emoji}</span>
                          <span className="text-[11px] sm:text-xs font-medium text-foreground leading-tight">{type.label}</span>
                        </button>
                      ))}
                    </div>

                    {selectedBusinessType === 'other' && !customBusinessType && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="customBusinessTypeInput"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              const v = (e.target as HTMLInputElement).value.trim()
                              if (v) {
                                setCustomBusinessType(v)
                                setFormData(prev => ({ ...prev, brandCategories: [v] }))
                              }
                            }
                          }}
                          placeholder="Enter your brand's category"
                          autoFocus
                          className="flex-1 px-4 py-3 border-2 border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-background placeholder:text-gray-400"
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('customBusinessTypeInput') as HTMLInputElement
                            const v = input?.value?.trim()
                            if (v) {
                              setCustomBusinessType(v)
                              setFormData(prev => ({ ...prev, brandCategories: [v] }))
                            }
                          }}
                          size="sm"
                          className="h-12 px-5"
                        >
                          Add
                        </Button>
                      </div>
                    )}

                    {selectedBusinessType === 'other' && customBusinessType && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                        <div className="flex flex-col items-center justify-center px-2 py-2.5 rounded-lg border border-primary bg-primary/5 text-center min-h-[56px] relative">
                          <button
                            type="button"
                            onClick={() => {
                              setCustomBusinessType('')
                              setFormData(prev => ({ ...prev, brandCategories: [] }))
                            }}
                            className="absolute top-1.5 right-1.5 hover:bg-primary/20 rounded-full p-0.5 transition-colors text-primary"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-lg mb-0.5">🏢</span>
                          <span className="text-[11px] sm:text-xs font-medium text-foreground leading-tight">{customBusinessType}</span>
                        </div>
                      </div>
                    )}

                    {/* Show more / Show less toggle */}
                    {sortedBusinessTypes.length > VISIBLE_ROWS && (
                      <button
                        type="button"
                        onClick={() => setShowAllBusinessTypes(prev => !prev)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground border-2 border-dashed border-border hover:border-primary/40 rounded-xl transition-all"
                      >
                        {showAllBusinessTypes ? (
                          <>Show fewer types</>
                        ) : (
                          <>{sortedBusinessTypes.length - VISIBLE_ROWS} more types &mdash; show all</>
                        )}
                      </button>
                    )}

                    {showValidation && validationErrors.find(e => e.field === 'brandCategories') && (
                      <p className="text-sm text-red-500">{validationErrors.find(e => e.field === 'brandCategories')?.message}</p>
                    )}
                  </div>

                  {/* Website */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label htmlFor="brandWebsite" className="text-base font-bold text-foreground">
                        Website <span className="text-muted-foreground font-normal">(optional)</span>
                      </label>
                      <div className="relative">
                        <button type="button" data-tooltip-trigger onClick={() => setActiveTooltip(activeTooltip === 'website' ? null : 'website')} className="text-muted-foreground hover:text-foreground transition-colors"><Info className="h-4 w-4" /></button>
                        {activeTooltip === 'website' && (
                          <div data-tooltip-content className="absolute left-1/2 -translate-x-1/2 top-7 z-50 w-72 p-3 bg-foreground text-background text-xs rounded-lg leading-relaxed">
                            <p>AI assistants often pull information from your website when generating answers. Adding it helps us assess your full AI presence.</p>
                            <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-3 h-3 bg-foreground rotate-45" />
                          </div>
                        )}
                      </div>
                    </div>
                    <input
                      id="brandWebsite"
                      type="url"
                      value={formData.brandWebsite}
                      onChange={(e) => setFormData(prev => ({ ...prev, brandWebsite: e.target.value }))}
                      placeholder="https://yourbusiness.com"
                      maxLength={500}
                      autoComplete="url"
                      className="w-full px-4 py-3 border-2 border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-background placeholder:text-gray-400"
                    />
                  </div>

                  <Button
                    onClick={handleNext}
                    className="w-full h-12 text-base font-semibold mt-4 rounded-xl"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Your Market */}
          {step === "business-context" && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-background border-2 border-border rounded-2xl p-6 sm:p-8 md:p-10">
                <button
                  onClick={handleBack}
                  className="flex items-center text-muted-foreground hover:text-foreground mb-6 font-medium transition-colors text-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </button>

                <div className="mb-8">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground">
                    What should AI recommend you for?
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Your products, services, and market shape the prompts we test. The more specific your niche, the clearer the audit results.
                  </p>
                </div>

                <div className="space-y-8">
                  {/* Products & Services */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <label className="text-base font-bold text-foreground">
                        What do you offer? *
                      </label>
                      <div className="relative">
                        <button type="button" data-tooltip-trigger onClick={() => setActiveTooltip(activeTooltip === 'offerings' ? null : 'offerings')} className="text-muted-foreground hover:text-foreground transition-colors"><Info className="h-4 w-4" /></button>
                        {activeTooltip === 'offerings' && (
                          <div data-tooltip-content className="absolute left-1/2 -translate-x-1/2 top-7 z-50 w-72 p-3 bg-foreground text-background text-xs rounded-lg leading-relaxed">
                            <p>Your products and services determine the exact prompts we&apos;ll test across AI platforms like ChatGPT, Gemini, and Perplexity.</p>
                            <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-3 h-3 bg-foreground rotate-45" />
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground -mt-1">
                      Tap to select, or add your own below
                    </p>

                    {/* Suggestion chips + custom keywords merged */}
                    <div className="flex flex-wrap gap-2">
                      {topicSuggestions.length > 0 && topicSuggestions.map((topic) => {
                        const isSelected = (formData.brandKeywords || []).includes(topic)
                        return (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setFormData(prev => ({
                                  ...prev,
                                  brandKeywords: prev.brandKeywords.filter(k => k !== topic)
                                }))
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  brandKeywords: [...prev.brandKeywords, topic]
                                }))
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                              isSelected
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background border-border text-foreground hover:border-primary/50'
                            }`}
                          >
                            {isSelected && <span className="mr-1">&#10003;</span>}
                            {topic}
                          </button>
                        )
                      })}
                      {/* Custom keywords shown inline as toggleable chips */}
                      {customKeywords.map((keyword) => {
                        const isSelected = (formData.brandKeywords || []).includes(keyword)
                        return (
                          <button
                            key={`custom-${keyword}`}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setFormData(prev => ({
                                  ...prev,
                                  brandKeywords: prev.brandKeywords.filter(k => k !== keyword)
                                }))
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  brandKeywords: [...prev.brandKeywords, keyword]
                                }))
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all group ${
                              isSelected
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background border-border text-foreground hover:border-primary/50'
                            }`}
                          >
                            {isSelected && <span className="mr-1">&#10003;</span>}
                            {keyword}
                            <span
                              role="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setCustomKeywords(prev => prev.filter(k => k !== keyword))
                                setFormData(prev => ({
                                  ...prev,
                                  brandKeywords: prev.brandKeywords.filter(k => k !== keyword)
                                }))
                              }}
                              className="ml-1 inline-flex opacity-60 hover:opacity-100"
                            >
                              <X className="h-3 w-3" />
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Custom keyword input */}
                    {(formData.brandKeywords || []).length < MAX_KEYWORDS && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ',') {
                              e.preventDefault()
                              const v = sanitize(keywordInput.replace(/,$/, ''))
                              if (v && !(formData.brandKeywords || []).includes(v) && !customKeywords.includes(v) && !topicSuggestions.includes(v)) {
                                setCustomKeywords(prev => [...prev, v])
                                setFormData(prev => ({ ...prev, brandKeywords: [...prev.brandKeywords, v] }))
                              }
                              setKeywordInput('')
                            }
                          }}
                          placeholder="Add your own..."
                          maxLength={100}
                          className="flex-1 px-4 py-2.5 border-2 border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-background placeholder:text-gray-400"
                        />
                        {keywordInput.trim() && (
                          <Button
                            type="button"
                            onClick={() => {
                              const v = sanitize(keywordInput)
                              if (v && !(formData.brandKeywords || []).includes(v) && !customKeywords.includes(v) && !topicSuggestions.includes(v)) {
                                setCustomKeywords(prev => [...prev, v])
                                setFormData(prev => ({ ...prev, brandKeywords: [...prev.brandKeywords, v] }))
                              }
                              setKeywordInput('')
                            }}
                            size="sm"
                            className="h-10 px-4"
                          >
                            Add
                          </Button>
                        )}
                      </div>
                    )}

                    {showValidation && validationErrors.find(e => e.field === 'productsServices') && (
                      <p className="text-sm text-red-500">{validationErrors.find(e => e.field === 'productsServices')?.message}</p>
                    )}
                  </div>

                  {/* Competitors */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <label className="text-base font-bold text-foreground">
                        Who do you compete with? <span className="text-muted-foreground font-normal">(optional)</span>
                      </label>
                      <div className="relative">
                        <button type="button" data-tooltip-trigger onClick={() => setActiveTooltip(activeTooltip === 'competitors' ? null : 'competitors')} className="text-muted-foreground hover:text-foreground transition-colors"><Info className="h-4 w-4" /></button>
                        {activeTooltip === 'competitors' && (
                          <div data-tooltip-content className="absolute left-1/2 -translate-x-1/2 top-7 z-50 w-72 p-3 bg-foreground text-background text-xs rounded-lg leading-relaxed">
                            <p>We&apos;ll check whether AI recommends them instead of you, and show you how you compare.</p>
                            <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-3 h-3 bg-foreground rotate-45" />
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground -mt-1">
                      Who do your customers compare you to?
                    </p>
                    {formData.knownCompetitors.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.knownCompetitors.map((competitor, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, knownCompetitors: prev.knownCompetitors.filter(c => c !== competitor) }))}
                            className="px-3 py-1.5 rounded-full text-sm font-medium border transition-all bg-primary text-primary-foreground border-primary"
                          >
                            &#10003; {competitor}
                            <X className="h-3 w-3 ml-1 inline" />
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={competitorInput}
                        onChange={(e) => setCompetitorInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault()
                            const v = sanitize(competitorInput.replace(/,$/, ''))
                            if (v && !formData.knownCompetitors.includes(v) && formData.knownCompetitors.length < MAX_COMPETITORS) {
                              setFormData(prev => ({ ...prev, knownCompetitors: [...prev.knownCompetitors, v] }))
                            }
                            setCompetitorInput('')
                          }
                        }}
                        placeholder="e.g., Joe's Auto, Main Street Dental"
                        maxLength={200}
                        className="flex-1 px-4 py-2.5 border-2 border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-background placeholder:text-gray-400"
                      />
                      {competitorInput.trim() && formData.knownCompetitors.length < MAX_COMPETITORS && (
                        <Button
                          type="button"
                          onClick={() => {
                            const v = sanitize(competitorInput)
                            if (v && !formData.knownCompetitors.includes(v)) {
                              setFormData(prev => ({ ...prev, knownCompetitors: [...prev.knownCompetitors, v] }))
                            }
                            setCompetitorInput('')
                          }}
                          size="sm"
                          className="h-10 px-4"
                        >
                          Add
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Markets — Country + State */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <label className="text-base font-bold text-foreground">
                        Where are your customers? *
                      </label>
                      <div className="relative">
                        <button type="button" data-tooltip-trigger onClick={() => setActiveTooltip(activeTooltip === 'markets' ? null : 'markets')} className="text-muted-foreground hover:text-foreground transition-colors"><Info className="h-4 w-4" /></button>
                        {activeTooltip === 'markets' && (
                          <div data-tooltip-content className="absolute left-1/2 -translate-x-1/2 top-7 z-50 w-72 p-3 bg-foreground text-background text-xs rounded-lg leading-relaxed">
                            <p>We tailor prompts to the markets you serve so your audit results reflect real-world customer behavior.</p>
                            <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-3 h-3 bg-foreground rotate-45" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Country selector */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Country</label>
                      {/* Selected countries */}
                      {formData.targetMarkets.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {formData.targetMarkets.map((code) => {
                            const market = countryOptions.find(opt => opt.value === code)
                            return (
                              <span
                                key={code}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-medium"
                              >
                                &#10003; {market?.label || code.toUpperCase()}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, targetMarkets: prev.targetMarkets.filter(m => m !== code) }))
                                    if (code === 'us') {
                                      setSelectedStates([])
                                      setShowStateDropdown(false)
                                    }
                                  }}
                                  className="hover:bg-primary-foreground/20 rounded-full p-0.5 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            )
                          })}
                        </div>
                      )}
                      {/* Country dropdown trigger */}
                      <div className="relative">
                        <button
                          ref={countryTriggerRef}
                          type="button"
                          onClick={() => {
                            if (!showCountryDropdown) setCountryDropDir(calcDropDirection(countryTriggerRef.current))
                            setShowCountryDropdown(!showCountryDropdown)
                            setShowStateDropdown(false)
                          }}
                          className="w-full flex items-center justify-between px-4 py-2.5 border-2 border-border rounded-xl text-sm bg-background hover:border-primary/50 transition-colors"
                        >
                          <span className="text-muted-foreground">
                            {formData.targetMarkets.length >= MAX_MARKETS ? `${MAX_MARKETS} countries selected (max)` : "+ Add a country"}
                          </span>
                          <Search className="h-4 w-4 text-muted-foreground" />
                        </button>
                        {showCountryDropdown && formData.targetMarkets.length < MAX_MARKETS && (
                          <>
                            {/* Backdrop: dark on mobile, transparent on desktop */}
                            <div className="fixed inset-0 z-30 bg-black/40 sm:bg-transparent" onClick={() => { setShowCountryDropdown(false); setMarketSearch('') }} />
                            <div className={`
                              fixed inset-x-0 bottom-0 z-50 max-h-[70vh] rounded-t-2xl border-t-2 border-border bg-background shadow-2xl
                              sm:absolute sm:inset-auto sm:w-full sm:rounded-xl sm:border-2 sm:shadow-lg sm:max-h-none sm:z-40
                              ${countryDropDir === 'up' ? 'sm:bottom-full sm:mb-1' : 'sm:top-full sm:mt-1'}
                            `}>
                              <div className="p-3 border-b bg-muted/30 sm:rounded-t-xl">
                                <div className="w-10 h-1 bg-border rounded-full mx-auto mb-3 sm:hidden" />
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-semibold">Select country</span>
                                  <button type="button" onClick={() => { setShowCountryDropdown(false); setMarketSearch('') }} className="p-1 hover:bg-muted rounded-lg"><X className="h-4 w-4" /></button>
                                </div>
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <input
                                    type="text"
                                    placeholder="Search countries..."
                                    value={marketSearch}
                                    onChange={(e) => setMarketSearch(e.target.value)}
                                    autoFocus
                                    className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
                                  />
                                </div>
                              </div>
                              <div className="max-h-[55vh] sm:max-h-48 overflow-y-auto overscroll-contain">
                                {sortedCountryOptions
                                  .filter(opt => !formData.targetMarkets.includes(opt.value))
                                  .filter(opt =>
                                    opt.label.toLowerCase().includes(marketSearch.toLowerCase()) ||
                                    (opt.region && opt.region.toLowerCase().includes(marketSearch.toLowerCase()))
                                  )
                                  .slice(0, 30)
                                  .map(opt => (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => {
                                        setFormData(prev => ({ ...prev, targetMarkets: [...prev.targetMarkets, opt.value] }))
                                        setMarketSearch('')
                                        if (formData.targetMarkets.length + 1 >= MAX_MARKETS) setShowCountryDropdown(false)
                                      }}
                                      className="w-full flex items-center justify-between text-left px-4 py-3 sm:py-2.5 hover:bg-muted/50 text-sm border-b border-border/30 last:border-0 transition-colors active:bg-muted"
                                    >
                                      <span>{opt.label}</span>
                                      <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                                    </button>
                                  ))}
                                {sortedCountryOptions
                                  .filter(opt => !formData.targetMarkets.includes(opt.value))
                                  .filter(opt =>
                                    opt.label.toLowerCase().includes(marketSearch.toLowerCase()) ||
                                    (opt.region && opt.region.toLowerCase().includes(marketSearch.toLowerCase()))
                                  ).length === 0 && (
                                  <p className="px-4 py-3 text-sm text-muted-foreground text-center">No countries found</p>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* US States — only visible when US is selected */}
                    {formData.targetMarkets.includes('us') && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">State <span className="font-normal">(optional &mdash; narrow your audit to specific states)</span></label>
                        {/* Selected states */}
                        {selectedStates.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {selectedStates.map((state) => (
                              <span
                                key={state}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-medium"
                              >
                                {state}
                                <button
                                  type="button"
                                  onClick={() => setSelectedStates(prev => prev.filter(s => s !== state))}
                                  className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        {/* State dropdown trigger */}
                        <div className="relative">
                          <button
                            ref={stateTriggerRef}
                            type="button"
                            onClick={() => {
                              if (!showStateDropdown) setStateDropDir(calcDropDirection(stateTriggerRef.current))
                              setShowStateDropdown(!showStateDropdown)
                              setShowCountryDropdown(false)
                            }}
                            className="w-full flex items-center justify-between px-4 py-2.5 border-2 border-border rounded-xl text-sm bg-background hover:border-primary/50 transition-colors"
                          >
                            <span className="text-muted-foreground">
                              {selectedStates.length > 0 ? `${selectedStates.length} state${selectedStates.length > 1 ? 's' : ''} selected` : "All states (select to narrow down)"}
                            </span>
                            <Search className="h-4 w-4 text-muted-foreground" />
                          </button>
                          {showStateDropdown && (
                            <>
                              {/* Backdrop: dark on mobile, transparent on desktop */}
                              <div className="fixed inset-0 z-30 bg-black/40 sm:bg-transparent" onClick={() => { setShowStateDropdown(false); setStateSearch('') }} />
                              <div className={`
                                fixed inset-x-0 bottom-0 z-50 max-h-[70vh] rounded-t-2xl border-t-2 border-border bg-background shadow-2xl
                                sm:absolute sm:inset-auto sm:w-full sm:rounded-xl sm:border-2 sm:shadow-lg sm:max-h-none sm:z-40
                                ${stateDropDir === 'up' ? 'sm:bottom-full sm:mb-1' : 'sm:top-full sm:mt-1'}
                              `}>
                                <div className="p-3 border-b bg-muted/30 sm:rounded-t-xl">
                                  <div className="w-10 h-1 bg-border rounded-full mx-auto mb-3 sm:hidden" />
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold">Select state</span>
                                    <button type="button" onClick={() => { setShowStateDropdown(false); setStateSearch('') }} className="p-1 hover:bg-muted rounded-lg"><X className="h-4 w-4" /></button>
                                  </div>
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                      type="text"
                                      placeholder="Search states..."
                                      value={stateSearch}
                                      onChange={(e) => setStateSearch(e.target.value)}
                                      autoFocus
                                      className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
                                    />
                                  </div>
                                </div>
                                <div className="max-h-[55vh] sm:max-h-48 overflow-y-auto overscroll-contain">
                                  {US_STATES
                                    .filter(s => !selectedStates.includes(s))
                                    .filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()))
                                    .map(state => (
                                      <button
                                        key={state}
                                        type="button"
                                        onClick={() => {
                                          setSelectedStates(prev => [...prev, state])
                                          setStateSearch('')
                                        }}
                                        className="w-full flex items-center justify-between text-left px-4 py-3 sm:py-2.5 hover:bg-muted/50 text-sm border-b border-border/30 last:border-0 transition-colors active:bg-muted"
                                      >
                                        <span>{state}</span>
                                        <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                                      </button>
                                    ))}
                                  {US_STATES
                                    .filter(s => !selectedStates.includes(s))
                                    .filter(s => s.toLowerCase().includes(stateSearch.toLowerCase())).length === 0 && (
                                    <p className="px-4 py-3 text-sm text-muted-foreground text-center">No states found</p>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {showValidation && validationErrors.find(e => e.field === 'targetMarkets') && (
                      <p className="text-sm text-red-500">{validationErrors.find(e => e.field === 'targetMarkets')?.message}</p>
                    )}
                  </div>

                  <Button
                    onClick={handleNext}
                    disabled={isGeneratingPrompts}
                    className="w-full h-12 text-base font-semibold mt-4 rounded-xl"
                  >
                    {isGeneratingPrompts ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {promptGenStatus || "Analyzing your brand…"}
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Prompts Step */}
          {step === "prompts" && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2 text-foreground">Your AI Visibility Prompts</h1>
                <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                  We analyzed real search trends, &ldquo;People Also Ask&rdquo; data, and your industry to find the exact prompts your audience is typing into ChatGPT, Gemini, and Perplexity. We&apos;ll monitor every response to see where <span className="font-medium text-foreground">{formData.brandName}</span> ranks.
                </p>
              </div>

              <div className="bg-background border-2 border-border rounded-2xl p-6">
                <button
                  onClick={handleBack}
                  className="flex items-center text-muted-foreground hover:text-black mb-6 font-medium transition-colors text-base"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to your market
                </button>

                <div className="mb-4">
                  <h2 className="text-base font-bold text-foreground mb-1">Prompts to monitor</h2>
                  <p className="text-xs text-muted-foreground">Built from live search trends and audience intent signals. Remove any that aren&apos;t relevant, or add your own.</p>
                </div>

                <div className="space-y-4">
                  {isGeneratingPrompts ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/20 border-t-primary mx-auto" />
                        <div>
                          <p className="text-foreground text-sm font-semibold transition-all duration-500">
                            {promptGenStatus || "Analyzing your brand…"}
                          </p>
                          <p className="text-muted-foreground text-xs mt-1">This usually takes 10–20 seconds</p>
                        </div>
                      </div>
                    </div>
                  ) : aiGeneratedPrompts.length === 0 ? (
                    <div className="text-center py-8 space-y-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <Plus className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">Add Your Monitoring Prompts</h3>
                        <p className="text-muted-foreground text-sm max-w-md mx-auto">
                          We couldn&apos;t auto-generate prompts this time. Add the questions you want to track &mdash; these are what people ask AI when looking for a business like yours.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {aiGeneratedPrompts.map((prompt) => (
                        <div
                          key={prompt.id}
                          className="group flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl transition-all duration-200 hover:shadow-sm"
                        >
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          <p className="flex-1 min-w-0 text-sm font-medium text-slate-800 leading-relaxed">
                            {prompt.text}
                          </p>
                          <button
                            onClick={() => removePrompt(prompt.id)}
                            className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all duration-200 group-hover:opacity-100 opacity-60"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add custom prompt */}
                  <div className="pt-4 border-t border-border">
                    <h4 className="font-medium text-foreground text-sm mb-3">Add your own prompt</h4>
                    <div className="space-y-3">
                      <Textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="e.g., Best plumbing companies in Austin for emergency repairs"
                        className="min-h-[60px] resize-none text-sm border-gray-300 focus:border-primary focus:ring-primary"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            addCustomPrompt()
                          }
                        }}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          onClick={async () => {
                            if (!customPrompt.trim()) return
                            setIsPolishingPrompt(true)
                            try {
                              const response = await fetch("/api/content/prompts/enhance", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  prompt: customPrompt,
                                  brandContext: {
                                    brandName: formData.brandName,
                                    businessCategory: formData.businessCategory,
                                    markets: formData.targetMarkets,
                                  },
                                }),
                              })
                              const data = await response.json()
                              if (data.success) setCustomPrompt(data.enhancedPrompt)
                            } catch (error) {
                              console.error("Failed to enhance prompt:", error)
                            } finally {
                              setTimeout(() => setIsPolishingPrompt(false), 100)
                            }
                          }}
                          disabled={!customPrompt.trim() || isPolishingPrompt}
                          variant="outline"
                          size="sm"
                          className="h-9 px-4 text-sm"
                        >
                          {isPolishingPrompt ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2" />
                              Polishing...
                            </>
                          ) : (
                            <>✨ AI Polish</>
                          )}
                        </Button>
                        <Button onClick={addCustomPrompt} disabled={!customPrompt.trim() || aiGeneratedPrompts.length >= MAX_PROMPTS} size="sm" className="h-9 px-4 text-sm">
                          <Plus className="h-3 w-3 mr-2" />
                          {aiGeneratedPrompts.length >= MAX_PROMPTS ? `Max ${MAX_PROMPTS}` : 'Add Prompt'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Run Audit button */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-foreground">Ready to analyze:</span>
                        <div className="flex gap-1">
                          {formData.targetMarkets.slice(0, 2).map((marketCode) => {
                            const market = countryOptions.find((opt) => opt.value === marketCode)
                            return (
                              <span key={marketCode} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                                {market?.label}
                              </span>
                            )
                          })}
                          {formData.targetMarkets.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{formData.targetMarkets.length - 2}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={runAudit}
                      disabled={isRunningAudit || aiGeneratedPrompts.length === 0}
                      className="w-full h-12 text-base font-semibold rounded-xl"
                    >
                      {isRunningAudit ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Starting analysis...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Run Free AI Audit
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
                      <Shield className="h-3 w-3" />
                      Your data is encrypted and never shared.
                      By running this audit, you agree to our{" "}
                      <Link href="/terms" className="underline hover:text-foreground">Terms</Link>
                      {" "}and{" "}
                      <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Processing Step */}
          {step === "processing" && (() => {
            const totalQueries = aiGeneratedPrompts.length * 3
            const estimatedDone = Math.min(totalQueries, Math.floor(pollCount * 2))
            const pct = Math.min(95, totalQueries > 0 ? Math.round((estimatedDone / totalQueries) * 100) : 0)

            const aiModels = [
              { name: "ChatGPT", logo: "/models/chatgpt-logo.png", activeAt: 1, doneAt: 4 },
              { name: "Gemini", logo: "/models/gemini-logo.png", activeAt: 2, doneAt: 7 },
              { name: "Grok", logo: "/models/grok-logo.png", activeAt: 3, doneAt: 10 },
            ]

            const phases = [
              { label: "Prompts prepared", doneAt: 1 },
              { label: "Querying AI models", doneAt: 7 },
              { label: "Analyzing mentions & sentiment", doneAt: 10 },
              { label: "Building your visibility report", doneAt: Infinity },
            ]
            const currentPhaseIdx = phases.findIndex(s => pollCount <= s.doneAt)

            const facts = [
              "62% of consumers now use AI assistants to research local businesses before visiting.",
              "Brands mentioned in AI answers see 3\u00d7 more qualified website traffic on average.",
              "Only 12% of small businesses currently track how they appear in AI search results.",
              "ChatGPT processes over 100 million queries daily \u2014 more than many traditional search engines.",
              "AI assistants pull from reviews, articles, and your website to form their answers.",
              "Being named in AI responses increases brand trust by 47% according to recent studies.",
              "After this report, you\u2019ll know exactly how to improve your AI presence.",
            ]
            const currentFact = facts[Math.floor(pollCount / 2) % facts.length]

            return (
              <div className="max-w-3xl mx-auto">
                <div className="bg-background border-2 border-border rounded-2xl p-6 sm:p-8 md:p-10">
                  {/* Live Badge + Header */}
                  <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-semibold mb-4 tracking-wide uppercase">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                      </span>
                      Live Analysis
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground">
                      Scanning the AI Universe
                    </h1>
                    <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                      We&apos;re asking real AI assistants about{" "}
                      <span className="font-semibold text-foreground">{formData.brandName}</span>{" "}
                      right now. This typically takes 60–90 seconds.
                    </p>
                  </div>

                  {/* AI Model Cards */}
                  <div className="grid grid-cols-3 gap-3 mb-8">
                    {aiModels.map((m) => {
                      const isDone = pollCount > m.doneAt
                      const isActive = !isDone && pollCount >= m.activeAt
                      return (
                        <div
                          key={m.name}
                          className={`p-4 rounded-xl border-2 text-center transition-all duration-500 flex flex-col items-center gap-2 ${
                            isDone
                              ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                              : isActive
                              ? "border-primary bg-primary/5"
                              : "border-border bg-muted/30"
                          }`}
                        >
                          <Image
                            src={m.logo}
                            alt={m.name}
                            width={32}
                            height={32}
                            className="rounded-lg"
                          />
                          <p className="text-sm font-bold text-foreground">{m.name}</p>
                          <div>
                            {isDone ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                                <CheckCircle className="h-3.5 w-3.5" /> Done
                              </span>
                            ) : isActive ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Querying
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Waiting</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        {estimatedDone} of {totalQueries} queries tested
                      </span>
                      <span className="text-sm font-bold text-primary">{pct}%</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Progress Checklist */}
                  <div className="space-y-3 mb-8">
                    {phases.map((s, i) => {
                      const isDone = pollCount > s.doneAt
                      const isCurrent = i === currentPhaseIdx
                      return (
                        <div key={i} className="flex items-center gap-3">
                          {isDone ? (
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          ) : isCurrent ? (
                            <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
                          ) : (
                            <div className="h-5 w-5 border-2 border-border rounded-full flex-shrink-0" />
                          )}
                          <span className={`text-sm ${isDone || isCurrent ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                            {s.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Educational Fact */}
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 text-center">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                      💡 Did you know?
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {currentFact}
                    </p>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Report Step */}
          {step === "report" && auditResults && (
            <div className="space-y-0">
              <BrandVisibilityAuditReport
                auditResults={auditResults}
                brandName={formData.brandName || cachedBrandName || 'Your Brand'}
                brandId={cachedBrandId || undefined}
                freeAuditToken={cachedBrandId && accessToken ? accessToken : undefined}
                isOnboarding={false}
                isFreeAudit={true}
                onBack={() => setStep("prompts")}
                onStartOver={() => {
                  setStep("brand-setup")
                  setAuditResults(null)
                  setAccessToken(null)
                  setCachedBrandName(null)
                  setCachedBrandId(null)
                  setAiGeneratedPrompts([])
                  // Clear cached report so user gets a fresh start
                  try { localStorage.removeItem("soma_audit_token") } catch {}
                  try { sessionStorage.removeItem("free_audit_token") } catch {}
                  try { sessionStorage.removeItem("free_audit_id") } catch {}
                  // Clean URL
                  const url = new URL(window.location.href)
                  url.searchParams.delete('report')
                  window.history.replaceState({}, '', url.toString())
                }}
                onSignOut={() => router.push("/")}
              />


            </div>
          )}
        </div>
      </div>
    </div>
  )
}
