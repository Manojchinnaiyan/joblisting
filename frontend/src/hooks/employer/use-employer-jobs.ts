'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  employerJobsApi,
  EmployerJob,
  CreateJobData,
  UpdateJobData,
  GetJobsParams,
  JobsResponse,
} from '@/lib/api/employer/jobs'
import { useAuthStore } from '@/store/auth-store'

export const employerJobsKeys = {
  all: ['employer', 'jobs'] as const,
  list: (params: GetJobsParams) => [...employerJobsKeys.all, 'list', params] as const,
  detail: (id: string) => [...employerJobsKeys.all, 'detail', id] as const,
  analytics: (id: string) => [...employerJobsKeys.all, 'analytics', id] as const,
}

export function useEmployerJobs(params: GetJobsParams = {}) {
  const { accessToken, user, _hasHydrated } = useAuthStore()
  const isEnabled = _hasHydrated && !!accessToken && user?.role === 'EMPLOYER' && user?.email_verified === true

  return useQuery({
    queryKey: employerJobsKeys.list(params),
    queryFn: () => employerJobsApi.getMyJobs(params),
    enabled: isEnabled,
    retry: false,
  })
}

export function useEmployerJob(id: string) {
  const { accessToken, user, _hasHydrated } = useAuthStore()
  const isEnabled = _hasHydrated && !!accessToken && user?.role === 'EMPLOYER' && user?.email_verified === true && !!id

  return useQuery({
    queryKey: employerJobsKeys.detail(id),
    queryFn: () => employerJobsApi.getJob(id),
    enabled: isEnabled,
    retry: false,
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateJobData) => employerJobsApi.createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employerJobsKeys.all })
      toast.success('Job created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create job')
    },
  })
}

export function useUpdateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateJobData }) =>
      employerJobsApi.updateJob(id, data),
    onSuccess: (job) => {
      queryClient.setQueryData(employerJobsKeys.detail(job.id), job)
      queryClient.invalidateQueries({ queryKey: employerJobsKeys.all })
      toast.success('Job updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update job')
    },
  })
}

export function useDeleteJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => employerJobsApi.deleteJob(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: employerJobsKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: employerJobsKeys.all })
      toast.success('Job deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete job')
    },
  })
}

export function useCloseJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => employerJobsApi.closeJob(id),
    onSuccess: (job) => {
      queryClient.setQueryData(employerJobsKeys.detail(job.id), job)
      queryClient.invalidateQueries({ queryKey: employerJobsKeys.all })
      toast.success('Job closed successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to close job')
    },
  })
}

export function useRenewJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => employerJobsApi.renewJob(id),
    onSuccess: (job) => {
      queryClient.setQueryData(employerJobsKeys.detail(job.id), job)
      queryClient.invalidateQueries({ queryKey: employerJobsKeys.all })
      toast.success('Job renewed successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to renew job')
    },
  })
}

export function useBulkImportJobs() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => employerJobsApi.bulkImportJobs(file),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: employerJobsKeys.all })
      if (result.failed_count > 0) {
        toast.warning(
          `Imported ${result.success_count} jobs, ${result.failed_count} failed`
        )
      } else {
        toast.success(`Successfully imported ${result.success_count} jobs`)
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to import jobs')
    },
  })
}

export function useJobAnalytics(id: string) {
  const { accessToken, user, _hasHydrated } = useAuthStore()
  const isEnabled = _hasHydrated && !!accessToken && user?.role === 'EMPLOYER' && user?.email_verified === true && !!id

  return useQuery({
    queryKey: employerJobsKeys.analytics(id),
    queryFn: () => employerJobsApi.getJobAnalytics(id),
    enabled: isEnabled,
    retry: false,
  })
}

export function useDuplicateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => employerJobsApi.duplicateJob(id),
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: employerJobsKeys.all })
      toast.success('Job duplicated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to duplicate job')
    },
  })
}
