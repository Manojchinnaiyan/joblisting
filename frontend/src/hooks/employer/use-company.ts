'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  employerCompanyApi,
  Company,
  CreateCompanyData,
  UpdateCompanyData,
  RequestVerificationData,
  VerificationStatus,
} from '@/lib/api/employer/company'
import { useAuthStore } from '@/store/auth-store'

export const companyKeys = {
  all: ['employer', 'company'] as const,
  my: () => [...companyKeys.all, 'my'] as const,
  verification: () => [...companyKeys.all, 'verification'] as const,
}

export function useMyCompany() {
  const { accessToken, user, _hasHydrated } = useAuthStore()
  // Only fetch when authenticated as employer AND email is verified
  const isEnabled = _hasHydrated && !!accessToken && user?.role === 'EMPLOYER' && user?.email_verified === true

  return useQuery({
    queryKey: companyKeys.my(),
    queryFn: () => employerCompanyApi.getMyCompany(),
    enabled: isEnabled,
    retry: false, // Don't retry on error - company might not exist yet
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  })
}

export function useCreateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCompanyData) => employerCompanyApi.createCompany(data),
    onSuccess: (company) => {
      queryClient.setQueryData(companyKeys.my(), company)
      toast.success('Company created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create company')
    },
  })
}

export function useUpdateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateCompanyData) => employerCompanyApi.updateCompany(data),
    onSuccess: (company) => {
      queryClient.setQueryData(companyKeys.my(), company)
      toast.success('Company updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update company')
    },
  })
}

export function useDeleteCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => employerCompanyApi.deleteCompany(),
    onSuccess: () => {
      queryClient.setQueryData(companyKeys.my(), null)
      queryClient.invalidateQueries({ queryKey: companyKeys.all })
      toast.success('Company deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete company')
    },
  })
}

export function useUploadLogo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => employerCompanyApi.uploadLogo(file),
    onSuccess: (data) => {
      queryClient.setQueryData(companyKeys.my(), (old: Company | null | undefined) => {
        if (!old) return old
        return { ...old, logo_url: data.logo_url }
      })
      toast.success('Logo uploaded successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload logo')
    },
  })
}

export function useDeleteLogo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => employerCompanyApi.deleteLogo(),
    onSuccess: () => {
      queryClient.setQueryData(companyKeys.my(), (old: Company | null | undefined) => {
        if (!old) return old
        return { ...old, logo_url: undefined }
      })
      toast.success('Logo removed successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove logo')
    },
  })
}

export function useUploadCover() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => employerCompanyApi.uploadCover(file),
    onSuccess: (data) => {
      queryClient.setQueryData(companyKeys.my(), (old: Company | null | undefined) => {
        if (!old) return old
        return { ...old, cover_image_url: data.cover_image_url }
      })
      toast.success('Cover image uploaded successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload cover image')
    },
  })
}

export function useDeleteCover() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => employerCompanyApi.deleteCover(),
    onSuccess: () => {
      queryClient.setQueryData(companyKeys.my(), (old: Company | null | undefined) => {
        if (!old) return old
        return { ...old, cover_image_url: undefined }
      })
      toast.success('Cover image removed successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove cover image')
    },
  })
}

export function useVerificationStatus() {
  const { accessToken, user, _hasHydrated } = useAuthStore()
  // Only fetch when authenticated as employer AND email is verified
  const isEnabled = _hasHydrated && !!accessToken && user?.role === 'EMPLOYER' && user?.email_verified === true

  return useQuery({
    queryKey: companyKeys.verification(),
    queryFn: () => employerCompanyApi.getVerificationStatus(),
    enabled: isEnabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useRequestVerification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RequestVerificationData) => employerCompanyApi.requestVerification(data),
    onSuccess: (verification) => {
      queryClient.setQueryData(companyKeys.verification(), verification)
      toast.success('Verification request submitted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit verification request')
    },
  })
}
