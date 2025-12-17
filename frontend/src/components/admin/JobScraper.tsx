'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { scraperApi, ScrapedJob } from '@/lib/api/admin/scraper'
import { adminJobsKeys } from '@/hooks/admin/use-admin-jobs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Link2, AlertTriangle, Check, ExternalLink, X, Edit2, Save, Building2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const JOB_TYPES = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'INTERNSHIP', label: 'Internship' },
]

const EXPERIENCE_LEVELS = [
  { value: 'ENTRY', label: 'Entry Level' },
  { value: 'MID', label: 'Mid Level' },
  { value: 'SENIOR', label: 'Senior Level' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'EXECUTIVE', label: 'Executive' },
]

export function JobScraper() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [scrapedData, setScrapedData] = useState<ScrapedJob | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [creating, setCreating] = useState(false)

  // Editable fields
  const [editedData, setEditedData] = useState<ScrapedJob | null>(null)

  const handlePreview = async () => {
    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('URL must start with http:// or https://')
      return
    }

    setLoading(true)
    setError(null)
    setScrapedData(null)
    setWarnings([])

    try {
      const response = await scraperApi.previewJob(url)
      if (response.success) {
        setScrapedData(response.scraped_job)
        setEditedData(response.scraped_job)
        setWarnings(response.warnings || [])
      } else {
        setError('Failed to scrape job data')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to scrape job. Please check the URL and try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!editedData) return

    setCreating(true)
    try {
      await scraperApi.createFromScraped({
        scraped_data: editedData,
        edits: editMode ? editedData : undefined,
      })

      // Invalidate jobs queries to refresh the list
      await queryClient.invalidateQueries({ queryKey: adminJobsKeys.lists() })
      await queryClient.invalidateQueries({ queryKey: adminJobsKeys.stats() })

      toast({
        title: 'Job Created',
        description: 'The job has been created successfully from the scraped data.',
      })

      router.push('/admin/jobs')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create job'
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
    setScrapedData(null)
    setEditedData(null)
    setWarnings([])
    setError(null)
    setEditMode(false)
  }

  const updateField = (field: keyof ScrapedJob, value: string | string[]) => {
    if (editedData) {
      setEditedData({ ...editedData, [field]: value })
    }
  }

  return (
    <div className="space-y-6">
      {/* URL Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Import Job from URL
          </CardTitle>
          <CardDescription>
            Paste a job posting URL to automatically extract job details using AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="https://company.com/careers/job-posting..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button onClick={handlePreview} disabled={loading || !url.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scraping...
                </>
              ) : (
                'Preview Job'
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warnings</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Preview Section */}
      {scrapedData && editedData && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Preview Extracted Data</CardTitle>
              <CardDescription>
                Review and edit the extracted job data before creating
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Done Editing
                  </>
                ) : (
                  <>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit Details
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Job Title</Label>
                {editMode ? (
                  <Input
                    value={editedData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                  />
                ) : (
                  <p className="text-lg font-medium">{editedData.title || '-'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Company</Label>
                {editMode ? (
                  <Input
                    value={editedData.company}
                    onChange={(e) => updateField('company', e.target.value)}
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    {editedData.company_logo && (
                      <img
                        src={editedData.company_logo}
                        alt={`${editedData.company} logo`}
                        className="h-10 w-10 object-contain rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    )}
                    <p className="text-lg font-medium">{editedData.company || '-'}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Company Logo URL</Label>
                {editMode ? (
                  <Input
                    value={editedData.company_logo || ''}
                    onChange={(e) => updateField('company_logo', e.target.value)}
                    placeholder="https://company.com/logo.png"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    {editedData.company_logo ? (
                      <>
                        <img
                          src={editedData.company_logo}
                          alt="Company logo"
                          className="h-8 w-8 object-contain rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                        <a
                          href={editedData.company_logo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline truncate max-w-[200px]"
                        >
                          {editedData.company_logo}
                        </a>
                      </>
                    ) : (
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        No logo found
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                {editMode ? (
                  <Input
                    value={editedData.location}
                    onChange={(e) => updateField('location', e.target.value)}
                  />
                ) : (
                  <p>{editedData.location || '-'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Salary</Label>
                {editMode ? (
                  <Input
                    value={editedData.salary}
                    onChange={(e) => updateField('salary', e.target.value)}
                    placeholder="e.g., $100,000 - $150,000"
                  />
                ) : (
                  <p>{editedData.salary || 'Not specified'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Job Type</Label>
                {editMode ? (
                  <Select
                    value={editedData.job_type}
                    onValueChange={(value) => updateField('job_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="secondary">
                    {JOB_TYPES.find(t => t.value === editedData.job_type)?.label || editedData.job_type}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <Label>Experience Level</Label>
                {editMode ? (
                  <Select
                    value={editedData.experience_level}
                    onValueChange={(value) => updateField('experience_level', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline">
                    {EXPERIENCE_LEVELS.find(l => l.value === editedData.experience_level)?.label || editedData.experience_level}
                  </Badge>
                )}
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <Label>Skills</Label>
              {editMode ? (
                <Input
                  value={editedData.skills?.join(', ') || ''}
                  onChange={(e) => updateField('skills', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="React, TypeScript, Node.js..."
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {editedData.skills?.length ? (
                    editedData.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">{skill}</Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">No skills extracted</span>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              {editMode ? (
                <Textarea
                  value={editedData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={8}
                />
              ) : (
                <div
                  className="rounded-md border p-4 max-h-64 overflow-y-auto prose prose-sm dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: editedData.description || '-' }}
                />
              )}
            </div>

            {/* Requirements */}
            {(editedData.requirements || editMode) && (
              <div className="space-y-2">
                <Label>Requirements</Label>
                {editMode ? (
                  <Textarea
                    value={editedData.requirements}
                    onChange={(e) => updateField('requirements', e.target.value)}
                    rows={4}
                  />
                ) : (
                  <div
                    className="rounded-md border p-4 max-h-48 overflow-y-auto prose prose-sm dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: editedData.requirements || '-' }}
                  />
                )}
              </div>
            )}

            {/* Original URL */}
            <div className="space-y-2">
              <Label>Original URL</Label>
              <div className="flex items-center gap-2">
                <a
                  href={editedData.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  {editedData.original_url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-sm text-muted-foreground">
                This will be saved as the &quot;Apply at Source&quot; link
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button variant="outline" onClick={handleClear}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Job
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
