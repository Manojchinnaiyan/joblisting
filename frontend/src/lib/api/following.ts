import apiClient from './client'
import { Company } from '@/types/company'
import { PaginationParams, Pagination } from '@/types/api'

export const followingApi = {
  getFollowingCompanies: async (
    pagination?: PaginationParams
  ): Promise<{ companies: Company[]; pagination: Pagination }> => {
    const params = new URLSearchParams()

    if (pagination?.page) params.append('page', pagination.page.toString())
    if (pagination?.per_page) params.append('limit', pagination.per_page.toString())

    const response = await apiClient.get<{
      data: {
        companies: Company[]
        pagination: {
          total: number
          page: number
          limit: number
          total_pages: number
        }
      }
    }>(`/jobseeker/companies/following?${params}`)

    const apiData = response.data.data || response.data
    return {
      companies: apiData.companies || [],
      pagination: {
        page: apiData.pagination?.page || 1,
        limit: apiData.pagination?.limit || 10,
        total: apiData.pagination?.total || 0,
        total_pages: apiData.pagination?.total_pages || 1,
        has_next: (apiData.pagination?.page || 1) < (apiData.pagination?.total_pages || 1),
        has_prev: (apiData.pagination?.page || 1) > 1,
      },
    }
  },

  followCompany: async (companyId: string): Promise<void> => {
    await apiClient.post(`/jobseeker/companies/${companyId}/follow`, {})
  },

  unfollowCompany: async (companyId: string): Promise<void> => {
    await apiClient.delete(`/jobseeker/companies/${companyId}/unfollow`)
  },
}
