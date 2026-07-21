/**
 * Onboarding Types
 * 
 * Centralized type definitions for the onboarding flow
 */

export type UserType = "agency" | "inhouse" | null

export type Step = 
  | "user-type" 
  | "organization-details" 
  | "brand-company-details" 
  | "brand-setup" 
  | "business-context" 
  | "prompts" 
  | "progress" 
  | "ai-report" 
  | "results"

export interface ValidationError {
  field: string
  message: string
}

export interface BrandFormData {
  // Organization/Account Details
  organizationName: string
  organizationWebsite: string
  
  // Brand Company Details (for agencies)
  brandCompanyName: string
  brandCompanyWebsite: string
  brandCompanyLocation: string
  
  // Brand Details
  brandName: string
  brandCategory: string
  brandCategories: string[]
  brandWebsite: string
  brandDescription?: string
  
  // Entity Type - determines language used in reports
  entityType: 'company' | 'product' | 'service' | 'personality' | 'organization' | 'government' | 'campaign' | 'location'
  
  // Markets and Location
  targetMarkets: string[]
  location: string
  
  // Business Context
  businessCategory: string
  businessType: "brand" | "business" | "product" | "organization"
  productsServices: string
  brandKeywords?: string[] // Brand topics - areas AI should know about (e.g., Pricing, Features, Integrations)
  businessModel: "b2b" | "b2c" | "b2b2c" | "marketplace" | "other" | ""
  targetAudience: string
  primaryValue: string
  businessStage: "startup" | "growth" | "established" | "enterprise" | ""
  knownCompetitors: string[]
}

export interface BrandCategory {
  value: string
  label: string
}

export interface CountryOption {
  value: string
  label: string
  region?: string
}

export interface OnboardingStepProps {
  formData: BrandFormData
  setFormData: (data: BrandFormData | ((prev: BrandFormData) => BrandFormData)) => void
  validationErrors: ValidationError[]
  showValidation: boolean
  isFormLocked?: boolean
  isGeneratingPrompts?: boolean
  userType: UserType
  onNext: () => void
  onBack: () => void
  getFieldError: (field: string) => string | undefined
}
