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
   * Extract job links from a listing page URL
   */
  async extractLinks(url: string): Promise<ExtractLinksResponse> {
    const response = await scraperClient.post('/admin/jobs/scrape/extract-links', { url })
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
   * Delete an import queue
   */
  async deleteQueue(queueId: string): Promise<{ success: boolean; message: string }> {
    const response = await scraperClient.delete(`/admin/jobs/import-queue/${queueId}`)
    return response.data
  },
}
