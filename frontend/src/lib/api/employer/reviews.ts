import { apiClient } from '../client'

export interface CompanyReview {
  id: string
  company_id: string
  user_id: string
  user_name?: string
  user_avatar?: string
  is_anonymous: boolean
  rating: number
  title: string
  pros?: string
  cons?: string
  employment_status?: string
  job_title?: string
  review_date: string
  is_verified: boolean
  helpful_count: number
  response?: ReviewResponse
  created_at: string
}

export interface ReviewResponse {
  id: string
  responder_name: string
  responder_title?: string
  content: string
  responded_at: string
}

export interface ReviewsResponse {
  reviews: CompanyReview[]
  total: number
  page: number
  limit: number
  average_rating: number
  rating_breakdown: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

export interface GetReviewsParams {
  page?: number
  limit?: number
  rating?: number
  sort?: 'newest' | 'oldest' | 'highest' | 'lowest'
}

export interface RespondToReviewData {
  content: string
}

export const employerReviewsApi = {
  async getCompanyReviews(params: GetReviewsParams = {}): Promise<ReviewsResponse> {
    const response = await apiClient.get('/employer/company/reviews', { params })
    // Backend returns { success, message, data: { reviews, total, ... } }
    const apiData = response.data.data || response.data
    return apiData
  },

  async respondToReview(id: string, data: RespondToReviewData): Promise<ReviewResponse> {
    const response = await apiClient.post(`/employer/company/reviews/${id}/respond`, data)
    const apiData = response.data.data || response.data
    return apiData.response
  },
}
