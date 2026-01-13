import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '@/lib/api/profile'
import { UpdateProfileRequest } from '@/types/profile'
import { toast } from 'sonner'
import { AxiosError } from 'axios'

// Get error message from axios error
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error instanceof AxiosError) {
    return error.response?.data?.error?.message || error.response?.data?.message || defaultMessage
  }
  if (error instanceof Error) {
    return error.message
  }
  return defaultMessage
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getMyProfile,
    retry: 1,
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
    onError: (error: unknown) => {
      const message = getErrorMessage(error, 'Failed to update profile')
      toast.error(message)
    },
  })
}

export function useCompleteness() {
  return useQuery({
    queryKey: ['completeness'],
    queryFn: profileApi.getCompleteness,
    retry: 1,
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
    onError: (error: unknown) => {
      const message = getErrorMessage(error, 'Failed to upload avatar')
      toast.error(message)
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
    onError: (error: unknown) => {
      const message = getErrorMessage(error, 'Failed to remove avatar')
      toast.error(message)
    },
  })
}
