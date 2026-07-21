"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Label } from "@/components/ui/label"
import { OnboardingInput } from "@/components/ui/onboarding-form-fields"
import { OnboardingStepWrapper } from './onboarding-step-wrapper'
import { FieldError } from './validation-errors'
import { BRAND_CATEGORIES } from './constants'
import type { OnboardingStepProps } from './types'
import { Search, X, Building2, Package, Briefcase, User, Building, Landmark, Megaphone, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ENTITY_TYPE_OPTIONS } from '@/lib/utils/entity-language'

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

/**
 * BrandSetupStep Component
 * 
 * Step 3/4 of onboarding: Set up brand details
 * 
 * Features:
 * - Brand name (required)
 * - Searchable multi-select brand categories with checkboxes
 * - Website URL (optional with validation)
 * - Category badges display
 * - Grouped categories by industry
 * - Field-level error display
 */
export function BrandSetupStep({
  formData,
  onFormDataChange,
  onNext,
  onBack,
  validationErrors = [],
  showValidation = false,
  isFormLocked = false,
  userType
}: OnboardingStepProps) {
  const [searchQuery, setSearchQuery] = useState<string | null>(null)
  const [customCategory, setCustomCategory] = useState("")
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [isAddingCustom, setIsAddingCustom] = useState(false)
  const [isClosingDropdown, setIsClosingDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const getFieldError = (field: string) => {
    return validationErrors.find(e => e.field === field)?.message
  }

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSearchQuery(null)
        setShowCustomInput(false)
        setCustomCategory("")
      }
    }

    if (searchQuery !== null) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [searchQuery])

  const handleCategoryToggle = (categoryValue: string, checked: boolean) => {
    let newCategories: string[]
    if (checked) {
      newCategories = [...(formData.brandCategories || []), categoryValue]
    } else {
      newCategories = (formData.brandCategories || []).filter(c => c !== categoryValue)
    }
    onFormDataChange({ 
      ...formData, 
      brandCategories: newCategories,
      brandCategory: newCategories[0] || '' // Set primary category for backward compatibility
    })
  }

  const removeCategory = (categoryValue: string) => {
    const newCategories = (formData.brandCategories || []).filter(c => c !== categoryValue)
    onFormDataChange({ 
      ...formData, 
      brandCategories: newCategories,
      brandCategory: newCategories[0] || ''
    })
  }

  const handleAddCustomCategory = () => {
    const value = customCategory.trim()
    if (value) {
      setIsAddingCustom(true)
      setTimeout(() => {
        // Check if it's already in the list (case-insensitive)
        const existingCategories = formData.brandCategories || []
        const alreadyExists = existingCategories.some(cat => 
          cat.toLowerCase() === value.toLowerCase()
        )
        
        if (!alreadyExists) {
          const newCategories = [...existingCategories, value]
          onFormDataChange({ 
            ...formData, 
            brandCategories: newCategories,
            brandCategory: newCategories[0] || ''
          })
        }
        setCustomCategory("")
        setShowCustomInput(false)
        setIsAddingCustom(false)
      }, 200)
    }
  }

  // Filter and group categories
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
      // Try to find in predefined categories
      const predefined = BRAND_CATEGORIES.find(cat => cat.value === categoryValue)
      if (predefined) {
        return { value: predefined.value, label: predefined.label }
      }
      // If not found, it's a custom category
      return { value: categoryValue, label: categoryValue }
    })
  }, [formData.brandCategories])

  return (
    <OnboardingStepWrapper
      title="Your brand"
      subtitle={userType === "agency" 
        ? "The brand you'll track across AI search engines like ChatGPT, Claude, and Gemini"
        : "This is the brand AI search engines will learn to recommend"
      }
      onBack={onBack}
      onNext={onNext}
      backLabel="Back"
      nextLabel="Continue"
      validationErrors={validationErrors}
      showValidation={showValidation}
      isFormLocked={isFormLocked}
    >
      <div className="space-y-3">
        <Label htmlFor="brandName" className="text-lg font-bold text-foreground">
          Brand name *
        </Label>
        <OnboardingInput
          id="brandName"
          value={formData.brandName}
          onChange={(e) => onFormDataChange({ ...formData, brandName: e.target.value })}
          placeholder={userType === "agency" ? "Your client's brand name" : "Your brand name"}
          hasError={showValidation && !!getFieldError('brandName')}
          disabled={isFormLocked}
        />
        <FieldError error={getFieldError('brandName')} show={showValidation} />
      </div>

      {/* Entity Type Selector */}
      <div className="space-y-3">
        <Label className="text-lg font-bold text-foreground">
          What is {formData.brandName || 'this'}?
        </Label>
        <p className="text-sm text-muted-foreground -mt-1">
          AI models describe companies, products, and people differently. This helps us frame the analysis correctly.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ENTITY_TYPE_OPTIONS.map((option) => {
            const IconComponent = ENTITY_ICONS[option.value] || Building2
            const isSelected = formData.entityType === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onFormDataChange({ ...formData, entityType: option.value })}
                disabled={isFormLocked}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  isSelected 
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                    : 'border-border hover:border-primary/50 bg-background'
                } ${isFormLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <IconComponent className={`h-6 w-6 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium text-center ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {option.label}
                </span>
              </button>
            )
          })}
        </div>
        <FieldError error={getFieldError('entityType')} show={showValidation} />
      </div>

      <div className="space-y-3">
        <Label htmlFor="brandDescription" className="text-lg font-bold text-foreground">
          What does {formData.brandName || 'the brand'} do?
        </Label>
        <textarea
          id="brandDescription"
          value={formData.brandDescription || ''}
          onChange={(e) => onFormDataChange({ ...formData, brandDescription: e.target.value })}
          placeholder="e.g., We help mid-market SaaS companies rank in AI search results like ChatGPT, Claude, and Gemini through content optimization and structured data."
          disabled={isFormLocked}
          rows={3}
          className="w-full px-4 py-3 border-2 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-colors bg-background text-foreground placeholder:text-muted-foreground"
        />
        <p className="text-sm text-muted-foreground">
          A sentence or two is enough. The more specific you are about who you serve and what makes you different, the better prompts we generate.
        </p>
      </div>
      
      <div className="space-y-3">
        <Label htmlFor="brandCategories" className="text-lg font-bold text-foreground">
          Industry / category *
        </Label>

        {/* Selected Categories Pills - Matching Competitor Style */}
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((category) => (
              <span
                key={category.value}
                className="inline-flex items-center px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
              >
                {category.label}
                <button
                  type="button"
                  onClick={() => removeCategory(category.value)}
                  disabled={isFormLocked}
                  className="ml-2 hover:bg-primary/20 rounded-full p-1 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Dropdown Button */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => !isFormLocked && setSearchQuery(prev => prev === null ? "" : null)}
            disabled={isFormLocked}
            className="w-full flex items-center justify-between px-4 py-3 border-2 rounded-xl hover:border-primary/50 transition-colors text-left bg-background"
          >
            <span className="text-base font-medium">
              {selectedCategories.length === 0 
                ? "Search or browse categories..." 
                : `${selectedCategories.length} categor${selectedCategories.length > 1 ? 'ies' : 'y'} selected`
              }
            </span>
            <svg 
              className={`h-5 w-5 transition-transform ${searchQuery !== null ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Panel with Search and Grouped Categories */}
          {searchQuery !== null && !isFormLocked && (
            <div className="absolute z-50 w-full mt-2 border-2 rounded-xl shadow-lg overflow-hidden bg-background">
              {/* Search Input */}
              <div className="p-4 border-b bg-muted/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery || ""}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
            </div>

            {/* No results message */}
            {!hasSearchResults && searchQuery && searchQuery.trim().length > 0 && (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  No match found
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCustomCategory(searchQuery)
                    setShowCustomInput(true)
                  }}
                  className="text-primary hover:underline text-sm font-medium"
                >
                  + Add "{searchQuery}"
                </button>
              </div>
            )}

            {/* Grouped Categories - Collapsible */}
            <div className="max-h-96 overflow-y-auto">
              {Object.entries(filteredAndGroupedCategories).map(([group, categories]) => (
                <details key={group} className="border-b last:border-b-0" open={(searchQuery || "").length > 0}>
                  <summary className="sticky top-0 bg-background px-4 py-3 font-semibold text-sm cursor-pointer hover:bg-muted/50 flex items-center justify-between">
                    <span>{group}</span>
                    <span className="text-xs text-muted-foreground">
                      {categories.filter(c => (formData.brandCategories || []).includes(c.value)).length}/{categories.length}
                    </span>
                  </summary>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2 bg-muted/10">
                    {categories.map((category) => {
                      const isOther = category.value === "other"
                      return (
                        <div key={category.value}>
                          <label 
                            className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={(formData.brandCategories || []).includes(category.value)}
                              onChange={(e) => {
                                handleCategoryToggle(category.value, e.target.checked)
                                if (isOther && e.target.checked) {
                                  setShowCustomInput(true)
                                }
                              }}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm">{category.label}</span>
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </details>
              ))}
            </div>

            {/* Custom category input */}
            {showCustomInput && (
              <div className="p-3 border-t bg-muted/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddCustomCategory()
                      } else if (e.key === 'Escape') {
                        setShowCustomInput(false)
                        setCustomCategory("")
                      }
                    }}
                    placeholder="Enter custom category..."
                    autoFocus
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCategory}
                    disabled={!customCategory.trim() || isAddingCustom}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isAddingCustom ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1.5 inline-block"></div>
                        Adding...
                      </>
                    ) : (
                      'Add'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomInput(false)
                      setCustomCategory("")
                    }}
                    className="px-3 py-2 border rounded-lg hover:bg-muted text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="p-3 border-t bg-muted/30">
              <button
                type="button"
                onClick={() => {
                  setIsClosingDropdown(true)
                  setTimeout(() => {
                    setSearchQuery(null)
                    setIsClosingDropdown(false)
                  }, 150)
                }}
                disabled={isClosingDropdown}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isClosingDropdown ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1.5 inline-block"></div>
                    Saving...
                  </>
                ) : (
                  'Done'
                )}
              </button>
            </div>
            </div>
          )}
        </div>

        <FieldError error={getFieldError('brandCategories')} show={showValidation} />
      </div>
      
      <div className="space-y-3">
        <Label htmlFor="brandWebsite" className="text-lg font-bold text-foreground">
          Website (optional)
        </Label>
        <OnboardingInput
          id="brandWebsite"
          value={formData.brandWebsite}
          onChange={(e) => onFormDataChange({ ...formData, brandWebsite: e.target.value })}
          placeholder={userType === "agency" ? "https://clientbrand.com" : "https://yourbrand.com"}
          hasError={showValidation && !!getFieldError('brandWebsite')}
          disabled={isFormLocked}
        />
        <FieldError error={getFieldError('brandWebsite')} show={showValidation} />
      </div>
    </OnboardingStepWrapper>
  )
}
