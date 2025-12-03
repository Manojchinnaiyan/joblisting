import apiClient from './client'
import { ApiResponse, Pagination } from '@/types/api'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  link?: string
  data?: Record<string, unknown>
  is_read: boolean
  read_at?: string
  created_at: string
}

export type NotificationType =
  | 'APPLICATION_STATUS_CHANGE'
  | 'NEW_APPLICATION'
  | 'NEW_JOB_FROM_FOLLOWED_COMPANY'
  | 'JOB_EXPIRING_SOON'
  | 'PROFILE_VIEWED'
  | 'COMPANY_REVIEW_POSTED'
  | 'TEAM_INVITATION'
  | 'JOB_APPROVED'
  | 'JOB_REJECTED'
  | 'COMPANY_VERIFIED'
  | 'COMPANY_REJECTED'

export interface NotificationPreferences {
  user_id: string
  // Email notifications
  email_application_status: boolean
  email_new_application: boolean
  email_new_job: boolean
  email_job_expiring: boolean
  email_profile_viewed: boolean
  email_company_review: boolean
  email_team_invitation: boolean
  email_job_moderation: boolean
  email_company_verification: boolean
  // In-app notifications
  app_application_status: boolean
  app_new_application: boolean
  app_new_job: boolean
  app_job_expiring: boolean
  app_profile_viewed: boolean
  app_company_review: boolean
  app_team_invitation: boolean
  app_job_moderation: boolean
  app_company_verification: boolean
}

export interface NotificationsResponse {
  notifications: Notification[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

export const notificationsApi = {
  getNotifications: async (page: number = 1, perPage: number = 20): Promise<NotificationsResponse> => {
    const response = await apiClient.get<ApiResponse<NotificationsResponse>>(
      `/me/notifications?page=${page}&per_page=${perPage}`
    )
    return response.data.data!
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<ApiResponse<{ unread_count: number }>>('/me/notifications/unread')
    return response.data.data!.unread_count
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.put(`/me/notifications/${id}/read`)
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.put('/me/notifications/read-all')
  },

  deleteNotification: async (id: string): Promise<void> => {
    await apiClient.delete(`/me/notifications/${id}`)
  },

  clearReadNotifications: async (): Promise<void> => {
    await apiClient.delete('/me/notifications/clear')
  },

  getPreferences: async (): Promise<NotificationPreferences> => {
    const response = await apiClient.get<ApiResponse<{ preferences: NotificationPreferences }>>(
      '/me/notification-preferences'
    )
    return response.data.data!.preferences
  },

  updatePreferences: async (prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    const response = await apiClient.put<ApiResponse<{ preferences: NotificationPreferences }>>(
      '/me/notification-preferences',
      prefs
    )
    return response.data.data!.preferences
  },
}
