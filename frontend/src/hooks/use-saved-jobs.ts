import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { savedJobsApi } from '@/lib/api/saved-jobs'
import { PaginationParams } from '@/types/api'
import { toast } from 'sonner'

export function useSavedJobs(pagination?: PaginationParams) {
  return useQuery({
    queryKey: ['saved-jobs', pagination],
    queryFn: () => savedJobsApi.getSavedJobs(pagination),
  })
}

export function useSaveJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobId: string) => savedJobsApi.saveJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] })
      toast.success('Job saved successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save job')
    },
  })
}

export function useUnsaveJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobId: string) => savedJobsApi.unsaveJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] })
      toast.success('Job removed from saved')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove saved job')
    },
  })
}
