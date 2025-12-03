'use client'

import { useQuery } from '@tanstack/react-query'
import {
  employerAnalyticsApi,
  AnalyticsPeriod,
} from '@/lib/api/employer/analytics'
import { useAuthStore } from '@/store/auth-store'

export const analyticsKeys = {
  all: ['employer', 'analytics'] as const,
  company: (period: AnalyticsPeriod) => [...analyticsKeys.all, 'company', period] as const,
  overview: (period: AnalyticsPeriod) => [...analyticsKeys.all, 'overview', period] as const,
  followers: (params: { page?: number; limit?: number }) =>
    [...analyticsKeys.all, 'followers', params] as const,
}

export function useCompanyAnalytics(period: AnalyticsPeriod = '30d') {
  const { accessToken, user, _hasHydrated } = useAuthStore()
  const isEnabled = _hasHydrated && !!accessToken && user?.role === 'EMPLOYER' && user?.email_verified === true

  return useQuery({
    queryKey: analyticsKeys.company(period),
    queryFn: () => employerAnalyticsApi.getCompanyAnalytics(period),
    enabled: isEnabled,
    retry: false,
  })
}

export function useOverviewAnalytics(period: AnalyticsPeriod = '30d') {
  const { accessToken, user, _hasHydrated } = useAuthStore()
  const isEnabled = _hasHydrated && !!accessToken && user?.role === 'EMPLOYER' && user?.email_verified === true

  return useQuery({
    queryKey: analyticsKeys.overview(period),
    queryFn: () => employerAnalyticsApi.getOverviewAnalytics(period),
    enabled: isEnabled,
    retry: false,
  })
}

export function useFollowers(params: { page?: number; limit?: number } = {}) {
  const { accessToken, user, _hasHydrated } = useAuthStore()
  const isEnabled = _hasHydrated && !!accessToken && user?.role === 'EMPLOYER' && user?.email_verified === true

  return useQuery({
    queryKey: analyticsKeys.followers(params),
    queryFn: () => employerAnalyticsApi.getFollowers(params),
    enabled: isEnabled,
    retry: false,
  })
}
