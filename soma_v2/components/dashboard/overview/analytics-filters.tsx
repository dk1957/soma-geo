"use client"

import { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Calendar as CalendarIcon, Check, ChevronRight, Sparkles, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { NextQueryCountdown } from "@/components/next-query-countdown"
import Image from "next/image"

interface DateRange {
  from: string | undefined
  to: string | undefined
}

export interface FilterOptions {
  dateRange: DateRange
  promptType: 'all' | 'branded' | 'discovery'
  aiPlatforms: string[]
  competitorBenchmark: boolean
  selectedCompetitors: string[]
  geography?: string[]
  selectedModel?: string
}

interface MockCompetitor {
  id: string
  name: string
  color: string
}

interface AvailableModel {
  value: string
  label: string
}

interface AnalyticsFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  availableCompetitors: MockCompetitor[]
  availableModels?: AvailableModel[]
}

// Get model icon path
const getModelImage = (modelName: string): string => {
  const lower = modelName.toLowerCase()
  if (lower.includes('gpt') || lower.includes('openai') || lower.includes('chatgpt')) return '/models/chatgpt-logo.png'
  if (lower.includes('claude') || lower.includes('anthropic')) return '/models/claude-logo.png'
  if (lower.includes('gemini') || lower.includes('google')) return '/models/gemini-logo.png'
  if (lower.includes('grok') || lower.includes('xai')) return '/models/grok-logo.png'
  if (lower.includes('perplexity') || lower.includes('sonar')) return '/models/perplexity-logo.png'
  if (lower.includes('llama') || lower.includes('meta')) return '/models/meta-logo.svg'
  return '/models/chatgpt-logo.png'
}

// Calculate days from date range
const getDateRangeDays = (from: string | undefined, to: string | undefined): number | null => {
  if (!from || !to) return null
  const fromDate = new Date(from)
  const toDate = new Date(to)
  return Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
}

// Date presets configuration
const DATE_PRESETS = [
  { days: 365, label: 'All', fullLabel: 'All time' },
  { days: 7, label: '7D', fullLabel: 'Last 7 days' },
  { days: 30, label: '30D', fullLabel: 'Last 30 days' },
  { days: 90, label: '90D', fullLabel: 'Last 90 days' },
]

