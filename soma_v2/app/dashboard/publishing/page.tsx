"use client"

import { ComingSoon } from "@/components/marketing/coming-soon"
import { Upload } from "lucide-react"

export default function PublishingPage() {
  return (
    <ComingSoon
      title="Content Publishing"
      description="Publish and distribute AI-optimized content"
      icon={Upload}
      features={[
        "Create quotable, citation-ready content blocks",
        "Submit optimized content to AI crawlers directly",
        "Track publishing performance and engagement",
        "Manage content distribution across platforms",
      ]}
    />
  )
}
