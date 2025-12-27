'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminAuthApi, AdminUser } from '@/lib/api/admin/auth'
import { useAdminAuthStore } from '@/store/admin-auth-store'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'

export const adminAuthKeys = {
  all: ['admin', 'auth'] as const,
  me: () => [...adminAuthKeys.all, 'me'] as const,
}

export function useAdminMe() {
  return useQuery({
    queryKey: adminAuthKeys.me(),
    queryFn: () => adminAuthApi.getMe(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useAdminLogin() {
  const { setTokens, setUser } = useAdminAuthStore()

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      adminAuthApi.login(email, password),
    onSuccess: (data) => {
      // Only set tokens if not requiring 2FA - let the component handle navigation
      if (!data.requires_2fa && data.access_token && data.refresh_token && data.user) {
        setTokens(data.access_token, data.refresh_token)
        setUser(data.user)
        toast.success('Login successful')
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Login failed')
    },
  })
}

export function useVerifyAdmin2FA() {
  const { tempToken, setTokens, setUser, clearTempToken } = useAdminAuthStore()
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (code: string) => adminAuthApi.verify2FA(code, tempToken!),
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token)
      setUser(data.user)
      clearTempToken()
      queryClient.invalidateQueries({ queryKey: adminAuthKeys.me() })
      toast.success('2FA verified successfully')
      router.push('/admin')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Invalid 2FA code')
    },
  })
}

export function useAdminLogout() {
  const { logout: adminLogout, refreshToken } = useAdminAuthStore()
  const { logout: userLogout } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => {
      if (refreshToken) {
        return adminAuthApi.logout(refreshToken)
      }
      return Promise.resolve()
    },
    onSuccess: () => {
      // Clear both admin and user auth stores
      adminLogout()
      userLogout()
      queryClient.clear()
      toast.success('Logged out successfully')
      // Use window.location for full page reload to ensure clean state
      window.location.href = '/'
    },
    onError: () => {
      // Clear both admin and user auth stores
      adminLogout()
      userLogout()
      queryClient.clear()
      // Use window.location for full page reload to ensure clean state
      window.location.href = '/'
    },
  })
}

export function useEnableAdmin2FA() {
  return useMutation({
    mutationFn: () => adminAuthApi.enable2FA(),
    onError: (error: any) => {
      toast.error(error.message || 'Failed to enable 2FA')
    },
  })
}

export function useDisableAdmin2FA() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (code: string) => adminAuthApi.disable2FA(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminAuthKeys.me() })
      toast.success('2FA disabled successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to disable 2FA')
    },
  })
}

// Alias for useAdminVerify2FA (used in login page)
export function useAdminVerify2FA() {
  const { setTokens, setUser, clearTempToken } = useAdminAuthStore()
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: ({ temp_token, code }: { temp_token: string; code: string }) =>
      adminAuthApi.verify2FA(code, temp_token),
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token)
      setUser(data.user)
      clearTempToken()
      queryClient.invalidateQueries({ queryKey: adminAuthKeys.me() })
      toast.success('2FA verified successfully')
      router.push('/admin')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Invalid 2FA code')
    },
  })
}

// Profile hooks
export function useAdminProfile() {
  return useQuery({
    queryKey: adminAuthKeys.me(),
    queryFn: () => adminAuthApi.getMe(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateAdminProfile() {
  const queryClient = useQueryClient()
  const { setUser } = useAdminAuthStore()

  return useMutation({
    mutationFn: (data: Partial<AdminUser>) => adminAuthApi.updateProfile(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: adminAuthKeys.me() })
      setUser(data)
      toast.success('Profile updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update profile')
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) =>
      adminAuthApi.changePassword(data.current_password, data.new_password),
    onSuccess: () => {
      toast.success('Password changed successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to change password')
    },
  })
}

// 2FA setup hooks
export function useEnable2FA() {
  return useMutation({
    mutationFn: () => adminAuthApi.enable2FA(),
    onError: (error: any) => {
      toast.error(error.message || 'Failed to start 2FA setup')
    },
  })
}

export function useVerifyEnable2FA() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ code }: { code: string }) => adminAuthApi.verifyEnable2FA(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminAuthKeys.me() })
      toast.success('2FA enabled successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Invalid verification code')
    },
  })
}

export function useDisable2FA() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ code }: { code: string }) => adminAuthApi.disable2FA(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminAuthKeys.me() })
      toast.success('2FA disabled successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to disable 2FA')
    },
  })
}
