'use client'

import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Eye,
  FileText,
  Users,
  Briefcase,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useCompanyAnalytics, useOverviewAnalytics } from '@/hooks/employer/use-employer-analytics'
import { AnalyticsPeriod } from '@/lib/api/employer/analytics'
import { cn } from '@/lib/utils'

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor,
}: {
  title: string
  value: number | string
  change?: number
  icon: typeof TrendingUp
  iconColor: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
            {change !== undefined && (
              <p
                className={cn(
                  'mt-1 flex items-center text-sm',
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {change >= 0 ? (
                  <TrendingUp className="mr-1 h-4 w-4" />
                ) : (
                  <TrendingDown className="mr-1 h-4 w-4" />
                )}
                {change >= 0 ? '+' : ''}{change}% from last period
              </p>
            )}
          </div>
          <div className={cn('rounded-lg bg-muted p-3', iconColor)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d')
  const { data: overview, isLoading: overviewLoading } = useOverviewAnalytics(period)
  const { data: analytics, isLoading: analyticsLoading } = useCompanyAnalytics(period)

  const isLoading = overviewLoading || analyticsLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Track your company&apos;s performance and hiring metrics
          </p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as AnalyticsPeriod)}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Job Views"
          value={analytics?.job_views?.toLocaleString() || 0}
          change={analytics?.job_views_change}
          icon={Eye}
          iconColor="text-blue-500"
        />
        <StatCard
          title="Total Applications"
          value={overview?.total_applications?.toLocaleString() || 0}
          change={analytics?.applications_change}
          icon={FileText}
          iconColor="text-green-500"
        />
        <StatCard
          title="Active Jobs"
          value={overview?.active_jobs || 0}
          icon={Briefcase}
          iconColor="text-purple-500"
        />
        <StatCard
          title="Profile Views"
          value={analytics?.profile_views?.toLocaleString() || 0}
          change={analytics?.profile_views_change}
          icon={Users}
          iconColor="text-orange-500"
        />
      </div>

      {/* Application Funnel */}
      {overview?.application_funnel && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Application Funnel
            </CardTitle>
            <CardDescription>
              Track candidates through your hiring pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {[
                { label: 'Submitted', value: overview.application_funnel.submitted, color: 'bg-blue-500' },
                { label: 'Reviewed', value: overview.application_funnel.reviewed, color: 'bg-yellow-500' },
                { label: 'Shortlisted', value: overview.application_funnel.shortlisted, color: 'bg-purple-500' },
                { label: 'Interview', value: overview.application_funnel.interview, color: 'bg-indigo-500' },
                { label: 'Offered', value: overview.application_funnel.offered, color: 'bg-green-500' },
                { label: 'Hired', value: overview.application_funnel.hired, color: 'bg-emerald-500' },
              ].map((stage, index, arr) => {
                const conversionRate = index > 0 && arr[index - 1].value > 0
                  ? Math.round((stage.value / arr[index - 1].value) * 100)
                  : null
                return (
                  <div key={stage.label} className="text-center">
                    <div className={cn('mx-auto mb-2 h-2 w-full rounded-full', stage.color)} />
                    <p className="text-2xl font-bold">{stage.value}</p>
                    <p className="text-sm text-muted-foreground">{stage.label}</p>
                    {conversionRate !== null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {conversionRate}% conversion
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Performing Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Performing Jobs
            </CardTitle>
            <CardDescription>
              Jobs with the most views and applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.top_performing_jobs && analytics.top_performing_jobs.length > 0 ? (
              <div className="space-y-4">
                {analytics.top_performing_jobs.map((job, index) => (
                  <div key={job.id} className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{job.title}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {job.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {job.applications}
                        </span>
                        <span>
                          {job.views > 0 ? Math.round((job.applications / job.views) * 100) : 0}% apply rate
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="mx-auto h-12 w-12 opacity-50" />
                <p className="mt-2">No job data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Traffic Sources
            </CardTitle>
            <CardDescription>
              Where your job views are coming from
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.application_sources && analytics.application_sources.length > 0 ? (
              <div className="space-y-4">
                {analytics.application_sources.map((source) => (
                  <div key={source.source} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{source.source}</span>
                      <span className="text-sm text-muted-foreground">
                        {source.count.toLocaleString()} applications ({source.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${source.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="mx-auto h-12 w-12 opacity-50" />
                <p className="mt-2">No traffic data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Applications Over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Applications Over Time
          </CardTitle>
          <CardDescription>
            Daily application trends for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics?.applications_over_time && analytics.applications_over_time.length > 0 ? (
            <div className="h-64">
              {/* Simple bar chart representation */}
              <div className="flex h-full items-end gap-1">
                {analytics.applications_over_time.map((day, index) => {
                  const maxApplications = Math.max(...analytics.applications_over_time!.map(d => d.count))
                  const height = maxApplications > 0 ? (day.count / maxApplications) * 100 : 0
                  return (
                    <div
                      key={index}
                      className="flex-1 bg-primary rounded-t transition-all hover:bg-primary/80"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${day.date}: ${day.count} applications`}
                    />
                  )
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{analytics.applications_over_time[0]?.date}</span>
                <span>{analytics.applications_over_time[analytics.applications_over_time.length - 1]?.date}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">No application data available for this period</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Average Time to Hire</p>
            <p className="mt-2 text-2xl font-bold">
              {overview?.average_time_to_hire || '-'} days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Application Rate</p>
            <p className="mt-2 text-2xl font-bold">
              {analytics?.job_views && overview?.total_applications
                ? Math.round((overview.total_applications / analytics.job_views) * 100)
                : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Offers Sent</p>
            <p className="mt-2 text-2xl font-bold">
              {overview?.offers_sent || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Company Followers</p>
            <p className="mt-2 text-2xl font-bold">
              {analytics?.followers?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
