import { apiClient } from '../client'

export interface AdminJobListItem {
  id: string
  title: string
  slug: string
  company_id: string
  company_name: string
  company_logo?: string
  status: 'DRAFT' | 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CLOSED' | 'REJECTED'
  job_type: string
  experience_level: string
  workplace_type: string
  location?: string
  is_featured: boolean
  featured_until?: string
  applications_count: number
  views_count: number
  created_at: string
  updated_at?: string
  expires_at?: string
}

export interface AdminJobDetail extends AdminJobListItem {
  description: string
  short_description?: string
  requirements?: string
  responsibilities?: string
  skills: string[]
  benefits?: string[]
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  salary_period?: string
  is_salary_visible: boolean
  hide_salary?: boolean
  is_urgent: boolean
  is_remote?: boolean
  city?: string
  state?: string
  country?: string
  education?: string
  years_experience_min?: number
  years_experience_max?: number
  external_apply_url?: string
  application_url?: string
  application_email?: string
  rejection_reason?: string
  approved_at?: string
  approved_by?: string
  company?: {
    id: string
    name: string
    slug: string
    logo_url?: string
    is_verified: boolean
    industry?: string
  }
  category?: {
    id: string
    name: string
    slug: string
  }
  categories?: Array<{
    id: string
    name: string
    slug: string
  }>
  applications_by_status?: {
    pending: number
    reviewed: number
    shortlisted: number
    interview: number
    offered: number
    hired: number
    rejected: number
    withdrawn: number
  }
  applications?: Array<{
    id: string
    status: string
    created_at: string
    applicant?: {
      id: string
      first_name: string
      last_name: string
      email: string
      avatar_url?: string
    }
  }>
}

export interface JobsFilters {
  search?: string
  status?: string
  job_type?: string
  experience_level?: string
  workplace_type?: string
  is_featured?: boolean
  company_id?: string
  category_id?: string
  date_from?: string
  date_to?: string
}

export interface JobsPagination {
  page: number
  limit: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface JobsResponse {
  jobs: AdminJobListItem[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface JobStats {
  total: number
  active: number
  pending: number
  expired: number
  closed: number
  featured: number
  this_week: number
  last_week: number
  growth_percentage: number
}

export interface UpdateJobData {
  title?: string
  description?: string
  short_description?: string
  job_type?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE' | 'INTERNSHIP'
  experience_level?: 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE'
  workplace_type?: 'ONSITE' | 'REMOTE' | 'HYBRID'
  location?: string
  city?: string
  state?: string
  country?: string
  latitude?: number
  longitude?: number
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  salary_period?: string
  hide_salary?: boolean
  skills?: string[]
  education?: string
  years_experience_min?: number
  years_experience_max?: number
  benefits?: string[]
  category_ids?: string[]
  application_url?: string
  application_email?: string
  // Admin-specific fields
  company_name?: string
  company_logo_url?: string
  status?: 'ACTIVE' | 'DRAFT' | 'PENDING_APPROVAL' | 'EXPIRED' | 'CLOSED' | 'REJECTED'
}

export interface AdminCreateJobData {
  title: string
  description: string
  short_description?: string
  job_type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE' | 'INTERNSHIP'
  experience_level: 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE'
  workplace_type: 'ONSITE' | 'REMOTE' | 'HYBRID'
  location: string
  city?: string
  state?: string
  country?: string
  latitude?: number
  longitude?: number
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  salary_period?: string
  hide_salary?: boolean
  skills?: string[]
  education?: string
  years_experience_min?: number
  years_experience_max?: number
  benefits?: string[]
  category_ids?: string[]
  application_url?: string
  application_email?: string
  // Admin-specific fields
  company_name: string
  company_logo_url?: string
  status?: 'ACTIVE' | 'DRAFT' | 'PENDING_APPROVAL'
}

export const adminJobsApi = {
  async createJob(data: AdminCreateJobData): Promise<AdminJobDetail> {
    const response = await apiClient.post('/admin/jobs', data)
    return response.data.data || response.data.job || response.data
  },

  async getJobs(filters: JobsFilters = {}, pagination: JobsPagination = { page: 1, limit: 20 }): Promise<JobsResponse> {
    const params = { ...filters, ...pagination }
    const response = await apiClient.get('/admin/jobs', { params })
    const data = response.data.data || response.data

    // Handle nested pagination structure from backend: { jobs: [...], pagination: {...} }
    if (data.jobs && data.pagination) {
      return {
        jobs: data.jobs || [],
        total: data.pagination?.total || 0,
        page: data.pagination?.page || pagination.page,
        limit: data.pagination?.limit || pagination.limit,
        total_pages: data.pagination?.total_pages || 0,
      }
    }

    // Fallback if structure is flat
    return {
      jobs: data.jobs || data || [],
      total: data.total || 0,
      page: data.page || pagination.page,
      limit: data.limit || pagination.limit,
      total_pages: data.total_pages || 0,
    }
  },

  async getJob(id: string): Promise<AdminJobDetail> {
    const response = await apiClient.get(`/admin/jobs/${id}`)
    return response.data.data || response.data.job || response.data
  },

  async updateJob(id: string, data: UpdateJobData): Promise<AdminJobDetail> {
    const response = await apiClient.put(`/admin/jobs/${id}`, data)
    return response.data.data || response.data.job || response.data
  },

  async deleteJob(id: string): Promise<void> {
    await apiClient.delete(`/admin/jobs/${id}`)
  },

  async getPendingJobs(pagination: JobsPagination = { page: 1, limit: 20 }): Promise<JobsResponse> {
    const response = await apiClient.get('/admin/jobs/pending', { params: pagination })
    const data = response.data.data || response.data

    // Handle nested pagination structure from backend
    if (data.jobs && data.pagination) {
      return {
        jobs: data.jobs || [],
        total: data.pagination?.total || 0,
        page: data.pagination?.page || pagination.page,
        limit: data.pagination?.limit || pagination.limit,
        total_pages: data.pagination?.total_pages || 0,
      }
    }

    return {
      jobs: data.jobs || data || [],
      total: data.total || 0,
      page: data.page || pagination.page,
      limit: data.limit || pagination.limit,
      total_pages: data.total_pages || 0,
    }
  },

  async approveJob(id: string): Promise<AdminJobDetail> {
    const response = await apiClient.post(`/admin/jobs/${id}/approve`)
    return response.data.data || response.data.job || response.data
  },

  async rejectJob(id: string, reason: string): Promise<AdminJobDetail> {
    const response = await apiClient.post(`/admin/jobs/${id}/reject`, { reason })
    return response.data.data || response.data.job || response.data
  },

  async featureJob(id: string, until?: string): Promise<AdminJobDetail> {
    // Backend expects until_date in YYYY-MM-DD format
    const untilDate = until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const response = await apiClient.post(`/admin/jobs/${id}/feature`, { until_date: untilDate })
    return response.data.data || response.data.job || response.data
  },

  async unfeatureJob(id: string): Promise<AdminJobDetail> {
    const response = await apiClient.post(`/admin/jobs/${id}/unfeature`)
    return response.data.data || response.data.job || response.data
  },

  async getJobStats(): Promise<JobStats> {
    const response = await apiClient.get('/admin/jobs/stats')
    return response.data.data || response.data
  },
}
