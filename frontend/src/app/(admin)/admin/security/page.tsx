'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Monitor,
  Globe,
  Users,
  Lock,
  Key,
  Activity,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatsCard } from '@/components/admin/stats-card'
import { useAnalyticsSecurity } from '@/hooks/admin'

type Period = '7d' | '30d' | '90d'

export default function SecurityPage() {
  const [period, setPeriod] = useState<Period>('7d')
  const { data: security, isLoading } = useAnalyticsSecurity(period)

  if (isLoading) {
    return <SecuritySkeleton />
  }

  const stats = {
    totalLogins: security?.active_sessions || 0,
    failedLogins: security?.failed_login_attempts || 0,
    successRate: security?.failed_login_attempts ? 100 - (security.failed_login_attempts / (security.active_sessions || 1) * 100) : 100,
    uniqueUsers: security?.active_sessions || 0,
    suspiciousAttempts: security?.suspicious_activities || 0,
    twoFactorEnabled: security?.two_fa_adoption_rate || 0,
  }

  const recentLogins = security?.recent_failed_logins || []
  const suspiciousActivity: any[] = []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Security Overview</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Monitor platform security and authentication</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Security Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Logins"
          value={stats.totalLogins.toLocaleString()}
          icon={Users}
          description="Login attempts"
        />
        <StatsCard
          title="Success Rate"
          value={`${stats.successRate.toFixed(1)}%`}
          icon={CheckCircle}
          trend={stats.successRate >= 95 ? 'up' : 'down'}
          trendValue={stats.successRate >= 95 ? 'Healthy' : 'Needs attention'}
        />
        <StatsCard
          title="Failed Logins"
          value={stats.failedLogins.toLocaleString()}
          icon={XCircle}
          description="Failed attempts"
        />
        <StatsCard
          title="2FA Enabled"
          value={`${stats.twoFactorEnabled}%`}
          icon={Shield}
          description="Users with 2FA"
        />
      </div>

      {/* Alerts */}
      {stats.suspiciousAttempts > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
          <CardHeader className="flex flex-row items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
            <div>
              <CardTitle className="text-orange-800 dark:text-orange-200">
                Suspicious Activity Detected
              </CardTitle>
              <CardDescription className="text-orange-700 dark:text-orange-300">
                {stats.suspiciousAttempts} suspicious login attempts detected in the selected period
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Login Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Logins</CardTitle>
              <CardDescription>Latest authentication activity</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/security/login-history">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentLogins.length > 0 ? (
              <div className="space-y-4">
                {recentLogins.slice(0, 10).map((login: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b pb-3 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full p-2 ${
                          login.success
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {login.success ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{login.email}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {login.location || 'Unknown'}
                          <span>•</span>
                          {login.ip_address}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={login.success ? 'default' : 'destructive'}>
                        {login.success ? 'Success' : 'Failed'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(login.created_at), 'MMM d, HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No login activity recorded
              </p>
            )}
          </CardContent>
        </Card>

        {/* Security Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Security Metrics</CardTitle>
            <CardDescription>Platform security health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">2FA Adoption</span>
                  <span className="text-sm font-medium">{stats.twoFactorEnabled}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${stats.twoFactorEnabled}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Login Success Rate</span>
                  <span className="text-sm font-medium">{stats.successRate.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      stats.successRate >= 95 ? 'bg-green-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${stats.successRate}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Quick Actions</h4>
                <div className="grid gap-2">
                  <Button variant="outline" size="sm" className="justify-start" asChild>
                    <Link href="/admin/security/login-history">
                      <Clock className="mr-2 h-4 w-4" />
                      View Login History
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start" asChild>
                    <Link href="/admin/users?filter=suspended">
                      <Lock className="mr-2 h-4 w-4" />
                      Suspended Users
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start" asChild>
                    <Link href="/admin/settings">
                      <Key className="mr-2 h-4 w-4" />
                      Security Settings
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suspicious Activity */}
      {suspiciousActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Suspicious Activity
            </CardTitle>
            <CardDescription>Recent suspicious login attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suspiciousActivity.map((activity: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{activity.email}</TableCell>
                    <TableCell className="font-mono text-xs">{activity.ip_address}</TableCell>
                    <TableCell>{activity.location || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{activity.reason}</Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(activity.created_at), 'MMM d, HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/users?email=${activity.email}`}>
                          View User
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Login by Location */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Logins by Location</CardTitle>
            <CardDescription>Top login locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center py-4">
                No location data available
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logins by Device</CardTitle>
            <CardDescription>Top device types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center py-4">
                No device data available
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SecuritySkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64 mt-1" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-4 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-44" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full mt-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