export function AnalyticsFilters({ 
  filters, 
  onFiltersChange, 
  availableCompetitors, 
  availableModels = [] 
}: AnalyticsFiltersProps) {
  const [datePopoverOpen, setDatePopoverOpen] = useState(false)
  
  // Only show models from actual analysis data
  const aiPlatformOptions = availableModels.length > 0 
    ? availableModels.map(m => ({ value: m.value, label: m.label }))
    : []

  const updateFilters = (updates: Partial<FilterOptions>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const handleDatePreset = (days: number) => {
    const to = new Date().toLocaleDateString('en-CA') // local timezone YYYY-MM-DD
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA')
    updateFilters({ dateRange: { from, to } })
  }
  
  // Check if a preset is active
  const activePreset = useMemo(() => {
    const days = getDateRangeDays(filters.dateRange.from, filters.dateRange.to)
    return DATE_PRESETS.find(p => p.days === days) || null
  }, [filters.dateRange])
  
  // Get formatted date range display
  const getDateDisplay = () => {
    if (activePreset) return activePreset.fullLabel
    if (filters.dateRange.from && filters.dateRange.to) {
      const from = new Date(filters.dateRange.from)
      const to = new Date(filters.dateRange.to)
      return `${from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${to.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    }
    return 'All time'
  }
  
  // Check if any filters are active
  const hasActiveFilters = filters.selectedCompetitors.length > 0 || 
    (filters.aiPlatforms && filters.aiPlatforms.length > 0)
  
  // Get total active filter count
  const activeFilterCount = filters.selectedCompetitors.length + 
    (filters.aiPlatforms?.length || 0)

  const resetAllFilters = () => {
    updateFilters({ 
      selectedCompetitors: [], 
      competitorBenchmark: false,
      aiPlatforms: []
    })
  }

  return (
    <TooltipProvider>
      <div className="w-full">
        {/* Main Filter Bar */}
        <div className="flex items-center gap-2 p-1.5 bg-gray-50/80 rounded-xl border border-gray-200/60">
          
          {/* Date Range - Inline Pills + Custom */}
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1 gap-1">
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.days}
                onClick={() => handleDatePreset(preset.days)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200",
                  activePreset?.days === preset.days
                    ? "bg-black text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                {preset.label}
              </button>
            ))}
            
            {/* Custom Date Picker */}
            <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                    !activePreset && filters.dateRange.from
                      ? "bg-black text-white shadow-sm"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  )}
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {!activePreset && filters.dateRange.from ? (
                    <span className="hidden sm:inline">{getDateDisplay()}</span>
                  ) : (
                    <span className="hidden sm:inline">Custom</span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
                <div className="p-3 pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900">Select date range</h4>
                    {filters.dateRange.from && (
                      <button
                        onClick={() => {
                          handleDatePreset(30)
                          setDatePopoverOpen(false)
                        }}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-black transition-colors"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Reset
                      </button>
                    )}
                  </div>
                  {/* Selected range display */}
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span className={cn(
                      "px-2 py-1 rounded-md border",
                      filters.dateRange.from ? "bg-gray-50 border-gray-200 text-gray-900 font-medium" : "border-dashed border-gray-300 text-gray-400"
                    )}>
                      {filters.dateRange.from ? format(new Date(filters.dateRange.from), 'MMM d, yyyy') : 'Start date'}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className={cn(
                      "px-2 py-1 rounded-md border",
                      filters.dateRange.to ? "bg-gray-50 border-gray-200 text-gray-900 font-medium" : "border-dashed border-gray-300 text-gray-400"
                    )}>
                      {filters.dateRange.to ? format(new Date(filters.dateRange.to), 'MMM d, yyyy') : 'End date'}
                    </span>
                  </div>
                </div>
                <Calendar
                  mode="range"
                  selected={{
                    from: filters.dateRange.from ? new Date(filters.dateRange.from) : undefined,
                    to: filters.dateRange.to ? new Date(filters.dateRange.to) : undefined,
                  }}
                  onSelect={(range: DateRange | undefined) => {
                    updateFilters({
                      dateRange: {
                        from: range?.from ? range.from.toISOString().split('T')[0] : undefined,
                        to: range?.to ? range.to.toISOString().split('T')[0] : undefined,
                      }
                    })
                  }}
                  numberOfMonths={2}
                  disabled={{ after: new Date() }}
                  defaultMonth={filters.dateRange.from ? new Date(filters.dateRange.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
                />
                <div className="p-3 pt-0 flex gap-2">
                  <Button 
                    variant="outline"
                    size="sm" 
                    className="flex-1 rounded-lg text-xs"
                    onClick={() => setDatePopoverOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 bg-black hover:bg-gray-800 text-white rounded-lg text-xs"
                    onClick={() => setDatePopoverOpen(false)}
                    disabled={!filters.dateRange.from || !filters.dateRange.to}
                  >
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Separator */}
          <div className="h-6 w-px bg-gray-300/60" />

          {/* AI Models Filter - Inline with icons */}
          {aiPlatformOptions.length > 0 && (
            <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1 gap-0.5">
              <span className="px-2 text-xs font-medium text-gray-500 hidden lg:block">Models:</span>
              {aiPlatformOptions.map((model) => {
                const isSelected = filters.aiPlatforms?.includes(model.value)
                return (
                  <Tooltip key={model.value}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          const current = filters.aiPlatforms || []
                          const newSelected = isSelected
                            ? current.filter(p => p !== model.value)
                            : [...current, model.value]
                          updateFilters({ aiPlatforms: newSelected })
                        }}
                        className={cn(
                          "relative p-1.5 rounded-md transition-all duration-200",
                          isSelected 
                            ? "bg-black ring-2 ring-black ring-offset-1" 
                            : "hover:bg-gray-100 opacity-50 hover:opacity-100"
                        )}
                      >
                        <div className="relative h-5 w-5">
                          <Image
                            src={getModelImage(model.value)}
                            alt={model.label}
                            fill
                            className={cn(
                              "object-contain rounded transition-all",
                              isSelected ? "brightness-0 invert" : ""
                            )}
                          />
                        </div>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                            <Check className="h-2 w-2 text-white" />
                          </div>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {model.label}
                      {isSelected && <span className="ml-1 text-green-400">✓</span>}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
              {filters.aiPlatforms && filters.aiPlatforms.length > 0 && (
                <button
                  onClick={() => updateFilters({ aiPlatforms: [] })}
                  className="ml-1 p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {/* Competitors Filter */}
          {availableCompetitors.length > 0 && (
            <>
              <div className="h-6 w-px bg-gray-300/60" />
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs font-medium transition-all duration-200",
                      filters.selectedCompetitors.length > 0
                        ? "border-black bg-gray-50"
                        : "hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    {/* Stacked competitor avatars */}
                    {filters.selectedCompetitors.length > 0 ? (
                      <div className="flex items-center -space-x-1.5">
                        {filters.selectedCompetitors.slice(0, 3).map((name, idx) => {
                          const competitor = availableCompetitors.find(c => c.name === name)
                          return (
                            <div
                              key={name}
                              className="h-5 w-5 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white"
                              style={{ backgroundColor: competitor?.color || '#6B7280' }}
                            >
                              {name.charAt(0)}
                            </div>
                          )
                        })}
                        {filters.selectedCompetitors.length > 3 && (
                          <div className="h-5 w-5 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-[8px] font-bold text-gray-600">
                            +{filters.selectedCompetitors.length - 3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-600">Competitors</span>
                    )}
                    {filters.selectedCompetitors.length > 0 && (
                      <Badge className="h-4 px-1 text-[10px] bg-black text-white rounded">
                        {filters.selectedCompetitors.length}
                      </Badge>
                    )}
                    <ChevronRight className={cn(
                      "h-3 w-3 text-gray-400 transition-transform",
                      filters.selectedCompetitors.length > 0 && "rotate-90"
                    )} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start" sideOffset={8}>
                  <div className="p-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-900">Compare with</h4>
                      {filters.selectedCompetitors.length > 0 && (
                        <button
                          onClick={() => updateFilters({ selectedCompetitors: [], competitorBenchmark: false })}
                          className="text-xs text-gray-500 hover:text-black font-medium"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Select competitors to benchmark against</p>
                  </div>
                  <div className="p-2 max-h-[280px] overflow-y-auto">
                    {availableCompetitors.map((competitor) => {
                      const isSelected = filters.selectedCompetitors.includes(competitor.name)
                      return (
                        <div
                          key={competitor.id}
                          onClick={() => {
                            const newSelected = isSelected
                              ? filters.selectedCompetitors.filter(c => c !== competitor.name)
                              : [...filters.selectedCompetitors, competitor.name]
                            updateFilters({ 
                              selectedCompetitors: newSelected,
                              competitorBenchmark: newSelected.length > 0
                            })
                          }}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150",
                            isSelected 
                              ? "bg-gray-100" 
                              : "hover:bg-gray-50"
                          )}
                        >
                          <div
                            className={cn(
                              "h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold text-white transition-transform",
                              isSelected && "scale-110"
                            )}
                            style={{ backgroundColor: competitor.color }}
                          >
                            {competitor.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{competitor.name}</p>
                          </div>
                          <div className={cn(
                            "flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all",
                            isSelected 
                              ? "bg-black border-black text-white" 
                              : "border-gray-300"
                          )}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Active Filters Summary & Reset */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/5 rounded-lg">
                <Sparkles className="h-3 w-3 text-black/60" />
                <span className="text-xs font-medium text-black/70">{activeFilterCount} filters</span>
              </div>
              <button
                onClick={resetAllFilters}
                className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          )}

          {/* Next Query Countdown */}
          <div className="hidden md:block">
            <NextQueryCountdown label="" className="border-none shadow-none bg-transparent p-0 text-xs" />
          </div>
        </div>

        {/* Active Filters Pills - Shows selected items for quick removal */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {filters.aiPlatforms && filters.aiPlatforms.map(platform => {
              const model = aiPlatformOptions.find(m => m.value === platform)
              return (
                <button
                  key={platform}
                  onClick={() => {
                    const newSelected = filters.aiPlatforms?.filter(p => p !== platform) || []
                    updateFilters({ aiPlatforms: newSelected })
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all group"
                >
                  <div className="relative h-3.5 w-3.5">
                    <Image
                      src={getModelImage(platform)}
                      alt={model?.label || platform}
                      fill
                      className="object-contain rounded"
                    />
                  </div>
                  <span>{model?.label || platform}</span>
                  <span className="text-gray-400 group-hover:text-gray-600">×</span>
                </button>
              )
            })}
            {filters.selectedCompetitors.map(name => {
              const competitor = availableCompetitors.find(c => c.name === name)
              return (
                <button
                  key={name}
                  onClick={() => {
                    const newSelected = filters.selectedCompetitors.filter(c => c !== name)
                    updateFilters({ selectedCompetitors: newSelected, competitorBenchmark: newSelected.length > 0 })
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all group"
                >
                  <div
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: competitor?.color || '#6B7280' }}
                  />
                  <span>{name}</span>
                  <span className="text-gray-400 group-hover:text-gray-600">×</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
