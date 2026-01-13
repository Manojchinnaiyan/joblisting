'use client'

import { useState, useEffect, memo, useCallback, useRef } from 'react'
import { pdf } from '@react-pdf/renderer'
import { Download, Loader2, Maximize2, X, ZoomIn, ZoomOut, RotateCcw, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { ResumeDocument } from './templates'

// PDF base dimensions (A4 at 72 DPI)
const PDF_BASE_WIDTH = 595
const PDF_BASE_HEIGHT = 842

interface PDFRendererProps {
  data: ResumeData
  settings: ResumeSettings
  showPreview: boolean
}

function PDFRendererComponent({ data, settings, showPreview }: PDFRendererProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [zoom, setZoom] = useState(80) // Zoom for regular preview (auto-updated on resize)
  const [fullscreenZoom, setFullscreenZoom] = useState(100) // Manual zoom for fullscreen
  const [error, setError] = useState<string | null>(null)
  const previousUrlRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileName = `${data.personalInfo.firstName || 'My'}_${data.personalInfo.lastName || 'Resume'}_Resume.pdf`

  // Auto-adjust zoom based on container width when resizing
  useEffect(() => {
    if (!containerRef.current || !showPreview) return

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
  }, [showPreview])

  // Generate PDF blob URL for preview
  const generatePdfPreview = useCallback(async () => {
    if (!showPreview) return

    setIsGenerating(true)
    setError(null)

    try {
      const blob = await pdf(<ResumeDocument data={data} settings={settings} />).toBlob()
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
  }, [data, settings, showPreview])

  // Generate preview when data/settings change (debounced)
  useEffect(() => {
    if (!showPreview) {
      // Clean up URL when preview is hidden
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current)
        previousUrlRef.current = null
        setPdfBlobUrl(null)
      }
      return
    }

    const timeoutId = setTimeout(() => {
      generatePdfPreview()
    }, 500) // Debounce by 500ms to avoid too many regenerations

    return () => clearTimeout(timeoutId)
  }, [data, settings, showPreview, generatePdfPreview])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current)
      }
    }
  }, [])

  // Detect mobile browsers (iOS Safari, Android Chrome, etc.)
  const isMobileBrowser = useCallback(() => {
    if (typeof window === 'undefined') return false
    const ua = window.navigator.userAgent
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  }, [])

  const handleDownload = useCallback(async () => {
    setIsDownloading(true)
    try {
      const blob = await pdf(<ResumeDocument data={data} settings={settings} />).toBlob()

      // For mobile browsers, open in new tab since download attribute often doesn't work
      // User can then use native share/save functionality
      if (isMobileBrowser()) {
        const url = URL.createObjectURL(blob)
        // Open PDF in new tab - mobile browsers will show native PDF viewer with save options
        window.open(url, '_blank')
        // Don't revoke immediately, let the new tab load
        setTimeout(() => URL.revokeObjectURL(url), 10000)
        // Show toast with instructions
        toast.info('PDF opened in new tab. Use the Share button or menu to save the file.', {
          duration: 5000,
        })
      } else {
        // Standard download for desktop browsers
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Download failed:', err)
      toast.error('Failed to generate PDF. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }, [data, settings, fileName, isMobileBrowser])

  const handleRefresh = useCallback(() => {
    generatePdfPreview()
  }, [generatePdfPreview])

  // Calculate scaled dimensions for regular preview
  const scaledWidth = PDF_BASE_WIDTH * (zoom / 100)
  const scaledHeight = PDF_BASE_HEIGHT * (zoom / 100)

  // Calculate scaled dimensions for fullscreen manual zoom
  const fullscreenScaledWidth = PDF_BASE_WIDTH * (fullscreenZoom / 100)

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
            title="Resume Preview"
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

  // Fullscreen preview - with manual zoom controls
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
          className="h-full overflow-auto flex justify-center items-start p-2 sm:p-4"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div
            className="bg-white shadow-lg rounded flex-shrink-0 mx-auto"
            style={{
              width: `min(${fullscreenScaledWidth}px, calc(100vw - 32px))`,
              aspectRatio: `${PDF_BASE_WIDTH} / ${PDF_BASE_HEIGHT}`,
              maxWidth: `${fullscreenScaledWidth}px`,
            }}
          >
            <iframe
              src={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-full rounded"
              style={{ border: 'none' }}
              title="Resume Preview"
            />
          </div>
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
        Scroll to see full resume
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
      {showPreview && (
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
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFullscreen(false)
          }}
        >
          <div
            className="bg-gray-100 rounded-xl sm:rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl overflow-hidden"
            style={{
              maxHeight: '95vh',
              height: '95vh',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-100 shrink-0">
              <h3 className="font-semibold text-sm truncate">Resume Preview</h3>
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

// Memoize the component to prevent re-renders when props haven't changed
const PDFRenderer = memo(PDFRendererComponent, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
    JSON.stringify(prevProps.settings) === JSON.stringify(nextProps.settings) &&
    prevProps.showPreview === nextProps.showPreview
  )
})

export default PDFRenderer
