import React from 'react'
import * as Diff from 'diff'
import { cn } from '@/lib/utils'

interface DiffViewerProps {
  oldText: string
  newText: string
  className?: string
  mode?: 'inline' | 'split-left' | 'split-right'
}

// Helper to strip HTML tags but preserve some structure for readability
const stripHtml = (html: string) => {
  if (!html) return ''
  
  // Replace block tags with newlines to preserve structure
  let text = html
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/tr>/gi, '\n')
  
  // Strip all other tags
  text = text.replace(/<[^>]+>/g, '')
  
  // Decode common entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    
  // Clean up excessive whitespace
  return text.replace(/\n{3,}/g, '\n\n').trim()
}

export function DiffViewer({ oldText, newText, className, mode = 'inline' }: DiffViewerProps) {
  // Clean HTML before diffing
  const cleanOld = stripHtml(oldText || '')
  const cleanNew = stripHtml(newText || '')
  
  // Use diffWords to show word-level changes
  const diff = Diff.diffWords(cleanOld, cleanNew)

  return (
    <div className={cn("font-mono text-sm whitespace-pre-wrap leading-relaxed", className)}>
      {diff.map((part, index) => {
        // Determine visibility based on mode
        if (mode === 'split-left') {
          // Left side (Original): Show unchanged and removed parts
          if (part.added) return null
          
          return (
            <span 
              key={index} 
              className={cn(
                part.removed ? "bg-red-100 text-red-800 decoration-red-500 line-through opacity-70" : "text-gray-700",
                "px-0.5 rounded-sm"
              )}
            >
              {part.value}
            </span>
          )
        }
        
        if (mode === 'split-right') {
          // Right side (Optimized): Show unchanged and added parts
          if (part.removed) return null
          
          return (
            <span 
              key={index} 
              className={cn(
                part.added ? "bg-green-100 text-green-800 decoration-green-500 font-medium" : "text-gray-700",
                "px-0.5 rounded-sm"
              )}
            >
              {part.value}
            </span>
          )
        }

        // Inline mode (default)
        const color = part.added 
          ? 'bg-green-100 text-green-800 decoration-green-500' 
          : part.removed 
            ? 'bg-red-100 text-red-800 line-through decoration-red-500 opacity-70' 
            : 'text-gray-700'
            
        return (
          <span key={index} className={cn(color, "px-0.5 rounded-sm")}>
            {part.value}
          </span>
        )
      })}
    </div>
  )
}
