"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Share2,
  Copy,
  Check,
  ExternalLink,
  Mail,
  Eye,
  Users,
  TrendingUp,
  Calendar,
  Settings,
  AlertCircle,
  Loader2,
  Link,
  MessageSquare,
  BarChart3,
  Crown,
  Target,
  Trash2,
  RotateCcw,
  Clock
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ShareReportDialogProps {
  reportId: string
  reportTitle: string
  brandName: string
  trigger?: React.ReactNode
  onExternalReportsChange?: () => void
}

interface ExternalReport {
  id: string
  share_token: string
  title: string
  public_url: string
  total_views: number
  unique_visitors: number
  email_captures: number
  conversion_rate: number
  high_intent_leads: number
  created_at: string
  is_active: boolean
  expires_at: string | null
}

export default function ShareReportDialog({ 
  reportId, 
  reportTitle, 
  brandName, 
  trigger,
  onExternalReportsChange
}: ShareReportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [externalReports, setExternalReports] = useState<ExternalReport[]>([])
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const dialogContentRef = useRef<HTMLDivElement | null>(null)
  
  // Form state for creating new external report
  const [shareConfig, setShareConfig] = useState({
    title: `${brandName} AI Visibility Report`,
    description: `Comprehensive AI visibility analysis for ${brandName} - shared for business development purposes`,
    requires_email_capture: true,
    preview_section_count: 2,
    expiration_days: 30, // Default: 30 days
    never_expires: false
  })

  // Load existing external reports when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      loadExternalReports()
      // Show create form by default only if no reports exist
      setShowCreateForm(false)
      setNewlyCreatedId(null)
    }
  }, [isOpen])

  // Auto-show create form if no reports exist
  React.useEffect(() => {
    if (externalReports.length === 0 && !isLoading) {
      setShowCreateForm(true)
    }
  }, [externalReports.length, isLoading])

  const loadExternalReports = async () => {
    try {
      setIsLoading(true)
      // Filter external reports by source_report_id
      const response = await fetch(`/api/reports/external?source_report_id=${reportId}`)
      
      if (response.ok) {
        const data = await response.json()
        setExternalReports(data.data || [])
        // Notify parent component
        onExternalReportsChange?.()
      }
    } catch (error) {
      console.error('Error loading external reports:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createExternalReport = async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    try {
      setIsCreating(true)
      
      
      // Calculate expires_at if not never_expires
      let expiresAt = null
      if (!shareConfig.never_expires && shareConfig.expiration_days > 0) {
        const expirationDate = new Date()
        expirationDate.setDate(expirationDate.getDate() + shareConfig.expiration_days)
        expiresAt = expirationDate.toISOString()
      }
      
      const response = await fetch('/api/reports/external', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_report_id: reportId,
          title: shareConfig.title,
          description: shareConfig.description,
          requires_email_capture: shareConfig.requires_email_capture,
          preview_section_count: shareConfig.preview_section_count,
          expires_at: expiresAt
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Failed to create external report:', data)
        throw new Error(data.error || 'Failed to create external report')
      }
      
      
      // Mark the newly created report for highlighting
      setNewlyCreatedId(data.external_report.id)
      
      // Hide the create form FIRST
      setShowCreateForm(false)
      
      // Refresh the list
      await loadExternalReports()
      
      // Scroll to top of dialog to show the newly created link - try multiple selectors
      requestAnimationFrame(() => {
        // Try the ref first
        if (dialogContentRef.current) {
          dialogContentRef.current.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
          // Fallback to querySelector
          const dialogContent = document.querySelector('[role="dialog"]') as HTMLElement
          if (dialogContent) {
            dialogContent.scrollTo({ top: 0, behavior: 'smooth' })
          }
          
          // Also try the scrollable container
          const scrollContainer = document.querySelector('.overflow-y-auto') as HTMLElement
          if (scrollContainer) {
            scrollContainer.scrollTo({ top: 0, behavior: 'smooth' })
          }
        }
      })
      
      toast({
        title: "Report Shared Successfully",
        description: "Your share link is ready! Scroll up to see it.",
      })

      // Copy URL to clipboard
      if (data.external_report?.public_url) {
        await copyToClipboard(data.external_report.public_url)
      }

      // Reset form to default values
      setShareConfig({
        title: `${brandName} AI Visibility Report`,
        description: `Comprehensive AI visibility analysis for ${brandName} - shared for business development purposes`,
        requires_email_capture: true,
        preview_section_count: 2,
        expiration_days: 30,
        never_expires: false
      })

      // Clear the highlight after 5 seconds
      setTimeout(() => {
        setNewlyCreatedId(null)
      }, 5000)

      // Notify parent to refresh (after UI updates)
      setTimeout(() => {
        onExternalReportsChange?.()
      }, 100)

    } catch (error: any) {
      console.error('Error creating external report:', error)
      toast({
        title: "Error Creating Share",
        description: error.message || "Failed to create external report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const copyToClipboard = async (url: string) => {
    try {
      // Focus the window first to ensure clipboard access
      window.focus()
      
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url)
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea')
        textArea.value = url
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
      }
      
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 2000)
      
      toast({
        title: "Link Copied",
        description: "The share link has been copied to your clipboard.",
      })
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast({
        title: "Copy Failed",
        description: "Could not copy link. Please copy it manually.",
        variant: "destructive"
      })
    }
  }

  const toggleReportStatus = async (externalReportId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/reports/external/${externalReportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !isActive
        }),
      })

      if (response.ok) {
        await loadExternalReports()
        toast({
          title: isActive ? "Report Deactivated" : "Report Activated",
          description: `The external report has been ${isActive ? 'deactivated' : 'activated'}.`,
        })
      }
    } catch (error) {
      console.error('Error toggling report status:', error)
    }
  }

  const deleteReport = async (externalReportId: string) => {
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/reports/external/${externalReportId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadExternalReports()
        toast({
          title: "Link Deleted",
          description: "The share link has been permanently deleted.",
        })
      } else {
        throw new Error('Failed to delete report')
      }
    } catch (error) {
      console.error('Error deleting report:', error)
      toast({
        title: "Delete Failed",
        description: "Could not delete the share link. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
      setDeleteConfirmId(null)
    }
  }

  const reactivateExpiredReport = async (externalReportId: string) => {
    try {
      // Extend expiration by 30 days from now
      const newExpirationDate = new Date()
      newExpirationDate.setDate(newExpirationDate.getDate() + 30)

      const response = await fetch(`/api/reports/external/${externalReportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: true,
          expires_at: newExpirationDate.toISOString()
        }),
      })

      if (response.ok) {
        await loadExternalReports()
        toast({
          title: "Link Reactivated",
          description: "The share link has been reactivated and will expire in 30 days.",
        })
      } else {
        throw new Error('Failed to reactivate report')
      }
    } catch (error) {
      console.error('Error reactivating report:', error)
      toast({
        title: "Reactivation Failed",
        description: "Could not reactivate the share link. Please try again.",
        variant: "destructive"
      })
    }
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share Report
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-[56rem] max-h-[90vh] overflow-y-auto" ref={dialogContentRef as any}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Report for Business Development
          </DialogTitle>
          <DialogDescription>
            Create shareable links that capture lead information when prospects access the full report.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6" id="share-dialog-content">
          {/* Existing External Reports */}
          {externalReports.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Your Shared Report Links</h3>
                {!showCreateForm && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <Settings className="h-3 w-3 mr-2" />
                    Create Another Link
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                {externalReports.map((report) => {
                  const expired = isExpired(report.expires_at)
                  
                  return (
                    <Card 
                      key={report.id} 
                      className={`border transition-all duration-300 ${
                        newlyCreatedId === report.id 
                          ? 'border-green-400 bg-green-50 shadow-md' 
                          : expired
                          ? 'border-orange-300 bg-orange-50/30'
                          : 'border-gray-200'
                      }`}
                    >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{report.title}</h4>
                            {expired ? (
                              <Badge variant="destructive" className="bg-orange-100 text-orange-700 border-orange-300">
                                <Clock className="h-3 w-3 mr-1" />
                                Expired
                              </Badge>
                            ) : (
                              <Badge variant={report.is_active ? "default" : "secondary"}>
                                {report.is_active ? "Active" : "Inactive"}
                              </Badge>
                            )}
                            {newlyCreatedId === report.id && (
                              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 animate-pulse">
                                NEW
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3 text-gray-400" />
                              <span>{report.total_views} views</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-gray-400" />
                              <span>{report.unique_visitors} visitors</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span>{report.email_captures} leads</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-gray-400" />
                              <span>{report.conversion_rate.toFixed(1)}% conversion</span>
                            </div>
                          </div>

                          {newlyCreatedId === report.id && (
                            <div className="mb-2 p-2 bg-green-100 border border-green-300 rounded text-sm text-green-800 flex items-center gap-2">
                              <Check className="h-4 w-4" />
                              <span className="font-medium">Share link created! Link copied to clipboard.</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 mb-2">
                            <Input 
                              value={report.public_url}
                              readOnly
                              className="text-xs h-8"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(report.public_url)}
                              className="h-8 px-2"
                              title="Copy link"
                            >
                              {copiedUrl === report.public_url ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(report.public_url, '_blank')}
                              className="h-8 px-2"
                              title="Open in new tab"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Created {new Date(report.created_at).toLocaleDateString()}</span>
                            {report.expires_at && (
                              <span className={expired ? 'text-orange-600 font-medium' : ''}>
                                {expired ? 'Expired' : 'Expires'}: {new Date(report.expires_at).toLocaleDateString()}
                              </span>
                            )}
                            {!report.expires_at && (
                              <span className="text-green-600">Never expires</span>
                            )}
                            {report.high_intent_leads > 0 && (
                              <Badge variant="outline" className="text-green-600 border-green-200">
                                <Crown className="h-3 w-3 mr-1" />
                                {report.high_intent_leads} high-intent leads
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {expired ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => reactivateExpiredReport(report.id)}
                              className="h-8 text-xs"
                              title="Reactivate link (extends by 30 days)"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Reactivate
                            </Button>
                          ) : (
                            <Switch
                              checked={report.is_active}
                              onCheckedChange={() => toggleReportStatus(report.id, report.is_active)}
                            />
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteConfirmId(report.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete share link"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )})}
              </div>
            </div>
          )}

          {/* Show "Create First Link" message if no reports and form is hidden */}
          {externalReports.length === 0 && !showCreateForm && !isLoading && (
            <div className="text-center py-8">
              <Share2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Shared Links Yet</h3>
              <p className="text-sm text-gray-600 mb-4">
                Create your first shareable link to start capturing leads
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Create Share Link
              </Button>
            </div>
          )}

          {/* Create New External Report Form */}
          {showCreateForm && (
            <Card className="border-gray-200 bg-gray-50/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      {externalReports.length === 0 ? 'Create Share Link' : 'Create Another Share Link'}
                    </CardTitle>
                    <CardDescription>
                      Configure how this report will appear when shared externally
                    </CardDescription>
                  </div>
                  {externalReports.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="share-title">Report Title</Label>
                  <Input
                    id="share-title"
                    value={shareConfig.title}
                    onChange={(e) => setShareConfig(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Report title for external sharing"
                  />
                </div>
                
                <div>
                  <Label htmlFor="share-description">Description</Label>
                  <Textarea
                    id="share-description"
                    value={shareConfig.description}
                    onChange={(e) => setShareConfig(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the report for external viewers"
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Email Capture</Label>
                    <p className="text-sm text-gray-600">
                      Require visitors to provide contact information to access the full report
                    </p>
                  </div>
                  <Switch
                    checked={shareConfig.requires_email_capture}
                    onCheckedChange={(checked) => setShareConfig(prev => ({ ...prev, requires_email_capture: checked }))}
                  />
                </div>

                {shareConfig.requires_email_capture && (
                  <div>
                    <Label htmlFor="preview-sections">Preview Sections</Label>
                    <Input
                      id="preview-sections"
                      type="number"
                      min="1"
                      max="5"
                      value={shareConfig.preview_section_count}
                      onChange={(e) => setShareConfig(prev => ({ 
                        ...prev, 
                        preview_section_count: parseInt(e.target.value) || 2 
                      }))}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Number of report sections to show before requiring email capture
                    </p>
                  </div>
                )}

                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Link Expiration
                      </Label>
                      <p className="text-sm text-gray-600">
                        Set when this share link should expire
                      </p>
                    </div>
                    <Switch
                      checked={shareConfig.never_expires}
                      onCheckedChange={(checked) => setShareConfig(prev => ({ 
                        ...prev, 
                        never_expires: checked 
                      }))}
                    />
                  </div>

                  {shareConfig.never_expires ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                      <span className="font-medium">This link will never expire</span>
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="expiration-days">Expires in (days)</Label>
                      <select
                        id="expiration-days"
                        value={shareConfig.expiration_days}
                        onChange={(e) => setShareConfig(prev => ({ 
                          ...prev, 
                          expiration_days: parseInt(e.target.value) 
                        }))}
                        className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      >
                        <option value="7">7 days</option>
                        <option value="14">14 days</option>
                        <option value="30">30 days (Recommended)</option>
                        <option value="60">60 days</option>
                        <option value="90">90 days</option>
                        <option value="180">180 days (6 months)</option>
                        <option value="365">365 days (1 year)</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Link will expire on {new Date(Date.now() + shareConfig.expiration_days * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                {externalReports.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                )}
                <Button 
                  onClick={createExternalReport}
                  disabled={isCreating}
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Share2 className="mr-2 h-4 w-4" />
                      Create Share Link
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        {!showCreateForm && externalReports.length > 0 && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Share Link?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this share link. All analytics data will be preserved, but the link will no longer be accessible. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && deleteReport(deleteConfirmId)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Link'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}