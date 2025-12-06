import { apiClient } from '../client'

export interface AdminUserListItem {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'JOB_SEEKER' | 'EMPLOYER' | 'ADMIN'
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING'
  email_verified: boolean
  auth_provider: string
  created_at: string
  last_login_at?: string
  failed_login_attempts: number
  is_2fa_enabled?: boolean
  permissions?: string[]
  profile?: {
    headline?: string
    location?: string
    avatar_url?: string
    completeness_score?: number
    bio?: string
    skills?: string[]
    experience_years?: number
    education?: string
    resume_url?: string
    website?: string
    linkedin_url?: string
    github_url?: string
  }
}

export interface AdminUserDetail extends AdminUserListItem {
  phone?: string
  is_2fa_enabled?: boolean
  lockout_until?: string
  suspended_at?: string
  suspended_reason?: string
  applications_count?: number
  saved_jobs_count?: number
  following_companies_count?: number
  company_id?: string
  company_name?: string
  posted_jobs_count?: number
  team_role?: string
  company?: {
    id: string
    name: string
    slug: string
    logo_url?: string
    is_verified: boolean
    industry?: string
    is_featured?: boolean
  }
  applications?: {
    id: string
    job_title: string
    company_name: string
    status: string
    created_at: string
  }[]
  recentActivity?: {
    type: string
    description: string
    timestamp: string
  }[]
}

export interface LoginHistoryItem {
  id: string
  user_id: string
  ip_address: string
  user_agent: string
  status: 'SUCCESS' | 'FAILED' | 'LOCKED'
  failure_reason?: string
  created_at: string
}

export interface UsersFilters {
  search?: string
  role?: string
  status?: string
  email_verified?: boolean
  date_from?: string
  date_to?: string
}

export interface UsersPagination {
  page: number
  limit: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface UsersResponse {
  users: AdminUserListItem[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface LoginHistoryResponse {
  history: LoginHistoryItem[]
  total: number
  page: number
  limit: number
}

export interface CreateAdminData {
  email: string
  first_name: string
  last_name: string
  password?: string
  send_welcome_email?: boolean
  permissions?: string[]
  require_2fa?: boolean
}

export interface UpdateUserData {
  first_name?: string
  last_name?: string
  email?: string
  role?: string
  status?: string
  email_verified?: boolean
}

export const adminUsersApi = {
  async getUsers(filters: UsersFilters = {}, pagination: UsersPagination = { page: 1, limit: 20 }): Promise<UsersResponse> {
    // Backend uses per_page, not limit
    const params = {
      ...filters,
      page: pagination.page,
      per_page: pagination.limit,
      sort_by: pagination.sort_by,
      sort_order: pagination.sort_order
    }
    const response = await apiClient.get('/admin/users', { params })
    const data = response.data

    // Transform backend response structure to frontend expected structure
    return {
      users: data.data || [],
      total: data.meta?.total || 0,
      page: data.meta?.current_page || pagination.page,
      limit: data.meta?.per_page || pagination.limit,
      total_pages: data.meta?.total_pages || 0,
    }
  },

  async getUser(id: string): Promise<AdminUserDetail> {
    const response = await apiClient.get(`/admin/users/${id}`)
    const data = response.data.data || response.data

    // Backend returns { user: {...}, profile: {...} } - merge them
    if (data.user) {
      return {
        ...data.user,
        profile: data.profile || undefined,
        is_2fa_enabled: data.user.two_factor_enabled,
      }
    }

    return data
  },

  async updateUser(id: string, data: UpdateUserData): Promise<AdminUserDetail> {
    const response = await apiClient.put(`/admin/users/${id}`, data)
    return response.data.data || response.data.user || response.data
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/admin/users/${id}`)
  },

  async suspendUser(id: string, reason?: string): Promise<AdminUserDetail> {
    const response = await apiClient.post(`/admin/users/${id}/suspend`, { reason })
    return response.data.data || response.data.user || response.data
  },

  async activateUser(id: string): Promise<AdminUserDetail> {
    const response = await apiClient.post(`/admin/users/${id}/activate`)
    return response.data.data || response.data.user || response.data
  },

  async createAdmin(data: CreateAdminData): Promise<AdminUserDetail> {
    const response = await apiClient.post('/admin/users/create-admin', data)
    return response.data.data || response.data.user || response.data
  },

  async getUserLoginHistory(id: string, pagination: UsersPagination = { page: 1, limit: 20 }): Promise<LoginHistoryResponse> {
    const response = await apiClient.get(`/admin/users/${id}/login-history`, { params: pagination })
    return response.data.data || response.data
  },

  async revokeUserSessions(id: string): Promise<void> {
    await apiClient.post(`/admin/users/${id}/revoke-sessions`)
  },
}
