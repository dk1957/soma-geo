"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Link as LinkIcon, Trash2 } from 'lucide-react'

interface LinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsert: (url: string, text?: string) => void
  initialUrl?: string
  initialText?: string
}

export function LinkDialog({ open, onOpenChange, onInsert, initialUrl = '', initialText = '' }: LinkDialogProps) {
  const [url, setUrl] = useState(initialUrl)
  const [text, setText] = useState(initialText)
  
  // Update state when dialog opens with new initial values
  useEffect(() => {
    if (open) {
      setUrl(initialUrl)
      setText(initialText)
    }
  }, [open, initialUrl, initialText])

  const handleInsert = () => {
    if (url.trim()) {
      onInsert(url.trim(), text.trim() || undefined)
      onOpenChange(false)
    }
  }
  
  const isEditing = initialUrl !== ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            {isEditing ? 'Edit Link' : 'Insert Link'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the link URL and text' : 'Add a hyperlink to your content'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="link-url">URL *</Label>
            <Input
              id="link-url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleInsert()
                }
              }}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-text">Link Text (optional)</Label>
            <Input
              id="link-text"
              placeholder="Click here"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleInsert()
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use selected text or URL
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={!url.trim()}>
            {isEditing ? 'Update Link' : 'Insert Link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
