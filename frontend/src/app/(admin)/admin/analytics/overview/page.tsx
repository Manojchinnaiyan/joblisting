'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Eye,
  MousePointer,
  TrendingUp,
  TrendingDown,
  Globe,
  Star,
  Calendar,
  BarChart3,
  Users,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import recharts to reduce initial bundle size
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false })
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false })
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false })
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false })
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false })
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false })
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false })
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false })
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false })
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useComprehensiveAnalytics,
  useMonthlyActivity,
} from '@/hooks/admin/use-admin-analytics'
import { AnalyticsPeriod } from '@/lib/api/admin/analytics'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export default function AnalyticsOverviewPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d')

  const { data: analytics, isLoading } = useComprehensiveAnalytics(period)
  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyActivity(12)

  if (isLoading || monthlyLoading) {
    return <AnalyticsSkeleton />
  }

  // Prepare chart data
  const viewsAndApplicationsData = analytics?.views_over_time?.map((view, index) => ({
    date: new Date(view.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    views: view.value,
    applications: analytics.applications_over_time?.[index]?.value || 0,
  })) || []

  const countryData = analytics?.views_by_country?.slice(0, 8).map(c => ({
    name: c.country || 'Unknown',
    value: c.views,
  })) || []

  const monthlyJobData = monthlyData?.job_postings?.map(m => ({
    month: m.date,
    jobs: m.value,
  })) || []

  const applicationStatusData = analytics ? [
    { name: 'Pending', value: analytics.applications_by_status.pending, color: '#f59e0b' },
    { name: 'Reviewed', value: analytics.applications_by_status.reviewed, color: '#3b82f6' },
    { name: 'Shortlisted', value: analytics.applications_by_status.shortlisted, color: '#8b5cf6' },
    { name: 'Interview', value: analytics.applications_by_status.interview, color: '#06b6d4' },
    { name: 'Offered', value: analytics.applications_by_status.offered, color: '#10b981' },
    { name: 'Hired', value: analytics.applications_by_status.hired, color: '#22c55e' },
    { name: 'Rejected', value: analytics.applications_by_status.rejected, color: '#ef4444' },
  ].filter(s => s.value > 0) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Analytics Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Comprehensive platform analytics and insights
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={(v) => setPeriod(v as AnalyticsPeriod)}>
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

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.views?.total?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                {analytics?.views?.period_total?.toLocaleString() || 0} this period
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_applications?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total job applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured Jobs</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.featured_jobs?.active_featured || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.featured_jobs?.total_featured || 0} total featured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Viewers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.user_activity?.unique_viewers?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.user_activity?.anonymous_views?.toLocaleString() || 0} anonymous visits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Views and Applications Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Views & Applications Over Time</CardTitle>
          <CardDescription>Daily job views and applications trend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={viewsAndApplicationsData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorViews)"
                  name="Views"
                />
                <Area
                  type="monotone"
                  dataKey="applications"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorApps)"
                  name="Applications"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Viewed Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Most Viewed Jobs
            </CardTitle>
            <CardDescription>Top performing job listings by views</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics?.top_viewed_jobs?.slice(0, 8).map((job) => (
                  <TableRow key={job.job_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/jobs/${job.job_id}`}
                          className="font-medium hover:underline truncate max-w-[200px]"
                        >
                          {job.job_title}
                        </Link>
                        {job.is_featured && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {job.company}
                      </p>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {job.views.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {job.clicks.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {(!analytics?.top_viewed_jobs || analytics.top_viewed_jobs.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No job view data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Views by Country */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Views by Country
            </CardTitle>
            <CardDescription>Geographic distribution of job views</CardDescription>
          </CardHeader>
          <CardContent>
            {countryData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={countryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {countryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No geographic data available
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {countryData.slice(0, 6).map((country, index) => (
                <div key={country.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm truncate">{country.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {country.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Monthly Job Postings
          </CardTitle>
          <CardDescription>Jobs posted per month over the last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyJobData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  className="text-xs"
                  tickFormatter={(value) => {
                    const [year, month] = value.split('-')
                    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short' })
                  }}
                />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [value, 'Jobs Posted']}
                />
                <Bar dataKey="jobs" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Featured Jobs Performance & Application Status */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Featured Jobs Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Featured Jobs Performance
            </CardTitle>
            <CardDescription>Compare featured vs regular job performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Active Featured Jobs</p>
                  <p className="text-2xl font-bold text-primary">
                    {analytics?.featured_jobs?.active_featured || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-right">Expired Featured</p>
                  <p className="text-2xl font-bold text-muted-foreground text-right">
                    {analytics?.featured_jobs?.expired_featured || 0}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Featured Avg Views</p>
                  <p className="text-xl font-semibold text-green-600">
                    {analytics?.featured_jobs?.featured_avg_views?.toFixed(0) || 0}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Regular Avg Views</p>
                  <p className="text-xl font-semibold text-slate-600">
                    {analytics?.featured_jobs?.non_featured_avg_views?.toFixed(0) || 0}
                  </p>
                </div>
              </div>

              {analytics?.featured_jobs?.featured_avg_views && analytics?.featured_jobs?.non_featured_avg_views ? (
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Featured jobs get{' '}
                    <strong>
                      {(
                        ((analytics.featured_jobs.featured_avg_views - analytics.featured_jobs.non_featured_avg_views) /
                          analytics.featured_jobs.non_featured_avg_views) *
                        100
                      ).toFixed(0)}%
                    </strong>{' '}
                    more views on average
                  </p>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Application Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Application Status Distribution</CardTitle>
            <CardDescription>Breakdown of all applications by status</CardDescription>
          </CardHeader>
          <CardContent>
            {applicationStatusData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={applicationStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {applicationStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No application data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Conversion Rates */}
      <Card>
        <CardHeader>
          <CardTitle>Best Converting Jobs</CardTitle>
          <CardDescription>Jobs with the highest view-to-application conversion rates</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Applications</TableHead>
                <TableHead className="text-right">Conversion Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics?.conversion_rates?.slice(0, 10).map((job) => (
                <TableRow key={job.job_id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/jobs/${job.job_id}`} className="hover:underline">
                      {job.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{job.company}</TableCell>
                  <TableCell className="text-right">{job.views.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{job.applications.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={job.conversion_rate > 5 ? 'default' : 'secondary'}
                      className={job.conversion_rate > 10 ? 'bg-green-600' : ''}
                    >
                      {job.conversion_rate.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {(!analytics?.conversion_rates || analytics.conversion_rates.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No conversion data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
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

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
