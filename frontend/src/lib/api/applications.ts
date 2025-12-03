import apiClient from './client'
import { Application, ApplicationFilters, ApplyToJobRequest } from '@/types/application'
import { PaginationParams, Pagination } from '@/types/api'

export const applicationsApi = {
  getMyApplications: async (
    filters?: ApplicationFilters,
    pagination?: PaginationParams
  ): Promise<{ applications: Application[]; pagination: Pagination }> => {
    const params = new URLSearchParams()

    if (filters?.status) params.append('status', filters.status)
    if (filters?.job_type) params.append('job_type', filters.job_type)
    if (filters?.date_from) params.append('date_from', filters.date_from)
    if (filters?.date_to) params.append('date_to', filters.date_to)

    if (pagination?.page) params.append('page', pagination.page.toString())
    if (pagination?.per_page) params.append('limit', pagination.per_page.toString())

    const response = await apiClient.get<{
      applications: Application[]
      total: number
      page: number
      limit: number
      total_pages: number
    }>(`/jobseeker/me/applications?${params}`)

    return {
      applications: response.data.applications,
      pagination: {
        page: response.data.page,
        limit: response.data.limit,
        total: response.data.total,
        total_pages: response.data.total_pages,
        has_next: response.data.page < response.data.total_pages,
        has_prev: response.data.page > 1,
      },
    }
  },

  getApplication: async (id: string): Promise<Application> => {
    const response = await apiClient.get<{ application: Application }>(
      `/jobseeker/me/applications/${id}`
    )
    return response.data.application
  },

  applyToJob: async (jobId: string, data: ApplyToJobRequest): Promise<Application> => {
    const response = await apiClient.post<{ data: { application: Application } }>(
      `/jobs/${jobId}/apply`,
      data
    )
    const apiData = response.data.data || response.data
    return apiData.application
  },

  getApplicationForJob: async (jobId: string): Promise<Application | null> => {
    try {
      const response = await apiClient.get<{ data: { application: Application } }>(
        `/jobs/${jobId}/application`
      )
      const apiData = response.data.data || response.data
      return apiData.application
    } catch (error: any) {
      if (error.response?.status === 404 || error.code === 'NOT_FOUND') {
        return null
      }
      throw error
    }
  },

  withdrawApplication: async (jobId: string): Promise<void> => {
    await apiClient.delete(`/jobs/${jobId}/application`)
  },
}
