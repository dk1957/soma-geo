"use client"

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
import { Image as ImageIcon, Upload, Search, Loader2, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/layout/notification-toast'

interface ImageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsert: (url: string, alt?: string) => void
  brandId?: string
  initialUrl?: string
  initialAlt?: string
}

interface UnsplashImage {
  id: string
  urls: {
    small: string
    regular: string
    full: string
  }
  alt_description: string
  user: {
    name: string
    username: string
  }
  links: {
    html: string
  }
}

interface UploadedImage {
  url: string
  name: string
  created_at: string
}

export function ImageDialog({ open, onOpenChange, onInsert, brandId, initialUrl = '', initialAlt = '' }: ImageDialogProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'upload' | 'unsplash' | 'library'>('unsplash')
  const [imageUrl, setImageUrl] = useState('')
  const [imageAlt, setImageAlt] = useState('')
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [unsplashImages, setUnsplashImages] = useState<UnsplashImage[]>([])
  const [loadingUnsplash, setLoadingUnsplash] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [loadingLibrary, setLoadingLibrary] = useState(false)
  const { addToast } = useToast()

  const supabase = createClient()

  // Auto-load initial values when editing an existing image
  useEffect(() => {
    if (open && initialUrl) {
      setImageUrl(initialUrl)
      setImageAlt(initialAlt)
      setActiveTab('url') // Switch to URL tab when editing
    } else if (open && !initialUrl) {
      // Clear when opening for new image
      setImageUrl('')
      setImageAlt('')
      setActiveTab('unsplash')
    }
  }, [open, initialUrl, initialAlt])

  // Load uploaded images from library
  const loadLibrary = useCallback(async () => {
    if (!brandId) return
    
    setLoadingLibrary(true)
    try {
      const { data: files, error } = await supabase.storage
        .from('brand-assets')
        .list(`${brandId}/content-images`, {
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) throw error

      const images = await Promise.all(
        (files || []).map(async (file) => {
          const { data } = supabase.storage
            .from('brand-assets')
            .getPublicUrl(`${brandId}/content-images/${file.name}`)
          
          return {
            url: data.publicUrl,
            name: file.name,
            created_at: file.created_at || new Date().toISOString()
          }
        })
      )

      setUploadedImages(images)
    } catch (error) {
      console.error('Error loading library:', error)
    } finally {
      setLoadingLibrary(false)
    }
  }, [brandId, supabase])

  useEffect(() => {
    if (open && activeTab === 'library') {
      loadLibrary()
    }
  }, [open, activeTab, loadLibrary])

  // Search Unsplash
  const searchUnsplash = async (query: string) => {
    if (!query.trim()) return

    setLoadingUnsplash(true)
    try {
      const response = await fetch(`/api/content/images/unsplash?query=${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error('Failed to search images')
      
      const data = await response.json()
      setUnsplashImages(data.results || [])
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Search Failed',
        message: 'Could not search for images'
      })
    } finally {
      setLoadingUnsplash(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !brandId) return

    if (!file.type.startsWith('image/')) {
      addToast({
        type: 'error',
        title: 'Invalid File',
        message: 'Please select an image file'
      })
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${brandId}/content-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(filePath)

      addToast({
        type: 'success',
        title: 'Upload Complete',
        message: 'Image uploaded successfully'
      })

      onInsert(data.publicUrl, file.name)
      onOpenChange(false)
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: error instanceof Error ? error.message : 'Could not upload image'
      })
    } finally {
      setUploading(false)
    }
  }

  const handleInsertUrl = () => {
    if (imageUrl.trim()) {
      onInsert(imageUrl.trim(), imageAlt.trim() || undefined)
      setImageUrl('')
      setImageAlt('')
      onOpenChange(false)
    }
  }

  const handleInsertUnsplash = (image: UnsplashImage) => {
    onInsert(image.urls.regular, image.alt_description || 'Unsplash image')
    onOpenChange(false)
  }

  const handleInsertLibrary = (image: UploadedImage) => {
    onInsert(image.url, image.name)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {initialUrl ? 'Edit Image' : 'Insert Image'}
          </DialogTitle>
          <DialogDescription>
            {initialUrl ? 'Update the image URL or alt text' : 'Upload an image, search free stock photos, or insert from URL'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="unsplash">
              <Search className="h-4 w-4 mr-2" />
              Search Free
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="library">
              <ImageIcon className="h-4 w-4 mr-2" />
              Library
            </TabsTrigger>
            <TabsTrigger value="url">
              <ExternalLink className="h-4 w-4 mr-2" />
              URL
            </TabsTrigger>
          </TabsList>

          {/* Unsplash Search Tab */}
          <TabsContent value="unsplash" className="flex-1 overflow-auto space-y-4 mt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search free stock photos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    searchUnsplash(searchQuery)
                  }
                }}
              />
              <Button onClick={() => searchUnsplash(searchQuery)} disabled={loadingUnsplash}>
                {loadingUnsplash ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {loadingUnsplash ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : unsplashImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-auto">
                {unsplashImages.map((image) => (
                  <div
                    key={image.id}
                    className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors"
                    onClick={() => handleInsertUnsplash(image)}
                  >
                    <img
                      src={image.urls.small}
                      alt={image.alt_description}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                      <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100">
                        Insert
                      </Button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                      <p className="text-xs text-white truncate">by {image.user.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Search for free stock photos from Unsplash</p>
              </div>
            )}
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4 mt-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading || !brandId}
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                {uploading ? (
                  <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
                ) : (
                  <Upload className="h-12 w-12 text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {uploading ? 'Uploading...' : 'Click to upload image'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              </label>
            </div>
            {!brandId && (
              <p className="text-sm text-orange-600 text-center">
                Please select a brand to upload images
              </p>
            )}
          </TabsContent>

          {/* Library Tab */}
          <TabsContent value="library" className="flex-1 overflow-auto space-y-4 mt-4">
            {loadingLibrary ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : uploadedImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-auto">
                {uploadedImages.map((image, idx) => (
                  <div
                    key={idx}
                    className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors"
                    onClick={() => handleInsertLibrary(image)}
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                      <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100">
                        Insert
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No images uploaded yet</p>
                <p className="text-sm mt-1">Upload images to build your library</p>
              </div>
            )}
          </TabsContent>

          {/* URL Tab */}
          <TabsContent value="url" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL *</Label>
              <Input
                id="image-url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleInsertUrl()
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-alt">Alt Text (optional)</Label>
              <Input
                id="image-alt"
                placeholder="Description of the image"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleInsertUrl()
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Helps with accessibility and SEO
              </p>
            </div>
            <Button onClick={handleInsertUrl} disabled={!imageUrl.trim()} className="w-full">
              {initialUrl ? 'Update Image' : 'Insert Image'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
