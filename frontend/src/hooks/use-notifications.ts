'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/lib/api/notifications'
import { toast } from 'sonner'

export function useNotifications(page: number = 1, perPage: number = 20) {
  return useQuery({
    queryKey: ['notifications', page, perPage],
    queryFn: () => notificationsApi.getNotifications(page, perPage),
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 30000, // Poll every 30 seconds
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('All notifications marked as read')
    },
    onError: () => {
      toast.error('Failed to mark all as read')
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationsApi.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Notification deleted')
    },
    onError: () => {
      toast.error('Failed to delete notification')
    },
  })
}

export function useClearReadNotifications() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationsApi.clearReadNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Read notifications cleared')
    },
    onError: () => {
      toast.error('Failed to clear notifications')
    },
  })
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => notificationsApi.getPreferences(),
  })
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationsApi.updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] })
      toast.success('Preferences updated')
    },
    onError: () => {
      toast.error('Failed to update preferences')
    },
  })
}
