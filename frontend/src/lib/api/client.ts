import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/auth-store'
import { useAdminAuthStore } from '@/store/admin-auth-store'
import { ApiResponse, ApiError } from '@/types/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Use admin token for admin routes, otherwise use regular auth token
    const isAdminRoute = config.url?.startsWith('/admin')
    const token = isAdminRoute
      ? useAdminAuthStore.getState().accessToken
      : useAuthStore.getState().accessToken

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Track if we're currently refreshing to prevent multiple refresh attempts
let isRefreshing = false
let refreshPromise: Promise<string> | null = null

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<never>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Check for email not verified error (403 from login or 401 from middleware) - redirect to verify email page
    const errorData = error.response?.data?.error
    if ((error.response?.status === 403 || error.response?.status === 401) && errorData?.code === 'AUTH_002') {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/verify-email')) {
        window.location.href = '/verify-email'
      }
      return Promise.reject(errorData)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // Determine if this is an admin route
      const isAdminRoute = originalRequest.url?.startsWith('/admin')

      // If already refreshing, wait for that to complete
      if (isRefreshing && refreshPromise) {
        try {
          const newToken = await refreshPromise
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
          }
          return apiClient(originalRequest)
        } catch {
          return Promise.reject(error)
        }
      }

      try {
        const refreshToken = isAdminRoute
          ? useAdminAuthStore.getState().refreshToken
          : useAuthStore.getState().refreshToken

        if (refreshToken) {
          isRefreshing = true

          const refreshEndpoint = isAdminRoute ? '/admin/auth/refresh' : '/auth/refresh'

          refreshPromise = (async () => {
            const response = await axios.post(`${API_URL}${refreshEndpoint}`, {
              refresh_token: refreshToken,
            })
            // Backend returns { data: { access_token, token_type } }
            const { access_token } = response.data.data
            // Keep the existing refresh token since backend doesn't return a new one
            if (isAdminRoute) {
              useAdminAuthStore.getState().setTokens(access_token, refreshToken)
            } else {
              useAuthStore.getState().setTokens(access_token, refreshToken)
            }
            return access_token
          })()

          const newToken = await refreshPromise
          isRefreshing = false
          refreshPromise = null

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
          }
          return apiClient(originalRequest)
        } else {
          // No refresh token available - clear stale auth state
          if (isAdminRoute) {
            useAdminAuthStore.getState().logout()
          } else {
            useAuthStore.getState().logout()
          }
          return Promise.reject(error)
        }
      } catch (refreshError) {
        isRefreshing = false
        refreshPromise = null
        if (isAdminRoute) {
          useAdminAuthStore.getState().logout()
        } else {
          useAuthStore.getState().logout()
        }
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    const apiError: ApiError = error.response?.data?.error || {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
    }

    return Promise.reject(apiError)
  }
)

export default apiClient
