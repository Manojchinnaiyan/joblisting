'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/lib/api/notifications'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth-store'

export function useNotifications(page: number = 1, perPage: number = 20) {
  const { isAuthenticated, accessToken, _hasHydrated } = useAuthStore()

  // Only enable when hydrated and authenticated with a valid token
  const isReady = _hasHydrated && isAuthenticated && !!accessToken

  return useQuery({
    queryKey: ['notifications', page, perPage],
    queryFn: () => notificationsApi.getNotifications(page, perPage),
    enabled: isReady,
    retry: false, // Don't retry on 401 errors
  })
}

export function useUnreadCount() {
  const { isAuthenticated, accessToken, _hasHydrated } = useAuthStore()

  // Only enable when hydrated and authenticated with a valid token
  const isReady = _hasHydrated && isAuthenticated && !!accessToken

  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: isReady ? 30000 : false, // Poll every 30 seconds only when authenticated
    enabled: isReady,
    retry: false, // Don't retry on 401 errors
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
  const { isAuthenticated, accessToken, _hasHydrated } = useAuthStore()

  // Only enable when hydrated and authenticated with a valid token
  const isReady = _hasHydrated && isAuthenticated && !!accessToken

  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => notificationsApi.getPreferences(),
    enabled: isReady,
    retry: false, // Don't retry on 401 errors
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
