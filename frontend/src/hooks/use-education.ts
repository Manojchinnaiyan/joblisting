import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { educationApi } from '@/lib/api/education'
import { CreateEducationRequest, UpdateEducationRequest } from '@/types/education'
import { toast } from 'sonner'

export function useEducation() {
  return useQuery({
    queryKey: ['education'],
    queryFn: educationApi.getEducation,
  })
}

export function useCreateEducation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateEducationRequest) => educationApi.createEducation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education'] })
      queryClient.invalidateQueries({ queryKey: ['completeness'] })
      toast.success('Education added successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add education')
    },
  })
}

export function useUpdateEducation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEducationRequest }) =>
      educationApi.updateEducation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education'] })
      toast.success('Education updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update education')
    },
  })
}

export function useDeleteEducation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => educationApi.deleteEducation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education'] })
      queryClient.invalidateQueries({ queryKey: ['completeness'] })
      toast.success('Education deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete education')
    },
  })
}
