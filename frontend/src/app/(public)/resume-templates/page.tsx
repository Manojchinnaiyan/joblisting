'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, Plus, Upload, Star, Sparkles, ArrowRight, Search, Filter, Eye, Download, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  TEMPLATE_OPTIONS,
  TEMPLATE_CATEGORIES,
  SAMPLE_RESUME_DATA,
  DEFAULT_RESUME_SETTINGS,
  type TemplateCategory,
  type ResumeTemplate,
  type ResumeSettings,
  type ResumeData,
} from '@/types/resume-builder'
import { ResumeUploadDialog } from '@/components/resume-builder/resume-upload-dialog'
import { useAuthStore } from '@/store/auth-store'

const TEMPLATES_PER_PAGE = 12

// Template preview component that generates a thumbnail
function TemplatePreview({ template, color }: { template: ResumeTemplate; color: string }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const previousUrlRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const generatePreview = async () => {
      setIsLoading(true)
      setError(false)

      try {
        const { pdf } = await import('@react-pdf/renderer')
        const { ResumeDocument } = await import('@/components/resume-builder/templates')

        const settings: ResumeSettings = {
          ...DEFAULT_RESUME_SETTINGS,
          template,
          primaryColor: color,
        }

        const blob = await pdf(<ResumeDocument data={SAMPLE_RESUME_DATA} settings={settings} />).toBlob()

        if (!cancelled) {
          const url = URL.createObjectURL(blob)

          if (previousUrlRef.current) {
            URL.revokeObjectURL(previousUrlRef.current)
          }

          previousUrlRef.current = url
          setPdfUrl(url)
        }
      } catch (err) {
        console.error('Failed to generate preview:', err)
        if (!cancelled) {
          setError(true)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    generatePreview()

    return () => {
      cancelled = true
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current)
      }
    }
  }, [template, color])

  if (isLoading) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !pdfUrl) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">Preview</p>
        </div>
      </div>
    )
  }

  return (
    <iframe
      src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
      className="w-full h-full border-0"
      title={`${template} template preview`}
    />
  )
}

