"use client"

import { TrendingUp, TrendingDown, Clock, Zap, Circle, ArrowRight, BarChart3, Brain, FileText, Target, Search, Eye, Shield, BookOpen, Sparkles, Layers } from "lucide-react"
import type { AgentSystem } from "@/lib/agents/types"

interface PerformanceMonitorProps {
  system: AgentSystem
}

// ── GSEO Dimensions (from content dashboard) ──

const GSEO_DIMENSIONS = [
  {
    key: "citation_prominence",
    label: "Visibility & Citations",
    shortLabel: "CP",
    icon: Eye,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    description: "How prominently the brand is cited in the AI answer (e.g. \"According to Brand X...\").",
    scale: "0-3: Invisible · 4-6: Visible · 7-10: Prominent",
  },
  {
    key: "attribution_accuracy",
    label: "Trust & Accuracy",
    shortLabel: "AA",
    icon: Shield,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    description: "How accurately the AI attributes your claims and facts.",
    scale: "0-3: Hallucinated · 4-6: Partial · 7-10: Perfect",
  },
  {
    key: "faithfulness",
    label: "Fact Accuracy",
    shortLabel: "FA",
    icon: BookOpen,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    description: "How well the AI preserves the core meaning of your content.",
    scale: "0-3: Distorted · 4-6: Partial · 7-10: Faithful",
  },
  {
    key: "key_info_coverage",
    label: "Key Selling Points",
    shortLabel: "KC",
    icon: Target,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    description: "Did the AI include your most important differentiators and selling points?",
    scale: "0-3: Missed · 4-6: Partial · 7-10: Complete",
  },
  {
    key: "semantic_contribution",
    label: "Idea Influence",
    shortLabel: "SC",
    icon: Brain,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    description: "Did your unique perspective shape the structure of the AI's answer?",
    scale: "0-3: Generic · 4-6: Moderate · 7-10: Dominant",
  },
  {
    key: "answer_dominance",
    label: "Share of Voice",
    shortLabel: "AD",
    icon: Sparkles,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    description: "How much of the AI's answer is dominated by your content vs. competitors.",
    scale: "0-3: Footnote · 4-6: One of many · 7-10: Primary authority",
  },
]

// ── MACO Pipeline Steps ──

const MACO_PIPELINE = [
  { id: "query", label: "Query Agent", icon: Search, desc: "Generates benchmark query corpus", color: "text-violet-600", bg: "bg-violet-50" },
  { id: "evaluator", label: "Evaluator", icon: BarChart3, desc: "Scores across 6 GSEO dimensions", color: "text-blue-600", bg: "bg-blue-50" },
  { id: "analyst", label: "Analyst", icon: Brain, desc: "Diagnoses weaknesses & prescribes fixes", color: "text-amber-600", bg: "bg-amber-50" },
  { id: "editor", label: "Editor", icon: FileText, desc: "Implements surgical content revisions", color: "text-green-600", bg: "bg-green-50" },
  { id: "selector", label: "Selector", icon: Target, desc: "Selects best iteration from trajectory", color: "text-rose-600", bg: "bg-rose-50" },
]

// ── ARIA Pipeline Steps ──

const ARIA_PIPELINE = [
  { id: "brand_detector", label: "Brand Detector", icon: Search, desc: "Identifies brand mentions & positions", color: "text-emerald-600", bg: "bg-emerald-50" },
  { id: "sentiment", label: "Sentiment", icon: Brain, desc: "Scores sentiment per detected brand", color: "text-blue-600", bg: "bg-blue-50" },
  { id: "citation", label: "Citations", icon: FileText, desc: "Extracts & classifies all source references", color: "text-amber-600", bg: "bg-amber-50" },
  { id: "topic", label: "Topics", icon: Layers, desc: "Extracts semantic themes (not brand names)", color: "text-purple-600", bg: "bg-purple-50" },
]

// ── Execution Settings (from MACO config) ──

const MACO_EXECUTION = [
  { key: "max_iterations", label: "Max Iterations", value: 10, unit: "cycles", desc: "Maximum optimization cycles before stopping" },
  { key: "convergence_threshold", label: "Convergence Threshold", value: 0.5, unit: "variance", desc: "Score variance below which optimization stops" },
  { key: "plateau_window", label: "Plateau Window", value: 3, unit: "iterations", desc: "Iterations to detect score plateau" },
  { key: "num_queries", label: "Benchmark Queries", value: 10, unit: "queries", desc: "Queries generated per evaluation cycle" },
]

