import { apiClient } from '../client'

export interface AdminReview {
  id: string
  company_id: string
  company_name: string
  company_logo?: string
  user_id: string
  reviewer_name: string
  reviewer_email: string
  rating: number
  title: string
  content?: string
  pros?: string
  cons?: string
  advice_to_management?: string
  is_anonymous?: boolean
  is_current_employee: boolean
  employment_status?: string
  job_title?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejection_reason?: string
  approved_at?: string
  approved_by?: string
  company_response?: string
  company_response_at?: string
  is_helpful_count: number
  created_at: string
  updated_at: string
}

export interface ReviewsFilters {
  search?: string
  status?: string
  rating?: number
  company_id?: string
  date_from?: string
  date_to?: string
}

export interface ReviewsPagination {
  page: number
  limit: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface ReviewsResponse {
  reviews: AdminReview[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export const adminReviewsApi = {
  async getReviews(filters: ReviewsFilters = {}, pagination: ReviewsPagination = { page: 1, limit: 20 }): Promise<ReviewsResponse> {
    const params = { ...filters, ...pagination }
    const response = await apiClient.get('/admin/reviews', { params })
    return response.data.data || response.data
  },

  async getPendingReviews(pagination: ReviewsPagination = { page: 1, limit: 20 }): Promise<ReviewsResponse> {
    const response = await apiClient.get('/admin/reviews/pending', { params: pagination })
    return response.data.data || response.data
  },

  async getReview(id: string): Promise<AdminReview> {
    const response = await apiClient.get(`/admin/reviews/${id}`)
    return response.data.data || response.data.review || response.data
  },

  async approveReview(id: string): Promise<AdminReview> {
    const response = await apiClient.post(`/admin/reviews/${id}/approve`)
    return response.data.data || response.data.review || response.data
  },

  async rejectReview(id: string, reason: string): Promise<AdminReview> {
    const response = await apiClient.post(`/admin/reviews/${id}/reject`, { reason })
    return response.data.data || response.data.review || response.data
  },

  async deleteReview(id: string): Promise<void> {
    await apiClient.delete(`/admin/reviews/${id}`)
  },
}
