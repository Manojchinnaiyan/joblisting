'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Calendar,
  Star,
  ShieldCheck,
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
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false })

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
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
import { useCompanyAnalytics } from '@/hooks/admin/use-admin-analytics'
import { AnalyticsPeriod } from '@/lib/api/admin/analytics'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export default function CompanyAnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d')
  const { data: analytics, isLoading } = useCompanyAnalytics(period)

  if (isLoading) {
    return <CompanyAnalyticsSkeleton />
  }

  const companiesOverTimeData = analytics?.companies_over_time?.map((item) => ({
    date: item.date,
    companies: item.value,
  })) || []

  const byStatusData = analytics?.by_status
    ? [
        { name: 'Active', value: analytics.by_status.active, color: '#10b981' },
        { name: 'Pending', value: analytics.by_status.pending, color: '#f59e0b' },
        { name: 'Suspended', value: analytics.by_status.suspended, color: '#ef4444' },
      ].filter((d) => d.value > 0)
    : []

  const byIndustryData = analytics?.by_industry?.slice(0, 10) || []
  const bySizeData = analytics?.by_size?.slice(0, 8) || []

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
              Company Analytics
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Detailed insights into company registrations and activity
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
          title="Total Companies"
          value={analytics?.total_companies?.toLocaleString() || '0'}
          icon={Building2}
        />
        <StatsCard
          title="Active Companies"
          value={analytics?.active_companies?.toLocaleString() || '0'}
          icon={Building2}
          description="Currently active"
        />
        <StatsCard
          title="New Companies (Period)"
          value={analytics?.new_companies_period?.toLocaleString() || '0'}
          icon={growthIsPositive ? TrendingUp : TrendingDown}
          trend={growthIsPositive ? 'up' : 'down'}
          trendValue={`${analytics?.growth_percentage?.toFixed(1) || 0}%`}
          description="vs previous period"
        />
        <StatsCard
          title="Verified Companies"
          value={analytics?.verified_companies?.toLocaleString() || '0'}
          icon={ShieldCheck}
        />
      </div>

      {/* Verification & Featured Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Verification Rate</CardTitle>
            <CardDescription>Percentage of companies that are verified</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">
                  {analytics?.verification_rate?.toFixed(1) || 0}%
                </span>
                <span className="text-sm text-muted-foreground">
                  {analytics?.verified_companies || 0} of {analytics?.total_companies || 0}
                </span>
              </div>
              <Progress value={analytics?.verification_rate || 0} className="h-3" />
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Featured</p>
                  <p className="text-xl font-semibold">{analytics?.featured_companies || 0}</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-xl font-semibold">{analytics?.by_status?.pending || 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* By Status */}
        <Card>
          <CardHeader>
            <CardTitle>Companies by Status</CardTitle>
            <CardDescription>Current distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {byStatusData.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    >
                      {byStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
                No status data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Companies Over Time */}
      {companiesOverTimeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Company Registrations Over Time</CardTitle>
            <CardDescription>Monthly new company registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={companiesOverTimeData}>
                  <defs>
                    <linearGradient id="colorCompanies" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
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
                    formatter={(value) => [value, 'Companies']}
                  />
                  <Area
                    type="monotone"
                    dataKey="companies"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#colorCompanies)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* By Industry & By Size */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Industry */}
        <Card>
          <CardHeader>
            <CardTitle>Companies by Industry</CardTitle>
            <CardDescription>Distribution across industries</CardDescription>
          </CardHeader>
          <CardContent>
            {byIndustryData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byIndustryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="name" type="category" className="text-xs" width={120} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-muted-foreground text-sm">
                No industry data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Size */}
        <Card>
          <CardHeader>
            <CardTitle>Companies by Size</CardTitle>
            <CardDescription>Distribution by employee count</CardDescription>
          </CardHeader>
          <CardContent>
            {bySizeData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Companies</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bySizeData.map((item) => (
                    <TableRow key={item.size}>
                      <TableCell className="font-medium capitalize">
                        {item.size.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="text-right">{item.count.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No size data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CompanyAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
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
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-56 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-56 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
