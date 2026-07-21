"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Link } from '@tiptap/extension-link'
import { Image } from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Placeholder } from '@tiptap/extension-placeholder'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Minus
} from 'lucide-react'
import { Button } from './button'
import { useCallback, useState, useEffect } from 'react'
import { LinkDialog } from './link-dialog'
import { ImageDialog } from './image-dialog'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  minHeight?: string
  brandId?: string
  editable?: boolean
}

export function RichTextEditor({ content, onChange, placeholder = 'Start writing...', minHeight = '300px', brandId, editable = true }: RichTextEditorProps) {
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [showImageDialog, setShowImageDialog] = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit.configure({
        // Disable built-in link to avoid duplicate extension
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer hover:text-blue-800',
          rel: 'noopener noreferrer nofollow',
          target: '_blank',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded',
          loading: 'lazy',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full',
        },
      }),
      TableRow,
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 px-4 py-2',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 px-4 py-2 bg-gray-100 font-bold',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[' + minHeight + '] px-4 py-3',
        style: `
          --tw-prose-body: rgb(55 65 81);
          --tw-prose-headings: rgb(17 24 39);
          --tw-prose-links: rgb(37 99 235);
          --tw-prose-bold: rgb(17 24 39);
          --tw-prose-counters: rgb(107 114 128);
          --tw-prose-bullets: rgb(209 213 219);
          --tw-prose-hr: rgb(229 231 235);
          --tw-prose-quotes: rgb(17 24 39);
          --tw-prose-quote-borders: rgb(229 231 235);
          --tw-prose-captions: rgb(107 114 128);
          --tw-prose-code: rgb(17 24 39);
          --tw-prose-pre-code: rgb(229 231 235);
          --tw-prose-pre-bg: rgb(31 41 55);
          --tw-prose-th-borders: rgb(209 213 219);
          --tw-prose-td-borders: rgb(229 231 235);
        `
      },
      handleClick(view, pos, event) {
        const target = event.target as HTMLElement
        
        // Check if clicked on an image
        if (target.tagName === 'IMG') {
          event.preventDefault()
          
          const imgElement = target as HTMLImageElement
          const imgSrc = imgElement.getAttribute('src') || ''
          const imgAlt = imgElement.getAttribute('alt') || ''
          
          // Pre-fill the dialog with current image data
          setImageUrl(imgSrc)
          setImageAlt(imgAlt)
          setShowImageDialog(true)
          
          // Store the image node position for later update
          const { state } = view
          const $pos = state.doc.resolve(pos)
          view.dispatch(view.state.tr.setSelection(state.selection.constructor.near($pos) as any))
          
          return true
        }
        
        // Check if clicked on a link
        if (target.tagName === 'A' || target.closest('a')) {
          event.preventDefault()
          
          // Get the link's position and attributes
          const { state } = view
          const $pos = state.doc.resolve(pos)
          const marks = $pos.marks()
          const linkMark = marks.find(mark => mark.type.name === 'link')
          
          if (linkMark) {
            // Set the editor selection to the link text
            const linkNode = target.closest('a')
            if (linkNode) {
              // Get link text and URL
              const linkUrl = linkMark.attrs.href
              const linkText = linkNode.textContent || ''
              
              // Update state and open dialog
              setLinkUrl(linkUrl)
              setLinkText(linkText)
              setShowLinkDialog(true)
            }
          }
          
          return true
        }
        return false
      },
    },
  })

  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageAlt, setImageAlt] = useState('')

  // Update editor content when prop changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      const { from, to } = editor.state.selection
      editor.commands.setContent(content, false)
      // Restore cursor position if possible
      try {
        editor.commands.setTextSelection({ from: Math.min(from, editor.state.doc.content.size), to: Math.min(to, editor.state.doc.content.size) })
      } catch (e) {
        // If cursor position is invalid, just focus at the end
        editor.commands.focus('end')
      }
    }
  }, [editor, content])

  // Update editor editable state when prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable)
    }
  }, [editor, editable])

  // Cleanup editor on unmount
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy()
      }
    }
  }, [editor])

  const addLink = useCallback(() => {
    if (!editor) return
    
    // Get the current selection
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, '')
    
    // Check if cursor is on an existing link
    const existingLink = editor.getAttributes('link')
    
    // Set initial values for the dialog
    setLinkUrl(existingLink.href || '')
    setLinkText(selectedText || '')
    setShowLinkDialog(true)
  }, [editor])

  const handleInsertLink = useCallback((url: string, text?: string) => {
    if (!editor) return
    
    const { from, to } = editor.state.selection
    const hasSelection = from !== to
    
    if (editor.isActive('link')) {
      // Editing an existing link - update the URL
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
      
      // If text was provided and different, update the link text
      if (text && text !== editor.state.doc.textBetween(from, to, '')) {
        editor.chain().focus().extendMarkRange('link').insertContent(text).run()
      }
    } else if (hasSelection) {
      // Has selected text - apply link to selection
      editor.chain().focus().setLink({ href: url }).run()
    } else if (text) {
      // No selection but text provided - insert new link with text
      editor.chain().focus().insertContent(`<a href="${url}">${text}</a>`).run()
    } else {
      // No selection, no text - insert URL as both href and text
      editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run()
    }
    
    // Reset state
    setLinkUrl('')
    setLinkText('')
  }, [editor])

  const addImage = useCallback(() => {
    if (!editor) return
    
    // Check if cursor is on an existing image
    const { $from } = editor.state.selection
    const node = $from.nodeBefore || $from.nodeAfter
    
    if (node && node.type.name === 'image') {
      // Pre-fill with existing image data
      setImageUrl(node.attrs.src || '')
      setImageAlt(node.attrs.alt || '')
    } else {
      // Clear for new image
      setImageUrl('')
      setImageAlt('')
    }
    
    setShowImageDialog(true)
  }, [editor])

  const handleInsertImage = useCallback((url: string, alt?: string) => {
    if (!editor) return
    
    // Check if we're updating an existing image
    const { $from } = editor.state.selection
    const node = $from.nodeBefore || $from.nodeAfter
    
    if (node && node.type.name === 'image') {
      // Update existing image
      const pos = $from.nodeBefore ? $from.pos - node.nodeSize : $from.pos
      editor.chain().focus()
        .deleteRange({ from: pos, to: pos + node.nodeSize })
        .setImage({ src: url, alt: alt || '' })
        .run()
    } else {
      // Insert new image
      editor.chain().focus().setImage({ src: url, alt: alt || '' }).run()
    }
    
    // Reset state
    setImageUrl('')
    setImageAlt('')
  }, [editor])

  const addTable = useCallback(() => {
    if (!editor) return
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      <style jsx global>{`
        /* Enhanced styles for mathematical formulae, images, and tables */
        .ProseMirror {
          /* Math notation styles */
          .math, .katex, .mjx-chtml, [class*="formula"] {
            display: inline-block;
            font-family: 'KaTeX_Main', 'Times New Roman', serif;
            padding: 2px 4px;
            background: #f8f9fa;
            border-radius: 3px;
            font-size: 1.05em;
            vertical-align: middle;
          }
          
          /* Block math */
          .math-display, .katex-display {
            display: block;
            margin: 1em 0;
            padding: 12px;
            background: #f8f9fa;
            border-left: 3px solid #3b82f6;
            overflow-x: auto;
            border-radius: 6px;
          }
          
          /* Subscripts and superscripts */
          sub, sup {
            font-size: 0.75em;
            line-height: 0;
            position: relative;
            vertical-align: baseline;
          }
          sup { top: -0.5em; }
          sub { bottom: -0.25em; }
          
          /* Enhanced image styling */
          img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 1em 0;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          
          img:hover {
            transform: scale(1.02);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          
          /* Enhanced table styling */
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 1.5em 0;
            overflow: hidden;
            border-radius: 8px;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          }
          
          th, td {
            border: 1px solid #e5e7eb;
            padding: 12px 16px;
            text-align: left;
          }
          
          th {
            background: #f3f4f6;
            font-weight: 600;
            color: #1f2937;
          }
          
          tr:nth-child(even) {
            background: #f9fafb;
          }
          
          tr:hover {
            background: #f3f4f6;
          }
          
          /* Code blocks */
          pre {
            background: #1f2937;
            color: #e5e7eb;
            padding: 1em;
            border-radius: 6px;
            overflow-x: auto;
            margin: 1em 0;
          }
          
          code {
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.9em;
            font-family: 'Monaco', 'Courier New', monospace;
          }
          
          pre code {
            background: transparent;
            padding: 0;
          }
          
          /* Blockquotes */
          blockquote {
            border-left: 4px solid #3b82f6;
            padding-left: 1em;
            margin: 1em 0;
            font-style: italic;
            color: #4b5563;
            background: #f9fafb;
            padding: 1em;
            border-radius: 4px;
          }
        }
      `}</style>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-300 bg-gray-50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-gray-200' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-gray-200' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive('code') ? 'bg-gray-200' : ''}
        >
          <Code className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-gray-200' : ''}
        >
          <Quote className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addLink}
          className={editor.isActive('link') ? 'bg-gray-200' : ''}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addImage}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addTable}
        >
          <TableIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} style={{ minHeight }} />

      {/* Dialogs */}
      <LinkDialog
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        onInsert={handleInsertLink}
        initialUrl={linkUrl}
        initialText={linkText}
      />
      <ImageDialog
        open={showImageDialog}
        onOpenChange={(open) => {
          setShowImageDialog(open)
          // Clear state when dialog closes
          if (!open) {
            setImageUrl('')
            setImageAlt('')
          }
        }}
        onInsert={handleInsertImage}
        brandId={brandId}
        initialUrl={imageUrl}
        initialAlt={imageAlt}
      />
    </div>
  )
}
