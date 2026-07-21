# Onboarding Components

Modular onboarding wizard components for brand setup flow. Each step is a separate, reusable component.

## Components Overview

### Core Step Components

1. **UserTypeSelection** - Account type selection (agency vs in-house)
2. **OrganizationDetailsStep** - Organization/agency details
3. **BrandCompanyDetailsStep** - Client company details (agency only)
4. **BrandSetupStep** - Brand information and categories
5. **BusinessContextStep** - Products, markets, and competitors

### Utility Components

- **OnboardingStepWrapper** - Consistent layout wrapper with navigation
- **ValidationErrorSummary** - Error summary box
- **FieldError** - Inline field errors

## Usage Example

```tsx
import { 
  UserTypeSelection,
  OrganizationDetailsStep,
  BrandSetupStep,
  type BrandFormData,
  type ValidationError
} from '@/components/auth/onboarding'

function OnboardingFlow() {
  const [formData, setFormData] = useState<BrandFormData>({...})
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [step, setStep] = useState<Step>("user-type")
  const [userType, setUserType] = useState<UserType>(null)
  
  return (
    <>
      {step === "user-type" && (
        <UserTypeSelection onSelect={(type) => {
          setUserType(type)
          setStep("organization-details")
        }} />
      )}
      
      {step === "organization-details" && (
        <OrganizationDetailsStep
          formData={formData}
          onFormDataChange={setFormData}
          onNext={() => setStep("brand-setup")}
          onBack={() => setStep("user-type")}
          validationErrors={validationErrors}
          showValidation={true}
          userType={userType}
          countryOptions={countries}
        />
      )}
      
      {/* Additional steps... */}
    </>
  )
}
```

## Component Props

### OnboardingStepProps

All step components (except UserTypeSelection) share this interface:

```typescript
interface OnboardingStepProps {
  formData: BrandFormData
  onFormDataChange: (data: BrandFormData) => void
  onNext: () => void
  onBack?: () => void
  validationErrors?: ValidationError[]
  showValidation?: boolean
  isFormLocked?: boolean
  userType?: UserType
  countryOptions?: Array<{ value: string; label: string; region?: string }>
}
```

### UserTypeSelection Props

```typescript
interface UserTypeSelectionProps {
  onSelect: (type: UserType) => void
}
```

## Step Flow

### Standard Flow (In-house)
1. user-type → agency/in-house selection
2. organization-details → company info
3. brand-setup → brand details
4. business-context → products, markets, competitors
5. prompts → AI prompt generation (TODO)
6. progress → run progress (TODO)
7. ai-report → brand audit report (TODO)

### Agency Flow
Same as standard, but adds **brand-company-details** between steps 2 and 3 to collect client company information.

## Form Validation

Each step has its own validation rules:

### organization-details
- `organizationName` - Required
- `organizationWebsite` - Optional, must be valid URL if provided

### brand-company-details
- `brandCompanyName` - Required
- `brandCompanyWebsite` - Optional, must be valid URL if provided

### brand-setup
- `brandName` - Required
- `brandCategories` - At least one category required
- `brandWebsite` - Optional, must be valid URL if provided

### business-context
- `productsServices` - Required
- `targetMarkets` - At least one market required
- `knownCompetitors` - Optional

## Types

### BrandFormData
Complete form data structure with 20+ fields. See `types.ts` for full definition.

### ValidationError
```typescript
interface ValidationError {
  field: string
  message: string
}
```

### UserType
```typescript
type UserType = "agency" | "inhouse" | null
```

### Step
```typescript
type Step = 
  | "user-type" 
  | "organization-details" 
  | "brand-company-details" 
  | "brand-setup" 
  | "business-context" 
  | "prompts" 
  | "progress" 
  | "ai-report" 
  | "results"
```

## Constants

### BRAND_CATEGORIES
43 predefined brand categories organized by industry type:
- Technology
- Finance & Professional Services
- Retail & E-commerce
- Services
- Lifestyle
- Specialized sectors

### COUNTRY_NAME_MAP
21 African and regional countries with ISO codes.

## Styling

All components use:
- **Tailwind CSS** for styling
- **OnboardingInput/Select/Textarea** from `@/components/ui/onboarding-form-fields`
- **Radix UI Label** component
- **Lucide icons** for visual elements

## Remaining Steps (Use Existing Components)

The following steps use existing complex components and should remain in the main onboarding page:

- **Prompts Step** - Uses complex state management for AI prompt generation, testing, and custom prompt addition. Includes API calls to `/api/openrouter/enhance-prompt` and prompt testing logic
- **Progress Step** - Uses `<InlineAIProgress />` component for real-time run tracking
- **AI Report Step** - Uses `<OnboardingReportPreview />` component to display brand visibility audit results

These steps are tightly integrated with the run engine and report generation system, so they should remain in `/app/onboarding/page.tsx` rather than being extracted to separate components.

## File Structure

```
components/auth/onboarding/
├── index.ts                           # Exports
├── types.ts                           # TypeScript types
├── constants.ts                       # Brand categories, countries
├── validation-errors.tsx              # Error display components
├── onboarding-step-wrapper.tsx        # Layout wrapper
├── user-type-selection.tsx            # Step 1: Account type
├── organization-details-step.tsx      # Step 2: Organization
├── brand-company-details-step.tsx     # Step 3: Client company (agency)
├── brand-setup-step.tsx               # Step 3/4: Brand details
├── business-context-step.tsx          # Step 4/5: Business info
└── README.md                          # This file
```

## Integration Notes

1. **State Management**: Parent component manages all state (formData, step, userType)
2. **Validation**: Call validation function before advancing steps
3. **Navigation**: Each step handles onNext/onBack callbacks
4. **Conditional Rendering**: Check userType to show/hide agency-specific steps
5. **Country Data**: Pass countryOptions from `useCountries()` hook or custom source

## Design Patterns

- **Controlled Components**: All form inputs are controlled by parent state
- **Composition**: Small, focused components composed together
- **Type Safety**: Full TypeScript coverage with shared interfaces
- **Consistent UX**: OnboardingStepWrapper provides uniform layout
- **Error Handling**: Validation displayed inline and in summary box
