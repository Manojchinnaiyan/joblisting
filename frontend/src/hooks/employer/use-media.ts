'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  employerMediaApi,
  CompanyMedia,
  UploadMediaData,
  UpdateMediaData,
  ReorderMediaData,
} from '@/lib/api/employer/media'

export const mediaKeys = {
  all: ['employer', 'media'] as const,
  list: () => [...mediaKeys.all, 'list'] as const,
}

export function useCompanyMedia() {
  return useQuery({
    queryKey: mediaKeys.list(),
    queryFn: () => employerMediaApi.getMedia(),
  })
}

export function useUploadMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UploadMediaData) => employerMediaApi.uploadMedia(data),
    onSuccess: (media) => {
      queryClient.setQueryData(mediaKeys.list(), (old: CompanyMedia[] | undefined) => {
        return old ? [...old, media] : [media]
      })
      toast.success('Media uploaded successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload media')
    },
  })
}

export function useUpdateMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMediaData }) =>
      employerMediaApi.updateMedia(id, data),
    onSuccess: (media) => {
      queryClient.setQueryData(mediaKeys.list(), (old: CompanyMedia[] | undefined) => {
        return old ? old.map((m) => (m.id === media.id ? media : m)) : [media]
      })
      toast.success('Media updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update media')
    },
  })
}

export function useDeleteMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => employerMediaApi.deleteMedia(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(mediaKeys.list(), (old: CompanyMedia[] | undefined) => {
        return old ? old.filter((m) => m.id !== id) : []
      })
      toast.success('Media deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete media')
    },
  })
}

export function useReorderMedia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ReorderMediaData) => employerMediaApi.reorderMedia(data),
    onSuccess: (media) => {
      queryClient.setQueryData(mediaKeys.list(), media)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reorder media')
    },
  })
}
