"use client"

import { ComingSoon } from "@/components/marketing/coming-soon"
import { Globe } from "lucide-react"

export default function DiscoveringPage() {
  return (
    <ComingSoon
      title="Discovering"
      description="Discover how AI models find and index your content"
      icon={Globe}
      features={[
        "Map your content's ground truth across AI knowledge bases",
        "Track site indexing status for AI crawlers",
        "Analyze source mapping and content attribution",
        "Monitor indexing analytics and coverage gaps",
      ]}
    />
  )
}
