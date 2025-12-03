'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  adminCompaniesApi,
  CompaniesFilters,
  CompaniesPagination,
  UpdateCompanyData,
} from '@/lib/api/admin/companies'

export const adminCompaniesKeys = {
  all: ['admin', 'companies'] as const,
  lists: () => [...adminCompaniesKeys.all, 'list'] as const,
  list: (filters: CompaniesFilters, pagination: CompaniesPagination) =>
    [...adminCompaniesKeys.lists(), { filters, pagination }] as const,
  details: () => [...adminCompaniesKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminCompaniesKeys.details(), id] as const,
  pending: (pagination: CompaniesPagination) =>
    [...adminCompaniesKeys.all, 'pending', pagination] as const,
}

export function useAdminCompanies(
  filters: CompaniesFilters = {},
  pagination: CompaniesPagination = { page: 1, limit: 20 }
) {
  return useQuery({
    queryKey: adminCompaniesKeys.list(filters, pagination),
    queryFn: () => adminCompaniesApi.getCompanies(filters, pagination),
  })
}

export function useAdminCompany(id: string) {
  return useQuery({
    queryKey: adminCompaniesKeys.detail(id),
    queryFn: () => adminCompaniesApi.getCompany(id),
    enabled: !!id,
  })
}

export function useUpdateAdminCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCompanyData }) =>
      adminCompaniesApi.updateCompany(id, data),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminCompaniesKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminCompaniesKeys.detail(id) })
      toast.success('Company updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update company')
    },
  })
}

export function useDeleteAdminCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminCompaniesApi.deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCompaniesKeys.lists() })
      toast.success('Company deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete company')
    },
  })
}

export function usePendingVerifications(
  pagination: CompaniesPagination = { page: 1, limit: 20 }
) {
  return useQuery({
    queryKey: adminCompaniesKeys.pending(pagination),
    queryFn: () => adminCompaniesApi.getPendingVerifications(pagination),
  })
}

export function useVerifyCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminCompaniesApi.verifyCompany(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: adminCompaniesKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminCompaniesKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: [...adminCompaniesKeys.all, 'pending'] })
      toast.success('Company verified successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to verify company')
    },
  })
}

export function useRejectVerification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminCompaniesApi.rejectVerification(id, reason),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminCompaniesKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminCompaniesKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: [...adminCompaniesKeys.all, 'pending'] })
      toast.success('Verification rejected')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject verification')
    },
  })
}

export function useUnverifyCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminCompaniesApi.unverifyCompany(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: adminCompaniesKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminCompaniesKeys.detail(id) })
      toast.success('Company verification removed')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to unverify company')
    },
  })
}

export function useFeatureCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, until }: { id: string; until?: string }) =>
      adminCompaniesApi.featureCompany(id, until),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminCompaniesKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminCompaniesKeys.detail(id) })
      toast.success('Company featured successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to feature company')
    },
  })
}

export function useUnfeatureCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminCompaniesApi.unfeatureCompany(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: adminCompaniesKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminCompaniesKeys.detail(id) })
      toast.success('Company removed from featured')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to unfeature company')
    },
  })
}

export function useSuspendCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      adminCompaniesApi.suspendCompany(id, reason),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminCompaniesKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminCompaniesKeys.detail(id) })
      toast.success('Company suspended successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to suspend company')
    },
  })
}

export function useActivateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminCompaniesApi.activateCompany(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: adminCompaniesKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminCompaniesKeys.detail(id) })
      toast.success('Company activated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to activate company')
    },
  })
}

// Aliases for page imports
export const useUpdateCompany = useUpdateAdminCompany
export const useDeleteCompany = useDeleteAdminCompany
export const useRejectCompany = useRejectVerification
