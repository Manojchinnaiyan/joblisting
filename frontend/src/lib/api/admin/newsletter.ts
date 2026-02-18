import apiClient from '../client'

export interface NewsletterSubscriber {
  id: string
  email: string
  subscribed_at: string
}

export interface NewsletterPagination {
  page?: number
  limit?: number
}

export interface NewsletterSubscribersResponse {
  subscribers: NewsletterSubscriber[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export const adminNewsletterApi = {
  getSubscribers: async (
    pagination: NewsletterPagination = { page: 1, limit: 20 }
  ): Promise<NewsletterSubscribersResponse> => {
    const params = new URLSearchParams()
    if (pagination.page) params.append('page', pagination.page.toString())
    if (pagination.limit) params.append('per_page', pagination.limit.toString())

    const response = await apiClient.get(`/admin/newsletter/subscribers?${params}`)
    const data = response.data.data || response.data
    return data
  },
}
