import apiClient from './client'
import { Job } from '@/types/job'
import { PaginationParams, Pagination, ApiResponse } from '@/types/api'

interface SavedJob {
  id: string
  job: Job
  saved_at: string
}

interface SavedJobsResponse {
  saved_jobs: SavedJob[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
}

export const savedJobsApi = {
  getSavedJobs: async (
    pagination?: PaginationParams
  ): Promise<{ jobs: Job[]; pagination: Pagination }> => {
    const params = new URLSearchParams()

    if (pagination?.page) params.append('page', pagination.page.toString())
    if (pagination?.per_page) params.append('limit', pagination.per_page.toString())

    const response = await apiClient.get<ApiResponse<SavedJobsResponse>>(
      `/jobseeker/me/saved-jobs?${params}`
    )

    const data = response.data.data!

    return {
      jobs: data.saved_jobs.map((savedJob) => ({
        ...savedJob.job,
        saved_at: savedJob.saved_at,
      })),
      pagination: {
        page: data.pagination.page,
        limit: data.pagination.limit,
        total: data.pagination.total,
        total_pages: data.pagination.total_pages,
        has_next: data.pagination.has_next,
        has_prev: data.pagination.has_prev,
      },
    }
  },

  saveJob: async (jobId: string): Promise<void> => {
    await apiClient.post(`/jobs/${jobId}/save`, {})
  },

  unsaveJob: async (jobId: string): Promise<void> => {
    await apiClient.delete(`/jobs/${jobId}/save`)
  },
}
