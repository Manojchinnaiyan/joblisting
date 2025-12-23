'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Users,
  Building2,
  Briefcase,
  FileText,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Calendar,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatsCard } from '@/components/admin/stats-card'
import {
  useAnalyticsOverview,
  useAnalyticsUsers,
  useAnalyticsJobs,
  useAnalyticsCompanies,
} from '@/hooks/admin'

type Period = '7d' | '30d' | '90d' | '1y'

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('30d')

  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview(period)
  const { data: usersAnalytics, isLoading: usersLoading } = useAnalyticsUsers(period)
  const { data: jobsAnalytics, isLoading: jobsLoading } = useAnalyticsJobs(period)
  const { data: companiesAnalytics, isLoading: companiesLoading } = useAnalyticsCompanies(period)

  const isLoading = overviewLoading || usersLoading || jobsLoading || companiesLoading

  if (isLoading) {
    return <AnalyticsSkeleton />
  }

  // Map the DashboardStats structure to the expected format
  const stats = {
    totalUsers: overview?.users?.total || 0,
    totalCompanies: overview?.companies?.total || 0,
    totalJobs: overview?.jobs?.total || 0,
    totalApplications: overview?.applications?.total || 0,
    newUsersToday: overview?.users?.new_today || 0,
    activeJobs: overview?.jobs?.active || 0,
  }

  const trends = {
    users: { value: overview?.users?.growth || 0, isPositive: (overview?.users?.growth || 0) >= 0 },
    companies: { value: 0, isPositive: true },
    jobs: { value: 0, isPositive: true },
    applications: { value: 0, isPositive: true },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Platform performance and insights</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-40">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          trend={trends.users.isPositive ? 'up' : 'down'}
          trendValue={`${trends.users.value}%`}
          description="vs previous period"
        />
        <StatsCard
          title="Total Companies"
          value={stats.totalCompanies.toLocaleString()}
          icon={Building2}
          trend={trends.companies.isPositive ? 'up' : 'down'}
          trendValue={`${trends.companies.value}%`}
          description="vs previous period"
        />
        <StatsCard
          title="Active Jobs"
          value={stats.activeJobs.toLocaleString()}
          icon={Briefcase}
          trend={trends.jobs.isPositive ? 'up' : 'down'}
          trendValue={`${trends.jobs.value}%`}
          description="vs previous period"
        />
        <StatsCard
          title="Applications"
          value={stats.totalApplications.toLocaleString()}
          icon={FileText}
          trend={trends.applications.isPositive ? 'up' : 'down'}
          trendValue={`${trends.applications.value}%`}
          description="vs previous period"
        />
      </div>

      {/* Detailed Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Users Analytics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>New user registrations over time</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/analytics/users">
                View Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">New Users</span>
                <span className="text-2xl font-bold">
                  {usersAnalytics?.new_users_period?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Job Seekers</span>
                <span className="text-lg font-medium">
                  {usersAnalytics?.by_role?.job_seekers?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Employers</span>
                <span className="text-lg font-medium">
                  {usersAnalytics?.by_role?.employers?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Users</span>
                <span className="text-lg font-medium">
                  {usersAnalytics?.active_users?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs Analytics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Job Activity</CardTitle>
              <CardDescription>Job posting and application trends</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/analytics/jobs">
                View Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">New Jobs Posted</span>
                <span className="text-2xl font-bold">
                  {jobsAnalytics?.new_jobs_period?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Jobs</span>
                <span className="text-lg font-medium">
                  {jobsAnalytics?.active_jobs?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Featured Jobs</span>
                <span className="text-lg font-medium">
                  {jobsAnalytics?.featured_jobs?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Growth</span>
                <span className="text-lg font-medium">
                  {jobsAnalytics?.growth_percentage?.toFixed(1) || 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Companies Analytics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Company Activity</CardTitle>
              <CardDescription>Company registrations and verifications</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/analytics/companies">
                View Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">New Companies</span>
                <span className="text-2xl font-bold">
                  {companiesAnalytics?.new_companies_period?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Verified</span>
                <span className="text-lg font-medium">
                  {companiesAnalytics?.verified_companies?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending Verification</span>
                <span className="text-lg font-medium">
                  {companiesAnalytics?.by_status?.pending?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Companies</span>
                <span className="text-lg font-medium">
                  {companiesAnalytics?.active_companies?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Reports</CardTitle>
            <CardDescription>Access in-depth analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Button variant="default" className="justify-between" asChild>
                <Link href="/admin/analytics/overview">
                  <span className="flex items-center">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Comprehensive Overview
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="justify-between" asChild>
                <Link href="/admin/analytics/users">
                  <span className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    User Analytics
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="justify-between" asChild>
                <Link href="/admin/analytics/jobs">
                  <span className="flex items-center">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Job Analytics
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="justify-between" asChild>
                <Link href="/admin/analytics/companies">
                  <span className="flex items-center">
                    <Building2 className="mr-2 h-4 w-4" />
                    Company Analytics
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="justify-between" asChild>
                <Link href="/admin/security">
                  <span className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Security Analytics
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(jobsAnalytics?.top_categories || []).slice(0, 5).map((category: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{category.name}</span>
                  <span className="text-sm font-medium">{category.count} jobs</span>
                </div>
              ))}
              {(!jobsAnalytics?.top_categories || jobsAnalytics.top_categories.length === 0) && (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Industries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(companiesAnalytics?.by_industry || []).slice(0, 5).map((industry: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{industry.name}</span>
                  <span className="text-sm font-medium">{industry.count} companies</span>
                </div>
              ))}
              {(!companiesAnalytics?.by_industry || companiesAnalytics.by_industry.length === 0) && (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Company Sizes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(companiesAnalytics?.by_size || []).slice(0, 5).map((size: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{size.size}</span>
                  <span className="text-sm font-medium">{size.count} companies</span>
                </div>
              ))}
              {(!companiesAnalytics?.by_size || companiesAnalytics.by_size.length === 0) && (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-48 mt-1" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-4 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
