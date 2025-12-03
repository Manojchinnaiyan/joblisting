import { apiClient } from '../client'

export type JobStatus = 'draft' | 'pending' | 'active' | 'expired' | 'closed'
export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE' | 'INTERNSHIP'
export type ExperienceLevel = 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE'
export type WorkplaceType = 'ONSITE' | 'REMOTE' | 'HYBRID'
export type SalaryPeriod = 'hourly' | 'monthly' | 'yearly'

export interface EmployerJob {
  id: string
  company_id?: string
  title: string
  slug: string
  short_description?: string
  description: string
  requirements?: string
  responsibilities?: string
  job_type: JobType
  experience_level: ExperienceLevel
  workplace_type: WorkplaceType
  location?: string
  location_id?: string
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  salary_period?: SalaryPeriod
  hide_salary?: boolean
  skills: string[]
  education?: string
  years_experience_min?: number
  years_experience_max?: number
  benefits?: string[]
  categories?: { id: string; name: string; slug: string }[]
  application_url?: string
  application_email?: string
  status: JobStatus
  is_featured: boolean
  is_urgent?: boolean
  views_count: number
  applications_count: number
  expires_at?: string
  closed_at?: string
  published_at?: string
  created_at: string
  updated_at: string
}

export interface CreateJobData {
  title: string
  short_description?: string
  description: string
  requirements?: string
  responsibilities?: string
  job_type: JobType
  experience_level: ExperienceLevel
  workplace_type: WorkplaceType
  location?: string
  location_id?: string
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  salary_period?: SalaryPeriod
  hide_salary?: boolean
  skills: string[]
  education?: string
  years_experience_min?: number
  years_experience_max?: number
  benefits?: string[]
  category_ids?: string[]
  application_url?: string
  application_email?: string
  is_featured?: boolean
  is_urgent?: boolean
  status?: 'draft' | 'active'
}

export interface UpdateJobData extends Partial<CreateJobData> {
  requirements?: string
  responsibilities?: string
}

export interface GetJobsParams {
  status?: JobStatus
  search?: string
  page?: number
  limit?: number
  sort?: 'newest' | 'oldest' | 'applications' | 'views'
}

export interface JobsResponse {
  jobs: EmployerJob[]
  total: number
  page: number
  limit: number
}

export interface JobAnalytics {
  job_id: string
  views: number
  applications: number
  conversion_rate: number
  views_by_day: { date: string; count: number }[]
  applications_by_day: { date: string; count: number }[]
  applications_by_status: { status: string; count: number }[]
  top_sources: { source: string; count: number }[]
}

export interface BulkImportResultItem {
  success: boolean
  title: string
  error?: string
}

export interface BulkImportResult {
  success_count: number
  failed_count: number
  errors: { row: number; error: string }[]
  results?: BulkImportResultItem[]
}

export const employerJobsApi = {
  async createJob(data: CreateJobData): Promise<EmployerJob> {
    const response = await apiClient.post('/employer/jobs', data)
    // Backend returns { success, message, data: { job } }
    const apiData = response.data.data || response.data
    return apiData.job
  },

  async getMyJobs(params: GetJobsParams = {}): Promise<JobsResponse> {
    const response = await apiClient.get('/employer/jobs', { params })
    // Backend returns { success, message, data: { jobs, pagination } }
    const apiData = response.data.data || response.data
    return {
      jobs: apiData.jobs || [],
      total: apiData.pagination?.total || 0,
      page: apiData.pagination?.page || 1,
      limit: apiData.pagination?.limit || 10,
    }
  },

  async getJob(id: string): Promise<EmployerJob> {
    const response = await apiClient.get(`/employer/jobs/${id}`)
    const apiData = response.data.data || response.data
    return apiData.job
  },

  async updateJob(id: string, data: UpdateJobData): Promise<EmployerJob> {
    const response = await apiClient.put(`/employer/jobs/${id}`, data)
    const apiData = response.data.data || response.data
    return apiData.job
  },

  async deleteJob(id: string): Promise<void> {
    await apiClient.delete(`/employer/jobs/${id}`)
  },

  async closeJob(id: string): Promise<EmployerJob> {
    const response = await apiClient.post(`/employer/jobs/${id}/close`)
    const apiData = response.data.data || response.data
    return apiData.job
  },

  async renewJob(id: string): Promise<EmployerJob> {
    const response = await apiClient.post(`/employer/jobs/${id}/renew`)
    const apiData = response.data.data || response.data
    return apiData.job
  },

  async bulkImportJobs(file: File): Promise<BulkImportResult> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post('/employer/jobs/bulk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const apiData = response.data.data || response.data
    return apiData
  },

  async getJobAnalytics(id: string): Promise<JobAnalytics> {
    const response = await apiClient.get(`/employer/jobs/${id}/analytics`)
    const apiData = response.data.data || response.data
    return apiData
  },

  async duplicateJob(id: string): Promise<EmployerJob> {
    const response = await apiClient.post(`/employer/jobs/${id}/duplicate`)
    const apiData = response.data.data || response.data
    return apiData.job
  },
}
