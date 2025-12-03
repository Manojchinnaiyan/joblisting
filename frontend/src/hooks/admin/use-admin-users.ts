'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  adminUsersApi,
  UsersFilters,
  UsersPagination,
  UpdateUserData,
  CreateAdminData,
} from '@/lib/api/admin/users'

export const adminUsersKeys = {
  all: ['admin', 'users'] as const,
  lists: () => [...adminUsersKeys.all, 'list'] as const,
  list: (filters: UsersFilters, pagination: UsersPagination) =>
    [...adminUsersKeys.lists(), { filters, pagination }] as const,
  details: () => [...adminUsersKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminUsersKeys.details(), id] as const,
  loginHistory: (id: string, pagination: UsersPagination) =>
    [...adminUsersKeys.all, 'loginHistory', id, pagination] as const,
}

export function useAdminUsers(
  filters: UsersFilters = {},
  pagination: UsersPagination = { page: 1, limit: 20 }
) {
  return useQuery({
    queryKey: adminUsersKeys.list(filters, pagination),
    queryFn: () => adminUsersApi.getUsers(filters, pagination),
  })
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: adminUsersKeys.detail(id),
    queryFn: () => adminUsersApi.getUser(id),
    enabled: !!id,
  })
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
      adminUsersApi.updateUser(id, data),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.detail(id) })
      toast.success('User updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user')
    },
  })
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminUsersApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists() })
      toast.success('User deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete user')
    },
  })
}

export function useSuspendUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      adminUsersApi.suspendUser(id, reason),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.detail(id) })
      toast.success('User suspended successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to suspend user')
    },
  })
}

export function useActivateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminUsersApi.activateUser(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.detail(id) })
      toast.success('User activated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to activate user')
    },
  })
}

export function useCreateAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAdminData) => adminUsersApi.createAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.lists() })
      toast.success('Admin created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create admin')
    },
  })
}

export function useUserLoginHistory(
  id: string,
  pagination: UsersPagination = { page: 1, limit: 20 }
) {
  return useQuery({
    queryKey: adminUsersKeys.loginHistory(id, pagination),
    queryFn: () => adminUsersApi.getUserLoginHistory(id, pagination),
    enabled: !!id,
  })
}

export function useRevokeUserSessions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminUsersApi.revokeUserSessions(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.detail(id) })
      toast.success('All sessions revoked successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to revoke sessions')
    },
  })
}

// Aliases for page imports
export const useUpdateUser = useUpdateAdminUser
export const useDeleteUser = useDeleteAdminUser
