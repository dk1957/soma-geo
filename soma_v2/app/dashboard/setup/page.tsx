"use client"

import { SetupAssistant } from "@/components/setup-assistant"

export default function SetupAssistantPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Setup Assistant</h1>
        <p className="text-muted-foreground mt-2">
          Get your brand ready for AI search engines with our step-by-step guide
        </p>
      </div>
      
      <SetupAssistant />
    </div>
  )
}