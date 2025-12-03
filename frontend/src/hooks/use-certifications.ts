import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { certificationsApi } from '@/lib/api/certifications'
import { CreateCertificationRequest, UpdateCertificationRequest } from '@/types/certification'
import { toast } from 'sonner'

export function useCertifications() {
  return useQuery({
    queryKey: ['certifications'],
    queryFn: certificationsApi.getCertifications,
  })
}

export function useCreateCertification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCertificationRequest) =>
      certificationsApi.createCertification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications'] })
      queryClient.invalidateQueries({ queryKey: ['completeness'] })
      toast.success('Certification added successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add certification')
    },
  })
}

export function useUpdateCertification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCertificationRequest }) =>
      certificationsApi.updateCertification(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications'] })
      toast.success('Certification updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update certification')
    },
  })
}

export function useDeleteCertification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => certificationsApi.deleteCertification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications'] })
      queryClient.invalidateQueries({ queryKey: ['completeness'] })
      toast.success('Certification deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete certification')
    },
  })
}
