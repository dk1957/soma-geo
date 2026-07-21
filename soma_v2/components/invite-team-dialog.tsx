"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Mail, Copy, Check } from "lucide-react"

interface InviteTeamDialogProps {
  trigger?: React.ReactNode
}

export function InviteTeamDialog({ trigger }: InviteTeamDialogProps) {
  const [open, setOpen] = useState(false)
  const [inviteMethod, setInviteMethod] = useState<"email" | "link">("email")
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    emails: "",
    role: "Member",
    message: "",
  })

  const inviteLink = "https://soma.app/invite/abc123xyz"

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendInvites = () => {
    const emails = formData.emails.split(",").map((email) => email.trim())
    console.log("Sending invites to:", emails, "with role:", formData.role)
    setOpen(false)
    setFormData({ emails: "", role: "Member", message: "" })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Invite Team
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite Team Members</DialogTitle>
          <DialogDescription>Add people to your workspace to collaborate on AI optimization</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Invite Method Tabs */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setInviteMethod("email")}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                inviteMethod === "email"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mail className="h-4 w-4" />
              <span>Email Invite</span>
            </button>
            <button
              onClick={() => setInviteMethod("link")}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                inviteMethod === "link"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Copy className="h-4 w-4" />
              <span>Invite Link</span>
            </button>
          </div>

          {inviteMethod === "email" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="emails">Email addresses</Label>
                <Textarea
                  id="emails"
                  placeholder="Enter email addresses separated by commas&#10;example: john@company.com, sarah@company.com"
                  value={formData.emails}
                  onChange={(e) => setFormData({ ...formData, emails: e.target.value })}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">Separate multiple emails with commas</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Default role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin - Full workspace access</SelectItem>
                    <SelectItem value="Member">Member - Standard access</SelectItem>
                    <SelectItem value="Viewer">Viewer - Read-only access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Personal message (optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a personal message to your invitation..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={2}
                />
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Invite link</Label>
                <div className="flex space-x-2">
                  <Input value={inviteLink} readOnly className="flex-1" />
                  <Button variant="outline" size="sm" onClick={handleCopyLink} className="bg-transparent">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Anyone with this link can join as a Member. Link expires in 7 days.
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Link Settings</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Default role:</span>
                    <span className="text-foreground">Member</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires:</span>
                    <span className="text-foreground">7 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uses:</span>
                    <span className="text-foreground">Unlimited</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="bg-transparent">
            Cancel
          </Button>
          {inviteMethod === "email" ? (
            <Button onClick={handleSendInvites}>Send Invitations</Button>
          ) : (
            <Button onClick={handleCopyLink}>{copied ? "Copied!" : "Copy Link"}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
