'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  Calendar,
  Star,
  ArrowLeft,
} from 'lucide-react'
import dynamic from 'next/dynamic'

const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false })
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false })
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false })
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
import { StatsCard } from '@/components/admin/stats-card'
import { useJobAnalytics } from '@/hooks/admin/use-admin-analytics'
import { AnalyticsPeriod } from '@/lib/api/admin/analytics'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export default function JobAnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d')
  const { data: analytics, isLoading } = useJobAnalytics(period)

  if (isLoading) {
    return <JobAnalyticsSkeleton />
  }

  const jobsOverTimeData = analytics?.jobs_over_time?.map((item) => ({
    date: item.date,
    jobs: item.value,
  })) || []

  const byTypeData = analytics?.by_type
    ? [
        { name: 'Full Time', value: analytics.by_type.full_time },
        { name: 'Part Time', value: analytics.by_type.part_time },
        { name: 'Contract', value: analytics.by_type.contract },
        { name: 'Internship', value: analytics.by_type.internship },
        { name: 'Freelance', value: analytics.by_type.freelance },
      ].filter((d) => d.value > 0)
    : []

  const byExperienceData = analytics?.by_experience_level
    ? [
        { name: 'Entry', value: analytics.by_experience_level.entry },
        { name: 'Mid', value: analytics.by_experience_level.mid },
        { name: 'Senior', value: analytics.by_experience_level.senior },
        { name: 'Lead', value: analytics.by_experience_level.lead },
        { name: 'Executive', value: analytics.by_experience_level.executive },
      ].filter((d) => d.value > 0)
    : []

  const byWorkplaceData = analytics?.by_workplace_type
    ? [
        { name: 'Onsite', value: analytics.by_workplace_type.onsite, color: '#3b82f6' },
        { name: 'Remote', value: analytics.by_workplace_type.remote, color: '#10b981' },
        { name: 'Hybrid', value: analytics.by_workplace_type.hybrid, color: '#f59e0b' },
      ].filter((d) => d.value > 0)
    : []

  const byStatusData = analytics?.by_status
    ? [
        { label: 'Active', value: analytics.by_status.active, color: 'text-green-600' },
        { label: 'Pending', value: analytics.by_status.pending, color: 'text-yellow-600' },
        { label: 'Expired', value: analytics.by_status.expired, color: 'text-gray-600' },
        { label: 'Closed', value: analytics.by_status.closed, color: 'text-blue-600' },
        { label: 'Rejected', value: analytics.by_status.rejected, color: 'text-red-600' },
      ]
    : []

  const growthIsPositive = (analytics?.growth_percentage || 0) >= 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/analytics">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Job Analytics
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Detailed insights into job postings and activity
            </p>
          </div>
        </div>
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

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Jobs"
          value={analytics?.total_jobs?.toLocaleString() || '0'}
          icon={Briefcase}
        />
        <StatsCard
          title="Active Jobs"
          value={analytics?.active_jobs?.toLocaleString() || '0'}
          icon={Briefcase}
          description="Currently open positions"
        />
        <StatsCard
          title="New Jobs (Period)"
          value={analytics?.new_jobs_period?.toLocaleString() || '0'}
          icon={growthIsPositive ? TrendingUp : TrendingDown}
          trend={growthIsPositive ? 'up' : 'down'}
          trendValue={`${analytics?.growth_percentage?.toFixed(1) || 0}%`}
          description="vs previous period"
        />
        <StatsCard
          title="Featured Jobs"
          value={analytics?.featured_jobs?.toLocaleString() || '0'}
          icon={Star}
        />
      </div>

      {/* Jobs Over Time Chart */}
      {jobsOverTimeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Jobs Over Time</CardTitle>
            <CardDescription>Job posting activity trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={jobsOverTimeData}>
                  <defs>
                    <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tickFormatter={(value) => {
                      const d = new Date(value)
                      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }}
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [value, 'Jobs']}
                  />
                  <Area
                    type="monotone"
                    dataKey="jobs"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorJobs)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Breakdown & Top Categories */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Status */}
        <Card>
          <CardHeader>
            <CardTitle>Jobs by Status</CardTitle>
            <CardDescription>Current distribution of job statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {byStatusData.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className={`text-lg font-semibold ${item.color}`}>
                    {item.value.toLocaleString()}
                  </span>
                </div>
              ))}
              {byStatusData.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No status data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
            <CardDescription>Most popular job categories by active listings</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Jobs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics?.top_categories?.slice(0, 10).map((cat) => (
                  <TableRow key={cat.name}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-right">{cat.count.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {(!analytics?.top_categories || analytics.top_categories.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                      No category data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row: By Type, Experience, Workplace */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* By Job Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Job Type</CardTitle>
          </CardHeader>
          <CardContent>
            {byTypeData.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byTypeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="name" type="category" className="text-xs" width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Experience Level */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Experience Level</CardTitle>
          </CardHeader>
          <CardContent>
            {byExperienceData.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byExperienceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="name" type="category" className="text-xs" width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Workplace Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Workplace Type</CardTitle>
          </CardHeader>
          <CardContent>
            {byWorkplaceData.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byWorkplaceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    >
                      {byWorkplaceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function JobAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
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
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-72 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
