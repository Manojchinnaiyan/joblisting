import { apiClient } from '../client'

export interface AdminResumeUser {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
}

export interface AdminResume {
  id: string
  user_id: string
  file_name: string
  original_name: string
  file_size: number
  mime_type: string
  title?: string
  is_primary: boolean
  download_count: number
  created_at: string
  updated_at: string
  user?: AdminResumeUser
}

export interface ResumeStats {
  total_resumes: number
  total_downloads: number
  by_file_type: {
    mime_type: string
    count: number
  }[]
}

export interface ResumesFilters {
  search?: string
  user_id?: string
  mime_type?: string
  is_primary?: boolean
}

export interface ResumesPagination {
  page: number
  limit: number
}

export interface ResumesResponse {
  resumes: AdminResume[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface ResumeDownloadResponse {
  download_url: string
  file_name: string
  mime_type: string
  file_size: number
}

export const adminResumesApi = {
  async getResumes(filters: ResumesFilters = {}, pagination: ResumesPagination = { page: 1, limit: 20 }): Promise<ResumesResponse> {
    const params = {
      ...filters,
      page: pagination.page,
      per_page: pagination.limit,
    }
    const response = await apiClient.get('/admin/resumes', { params })
    const data = response.data

    return {
      resumes: data.data || [],
      total: data.meta?.total || 0,
      page: data.meta?.current_page || pagination.page,
      limit: data.meta?.per_page || pagination.limit,
      total_pages: data.meta?.total_pages || 0,
    }
  },

  async getResume(id: string): Promise<AdminResume> {
    const response = await apiClient.get(`/admin/resumes/${id}`)
    return response.data.data?.resume || response.data.resume || response.data
  },

  async getResumeStats(): Promise<ResumeStats> {
    const response = await apiClient.get('/admin/resumes/stats')
    return response.data.data?.stats || response.data.stats || response.data
  },

  async getUserResumes(userId: string): Promise<AdminResume[]> {
    const response = await apiClient.get(`/admin/resumes/user/${userId}`)
    return response.data.data?.resumes || response.data.resumes || []
  },

  async getResumeDownloadUrl(id: string): Promise<ResumeDownloadResponse> {
    const response = await apiClient.get(`/admin/resumes/${id}/download`)
    return response.data.data || response.data
  },

  async deleteResume(id: string): Promise<void> {
    await apiClient.delete(`/admin/resumes/${id}`)
  },
}
