"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface ComingSoonProps {
  title: string
  description: string
  icon?: LucideIcon
  features?: string[]
}

export function ComingSoon({ title, description, icon: Icon = Clock, features }: ComingSoonProps) {
  return (
    <div className="container mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Under Development</h2>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            We&apos;re building this feature to help you get even more value from Soma AI. Stay tuned for updates.
          </p>
          {features && features.length > 0 && (
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">What to expect:</p>
              <ul className="list-disc list-inside space-y-1">
                {features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
