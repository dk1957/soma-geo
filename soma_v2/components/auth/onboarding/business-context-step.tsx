"use client"

import { useState, useMemo } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { OnboardingInput, OnboardingTextarea, OnboardingDropdownTrigger } from "@/components/ui/onboarding-form-fields"
import { OnboardingStepWrapper } from './onboarding-step-wrapper'
import { FieldError } from './validation-errors'
import { Search, X, ChevronDown } from "lucide-react"
import type { ValidationError, CountryOption } from './types'
import { getEntityTerminology, isPoliticalEntity, isCommercialEntity, isPersonalityEntity, isLocationEntity } from '@/lib/utils/entity-language'

interface BusinessContextStepProps {
  formData: any
  onFormDataChange: (data: any) => void
  onNext: () => void
  onBack: () => void
  validationErrors?: ValidationError[]
  showValidation?: boolean
  isFormLocked?: boolean
  isGeneratingPrompts?: boolean
  countryOptions?: CountryOption[]
}

/**
 * BusinessContextStep Component
 * 
 * Step 4/5 of onboarding: Collect business context details
 * 
 * Features:
 * - Products/services description (required, textarea)
 * - Target markets multi-select with search
 * - Known competitors tag input
 * - Dynamic market badges
 * - Field-level error display
 */
