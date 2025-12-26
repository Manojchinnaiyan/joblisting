'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Download, Star, Trash2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useResumes, useUploadResume, useSetPrimaryResume, useDeleteResume } from '@/hooks/use-resumes'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { format } from 'date-fns'
import type { Resume } from '@/types/resume'
import { resumesApi } from '@/lib/api/resumes'
import { toast } from 'sonner'

export default function ResumesPage() {
  const { data: resumes = [], isLoading } = useResumes()
  const uploadResume = useUploadResume()
  const setPrimaryResume = useSetPrimaryResume()
  const deleteResume = useDeleteResume()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    try {
      await uploadResume.mutateAsync({ file, title: file.name.replace(/\.[^/.]+$/, '') })
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleSetPrimary = async (id: string) => {
    await setPrimaryResume.mutateAsync(id)
  }

  const handleDelete = async (id: string) => {
    await deleteResume.mutateAsync(id)
    setDeleteId(null)
  }

  const handleDownload = async (resume: Resume) => {
    try {
      // Fetch the signed download URL from the backend
      const downloadUrl = await resumesApi.getResumeDownloadUrl(resume.id)

      const response = await fetch(downloadUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = resume.file_name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast.error('Failed to download resume')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-muted animate-pulse rounded-lg" />
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resumes</h1>
          <p className="text-muted-foreground mt-1">
            Upload and manage your resumes
          </p>
        </div>
        <Button onClick={handleUploadClick} disabled={uploadResume.isPending}>
          <Upload className="mr-2 h-4 w-4" />
          {uploadResume.isPending ? 'Uploading...' : 'Upload Resume'}
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Info */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Supported formats</p>
              <p>PDF, DOC, DOCX (max 5MB)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumes List */}
      {resumes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No resumes uploaded</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your resume to apply for jobs
            </p>
            <Button onClick={handleUploadClick}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Your First Resume
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {resumes.map((resume) => (
            <Card key={resume.id} className={resume.is_primary ? 'border-primary' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <h3 className="font-semibold truncate">{resume.file_name}</h3>
                      {resume.is_primary && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium flex-shrink-0">
                          <CheckCircle className="h-3 w-3" />
                          Primary
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Uploaded {format(new Date(resume.uploaded_at), 'MMM d, yyyy')}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {!resume.is_primary && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetPrimary(resume.id)}
                        disabled={setPrimaryResume.isPending}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        Set Primary
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(resume)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(resume.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Resume"
        description="Are you sure you want to delete this resume? This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        loading={deleteResume.isPending}
      />
    </div>
  )
}
