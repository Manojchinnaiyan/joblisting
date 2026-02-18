'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useQueryClient } from '@tanstack/react-query'
import {
  adminBlogApi,
  blogApi,
  GeneratedBlogResponse,
  UnsplashImage,
  BlogCategory,
  BlogTag,
} from '@/lib/api/blog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RichTextEditor } from './RichTextEditor'
import {
  Loader2,
  Link2,
  AlertTriangle,
  Check,
  ExternalLink,
  Edit2,
  Save,
  Sparkles,
  Image as ImageIcon,
  Search,
  Wand2,
  FileText,
  RefreshCw,
  X,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const TONE_OPTIONS = [
  { value: 'default', label: 'Default (Professional)' },
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual & Friendly' },
  { value: 'educational', label: 'Educational' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'technical', label: 'Technical' },
]

const LENGTH_OPTIONS = [
  { value: 'default', label: 'Default (Medium)' },
  { value: 'short', label: 'Short (400-600 words)' },
  { value: 'medium', label: 'Medium (800-1200 words)' },
  { value: 'long', label: 'Long (1500-2000 words)' },
]

export function BlogGenerator() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Form state
  const [url, setUrl] = useState('')
  const [prompt, setPrompt] = useState('')
  const [targetTone, setTargetTone] = useState('default')
  const [targetLength, setTargetLength] = useState('default')
  const [selectedCategoryId, setSelectedCategoryId] = useState('none')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  // Generation state
  const [loading, setLoading] = useState(false)
  const [generatedData, setGeneratedData] = useState<GeneratedBlogResponse | null>(null)
  const [imageOptions, setImageOptions] = useState<UnsplashImage[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Edit state
  const [editMode, setEditMode] = useState(false)
  const [editedData, setEditedData] = useState<GeneratedBlogResponse | null>(null)

  // Image search state
  const [imageSearchQuery, setImageSearchQuery] = useState('')
  const [searchingImages, setSearchingImages] = useState(false)

  // Simplify state
  const [simplifying, setSimplifying] = useState(false)

  // Categories and tags
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [tags, setTags] = useState<BlogTag[]>([])

  // Creating state
  const [creating, setCreating] = useState(false)

  // Load categories and tags
  useEffect(() => {
    async function loadData() {
      try {
        const [categoriesData, tagsData] = await Promise.all([
          blogApi.getCategories(),
          blogApi.getTags(),
        ])
        setCategories(categoriesData)
        setTags(tagsData)
      } catch (error) {
        console.error('Failed to load categories/tags:', error)
      }
    }
    loadData()
  }, [])

  const handleGenerate = async () => {
    // Validate: either URL or prompt must be provided
    if (!url.trim() && !prompt.trim()) {
      setError('Please enter a URL or a prompt describing the blog you want to create')
      return
    }

    // If only prompt provided (no URL), validate prompt length
    if (!url.trim() && prompt.trim().length < 10) {
      setError('Please provide a more detailed prompt (at least 10 characters)')
      return
    }

    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      setError('URL must start with http:// or https://')
      return
    }

    setLoading(true)
    setError(null)
    setGeneratedData(null)
    setEditedData(null)
    setWarnings([])
    setImageOptions([])

    try {
      const response = await adminBlogApi.generateBlogPreview({
        url: url || undefined,
        prompt,
        target_tone: targetTone === 'default' ? undefined : targetTone,
        target_length: targetLength === 'default' ? undefined : targetLength,
        category_id: selectedCategoryId === 'none' ? undefined : selectedCategoryId,
      })

      if (response.success) {
        setGeneratedData(response.generated_blog)
        setEditedData(response.generated_blog)
        setWarnings(response.warnings || [])
        setImageOptions(response.image_options || [])

        // Set image search query from AI suggestion
        if (response.generated_blog.image_search_term) {
          setImageSearchQuery(response.generated_blog.image_search_term)
        }

        toast({
          title: 'Blog Generated',
          description: 'Your blog has been generated. Review and edit before publishing.',
        })
      } else {
        setError('Failed to generate blog content')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate blog. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchImages = async () => {
    if (!imageSearchQuery.trim()) return

    setSearchingImages(true)
    try {
      const response = await adminBlogApi.searchImages({
        query: imageSearchQuery,
        per_page: 9,
      })

      if (response.success) {
        setImageOptions(response.images)
        toast({
          title: 'Images Found',
          description: `Found ${response.total} images for "${imageSearchQuery}"`,
        })
      }
    } catch (err) {
      toast({
        title: 'Search Failed',
        description: 'Failed to search for images. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSearchingImages(false)
    }
  }

  const handleSelectImage = (image: UnsplashImage) => {
    if (editedData) {
      setEditedData({ ...editedData, featured_image: image.url })
      toast({
        title: 'Image Selected',
        description: `Photo by ${image.photographer}`,
      })
    }
  }

  const handleSimplifyContent = async () => {
    if (!editedData?.content) return

    setSimplifying(true)
    try {
      const response = await adminBlogApi.simplifyContent({
        content: editedData.content,
        target_tone: 'simple and easy to understand',
      })

      if (response.success) {
        setEditedData({ ...editedData, content: response.simplified_content })
        toast({
          title: 'Content Simplified',
          description: `Reduced from ${response.original_length} to ${response.simplified_length} characters`,
        })
      }
    } catch (err) {
      toast({
        title: 'Simplification Failed',
        description: 'Failed to simplify content. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSimplifying(false)
    }
  }

  const handleCreate = async (status: 'draft' | 'published') => {
    if (!editedData) return

    setCreating(true)
    try {
      await adminBlogApi.createFromGenerated({
        generated_data: editedData,
        category_id: selectedCategoryId === 'none' ? undefined : selectedCategoryId,
        tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        status,
      })

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['admin-blogs'] })

      toast({
        title: status === 'published' ? 'Blog Published' : 'Blog Saved as Draft',
        description: 'Your blog has been created successfully.',
      })

      router.push('/admin/blogs')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create blog'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  const handleClear = () => {
    setUrl('')
    setPrompt('')
    setTargetTone('default')
    setTargetLength('default')
    setSelectedCategoryId('none')
    setGeneratedData(null)
    setEditedData(null)
    setWarnings([])
    setError(null)
    setEditMode(false)
    setImageOptions([])
    setImageSearchQuery('')
  }

  const updateField = (field: keyof GeneratedBlogResponse, value: string | string[]) => {
    if (editedData) {
      setEditedData({ ...editedData, [field]: value })
    }
  }

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  return (
    <div className="space-y-6">
      {/* Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Blog Generator
          </CardTitle>
          <CardDescription>
            Generate SEO-friendly blog content from a URL or prompt using AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL Input (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="url" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Source URL (Optional)
            </Label>
            <Input
              id="url"
              placeholder="https://example.com/article-to-reference"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Optionally provide a URL to scrape content from for inspiration
            </p>
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Blog Prompt {!url.trim() && '*'}
            </Label>
            <Textarea
              id="prompt"
              placeholder="Write a comprehensive guide about career tips for freshers in the IT industry..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {url.trim()
                ? 'Optional: Add specific instructions for how to transform the URL content. Leave empty for auto-generation.'
                : 'Describe what you want the blog to be about. Be specific for better results.'}
            </p>
          </div>

          {/* Options Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tone Selection */}
            <div className="space-y-2">
              <Label>Writing Tone</Label>
              <Select value={targetTone} onValueChange={setTargetTone} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Length Selection */}
            <div className="space-y-2">
              <Label>Blog Length</Label>
              <Select value={targetLength} onValueChange={setTargetLength} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  {LENGTH_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleGenerate} disabled={loading || (!url.trim() && !prompt.trim())}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Blog
                </>
              )}
            </Button>
            {(generatedData || url || prompt) && (
              <Button variant="outline" onClick={handleClear} disabled={loading}>
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Warnings Display */}
      {warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warnings</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Generated Content */}
      {editedData && (
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Generated Content</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode(!editMode)}
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    {editMode ? 'View Mode' : 'Edit Mode'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSimplifyContent}
                    disabled={simplifying}
                  >
                    {simplifying ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="mr-2 h-4 w-4" />
                    )}
                    Simplify
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label>Title</Label>
                  {editMode ? (
                    <Input
                      value={editedData.title}
                      onChange={(e) => updateField('title', e.target.value)}
                    />
                  ) : (
                    <h2 className="text-xl font-semibold">{editedData.title}</h2>
                  )}
                </div>

                {/* Excerpt */}
                <div className="space-y-2">
                  <Label>Excerpt</Label>
                  {editMode ? (
                    <Textarea
                      value={editedData.excerpt}
                      onChange={(e) => updateField('excerpt', e.target.value)}
                      rows={2}
                    />
                  ) : (
                    <p className="text-muted-foreground">{editedData.excerpt}</p>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label>Content</Label>
                  {editMode ? (
                    <RichTextEditor
                      content={editedData.content}
                      onChange={(value) => updateField('content', value)}
                    />
                  ) : (
                    <div
                      className="prose prose-sm max-w-none border rounded-md p-4 max-h-[500px] overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: editedData.content }}
                    />
                  )}
                </div>

                {/* Source URL */}
                {editedData.source_url && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link2 className="h-4 w-4" />
                    <span>Source:</span>
                    <a
                      href={editedData.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline flex items-center gap-1"
                    >
                      {editedData.source_url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Featured Image
                </CardTitle>
                <CardDescription>
                  Select a free image from Unsplash or search for a specific image
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Featured Image */}
                {editedData.featured_image && (
                  <div className="space-y-2">
                    <Label>Current Featured Image</Label>
                    <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden border">
                      <Image
                        src={editedData.featured_image}
                        alt="Featured"
                        className="object-cover w-full h-full"
                        fill
                        unoptimized
                      />
                    </div>
                  </div>
                )}

                {/* Image Search */}
                <div className="space-y-2">
                  <Label>Search Images</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search for images..."
                      value={imageSearchQuery}
                      onChange={(e) => setImageSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchImages()}
                    />
                    <Button onClick={handleSearchImages} disabled={searchingImages}>
                      {searchingImages ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Image Options */}
                {imageOptions.length > 0 && (
                  <div className="space-y-2">
                    <Label>Available Images</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {imageOptions.map((image) => (
                        <button
                          key={image.id}
                          onClick={() => handleSelectImage(image)}
                          className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:border-primary ${
                            editedData.featured_image === image.url
                              ? 'border-primary ring-2 ring-primary/50'
                              : 'border-transparent'
                          }`}
                        >
                          <Image
                            src={image.thumb_url}
                            alt={image.alt_text}
                            className="object-cover w-full h-full"
                            fill
                            unoptimized
                          />
                          {editedData.featured_image === image.url && (
                            <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                            {image.photographer}
                          </div>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Images provided by{' '}
                      <a
                        href="https://unsplash.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        Unsplash
                      </a>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SEO & Meta Information</CardTitle>
                <CardDescription>
                  Optimize your blog for search engines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Slug */}
                <div className="space-y-2">
                  <Label>URL Slug</Label>
                  <Input
                    value={editedData.slug}
                    onChange={(e) => updateField('slug', e.target.value)}
                    placeholder="url-friendly-slug"
                  />
                </div>

                {/* Meta Title */}
                <div className="space-y-2">
                  <Label>Meta Title</Label>
                  <Input
                    value={editedData.meta_title}
                    onChange={(e) => updateField('meta_title', e.target.value)}
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">
                    {editedData.meta_title.length}/60 characters
                  </p>
                </div>

                {/* Meta Description */}
                <div className="space-y-2">
                  <Label>Meta Description</Label>
                  <Textarea
                    value={editedData.meta_description}
                    onChange={(e) => updateField('meta_description', e.target.value)}
                    maxLength={155}
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    {editedData.meta_description.length}/155 characters
                  </p>
                </div>

                {/* Meta Keywords */}
                <div className="space-y-2">
                  <Label>Meta Keywords</Label>
                  <Input
                    value={editedData.meta_keywords}
                    onChange={(e) => updateField('meta_keywords', e.target.value)}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>

                {/* Suggested Tags */}
                {editedData.suggested_tags && editedData.suggested_tags.length > 0 && (
                  <div className="space-y-2">
                    <Label>AI Suggested Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {editedData.suggested_tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Existing Tags Selection */}
                {tags.length > 0 && (
                  <div className="space-y-2">
                    <Label>Select Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant={selectedTagIds.includes(tag.id) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => handleTagToggle(tag.id)}
                        >
                          {tag.name}
                          {selectedTagIds.includes(tag.id) && (
                            <Check className="ml-1 h-3 w-3" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Google Preview */}
                <div className="space-y-2">
                  <Label>Google Search Preview</Label>
                  <div className="border rounded-lg p-4 bg-white">
                    <p className="text-blue-600 text-lg hover:underline cursor-pointer truncate">
                      {editedData.meta_title || editedData.title}
                    </p>
                    <p className="text-green-700 text-sm">
                      yourdomain.com/blog/{editedData.slug}
                    </p>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {editedData.meta_description || editedData.excerpt}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Action Buttons */}
      {editedData && (
        <Card>
          <CardContent className="flex justify-end gap-2 pt-6">
            <Button
              variant="outline"
              onClick={() => handleCreate('draft')}
              disabled={creating}
            >
              {creating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save as Draft
            </Button>
            <Button onClick={() => handleCreate('published')} disabled={creating}>
              {creating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Publish Now
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
