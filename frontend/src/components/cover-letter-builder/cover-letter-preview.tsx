'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Loader2, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import type { CoverLetterData, CoverLetterSettings } from '@/types/cover-letter'

// Dynamically import PDF components to avoid SSR issues
const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
  { ssr: false, loading: () => <PreviewLoader /> }
)

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false }
)

const CoverLetterDocument = dynamic(
  () => import('./templates').then((mod) => mod.CoverLetterDocument),
  { ssr: false }
)

function PreviewLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}

interface CoverLetterPreviewProps {
  data: CoverLetterData
  settings: CoverLetterSettings
}

export function CoverLetterPreview({ data, settings }: CoverLetterPreviewProps) {
  const [zoom, setZoom] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 10, 150))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 10, 50))
  }, [])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev)
  }, [])

  const fileName = `cover-letter-${data.companyName || 'document'}.pdf`
    .toLowerCase()
    .replace(/\s+/g, '-')

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'h-full'}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoom <= 50}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[4rem] text-center">{zoom}%</span>
          <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoom >= 150}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <PDFDownloadLink
            document={<CoverLetterDocument data={data} settings={settings} />}
            fileName={fileName}
          >
            {({ loading }) => (
              <Button variant="outline" size="sm" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download PDF
              </Button>
            )}
          </PDFDownloadLink>
          <Button variant="outline" size="icon" onClick={toggleFullscreen}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto bg-muted/30 p-4">
        <div
          className="mx-auto"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            width: 'fit-content',
          }}
        >
          <PDFViewer
            width={595}
            height={842}
            showToolbar={false}
            className="shadow-lg"
          >
            <CoverLetterDocument data={data} settings={settings} />
          </PDFViewer>
        </div>
      </div>
    </div>
  )
}
