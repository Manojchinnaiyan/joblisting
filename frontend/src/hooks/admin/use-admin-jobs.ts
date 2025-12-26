'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  adminJobsApi,
  JobsFilters,
  JobsPagination,
  UpdateJobData,
  AdminCreateJobData,
} from '@/lib/api/admin/jobs'

export const adminJobsKeys = {
  all: ['admin', 'jobs'] as const,
  lists: () => [...adminJobsKeys.all, 'list'] as const,
  list: (filters: JobsFilters, pagination: JobsPagination) =>
    [...adminJobsKeys.lists(), { filters, pagination }] as const,
  details: () => [...adminJobsKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminJobsKeys.details(), id] as const,
  pending: (pagination: JobsPagination) =>
    [...adminJobsKeys.all, 'pending', pagination] as const,
  stats: () => [...adminJobsKeys.all, 'stats'] as const,
}

export function useAdminJobs(
  filters: JobsFilters = {},
  pagination: JobsPagination = { page: 1, limit: 20 }
) {
  return useQuery({
    queryKey: adminJobsKeys.list(filters, pagination),
    queryFn: () => adminJobsApi.getJobs(filters, pagination),
  })
}

export function useAdminJob(id: string) {
  return useQuery({
    queryKey: adminJobsKeys.detail(id),
    queryFn: () => adminJobsApi.getJob(id),
    enabled: !!id,
  })
}

export function useCreateAdminJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AdminCreateJobData) => adminJobsApi.createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminJobsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminJobsKeys.stats() })
      toast.success('Job created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create job')
    },
  })
}

export function useUpdateAdminJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateJobData }) =>
      adminJobsApi.updateJob(id, data),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminJobsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminJobsKeys.detail(id) })
      toast.success('Job updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update job')
    },
  })
}

export function useDeleteAdminJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminJobsApi.deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminJobsKeys.lists() })
      toast.success('Job deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete job')
    },
  })
}

export function usePendingJobs(pagination: JobsPagination = { page: 1, limit: 20 }) {
  return useQuery({
    queryKey: adminJobsKeys.pending(pagination),
    queryFn: () => adminJobsApi.getPendingJobs(pagination),
  })
}

export function useApproveJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminJobsApi.approveJob(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: adminJobsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminJobsKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: [...adminJobsKeys.all, 'pending'] })
      toast.success('Job approved successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve job')
    },
  })
}

export function useRejectJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminJobsApi.rejectJob(id, reason),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminJobsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminJobsKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: [...adminJobsKeys.all, 'pending'] })
      toast.success('Job rejected')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject job')
    },
  })
}

export function useFeatureJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, until }: { id: string; until?: string }) =>
      adminJobsApi.featureJob(id, until),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminJobsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminJobsKeys.detail(id) })
      toast.success('Job featured successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to feature job')
    },
  })
}

export function useUnfeatureJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminJobsApi.unfeatureJob(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: adminJobsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminJobsKeys.detail(id) })
      toast.success('Job removed from featured')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to unfeature job')
    },
  })
}

export function useJobStats() {
  return useQuery({
    queryKey: adminJobsKeys.stats(),
    queryFn: () => adminJobsApi.getJobStats(),
  })
}

export function useReindexJobs() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => adminJobsApi.reindexJobs(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: adminJobsKeys.lists() })
      toast.success(`Successfully reindexed ${data.jobs_indexed} jobs for search`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reindex jobs')
    },
  })
}

// Alias for page imports
export const useDeleteJob = useDeleteAdminJob
