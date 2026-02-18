'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  adminLinkedInApi,
  LinkedInPostFilters,
  LinkedInAutoPostSettings,
  CustomPostRequest,
} from '@/lib/api/admin/linkedin'

export const adminLinkedInKeys = {
  all: ['admin', 'linkedin'] as const,
  status: () => [...adminLinkedInKeys.all, 'status'] as const,
  posts: (filters: LinkedInPostFilters) =>
    [...adminLinkedInKeys.all, 'posts', filters] as const,
  settings: () => [...adminLinkedInKeys.all, 'settings'] as const,
}

export function useLinkedInStatus() {
  return useQuery({
    queryKey: adminLinkedInKeys.status(),
    queryFn: () => adminLinkedInApi.getStatus(),
  })
}

export function useLinkedInPosts(filters: LinkedInPostFilters = {}) {
  return useQuery({
    queryKey: adminLinkedInKeys.posts(filters),
    queryFn: () => adminLinkedInApi.getPostHistory(filters),
  })
}

export function useLinkedInSettings() {
  return useQuery({
    queryKey: adminLinkedInKeys.settings(),
    queryFn: () => adminLinkedInApi.getSettings(),
  })
}

export function useConnectLinkedIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ code, state }: { code: string; state?: string }) =>
      adminLinkedInApi.handleCallback(code, state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminLinkedInKeys.status() })
      toast.success('LinkedIn connected successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to connect LinkedIn')
    },
  })
}

export function useDisconnectLinkedIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => adminLinkedInApi.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminLinkedInKeys.status() })
      toast.success('LinkedIn disconnected')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to disconnect LinkedIn')
    },
  })
}

export function usePostJobToLinkedIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobId: string) => adminLinkedInApi.postJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminLinkedInKeys.posts({}) })
      toast.success('Job posted to LinkedIn successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to post job to LinkedIn')
    },
  })
}

export function usePostBlogToLinkedIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (blogId: string) => adminLinkedInApi.postBlog(blogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminLinkedInKeys.posts({}) })
      toast.success('Blog posted to LinkedIn successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to post blog to LinkedIn')
    },
  })
}

export function usePostCustomToLinkedIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CustomPostRequest) => adminLinkedInApi.postCustom(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminLinkedInKeys.posts({}) })
      toast.success('Posted to LinkedIn successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to post to LinkedIn')
    },
  })
}

export function useUpdateLinkedInSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LinkedInAutoPostSettings) =>
      adminLinkedInApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminLinkedInKeys.settings() })
      toast.success('Auto-post settings updated')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update settings')
    },
  })
}
