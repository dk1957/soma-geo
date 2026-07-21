"use client"

import { ComingSoon } from "@/components/marketing/coming-soon"
import { Search } from "lucide-react"

export default function AuditsPage() {
  return (
    <ComingSoon
      title="AI Audits"
      description="Automated AI visibility audits for your content"
      icon={Search}
      features={[
        "Run targeted audits across ChatGPT, Gemini, Claude, and Perplexity",
        "Track audit scores and citation counts over time",
        "Get actionable optimization recommendations",
        "Compare performance across different AI models",
      ]}
    />
  )
}
