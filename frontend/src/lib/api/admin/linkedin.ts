import { apiClient } from '../client'

export interface LinkedInStatus {
  connected: boolean
  organization_id?: string
  organization_name?: string
  expires_at?: string
  connected_at?: string
}

export interface LinkedInPost {
  id: string
  content_type: 'job' | 'blog' | 'custom'
  job_id?: string
  blog_id?: string
  linkedin_post_id?: string
  linkedin_post_url?: string
  organization_id: string
  post_text: string
  post_link?: string
  trigger_type: 'auto' | 'manual'
  status: 'pending' | 'posted' | 'failed'
  error_message?: string
  posted_by?: string
  posted_at?: string
  created_at: string
  updated_at: string
}

export interface LinkedInPostsResponse {
  posts: LinkedInPost[]
  total: number
  page: number
  limit: number
}

export interface LinkedInAutoPostSettings {
  auto_post_jobs: boolean
  auto_post_blogs: boolean
}

export interface LinkedInPostFilters {
  content_type?: string
  status?: string
  page?: number
  limit?: number
}

export interface CustomPostRequest {
  text: string
  link?: string
}

export const adminLinkedInApi = {
  async getAuthURL(): Promise<{ auth_url: string; state: string }> {
    const response = await apiClient.get('/admin/linkedin/auth/url')
    return response.data.data || response.data
  },

  async handleCallback(code: string, state?: string): Promise<{ organization_id: string; organization_name: string; expires_at: string }> {
    const response = await apiClient.post('/admin/linkedin/auth/callback', { code, state })
    return response.data.data || response.data
  },

  async getStatus(): Promise<LinkedInStatus> {
    const response = await apiClient.get('/admin/linkedin/status')
    return response.data.data || response.data
  },

  async disconnect(): Promise<void> {
    await apiClient.post('/admin/linkedin/disconnect')
  },

  async postJob(jobId: string): Promise<LinkedInPost> {
    const response = await apiClient.post(`/admin/linkedin/post/job/${jobId}`)
    return response.data.data || response.data
  },

  async postBlog(blogId: string): Promise<LinkedInPost> {
    const response = await apiClient.post(`/admin/linkedin/post/blog/${blogId}`)
    return response.data.data || response.data
  },

  async postCustom(data: CustomPostRequest): Promise<LinkedInPost> {
    const response = await apiClient.post('/admin/linkedin/post/custom', data)
    return response.data.data || response.data
  },

  async getPostHistory(filters: LinkedInPostFilters = {}): Promise<LinkedInPostsResponse> {
    const response = await apiClient.get('/admin/linkedin/posts', { params: filters })
    return response.data.data || response.data
  },

  async getSettings(): Promise<LinkedInAutoPostSettings> {
    const response = await apiClient.get('/admin/linkedin/settings')
    return response.data.data || response.data
  },

  async updateSettings(data: LinkedInAutoPostSettings): Promise<LinkedInAutoPostSettings> {
    const response = await apiClient.put('/admin/linkedin/settings', data)
    return response.data.data || response.data
  },
}
