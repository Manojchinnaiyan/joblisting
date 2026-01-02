'use client'

import { useState, useEffect, memo, useMemo } from 'react'
import { PDFDownloadLink, PDFViewer, pdf } from '@react-pdf/renderer'
import { Download, Loader2, Maximize2, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { ResumeDocument } from './templates'

interface PDFRendererProps {
  data: ResumeData
  settings: ResumeSettings
  showPreview: boolean
}

function PDFRendererComponent({ data, settings, showPreview }: PDFRendererProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [zoom, setZoom] = useState(100)
  const fileName = `${data.personalInfo.firstName || 'My'}_${data.personalInfo.lastName || 'Resume'}_Resume.pdf`

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Generate PDF blob URL for mobile fullscreen
  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    const generatePreview = async () => {
      if (!isFullscreen || !isMobile) {
        if (pdfBlobUrl) {
          URL.revokeObjectURL(pdfBlobUrl)
          setPdfBlobUrl(null)
        }
        return
      }

      setIsGeneratingPreview(true)
      setZoom(100)

      try {
        const blob = await pdf(<ResumeDocument data={data} settings={settings} />).toBlob()
        if (!cancelled) {
          objectUrl = URL.createObjectURL(blob)
          setPdfBlobUrl(objectUrl)
        }
      } catch (error) {
        console.error('Failed to generate PDF preview:', error)
      } finally {
        if (!cancelled) {
          setIsGeneratingPreview(false)
        }
      }
    }

    generatePreview()

    return () => {
      cancelled = true
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [isFullscreen, isMobile, data, settings])

  return (
    <>
      {/* Download Button */}
      <div className="flex justify-end mb-4 gap-2">
        <PDFDownloadLink
          document={<ResumeDocument data={data} settings={settings} />}
          fileName={fileName}
        >
          {({ loading }) => (
            <Button size="sm" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download PDF
            </Button>
          )}
        </PDFDownloadLink>
      </div>

      {/* PDF Preview */}
      {showPreview && (
        <Card className="overflow-hidden">
          <CardContent className="p-0 relative">
            {/* Fullscreen button - visible on mobile/tablet */}
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 z-10 lg:hidden shadow-md"
              onClick={() => setIsFullscreen(true)}
            >
              <Maximize2 className="h-4 w-4 mr-1" />
              Fullscreen
            </Button>
            <div className="h-[500px] sm:h-[600px] md:h-[800px] w-full bg-gray-100 pdf-viewer-container">
              <PDFViewer width="100%" height="100%" showToolbar={false}>
                <ResumeDocument data={data} settings={settings} />
              </PDFViewer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col pdf-fullscreen-modal">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-white shrink-0">
            <h3 className="font-semibold text-sm truncate">Resume Preview</h3>
            <div className="flex items-center gap-2">
              <PDFDownloadLink
                document={<ResumeDocument data={data} settings={settings} />}
                fileName={fileName}
              >
                {({ loading }) => (
                  <Button size="sm" disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span className="ml-2">Download</span>
                  </Button>
                )}
              </PDFDownloadLink>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 min-h-0 bg-gray-100 pdf-viewer-container">
            {isMobile ? (
              /* Mobile: Use iframe with blob URL */
              <div className="h-full flex flex-col bg-gray-100">
                {isGeneratingPreview ? (
                  <div className="flex-1 flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Generating preview...</p>
                    </div>
                  </div>
                ) : pdfBlobUrl ? (
                  <div
                    className="flex-1 overflow-auto bg-gray-100"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                  >
                    <div
                      className="flex justify-center p-4"
                      style={{
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: 'top center',
                        transition: 'transform 0.2s ease-out',
                      }}
                    >
                      <iframe
                        src={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                        className="bg-white shadow-lg rounded"
                        style={{
                          width: '595px',
                          height: '842px',
                          border: 'none',
                        }}
                        title="Resume Preview"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground bg-gray-100">
                    <p>Unable to load preview</p>
                  </div>
                )}

                {/* Zoom Controls for Mobile */}
                <div className="shrink-0 p-3 pb-6 bg-white border-t shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setZoom((z) => Math.max(50, z - 15))}
                      disabled={zoom <= 50}
                      className="h-10 w-10"
                    >
                      <ZoomOut className="h-5 w-5" />
                    </Button>
                    <span className="text-sm font-medium w-14 text-center bg-gray-100 py-1 px-2 rounded">
                      {zoom}%
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setZoom((z) => Math.min(150, z + 15))}
                      disabled={zoom >= 150}
                      className="h-10 w-10"
                    >
                      <ZoomIn className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setZoom(100)}
                      disabled={zoom === 100}
                      className="h-10 w-10"
                    >
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Scroll to see full resume
                  </p>
                </div>
              </div>
            ) : (
              /* Desktop: Use PDFViewer */
              <PDFViewer
                width="100%"
                height="100%"
                showToolbar={false}
                style={{ border: 'none' }}
              >
                <ResumeDocument data={data} settings={settings} />
              </PDFViewer>
            )}
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
