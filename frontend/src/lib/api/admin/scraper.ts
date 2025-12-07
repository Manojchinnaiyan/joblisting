import axios from 'axios'
import { useAdminAuthStore } from '@/store/admin-auth-store'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

// Create a dedicated client for scraper with longer timeout
const scraperClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes for scraping operations
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

export interface CreateFromScrapedData {
  scraped_data: ScrapedJob
  edits?: Partial<ScrapedJob>
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
}
