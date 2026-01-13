'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Download, ZoomIn, ZoomOut, Maximize2, X, RotateCcw, RefreshCw } from 'lucide-react'
import type { CoverLetterData, CoverLetterSettings } from '@/types/cover-letter'

// PDF base dimensions (US Letter at 72 DPI)
const PDF_BASE_WIDTH = 612
const PDF_BASE_HEIGHT = 792

interface CoverLetterPreviewProps {
  data: CoverLetterData
  settings: CoverLetterSettings
}

export function CoverLetterPreview({ data, settings }: CoverLetterPreviewProps) {
  const [zoom, setZoom] = useState(80) // Auto-updated on resize
  const [fullscreenZoom, setFullscreenZoom] = useState(100) // Manual zoom for fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const previousUrlRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const fileName = `cover-letter-${data.companyName || 'document'}.pdf`
    .toLowerCase()
    .replace(/\s+/g, '-')

  // Auto-adjust zoom based on container width
  useEffect(() => {
    if (!containerRef.current) return

    const updateZoomFromContainer = () => {
      if (!containerRef.current) return
      const containerWidth = containerRef.current.offsetWidth
      // Calculate zoom to fit PDF width with some padding (32px total)
      const availableWidth = containerWidth - 32
      const calculatedZoom = Math.min(Math.max((availableWidth / PDF_BASE_WIDTH) * 100, 50), 150)
      setZoom(Math.round(calculatedZoom))
    }

    // Initial calculation
    updateZoomFromContainer()

    const resizeObserver = new ResizeObserver(() => {
      updateZoomFromContainer()
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  // Generate PDF blob URL for preview
  const generatePdfPreview = useCallback(async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const { pdf } = await import('@react-pdf/renderer')
      const { CoverLetterDocument } = await import('./templates')

      const blob = await pdf(<CoverLetterDocument data={data} settings={settings} />).toBlob()
      const newUrl = URL.createObjectURL(blob)

      // Revoke the previous URL to free memory
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current)
      }

      previousUrlRef.current = newUrl
      setPdfBlobUrl(newUrl)
    } catch (err) {
      console.error('Failed to generate PDF preview:', err)
      setError('Failed to generate preview. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }, [data, settings])

  // Generate preview when data/settings change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      generatePdfPreview()
    }, 500) // Debounce by 500ms

    return () => clearTimeout(timeoutId)
  }, [data, settings, generatePdfPreview])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current)
      }
    }
  }, [])

  const handleDownload = useCallback(async () => {
    setIsDownloading(true)
    try {
      const { pdf } = await import('@react-pdf/renderer')
      const { CoverLetterDocument: Doc } = await import('./templates')

      const blob = await pdf(<Doc data={data} settings={settings} />).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setIsDownloading(false)
    }
  }, [data, settings, fileName])

  const handleRefresh = useCallback(() => {
    generatePdfPreview()
  }, [generatePdfPreview])

  // Calculate scaled dimensions
  const scaledWidth = PDF_BASE_WIDTH * (zoom / 100)
  const scaledHeight = PDF_BASE_HEIGHT * (zoom / 100)
  const fullscreenScaledWidth = PDF_BASE_WIDTH * (fullscreenZoom / 100)
  const fullscreenScaledHeight = PDF_BASE_HEIGHT * (fullscreenZoom / 100)

  const PreviewContent = () => (
    <div
      ref={containerRef}
      className="w-full bg-gray-100 flex flex-col h-[500px] sm:h-[600px] md:h-[700px]"
    >
      {isGenerating ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Generating preview...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-destructive mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      ) : pdfBlobUrl ? (
        <div
          className="flex-1 overflow-auto flex justify-center items-start p-4"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <iframe
            src={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="bg-white shadow-lg rounded flex-shrink-0"
            style={{
              width: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
              border: 'none',
              transition: 'width 0.2s ease-out, height 0.2s ease-out',
            }}
            title="Cover Letter Preview"
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-sm mb-2">Click to generate preview</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate Preview
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  const FullscreenPreviewContent = () => (
    <div className="flex-1 overflow-auto bg-gray-100">
      {isGenerating ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Generating preview...</p>
          </div>
        </div>
      ) : error ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-destructive mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      ) : pdfBlobUrl ? (
        <div
          className="h-full overflow-auto flex justify-center p-2 sm:p-4"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <iframe
            src={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="bg-white shadow-lg rounded"
            style={{
              width: `${fullscreenScaledWidth}px`,
              height: `${fullscreenScaledHeight}px`,
              border: 'none',
              transition: 'width 0.2s ease-out, height 0.2s ease-out',
            }}
            title="Cover Letter Preview"
          />
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-sm mb-2">Click to generate preview</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate Preview
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  const ZoomControls = () => (
    <div className="shrink-0 p-3 pb-6 bg-gray-100 border-t border-gray-200">
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setFullscreenZoom((z) => Math.max(50, z - 15))}
          disabled={fullscreenZoom <= 50}
          className="h-10 w-10"
        >
          <ZoomOut className="h-5 w-5" />
        </Button>
        <span className="text-sm font-medium w-14 text-center bg-white py-1 px-2 rounded">
          {fullscreenZoom}%
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setFullscreenZoom((z) => Math.min(150, z + 15))}
          disabled={fullscreenZoom >= 150}
          className="h-10 w-10"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setFullscreenZoom(100)}
          disabled={fullscreenZoom === 100}
          className="h-10 w-10"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isGenerating}
          className="h-10 w-10"
        >
          <RefreshCw className={`h-5 w-5 ${isGenerating ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-2">
        Scroll to see full document
      </p>
    </div>
  )

  return (
    <>
      {/* Download Button */}
      <div className="flex justify-end mb-4 gap-2">
        <Button size="sm" onClick={handleDownload} disabled={isDownloading}>
          {isDownloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Download PDF
        </Button>
      </div>

      {/* PDF Preview */}
      <Card className="overflow-hidden">
        <CardContent className="p-0 relative flex flex-col">
          {/* Fullscreen button */}
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-2 right-2 z-10 shadow-md"
            onClick={() => setIsFullscreen(true)}
          >
            <Maximize2 className="h-4 w-4 mr-1" />
            Fullscreen
          </Button>
          <PreviewContent />
          {/* Zoom Controls */}
          <div className="shrink-0 p-2 sm:p-3 bg-white border-t">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setZoom((z) => Math.max(50, z - 15))}
                disabled={zoom <= 50}
                className="h-8 w-8 sm:h-9 sm:w-9"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs sm:text-sm font-medium w-12 text-center bg-gray-100 py-1 px-2 rounded">
                {zoom}%
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setZoom((z) => Math.min(150, z + 15))}
                disabled={zoom >= 150}
                className="h-8 w-8 sm:h-9 sm:w-9"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setZoom(100)}
                disabled={zoom === 100}
                className="h-8 w-8 sm:h-9 sm:w-9"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isGenerating}
                className="h-8 w-8 sm:h-9 sm:w-9"
              >
                <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFullscreen(false)
          }}
        >
          <div
            className="bg-gray-100 rounded-2xl shadow-2xl flex flex-col my-auto overflow-hidden"
            style={{
              width: `min(${Math.max(fullscreenScaledWidth + 48, 400)}px, 95vw)`,
              maxHeight: '95vh',
              transition: 'width 0.2s ease-out',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-100 shrink-0">
              <h3 className="font-semibold text-sm truncate">Cover Letter Preview</h3>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleDownload} disabled={isDownloading}>
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Download</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFullscreen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 min-h-0 bg-gray-100 flex flex-col overflow-hidden">
              <FullscreenPreviewContent />
              <ZoomControls />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
