import apiClient from './client'
import { Job, JobsResponse, JobFilters } from '@/types/job'
import { ApiResponse, PaginationParams } from '@/types/api'

export const jobsApi = {
  getJobs: async (
    filters?: JobFilters,
    pagination?: PaginationParams
  ): Promise<JobsResponse> => {
    const params = new URLSearchParams()

    if (filters?.q) params.append('q', filters.q)
    if (filters?.job_type?.length) {
      filters.job_type.forEach((t) => params.append('job_type', t))
    }
    if (filters?.experience_level?.length) {
      filters.experience_level.forEach((l) => params.append('experience_level', l))
    }
    if (filters?.workplace_type?.length) {
      filters.workplace_type.forEach((w) => params.append('workplace_type', w))
    }
    if (filters?.location) params.append('location', filters.location)
    if (filters?.salary_min) params.append('salary_min', filters.salary_min.toString())
    if (filters?.salary_max) params.append('salary_max', filters.salary_max.toString())
    if (filters?.category) params.append('category', filters.category)

    if (pagination?.page) params.append('page', pagination.page.toString())
    if (pagination?.per_page) params.append('limit', pagination.per_page.toString())
    if (pagination?.sort_by) params.append('sort_by', pagination.sort_by)
    if (pagination?.sort_order) params.append('sort_order', pagination.sort_order)

    const response = await apiClient.get<ApiResponse<JobsResponse>>(`/jobs?${params}`)
    return response.data.data!
  },

  searchJobs: async (
    query: string,
    filters?: JobFilters,
    pagination?: PaginationParams
  ): Promise<JobsResponse> => {
    const params = new URLSearchParams({ q: query })

    if (filters?.job_type?.length) {
      filters.job_type.forEach((t) => params.append('job_type', t))
    }
    if (filters?.experience_level?.length) {
      filters.experience_level.forEach((l) => params.append('experience_level', l))
    }
    if (filters?.workplace_type?.length) {
      filters.workplace_type.forEach((w) => params.append('workplace_type', w))
    }
    if (filters?.location) params.append('location', filters.location)
    if (filters?.category) params.append('category', filters.category)

    if (pagination?.page) params.append('page', pagination.page.toString())
    if (pagination?.per_page) params.append('limit', pagination.per_page.toString())

    const response = await apiClient.get<ApiResponse<JobsResponse>>(`/jobs/search?${params}`)
    return response.data.data!
  },

  getJobBySlug: async (slug: string): Promise<Job> => {
    const response = await apiClient.get<ApiResponse<Job>>(`/jobs/view/${slug}`)
    return response.data.data!
  },

  getFeaturedJobs: async (limit: number = 6): Promise<Job[]> => {
    const response = await apiClient.get<ApiResponse<{ jobs: Job[] }>>(
      `/jobs/featured?limit=${limit}`
    )
    return response.data.data!.jobs
  },

  getCategories: async (): Promise<{ id: string; name: string; slug: string; count: number }[]> => {
    const response = await apiClient.get<
      ApiResponse<{ categories: { id: string; name: string; slug: string; count: number }[] }>
    >('/jobs/categories')
    return response.data.data!.categories
  },

  saveJob: async (jobId: string): Promise<void> => {
    await apiClient.post(`/jobs/${jobId}/save`, {})
  },

  unsaveJob: async (jobId: string): Promise<void> => {
    await apiClient.delete(`/jobs/${jobId}/save`)
  },
}
