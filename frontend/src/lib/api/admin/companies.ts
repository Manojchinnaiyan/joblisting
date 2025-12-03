import { apiClient } from '../client'

export interface AdminCompanyListItem {
  id: string
  name: string
  slug: string
  logo_url?: string
  industry?: string
  company_size?: string
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED'
  is_verified: boolean
  is_featured: boolean
  featured_until?: string
  active_jobs_count: number
  followers_count: number
  reviews_count: number
  average_rating?: number
  created_at: string
  owner?: {
    id: string
    first_name: string
    last_name: string
    email: string
    avatar_url?: string
  }
}

export interface AdminCompanyDetail extends AdminCompanyListItem {
  updated_at?: string
  tagline?: string
  description?: string
  website?: string
  email?: string
  phone?: string
  founded_year?: number
  company_type?: string
  mission?: string
  vision?: string
  culture_description?: string
  cover_image_url?: string
  verification_status?: string
  verification_submitted_at?: string
  verification_documents?: string[]
  verified_at?: string
  verified_by?: string
  rejection_reason?: string
  suspended_at?: string
  suspended_reason?: string
  team_members_count: number
  total_applications: number
  locations?: CompanyLocation[]
  recent_jobs?: CompanyJob[]
  jobs?: CompanyJob[]
  team_members?: TeamMember[]
  reviews?: CompanyReview[]
}

export interface CompanyLocation {
  id: string
  name: string
  address?: string
  city?: string
  state?: string
  country?: string
  is_headquarters: boolean
}

export interface CompanyJob {
  id: string
  title: string
  status: string
  applications_count: number
  created_at: string
  job_type?: string
  location?: string
}

export interface TeamMember {
  id: string
  user_id: string
  first_name: string
  last_name?: string
  email: string
  role: string
  avatar_url?: string
}

export interface CompanyReview {
  id: string
  rating: number
  title: string
  content: string
  status: string
  created_at: string
}

export interface CompaniesFilters {
  search?: string
  status?: string
  industry?: string
  is_verified?: boolean
  is_featured?: boolean
  date_from?: string
  date_to?: string
}

export interface CompaniesPagination {
  page: number
  limit: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface CompaniesResponse {
  companies: AdminCompanyListItem[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface UpdateCompanyData {
  name?: string
  slug?: string
  tagline?: string
  description?: string
  industry?: string
  company_size?: string
  size?: string
  company_type?: string
  website?: string
  email?: string
  phone?: string
  location?: string
  logo_url?: string
  cover_url?: string
  founded_year?: number | string
  mission?: string
  vision?: string
  culture_description?: string
  status?: string
  is_verified?: boolean
  is_featured?: boolean
}

export const adminCompaniesApi = {
  async getCompanies(filters: CompaniesFilters = {}, pagination: CompaniesPagination = { page: 1, limit: 20 }): Promise<CompaniesResponse> {
    const params = { ...filters, ...pagination }
    const response = await apiClient.get('/admin/companies', { params })
    // Backend returns directly: { companies: [...], total, page, limit, total_pages }
    // or wrapped: { data: {...} } or { success, data: {...} }
    const data = response.data.data || response.data

    return {
      companies: data.companies || [],
      total: data.total || 0,
      page: data.page || pagination.page,
      limit: data.limit || pagination.limit,
      total_pages: data.total_pages || 0,
    }
  },

  async getCompany(id: string): Promise<AdminCompanyDetail> {
    const response = await apiClient.get(`/admin/companies/${id}`)
    return response.data.data || response.data.company || response.data
  },

  async updateCompany(id: string, data: UpdateCompanyData): Promise<AdminCompanyDetail> {
    const response = await apiClient.put(`/admin/companies/${id}`, data)
    return response.data.data || response.data.company || response.data
  },

  async deleteCompany(id: string): Promise<void> {
    await apiClient.delete(`/admin/companies/${id}`)
  },

  async getPendingVerifications(pagination: CompaniesPagination = { page: 1, limit: 20 }): Promise<CompaniesResponse> {
    const response = await apiClient.get('/admin/companies/pending', { params: pagination })
    const data = response.data.data || response.data

    return {
      companies: data.companies || [],
      total: data.total || 0,
      page: data.page || pagination.page,
      limit: data.limit || pagination.limit,
      total_pages: data.total_pages || 0,
    }
  },

  async verifyCompany(id: string): Promise<AdminCompanyDetail> {
    const response = await apiClient.post(`/admin/companies/${id}/verify`)
    return response.data.data || response.data.company || response.data
  },

  async rejectVerification(id: string, reason: string): Promise<AdminCompanyDetail> {
    const response = await apiClient.post(`/admin/companies/${id}/reject`, { reason })
    return response.data.data || response.data.company || response.data
  },

  async unverifyCompany(id: string): Promise<AdminCompanyDetail> {
    const response = await apiClient.post(`/admin/companies/${id}/unverify`)
    return response.data.data || response.data.company || response.data
  },

  async featureCompany(id: string, until?: string): Promise<AdminCompanyDetail> {
    const response = await apiClient.post(`/admin/companies/${id}/feature`, { featured_until: until })
    return response.data.data || response.data.company || response.data
  },

  async unfeatureCompany(id: string): Promise<AdminCompanyDetail> {
    const response = await apiClient.post(`/admin/companies/${id}/unfeature`)
    return response.data.data || response.data.company || response.data
  },

  async suspendCompany(id: string, reason?: string): Promise<AdminCompanyDetail> {
    const response = await apiClient.post(`/admin/companies/${id}/suspend`, { reason })
    return response.data.data || response.data.company || response.data
  },

  async activateCompany(id: string): Promise<AdminCompanyDetail> {
    const response = await apiClient.post(`/admin/companies/${id}/activate`)
    return response.data.data || response.data.company || response.data
  },
}