export function PerformanceMonitor({ system }: PerformanceMonitorProps) {
  const isContent = system.id === "content"
  const isAnalysis = system.id === "analysis"

  // Placeholder — would be fetched from analytics API
  const metrics = {
    totalRuns: 1250,
    successRate: 98.2,
    avgLatency: 2340,
    errors: 23,
  }

  const pipeline = isContent ? MACO_PIPELINE : ARIA_PIPELINE

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Runs", value: metrics.totalRuns.toLocaleString(), icon: Zap, iconColor: "text-amber-500" },
          { label: "Success Rate", value: `${metrics.successRate}%`, icon: TrendingUp, iconColor: "text-green-500" },
          { label: "Avg Latency", value: `${(metrics.avgLatency / 1000).toFixed(1)}s`, icon: Clock, iconColor: "text-blue-500" },
          { label: "Errors (24h)", value: String(metrics.errors), icon: TrendingDown, iconColor: "text-red-500" },
        ].map((metric) => (
          <div key={metric.label} className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <metric.icon className={`h-4 w-4 ${metric.iconColor}`} />
              <p className="text-xs font-medium text-zinc-500">{metric.label}</p>
            </div>
            <p className="text-2xl font-bold text-zinc-900 tabular-nums">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Pipeline Flow */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          {isContent ? "MACO Optimization Pipeline" : "ARIA Analysis Pipeline"}
        </h3>
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-2 overflow-x-auto">
            {pipeline.map((step, idx) => (
              <div key={step.id} className="flex items-center gap-2 shrink-0">
                <div className={`flex items-center gap-2.5 rounded-lg border border-zinc-200 px-3.5 py-3 ${step.bg}`}>
                  <step.icon className={`h-4 w-4 ${step.color} shrink-0`} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 whitespace-nowrap">{step.label}</p>
                    <p className="text-[11px] text-zinc-500 whitespace-nowrap">{step.desc}</p>
                  </div>
                </div>
                {idx < pipeline.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-300 shrink-0" />
                )}
              </div>
            ))}
          </div>
          {isContent && (
            <div className="mt-3 pt-3 border-t border-zinc-100">
              <p className="text-[11px] text-zinc-400">
                Loop: Evaluator → Analyst → Editor repeats up to <span className="font-semibold text-zinc-600">10 iterations</span> with plateau detection. Selector picks the best version.
              </p>
            </div>
          )}
          {isAnalysis && (
            <div className="mt-3 pt-3 border-t border-zinc-100">
              <p className="text-[11px] text-zinc-400">
                Sequential: Brand Detector runs first. Sentiment depends on its output. Citation and Topic extractors run in parallel.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* GSEO Dimensions (Content Agent only) */}
      {isContent && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            GSEO Evaluation Dimensions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {GSEO_DIMENSIONS.map((dim) => (
              <div key={dim.key} className={`rounded-lg border ${dim.border} ${dim.bg} p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <dim.icon className={`h-4 w-4 ${dim.color}`} />
                  <span className="text-sm font-semibold text-zinc-900">{dim.label}</span>
                  <span className="text-[10px] font-mono text-zinc-400 ml-auto">{dim.shortLabel}</span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed mb-2">{dim.description}</p>
                <p className="text-[11px] text-zinc-400 font-mono">{dim.scale}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execution Settings (Content Agent only) */}
      {isContent && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            Execution Settings
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {MACO_EXECUTION.map((setting) => (
              <div key={setting.key} className="rounded-lg border border-zinc-200 bg-white p-4">
                <p className="text-xs font-medium text-zinc-500 mb-1">{setting.label}</p>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-xl font-bold text-zinc-900 tabular-nums">{setting.value}</p>
                  <span className="text-xs text-zinc-400">{setting.unit}</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">{setting.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per Sub-Agent Performance */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Sub-Agent Performance</h3>
        <div className="rounded-lg border border-zinc-200 divide-y divide-zinc-100">
          {(system.sub_agents || []).map((subAgent, idx) => (
            <div key={subAgent.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[11px] font-mono text-zinc-300 w-4 text-right shrink-0">{idx + 1}</span>
                <Circle className={`h-2 w-2 fill-current shrink-0 ${subAgent.enabled ? "text-green-500" : "text-zinc-300"}`} />
                <div className="min-w-0">
                  <h4 className="text-sm font-medium text-zinc-900 truncate">{subAgent.name}</h4>
                  <p className="text-xs text-zinc-400 truncate">{subAgent.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-8 shrink-0">
                <div className="text-right">
                  <p className="text-sm font-semibold text-zinc-900 tabular-nums">2.1s</p>
                  <p className="text-[11px] text-zinc-400">latency</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-zinc-900 tabular-nums">98%</p>
                  <p className="text-[11px] text-zinc-400">success</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-zinc-500">2m ago</p>
                  <p className="text-[11px] text-zinc-400">last run</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
