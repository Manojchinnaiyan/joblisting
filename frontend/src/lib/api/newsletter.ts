import apiClient from './client'

export const newsletterApi = {
  subscribe: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/newsletter/subscribe', { email })
    return response.data
  },

  unsubscribe: async (token: string): Promise<{ message: string }> => {
    const response = await apiClient.get(`/newsletter/unsubscribe?token=${encodeURIComponent(token)}`)
    return response.data
  },
}
