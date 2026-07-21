"use client"

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { X, ChevronLeft, ChevronRight, AlertCircle, Search, Plus, Check, Loader2 } from "lucide-react"
import { useBrand } from "@/lib/contexts/brand-context"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BRAND_CATEGORIES } from "@/components/auth/onboarding/constants"
import { QuotaLimitDialog } from "@/components/subscription/quota-limit-dialog"

interface ValidationError {
  field: string
  message: string
}

interface Country {
  id: string
  name: string
  code: string
}

interface BrandFormData {
  // Brand Company Details (only for agencies)
  brandCompanyName: string
  brandCompanyWebsite: string
  brandCompanyLocation: string

  // Brand Details
  brandName: string
  brandDescription: string // Rich description of what the brand does
  brandCategories: string[]
  brandWebsite: string

  // Markets and Location
  targetMarkets: string[]
  location: string

  // Business Context
  brandTopics: string[]
  knownCompetitors: string[]
}

// Countries will be fetched from the database

interface BrandCreationDialogProps {
  open: boolean
  onCloseAction: () => void
  onSuccessAction?: (brandData: any) => void
}

// Onboarding-style input classes
const inputClasses = "w-full px-4 py-3 border-2 border-border rounded-xl bg-background text-foreground text-base font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground placeholder:font-normal disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted/30"
const inputErrorClasses = "border-red-300 focus:border-red-500 focus:ring-red-200"

