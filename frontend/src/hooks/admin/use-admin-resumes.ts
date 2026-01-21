'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  adminResumesApi,
  ResumesFilters,
  ResumesPagination,
} from '@/lib/api/admin/resumes'

export const adminResumesKeys = {
  all: ['admin', 'resumes'] as const,
  lists: () => [...adminResumesKeys.all, 'list'] as const,
  list: (filters: ResumesFilters, pagination: ResumesPagination) =>
    [...adminResumesKeys.lists(), { filters, pagination }] as const,
  details: () => [...adminResumesKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminResumesKeys.details(), id] as const,
  stats: () => [...adminResumesKeys.all, 'stats'] as const,
  userResumes: (userId: string) => [...adminResumesKeys.all, 'user', userId] as const,
}

export function useAdminResumes(
  filters: ResumesFilters = {},
  pagination: ResumesPagination = { page: 1, limit: 20 }
) {
  return useQuery({
    queryKey: adminResumesKeys.list(filters, pagination),
    queryFn: () => adminResumesApi.getResumes(filters, pagination),
  })
}

export function useAdminResume(id: string) {
  return useQuery({
    queryKey: adminResumesKeys.detail(id),
    queryFn: () => adminResumesApi.getResume(id),
    enabled: !!id,
  })
}

export function useAdminResumeStats() {
  return useQuery({
    queryKey: adminResumesKeys.stats(),
    queryFn: () => adminResumesApi.getResumeStats(),
  })
}

export function useAdminUserResumes(userId: string) {
  return useQuery({
    queryKey: adminResumesKeys.userResumes(userId),
    queryFn: () => adminResumesApi.getUserResumes(userId),
    enabled: !!userId,
  })
}

export function useAdminResumeDownload() {
  return useMutation({
    mutationFn: (id: string) => adminResumesApi.getResumeDownloadUrl(id),
    onSuccess: (data) => {
      // Open download URL in new tab
      window.open(data.download_url, '_blank')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to get download URL')
    },
  })
}

export function useDeleteAdminResume() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminResumesApi.deleteResume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminResumesKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminResumesKeys.stats() })
      toast.success('Resume deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete resume')
    },
  })
}
