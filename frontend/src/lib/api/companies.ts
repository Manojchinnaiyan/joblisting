import apiClient from './client'
import {
  Company,
  CompanyLocation,
  CompanyBenefit,
  CompanyReview,
  CompanyFilters,
} from '@/types/company'
import { Job } from '@/types/job'
import { ApiResponse, PaginationParams, Pagination } from '@/types/api'

export const companiesApi = {
  getCompanies: async (
    filters?: CompanyFilters,
    pagination?: PaginationParams
  ): Promise<{ companies: Company[]; pagination: Pagination }> => {
    const params = new URLSearchParams()

    if (filters?.q) params.append('search', filters.q)
    if (filters?.industry?.length) {
      filters.industry.forEach((i) => params.append('industry', i))
    }
    if (filters?.company_size?.length) {
      filters.company_size.forEach((s) => params.append('company_size', s))
    }
    if (filters?.is_verified !== undefined) {
      params.append('is_verified', filters.is_verified.toString())
    }

    if (pagination?.page) params.append('page', pagination.page.toString())
    if (pagination?.per_page) params.append('limit', pagination.per_page.toString())

    const response = await apiClient.get<{
      companies: Company[]
      total: number
      page: number
      limit: number
      total_pages: number
    }>(`/companies?${params}`)

    return {
      companies: response.data.companies,
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

  getCompanyBySlug: async (slug: string): Promise<Company> => {
    const response = await apiClient.get<Company>(`/companies/${slug}`)
    return response.data
  },

  getCompanyJobs: async (
    slug: string,
    pagination?: PaginationParams
  ): Promise<{ jobs: Job[]; pagination: Pagination }> => {
    const params = new URLSearchParams()
    if (pagination?.page) params.append('page', pagination.page.toString())
    if (pagination?.per_page) params.append('limit', pagination.per_page.toString())

    const response = await apiClient.get<ApiResponse<{ jobs: Job[]; pagination: Pagination }>>(
      `/companies/${slug}/jobs?${params}`
    )
    return response.data.data!
  },

  getCompanyLocations: async (slug: string): Promise<CompanyLocation[]> => {
    const response = await apiClient.get<ApiResponse<{ locations: CompanyLocation[] }>>(
      `/companies/${slug}/locations`
    )
    return response.data.data!.locations
  },

  getCompanyBenefits: async (slug: string): Promise<CompanyBenefit[]> => {
    const response = await apiClient.get<ApiResponse<{ benefits: CompanyBenefit[] }>>(
      `/companies/${slug}/benefits`
    )
    return response.data.data!.benefits
  },

  getCompanyReviews: async (
    slug: string,
    pagination?: PaginationParams
  ): Promise<{ reviews: CompanyReview[]; pagination: Pagination }> => {
    const params = new URLSearchParams()
    if (pagination?.page) params.append('page', pagination.page.toString())
    if (pagination?.per_page) params.append('limit', pagination.per_page.toString())

    const response = await apiClient.get<
      ApiResponse<{ reviews: CompanyReview[]; pagination: Pagination }>
    >(`/companies/${slug}/reviews?${params}`)
    return response.data.data!
  },

  getFeaturedCompanies: async (limit: number = 6): Promise<Company[]> => {
    const response = await apiClient.get<Company[]>(
      `/companies/featured?limit=${limit}`
    )
    return response.data
  },

  getIndustries: async (): Promise<string[]> => {
    const response = await apiClient.get<ApiResponse<{ industries: string[] }>>(
      '/companies/industries'
    )
    return response.data.data!.industries
  },

  followCompany: async (companyId: string): Promise<void> => {
    await apiClient.post(`/jobseeker/companies/${companyId}/follow`, {})
  },

  unfollowCompany: async (companyId: string): Promise<void> => {
    await apiClient.delete(`/jobseeker/companies/${companyId}/unfollow`)
  },
}
