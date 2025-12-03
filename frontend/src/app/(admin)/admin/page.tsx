'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import {
  Users,
  Building2,
  Briefcase,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  UserPlus,
  Building,
  FileCheck,
  MessageSquare,
  Activity,
  Shield,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { StatsCard } from '@/components/admin/stats-card'
import { useAnalyticsOverview } from '@/hooks/admin'
import { formatDistanceToNow } from 'date-fns'

export default function AdminDashboardPage() {
  const { data: analytics, isLoading } = useAnalyticsOverview('30d')

  if (isLoading) {
    return <DashboardSkeleton />
  }

  const stats = {
    totalUsers: analytics?.users?.total || 0,
    totalCompanies: analytics?.companies?.total || 0,
    totalJobs: analytics?.jobs?.total || 0,
    totalApplications: analytics?.applications?.total || 0,
    newUsersToday: analytics?.users?.new_today || 0,
    activeJobs: analytics?.jobs?.active || 0,
    pendingVerifications: analytics?.companies?.pending_verification || 0,
    pendingJobApprovals: analytics?.jobs?.pending_approval || 0,
    pendingReviews: analytics?.reviews?.pending_moderation || 0,
  }

  const recentActivity: Array<{type: string, title: string, description: string, time: string, timestamp: string}> = []
  const trends = {
    users: { value: analytics?.users?.growth || 0, isPositive: (analytics?.users?.growth || 0) >= 0 },
    companies: { value: 0, isPositive: true },
    jobs: { value: 0, isPositive: true },
    applications: { value: 0, isPositive: true },
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
          Welcome back! Here&apos;s what&apos;s happening on your platform.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          trend={trends.users.isPositive ? 'up' : 'down'}
          trendValue={`${trends.users.value}%`}
          description="vs last month"
        />
        <StatsCard
          title="Companies"
          value={stats.totalCompanies.toLocaleString()}
          icon={Building2}
          trend={trends.companies.isPositive ? 'up' : 'down'}
          trendValue={`${trends.companies.value}%`}
          description="vs last month"
        />
        <StatsCard
          title="Active Jobs"
          value={stats.activeJobs.toLocaleString()}
          icon={Briefcase}
          trend={trends.jobs.isPositive ? 'up' : 'down'}
          trendValue={`${trends.jobs.value}%`}
          description="vs last month"
        />
        <StatsCard
          title="Applications"
          value={stats.totalApplications.toLocaleString()}
          icon={FileText}
          trend={trends.applications.isPositive ? 'up' : 'down'}
          trendValue={`${trends.applications.value}%`}
          description="vs last month"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">New Users Today</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">{stats.newUsersToday}</div>
            <p className="text-xs text-muted-foreground">
              Registered in the last 24 hours
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">{stats.totalJobs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeJobs} currently active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Platform Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Actions */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className={stats.pendingVerifications > 0 ? 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Pending Verifications</CardTitle>
            <Building className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">{stats.pendingVerifications}</div>
            <p className="text-xs text-muted-foreground mb-2 md:mb-3">
              Companies awaiting verification
            </p>
            {stats.pendingVerifications > 0 && (
              <Button variant="outline" size="sm" className="text-xs md:text-sm" asChild>
                <Link href="/admin/companies/pending">
                  Review Now
                  <ArrowRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className={stats.pendingJobApprovals > 0 ? 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Pending Job Approvals</CardTitle>
            <FileCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">{stats.pendingJobApprovals}</div>
            <p className="text-xs text-muted-foreground mb-2 md:mb-3">
              Jobs awaiting approval
            </p>
            {stats.pendingJobApprovals > 0 && (
              <Button variant="outline" size="sm" className="text-xs md:text-sm" asChild>
                <Link href="/admin/jobs/pending">
                  Review Now
                  <ArrowRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className={stats.pendingReviews > 0 ? 'border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6 md:pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Pending Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">{stats.pendingReviews}</div>
            <p className="text-xs text-muted-foreground mb-2 md:mb-3">
              Reviews awaiting moderation
            </p>
            {stats.pendingReviews > 0 && (
              <Button variant="outline" size="sm" className="text-xs md:text-sm" asChild>
                <Link href="/admin/reviews/pending">
                  Review Now
                  <ArrowRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No recent activity
                </p>
              ) : (
                recentActivity.slice(0, 8).map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`rounded-full p-2 ${getActivityIconColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {recentActivity.length > 8 && (
              <Button variant="ghost" className="w-full mt-4" asChild>
                <Link href="/admin/analytics/overview">
                  View All Activity
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Button variant="outline" className="justify-start h-auto py-3" asChild>
                <Link href="/admin/users/admins/new">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full p-2 bg-indigo-100 dark:bg-indigo-900">
                      <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Create Admin User</p>
                      <p className="text-xs text-muted-foreground">Add a new administrator</p>
                    </div>
                  </div>
                </Link>
              </Button>

              <Button variant="outline" className="justify-start h-auto py-3" asChild>
                <Link href="/admin/companies/pending">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full p-2 bg-orange-100 dark:bg-orange-900">
                      <Building2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Verify Companies</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.pendingVerifications} pending
                      </p>
                    </div>
                  </div>
                </Link>
              </Button>

              <Button variant="outline" className="justify-start h-auto py-3" asChild>
                <Link href="/admin/jobs/pending">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full p-2 bg-blue-100 dark:bg-blue-900">
                      <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Approve Jobs</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.pendingJobApprovals} pending
                      </p>
                    </div>
                  </div>
                </Link>
              </Button>

              <Button variant="outline" className="justify-start h-auto py-3" asChild>
                <Link href="/admin/reviews/pending">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full p-2 bg-purple-100 dark:bg-purple-900">
                      <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Moderate Reviews</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.pendingReviews} pending
                      </p>
                    </div>
                  </div>
                </Link>
              </Button>

              <Button variant="outline" className="justify-start h-auto py-3" asChild>
                <Link href="/admin/analytics/overview">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full p-2 bg-green-100 dark:bg-green-900">
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">View Analytics</p>
                      <p className="text-xs text-muted-foreground">Platform insights</p>
                    </div>
                  </div>
                </Link>
              </Button>

              <Button variant="outline" className="justify-start h-auto py-3" asChild>
                <Link href="/admin/settings">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full p-2 bg-slate-100 dark:bg-slate-800">
                      <Activity className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Platform Settings</p>
                      <p className="text-xs text-muted-foreground">Configure platform</p>
                    </div>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'user_registered':
      return <UserPlus className="h-4 w-4" />
    case 'company_created':
    case 'company_verified':
      return <Building2 className="h-4 w-4" />
    case 'job_posted':
    case 'job_approved':
      return <Briefcase className="h-4 w-4" />
    case 'application_submitted':
      return <FileText className="h-4 w-4" />
    case 'review_submitted':
      return <MessageSquare className="h-4 w-4" />
    default:
      return <Activity className="h-4 w-4" />
  }
}

function getActivityIconColor(type: string) {
  switch (type) {
    case 'user_registered':
      return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
    case 'company_created':
    case 'company_verified':
      return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
    case 'job_posted':
    case 'job_approved':
      return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400'
    case 'application_submitted':
      return 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400'
    case 'review_submitted':
      return 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400'
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <Skeleton className="h-7 md:h-9 w-48 md:w-64" />
        <Skeleton className="h-4 md:h-5 w-64 md:w-96 mt-2" />
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6 md:pb-2">
              <Skeleton className="h-3 md:h-4 w-16 md:w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <Skeleton className="h-6 md:h-8 w-16 md:w-20" />
              <Skeleton className="h-3 md:h-4 w-24 md:w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6 md:pb-2">
              <Skeleton className="h-3 md:h-4 w-24 md:w-28" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <Skeleton className="h-6 md:h-8 w-12 md:w-16" />
              <Skeleton className="h-3 md:h-4 w-32 md:w-40 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6 md:pb-2">
              <Skeleton className="h-3 md:h-4 w-28 md:w-32" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <Skeleton className="h-6 md:h-8 w-10 md:w-12" />
              <Skeleton className="h-3 md:h-4 w-28 md:w-36 mt-2" />
              <Skeleton className="h-8 md:h-9 w-20 md:w-24 mt-2 md:mt-3" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader className="p-3 md:p-6">
            <Skeleton className="h-5 md:h-6 w-28 md:w-32" />
            <Skeleton className="h-4 w-40 md:w-48" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="space-y-3 md:space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 md:p-6">
            <Skeleton className="h-5 md:h-6 w-24 md:w-28" />
            <Skeleton className="h-4 w-36 md:w-44" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="grid gap-2 md:gap-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-14 md:h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
