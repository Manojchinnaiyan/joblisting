import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { followingApi } from '@/lib/api/following'
import { PaginationParams } from '@/types/api'
import { toast } from 'sonner'

export function useFollowingCompanies(pagination?: PaginationParams) {
  return useQuery({
    queryKey: ['following-companies', pagination],
    queryFn: () => followingApi.getFollowingCompanies(pagination),
  })
}

export function useFollowCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (companyId: string) => followingApi.followCompany(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following-companies'] })
      toast.success('Company followed successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to follow company')
    },
  })
}

export function useUnfollowCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (companyId: string) => followingApi.unfollowCompany(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following-companies'] })
      toast.success('Company unfollowed successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to unfollow company')
    },
  })
}
