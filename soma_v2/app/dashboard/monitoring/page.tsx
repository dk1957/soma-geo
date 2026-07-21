"use client"

import { ComingSoon } from "@/components/marketing/coming-soon"
import { Bell } from "lucide-react"

export default function MonitoringPage() {
  return (
    <ComingSoon
      title="AI Monitoring"
      description="Real-time monitoring of your brand's AI visibility"
      icon={Bell}
      features={[
        "Track citation counts and visibility scores in real time",
        "Get alerts when your brand mentions change significantly",
        "Monitor competitor movements across AI models",
        "View trend charts and performance analytics",
      ]}
    />
  )
}
