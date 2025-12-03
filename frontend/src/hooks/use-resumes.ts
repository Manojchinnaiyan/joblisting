import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { resumesApi } from '@/lib/api/resumes'
import { UpdateResumeRequest } from '@/types/resume'
import { toast } from 'sonner'

export function useResumes() {
  return useQuery({
    queryKey: ['resumes'],
    queryFn: resumesApi.getMyResumes,
  })
}

export function useResume(id: string) {
  return useQuery({
    queryKey: ['resumes', id],
    queryFn: () => resumesApi.getResume(id),
    enabled: !!id,
  })
}

export function useUploadResume() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, title }: { file: File; title: string }) =>
      resumesApi.uploadResume(file, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] })
      queryClient.invalidateQueries({ queryKey: ['completeness'] })
      toast.success('Resume uploaded successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload resume')
    },
  })
}

export function useUpdateResume() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateResumeRequest }) =>
      resumesApi.updateResume(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] })
      toast.success('Resume updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update resume')
    },
  })
}

export function useDeleteResume() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => resumesApi.deleteResume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] })
      queryClient.invalidateQueries({ queryKey: ['completeness'] })
      toast.success('Resume deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete resume')
    },
  })
}

export function useSetPrimaryResume() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => resumesApi.setPrimaryResume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] })
      toast.success('Primary resume set successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to set primary resume')
    },
  })
}