export function BusinessContextStep({
  formData,
  onFormDataChange,
  onNext,
  onBack,
  validationErrors = [],
  showValidation = false,
  isFormLocked = false,
  isGeneratingPrompts = false,
  countryOptions = []
}: BusinessContextStepProps) {
  const [isMarketDropdownOpen, setIsMarketDropdownOpen] = useState(false)
  const [marketSearchTerm, setMarketSearchTerm] = useState("")
  const [competitorInputValue, setCompetitorInputValue] = useState("")
  const [keywordInputValue, setKeywordInputValue] = useState("")
  const [isAddingKeyword, setIsAddingKeyword] = useState(false)
  const [isAddingCompetitor, setIsAddingCompetitor] = useState(false)

  // Get entity-aware terminology
  const entityType = formData.entityType || 'company'
  const terminology = useMemo(() => getEntityTerminology(entityType), [entityType])
  const isPolitical = useMemo(() => isPoliticalEntity(entityType), [entityType])
  const isCommercial = useMemo(() => isCommercialEntity(entityType), [entityType])
  const isPersonality = useMemo(() => isPersonalityEntity(entityType), [entityType])
  const isLocation = useMemo(() => isLocationEntity(entityType), [entityType])

  const getFieldError = (field: string) => {
    return validationErrors.find(e => e.field === field)?.message
  }

  const handleMarketToggle = (marketCode: string, checked: boolean) => {
    if (checked) {
      onFormDataChange({ 
        ...formData, 
        targetMarkets: [...formData.targetMarkets, marketCode] 
      })
    } else {
      onFormDataChange({ 
        ...formData, 
        targetMarkets: formData.targetMarkets.filter(m => m !== marketCode) 
      })
    }
  }

  const handleAddCompetitor = () => {
    const value = competitorInputValue.trim()
    if (value && !formData.knownCompetitors.includes(value)) {
      setIsAddingCompetitor(true)
      setTimeout(() => {
        onFormDataChange({ 
          ...formData, 
          knownCompetitors: [...formData.knownCompetitors, value] 
        })
        setCompetitorInputValue('')
        setIsAddingCompetitor(false)
      }, 200)
    }
  }

  const handleRemoveCompetitor = (competitor: string) => {
    onFormDataChange({
      ...formData,
      knownCompetitors: formData.knownCompetitors.filter(c => c !== competitor)
    })
  }

  const handleAddKeyword = () => {
    const value = keywordInputValue.trim()
    if (value && !(formData.brandKeywords || []).includes(value)) {
      setIsAddingKeyword(true)
      setTimeout(() => {
        onFormDataChange({ 
          ...formData, 
          brandKeywords: [...(formData.brandKeywords || []), value],
          productsServices: formData.productsServices || value // Backward compatibility
        })
        setKeywordInputValue('')
        setIsAddingKeyword(false)
      }, 200)
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    onFormDataChange({
      ...formData,
      brandKeywords: (formData.brandKeywords || []).filter(k => k !== keyword)
    })
  }

  // Generate contextual topic examples based on entity type and selected categories
  const getTopicExamples = () => {
    // Political campaign examples
    if (isPolitical) {
      return ['Policy Positions', 'Campaign Priorities', 'Track Record']
    }
    
    // Personality/public figure examples
    if (isPersonality) {
      return ['Expertise Areas', 'Public Appearances', 'Social Media']
    }
    
    // Location entity examples
    if (isLocation) {
      return ['Attractions', 'Activities', 'Accommodation']
    }
    
    // Organization entity examples
    if (entityType === 'organization') {
      return ['Mission', 'Programs', 'Impact']
    }
    
    // Government entity examples
    if (entityType === 'government') {
      return ['Services', 'Programs', 'Contact Info']
    }
    
    const categories = formData.brandCategories || []
    
    // Map categories to example topics (areas users would ask AI about)
    const exampleMap: Record<string, string[]> = {
      // Food & Beverage
      'food_beverages': ['Product Range', 'Ingredients', 'Nutrition'],
      'food_production': ['Manufacturing', 'Quality Standards', 'Sourcing'],
      'restaurants': ['Menu Options', 'Locations', 'Reservations'],
      'grocery': ['Product Selection', 'Delivery', 'Store Locations'],
      
      // Technology & Software
      'saas': ['Pricing Plans', 'Features', 'Integrations'],
      'computer_software': ['Product Features', 'Enterprise Solutions', 'Support'],
      'mobile_apps': ['App Features', 'Platform Support', 'Updates'],
      'fintech': ['Security', 'Pricing', 'Features'],
      'ai_ml_services': ['Capabilities', 'Use Cases', 'Implementation'],
      'cybersecurity': ['Protection Features', 'Compliance', 'Enterprise Plans'],
      
      // Professional Services
      'accounting': ['Services Offered', 'Industry Expertise', 'Pricing'],
      'legal_services': ['Practice Areas', 'Client Types', 'Consultations'],
      'consulting_management': ['Service Areas', 'Methodologies', 'Case Studies'],
      'marketing_advertising': ['Services', 'Industries Served', 'Results'],
      
      // E-commerce & Retail
      'ecommerce_platform': ['Features', 'Pricing Tiers', 'Integrations'],
      'retail': ['Product Categories', 'Locations', 'Shopping Experience'],
      'marketplace': ['Categories', 'Seller Features', 'Buyer Protection'],
      
      // Health & Wellness
      'hospital_health_care': ['Services', 'Specialties', 'Patient Care'],
      'healthtech': ['Features', 'Compliance', 'Integration'],
      'health_wellness_fitness': ['Programs', 'Memberships', 'Results'],
      
      // Finance
      'banking': ['Account Types', 'Interest Rates', 'Digital Features'],
      'financial_services': ['Investment Options', 'Fees', 'Advisory Services'],
      'investment_management': ['Strategies', 'Performance', 'Account Types'],
      
      // Real Estate
      'real_estate_residential': ['Listings', 'Services', 'Market Areas'],
      'proptech': ['Features', 'Property Types', 'Pricing'],
      
      // Education
      'edtech': ['Courses', 'Pricing', 'Certifications'],
      'higher_education': ['Programs', 'Admissions', 'Campus Life'],
      
      // Default
      'default': ['Product Features', 'Pricing', 'Use Cases']
    }

    // Find matching examples from selected categories
    for (const category of categories) {
      if (exampleMap[category]) {
        return exampleMap[category]
      }
    }

    return exampleMap['default']
  }

  const topicExamples = getTopicExamples()

  return (
    <OnboardingStepWrapper
      title={isPolitical ? "Campaign strategy" : isPersonality ? "Visibility strategy" : isLocation ? "Destination strategy" : "Your visibility niche"}
      subtitle={isPolitical ? "Define the issues and regions you want to own in AI search" : isPersonality ? "Define the topics you want AI to associate with you" : isLocation ? "Define what travelers should find when they ask AI about your destination" : "The topics, markets, and competitors you choose here shape the prompts we track — and ultimately where your brand shows up in AI search."}
      onBack={onBack}
      onNext={onNext}
      backLabel="Back"
      nextLabel={isGeneratingPrompts ? "Generating prompts..." : "Generate monitoring prompts"}
      validationErrors={validationErrors}
      showValidation={showValidation}
      isFormLocked={isFormLocked}
      isLoading={isGeneratingPrompts}
    >
      {/* Brand Topics - Areas AI should know about */}
      <div className="space-y-3">
        <Label className="text-lg font-bold text-foreground">
          {isPolitical ? 'Campaign Topics *' : isPersonality ? 'Expertise Topics *' : isLocation ? 'Destination Topics *' : 'What should AI recommend you for? *'}
        </Label>
        <p className="text-sm text-muted-foreground -mt-1">
          {isPolitical 
            ? 'Topics are key policy areas and issues people ask about when researching candidates.'
            : isPersonality
            ? 'Topics are expertise areas people ask about when researching public figures.'
            : isLocation
            ? 'Topics are key areas people ask about when researching destinations.'
            : 'These are the topics people ask AI about in your space. Pick a focused niche rather than being broad — it\'s easier to dominate a specific area and measure real impact.'}
        </p>
        <div className="relative">
          <OnboardingInput
            type="text"
            value={keywordInputValue}
            onChange={(e) => {
              const value = e.target.value
              
              // Check if user just typed a comma
              if (value.endsWith(',')) {
                const keywordName = value.slice(0, -1).trim()
                if (keywordName && !(formData.brandKeywords || []).includes(keywordName)) {
                  onFormDataChange({ 
                    ...formData, 
                    brandKeywords: [...(formData.brandKeywords || []), keywordName],
                    productsServices: formData.productsServices || keywordName
                  })
                  setKeywordInputValue('')
                } else {
                  setKeywordInputValue('')
                }
              } else {
                setKeywordInputValue(value)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                handleAddKeyword()
              } else if (e.key === 'Backspace' && keywordInputValue === '' && (formData.brandKeywords || []).length > 0) {
                // Remove last keyword if backspace on empty input
                const newKeywords = [...(formData.brandKeywords || [])]
                newKeywords.pop()
                onFormDataChange({ ...formData, brandKeywords: newKeywords })
              }
            }}
            onBlur={handleAddKeyword}
            placeholder={`e.g., ${topicExamples[0]}, ${topicExamples[1]} (Enter or comma to add)`}
            disabled={isFormLocked}
            className="pr-12"
          />
          
          {/* Add Button */}
          {keywordInputValue.trim() && (
            <Button
              type="button"
              onClick={handleAddKeyword}
              size="sm"
              disabled={isAddingKeyword}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 text-xs"
            >
              {isAddingKeyword ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1.5"></div>
                  Adding...
                </>
              ) : (
                'Add'
              )}
            </Button>
          )}
        </div>
        
        {/* Keywords Pills */}
        {(formData.brandKeywords || []).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {(formData.brandKeywords || []).map((keyword, index) => (
              <span
                key={index}
                className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-lg font-medium"
              >
                {keyword}
                <button
                  onClick={() => handleRemoveKeyword(keyword)}
                  className="ml-2 hover:bg-primary/20 rounded-full p-1 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        )}
        <FieldError error={getFieldError('productsServices')} show={showValidation} />
      </div>

      {/* Known Competitors - MOVED UP AND REQUIRED */}
      <div className="space-y-3">
        <Label className="text-lg font-bold text-foreground">
          {isPolitical 
            ? 'Political opponents' 
            : isPersonality
            ? 'Similar personalities'
            : isLocation 
            ? 'Competing destinations' 
            : 'Who are you competing against?'}
        </Label>
        <p className="text-sm text-muted-foreground -mt-1">
          We&apos;ll track whether AI recommends them instead of you, and show you how to close the gap.
        </p>
        <div className="relative">
          <OnboardingInput
            type="text"
            value={competitorInputValue}
            onChange={(e) => {
              const value = e.target.value
              
              // Check if user just typed a comma
              if (value.endsWith(',')) {
                const competitorName = value.slice(0, -1).trim()
                if (competitorName && !formData.knownCompetitors.includes(competitorName)) {
                  onFormDataChange({ 
                    ...formData, 
                    knownCompetitors: [...formData.knownCompetitors, competitorName] 
                  })
                  setCompetitorInputValue('')
                } else {
                  setCompetitorInputValue('')
                }
              } else {
                setCompetitorInputValue(value)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                handleAddCompetitor()
              } else if (e.key === 'Backspace' && competitorInputValue === '' && formData.knownCompetitors.length > 0) {
                // Remove last competitor if backspace on empty input
                const newCompetitors = [...formData.knownCompetitors]
                newCompetitors.pop()
                onFormDataChange({ ...formData, knownCompetitors: newCompetitors })
              }
            }}
            onBlur={handleAddCompetitor}
            placeholder={
              isPolitical 
                ? "Enter opponent names (press Enter or comma)" 
                : isPersonality
                ? "Enter similar personalities (press Enter or comma)"
                : isLocation
                ? "Enter competing destinations (press Enter or comma)"
                : "Enter competitor names (press Enter or comma)"
            }
            disabled={isFormLocked}
            className="pr-12"
          />
          
          {/* Add Button */}
          {competitorInputValue.trim() && (
            <Button
              type="button"
              onClick={handleAddCompetitor}
              size="sm"
              disabled={isAddingCompetitor}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 text-xs"
            >
              {isAddingCompetitor ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1.5"></div>
                  Adding...
                </>
              ) : (
                'Add'
              )}
            </Button>
          )}
        </div>
        
        {/* Competitors Tags */}
        {formData.knownCompetitors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.knownCompetitors.map((competitor, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
              >
                {competitor}
                <button
                  onClick={() => handleRemoveCompetitor(competitor)}
                  className="ml-2 hover:bg-primary/20 rounded-full p-1 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        )}
        <FieldError error={getFieldError('knownCompetitors')} show={showValidation} />
      </div>

      {/* Target Markets */}
      <div className="space-y-3">
        <Label className="text-lg font-bold text-foreground">
          {isPolitical 
            ? 'Target regions *' 
            : isPersonality
            ? 'Target audiences *'
            : isLocation 
            ? 'Source markets *' 
            : 'Where are your customers? *'}
        </Label>
        <p className="text-sm text-muted-foreground -mt-1">
          We&apos;ll generate prompts in the language and context of these markets.
        </p>
        
        {/* Custom Multi-Select Dropdown */}
        <div className="relative market-dropdown-container">
          <OnboardingDropdownTrigger
            onClick={() => !isFormLocked && setIsMarketDropdownOpen(!isMarketDropdownOpen)}
            hasError={showValidation && !!getFieldError('targetMarkets')}
            disabled={isFormLocked}
          >
            <span className="text-left">
              {formData.targetMarkets.length === 0 
                ? "Select countries..." 
                : `${formData.targetMarkets.length} countr${formData.targetMarkets.length > 1 ? 'ies' : 'y'} selected`
              }
            </span>
            <ChevronDown className={`h-6 w-6 transition-transform ${isMarketDropdownOpen ? 'rotate-180' : ''}`} />
          </OnboardingDropdownTrigger>
          
          {isMarketDropdownOpen && !isFormLocked && (
            <div className="absolute z-10 w-full mt-2 bg-background border-2 border-border rounded-xl shadow-lg max-h-80 overflow-hidden">
              {/* Search Input */}
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search countries..."
                    value={marketSearchTerm}
                    onChange={(e) => setMarketSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground text-xl placeholder:text-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                </div>
              </div>
              
              {/* Options List */}
              <div className="max-h-60 overflow-y-auto">
                {countryOptions
                  .filter(option => 
                    option.label.toLowerCase().includes(marketSearchTerm.toLowerCase()) ||
                    (option.region && option.region.toLowerCase().includes(marketSearchTerm.toLowerCase()))
                  )
                  .map((option) => (
                    <label key={option.value} className="flex items-center space-x-3 p-4 hover:bg-muted/30 cursor-pointer transition-colors border-b border-border/50 last:border-b-0">
                      <input
                        type="checkbox"
                        checked={formData.targetMarkets.includes(option.value)}
                        onChange={(e) => handleMarketToggle(option.value, e.target.checked)}
                        className="w-5 h-5 text-primary border-2 border-border rounded focus:ring-primary focus:ring-2"
                      />
                      <div className="flex-1">
                        <span className="text-lg font-medium">{option.label}</span>
                        {option.region && (
                          <span className="text-lg text-muted-foreground ml-2">({option.region})</span>
                        )}
                      </div>
                    </label>
                  ))}
              </div>
            </div>
          )}
        </div>
        
        <FieldError error={getFieldError('targetMarkets')} show={showValidation} />
        
        {/* Selected Markets Display */}
        {formData.targetMarkets.length > 0 && (
          <div>
            <div className="flex flex-wrap gap-2">
              {formData.targetMarkets.map((marketCode) => {
                const market = countryOptions.find(opt => opt.value === marketCode)
                return (
                  <span
                    key={marketCode}
                    className="inline-flex items-center px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
                  >
                    {market?.label}
                    <button
                      onClick={() => handleMarketToggle(marketCode, false)}
                      className="ml-2 hover:bg-primary/20 rounded-full p-1 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </OnboardingStepWrapper>
  )
}
