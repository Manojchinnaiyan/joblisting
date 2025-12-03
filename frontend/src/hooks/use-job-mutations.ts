import { useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi } from '@/lib/api/jobs'
import { toast } from 'sonner'

export function useSaveJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobId: string) => jobsApi.saveJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] })
      toast.success('Job saved successfully')
    },
    onError: (error: any) => {
      // If job is already saved, just refresh the data
      if (error.message?.includes('already saved')) {
        queryClient.invalidateQueries({ queryKey: ['jobs'] })
        queryClient.invalidateQueries({ queryKey: ['saved-jobs'] })
        toast.info('Job is already saved')
        return
      }
      toast.error(error.message || 'Failed to save job')
    },
  })
}

export function useUnsaveJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobId: string) => jobsApi.unsaveJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] })
      toast.success('Job removed from saved')
    },
    onError: (error: any) => {
      // If job is not saved, just refresh the data
      if (error.message?.includes('not saved') || error.message?.includes('not found')) {
        queryClient.invalidateQueries({ queryKey: ['jobs'] })
        queryClient.invalidateQueries({ queryKey: ['saved-jobs'] })
        toast.info('Job was not saved')
        return
      }
      toast.error(error.message || 'Failed to unsave job')
    },
  })
}
