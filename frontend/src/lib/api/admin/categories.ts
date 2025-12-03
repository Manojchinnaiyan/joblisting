import { apiClient } from '../client'

export interface AdminCategory {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  parent_id?: string
  parent_name?: string
  sort_order: number
  is_active: boolean
  jobs_count: number
  created_at: string
  updated_at: string
  children?: AdminCategory[]
}

export interface CategoriesResponse {
  categories: AdminCategory[]
  total: number
}

export interface CreateCategoryData {
  name: string
  slug?: string
  description?: string
  icon?: string
  parent_id?: string
  sort_order?: number
  is_active?: boolean
}

export interface UpdateCategoryData {
  name?: string
  slug?: string
  description?: string
  icon?: string
  parent_id?: string
  sort_order?: number
  is_active?: boolean
}

export interface ReorderCategoriesData {
  categories: { id: string; sort_order: number }[]
}

export const adminCategoriesApi = {
  async getCategories(params?: { tree?: boolean }): Promise<CategoriesResponse> {
    const response = await apiClient.get('/admin/categories', { params })
    return response.data.data || response.data
  },

  async getCategory(id: string): Promise<AdminCategory> {
    const response = await apiClient.get(`/admin/categories/${id}`)
    return response.data.data || response.data.category || response.data
  },

  async createCategory(data: CreateCategoryData): Promise<AdminCategory> {
    const response = await apiClient.post('/admin/categories', data)
    return response.data.data || response.data.category || response.data
  },

  async updateCategory(id: string, data: UpdateCategoryData): Promise<AdminCategory> {
    const response = await apiClient.put(`/admin/categories/${id}`, data)
    return response.data.data || response.data.category || response.data
  },

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/admin/categories/${id}`)
  },

  async reorderCategories(data: ReorderCategoriesData): Promise<void> {
    await apiClient.post('/admin/categories/reorder', data)
  },
}
