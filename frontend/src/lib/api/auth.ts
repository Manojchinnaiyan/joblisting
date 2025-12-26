import apiClient from './client'
import {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthResponse,
  User,
} from '@/types/auth'
import { ApiResponse } from '@/types/api'

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<any>>('/auth/login', data)
    const responseData = response.data.data!

    // Transform backend response to match frontend AuthResponse interface
    return {
      user: responseData.user,
      tokens: {
        access_token: responseData.access_token,
        refresh_token: responseData.refresh_token,
        expires_in: 86400, // 24 hours in seconds (default)
      }
    }
  },

  register: async (data: RegisterRequest): Promise<{ user: User }> => {
    const response = await apiClient.post<ApiResponse<{ user: User }>>('/auth/register', data)
    return response.data.data!
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refresh_token: refreshToken })
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<any>>('/auth/refresh', {
      refresh_token: refreshToken,
    })
    const responseData = response.data.data!

    // Transform backend response to match frontend AuthResponse interface
    return {
      user: responseData.user,
      tokens: {
        access_token: responseData.access_token,
        refresh_token: responseData.refresh_token,
        expires_in: 86400, // 24 hours in seconds (default)
      }
    }
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<void> => {
    await apiClient.post('/auth/forgot-password', data)
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
    await apiClient.post('/auth/reset-password', data)
  },

  verifyEmail: async (token: string): Promise<void> => {
    await apiClient.get(`/auth/verify-email/${token}`)
  },

  resendVerification: async (email: string): Promise<void> => {
    await apiClient.post('/auth/resend-verification', { email })
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me')
    return response.data.data!.user
  },

  getGoogleAuthUrl: (role: 'JOB_SEEKER' | 'EMPLOYER' = 'JOB_SEEKER'): string => {
    return `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/google?role=${role}`
  },

  // Session Management
  logoutAllDevices: async (): Promise<void> => {
    await apiClient.post('/auth/logout-all-devices')
  },

  getActiveSessions: async (): Promise<{ cache_sessions: number; database_sessions: number }> => {
    const response = await apiClient.get<ApiResponse<{ cache_sessions: number; database_sessions: number }>>('/auth/sessions')
    return response.data.data!
  },
}
