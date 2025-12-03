'use client'

import { useQuery } from '@tanstack/react-query'
import { adminAnalyticsApi, AnalyticsPeriod } from '@/lib/api/admin/analytics'

export const adminAnalyticsKeys = {
  all: ['admin', 'analytics'] as const,
  dashboard: () => [...adminAnalyticsKeys.all, 'dashboard'] as const,
  users: (period: AnalyticsPeriod) => [...adminAnalyticsKeys.all, 'users', period] as const,
  jobs: (period: AnalyticsPeriod) => [...adminAnalyticsKeys.all, 'jobs', period] as const,
  applications: (period: AnalyticsPeriod) =>
    [...adminAnalyticsKeys.all, 'applications', period] as const,
  companies: (period: AnalyticsPeriod) =>
    [...adminAnalyticsKeys.all, 'companies', period] as const,
  logins: (period: AnalyticsPeriod) => [...adminAnalyticsKeys.all, 'logins', period] as const,
  security: (period: AnalyticsPeriod) =>
    [...adminAnalyticsKeys.all, 'security', period] as const,
}

export function useDashboardStats() {
  return useQuery({
    queryKey: adminAnalyticsKeys.dashboard(),
    queryFn: () => adminAnalyticsApi.getDashboardStats(),
    staleTime: 60 * 1000,
  })
}

export function useUserAnalytics(period: AnalyticsPeriod = '30d') {
  return useQuery({
    queryKey: adminAnalyticsKeys.users(period),
    queryFn: () => adminAnalyticsApi.getUserAnalytics(period),
  })
}

export function useJobAnalytics(period: AnalyticsPeriod = '30d') {
  return useQuery({
    queryKey: adminAnalyticsKeys.jobs(period),
    queryFn: () => adminAnalyticsApi.getJobAnalytics(period),
  })
}

export function useApplicationAnalytics(period: AnalyticsPeriod = '30d') {
  return useQuery({
    queryKey: adminAnalyticsKeys.applications(period),
    queryFn: () => adminAnalyticsApi.getApplicationAnalytics(period),
  })
}

export function useCompanyAnalytics(period: AnalyticsPeriod = '30d') {
  return useQuery({
    queryKey: adminAnalyticsKeys.companies(period),
    queryFn: () => adminAnalyticsApi.getCompanyAnalytics(period),
  })
}

export function useLoginAnalytics(period: AnalyticsPeriod = '30d') {
  return useQuery({
    queryKey: adminAnalyticsKeys.logins(period),
    queryFn: () => adminAnalyticsApi.getLoginAnalytics(period),
  })
}

export function useSecurityAnalytics(period: AnalyticsPeriod = '30d') {
  return useQuery({
    queryKey: adminAnalyticsKeys.security(period),
    queryFn: () => adminAnalyticsApi.getSecurityAnalytics(period),
  })
}

// Aliases for page imports (with wrapper to accept optional period)
export function useAnalyticsOverview(_period?: AnalyticsPeriod) {
  return useDashboardStats()
}
export const useAnalyticsUsers = useUserAnalytics
export const useAnalyticsJobs = useJobAnalytics
export const useAnalyticsCompanies = useCompanyAnalytics
export const useAnalyticsSecurity = useSecurityAnalytics
