import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '@/lib/api/profile'
import { UpdateProfileRequest } from '@/types/profile'
import { toast } from 'sonner'

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getMyProfile,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => profileApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['completeness'] })
      toast.success('Profile updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    },
  })
}

export function useCompleteness() {
  return useQuery({
    queryKey: ['completeness'],
    queryFn: profileApi.getCompleteness,
  })
}

export function useUploadAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => profileApi.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['completeness'] })
      toast.success('Avatar uploaded successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload avatar')
    },
  })
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: profileApi.deleteAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['completeness'] })
      toast.success('Avatar removed successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove avatar')
    },
  })
}
