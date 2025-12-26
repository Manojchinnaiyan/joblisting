import { apiClient } from '../client'

// Types
export interface CacheStats {
  total_keys: number
  job_cache: number
  job_list_cache: number
  blog_cache: number
  blog_list_cache: number
  search_cache: number
  view_counters: number
  sessions: number
  user_sessions: number
  category_cache: number
  company_cache: number
  company_list_cache: number
  location_cache: number
  rate_limits: number
  redis_info: string
}

export interface CacheStatsResponse {
  success: boolean
  available: boolean
  stats: CacheStats
}

export interface CacheHealthResponse {
  status: 'healthy' | 'unavailable'
  available: boolean
}

export interface ViewCountsResponse {
  success: boolean
  type: string
  counts: Record<string, number>
  total: number
}

export interface CacheClearResponse {
  success: boolean
  message: string
  errors?: string[]
}

export interface KeyInfo {
  key: string
  type: string
  ttl: number
  size: number
}

export interface SearchKeysResponse {
  success: boolean
  keys: KeyInfo[]
  count: number
  pattern: string
  limit: number
}

export interface GetKeyResponse {
  success: boolean
  key: string
  type: string
  value: unknown
  ttl: number
}

export interface SetKeyRequest {
  key: string
  value: string
  ttl?: number
}

export interface RateLimitInfo {
  key: string
  ip: string
  endpoint: string
  count: number
  ttl: number
  is_blocked: boolean
}

export interface RateLimitsResponse {
  success: boolean
  rate_limits: RateLimitInfo[]
  total: number
  blocked_count: number
}

// Cache management API
export const adminCacheApi = {
  // Get cache health status
  async getHealth(): Promise<CacheHealthResponse> {
    const response = await apiClient.get('/admin/cache/health')
    return response.data
  },

  // Get cache statistics
  async getStats(): Promise<CacheStatsResponse> {
    const response = await apiClient.get('/admin/cache/stats')
    return response.data
  },

  // Get pending view counts
  async getViewCounts(type: 'job' | 'blog' = 'job'): Promise<ViewCountsResponse> {
    const response = await apiClient.get(`/admin/cache/view-counts?type=${type}`)
    return response.data
  },

  // Get rate limits
  async getRateLimits(): Promise<RateLimitsResponse> {
    const response = await apiClient.get('/admin/cache/rate-limits')
    return response.data
  },

  // Clear job cache
  async clearJobCache(): Promise<CacheClearResponse> {
    const response = await apiClient.post('/admin/cache/clear/jobs')
    return response.data
  },

  // Clear blog cache
  async clearBlogCache(): Promise<CacheClearResponse> {
    const response = await apiClient.post('/admin/cache/clear/blogs')
    return response.data
  },

  // Clear search cache
  async clearSearchCache(): Promise<CacheClearResponse> {
    const response = await apiClient.post('/admin/cache/clear/search')
    return response.data
  },

  // Clear company cache
  async clearCompanyCache(): Promise<CacheClearResponse> {
    const response = await apiClient.post('/admin/cache/clear/companies')
    return response.data
  },

  // Clear category cache
  async clearCategoryCache(): Promise<CacheClearResponse> {
    const response = await apiClient.post('/admin/cache/clear/categories')
    return response.data
  },

  // Clear location cache
  async clearLocationCache(): Promise<CacheClearResponse> {
    const response = await apiClient.post('/admin/cache/clear/locations')
    return response.data
  },

  // Clear session cache
  async clearSessionCache(): Promise<CacheClearResponse> {
    const response = await apiClient.post('/admin/cache/clear/sessions')
    return response.data
  },

  // Clear all caches
  async clearAllCache(): Promise<CacheClearResponse> {
    const response = await apiClient.post('/admin/cache/clear/all')
    return response.data
  },

  // Clear rate limits (optionally for specific IP or user)
  async clearRateLimits(ip?: string, userId?: string): Promise<CacheClearResponse> {
    const params = new URLSearchParams()
    if (ip) params.append('ip', ip)
    if (userId) params.append('user_id', userId)
    const query = params.toString() ? `?${params.toString()}` : ''
    const response = await apiClient.post(`/admin/cache/clear/rate-limits${query}`)
    return response.data
  },

  // Search keys
  async searchKeys(pattern: string = '*', limit: number = 100): Promise<SearchKeysResponse> {
    const response = await apiClient.get(`/admin/cache/keys/search?pattern=${encodeURIComponent(pattern)}&limit=${limit}`)
    return response.data
  },

  // Get key value
  async getKey(key: string): Promise<GetKeyResponse> {
    const response = await apiClient.get(`/admin/cache/key/${key}`)
    return response.data
  },

  // Set key value
  async setKey(data: SetKeyRequest): Promise<CacheClearResponse> {
    const response = await apiClient.post('/admin/cache/keys', data)
    return response.data
  },

  // Delete key
  async deleteKey(key: string): Promise<CacheClearResponse> {
    const response = await apiClient.delete(`/admin/cache/key/${key}`)
    return response.data
  },

  // Update key TTL
  async updateKeyTTL(key: string, ttl: number): Promise<CacheClearResponse> {
    const response = await apiClient.post('/admin/cache/keys/ttl', { key, ttl })
    return response.data
  },
}
