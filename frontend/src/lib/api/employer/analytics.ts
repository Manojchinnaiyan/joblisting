import { apiClient } from '../client'

export type AnalyticsPeriod = '7d' | '30d' | '90d' | '1y'

export interface CompanyAnalytics {
  period: AnalyticsPeriod
  profile_views: number
  profile_views_change: number
  job_views: number
  job_views_change: number
  applications: number
  applications_change: number
  followers: number
  followers_change: number
  views_over_time: { date: string; views: number }[]
  applications_over_time: { date: string; count: number }[]
  application_sources: { source: string; count: number; percentage: number }[]
  top_performing_jobs: TopPerformingJob[]
}

export interface TopPerformingJob {
  id: string
  title: string
  views: number
  applications: number
  conversion_rate: number
  status: string
}

export interface OverviewAnalytics {
  period: AnalyticsPeriod
  active_jobs: number
  total_applications: number
  new_applications: number
  pending_applications: number
  shortlisted_candidates: number
  interviews_scheduled: number
  offers_sent: number
  positions_filled: number
  average_time_to_hire: number
  application_funnel: ApplicationFunnel
}

export interface ApplicationFunnel {
  submitted: number
  reviewed: number
  shortlisted: number
  interview: number
  offered: number
  hired: number
}

export interface Follower {
  id: string
  user_id: string
  user_name: string
  user_avatar?: string
  user_headline?: string
  followed_at: string
}

export interface FollowersResponse {
  followers: Follower[]
  total: number
  page: number
  limit: number
}

export const employerAnalyticsApi = {
  async getCompanyAnalytics(period: AnalyticsPeriod = '30d'): Promise<CompanyAnalytics> {
    const response = await apiClient.get('/employer/company/stats', {
      params: { period },
    })
    // Backend returns { success, message, data: { ... } }
    const apiData = response.data.data || response.data
    return apiData
  },

  async getOverviewAnalytics(period: AnalyticsPeriod = '30d'): Promise<OverviewAnalytics> {
    const response = await apiClient.get('/employer/analytics/overview', {
      params: { period },
    })
    // Backend returns { success, message, data: { ... } }
    const apiData = response.data.data || response.data
    return apiData
  },

  async getFollowers(params: { page?: number; limit?: number } = {}): Promise<FollowersResponse> {
    const response = await apiClient.get('/employer/company/followers', { params })
    // Backend returns { success, message, data: { followers, pagination } }
    const apiData = response.data.data || response.data
    return {
      followers: apiData.followers || [],
      total: apiData.pagination?.total || 0,
      page: apiData.pagination?.page || 1,
      limit: apiData.pagination?.limit || 10,
    }
  },
}
