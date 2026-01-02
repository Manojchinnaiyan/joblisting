'use client'

import { useState, useEffect, lazy, Suspense, memo } from 'react'
import { Loader2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'

// Lazy load the PDF renderer component
const PDFRenderer = lazy(() => import('./pdf-renderer'))

interface ResumePreviewProps {
  data: ResumeData
  settings: ResumeSettings
}

const LoadingState = () => (
  <div className="h-[500px] sm:h-[600px] md:h-[800px] w-full bg-gray-100 flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">Loading PDF renderer...</p>
    </div>
  </div>
)

function ResumePreviewComponent({ data, settings }: ResumePreviewProps) {
  const [showPreview, setShowPreview] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-semibold">Preview</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled className="flex-1 sm:flex-none">
              <Eye className="mr-2 h-4 w-4" />
              Show Preview
            </Button>
            <Button size="sm" disabled className="flex-1 sm:flex-none">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </Button>
          </div>
        </div>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <LoadingState />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-lg font-semibold">Preview</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="flex-1 sm:flex-none">
            <Eye className="mr-2 h-4 w-4" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
        </div>
      </div>

      <Suspense fallback={<LoadingState />}>
        <PDFRenderer data={data} settings={settings} showPreview={showPreview} />
      </Suspense>
    </div>
  )
}

// Memoize to prevent re-renders when data/settings haven't changed
export const ResumePreview = memo(ResumePreviewComponent, (prevProps, nextProps) => {
  return (
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
    JSON.stringify(prevProps.settings) === JSON.stringify(nextProps.settings)
  )
})
