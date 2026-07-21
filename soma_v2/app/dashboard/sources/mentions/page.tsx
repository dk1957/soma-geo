"use client"

import { ComingSoon } from "@/components/marketing/coming-soon"
import { MessageSquare } from "lucide-react"

export default function MentionsPage() {
  return (
    <ComingSoon
      title="Citations & Mentions"
      description="Track where and how AI models mention your brand"
      icon={MessageSquare}
      features={[
        "Track brand mentions across all major AI models",
        "Analyze citation context and sentiment",
        "Compare mention frequency against competitors",
        "Get real-time alerts for new brand citations",
      ]}
    />
  )
}
