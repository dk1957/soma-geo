'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Sparkles, Wand2 } from 'lucide-react'

interface AIGenerationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'title' | 'content'
  currentValue?: string
  onGenerate: (generated: string) => void
  contentType?: string
  targetAudience?: string
  keywords?: string[]
}

export function AIGenerationDialog({
  open,
  onOpenChange,
  mode,
  currentValue = '',
  onGenerate,
  contentType = 'article',
  targetAudience = '',
  keywords = []
}: AIGenerationDialogProps) {
  const [generationMode, setGenerationMode] = useState<'generate' | 'rewrite'>('generate')
  const [input, setInput] = useState('')
  const [tone, setTone] = useState('professional')
  const [length, setLength] = useState('medium')
  const [loading, setLoading] = useState(false)
  const [generatedResult, setGeneratedResult] = useState('')

  const handleGenerate = async () => {
    setLoading(true)
    setGeneratedResult('')

    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: generationMode,
          type: mode,
          input: generationMode === 'generate' ? input : currentValue,
          instructions: generationMode === 'rewrite' ? input : undefined,
          contentType,
          targetAudience,
          keywords,
          tone,
          length: mode === 'content' ? length : undefined
        })
      })

      if (!response.ok) {
        throw new Error('Generation failed')
      }

      const data = await response.json()
      setGeneratedResult(data.result)
    } catch (error) {
      console.error('Generation error:', error)
      alert('Failed to generate content. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleUseGenerated = () => {
    if (generatedResult) {
      onGenerate(generatedResult)
      onOpenChange(false)
      // Reset state
      setGeneratedResult('')
      setInput('')
      setGenerationMode('generate')
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setGeneratedResult('')
    setInput('')
    setGenerationMode('generate')
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-blue-100 p-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>
                AI {mode === 'title' ? 'Title' : 'Content'} Generator
              </DialogTitle>
              <DialogDescription>
                Generate GSEO-optimized {mode} using the MACO system
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={generationMode} onValueChange={(v) => setGenerationMode(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">
              <Wand2 className="h-4 w-4 mr-2" />
              Generate from Keywords
            </TabsTrigger>
            <TabsTrigger value="rewrite" disabled={!currentValue}>
              <Sparkles className="h-4 w-4 mr-2" />
              Rewrite Existing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="keywords-input">
                {mode === 'title' ? 'Topic or Keywords' : 'Key Points or Topics'}
              </Label>
              <Textarea
                id="keywords-input"
                placeholder={
                  mode === 'title'
                    ? 'e.g., AI search optimization, GSEO strategies, brand visibility'
                    : 'Enter key points, topics, or ideas you want to cover in your content...'
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={mode === 'title' ? 3 : 6}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {mode === 'title'
                  ? 'Provide keywords or a brief topic description'
                  : 'List the main ideas or points you want your content to cover'}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="rewrite" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="current-content">Current {mode === 'title' ? 'Title' : 'Content'}</Label>
              <Textarea
                id="current-content"
                value={currentValue}
                disabled
                rows={mode === 'title' ? 2 : 8}
                className="mt-1 bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="rewrite-instructions">Rewrite Instructions (Optional)</Label>
              <Textarea
                id="rewrite-instructions"
                placeholder={
                  mode === 'title'
                    ? 'e.g., Make it more engaging, add a question, emphasize benefits...'
                    : 'e.g., Make it more conversational, add statistics, simplify technical terms...'
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={3}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional: Provide specific instructions for how to improve the {mode}
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tone">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger id="tone" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="conversational">Conversational</SelectItem>
                <SelectItem value="authoritative">Authoritative</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {mode === 'content' && (
            <div>
              <Label htmlFor="length">Target Length</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger id="length" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (~200 words)</SelectItem>
                  <SelectItem value="medium">Medium (~500 words)</SelectItem>
                  <SelectItem value="long">Long (~1000 words)</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive (~2000+ words)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">GSEO Optimization</p>
              <p>
                Generated {mode} will be optimized for: {contentType}
                {targetAudience && ` • Target: ${targetAudience}`}
                {keywords.length > 0 && ` • Keywords: ${keywords.join(', ')}`}
              </p>
            </div>
          </div>
        </div>

        {generatedResult && (
          <div className="space-y-2">
            <Label>Generated Result</Label>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              {mode === 'title' ? (
                <p className="font-semibold text-lg text-gray-900">{generatedResult}</p>
              ) : (
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: generatedResult }} />
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          {generatedResult ? (
            <>
              <Button variant="outline" onClick={handleGenerate} disabled={loading}>
                <Sparkles className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
              <Button onClick={handleUseGenerated}>
                Use Generated {mode === 'title' ? 'Title' : 'Content'}
              </Button>
            </>
          ) : (
            <Button onClick={handleGenerate} disabled={loading || !input.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
