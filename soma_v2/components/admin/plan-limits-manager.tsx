"use client"

import { useState, useEffect } from "react"
import { Save, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/layout/notification-toast"

interface PlanLimit {
    id?: string
    plan_slug: string
    max_models: number
}

export function PlanLimitsManager() {
    const { addToast } = useToast()
    const [limits, setLimits] = useState<PlanLimit[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadLimits()
    }, [])

    const loadLimits = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/config/plan-limits')
            const result = await response.json()

            if (result.success) {
                setLimits(result.data)
            } else {
                addToast({
                    type: "error",
                    title: "Error",
                    message: "Failed to load plan limits"
                })
            }
        } catch (error) {
            console.error('Error loading plan limits:', error)
            addToast({
                type: "error",
                title: "Error",
                message: "Failed to load plan limits"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)

            const response = await fetch('/api/admin/config/plan-limits', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ limits })
            })

            const result = await response.json()

            if (result.success) {
                addToast({
                    type: "success",
                    title: "Success",
                    message: "Plan limits updated"
                })
                loadLimits()
            } else {
                addToast({
                    type: "error",
                    title: "Error",
                    message: "Failed to save limits"
                })
            }
        } catch (error) {
            console.error('Error saving limits:', error)
            addToast({
                type: "error",
                title: "Error",
                message: "Failed to save limits"
            })
        } finally {
            setSaving(false)
        }
    }

    const updateLimit = (planSlug: string, maxModels: number) => {
        setLimits(prev => prev.map(limit =>
            limit.plan_slug === planSlug
                ? { ...limit, max_models: maxModels }
                : limit
        ))
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Plan Model Limits</CardTitle>
                    <CardDescription>Loading...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Plan Model Limits</CardTitle>
                        <CardDescription>
                            How many consumer AI models each subscription plan can monitor across
                        </CardDescription>
                    </div>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="h-4 w-4 mr-2" />
                        Save
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                    {limits.map((limit) => (
                        <div key={limit.plan_slug} className="border rounded-lg p-4">
                            <Label className="capitalize mb-2 block">{limit.plan_slug} Plan</Label>
                            <Input
                                type="number"
                                value={limit.max_models}
                                onChange={(e) => updateLimit(limit.plan_slug, parseInt(e.target.value))}
                                min={1}
                                max={10}
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                Maximum models users can select
                            </p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
