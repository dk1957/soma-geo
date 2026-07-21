"use client"

import { useState, useEffect } from "react"
import { Save, Loader2, RefreshCw, Info, Zap, Clock, DollarSign, AlertTriangle, RotateCcw, Gauge, Timer, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/layout/notification-toast"

interface RunSettings {
  concurrency_limit: number
  timeout_ms: number
  max_retries: number
  retry_delay_ms: number
  default_temperature: number
  default_max_tokens: number
  fallback_enabled: boolean
  rate_limit_enabled: boolean
  requests_per_minute: number
  max_cost_per_run: number
  daily_cost_limit: number
  auto_analysis_enabled: boolean
  longitudinal_analysis_enabled: boolean
  deduplication_window_hours: number
  force_rerun_allowed: boolean
}

const DEFAULT_SETTINGS: RunSettings = {
  concurrency_limit: 6,
  timeout_ms: 120000,
  max_retries: 2,
  retry_delay_ms: 1000,
  default_temperature: 0.2,
  default_max_tokens: 2000,
  fallback_enabled: false,
  rate_limit_enabled: true,
  requests_per_minute: 60,
  max_cost_per_run: 1.0,
  daily_cost_limit: 50.0,
  auto_analysis_enabled: true,
  longitudinal_analysis_enabled: true,
  deduplication_window_hours: 24,
  force_rerun_allowed: true
}

export function RunSettingsManager() {
  const { addToast } = useToast()
  const [settings, setSettings] = useState<RunSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/config/run')
      const result = await response.json()
      if (result.success && result.data) {
        setSettings({ ...DEFAULT_SETTINGS, ...result.data })
      }
    } catch (error) {
      console.error('Error loading run settings:', error)
      addToast({ type: "warning", title: "Using Defaults", message: "Could not load saved settings, using defaults" })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/config/run', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      const result = await response.json()
      if (result.success) {
        addToast({ type: "success", title: "Saved", message: "Run settings updated successfully" })
        setHasChanges(false)
      } else {
        addToast({ type: "error", title: "Error", message: result.error || "Failed to save settings" })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      addToast({ type: "error", title: "Error", message: "Failed to save settings" })
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = <K extends keyof RunSettings>(key: K, value: RunSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS)
    setHasChanges(true)
    addToast({ type: "info", title: "Reset", message: "Settings reset to defaults. Click Save to apply." })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Pipeline Context ── */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-zinc-900 p-2 shrink-0">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-zinc-900 text-sm">How this works</h3>
            <p className="text-sm text-zinc-500 mt-1">
              Every day, Soma runs AI simulations for each brand — sending prompts to LLM models and analyzing responses.
              These settings control <strong>how fast</strong>, <strong>how many</strong>, and <strong>how much</strong> those simulations can cost.
            </p>
            <div className="flex items-center gap-2 mt-3 text-xs text-zinc-400 flex-wrap">
              <span className="inline-flex items-center rounded-full bg-white border px-2 py-0.5 text-zinc-600">System & User Prompts</span>
              <span>→</span>
              <span className="inline-flex items-center rounded-full bg-white border px-2 py-0.5 text-zinc-600">LLM Models</span>
              <span>→</span>
              <span className="inline-flex items-center rounded-full bg-zinc-900 text-white px-2 py-0.5 font-medium">Execution Engine ← you are here</span>
              <span>→</span>
              <span className="inline-flex items-center rounded-full bg-white border px-2 py-0.5 text-zinc-600">Analysis</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── At-a-Glance Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard icon={<Gauge className="h-4 w-4" />} label="Concurrency" value={`${settings.concurrency_limit} parallel`} bg="bg-amber-50" fg="text-amber-600" />
        <StatCard icon={<Timer className="h-4 w-4" />} label="Timeout" value={`${settings.timeout_ms / 1000}s`} bg="bg-blue-50" fg="text-blue-600" />
        <StatCard icon={<Clock className="h-4 w-4" />} label="Rate Limit" value={settings.rate_limit_enabled ? `${settings.requests_per_minute} rpm` : 'Off'} bg="bg-purple-50" fg="text-purple-600" />
        <StatCard icon={<DollarSign className="h-4 w-4" />} label="Per-Run Cap" value={`$${settings.max_cost_per_run}`} bg="bg-green-50" fg="text-green-600" />
        <StatCard icon={<ShieldCheck className="h-4 w-4" />} label="Daily Cap" value={`$${settings.daily_cost_limit}`} bg="bg-emerald-50" fg="text-emerald-600" />
      </div>

      {/* ── Action Bar ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
              Unsaved changes
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Defaults
          </Button>
          <Button variant="outline" size="sm" onClick={loadSettings} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm">
            {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            Save Settings
          </Button>
        </div>
      </div>

      {/* ── Settings Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Performance & Reliability */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-amber-100 p-1.5"><Zap className="h-3.5 w-3.5 text-amber-600" /></div>
              <div>
                <CardTitle className="text-sm">Performance &amp; Reliability</CardTitle>
                <CardDescription className="text-xs">How many API calls run at once and what happens on failure</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Concurrency Limit</Label>
                <span className="text-sm font-medium text-zinc-700">{settings.concurrency_limit} parallel</span>
              </div>
              <Slider value={[settings.concurrency_limit]} onValueChange={(v: number[]) => updateSetting('concurrency_limit', v[0])} min={1} max={20} step={1} />
              <p className="text-[11px] text-zinc-400">Simultaneous API calls per brand run</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Request Timeout</Label>
                <span className="text-sm font-medium text-zinc-700">{settings.timeout_ms / 1000}s</span>
              </div>
              <Slider value={[settings.timeout_ms]} onValueChange={(v: number[]) => updateSetting('timeout_ms', v[0])} min={10000} max={300000} step={5000} />
              <p className="text-[11px] text-zinc-400">Max wait time before abandoning a request</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Max Retries</Label>
                <Select value={String(settings.max_retries)} onValueChange={(v) => updateSetting('max_retries', Number(v))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Retry Delay</Label>
                <div className="relative">
                  <Input type="number" value={settings.retry_delay_ms} onChange={(e) => updateSetting('retry_delay_ms', Number(e.target.value))} min={100} max={10000} className="h-9 pr-10" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">ms</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Model Defaults */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-blue-100 p-1.5"><Info className="h-3.5 w-3.5 text-blue-600" /></div>
              <div>
                <CardTitle className="text-sm">Model Defaults</CardTitle>
                <CardDescription className="text-xs">Fallback settings when not configured per-model</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Temperature</Label>
                <span className="text-sm font-medium text-zinc-700">{settings.default_temperature}</span>
              </div>
              <Slider value={[settings.default_temperature]} onValueChange={(v: number[]) => updateSetting('default_temperature', v[0])} min={0} max={1} step={0.1} />
              <p className="text-[11px] text-zinc-400">Lower = more deterministic responses</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Max Output Tokens</Label>
                <span className="text-sm font-medium text-zinc-700">{settings.default_max_tokens.toLocaleString()}</span>
              </div>
              <Slider value={[settings.default_max_tokens]} onValueChange={(v: number[]) => updateSetting('default_max_tokens', v[0])} min={100} max={4000} step={100} />
            </div>
            <ToggleRow id="fallback" label="Model Fallbacks" description="Automatically try a backup model if the primary one fails" checked={settings.fallback_enabled} onChange={(v) => updateSetting('fallback_enabled', v)} />
          </CardContent>
        </Card>

        {/* Rate Limiting & Spending */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-green-100 p-1.5"><DollarSign className="h-3.5 w-3.5 text-green-600" /></div>
              <div>
                <CardTitle className="text-sm">Rate Limits &amp; Spending Caps</CardTitle>
                <CardDescription className="text-xs">Prevent API rate limit errors and unexpected bills</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <ToggleRow id="rate-limit" label="Rate Limiting" description="Throttle API calls to stay within provider limits" checked={settings.rate_limit_enabled} onChange={(v) => updateSetting('rate_limit_enabled', v)} />
            {settings.rate_limit_enabled && (
              <div className="space-y-1.5">
                <Label className="text-sm">Requests Per Minute</Label>
                <div className="relative">
                  <Input type="number" value={settings.requests_per_minute} onChange={(e) => updateSetting('requests_per_minute', Number(e.target.value))} min={1} max={1000} className="h-9 pr-12" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">rpm</span>
                </div>
              </div>
            )}
            <div className="h-px bg-zinc-100" />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Max Cost Per Run</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">$</span>
                  <Input type="number" value={settings.max_cost_per_run} onChange={(e) => updateSetting('max_cost_per_run', Number(e.target.value))} min={0.01} max={100} step={0.1} className="h-9 pl-7" />
                </div>
                <p className="text-[11px] text-zinc-400">Stops run if exceeded</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Daily Spending Limit</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">$</span>
                  <Input type="number" value={settings.daily_cost_limit} onChange={(e) => updateSetting('daily_cost_limit', Number(e.target.value))} min={1} max={1000} step={1} className="h-9 pl-7" />
                </div>
                <p className="text-[11px] text-zinc-400">Pauses all runs if exceeded</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Post-Run Analysis */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-orange-100 p-1.5"><AlertTriangle className="h-3.5 w-3.5 text-orange-600" /></div>
              <div>
                <CardTitle className="text-sm">Post-Run Analysis &amp; Deduplication</CardTitle>
                <CardDescription className="text-xs">What happens after LLM responses come back</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <ToggleRow id="auto-analysis" label="Auto-Analysis" description="Automatically analyze responses for brand mentions and sentiment" checked={settings.auto_analysis_enabled} onChange={(v) => updateSetting('auto_analysis_enabled', v)} />
            <ToggleRow id="longitudinal" label="Longitudinal Tracking" description="Track how brand visibility changes between runs over time" checked={settings.longitudinal_analysis_enabled} onChange={(v) => updateSetting('longitudinal_analysis_enabled', v)} />
            <div className="h-px bg-zinc-100" />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Dedup Window</Label>
                <div className="relative">
                  <Input type="number" value={settings.deduplication_window_hours} onChange={(e) => updateSetting('deduplication_window_hours', Number(e.target.value))} min={1} max={168} className="h-9 pr-14" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">hours</span>
                </div>
                <p className="text-[11px] text-zinc-400">Skip recently-run prompts</p>
              </div>
              <div className="pt-1">
                <ToggleRow id="force-rerun" label="Force Re-run" description="Allow bypassing deduplication" checked={settings.force_rerun_allowed} onChange={(v) => updateSetting('force_rerun_allowed', v)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ── Reusable sub-components ── */

function StatCard({ icon, label, value, bg, fg }: { icon: React.ReactNode; label: string; value: string; bg: string; fg: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className={`rounded-md p-1 ${bg} ${fg}`}>{icon}</div>
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-semibold text-zinc-900">{value}</p>
    </div>
  )
}

function ToggleRow({ id, label, description, checked, onChange }: {
  id: string; label: string; description: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
        <p className="text-[11px] text-zinc-400 mt-0.5">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} className="shrink-0" />
    </div>
  )
}
