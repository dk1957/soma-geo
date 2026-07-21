"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/layout/notification-toast"
import { Badge } from '@/components/ui/badge'

interface Workspace {
    id: string;
    name: string;
    role: string;
    isOwner: boolean;
}

export default function WorkspaceSettingsPage() {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([])
    const [loading, setLoading] = useState(true)
    const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)
    const [newName, setNewName] = useState("")
    const { addToast, ToastContainer } = useToast()

    const fetchWorkspaces = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/workspaces')
            if (response.ok) {
                const data = await response.json()
                setWorkspaces(data)
            } else {
                addToast({ type: "error", title: "Error", message: "Failed to fetch workspaces." })
            }
        } catch (error) {
            addToast({ type: "error", title: "Error", message: "An error occurred while fetching workspaces." })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchWorkspaces()
    }, [])

    const handleEditClick = (workspace: Workspace) => {
        setEditingWorkspace(workspace)
        setNewName(workspace.name)
    }

    const handleCancelClick = () => {
        setEditingWorkspace(null)
        setNewName("")
    }

    const handleSaveClick = async () => {
        if (!editingWorkspace || !newName.trim()) return;

        try {
            const response = await fetch(`/api/workspaces/${editingWorkspace.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName }),
            })

            if (response.ok) {
                addToast({ type: "success", title: "Success", message: "Workspace name updated." })
                setEditingWorkspace(null)
                setNewName("")
                fetchWorkspaces() // Refresh the list
            } else {
                 addToast({ type: "error", title: "Error", message: "Failed to update workspace name." })
            }
        } catch (error) {
            addToast({ type: "error", title: "Error", message: "An error occurred." })
        }
    }

    if (loading) {
        return <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        </div>
    }

    return (
        <div className="container mx-auto px-6 py-6">
            <div className="space-y-6">
            <ToastContainer />
            <Card>
                <CardHeader>
                    <CardTitle>Workspace Management</CardTitle>
                    <CardDescription>View and manage the workspaces you are a member of.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {workspaces.map(ws => (
                        <div key={ws.id} className="p-4 border rounded-lg flex items-center justify-between">
                           {editingWorkspace?.id === ws.id ? (
                                <div className="flex-grow space-y-2">
                                    <Label htmlFor="workspaceName">New Workspace Name</Label>
                                    <Input
                                        id="workspaceName"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                    />
                                </div>
                           ) : (
                            <div>
                                <h3 className="font-medium">{ws.name}</h3>
                                <Badge variant={ws.isOwner ? "default" : "secondary"}>{ws.role}</Badge>
                            </div>
                           )}

                            <div className="flex space-x-2">
                                {editingWorkspace?.id === ws.id ? (
                                    <>
                                        <Button variant="outline" onClick={handleCancelClick}>Cancel</Button>
                                        <Button onClick={handleSaveClick}>Save</Button>
                                    </>
                                ) : (
                                    ws.isOwner && (
                                        <Button variant="outline" onClick={() => handleEditClick(ws)}>Edit Name</Button>
                                    )
                                )}
                            </div>
                        </div>
                    ))}
                     {!workspaces.length && <p className="text-muted-foreground text-center">You are not a member of any workspaces.</p>}
                </CardContent>
            </Card>
            </div>
        </div>
    )
}
