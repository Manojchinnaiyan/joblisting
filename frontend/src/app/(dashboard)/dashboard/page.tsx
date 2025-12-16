'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Briefcase, FileText, Bookmark, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatsCard } from '@/components/dashboard/stats-card'
import { ProfileCompleteness } from '@/components/dashboard/profile-completeness'
import { useProfile } from '@/hooks/use-profile'
import { useApplications } from '@/hooks/use-applications'
import { useSavedJobs } from '@/hooks/use-saved-jobs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'

export default function DashboardPage() {
  const { data: profile } = useProfile()
  const { data: applicationsData } = useApplications(undefined, { page: 1, per_page: 5 })
  const { data: savedJobsData } = useSavedJobs({ page: 1, per_page: 1 })

  const applications = applicationsData?.applications || []
  const totalApplications = applicationsData?.pagination.total || 0
  const savedJobsCount = savedJobsData?.pagination.total || 0

  const inProgressApplications = applications.filter(
    (app) =>
      app.status === 'SUBMITTED' ||
      app.status === 'REVIEWED' ||
      app.status === 'SHORTLISTED' ||
      app.status === 'INTERVIEW'
  ).length

  const firstName = profile?.first_name || 'there'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {firstName}!</h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your job search
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Applications"
          value={totalApplications}
          icon={Briefcase}
          href="/applications"
        />
        <StatsCard
          title="In Progress"
          value={inProgressApplications}
          icon={TrendingUp}
          href="/applications"
        />
        <StatsCard
          title="Saved Jobs"
          value={savedJobsCount}
          icon={Bookmark}
          href="/saved-jobs"
        />
        <StatsCard
          title="Profile Views"
          value="--"
          icon={FileText}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Applications */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Applications</CardTitle>
              <Button variant="ghost" asChild>
                <Link href="/applications">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start applying to jobs to track your progress here
                  </p>
                  <Button asChild>
                    <Link href="/jobs">Browse Jobs</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <Link
                      key={application.id}
                      href={`/applications/${application.id}`}
                      className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent transition-colors"
                    >
                      {application.job?.company_logo_url ? (
                        <Image
                          src={application.job.company_logo_url}
                          alt={application.job.company_name}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold text-primary">
                            {application.job?.company_name?.charAt(0).toUpperCase() || 'J'}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">
                          {application.job?.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {application.job?.company_name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Applied {format(new Date(application.applied_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            application.status === 'SUBMITTED'
                              ? 'bg-gray-100 text-gray-800'
                              : application.status === 'REVIEWED'
                              ? 'bg-blue-100 text-blue-800'
                              : application.status === 'SHORTLISTED'
                              ? 'bg-purple-100 text-purple-800'
                              : application.status === 'INTERVIEW'
                              ? 'bg-indigo-100 text-indigo-800'
                              : application.status === 'OFFERED'
                              ? 'bg-green-100 text-green-800'
                              : application.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {application.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Profile Completeness */}
        <div>
          <ProfileCompleteness />

          {/* Quick Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/profile/edit">
                  <FileText className="mr-2 h-4 w-4" />
                  Complete Profile
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/resumes">
                  <FileText className="mr-2 h-4 w-4" />
                  Upload Resume
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/jobs">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Browse Jobs
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
