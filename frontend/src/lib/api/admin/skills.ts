import { apiClient } from '../client'

export interface UserSkill {
  id: string
  name: string
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
  years_experience?: number
}

export interface UserWithSkills {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  status: string
  email_verified: boolean
  created_at: string
  last_login_at?: string
  profile?: {
    headline?: string
    city?: string
    country?: string
    current_title?: string
    completeness_score?: number
    open_to_opportunities?: boolean
  }
  skills: UserSkill[]
}

export interface TopSkill {
  name: string
  count: number
}

export interface SkillsUsersFilters {
  search?: string
  role?: string
  status?: string
  skills?: string // comma-separated skill names
}

export interface SkillsUsersPagination {
  page: number
  limit: number
}

export interface SkillsUsersResponse {
  users: UserWithSkills[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export const adminSkillsApi = {
  async getTopSkills(limit: number = 50): Promise<TopSkill[]> {
    const response = await apiClient.get('/admin/skills', { params: { limit } })
    return response.data.data?.skills || response.data.skills || []
  },

  async searchSkills(query: string, limit: number = 20): Promise<string[]> {
    const response = await apiClient.get('/admin/skills/search', { params: { q: query, limit } })
    return response.data.data?.skills || response.data.skills || []
  },

  async getUsersBySkills(
    filters: SkillsUsersFilters = {},
    pagination: SkillsUsersPagination = { page: 1, limit: 20 }
  ): Promise<SkillsUsersResponse> {
    const params = {
      ...filters,
      page: pagination.page,
      per_page: pagination.limit,
    }
    const response = await apiClient.get('/admin/skills/users', { params })
    const data = response.data

    return {
      users: data.data || [],
      total: data.meta?.total || 0,
      page: data.meta?.current_page || pagination.page,
      limit: data.meta?.per_page || pagination.limit,
      total_pages: data.meta?.total_pages || 0,
    }
  },
}
