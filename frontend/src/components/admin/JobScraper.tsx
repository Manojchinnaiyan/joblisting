'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { scraperApi, ScrapedJob, ExtractedJobLink, ImportQueue, ImportJob, LinkExtractionTask, URLAnalysisResult } from '@/lib/api/admin/scraper'
import { adminJobsKeys } from '@/hooks/admin/use-admin-jobs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Link2, AlertTriangle, Check, ExternalLink, X, Edit2, Save, Building2, List, LinkIcon, Clock, CheckCircle2, XCircle, Pause, Play, Trash2, RefreshCw, RotateCcw, Brain, Code, Zap, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
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

  // Extract links state
  const [listingUrl, setListingUrl] = useState('')
  const [extractingLinks, setExtractingLinks] = useState(false)
  const [extractedLinks, setExtractedLinks] = useState<ExtractedJobLink[]>([])
  const [selectedLinks, setSelectedLinks] = useState<Set<string>>(new Set())
  const [extractError, setExtractError] = useState<string | null>(null)
  const [startingImport, setStartingImport] = useState(false)
  const [sourceType, setSourceType] = useState<string | null>(null)

  // Background extraction task state
  const [activeExtractionTask, setActiveExtractionTask] = useState<LinkExtractionTask | null>(null)

  // Import queue state
  const [activeQueues, setActiveQueues] = useState<ImportQueue[]>([])
  const [refreshingQueues, setRefreshingQueues] = useState(false)
  const hasInvalidatedRef = useRef(false)

  // AI Analysis state
  const [analyzeUrl, setAnalyzeUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<URLAnalysisResult | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [showSteps, setShowSteps] = useState(false)
  const [showChallenges, setShowChallenges] = useState(false)
  const [extractingFromAPI, setExtractingFromAPI] = useState(false)

  // Tab control state
  const [activeTab, setActiveTab] = useState('single')

  // Store last analysis for bulk extraction
  const [lastAnalysis, setLastAnalysis] = useState<URLAnalysisResult | null>(null)

  // Paste URLs directly state
  const [pastedUrls, setPastedUrls] = useState('')
  const [bulkMethod, setBulkMethod] = useState<'paste' | 'extract'>('paste')

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

  // Extract links handlers - now uses auto-detection for API and HTML sources
  const handleExtractLinks = async () => {
    if (!listingUrl.trim()) {
      setExtractError('Please enter a listing page URL')
      return
    }

    if (!listingUrl.startsWith('http://') && !listingUrl.startsWith('https://')) {
      setExtractError('URL must start with http:// or https://')
      return
    }

    setExtractingLinks(true)
    setExtractError(null)
    setExtractedLinks([])
    setSelectedLinks(new Set())
    setActiveExtractionTask(null)
    setSourceType(null)

    try {
      // Use auto-detection which handles both API and HTML sources
      const response = await scraperApi.extractLinksAuto(listingUrl)

      if (response.success && response.links && response.links.length > 0) {
        setExtractedLinks(response.links)
        setSelectedLinks(new Set(response.links.map(l => l.url)))
        setSourceType(response.message || null)
        toast({
          title: 'Links Extracted',
          description: `Found ${response.total} job links. ${response.message || ''}`,
        })
      } else if (response.error) {
        setExtractError(response.error)
      } else {
        // Fall back to background extraction if auto-detect finds nothing
        const bgResponse = await scraperApi.startExtraction(listingUrl)
        if (bgResponse.success && bgResponse.task) {
          setActiveExtractionTask(bgResponse.task)
          toast({
            title: 'Extraction Started',
            description: 'Auto-detect found no jobs, trying background extraction...',
          })
          return // Don't set extractingLinks to false yet
        } else {
          setExtractError('No job links found on this page')
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract links'
      setExtractError(errorMessage)
    } finally {
      if (!activeExtractionTask) {
        setExtractingLinks(false)
      }
    }
  }

  // Poll for extraction task completion
  useEffect(() => {
    if (!activeExtractionTask || activeExtractionTask.status === 'completed' || activeExtractionTask.status === 'failed') {
      return
    }

    const pollTask = async () => {
      try {
        const response = await scraperApi.getExtractionTask(activeExtractionTask.id)
        if (response.success && response.task) {
          setActiveExtractionTask(response.task)

          if (response.task.status === 'completed') {
            // Extraction finished successfully
            if (response.task.links && response.task.links.length > 0) {
              setExtractedLinks(response.task.links)
              setSelectedLinks(new Set(response.task.links.map(l => l.url)))
              toast({
                title: 'Links Extracted',
                description: `Found ${response.task.links.length} job links`,
              })
            } else {
              setExtractError('No job links found on this page')
            }
            setExtractingLinks(false)
            setActiveExtractionTask(null)
          } else if (response.task.status === 'failed') {
            setExtractError(response.task.error || 'Extraction failed')
            setExtractingLinks(false)
            setActiveExtractionTask(null)
          }
        }
      } catch (err) {
        console.error('Failed to poll extraction task:', err)
      }
    }

    // Poll every 2 seconds while extraction is in progress
    const interval = setInterval(pollTask, 2000)
    return () => clearInterval(interval)
  }, [activeExtractionTask, toast])

  const toggleLinkSelection = (url: string) => {
    const newSelected = new Set(selectedLinks)
    if (newSelected.has(url)) {
      newSelected.delete(url)
    } else {
      newSelected.add(url)
    }
    setSelectedLinks(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedLinks.size === extractedLinks.length) {
      setSelectedLinks(new Set())
    } else {
      setSelectedLinks(new Set(extractedLinks.map(l => l.url)))
    }
  }

  const clearExtractedLinks = () => {
    setListingUrl('')
    setExtractedLinks([])
    setSelectedLinks(new Set())
    setExtractError(null)
    setActiveExtractionTask(null)
    setExtractingLinks(false)
    setSourceType(null)
  }

  // Fetch active queues
  const fetchQueues = useCallback(async () => {
    try {
      const response = await scraperApi.getAllQueues()
      if (response.success) {
        setActiveQueues(response.queues || [])
      }
    } catch (err) {
      console.error('Failed to fetch queues:', err)
    }
  }, [])

  // Manual refresh function
  const handleRefreshQueues = async () => {
    setRefreshingQueues(true)
    try {
      await fetchQueues()
    } finally {
      setRefreshingQueues(false)
    }
  }

  // Check if there are active (processing/pending) queues
  const hasActiveQueues = activeQueues.some(q => q.status === 'processing' || q.status === 'pending')

  // Fetch active extraction tasks on mount to restore state
  const fetchActiveExtractionTask = useCallback(async () => {
    try {
      const response = await scraperApi.getAllExtractionTasks()
      if (response.success && response.tasks && response.tasks.length > 0) {
        // Find any processing or pending extraction task
        const activeTask = response.tasks.find(
          t => t.status === 'processing' || t.status === 'pending'
        )
        if (activeTask) {
          setActiveExtractionTask(activeTask)
          setExtractingLinks(true)
          setListingUrl(activeTask.source_url)
        }
      }
    } catch (err) {
      console.error('Failed to fetch extraction tasks:', err)
    }
  }, [])

  // Initial fetch on mount only
  useEffect(() => {
    fetchQueues()
    fetchActiveExtractionTask()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Poll only when there are active queues
  useEffect(() => {
    if (!hasActiveQueues) {
      return
    }

    // Poll every 10 seconds when there are active imports
    const interval = setInterval(fetchQueues, 10000)
    return () => clearInterval(interval)
  }, [hasActiveQueues, fetchQueues])

  // Invalidate job queries when queues complete
  useEffect(() => {
    const hasProcessing = activeQueues.some(q => q.status === 'processing' || q.status === 'pending')

    // If there are processing queues, reset the flag so we can invalidate when they complete
    if (hasProcessing) {
      hasInvalidatedRef.current = false
      return
    }

    // Only invalidate once when all queues complete
    if (!hasProcessing && activeQueues.length > 0 && !hasInvalidatedRef.current) {
      hasInvalidatedRef.current = true
      queryClient.invalidateQueries({ queryKey: adminJobsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminJobsKeys.stats() })
    }
  }, [activeQueues, queryClient])

  // Start background import
  const handleStartBackgroundImport = async () => {
    if (selectedLinks.size === 0) {
      toast({
        title: 'No links selected',
        description: 'Please select at least one job link to import',
        variant: 'destructive',
      })
      return
    }

    const urls = Array.from(selectedLinks)
    const titles = urls.map(url => {
      const link = extractedLinks.find(l => l.url === url)
      return link?.title || ''
    })

    setStartingImport(true)

    try {
      const response = await scraperApi.createImportQueue({
        source_url: listingUrl,
        urls,
        titles,
      })

      if (response.success) {
        toast({
          title: 'Import Started',
          description: `Background import started for ${urls.length} jobs. You can navigate away - the import will continue.`,
        })

        // Clear the form
        clearExtractedLinks()

        // Refresh queues immediately
        await fetchQueues()
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start import'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setStartingImport(false)
    }
  }

  // Cancel a queue
  const handleCancelQueue = async (queueId: string) => {
    try {
      await scraperApi.cancelQueue(queueId)
      toast({
        title: 'Queue Cancelled',
        description: 'The import queue has been cancelled.',
      })
      await fetchQueues()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel queue'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  // Cancel a specific job
  const handleCancelJob = async (queueId: string, jobId: string) => {
    try {
      await scraperApi.cancelJob(queueId, jobId)
      toast({
        title: 'Job Cancelled',
        description: 'The job has been cancelled.',
      })
      await fetchQueues()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel job'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  // Delete a queue
  const handleDeleteQueue = async (queueId: string) => {
    try {
      await scraperApi.deleteQueue(queueId)
      toast({
        title: 'Queue Deleted',
        description: 'The import queue has been deleted.',
      })
      await fetchQueues()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete queue'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  // Retry a specific failed job
  const handleRetryJob = async (queueId: string, jobId: string) => {
    try {
      await scraperApi.retryJob(queueId, jobId)
      toast({
        title: 'Job Queued',
        description: 'The job has been queued for retry.',
      })
      await fetchQueues()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retry job'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  // Retry all failed jobs in a queue
  const handleRetryFailedJobs = async (queueId: string) => {
    try {
      await scraperApi.retryFailedJobs(queueId)
      toast({
        title: 'Retry Started',
        description: 'All failed jobs have been queued for retry.',
      })
      await fetchQueues()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retry jobs'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  // AI Analysis handler
  const handleAnalyzeURL = async () => {
    if (!analyzeUrl.trim()) {
      setAnalysisError('Please enter a URL')
      return
    }

    if (!analyzeUrl.startsWith('http://') && !analyzeUrl.startsWith('https://')) {
      setAnalysisError('URL must start with http:// or https://')
      return
    }

    setAnalyzing(true)
    setAnalysisError(null)
    setAnalysisResult(null)

    try {
      const response = await scraperApi.analyzeCareerPageAI(analyzeUrl)
      if (response.success && response.analysis) {
        setAnalysisResult(response.analysis)
        toast({
          title: 'Analysis Complete',
          description: `Detected ${response.analysis.platform} platform with ${response.analysis.job_loading_method} loading`,
        })
      } else {
        setAnalysisError(response.error || 'Analysis failed')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze URL'
      setAnalysisError(errorMessage)
    } finally {
      setAnalyzing(false)
    }
  }

  const clearAnalysis = () => {
    setAnalyzeUrl('')
    setAnalysisResult(null)
    setAnalysisError(null)
    setShowSteps(false)
    setShowChallenges(false)
  }

  // Handle pasted URLs - parse and start import
  const handlePastedUrlsImport = async () => {
    const urls = pastedUrls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.startsWith('http://') || u.startsWith('https://'))

    if (urls.length === 0) {
      toast({
        title: 'No valid URLs',
        description: 'Please paste job URLs (one per line) starting with http:// or https://',
        variant: 'destructive',
      })
      return
    }

    try {
      setStartingImport(true)
      const titles = urls.map(() => '') // Empty titles, will be extracted during import

      const response = await scraperApi.createImportQueue({
        source_url: 'manual-paste',
        urls,
        titles,
      })

      if (response.success) {
        toast({
          title: 'Import Started',
          description: `Background import started for ${urls.length} jobs. You can navigate away - the import will continue.`,
        })

        // Clear the textarea
        setPastedUrls('')

        // Refresh queues immediately
        await fetchQueues()
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start import'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setStartingImport(false)
    }
  }

  // Count valid URLs in pasted text
  const validUrlCount = pastedUrls
    .split('\n')
    .map(u => u.trim())
    .filter(u => u.startsWith('http://') || u.startsWith('https://'))
    .length

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>
      case 'processing':
        return <Badge variant="default" className="flex items-center gap-1 bg-blue-500"><Loader2 className="h-3 w-3 animate-spin" /> Processing</Badge>
      case 'completed':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-500"><CheckCircle2 className="h-3 w-3" /> Completed</Badge>
      case 'failed':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Failed</Badge>
      case 'cancelled':
        return <Badge variant="secondary" className="flex items-center gap-1"><Pause className="h-3 w-3" /> Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Single Job
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Bulk Extract
          </TabsTrigger>
          <TabsTrigger value="analyze" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Analyze
          </TabsTrigger>
        </TabsList>

        {/* Single Job Tab */}
        <TabsContent value="single" className="space-y-6">
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
                      /* eslint-disable-next-line @next/next/no-img-element */
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
                        {/* eslint-disable-next-line @next/next/no-img-element */}
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
        </TabsContent>

        {/* Bulk Extract Tab */}
        <TabsContent value="bulk" className="space-y-6">
          {/* Active Import Queues */}
          {activeQueues.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Active Import Queues
                  </CardTitle>
                  <CardDescription>
                    Track your background imports - you can navigate away and they will continue running
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshQueues}
                  disabled={refreshingQueues}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${refreshingQueues ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeQueues.map((queue) => (
                  <div key={queue.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusBadge(queue.status)}
                        <span className="text-sm text-muted-foreground truncate max-w-[300px]">
                          {queue.source_url}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {(queue.status === 'processing' || queue.status === 'pending') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelQueue(queue.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                        {queue.failed > 0 && queue.status !== 'processing' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetryFailedJobs(queue.id)}
                            className="text-orange-600 border-orange-300 hover:bg-orange-50"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Retry Failed ({queue.failed})
                          </Button>
                        )}
                        {(queue.status === 'completed' || queue.status === 'failed' || queue.status === 'cancelled') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteQueue(queue.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>
                          {queue.completed + queue.failed + queue.cancelled} / {queue.total_jobs}
                          {queue.failed > 0 && <span className="text-red-500 ml-2">({queue.failed} failed)</span>}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${((queue.completed + queue.failed + queue.cancelled) / queue.total_jobs) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Individual jobs - collapsible */}
                    <details className="group">
                      <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                        View individual jobs ({queue.jobs?.length || 0} jobs)
                      </summary>
                      <ScrollArea className="h-[200px] mt-2">
                        <div className="space-y-2">
                          {queue.jobs?.map((job: ImportJob) => (
                            <div
                              key={job.id}
                              className="flex items-center justify-between p-2 rounded border bg-muted/30"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {getStatusBadge(job.status)}
                                <span className="text-sm truncate">
                                  {job.title || job.url}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {job.status === 'pending' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCancelJob(queue.id, job.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                                {job.status === 'failed' && queue.status !== 'processing' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRetryJob(queue.id, job.id)}
                                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                    title="Retry this job"
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                  </Button>
                                )}
                                {job.error && (
                                  <span className="text-xs text-red-500 max-w-[150px] truncate" title={job.error}>
                                    {job.error}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </details>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Method Selection */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={bulkMethod === 'paste' ? 'default' : 'outline'}
              onClick={() => setBulkMethod('paste')}
              className="flex-1"
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              Paste URLs (Recommended)
            </Button>
            <Button
              variant={bulkMethod === 'extract' ? 'default' : 'outline'}
              onClick={() => setBulkMethod('extract')}
              className="flex-1"
            >
              <Zap className="mr-2 h-4 w-4" />
              Auto-Extract from Page
            </Button>
          </div>

          {/* Paste URLs Method */}
          {bulkMethod === 'paste' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Paste Job URLs
                </CardTitle>
                <CardDescription>
                  Paste job posting URLs (one per line). This is the most reliable method -
                  copy job links from any career page and paste them here.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder={`https://company.com/jobs/software-engineer
https://company.com/jobs/product-manager
https://anothercompany.com/careers/job-123
...`}
                  value={pastedUrls}
                  onChange={(e) => setPastedUrls(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                  disabled={startingImport}
                />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {validUrlCount > 0 ? (
                      <span className="text-green-600 font-medium">{validUrlCount} valid URL{validUrlCount !== 1 ? 's' : ''} detected</span>
                    ) : (
                      'Paste job URLs above (one per line)'
                    )}
                  </p>
                  <Button
                    onClick={handlePastedUrlsImport}
                    disabled={startingImport || validUrlCount === 0}
                  >
                    {startingImport ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting Import...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Import {validUrlCount} Job{validUrlCount !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Auto-Extract Method */}
          {bulkMethod === 'extract' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Auto-Extract from Career Page
                </CardTitle>
                <CardDescription>
                  Paste a career listing page URL to automatically extract job links.
                  Works best with static HTML pages. SPA/JavaScript-heavy sites may not work well.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="https://company.com/careers/all-jobs..."
                      value={listingUrl}
                      onChange={(e) => setListingUrl(e.target.value)}
                      disabled={extractingLinks || startingImport}
                    />
                  </div>
                  <Button
                    onClick={handleExtractLinks}
                    disabled={extractingLinks || startingImport || !listingUrl.trim()}
                  >
                    {extractingLinks ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Extracting...
                      </>
                    ) : (
                      'Extract Links'
                    )}
                  </Button>
                </div>

                {/* Extraction in progress indicator */}
                {extractingLinks && activeExtractionTask && (
                  <Alert className="mt-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertTitle>Extracting Links</AlertTitle>
                    <AlertDescription>
                      Scanning page and extracting job links. This runs in the background and may take up to a minute for large job boards...
                    </AlertDescription>
                  </Alert>
                )}

                {extractError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{extractError}</AlertDescription>
                  </Alert>
                )}

                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Tip</AlertTitle>
                  <AlertDescription>
                    If auto-extraction doesn&apos;t work, try the &quot;Paste URLs&quot; method instead.
                    Open the career page in your browser, copy the job links manually, and paste them.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Extracted Links */}
          {extractedLinks.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Extracted Job Links
                    {sourceType && (
                      <Badge variant={sourceType.includes('api') ? 'default' : 'secondary'} className="ml-2 text-xs">
                        {sourceType.includes('api') ? '🔌 API Detected' : sourceType.includes('mixed') ? '🔄 Mixed Source' : '📄 HTML'}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Found {extractedLinks.length} job links. Select which ones to import.
                    {sourceType && <span className="block text-xs mt-1 text-muted-foreground">{sourceType}</span>}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={clearExtractedLinks}>
                    <X className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Select All */}
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      checked={selectedLinks.size === extractedLinks.length}
                      onCheckedChange={toggleSelectAll}
                    />
                    <Label htmlFor="select-all" className="font-medium">
                      Select All ({selectedLinks.size} of {extractedLinks.length} selected)
                    </Label>
                  </div>
                </div>

                {/* Links List */}
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {extractedLinks.map((link, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={`link-${index}`}
                          checked={selectedLinks.has(link.url)}
                          onCheckedChange={() => toggleLinkSelection(link.url)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          {link.title && (
                            <Label htmlFor={`link-${index}`} className="font-medium block mb-1">
                              {link.title}
                            </Label>
                          )}
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 truncate"
                          >
                            <LinkIcon className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{link.url}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <Button variant="outline" onClick={clearExtractedLinks} disabled={startingImport}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleStartBackgroundImport}
                    disabled={startingImport || selectedLinks.size === 0}
                  >
                    {startingImport ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Import {selectedLinks.size} Jobs
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Analyze Tab */}
        <TabsContent value="analyze" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI URL Analysis
              </CardTitle>
              <CardDescription>
                Use Claude AI to analyze a career page and discover the best way to extract job listings.
                Get CSS selectors, API patterns, and step-by-step extraction guides.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="https://company.com/careers..."
                    value={analyzeUrl}
                    onChange={(e) => setAnalyzeUrl(e.target.value)}
                    disabled={analyzing}
                  />
                </div>
                <Button onClick={handleAnalyzeURL} disabled={analyzing || !analyzeUrl.trim()}>
                  {analyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Analyze
                    </>
                  )}
                </Button>
              </div>

              {analysisError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{analysisError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {analysisResult && (
            <div className="space-y-4">
              {/* Overview Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Analysis Results
                      <Badge variant="outline" className="ml-2">
                        {Math.round(analysisResult.confidence * 100)}% confidence
                      </Badge>
                    </CardTitle>
                    <CardDescription className="truncate max-w-[500px]">
                      {analysisResult.url}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearAnalysis}>
                    <X className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Site Type</Label>
                      <p className="font-medium">{analysisResult.site_type.replace('_', ' ')}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Platform</Label>
                      <Badge variant="secondary">{analysisResult.platform}</Badge>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Loading Method</Label>
                      <Badge variant={analysisResult.job_loading_method === 'spa' || analysisResult.job_loading_method === 'ajax' ? 'default' : 'outline'}>
                        {analysisResult.job_loading_method.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Est. Jobs</Label>
                      <p className="font-medium">{analysisResult.total_jobs_estimate || 'Unknown'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Technical Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {analysisResult.job_list_selector && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Job List Selector</Label>
                        <code className="block p-2 bg-muted rounded text-sm font-mono break-all">
                          {analysisResult.job_list_selector}
                        </code>
                      </div>
                    )}
                    {analysisResult.job_link_selector && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Job Link Selector</Label>
                        <code className="block p-2 bg-muted rounded text-sm font-mono break-all">
                          {analysisResult.job_link_selector}
                        </code>
                      </div>
                    )}
                    {analysisResult.job_link_pattern && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Job URL Pattern</Label>
                        <code className="block p-2 bg-muted rounded text-sm font-mono break-all">
                          {analysisResult.job_link_pattern}
                        </code>
                      </div>
                    )}
                    {analysisResult.api_endpoint_pattern && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">API Endpoint Pattern</Label>
                        <code className="block p-2 bg-muted rounded text-sm font-mono break-all">
                          {analysisResult.api_endpoint_pattern}
                        </code>
                      </div>
                    )}
                    {analysisResult.pagination_type !== 'none' && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Pagination</Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{analysisResult.pagination_type}</Badge>
                          {analysisResult.pagination_selector && (
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {analysisResult.pagination_selector}
                            </code>
                          )}
                        </div>
                      </div>
                    )}
                    {analysisResult.search_form_selector && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Search Form Selector</Label>
                        <code className="block p-2 bg-muted rounded text-sm font-mono break-all">
                          {analysisResult.search_form_selector}
                        </code>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Extraction Methods */}
              {analysisResult.extraction_methods && analysisResult.extraction_methods.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Recommended Extraction Methods
                    </CardTitle>
                    <CardDescription>
                      Methods listed in order of preference
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.extraction_methods.map((method, index) => (
                        <Badge
                          key={index}
                          variant={index === 0 ? 'default' : 'secondary'}
                          className="text-sm"
                        >
                          {index === 0 && '⭐ '}
                          {method.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Extraction Steps */}
              {analysisResult.extraction_steps && analysisResult.extraction_steps.length > 0 && (
                <Card>
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => setShowSteps(!showSteps)}
                  >
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        Step-by-Step Guide
                      </span>
                      {showSteps ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </CardTitle>
                  </CardHeader>
                  {showSteps && (
                    <CardContent>
                      <ol className="list-decimal list-inside space-y-2">
                        {analysisResult.extraction_steps.map((step, index) => (
                          <li key={index} className="text-sm">{step}</li>
                        ))}
                      </ol>
                    </CardContent>
                  )}
                </Card>
              )}

              {/* Challenges */}
              {analysisResult.challenges && analysisResult.challenges.length > 0 && (
                <Card>
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => setShowChallenges(!showChallenges)}
                  >
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                        Potential Challenges
                      </span>
                      {showChallenges ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </CardTitle>
                  </CardHeader>
                  {showChallenges && (
                    <CardContent>
                      <ul className="space-y-2">
                        {analysisResult.challenges.map((challenge, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            {challenge}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  )}
                </Card>
              )}

              {/* Extracted Job Links */}
              {analysisResult.all_extracted_links && analysisResult.all_extracted_links.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LinkIcon className="h-5 w-5" />
                      Extracted Job Links ({analysisResult.all_extracted_links.length} found)
                    </CardTitle>
                    <CardDescription>
                      These are real job URLs extracted from the page HTML
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      <ul className="space-y-2">
                        {analysisResult.all_extracted_links.map((link, index) => (
                          <li key={index}>
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{link}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {analysisResult.notes && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>AI Notes</AlertTitle>
                  <AlertDescription>{analysisResult.notes}</AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 flex-wrap">
                {/* Extract via API - shown when API endpoint is detected */}
                {analysisResult.api_endpoint_pattern && (
                  <Button
                    variant="default"
                    onClick={async () => {
                      setExtractingFromAPI(true)
                      try {
                        // Extract the base URL from the analyze URL
                        const url = new URL(analyzeUrl)
                        const baseUrl = `${url.protocol}//${url.host}`

                        const response = await scraperApi.extractFromAPI(
                          analysisResult.api_endpoint_pattern,
                          baseUrl,
                          analysisResult.job_link_pattern  // Pass the URL pattern for dynamic job URL construction
                        )

                        if (response.success && response.links && response.links.length > 0) {
                          // Show extracted links for review instead of auto-importing
                          setExtractedLinks(response.links)
                          setSelectedLinks(new Set(response.links.map(l => l.url)))
                          setListingUrl(analyzeUrl)
                          setSourceType(response.message || 'Extracted from API')
                          setLastAnalysis(analysisResult)

                          toast({
                            title: 'Links Extracted',
                            description: `Found ${response.links.length} job links from API. Review and select which ones to import.`,
                          })

                          // Switch to bulk tab to review links
                          clearAnalysis()
                          setActiveTab('bulk')
                        } else {
                          toast({
                            title: 'No Jobs Found',
                            description: response.message || 'No jobs could be extracted from the API endpoint',
                            variant: 'destructive',
                          })
                        }
                      } catch (err: unknown) {
                        const errorMessage = err instanceof Error ? err.message : 'Failed to extract from API'
                        toast({
                          title: 'Error',
                          description: errorMessage,
                          variant: 'destructive',
                        })
                      } finally {
                        setExtractingFromAPI(false)
                      }
                    }}
                    disabled={extractingFromAPI || startingImport}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {extractingFromAPI ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Extracting from API...
                      </>
                    ) : (
                      <>
                        <Code className="mr-2 h-4 w-4" />
                        Extract via API
                      </>
                    )}
                  </Button>
                )}
                {/* Review all extracted job links */}
                {analysisResult.all_extracted_links && analysisResult.all_extracted_links.length > 0 && (
                  <Button
                    onClick={() => {
                      // Show extracted links for review instead of auto-importing
                      const links = analysisResult.all_extracted_links.map(url => ({
                        url,
                        title: ''
                      }))

                      // Set extracted links and auto-select all
                      setExtractedLinks(links)
                      setSelectedLinks(new Set(links.map(l => l.url)))
                      setListingUrl(analyzeUrl)
                      setLastAnalysis(analysisResult)
                      setSourceType(analysisResult.job_loading_method)

                      toast({
                        title: 'Links Ready for Review',
                        description: `${links.length} job links loaded. Review and select which ones to import.`,
                      })

                      // Switch to bulk tab to review links
                      clearAnalysis()
                      setActiveTab('bulk')
                    }}
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Review {analysisResult.all_extracted_links.length} Jobs
                  </Button>
                )}
                {/* Fallback: If no extracted links, show sample links button */}
                {(!analysisResult.all_extracted_links || analysisResult.all_extracted_links.length === 0) &&
                 analysisResult.sample_job_links && analysisResult.sample_job_links.length > 0 && (
                  <Button
                    onClick={() => {
                      // Set the sample job links as extracted links
                      const links = analysisResult.sample_job_links.map(url => ({
                        url,
                        title: ''
                      }))
                      setExtractedLinks(links)
                      setSelectedLinks(new Set(links.map(l => l.url)))
                      setListingUrl(analyzeUrl)
                      setLastAnalysis(analysisResult)
                      setSourceType(analysisResult.job_loading_method)
                      clearAnalysis()
                      setActiveTab('bulk')
                      toast({
                        title: 'Links loaded',
                        description: `${links.length} job links from analysis ready for import`,
                      })
                    }}
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Import {analysisResult.sample_job_links.length} Sample Jobs
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    // Load extracted links if available, otherwise just switch tab
                    if (analysisResult.all_extracted_links && analysisResult.all_extracted_links.length > 0) {
                      const links = analysisResult.all_extracted_links.map(url => ({
                        url,
                        title: ''
                      }))
                      setExtractedLinks(links)
                      setSelectedLinks(new Set(links.map(l => l.url)))
                      setSourceType(analysisResult.job_loading_method)
                    }
                    setListingUrl(analyzeUrl)
                    setLastAnalysis(analysisResult)
                    clearAnalysis()
                    setActiveTab('bulk')
                  }}
                >
                  Review in Bulk Extract
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
