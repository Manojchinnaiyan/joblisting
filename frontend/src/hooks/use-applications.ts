import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { applicationsApi } from '@/lib/api/applications'
import { ApplicationFilters, ApplyToJobRequest } from '@/types/application'
import { PaginationParams } from '@/types/api'
import { toast } from 'sonner'

export function useApplications(filters?: ApplicationFilters, pagination?: PaginationParams) {
  return useQuery({
    queryKey: ['applications', filters, pagination],
    queryFn: () => applicationsApi.getMyApplications(filters, pagination),
  })
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: ['applications', id],
    queryFn: () => applicationsApi.getApplication(id),
    enabled: !!id,
  })
}

export function useApplyToJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: ApplyToJobRequest }) =>
      applicationsApi.applyToJob(jobId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      toast.success('Application submitted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit application')
    },
  })
}

export function useWithdrawApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobId: string) => applicationsApi.withdrawApplication(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      toast.success('Application withdrawn successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to withdraw application')
    },
  })
}

export function useApplicationForJob(jobId: string) {
  return useQuery({
    queryKey: ['application-for-job', jobId],
    queryFn: () => applicationsApi.getApplicationForJob(jobId),
    enabled: !!jobId,
  })
}
