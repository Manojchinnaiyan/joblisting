'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminSettingsApi, AdminSetting } from '@/lib/api/admin/settings'

// Flat settings object for form consumption
export interface FlatSettings {
  [key: string]: string | number | boolean | object | undefined
  site_name?: string
  site_description?: string
  site_url?: string
  contact_email?: string
  support_email?: string
  default_currency?: string
  default_language?: string
  job_approval_required?: boolean
  max_jobs_per_company?: number
  job_expiry_days?: number
  featured_job_duration_days?: number
  allow_remote_jobs?: boolean
  allow_salary_negotiable?: boolean
  company_verification_required?: boolean
  max_team_members?: number
  allow_company_reviews?: boolean
  review_moderation_required?: boolean
  smtp_host?: string
  smtp_port?: number
  smtp_username?: string
  smtp_password?: string
  smtp_from_email?: string
  smtp_from_name?: string
  smtp_encryption?: 'none' | 'tls' | 'ssl'
}

function transformSettingsToFlat(settings: AdminSetting[]): FlatSettings {
  const flat: FlatSettings = {}
  settings.forEach(setting => {
    flat[setting.key] = setting.value as string | number | boolean | object
  })
  return flat
}

export const adminSettingsKeys = {
  all: ['admin', 'settings'] as const,
  lists: () => [...adminSettingsKeys.all, 'list'] as const,
  byCategory: () => [...adminSettingsKeys.all, 'byCategory'] as const,
  details: () => [...adminSettingsKeys.all, 'detail'] as const,
  detail: (key: string) => [...adminSettingsKeys.details(), key] as const,
}

export function useAdminSettings() {
  return useQuery({
    queryKey: adminSettingsKeys.lists(),
    queryFn: async () => {
      const response = await adminSettingsApi.getSettings()
      return transformSettingsToFlat(response.settings || [])
    },
  })
}

export function useAdminSettingsByCategory() {
  return useQuery({
    queryKey: adminSettingsKeys.byCategory(),
    queryFn: () => adminSettingsApi.getSettingsByCategory(),
  })
}

export function useAdminSetting(key: string) {
  return useQuery({
    queryKey: adminSettingsKeys.detail(key),
    queryFn: () => adminSettingsApi.getSetting(key),
    enabled: !!key,
  })
}

export function useUpdateSetting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string | number | boolean | object }) =>
      adminSettingsApi.updateSetting(key, value),
    onSuccess: (data, { key }) => {
      queryClient.invalidateQueries({ queryKey: adminSettingsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminSettingsKeys.byCategory() })
      queryClient.invalidateQueries({ queryKey: adminSettingsKeys.detail(key) })
      toast.success('Setting updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update setting')
    },
  })
}

export function useDeleteSetting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (key: string) => adminSettingsApi.deleteSetting(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminSettingsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminSettingsKeys.byCategory() })
      toast.success('Setting deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete setting')
    },
  })
}

export function useCreateSetting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      key: string
      value: string | number | boolean | object
      type: 'string' | 'number' | 'boolean' | 'json'
      category: string
      description?: string
      is_public?: boolean
    }) => adminSettingsApi.createSetting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminSettingsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminSettingsKeys.byCategory() })
      toast.success('Setting created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create setting')
    },
  })
}

// Bulk update function for multiple settings at once
export function useBulkUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Record<string, string | number | boolean | object | undefined>) => {
      const updates = Object.entries(data)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => adminSettingsApi.updateSetting(key, value!))
      await Promise.all(updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminSettingsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminSettingsKeys.byCategory() })
      toast.success('Settings updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update settings')
    },
  })
}

// Alias for page imports (use bulk update for form submissions)
export const useUpdateSettings = useBulkUpdateSettings
