"use client"

import { useState, useEffect } from "react"
import { useUser, useClerk } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/layout/notification-toast"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Building2, User, ArrowRight, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type UserType = "agency" | "inhouse" | null

interface ValidationError {
  field: string
  message: string
}

// Form data validation function
const validateFormData = (formData: any, userType: UserType): ValidationError[] => {
  const errors: ValidationError[] = []
  
  // Required fields based on user type
  if (userType === 'agency') {
    if (!formData.agencyName?.trim()) {
      errors.push({ field: 'agencyName', message: 'Agency name is required' })
    }
    if (formData.agencyWebsite && formData.agencyWebsite.trim()) {
      const urlRegex = /^https?:\/\/(?:[-\w.])+(?:\.[a-zA-Z]{2,})+(?:\/.*)?$/
      if (!urlRegex.test(formData.agencyWebsite)) {
        errors.push({ field: 'agencyWebsite', message: 'Please enter a valid website URL (include http:// or https://)' })
      }
    }
  } else {
    if (!formData.brandName?.trim()) {
      errors.push({ field: 'brandName', message: 'Company name is required' })
    }
    if (formData.brandWebsite && formData.brandWebsite.trim()) {
      const urlRegex = /^https?:\/\/(?:[-\w.])+(?:\.[a-zA-Z]{2,})+(?:\/.*)?$/
      if (!urlRegex.test(formData.brandWebsite)) {
        errors.push({ field: 'brandWebsite', message: 'Please enter a valid website URL (include http:// or https://)' })
      }
    }
  }
  
  return errors
}

