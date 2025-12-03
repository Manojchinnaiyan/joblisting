import { apiClient } from '../client'

export type AnalyticsPeriod = '7d' | '30d' | '90d' | '1y' | 'all'

export interface TimeSeriesData {
  date: string
  value: number
}

export interface UserAnalytics {
  total_users: number
  active_users: number
  new_users_period: number
  growth_percentage: number
  by_role: {
    job_seekers: number
    employers: number
    admins: number
  }
  by_status: {
    active: number
    suspended: number
    pending: number
  }
  verification_rate: number
  registrations_over_time: TimeSeriesData[]
}

export interface JobAnalytics {
  total_jobs: number
  active_jobs: number
  new_jobs_period: number
  growth_percentage: number
  by_status: {
    active: number
    pending: number
    expired: number
    closed: number
    rejected: number
  }
  by_type: {
    full_time: number
    part_time: number
    contract: number
    internship: number
    freelance: number
  }
  by_experience_level: {
    entry: number
    mid: number
    senior: number
    lead: number
    executive: number
  }
  by_workplace_type: {
    onsite: number
    remote: number
    hybrid: number
  }
  average_time_to_fill?: number
  featured_jobs: number
  jobs_over_time: TimeSeriesData[]
  top_categories: { name: string; count: number }[]
}

export interface ApplicationAnalytics {
  total_applications: number
  new_applications_period: number
  growth_percentage: number
  by_status: {
    pending: number
    reviewed: number
    shortlisted: number
    interview: number
    offered: number
    hired: number
    rejected: number
    withdrawn: number
  }
  average_applications_per_job: number
  conversion_rate: number
  applications_over_time: TimeSeriesData[]
}

export interface CompanyAnalytics {
  total_companies: number
  active_companies: number
  new_companies_period: number
  growth_percentage: number
  by_status: {
    active: number
    pending: number
    suspended: number
  }
  verified_companies: number
  verification_rate: number
  featured_companies: number
  by_industry: { name: string; count: number }[]
  by_size: { size: string; count: number }[]
  companies_over_time: TimeSeriesData[]
}

export interface LoginAnalytics {
  total_logins_period: number
  successful_logins: number
  failed_logins: number
  locked_accounts: number
  success_rate: number
  unique_users: number
  logins_over_time: TimeSeriesData[]
  failed_logins_over_time: TimeSeriesData[]
  by_provider: {
    email: number
    google: number
  }
  peak_hours: { hour: number; count: number }[]
}

export interface SecurityAnalytics {
  failed_login_attempts: number
  locked_accounts: number
  suspicious_activities: number
  two_fa_adoption_rate: number
  admin_users_with_2fa: number
  recent_failed_logins: {
    user_email: string
    ip_address: string
    reason: string
    timestamp: string
  }[]
  ip_blocks: number
  active_sessions: number
}

export interface DashboardStats {
  users: {
    total: number
    new_today: number
    growth: number
  }
  companies: {
    total: number
    pending_verification: number
  }
  jobs: {
    total: number
    active: number
    pending_approval: number
  }
  applications: {
    total: number
    new_today: number
  }
  reviews: {
    pending_moderation: number
  }
}

export const adminAnalyticsApi = {
  async getUserAnalytics(period: AnalyticsPeriod = '30d'): Promise<UserAnalytics> {
    const response = await apiClient.get('/admin/analytics/users', { params: { period } })
    return response.data.data || response.data
  },

  async getJobAnalytics(period: AnalyticsPeriod = '30d'): Promise<JobAnalytics> {
    const response = await apiClient.get('/admin/analytics/jobs', { params: { period } })
    return response.data.data || response.data
  },

  async getApplicationAnalytics(period: AnalyticsPeriod = '30d'): Promise<ApplicationAnalytics> {
    const response = await apiClient.get('/admin/analytics/applications', { params: { period } })
    return response.data.data || response.data
  },

  async getCompanyAnalytics(period: AnalyticsPeriod = '30d'): Promise<CompanyAnalytics> {
    const response = await apiClient.get('/admin/analytics/companies', { params: { period } })
    return response.data.data || response.data
  },

  async getLoginAnalytics(period: AnalyticsPeriod = '30d'): Promise<LoginAnalytics> {
    const response = await apiClient.get('/admin/analytics/logins', { params: { period } })
    return response.data.data || response.data
  },

  async getSecurityAnalytics(period: AnalyticsPeriod = '30d'): Promise<SecurityAnalytics> {
    const response = await apiClient.get('/admin/analytics/security-events', { params: { period } })
    return response.data.data || response.data
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get('/admin/analytics/dashboard')
    return response.data.data || response.data
  },
}
