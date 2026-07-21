"use client"

import { Building2, User, ArrowRight } from "lucide-react"
import type { UserType } from './types'

interface UserTypeSelectionProps {
  onSelect: (type: UserType) => void
  agencyEnabled?: boolean
}

/**
 * UserTypeSelection Component
 * 
 * First step in onboarding - allows user to choose between agency or in-house account type.
 * Features:
 * - Two-column card layout (In-house left, Agency right)
 * - Feature lists for each type
 * - Hover effects and transitions
 * - Responsive design
 * - Agency card can be hidden via agencyEnabled prop
 */
export function UserTypeSelection({ onSelect, agencyEnabled = true }: UserTypeSelectionProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-6 text-foreground">
          How will you use Soma AI?
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          We&apos;ll tailor your setup so AI search engines start recommending your brand
        </p>
      </div>
      
      <div className={`grid grid-cols-1 ${agencyEnabled ? 'lg:grid-cols-2' : ''} gap-12 ${!agencyEnabled ? 'max-w-xl mx-auto' : ''}`}>
        {/* In-house Option */}
        <button
          onClick={() => onSelect("inhouse")}
          className="group bg-background border-2 border-border rounded-3xl p-12 hover:border-primary transition-all duration-200 text-left h-full"
        >
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-8">
            <User className="h-10 w-10 text-primary-foreground" />
          </div>
          <h3 className="text-3xl font-bold text-foreground mb-4">
            In-house
          </h3>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Monitor and improve how AI recommends your brand
          </p>
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0" />
              <span className="text-foreground font-medium text-lg">See if ChatGPT, Gemini & Claude recommend you</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0" />
              <span className="text-foreground font-medium text-lg">Track your position vs competitors</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0" />
              <span className="text-foreground font-medium text-lg">Get specific actions to improve rankings</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0" />
              <span className="text-foreground font-medium text-lg">Measure ROI over time</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-primary font-bold text-lg">I&apos;m monitoring my own brand</span>
            <ArrowRight className="h-8 w-8 text-primary group-hover:translate-x-2 transition-transform" />
          </div>
        </button>

        {/* Agency Option */}
        {agencyEnabled && (
        <button
          onClick={() => onSelect("agency")}
          className="group bg-background border-2 border-border rounded-3xl p-12 hover:border-primary transition-all duration-200 text-left h-full"
        >
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-8">
            <Building2 className="h-10 w-10 text-primary-foreground" />
          </div>
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Agency
          </h3>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Manage AI visibility for multiple client brands
          </p>
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0" />
              <span className="text-foreground font-medium text-lg">Separate workspaces per client</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0" />
              <span className="text-foreground font-medium text-lg">White-label reports clients love</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0" />
              <span className="text-foreground font-medium text-lg">Show clients real AI ranking improvements</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0" />
              <span className="text-foreground font-medium text-lg">New revenue stream: GEO as a service</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-primary font-bold text-lg">I manage brands for clients</span>
            <ArrowRight className="h-8 w-8 text-primary group-hover:translate-x-2 transition-transform" />
          </div>
        </button>
        )}
      </div>
    </div>
  )
}