export function BrandCreationDialog({ open, onCloseAction, onSuccessAction }: BrandCreationDialogProps) {
  const { currentAccount, currentBrand } = useBrand()
  const router = useRouter()
  // Check if current account is agency type
  const isAgency = currentAccount?.account_type === 'agency'

  const [step, setStep] = useState<'company-details' | 'brand-details' | 'business-context'>('brand-details')
  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [quotaError, setQuotaError] = useState<{ message: string, max: number, current?: number } | null>(null)

  // Category search state
  const [searchQuery, setSearchQuery] = useState("")
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)

  // Countries from database
  const [countries, setCountries] = useState<Country[]>([])
  const [countriesLoading, setCountriesLoading] = useState(false)
  const [countrySearchQuery, setCountrySearchQuery] = useState("")
  const [showCountryPicker, setShowCountryPicker] = useState(false)

  // Topics input state
  const [newTopic, setNewTopic] = useState("")

  const [formData, setFormData] = useState<BrandFormData>({
    brandCompanyName: "",
    brandCompanyWebsite: "",
    brandCompanyLocation: "",
    brandName: "",
    brandDescription: "",
    brandCategories: [],
    brandWebsite: "",
    targetMarkets: [],
    location: "",
    brandTopics: [],
    knownCompetitors: []
  })

  const [newMarket, setNewMarket] = useState("")
  const [newCompetitor, setNewCompetitor] = useState("")

  // Set initial step based on account type when dialog opens
  useEffect(() => {
    if (open) {
      if (currentAccount?.account_type === 'agency') {
        setStep('company-details')
      } else {
        setStep('brand-details')
      }
    }
  }, [open, currentAccount])

  // Fetch countries from database
  const fetchCountries = useCallback(async () => {
    setCountriesLoading(true)
    try {
      const response = await fetch('/api/countries')
      if (response.ok) {
        const data = await response.json()
        setCountries(data.countries || [])
      }
    } catch (error) {
      console.error('Failed to fetch countries:', error)
    } finally {
      setCountriesLoading(false)
    }
  }, [])

  // Load countries when dialog opens
  useEffect(() => {
    if (open && countries.length === 0) {
      fetchCountries()
    }
  }, [open, countries.length, fetchCountries])

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!countrySearchQuery.trim()) return countries
    const query = countrySearchQuery.toLowerCase()
    return countries.filter(country =>
      country.name.toLowerCase().includes(query) ||
      country.code.toLowerCase().includes(query)
    )
  }, [countries, countrySearchQuery])

  // Filter and group categories (matching onboarding)
  const filteredAndGroupedCategories = useMemo(() => {
    const filtered = BRAND_CATEGORIES.filter(cat =>
      cat.label.toLowerCase().includes((searchQuery || "").toLowerCase()) ||
      cat.group?.toLowerCase().includes((searchQuery || "").toLowerCase())
    )

    const grouped: Record<string, typeof BRAND_CATEGORIES> = {}
    filtered.forEach(cat => {
      const group = cat.group || "Other"
      if (!grouped[group]) {
        grouped[group] = []
      }
      grouped[group].push(cat)
    })

    return grouped
  }, [searchQuery])

  const hasSearchResults = useMemo(() => {
    return Object.keys(filteredAndGroupedCategories).length > 0
  }, [filteredAndGroupedCategories])

  const selectedCategories = useMemo(() => {
    const selected = formData.brandCategories || []
    return selected.map(categoryValue => {
      const predefined = BRAND_CATEGORIES.find(cat => cat.value === categoryValue)
      if (predefined) {
        return { value: predefined.value, label: predefined.label }
      }
      return { value: categoryValue, label: categoryValue }
    })
  }, [formData.brandCategories])

  const handleCategoryToggle = (categoryValue: string, checked: boolean) => {
    let newCategories: string[]
    if (checked) {
      newCategories = [...(formData.brandCategories || []), categoryValue]
    } else {
      newCategories = (formData.brandCategories || []).filter(c => c !== categoryValue)
    }
    setFormData(prev => ({ ...prev, brandCategories: newCategories }))
  }

  const removeCategory = (categoryValue: string) => {
    const newCategories = (formData.brandCategories || []).filter(c => c !== categoryValue)
    setFormData(prev => ({ ...prev, brandCategories: newCategories }))
  }

  const validateStep = (currentStep: string) => {
    const errors: ValidationError[] = []

    if (currentStep === 'company-details') {
      // Brand company details (only for agencies)
      if (isAgency && !formData.brandCompanyName?.trim()) {
        errors.push({ field: 'brandCompanyName', message: 'Brand company name is required' })
      }

      if (isAgency && formData.brandCompanyWebsite && formData.brandCompanyWebsite.trim()) {
        const urlRegex = /^https?:\/\/.+/
        if (!urlRegex.test(formData.brandCompanyWebsite)) {
          errors.push({ field: 'brandCompanyWebsite', message: 'Please enter a valid website URL (include http:// or https://)' })
        }
      }
    } else if (currentStep === 'brand-details') {
      // Brand details
      if (!formData.brandName?.trim()) {
        errors.push({ field: 'brandName', message: 'Brand name is required' })
      }

      if (!formData.brandCategories || formData.brandCategories.length === 0) {
        errors.push({ field: 'brandCategories', message: 'At least one brand category is required' })
      }

      // Validate website URL if provided
      if (formData.brandWebsite && formData.brandWebsite.trim()) {
        const urlRegex = /^https?:\/\/.+/
        if (!urlRegex.test(formData.brandWebsite)) {
          errors.push({ field: 'brandWebsite', message: 'Please enter a valid website URL (include http:// or https://)' })
        }
      }
    } else if (currentStep === 'business-context') {
      if (!formData.targetMarkets || formData.targetMarkets.length === 0) {
        errors.push({ field: 'targetMarkets', message: 'At least one target market is required' })
      }
    }

    return errors
  }

  const handleNext = () => {
    const errors = validateStep(step)
    setValidationErrors(errors)

    if (errors.length === 0) {
      if (step === 'company-details') {
        setStep('brand-details')
      } else if (step === 'brand-details') {
        setStep('business-context')
      }
    }
  }

  const handleBack = () => {
    setValidationErrors([])
    if (step === 'brand-details') {
      setStep('company-details')
    } else if (step === 'business-context') {
      setStep('brand-details')
    }
  }

  const handleSubmit = async () => {
    const errors = validateStep('business-context')
    setValidationErrors(errors)

    if (errors.length > 0) return

    setIsLoading(true)
    setQuotaError(null)

    try {
      // Create the brand
      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_id: currentAccount?.id,
          name: formData.brandName,
          description: formData.brandDescription, // Rich brand description for AI
          primary_domain: formData.brandWebsite,
          brand_categories: formData.brandCategories,
          targetMarkets: formData.targetMarkets,
          brandTopics: formData.brandTopics,
          knownCompetitors: formData.knownCompetitors,
          // For agency brands, include company details from form
          // For in-house brands, inherit company details from existing brand
          ...(isAgency ? {
            company_name: formData.brandCompanyName,
            company_website: formData.brandCompanyWebsite,
            company_location: formData.brandCompanyLocation
          } : {
            company_name: currentBrand?.company_name || currentAccount?.name,
            company_website: currentBrand?.company_website,
            company_location: currentBrand?.company_location
          })
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        if (response.status === 403 && responseData.quota_exceeded) {
          setQuotaError({
            message: responseData.error,
            max: responseData.max_brands,
            current: responseData.current_count ?? responseData.max_brands,
            plan_name: responseData.plan_name,
            plan_tier: responseData.plan_tier
          })
          return
        }

        // Handle specific error cases with user-friendly messages
        const errorMessage = responseData.error || 'Failed to create brand'

        if (errorMessage.includes('already exists')) {
          // Show as a validation error on the brand name field
          setValidationErrors([{ field: 'brandName', message: 'A brand with this name already exists. Please choose a different name.' }])
          // Go back to brand details step if not already there
          if (step !== 'brand-details') {
            setStep('brand-details')
          }
          return
        }

        // For other errors, show as a general submit error
        setValidationErrors([{ field: 'submit', message: errorMessage }])
        return
      }

      const createdBrand = responseData.data || responseData

      // Reset form and close dialog
      setFormData({
        brandCompanyName: "",
        brandCompanyWebsite: "",
        brandCompanyLocation: "",
        brandName: "",
        brandDescription: "",
        brandCategories: [],
        brandWebsite: "",
        targetMarkets: [],
        location: "",
        brandTopics: [],
        knownCompetitors: []
      })
      setStep('company-details')
      setValidationErrors([])
      setQuotaError(null)
      onSuccessAction?.(createdBrand)
      onCloseAction()
    } catch (error: any) {
      console.error('Error creating brand:', error)
      setValidationErrors([{ field: 'submit', message: error.message || 'Failed to create brand' }])
    } finally {
      setIsLoading(false)
    }
  }

  const addMarket = (market: string) => {
    if (market && !formData.targetMarkets.includes(market)) {
      setFormData(prev => ({
        ...prev,
        targetMarkets: [...prev.targetMarkets, market]
      }))
    }
    setNewMarket("")
  }

  const removeMarket = (market: string) => {
    setFormData(prev => ({
      ...prev,
      targetMarkets: prev.targetMarkets.filter(m => m !== market)
    }))
  }

  const addCompetitor = (competitor: string) => {
    if (competitor && !formData.knownCompetitors.includes(competitor)) {
      setFormData(prev => ({
        ...prev,
        knownCompetitors: [...prev.knownCompetitors, competitor]
      }))
    }
    setNewCompetitor("")
  }

  const removeCompetitor = (competitor: string) => {
    setFormData(prev => ({
      ...prev,
      knownCompetitors: prev.knownCompetitors.filter(c => c !== competitor)
    }))
  }

  const getFieldError = (fieldName: string) => {
    return validationErrors.find(error => error.field === fieldName)?.message
  }

  // Get step titles and descriptions
  const getStepInfo = () => {
    switch (step) {
      case 'company-details':
        return {
          title: isAgency ? 'Company Details' : 'Set up your brand',
          subtitle: isAgency
            ? 'Information about the company that owns this brand'
            : 'Tell us about your organization'
        }
      case 'brand-details':
        return {
          title: 'Brand Details',
          subtitle: isAgency
            ? "Add the brand you'll be managing for your client"
            : 'Tell us about your brand'
        }
      case 'business-context':
        return {
          title: 'Business Context',
          subtitle: 'Help us understand your business for better AI optimization'
        }
    }
  }

  const stepInfo = getStepInfo()

  return (
    <Dialog open={open} onOpenChange={onCloseAction}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {stepInfo.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {stepInfo.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quota limit dialog */}
          <QuotaLimitDialog
            open={!!quotaError}
            onClose={() => setQuotaError(null)}
            resourceType="brand"
            currentCount={quotaError?.current ?? quotaError?.max ?? 0}
            maxCount={quotaError?.max ?? 0}
            planName={quotaError?.plan_name}
            planTier={quotaError?.plan_tier}
          />

          {/* Progress indicators - 3 steps */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${step === 'company-details' ? 'bg-primary' : 'bg-green-600'}`} />
            <div className="h-px bg-border flex-1" />
            <div className={`w-3 h-3 rounded-full ${step === 'brand-details' ? 'bg-primary' :
              step === 'business-context' ? 'bg-green-600' : 'bg-muted'
              }`} />
            <div className="h-px bg-border flex-1" />
            <div className={`w-3 h-3 rounded-full ${step === 'business-context' ? 'bg-primary' : 'bg-muted'}`} />
          </div>

          {/* Step 1: Company Details (for agencies) or Organization info */}
          {step === 'company-details' && (
            <div className="space-y-5">
              {isAgency ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="brandCompanyName" className="text-base font-bold text-foreground">
                      Company Name *
                    </Label>
                    <input
                      id="brandCompanyName"
                      value={formData.brandCompanyName}
                      onChange={(e) => setFormData(prev => ({ ...prev, brandCompanyName: e.target.value }))}
                      placeholder="The company that owns this brand"
                      className={`${inputClasses} ${getFieldError('brandCompanyName') ? inputErrorClasses : ''}`}
                    />
                    {getFieldError('brandCompanyName') && (
                      <p className="text-sm text-red-600">{getFieldError('brandCompanyName')}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brandCompanyWebsite" className="text-base font-bold text-foreground">
                      Company Website (optional)
                    </Label>
                    <input
                      id="brandCompanyWebsite"
                      value={formData.brandCompanyWebsite}
                      onChange={(e) => setFormData(prev => ({ ...prev, brandCompanyWebsite: e.target.value }))}
                      placeholder="https://company.com"
                      className={`${inputClasses} ${getFieldError('brandCompanyWebsite') ? inputErrorClasses : ''}`}
                    />
                    {getFieldError('brandCompanyWebsite') && (
                      <p className="text-sm text-red-600">{getFieldError('brandCompanyWebsite')}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brandCompanyLocation" className="text-base font-bold text-foreground">
                      Company Location (optional)
                    </Label>
                    <input
                      id="brandCompanyLocation"
                      value={formData.brandCompanyLocation}
                      onChange={(e) => setFormData(prev => ({ ...prev, brandCompanyLocation: e.target.value }))}
                      placeholder="City, Country"
                      className={inputClasses}
                    />
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    Let's set up a new brand for your account.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Click continue to enter your brand details.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Brand Details */}
          {step === 'brand-details' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="brandName" className="text-base font-bold text-foreground">
                  Brand name *
                </Label>
                <input
                  id="brandName"
                  value={formData.brandName}
                  onChange={(e) => setFormData(prev => ({ ...prev, brandName: e.target.value }))}
                  placeholder={isAgency ? "Your client's brand name" : "Your brand name"}
                  className={`${inputClasses} ${getFieldError('brandName') ? inputErrorClasses : ''}`}
                />
                {getFieldError('brandName') && (
                  <p className="text-sm text-red-600">{getFieldError('brandName')}</p>
                )}
              </div>

              {/* Brand Description */}
              <div className="space-y-2">
                <Label htmlFor="brandDescription" className="text-base font-bold text-foreground">
                  Brand description (optional)
                </Label>
                <textarea
                  id="brandDescription"
                  value={formData.brandDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, brandDescription: e.target.value }))}
                  placeholder="e.g., Premium specialty coffee roaster sourcing single-origin beans from East African farms. We serve coffee shop owners and specialty retailers with direct trade relationships."
                  rows={3}
                  className={`${inputClasses} resize-none`}
                />
                <p className="text-sm text-muted-foreground">
                  Describe what your brand does, who you serve, and what makes you unique. This helps AI generate more relevant prompts.
                </p>
              </div>

              {/* Brand Categories - Simplified chip-based selection */}
              <div className="space-y-3">
                <Label className="text-base font-bold text-foreground">
                  Brand categories *
                </Label>

                {/* Selected Categories Pills + Toggle Button */}
                <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-xl border-2 border-border">
                  {selectedCategories.length > 0 ? (
                    <>
                      {selectedCategories.map((category) => (
                        <span
                          key={category.value}
                          className="inline-flex items-center px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-medium"
                        >
                          {category.label}
                          <button
                            type="button"
                            onClick={() => removeCategory(category.value)}
                            className="ml-2 hover:bg-primary-foreground/20 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </>
                  ) : (
                    <span className="text-muted-foreground text-sm">No categories selected</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                    className="inline-flex items-center px-3 py-1.5 bg-background border border-border rounded-full text-sm font-medium hover:bg-muted transition-colors ml-auto"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    {showCategoryPicker ? 'Done' : 'Add categories'}
                  </button>
                </div>

                {/* Collapsible Category Picker */}
                {showCategoryPicker && (
                  <div className="space-y-3 p-4 border-2 rounded-xl bg-background">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        className="w-full pl-10 pr-10 py-2.5 border-2 border-border rounded-lg bg-background text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-muted rounded-full p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Category Groups - Scrollable list */}
                    <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                      {Object.entries(filteredAndGroupedCategories).length === 0 ? (
                        <div className="p-6 text-center">
                          <p className="text-sm text-muted-foreground mb-3">No categories found for "{searchQuery}"</p>
                          <button
                            type="button"
                            onClick={() => {
                              handleCategoryToggle(searchQuery.trim(), true)
                              setSearchQuery("")
                            }}
                            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add "{searchQuery}" as custom category
                          </button>
                        </div>
                      ) : (
                        Object.entries(filteredAndGroupedCategories).map(([group, categories]) => (
                          <div key={group} className="border-b last:border-b-0">
                            <div className="px-4 py-2 bg-muted/50 font-semibold text-sm sticky top-0">
                              {group}
                            </div>
                            <div className="p-3 flex flex-wrap gap-2">
                              {categories.map((category) => {
                                const isSelected = (formData.brandCategories || []).includes(category.value)
                                return (
                                  <button
                                    key={category.value}
                                    type="button"
                                    onClick={() => handleCategoryToggle(category.value, !isSelected)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${isSelected
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted hover:bg-muted/80 text-foreground border border-border hover:border-primary/50'
                                      }`}
                                  >
                                    {isSelected && <span className="mr-1">✓</span>}
                                    {category.label}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Done button at the bottom of picker */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowCategoryPicker(false)
                        setSearchQuery("")
                      }}
                      className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                )}

                {getFieldError('brandCategories') && (
                  <p className="text-sm text-red-600">{getFieldError('brandCategories')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandWebsite" className="text-base font-bold text-foreground">
                  Website (optional)
                </Label>
                <input
                  id="brandWebsite"
                  value={formData.brandWebsite}
                  onChange={(e) => setFormData(prev => ({ ...prev, brandWebsite: e.target.value }))}
                  placeholder={isAgency ? "https://clientbrand.com" : "https://yourbrand.com"}
                  className={`${inputClasses} ${getFieldError('brandWebsite') ? inputErrorClasses : ''}`}
                />
                {getFieldError('brandWebsite') && (
                  <p className="text-sm text-red-600">{getFieldError('brandWebsite')}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Business Context */}
          {step === 'business-context' && (
            <div className="space-y-5">
              {/* Target Markets - Searchable from DB */}
              <div className="space-y-2">
                <Label className="text-base font-bold text-foreground">
                  Target Markets *
                </Label>
                <div className="space-y-2">
                  {/* Selected markets */}
                  {formData.targetMarkets.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.targetMarkets.map(market => (
                        <span
                          key={market}
                          className="inline-flex items-center px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
                        >
                          {market}
                          <button
                            type="button"
                            onClick={() => removeMarket(market)}
                            className="ml-2 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Searchable country picker */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCountryPicker(!showCountryPicker)}
                      className={`${inputClasses} text-left flex items-center justify-between ${getFieldError('targetMarkets') ? inputErrorClasses : ''}`}
                    >
                      <span className={formData.targetMarkets.length === 0 ? 'text-muted-foreground font-normal' : ''}>
                        {formData.targetMarkets.length === 0
                          ? 'Search and select countries...'
                          : `${formData.targetMarkets.length} market${formData.targetMarkets.length > 1 ? 's' : ''} selected`}
                      </span>
                      {countriesLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <Search className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>

                    {showCountryPicker && (
                      <div className="absolute z-50 w-full mt-2 bg-background border-2 border-border rounded-xl shadow-lg max-h-[300px] overflow-hidden">
                        {/* Search input */}
                        <div className="p-3 border-b border-border">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                              type="text"
                              value={countrySearchQuery}
                              onChange={(e) => setCountrySearchQuery(e.target.value)}
                              placeholder="Search countries..."
                              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                              autoFocus
                            />
                          </div>
                        </div>

                        {/* Country list */}
                        <div className="max-h-[200px] overflow-y-auto p-2">
                          {countriesLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                          ) : filteredCountries.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4 text-sm">No countries found</p>
                          ) : (
                            filteredCountries.map(country => {
                              const isSelected = formData.targetMarkets.includes(country.name)
                              return (
                                <button
                                  key={country.id}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      removeMarket(country.name)
                                    } else {
                                      addMarket(country.name)
                                    }
                                  }}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${isSelected
                                    ? 'bg-primary/10 text-primary'
                                    : 'hover:bg-muted'
                                    }`}
                                >
                                  <span>{country.name}</span>
                                  {isSelected && <Check className="h-4 w-4" />}
                                </button>
                              )
                            })
                          )}
                        </div>

                        {/* Done button */}
                        <div className="p-2 border-t border-border">
                          <button
                            type="button"
                            onClick={() => {
                              setShowCountryPicker(false)
                              setCountrySearchQuery("")
                            }}
                            className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {getFieldError('targetMarkets') && (
                    <p className="text-sm text-red-600">{getFieldError('targetMarkets')}</p>
                  )}
                </div>
              </div>

              {/* Brand Topics */}
              <div className="space-y-2">
                <Label className="text-base font-bold text-foreground">
                  Brand Topics (optional)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Add topics you want to monitor for AI visibility
                </p>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      placeholder="Enter topic (e.g., pricing, features, integrations)"
                      className={inputClasses}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (newTopic.trim() && !formData.brandTopics.includes(newTopic.trim())) {
                            setFormData(prev => ({
                              ...prev,
                              brandTopics: [...prev.brandTopics, newTopic.trim()]
                            }))
                            setNewTopic("")
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-[50px] px-4 rounded-xl border-2"
                      onClick={() => {
                        if (newTopic.trim() && !formData.brandTopics.includes(newTopic.trim())) {
                          setFormData(prev => ({
                            ...prev,
                            brandTopics: [...prev.brandTopics, newTopic.trim()]
                          }))
                          setNewTopic("")
                        }
                      }}
                      disabled={!newTopic.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {formData.brandTopics.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.brandTopics.map(topic => (
                        <span
                          key={topic}
                          className="inline-flex items-center px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
                        >
                          {topic}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                brandTopics: prev.brandTopics.filter(t => t !== topic)
                              }))
                            }}
                            className="ml-2 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Known Competitors */}
              <div className="space-y-2">
                <Label className="text-base font-bold text-foreground">
                  Known Competitors (optional)
                </Label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      value={newCompetitor}
                      onChange={(e) => setNewCompetitor(e.target.value)}
                      placeholder="Enter competitor name"
                      className={inputClasses}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          newCompetitor && addCompetitor(newCompetitor)
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-[50px] px-4 rounded-xl border-2"
                      onClick={() => newCompetitor && addCompetitor(newCompetitor)}
                      disabled={!newCompetitor}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {formData.knownCompetitors.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.knownCompetitors.map(competitor => (
                        <span
                          key={competitor}
                          className="inline-flex items-center px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
                        >
                          {competitor}
                          <button
                            type="button"
                            onClick={() => removeCompetitor(competitor)}
                            className="ml-2 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-4 border-t">
            <div>
              {(step === 'brand-details' || step === 'business-context') && (
                <Button variant="outline" onClick={handleBack} className="h-11 px-5 rounded-xl border-2">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={onCloseAction} className="h-11 px-5 rounded-xl border-2">
                Cancel
              </Button>

              {step === 'business-context' ? (
                <Button onClick={handleSubmit} disabled={isLoading} className="h-11 px-5 rounded-xl">
                  {isLoading ? 'Creating...' : 'Create Brand'}
                </Button>
              ) : (
                <Button onClick={handleNext} className="h-11 px-5 rounded-xl">
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}