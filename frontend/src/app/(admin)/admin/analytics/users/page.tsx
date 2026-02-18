'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  UserCheck,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react'
import dynamic from 'next/dynamic'

const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false })
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false })
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
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatsCard } from '@/components/admin/stats-card'
import { useUserAnalytics } from '@/hooks/admin/use-admin-analytics'
import { AnalyticsPeriod } from '@/lib/api/admin/analytics'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function UserAnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d')
  const { data: analytics, isLoading } = useUserAnalytics(period)

  if (isLoading) {
    return <UserAnalyticsSkeleton />
  }

  const registrationsOverTimeData = analytics?.registrations_over_time?.map((item) => ({
    date: item.date,
    users: item.value,
  })) || []

  const byRoleData = analytics?.by_role
    ? [
        { name: 'Job Seekers', value: analytics.by_role.job_seekers, color: '#3b82f6' },
        { name: 'Employers', value: analytics.by_role.employers, color: '#10b981' },
        { name: 'Admins', value: analytics.by_role.admins, color: '#f59e0b' },
      ].filter((d) => d.value > 0)
    : []

  const byStatusData = analytics?.by_status
    ? [
        { name: 'Active', value: analytics.by_status.active, color: '#10b981' },
        { name: 'Suspended', value: analytics.by_status.suspended, color: '#ef4444' },
        { name: 'Pending', value: analytics.by_status.pending, color: '#f59e0b' },
      ].filter((d) => d.value > 0)
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
              User Analytics
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Detailed insights into user registrations and activity
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
          title="Total Users"
          value={analytics?.total_users?.toLocaleString() || '0'}
          icon={Users}
        />
        <StatsCard
          title="Active Users"
          value={analytics?.active_users?.toLocaleString() || '0'}
          icon={UserCheck}
          description="Users with active status"
        />
        <StatsCard
          title="New Users (Period)"
          value={analytics?.new_users_period?.toLocaleString() || '0'}
          icon={growthIsPositive ? TrendingUp : TrendingDown}
          trend={growthIsPositive ? 'up' : 'down'}
          trendValue={`${analytics?.growth_percentage?.toFixed(1) || 0}%`}
          description="vs previous period"
        />
        <StatsCard
          title="Verification Rate"
          value={`${analytics?.verification_rate?.toFixed(1) || 0}%`}
          icon={ShieldCheck}
          description="Email verified users"
        />
      </div>

      {/* Registrations Over Time */}
      {registrationsOverTimeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>User Registrations Over Time</CardTitle>
            <CardDescription>New user sign-ups trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={registrationsOverTimeData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
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
                    formatter={(value) => [value, 'New Users']}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role & Status Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Role */}
        <Card>
          <CardHeader>
            <CardTitle>Users by Role</CardTitle>
            <CardDescription>Distribution of user types</CardDescription>
          </CardHeader>
          <CardContent>
            {byRoleData.length > 0 ? (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byRoleData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                      >
                        {byRoleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-3">
                  {byRoleData.map((role) => (
                    <div key={role.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: role.color }}
                        />
                        <span className="text-sm">{role.name}</span>
                      </div>
                      <span className="text-sm font-medium">{role.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
                No role data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Status */}
        <Card>
          <CardHeader>
            <CardTitle>Users by Status</CardTitle>
            <CardDescription>Account status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {byStatusData.length > 0 ? (
              <>
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
                <div className="mt-4 space-y-3">
                  {byStatusData.map((status) => (
                    <div key={status.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        <span className="text-sm">{status.name}</span>
                      </div>
                      <span className="text-sm font-medium">{status.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
                No status data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Metrics</CardTitle>
          <CardDescription>Summary of all user statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Verification Rate</p>
              <div className="flex items-center gap-3">
                <Progress value={analytics?.verification_rate || 0} className="h-2 flex-1" />
                <span className="text-sm font-medium">{analytics?.verification_rate?.toFixed(1) || 0}%</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Job Seekers</p>
              <p className="text-xl font-semibold">{analytics?.by_role?.job_seekers?.toLocaleString() || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Employers</p>
              <p className="text-xl font-semibold">{analytics?.by_role?.employers?.toLocaleString() || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Admins</p>
              <p className="text-xl font-semibold">{analytics?.by_role?.admins?.toLocaleString() || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Suspended Accounts</p>
              <p className="text-xl font-semibold text-red-600">{analytics?.by_status?.suspended?.toLocaleString() || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Pending Accounts</p>
              <p className="text-xl font-semibold text-yellow-600">{analytics?.by_status?.pending?.toLocaleString() || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function UserAnalyticsSkeleton() {
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
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-72 w-full" />
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-56 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-56 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