// Template card component
function TemplateCard({
  template,
  onSelect,
  onPreview,
}: {
  template: typeof TEMPLATE_OPTIONS[0]
  onSelect: (template: ResumeTemplate) => void
  onPreview: (template: ResumeTemplate) => void
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-300 overflow-hidden',
        'hover:shadow-xl hover:scale-[1.02] hover:border-primary/50'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[8.5/11] bg-gray-50 overflow-hidden">
        {/* Preview thumbnail */}
        <div className="absolute inset-0 pointer-events-none">
          <TemplatePreview template={template.value} color="#2563eb" />
        </div>

        {/* Overlay on hover */}
        <div
          className={cn(
            'absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 transition-opacity duration-300',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onSelect(template.value)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Use Template
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation()
              onPreview(template.value)
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {template.isPopular && (
            <Badge className="bg-yellow-500 text-white text-[10px]">
              <Star className="h-3 w-3 mr-1" />
              Popular
            </Badge>
          )}
          {template.isNew && (
            <Badge className="bg-green-500 text-white text-[10px]">
              <Sparkles className="h-3 w-3 mr-1" />
              New
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-sm mb-1">{template.label}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
      </CardContent>
    </Card>
  )
}

export default function ResumeTemplatesPage() {
  const router = useRouter()
  const { isAuthenticated, _hasHydrated } = useAuthStore()
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [previewTemplate, setPreviewTemplate] = useState<ResumeTemplate | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return TEMPLATE_OPTIONS.filter((template) => {
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
      const matchesSearch =
        searchQuery === '' ||
        template.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredTemplates.length / TEMPLATES_PER_PAGE)
  const paginatedTemplates = useMemo(() => {
    const startIndex = (currentPage - 1) * TEMPLATES_PER_PAGE
    return filteredTemplates.slice(startIndex, startIndex + TEMPLATES_PER_PAGE)
  }, [filteredTemplates, currentPage])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, searchQuery])

  // Handle template selection - redirect to builder with template or login
  const handleSelectTemplate = useCallback(
    (template: ResumeTemplate) => {
      // Store selected template in localStorage
      const settings = { ...DEFAULT_RESUME_SETTINGS, template }
      localStorage.setItem('resume-builder-settings', JSON.stringify(settings))

      // If authenticated, go directly to resume builder with template
      if (isAuthenticated) {
        router.push(`/resume-builder?template=${template}`)
      } else {
        // Store the intended redirect URL for after login
        localStorage.setItem('post-login-redirect', `/resume-builder?template=${template}`)
        // Redirect to login
        router.push('/login')
      }
    },
    [router, isAuthenticated]
  )

  // Handle preview
  const handlePreview = useCallback((template: ResumeTemplate) => {
    setPreviewTemplate(template)
  }, [])

  // Close preview
  const closePreview = useCallback(() => {
    setPreviewTemplate(null)
  }, [])

  // Handle uploaded resume data
  const handleResumeUpload = useCallback(
    (data: ResumeData) => {
      // Store parsed data in localStorage
      localStorage.setItem('resume-builder-data', JSON.stringify(data))
      // Redirect to resume builder
      router.push('/resume-builder')
    },
    [router]
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-primary/5 py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Professional Resume Templates
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8">
              Choose from {TEMPLATE_OPTIONS.length}+ professionally designed templates. Create your
              perfect resume in minutes.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/resume-builder">
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Resume
                </Link>
              </Button>
              <Button size="lg" variant="outline" onClick={() => setShowUploadDialog(true)}>
                <Upload className="h-5 w-5 mr-2" />
                Upload Existing Resume
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Category filters */}
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_CATEGORIES.map((category) => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                  className="text-xs sm:text-sm"
                >
                  {category.label}
                </Button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Templates Grid */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4">
          {/* Results count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
              {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
            </p>
          </div>

          {/* Grid */}
          {filteredTemplates.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Create New Card - only on first page */}
                {currentPage === 1 && (
                  <Card
                    className="group cursor-pointer border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all"
                    onClick={() => router.push('/resume-builder')}
                  >
                    <div className="aspect-[8.5/11] flex flex-col items-center justify-center p-6 text-center">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Plus className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">Create My Resume</h3>
                      <p className="text-sm text-muted-foreground">
                        Start from scratch or import your existing resume
                      </p>
                    </div>
                  </Card>
                )}

                {/* Template Cards */}
                {paginatedTemplates.map((template) => (
                  <TemplateCard
                    key={template.value}
                    template={template}
                    onSelect={handleSelectTemplate}
                    onPreview={handlePreview}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and adjacent pages
                      const showPage =
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1

                      // Show ellipsis
                      const showEllipsisBefore = page === currentPage - 2 && currentPage > 3
                      const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2

                      if (showEllipsisBefore || showEllipsisAfter) {
                        return (
                          <span key={page} className="px-2 text-muted-foreground">
                            ...
                          </span>
                        )
                      }

                      if (!showPage) return null

                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          className="w-9 h-9 p-0"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No templates found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filter criteria
              </p>
              <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to build your resume?</h2>
            <p className="text-muted-foreground mb-6">
              Sign up to save your resumes, track applications, and access more features.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Already have an account?</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Preview Modal */}
      {previewTemplate && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">
                {TEMPLATE_OPTIONS.find((t) => t.value === previewTemplate)?.label} Template Preview
              </h3>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => handleSelectTemplate(previewTemplate)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Use This Template
                </Button>
                <Button variant="outline" size="sm" onClick={closePreview}>
                  Close
                </Button>
              </div>
            </div>

            {/* Preview */}
            <div className="flex-1 overflow-auto bg-gray-100 p-4">
              <div className="mx-auto" style={{ width: '595px', height: '842px' }}>
                <TemplatePreview template={previewTemplate} color="#2563eb" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resume Upload Dialog */}
      <ResumeUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onDataParsed={handleResumeUpload}
      />
    </div>
  )
}
