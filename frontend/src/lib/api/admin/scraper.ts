import axios from 'axios'
import { useAdminAuthStore } from '@/store/admin-auth-store'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

// Create a dedicated client for scraper with longer timeout
const scraperClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 600000, // 10 minutes for scraping operations (bulk can take a while)
})

// Add auth interceptor
scraperClient.interceptors.request.use(
  (config) => {
    const token = useAdminAuthStore.getState().accessToken
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Types for scraper API
export interface ScrapedJob {
  title: string
  company: string
  company_logo?: string
  location: string
  description: string
  requirements: string
  salary: string
  job_type: string
  experience_level: string
  skills: string[]
  original_url: string
  city?: string
  state?: string
  country?: string
  benefits?: string[]
}

export interface ScrapePreviewResponse {
  success: boolean
  scraped_job: ScrapedJob
  warnings?: string[]
}

export interface BulkScrapeResult {
  url: string
  success: boolean
  scraped_job?: ScrapedJob
  error?: string
}

export interface BulkScrapeResponse {
  results: BulkScrapeResult[]
  total: number
  success: number
  failed: number
}

export interface ExtractedJobLink {
  url: string
  title?: string
}

export interface ExtractLinksResponse {
  success: boolean
  source_url: string
  links: ExtractedJobLink[]
  total: number
  message?: string
  error?: string
}

export interface PageAnalysisResponse {
  success: boolean
  source_type: 'api' | 'html' | 'mixed'
  api_endpoints: string[]
  api_jobs_count: number
  html_links_count: number
  total_jobs: number
  has_pagination: boolean
  pagination_type: string
  error?: string
}

export interface CreateFromScrapedData {
  scraped_data: ScrapedJob
  edits?: Partial<ScrapedJob>
}

// Import Queue Types
export type ImportJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export interface ImportJob {
  id: string
  url: string
  title: string
  status: ImportJobStatus
  error?: string
  created_at: string
  updated_at: string
}

export interface ImportQueue {
  id: string
  status: ImportJobStatus
  jobs: ImportJob[]
  total_jobs: number
  completed: number
  failed: number
  cancelled: number
  created_at: string
  updated_at: string
  source_url: string
}

export interface CreateQueueRequest {
  source_url: string
  urls: string[]
  titles: string[]
}

export interface QueueResponse {
  success: boolean
  queue: ImportQueue
}

export interface AllQueuesResponse {
  success: boolean
  queues: ImportQueue[]
}

// Link Extraction Task Types
export interface LinkExtractionTask {
  id: string
  source_url: string
  status: ImportJobStatus
  links: ExtractedJobLink[]
  total: number
  error?: string
  created_at: string
  updated_at: string
}

export interface ExtractionTaskResponse {
  success: boolean
  task: LinkExtractionTask
}

export interface AllExtractionTasksResponse {
  success: boolean
  tasks: LinkExtractionTask[]
}

export const scraperApi = {
  /**
   * Preview job data from a URL without saving
   */
  async previewJob(url: string): Promise<ScrapePreviewResponse> {
    const response = await scraperClient.post('/admin/jobs/scrape/preview', { url })
    return response.data
  },

  /**
   * Create a job from scraped data
   */
  async createFromScraped(data: CreateFromScrapedData): Promise<unknown> {
    const response = await scraperClient.post('/admin/jobs/scrape/create', data)
    return response.data.data || response.data
  },

  /**
   * Bulk scrape multiple URLs
   */
  async bulkScrape(urls: string[]): Promise<BulkScrapeResponse> {
    const response = await scraperClient.post('/admin/jobs/scrape/bulk', { urls })
    return response.data.data || response.data
  },

  /**
   * Test scraping a URL (returns success/error without saving)
   */
  async testScrape(url: string): Promise<ScrapePreviewResponse & { error?: string }> {
    const response = await scraperClient.post('/admin/jobs/scrape/test', { url })
    return response.data
  },

  /**
   * Extract job links from a listing page URL (HTML-only method)
   */
  async extractLinks(url: string): Promise<ExtractLinksResponse> {
    const response = await scraperClient.post('/admin/jobs/scrape/extract-links', { url })
    return response.data
  },

  /**
   * Extract job links with auto-detection (API + HTML)
   * Automatically detects whether jobs are loaded via API or HTML
   */
  async extractLinksAuto(url: string): Promise<ExtractLinksResponse> {
    const response = await scraperClient.post('/admin/jobs/scrape/extract-links-auto', { url })
    return response.data
  },

  /**
   * Analyze a career page to detect job source type
   */
  async analyzeCareerPage(url: string): Promise<PageAnalysisResponse> {
    const response = await scraperClient.post('/admin/jobs/scrape/analyze', { url })
    return response.data
  },

  // Import Queue APIs

  /**
   * Create an import queue and start processing in background
   */
  async createImportQueue(data: CreateQueueRequest): Promise<QueueResponse> {
    const response = await scraperClient.post('/admin/jobs/import-queue', data)
    return response.data
  },

  /**
   * Get all import queues
   */
  async getAllQueues(): Promise<AllQueuesResponse> {
    const response = await scraperClient.get('/admin/jobs/import-queue')
    return response.data
  },

  /**
   * Get a specific import queue by ID
   */
  async getQueue(queueId: string): Promise<QueueResponse> {
    const response = await scraperClient.get(`/admin/jobs/import-queue/${queueId}`)
    return response.data
  },

  /**
   * Cancel an import queue
   */
  async cancelQueue(queueId: string): Promise<{ success: boolean; message: string }> {
    const response = await scraperClient.post(`/admin/jobs/import-queue/${queueId}/cancel`)
    return response.data
  },

  /**
   * Cancel a specific job in a queue
   */
  async cancelJob(queueId: string, jobId: string): Promise<{ success: boolean; message: string }> {
    const response = await scraperClient.post(`/admin/jobs/import-queue/${queueId}/cancel-job`, { job_id: jobId })
    return response.data
  },

  /**
   * Retry a specific failed job in a queue
   */
  async retryJob(queueId: string, jobId: string): Promise<{ success: boolean; message: string }> {
    const response = await scraperClient.post(`/admin/jobs/import-queue/${queueId}/retry-job`, { job_id: jobId })
    return response.data
  },

  /**
   * Retry all failed jobs in a queue
   */
  async retryFailedJobs(queueId: string): Promise<{ success: boolean; message: string }> {
    const response = await scraperClient.post(`/admin/jobs/import-queue/${queueId}/retry-failed`)
    return response.data
  },

  /**
   * Delete an import queue
   */
  async deleteQueue(queueId: string): Promise<{ success: boolean; message: string }> {
    const response = await scraperClient.delete(`/admin/jobs/import-queue/${queueId}`)
    return response.data
  },

  // Background Link Extraction APIs

  /**
   * Start a background link extraction task
   */
  async startExtraction(url: string): Promise<ExtractionTaskResponse> {
    const response = await scraperClient.post('/admin/jobs/extract-links', { url })
    return response.data
  },

  /**
   * Get all extraction tasks
   */
  async getAllExtractionTasks(): Promise<AllExtractionTasksResponse> {
    const response = await scraperClient.get('/admin/jobs/extract-links')
    return response.data
  },

  /**
   * Get a specific extraction task by ID
   */
  async getExtractionTask(taskId: string): Promise<ExtractionTaskResponse> {
    const response = await scraperClient.get(`/admin/jobs/extract-links/${taskId}`)
    return response.data
  },

  /**
   * Delete an extraction task
   */
  async deleteExtractionTask(taskId: string): Promise<{ success: boolean; message: string }> {
    const response = await scraperClient.delete(`/admin/jobs/extract-links/${taskId}`)
    return response.data
  },
}
