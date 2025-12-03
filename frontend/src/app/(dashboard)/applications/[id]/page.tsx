'use client'

import { useState } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, Briefcase, DollarSign, Clock, FileText, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useApplication, useWithdrawApplication } from '@/hooks/use-applications'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { format } from 'date-fns'
import type { ApplicationStatus } from '@/types/application'

const statusColors: Record<ApplicationStatus, string> = {
  SUBMITTED: 'bg-gray-100 text-gray-800',
  REVIEWED: 'bg-blue-100 text-blue-800',
  SHORTLISTED: 'bg-purple-100 text-purple-800',
  INTERVIEW: 'bg-indigo-100 text-indigo-800',
  OFFERED: 'bg-green-100 text-green-800',
  HIRED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
  WITHDRAWN: 'bg-orange-100 text-orange-800',
}

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const { data: application, isLoading } = useApplication(resolvedParams.id)
  const withdrawApplication = useWithdrawApplication()
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false)

  const handleWithdraw = async () => {
    await withdrawApplication.mutateAsync(resolvedParams.id)
    setWithdrawDialogOpen(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-muted animate-pulse rounded-lg" />
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Application not found</h2>
        <p className="text-muted-foreground mb-4">
          This application may have been deleted or does not exist
        </p>
        <Button asChild>
          <Link href="/applications">Back to Applications</Link>
        </Button>
      </div>
    )
  }

  const canWithdraw = !['REJECTED', 'WITHDRAWN', 'OFFERED'].includes(application.status)

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/applications">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Applications
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          {application.job?.company_logo_url && (
            <img
              src={application.job.company_logo_url}
              alt={application.job.company_name}
              className="h-16 w-16 rounded-lg object-cover"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">{application.job?.title}</h1>
            <p className="text-xl text-muted-foreground mt-1">
              {application.job?.company_name}
            </p>
          </div>
        </div>
        {canWithdraw && (
          <Button
            variant="outline"
            onClick={() => setWithdrawDialogOpen(true)}
          >
            Withdraw Application
          </Button>
        )}
      </div>

      {/* Status and Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Application Status</CardTitle>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                statusColors[application.status]
              }`}
            >
              {application.status}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Applied on</span>
              <span className="font-medium">
                {format(new Date(application.applied_at), 'MMMM d, yyyy')}
              </span>
            </div>
            {application.resume && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Resume used:</span>
                <span className="font-medium">{application.resume.file_name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cover Letter */}
      {application.cover_letter && (
        <Card>
          <CardHeader>
            <CardTitle>Cover Letter</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{application.cover_letter}</p>
          </CardContent>
        </Card>
      )}

      {/* Job Details */}
      {application.job && (
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Job Info */}
            <div className="flex flex-wrap gap-4 text-sm">
              {application.job.location && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {application.job.location}
                </div>
              )}
              {application.job.job_type && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  {application.job.job_type.replace('_', ' ')}
                </div>
              )}
              {(application.job.salary_min || application.job.salary_max) && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  {application.job.salary_currency || '$'}
                  {application.job.salary_min && application.job.salary_max
                    ? `${application.job.salary_min.toLocaleString()} - ${application.job.salary_max.toLocaleString()}`
                    : application.job.salary_min
                    ? `${application.job.salary_min.toLocaleString()}+`
                    : `Up to ${application.job.salary_max?.toLocaleString()}`}
                </div>
              )}
            </div>

            {/* View Original Job Posting */}
            <Button variant="outline" asChild>
              <Link href={`/jobs/${application.job.id}`}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Original Job Posting
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Withdraw Confirmation */}
      <ConfirmDialog
        open={withdrawDialogOpen}
        onOpenChange={setWithdrawDialogOpen}
        title="Withdraw Application"
        description="Are you sure you want to withdraw this application? This action cannot be undone."
        confirmText="Withdraw"
        onConfirm={handleWithdraw}
        loading={withdrawApplication.isPending}
      />
    </div>
  )
}
