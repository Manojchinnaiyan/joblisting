import { apiClient } from '../client'

export type MediaType = 'image' | 'video'

export interface CompanyMedia {
  id: string
  company_id: string
  type: MediaType
  url: string
  thumbnail_url?: string
  title?: string
  description?: string
  is_featured: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface UploadMediaData {
  file: File
  title?: string
  description?: string
  is_featured?: boolean
}

export interface UpdateMediaData {
  title?: string
  description?: string
  is_featured?: boolean
}

export interface ReorderMediaData {
  order: { id: string; display_order: number }[]
}

export const employerMediaApi = {
  async getMedia(): Promise<CompanyMedia[]> {
    const response = await apiClient.get('/employer/company/media')
    // Backend returns { success, message, data: { media } }
    const apiData = response.data.data || response.data
    return apiData.media ?? []
  },

  async uploadMedia(data: UploadMediaData): Promise<CompanyMedia> {
    const formData = new FormData()
    formData.append('file', data.file)
    if (data.title) formData.append('title', data.title)
    if (data.description) formData.append('description', data.description)
    if (data.is_featured !== undefined) formData.append('is_featured', String(data.is_featured))

    const response = await apiClient.post('/employer/company/media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const apiData = response.data.data || response.data
    return apiData.media
  },

  async updateMedia(id: string, data: UpdateMediaData): Promise<CompanyMedia> {
    const response = await apiClient.put(`/employer/company/media/${id}`, data)
    const apiData = response.data.data || response.data
    return apiData.media
  },

  async deleteMedia(id: string): Promise<void> {
    await apiClient.delete(`/employer/company/media/${id}`)
  },

  async reorderMedia(data: ReorderMediaData): Promise<CompanyMedia[]> {
    const response = await apiClient.put('/employer/company/media/reorder', data)
    const apiData = response.data.data || response.data
    return apiData.media ?? []
  },
}
