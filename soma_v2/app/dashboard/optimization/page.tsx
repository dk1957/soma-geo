"use client"

import { ComingSoon } from "@/components/marketing/coming-soon"
import { Sparkles } from "lucide-react"

export default function OptimizationPage() {
  return (
    <ComingSoon
      title="Content Optimization"
      description="AI-powered content optimization for maximum visibility"
      icon={Sparkles}
      features={[
        "Upload or paste content for AI-powered optimization",
        "Get expert quotes, statistics, and structured data injected automatically",
        "Optimize for citation across ChatGPT, Claude, Gemini, and Perplexity",
        "Download or publish optimized content directly",
      ]}
    />
  )
}
