'use client'

import { use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Copy,
  Trash2,
  Eye,
  FileText,
  Clock,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Users,
  ExternalLink,
  CheckCircle,
  XCircle,
  PauseCircle,
  RefreshCw,
  Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useEmployerJob, useDeleteJob, useCloseJob, useRenewJob, useDuplicateJob } from '@/hooks/employer/use-employer-jobs'
import { format, formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Clock },
  active: { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  paused: { label: 'Paused', color: 'bg-yellow-100 text-yellow-800', icon: PauseCircle },
  closed: { label: 'Closed', color: 'bg-red-100 text-red-800', icon: XCircle },
  expired: { label: 'Expired', color: 'bg-orange-100 text-orange-800', icon: Clock },
}

export default function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const { data: job, isLoading } = useEmployerJob(slug)
  const deleteJob = useDeleteJob()
  const closeJob = useCloseJob()
  const renewJob = useRenewJob()
  const duplicateJob = useDuplicateJob()

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)

  const handleDelete = async () => {
    await deleteJob.mutateAsync(slug)
    router.push('/employer-jobs')
  }

  const handleClose = async () => {
    await closeJob.mutateAsync(slug)
    setShowCloseDialog(false)
  }

  const handleRenew = async () => {
    await renewJob.mutateAsync(slug)
  }

  const handleDuplicate = async () => {
    const newJob = await duplicateJob.mutateAsync(slug)
    router.push(`/employer-jobs/${newJob.slug || newJob.id}/edit`)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/employer-jobs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Job not found</h1>
        </div>
      </div>
    )
  }

  const status = statusConfig[job.status as keyof typeof statusConfig]
  const StatusIcon = status?.icon || Clock

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/employer-jobs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{job.title}</h1>
              <Badge variant="secondary" className={status?.color}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {status?.label}
              </Badge>
              {job.is_featured && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Featured
                </Badge>
              )}
              {job.is_urgent && (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  Urgent
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/employer-jobs/${job.id}/applications`}>
              <FileText className="mr-2 h-4 w-4" />
              Applications ({job.applications_count})
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/employer-jobs/${job.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
          {job.status === 'active' && (
            <Button variant="outline" size="sm" onClick={() => setShowCloseDialog(true)}>
              <XCircle className="mr-2 h-4 w-4" />
              Close
            </Button>
          )}
          {(job.status === 'closed' || job.status === 'expired') && (
            <Button variant="outline" size="sm" onClick={handleRenew}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Renew
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{job.views_count}</p>
                <p className="text-sm text-muted-foreground">Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{job.applications_count}</p>
                <p className="text-sm text-muted-foreground">Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {job.views_count > 0
                    ? Math.round((job.applications_count / job.views_count) * 100)
                    : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Apply Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {job.expires_at
                    ? Math.max(0, Math.ceil((new Date(job.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                    : '∞'}
                </p>
                <p className="text-sm text-muted-foreground">Days Left</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{job.description}</p>
              </div>
            </CardContent>
          </Card>

          {job.responsibilities && (
            <Card>
              <CardHeader>
                <CardTitle>Responsibilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{job.responsibilities}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {job.requirements && (
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{job.requirements}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {job.benefits && (
            <Card>
              <CardHeader>
                <CardTitle>Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{job.benefits}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{job.location || 'Remote'}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Job Type</p>
                  <p className="font-medium capitalize">{job.job_type.replace('_', ' ')}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Experience Level</p>
                  <p className="font-medium capitalize">{job.experience_level}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Work Type</p>
                  <p className="font-medium capitalize">{job.workplace_type}</p>
                </div>
              </div>
              {(job.salary_min || job.salary_max) && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Salary Range</p>
                      <p className="font-medium">
                        {job.salary_currency} {job.salary_min?.toLocaleString()}
                        {job.salary_max && ` - ${job.salary_max.toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                </>
              )}
              {job.expires_at && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Expires</p>
                      <p className="font-medium">
                        {format(new Date(job.expires_at), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {job.skills && job.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Required Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Share Job</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <a href={`/jobs/${job.slug || job.id}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Public Listing
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{job.title}&quot;? This action cannot be undone
              and will remove all applications associated with this job.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close Job Confirmation */}
      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Job?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to close &quot;{job.title}&quot;? This will stop accepting new
              applications. You can reopen it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClose}>
              Close Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
