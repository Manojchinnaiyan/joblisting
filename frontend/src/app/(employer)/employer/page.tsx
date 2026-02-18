'use client'

import Link from 'next/link'
import { Briefcase, FileText, Eye, Users, Clock, ArrowRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatsCard } from '@/components/employer/stats-card'
import { useMyCompany } from '@/hooks/employer/use-company'
import { useOverviewAnalytics } from '@/hooks/employer/use-employer-analytics'
import { useEmployerJobs } from '@/hooks/employer/use-employer-jobs'
import { useAllApplications } from '@/hooks/employer/use-employer-applications'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-800',
  reviewed: 'bg-yellow-100 text-yellow-800',
  shortlisted: 'bg-purple-100 text-purple-800',
  interview: 'bg-indigo-100 text-indigo-800',
  offered: 'bg-green-100 text-green-800',
  hired: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-800',
}

export default function EmployerDashboardPage() {
  const { data: company } = useMyCompany()
  const { data: analytics, isLoading: analyticsLoading } = useOverviewAnalytics('30d')
  const { data: jobsData, isLoading: jobsLoading } = useEmployerJobs({ limit: 5, status: 'active' })
  const { data: applicationsData, isLoading: applicationsLoading } = useAllApplications({
    limit: 5,
    sort: 'newest',
  })

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with {company?.name || 'your company'} today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/employer-applications">
              <FileText className="mr-2 h-4 w-4" />
              View Applications
            </Link>
          </Button>
          <Button asChild>
            <Link href="/employer-jobs/new">
              <Plus className="mr-2 h-4 w-4" />
              Post Job
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {analyticsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Active Jobs"
            value={analytics?.active_jobs ?? 0}
            icon={Briefcase}
            iconColor="text-blue-500"
          />
          <StatsCard
            title="Total Applications"
            value={analytics?.total_applications ?? 0}
            icon={FileText}
            iconColor="text-green-500"
          />
          <StatsCard
            title="New Applications"
            value={analytics?.new_applications ?? 0}
            icon={Clock}
            iconColor="text-orange-500"
          />
          <StatsCard
            title="Company Followers"
            value={company?.followers_count ?? 0}
            icon={Users}
            iconColor="text-purple-500"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>Latest candidates who applied to your jobs</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/employer-applications">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {applicationsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !applicationsData?.applications || applicationsData.applications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 opacity-50" />
                <p className="mt-2">No applications yet</p>
                <p className="text-sm">Applications will appear here once candidates apply</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applicationsData?.applications?.map((application) => (
                  <Link
                    key={application.id}
                    href={`/employer-applications/${application.id}`}
                    className="flex items-center gap-4 rounded-lg p-2 transition-colors hover:bg-muted"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                      {application.applicant_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{application.applicant_name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        Applied for {application.job_title}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant="secondary"
                        className={cn('capitalize', statusColors[application.status])}
                      >
                        {application.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(application.applied_at), { addSuffix: true })}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Jobs</CardTitle>
              <CardDescription>Your currently open positions</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/employer-jobs">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : !jobsData?.jobs || jobsData.jobs.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Briefcase className="mx-auto h-12 w-12 opacity-50" />
                <p className="mt-2">No active jobs</p>
                <Button asChild className="mt-4">
                  <Link href="/employer-jobs/new">Post your first job</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobsData?.jobs?.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block rounded-lg p-3 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{job.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {job.location || 'Remote'} • {job.job_type.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{job.applications_count}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Eye className="h-4 w-4" />
                          <span>{job.views_count}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Application Funnel */}
      {analytics?.application_funnel && (
        <Card>
          <CardHeader>
            <CardTitle>Application Funnel</CardTitle>
            <CardDescription>Track candidates through your hiring process</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {[
                { label: 'Submitted', value: analytics.application_funnel.submitted, color: 'bg-blue-500' },
                { label: 'Reviewed', value: analytics.application_funnel.reviewed, color: 'bg-yellow-500' },
                { label: 'Shortlisted', value: analytics.application_funnel.shortlisted, color: 'bg-purple-500' },
                { label: 'Interview', value: analytics.application_funnel.interview, color: 'bg-indigo-500' },
                { label: 'Offered', value: analytics.application_funnel.offered, color: 'bg-green-500' },
                { label: 'Hired', value: analytics.application_funnel.hired, color: 'bg-emerald-500' },
              ].map((stage) => (
                <div key={stage.label} className="text-center">
                  <div className={cn('mx-auto mb-2 h-2 w-full rounded-full', stage.color)} />
                  <p className="text-2xl font-bold">{stage.value}</p>
                  <p className="text-sm text-muted-foreground">{stage.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link href="/employer-jobs/new">
                <Plus className="h-6 w-6" />
                <span>Post New Job</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link href="/employer-applications">
                <FileText className="h-6 w-6" />
                <span>Review Applications</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link href="/candidates">
                <Users className="h-6 w-6" />
                <span>Search Candidates</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link href="/company">
                <Eye className="h-6 w-6" />
                <span>View Company Profile</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
