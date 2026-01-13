'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, FileText, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { parseResumeFile } from '@/lib/resume-parser'
import type { ResumeData } from '@/types/resume-builder'

interface ResumeUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDataParsed: (data: ResumeData) => void
}

type UploadState = 'idle' | 'uploading' | 'parsing' | 'success' | 'error'

export function ResumeUploadDialog({ open, onOpenChange, onDataParsed }: ResumeUploadDialogProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [fileName, setFileName] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [parsedData, setParsedData] = useState<ResumeData | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetState = useCallback(() => {
    setUploadState('idle')
    setProgress(0)
    setErrorMessage('')
    setFileName('')
    setParsedData(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const processFile = useCallback(async (file: File) => {
    // Validate file type
    if (!file.type.includes('pdf')) {
      setUploadState('error')
      setErrorMessage('Please upload a PDF file. Other formats are not supported yet.')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadState('error')
      setErrorMessage('File size must be less than 10MB.')
      return
    }

    setFileName(file.name)
    setUploadState('uploading')
    setProgress(20)

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 60))
    }, 100)

    try {
      setUploadState('parsing')
      clearInterval(progressInterval)
      setProgress(70)

      const data = await parseResumeFile(file)

      setProgress(100)
      setParsedData(data)
      setUploadState('success')
    } catch (error) {
      clearInterval(progressInterval)
      console.error('Failed to parse resume:', error)
      setUploadState('error')
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to parse resume. Please try a different file.'
      )
    }
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        processFile(file)
      }
    },
    [processFile]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const file = e.dataTransfer.files?.[0]
      if (file) {
        processFile(file)
      }
    },
    [processFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleApply = useCallback(() => {
    if (parsedData) {
      onDataParsed(parsedData)
      onOpenChange(false)
      resetState()
    }
  }, [parsedData, onDataParsed, onOpenChange, resetState])

  const handleClose = useCallback(() => {
    onOpenChange(false)
    // Reset state after animation
    setTimeout(resetState, 200)
  }, [onOpenChange, resetState])

  // Summary of parsed data
  const getParsedSummary = () => {
    if (!parsedData) return null

    const items = []
    if (parsedData.personalInfo.firstName || parsedData.personalInfo.lastName) {
      items.push(`Name: ${parsedData.personalInfo.firstName} ${parsedData.personalInfo.lastName}`.trim())
    }
    if (parsedData.personalInfo.email) {
      items.push(`Email: ${parsedData.personalInfo.email}`)
    }
    if (parsedData.experience.length > 0) {
      items.push(`${parsedData.experience.length} work experience${parsedData.experience.length > 1 ? 's' : ''}`)
    }
    if (parsedData.education.length > 0) {
      items.push(`${parsedData.education.length} education entr${parsedData.education.length > 1 ? 'ies' : 'y'}`)
    }
    if (parsedData.skills.length > 0) {
      items.push(`${parsedData.skills.length} skill${parsedData.skills.length > 1 ? 's' : ''}`)
    }
    if (parsedData.certifications.length > 0) {
      items.push(`${parsedData.certifications.length} certification${parsedData.certifications.length > 1 ? 's' : ''}`)
    }

    return items
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Existing Resume</DialogTitle>
          <DialogDescription>
            Upload your resume to automatically fill in the form fields.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {uploadState === 'idle' && (
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                isDragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="font-medium mb-1">Drop your resume here</p>
              <p className="text-sm text-muted-foreground mb-3">or click to browse</p>
              <p className="text-xs text-muted-foreground">Supports PDF files up to 10MB</p>
            </div>
          )}

          {(uploadState === 'uploading' || uploadState === 'parsing') && (
            <div className="text-center py-8">
              <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin mb-4" />
              <p className="font-medium mb-2">
                {uploadState === 'uploading' ? 'Uploading...' : 'Parsing resume...'}
              </p>
              {fileName && (
                <p className="text-sm text-muted-foreground mb-4">{fileName}</p>
              )}
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {uploadState === 'success' && parsedData && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-green-600">
                <CheckCircle2 className="h-8 w-8" />
                <div>
                  <p className="font-medium">Resume parsed successfully!</p>
                  <p className="text-sm text-muted-foreground">{fileName}</p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Extracted data:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {getParsedSummary()?.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-muted-foreground">
                Note: Auto-parsing may not capture all details perfectly. You can edit the form after importing.
              </p>

              <div className="flex gap-2">
                <Button variant="outline" onClick={resetState} className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Upload Different
                </Button>
                <Button onClick={handleApply} className="flex-1">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Apply Data
                </Button>
              </div>
            </div>
          )}

          {uploadState === 'error' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-8 w-8" />
                <div>
                  <p className="font-medium">Failed to parse resume</p>
                  <p className="text-sm text-muted-foreground">{errorMessage}</p>
                </div>
              </div>

              <Button variant="outline" onClick={resetState} className="w-full">
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
