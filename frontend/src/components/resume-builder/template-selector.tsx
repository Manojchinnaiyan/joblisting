'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { FileText, Star, Sparkles, Check, Loader2, Search, ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
} from '@/types/resume-builder'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface TemplateSelectorProps {
  value: ResumeTemplate
  onChange: (template: ResumeTemplate) => void
  primaryColor?: string
}

// Individual template preview thumbnail
function TemplateThumbnail({
  template,
  color,
  isSelected,
  onClick
}: {
  template: ResumeTemplate
  color: string
  isSelected: boolean
  onClick: () => void
}) {
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

  const templateInfo = TEMPLATE_OPTIONS.find(t => t.value === template)

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative group rounded-lg overflow-hidden border-2 transition-all',
        'hover:shadow-lg hover:scale-[1.02]',
        isSelected
          ? 'border-primary ring-2 ring-primary/30'
          : 'border-transparent hover:border-primary/50'
      )}
    >
      {/* Preview */}
      <div className="aspect-[8.5/11] bg-gray-100 relative overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error || !pdfUrl ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
          </div>
        ) : (
          <iframe
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            className="w-full h-full border-0 pointer-events-none"
            title={`${template} preview`}
          />
        )}

        {/* Selected overlay */}
        {isSelected && (
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <Check className="h-5 w-5 text-white" />
            </div>
          </div>
        )}

        {/* Badges */}
        {templateInfo && (templateInfo.isPopular || templateInfo.isNew) && (
          <div className="absolute top-1 left-1 flex flex-col gap-0.5">
            {templateInfo.isPopular && (
              <Badge className="bg-yellow-500 text-white text-[8px] px-1 py-0">
                <Star className="h-2 w-2 mr-0.5" />
                Popular
              </Badge>
            )}
            {templateInfo.isNew && (
              <Badge className="bg-green-500 text-white text-[8px] px-1 py-0">
                <Sparkles className="h-2 w-2 mr-0.5" />
                New
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Label */}
      <div className="p-1.5 bg-white dark:bg-gray-900">
        <p className={cn(
          'text-xs font-medium truncate',
          isSelected ? 'text-primary' : 'text-foreground'
        )}>
          {templateInfo?.label || template}
        </p>
      </div>
    </button>
  )
}

export function TemplateSelector({ value, onChange, primaryColor = '#2563eb' }: TemplateSelectorProps) {
  const [open, setOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const currentTemplate = TEMPLATE_OPTIONS.find(t => t.value === value)

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

  const handleSelect = (template: ResumeTemplate) => {
    onChange(template)
    setOpen(false)
  }

  return (
    <>
      {/* Trigger Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full justify-between h-auto py-2"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-6 bg-muted rounded flex-shrink-0 flex items-center justify-center">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-left min-w-0">
            <p className="font-medium text-sm flex items-center gap-1">
              {currentTemplate?.label || 'Select Template'}
              {currentTemplate?.isPopular && <Star className="h-3 w-3 text-yellow-500" />}
              {currentTemplate?.isNew && <Sparkles className="h-3 w-3 text-green-500" />}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {currentTemplate?.description || 'Choose a template design'}
            </p>
          </div>
        </div>
        <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" />
      </Button>

      {/* Template Selection Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Choose a Template</DialogTitle>
          </DialogHeader>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 py-2">
            {/* Category filters */}
            <div className="flex flex-wrap gap-1 flex-1">
              {TEMPLATE_CATEGORIES.map((category) => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                  className="text-xs h-7"
                >
                  {category.label}
                </Button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 h-7 text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Results count */}
          <p className="text-xs text-muted-foreground">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
          </p>

          {/* Template Grid */}
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 py-2">
                {filteredTemplates.map((template) => (
                  <TemplateThumbnail
                    key={template.value}
                    template={template.value}
                    color={primaryColor}
                    isSelected={value === template.value}
                    onClick={() => handleSelect(template.value)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No templates found</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
