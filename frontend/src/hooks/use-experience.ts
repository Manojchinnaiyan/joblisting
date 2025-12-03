import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { experienceApi } from '@/lib/api/experience'
import { CreateExperienceRequest, UpdateExperienceRequest } from '@/types/experience'
import { toast } from 'sonner'

export function useExperiences() {
  return useQuery({
    queryKey: ['experiences'],
    queryFn: experienceApi.getExperiences,
  })
}

export function useCreateExperience() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateExperienceRequest) => experienceApi.createExperience(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] })
      queryClient.invalidateQueries({ queryKey: ['completeness'] })
      toast.success('Experience added successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add experience')
    },
  })
}

export function useUpdateExperience() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExperienceRequest }) =>
      experienceApi.updateExperience(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] })
      toast.success('Experience updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update experience')
    },
  })
}

export function useDeleteExperience() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => experienceApi.deleteExperience(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiences'] })
      queryClient.invalidateQueries({ queryKey: ['completeness'] })
      toast.success('Experience deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete experience')
    },
  })
}
