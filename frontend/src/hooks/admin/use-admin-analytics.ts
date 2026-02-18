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
  // New comprehensive analytics keys
  comprehensive: (period: AnalyticsPeriod) =>
    [...adminAnalyticsKeys.all, 'comprehensive', period] as const,
  topJobs: (period: AnalyticsPeriod, limit: number) =>
    [...adminAnalyticsKeys.all, 'topJobs', period, limit] as const,
  viewsByCountry: (period: AnalyticsPeriod) =>
    [...adminAnalyticsKeys.all, 'viewsByCountry', period] as const,
  viewsTimeSeries: (period: AnalyticsPeriod) =>
    [...adminAnalyticsKeys.all, 'viewsTimeSeries', period] as const,
  featuredJobs: (period: AnalyticsPeriod) =>
    [...adminAnalyticsKeys.all, 'featuredJobs', period] as const,
  monthlyActivity: (months: number) =>
    [...adminAnalyticsKeys.all, 'monthlyActivity', months] as const,
  conversions: (limit: number) =>
    [...adminAnalyticsKeys.all, 'conversions', limit] as const,
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

// New comprehensive analytics hooks
export function useComprehensiveAnalytics(period: AnalyticsPeriod = '30d') {
  return useQuery({
    queryKey: adminAnalyticsKeys.comprehensive(period),
    queryFn: () => adminAnalyticsApi.getComprehensiveAnalytics(period),
    staleTime: 60 * 1000,
  })
}

export function useTopViewedJobs(period: AnalyticsPeriod = '30d', limit: number = 20) {
  return useQuery({
    queryKey: adminAnalyticsKeys.topJobs(period, limit),
    queryFn: () => adminAnalyticsApi.getTopViewedJobs(period, limit),
  })
}

export function useViewsByCountry(period: AnalyticsPeriod = '30d') {
  return useQuery({
    queryKey: adminAnalyticsKeys.viewsByCountry(period),
    queryFn: () => adminAnalyticsApi.getViewsByCountry(period),
  })
}

export function useViewsTimeSeries(period: AnalyticsPeriod = '30d') {
  return useQuery({
    queryKey: adminAnalyticsKeys.viewsTimeSeries(period),
    queryFn: () => adminAnalyticsApi.getViewsTimeSeries(period),
  })
}

export function useFeaturedJobsAnalytics(period: AnalyticsPeriod = '30d') {
  return useQuery({
    queryKey: adminAnalyticsKeys.featuredJobs(period),
    queryFn: () => adminAnalyticsApi.getFeaturedJobsAnalytics(period),
  })
}

export function useMonthlyActivity(months: number = 12) {
  return useQuery({
    queryKey: adminAnalyticsKeys.monthlyActivity(months),
    queryFn: () => adminAnalyticsApi.getMonthlyActivity(months),
  })
}

export function useConversionAnalytics(limit: number = 20) {
  return useQuery({
    queryKey: adminAnalyticsKeys.conversions(limit),
    queryFn: () => adminAnalyticsApi.getConversionAnalytics(limit),
  })
}

export function useLoginHistory(params: { page?: number, limit?: number, status?: string, days?: number } = {}) {
  return useQuery({
    queryKey: [...adminAnalyticsKeys.all, 'loginHistory', params] as const,
    queryFn: () => adminAnalyticsApi.getLoginHistory(params),
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