export default function CompanySetupPage() {
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn } = useUser()
  const { signOut: clerkSignOut } = useClerk()
  const [userType, setUserType] = useState<UserType>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const { addToast, ToastContainer } = useToast()
  const router = useRouter()
  // Defer creating the Supabase browser client until we're running in the browser
  // (avoid calling at module evaluation time which can run during prerender)
  // const supabase = getSupabaseClient()
  
  const [formData, setFormData] = useState({
    agencyName: "",
    agencyWebsite: "",
    brandName: "",
    brandWebsite: "",
    location: "za", // Default to South Africa
  })

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [showValidation, setShowValidation] = useState(false)

  // Check if user is authenticated via Clerk
  useEffect(() => {
    if (!isClerkLoaded) return;
    
    const checkAuth = async () => {
      const supabase = getSupabaseClient()
      if (!isSignedIn || !clerkUser) {
        router.push('/signin')
        return
      }
      setUser(clerkUser)

      // Check if user already has company setup
      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('owner_clerk_id', clerkUser.id)
        .single()

      if (account) {
        // User already has company setup, redirect to dashboard
        router.push('/dashboard')
      }
    }

    checkAuth()
  }, [router, supabase, isClerkLoaded, isSignedIn, clerkUser])

  // Helper function to get error message for a field
  const getFieldError = (fieldName: string): string | undefined => {
    return validationErrors.find(error => error.field === fieldName)?.message
  }

  // Helper function to get input className with validation styling
  const getInputClassName = (fieldName: string): string => {
    const hasError = showValidation && getFieldError(fieldName)
    return `h-11 border-2 transition-colors ${
      hasError 
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50/50' 
        : 'border-gray-300 focus:border-primary focus:ring-primary'
    }`
  }

  const locationOptions = [
    { value: "za", label: "🇿🇦 South Africa", region: "Africa" },
    { value: "ng", label: "🇳🇬 Nigeria", region: "Africa" },
    { value: "ke", label: "🇰🇪 Kenya", region: "Africa" },
    { value: "eg", label: "🇪🇬 Egypt", region: "Africa" },
    { value: "ma", label: "🇲🇦 Morocco", region: "Africa" },
    { value: "gh", label: "🇬🇭 Ghana", region: "Africa" },
    { value: "ae", label: "🇦🇪 UAE", region: "Middle East" },
    { value: "sa", label: "🇸🇦 Saudi Arabia", region: "Middle East" },
    { value: "il", label: "🇮🇱 Israel", region: "Middle East" },
    { value: "tr", label: "🇹🇷 Turkey", region: "Middle East" },
    { value: "qa", label: "🇶🇦 Qatar", region: "Middle East" },
    { value: "kw", label: "🇰🇼 Kuwait", region: "Middle East" },
    { value: "uk", label: "🇬🇧 United Kingdom", region: "Europe" },
    { value: "de", label: "🇩🇪 Germany", region: "Europe" },
    { value: "fr", label: "🇫🇷 France", region: "Europe" },
    { value: "es", label: "🇪🇸 Spain", region: "Europe" },
    { value: "it", label: "🇮🇹 Italy", region: "Europe" },
    { value: "nl", label: "🇳🇱 Netherlands", region: "Europe" },
    { value: "us", label: "🇺🇸 United States", region: "Americas" },
    { value: "ca", label: "🇨🇦 Canada", region: "Americas" },
    { value: "au", label: "🇦🇺 Australia", region: "Oceania" },
    { value: "jp", label: "🇯🇵 Japan", region: "Asia" },
    { value: "cn", label: "🇨🇳 China", region: "Asia" },
    { value: "in", label: "🇮🇳 India", region: "Asia" },
  ]

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type)
    addToast({
      type: "info",
      title: "Account Type Selected",
      message: `You've selected ${type === "agency" ? "Agency" : "In-house"} account type.`,
    })
  }

  const handleSignOut = async () => {
    await clerkSignOut()
    router.push('/signin')
  }

  const handleCompleteSetup = async () => {
    // Validate form data
    const errors = validateFormData(formData, userType)
    setValidationErrors(errors)
    setShowValidation(true)

    if (errors.length > 0) {
      const fieldNames = errors.map(error => {
        const fieldMap: Record<string, string> = {
          'agencyName': 'Agency name',
          'agencyWebsite': 'Agency website',
          'brandName': 'Company name',
          'brandWebsite': 'Company website'
        }
        return fieldMap[error.field] || error.field
      })
      
      addToast({ 
        type: "error", 
        title: "Please check these fields:", 
        message: fieldNames.join(', '),
        duration: 8000
      })
      return
    }

    setIsLoading(true)

    try {
      // Map form data to API schema
      const locationData = locationOptions.find(loc => loc.value === formData.location)
      const regionMapping: Record<string, string> = {
        'Africa': 'africa',
        'Middle East': 'middle_east', 
        'Europe': 'europe',
        'Americas': 'north_america',
        'Oceania': 'asia_pacific',
        'Asia': 'asia_pacific'
      }
      
      const setupData = {
        company_name: userType === "agency" ? formData.agencyName : formData.brandName,
        account_type: userType === "agency" ? "agency" : "in_house",
        brand_name: userType === "agency" ? formData.agencyName : formData.brandName,
        website: userType === "agency" ? formData.agencyWebsite : formData.brandWebsite,
        region: regionMapping[locationData?.region || 'Americas'] || 'africa',
        industry: 'other', // Default for now
        company_size: 'small', // Default for now
      }

      const response = await fetch('/api/onboarding/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(setupData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Setup failed')
      }

      addToast({
        type: "success",
        title: "Company Setup Complete!",
        message: "Your account has been successfully set up.",
      })
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard")
      }, 1000)

    } catch (error) {
      console.error('Setup error:', error)
      addToast({ 
        type: "error", 
        title: "Setup Failed", 
        message: error instanceof Error ? error.message : "An unexpected error occurred" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  }

  return (
    <div className="min-h-screen bg-background">
      <ToastContainer />
      
      {/* Navigation Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">S</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold tracking-tight text-foreground">Soma AI</span>
                  <span className="text-xs text-muted-foreground/80 font-medium tracking-wider">GEO PLATFORM</span>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground">
                Signed in as {user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {!userType ? (
            /* User Type Selection */
            <Card className="border-border">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Complete your setup</CardTitle>
                <CardDescription>Choose your account type to get started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <button
                  onClick={() => handleUserTypeSelect("agency")}
                  className="w-full p-6 border-2 border-border rounded-lg hover:border-primary transition-all duration-200 text-left group hover:shadow-md"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">Agency</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Manage AI visibility for multiple client brands
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Multiple workspaces</li>
                        <li>• Client management</li>
                        <li>• Multi-brand analytics</li>
                      </ul>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-black transition-colors" />
                  </div>
                </button>

                <button
                  onClick={() => handleUserTypeSelect("inhouse")}
                  className="w-full p-6 border-2 border-border rounded-lg hover:border-primary transition-all duration-200 text-left group hover:shadow-md"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <User className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">In-house</h3>
                      <p className="text-sm text-muted-foreground mb-2">For companies managing their own brand</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Single workspace</li>
                        <li>• Company analytics</li>
                        <li>• Brand optimization</li>
                      </ul>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-black transition-colors" />
                  </div>
                </button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">
                    {userType === "agency" ? "Set up your agency" : "Set up your company"}
                  </CardTitle>
                  <CardDescription>
                    {userType === "agency"
                      ? "Enter your agency details to get started"
                      : "Enter your company details to get started"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                {/* Validation Error Summary */}
                {showValidation && validationErrors.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <span className="text-red-500 mt-0.5">⚠</span>
                      <div>
                        <h4 className="font-medium text-red-800 mb-1">Please fix the following errors:</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          {validationErrors.map((error, index) => (
                            <li key={index}>• {error.message}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Form Fields */}
                <div className="grid grid-cols-1 gap-4">
                  {userType === "agency" ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="agencyName" className="text-sm font-medium">
                          Agency name *
                        </Label>
                        <Input
                          id="agencyName"
                          value={formData.agencyName}
                          onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                          placeholder="Your agency name"
                          className={getInputClassName('agencyName')}
                        />
                        {showValidation && getFieldError('agencyName') && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <span className="text-red-500">⚠</span>
                            {getFieldError('agencyName')}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="agencyWebsite" className="text-sm font-medium">
                          Agency website
                        </Label>
                        <Input
                          id="agencyWebsite"
                          value={formData.agencyWebsite}
                          onChange={(e) => setFormData({ ...formData, agencyWebsite: e.target.value })}
                          placeholder="https://youragency.com"
                          className={getInputClassName('agencyWebsite')}
                        />
                        {showValidation && getFieldError('agencyWebsite') && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <span className="text-red-500">⚠</span>
                            {getFieldError('agencyWebsite')}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="brandName" className="text-sm font-medium">
                          Company name *
                        </Label>
                        <Input
                          id="brandName"
                          value={formData.brandName}
                          onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                          placeholder="Your company name"
                          className={getInputClassName('brandName')}
                        />
                        {showValidation && getFieldError('brandName') && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <span className="text-red-500">⚠</span>
                            {getFieldError('brandName')}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="brandWebsite" className="text-sm font-medium">
                          Company website
                        </Label>
                        <Input
                          id="brandWebsite"
                          value={formData.brandWebsite}
                          onChange={(e) => setFormData({ ...formData, brandWebsite: e.target.value })}
                          placeholder="https://yourcompany.com"
                          className={getInputClassName('brandWebsite')}
                        />
                        {showValidation && getFieldError('brandWebsite') && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <span className="text-red-500">⚠</span>
                            {getFieldError('brandWebsite')}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Primary Market Location</Label>
                    <select
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground h-11"
                    >
                      {locationOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 pt-4">
                  <Button 
                    onClick={handleCompleteSetup} 
                    className="w-full h-11"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Setting up...
                      </>
                    ) : (
                      <>
                        Complete setup
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* What's Next Card */}
            <Card className="border-border bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">What's next?</CardTitle>
                <CardDescription>After completing your setup</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary text-sm font-medium">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">AI visibility scan</p>
                      <p className="text-xs text-muted-foreground">See how AI models currently know your brand</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary text-sm font-medium">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Dashboard access</p>
                      <p className="text-xs text-muted-foreground">Access your analytics and optimization tools</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary text-sm font-medium">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Start optimizing</p>
                      <p className="text-xs text-muted-foreground">Improve your AI presence with insights</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Quick start tip</h4>
                    <p className="text-sm text-blue-800">
                      After setup, we'll run an initial scan across 12+ AI models to show you exactly how your brand appears in AI responses.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}