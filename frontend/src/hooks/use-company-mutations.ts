import { useMutation, useQueryClient } from '@tanstack/react-query'
import { companiesApi } from '@/lib/api/companies'
import { toast } from 'sonner'

export function useFollowCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (companyId: string) => companiesApi.followCompany(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast.success('Company followed successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to follow company')
    },
  })
}

export function useUnfollowCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (companyId: string) => companiesApi.unfollowCompany(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast.success('Company unfollowed')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to unfollow company')
    },
  })
}
