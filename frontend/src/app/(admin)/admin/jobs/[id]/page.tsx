'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { isValidDate } from '@/lib/utils'
import {
  ArrowLeft,
  Edit,
  Ban,
  CheckCircle,
  Trash2,
  Star,
  StarOff,
  MapPin,
  Calendar,
  Clock,
  Briefcase,
  DollarSign,
  Users,
  Eye,
  Building2,
  Globe,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useAdminJob,
  useApproveJob,
  useRejectJob,
  useFeatureJob,
  useUnfeatureJob,
  useDeleteJob,
} from '@/hooks/admin'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function JobDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [actionDialog, setActionDialog] = useState<
    'approve' | 'reject' | 'feature' | 'unfeature' | 'delete' | null
  >(null)

  const { data: job, isLoading } = useAdminJob(id)
  const approveJob = useApproveJob()
  const rejectJob = useRejectJob()
  const featureJob = useFeatureJob()
  const unfeatureJob = useUnfeatureJob()
  const deleteJob = useDeleteJob()

  const handleAction = async () => {
    try {
      switch (actionDialog) {
        case 'approve':
          await approveJob.mutateAsync(id)
          break
        case 'reject':
          await rejectJob.mutateAsync({ id, reason: 'Rejected by admin' })
          break
        case 'feature':
          await featureJob.mutateAsync({ id })
          break
        case 'unfeature':
          await unfeatureJob.mutateAsync(id)
          break
        case 'delete':
          await deleteJob.mutateAsync(id)
          router.push('/admin/jobs')
          break
      }
    } finally {
      setActionDialog(null)
    }
  }

  const formatSalary = (min?: number, max?: number, currency?: string) => {
    if (!min && !max) return 'Not specified'
    const curr = currency || 'USD'
    if (min && max) {
      return `${curr} ${min.toLocaleString()} - ${max.toLocaleString()}`
    }
    return `${curr} ${(min || max)?.toLocaleString()}`
  }

  if (isLoading) {
    return <JobDetailSkeleton />
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold">Job Not Found</h2>
        <p className="text-muted-foreground mt-2">The job you&apos;re looking for doesn&apos;t exist.</p>
        <Button asChild className="mt-4">
          <Link href="/admin/jobs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Link>
        </Button>
      </div>
    )
  }

  const statusVariants: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
    draft: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800">
            <Link href="/admin/jobs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Job Details</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">View and manage job listing</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/jobs/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          {job.status === 'PENDING' && (
            <>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setActionDialog('approve')}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => setActionDialog('reject')}
              >
                <Ban className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </>
          )}
          {job.is_featured ? (
            <Button variant="outline" onClick={() => setActionDialog('unfeature')}>
              <StarOff className="mr-2 h-4 w-4" />
              Unfeature
            </Button>
          ) : (
            <Button
              variant="outline"
              className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
              onClick={() => setActionDialog('feature')}
            >
              <Star className="mr-2 h-4 w-4" />
              Feature
            </Button>
          )}
          <Button variant="destructive" onClick={() => setActionDialog('delete')}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Job Info Card */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <Avatar className="h-20 w-20">
                <AvatarImage src={job.company?.logo_url} />
                <AvatarFallback className="text-xl">
                  {job.company?.name?.charAt(0)?.toUpperCase() || 'C'}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-semibold text-center">{job.title}</h2>
              <Link
                href={`/admin/companies/${job.company?.id}`}
                className="text-muted-foreground hover:underline"
              >
                {job.company?.name}
              </Link>
              <div className="flex items-center gap-2 mt-3">
                <Badge className={statusVariants[job.status] || ''}>
                  {job.status ? job.status.charAt(0).toUpperCase() + job.status.slice(1) : 'Unknown'}
                </Badge>
                {job.is_featured && (
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                    <Star className="mr-1 h-3 w-3 fill-yellow-600" />
                    Featured
                  </Badge>
                )}
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {job.is_remote ? 'Remote' : job.location || 'Not specified'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm capitalize">{job.job_type?.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{job.experience_level || 'Any level'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Posted {isValidDate(job.created_at) ? format(new Date(job.created_at), 'MMMM d, yyyy') : '-'}
                </span>
              </div>
              {isValidDate(job.expires_at) && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Expires {format(new Date(job.expires_at!), 'MMMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{job.applications_count || 0}</p>
                <p className="text-sm text-muted-foreground">Applications</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{job.views_count || 0}</p>
                <p className="text-sm text-muted-foreground">Views</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="description">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                  {job.description ? (
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: job.description }}
                    />
                  ) : (
                    <p className="text-muted-foreground">No description provided.</p>
                  )}
                </CardContent>
              </Card>

              {job.requirements && (
                <Card>
                  <CardHeader>
                    <CardTitle>Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: job.requirements }}
                    />
                  </CardContent>
                </Card>
              )}

              {job.benefits && job.benefits.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Benefits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1">
                      {job.benefits.map((benefit: string, index: number) => (
                        <li key={index} className="text-sm">
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {job.skills && job.skills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Required Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill: string) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="applications" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Job Applications</CardTitle>
                  <CardDescription>
                    {job.applications_count || 0} applications received
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {job.applications && job.applications.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Applicant</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Applied</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {job.applications.map((application: any) => (
                          <TableRow key={application.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={application.applicant?.avatar_url} />
                                  <AvatarFallback>
                                    {application.applicant?.first_name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">
                                    {application.applicant?.first_name} {application.applicant?.last_name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {application.applicant?.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  application.status === 'accepted'
                                    ? 'default'
                                    : application.status === 'rejected'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                              >
                                {application.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {isValidDate(application.created_at) ? format(new Date(application.created_at), 'MMM d, yyyy') : '-'}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/admin/users/${application.applicant?.id}`}>
                                  View
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No applications yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Job Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm text-muted-foreground">Job ID</dt>
                      <dd className="text-sm font-medium font-mono">{job.id}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Slug</dt>
                      <dd className="text-sm font-medium">{job.slug}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Category</dt>
                      <dd className="text-sm font-medium">{job.category?.name || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Experience Level</dt>
                      <dd className="text-sm font-medium capitalize">
                        {job.experience_level || '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Job Type</dt>
                      <dd className="text-sm font-medium capitalize">
                        {job.job_type?.replace('_', ' ')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Remote</dt>
                      <dd className="text-sm font-medium">{job.is_remote ? 'Yes' : 'No'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Created At</dt>
                      <dd className="text-sm font-medium">
                        {isValidDate(job.created_at) ? format(new Date(job.created_at), 'PPpp') : '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Last Updated</dt>
                      <dd className="text-sm font-medium">
                        {isValidDate(job.updated_at)
                          ? format(new Date(job.updated_at!), 'PPpp')
                          : '-'}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Company Info */}
              {job.company && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Posted By</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={job.company.logo_url} />
                        <AvatarFallback>
                          {job.company?.name?.charAt(0)?.toUpperCase() || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Link
                          href={`/admin/companies/${job.company.id}`}
                          className="font-medium hover:underline"
                        >
                          {job.company.name}
                        </Link>
                        {job.company.industry && (
                          <p className="text-sm text-muted-foreground">{job.company.industry}</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="ml-auto" asChild>
                        <Link href={`/admin/companies/${job.company.id}`}>View Company</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Action Dialogs */}
      <AlertDialog open={actionDialog === 'approve'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve &quot;{job.title}&quot;? This job will be published and
              visible to job seekers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} className="bg-green-600 hover:bg-green-700">
              Approve Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionDialog === 'reject'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject &quot;{job.title}&quot;? The employer will be notified of the
              rejection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} className="bg-red-600 hover:bg-red-700">
              Reject Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionDialog === 'feature'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Feature Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to feature &quot;{job.title}&quot;? Featured jobs appear prominently in
              search results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} className="bg-yellow-600 hover:bg-yellow-700">
              Feature Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionDialog === 'unfeature'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Featured Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the featured status from &quot;{job.title}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>Remove Featured</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionDialog === 'delete'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{job.title}&quot;? This action cannot be undone. All
              applications for this job will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function JobDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-5 w-56 mt-1" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-6 w-48 mt-4" />
              <Skeleton className="h-4 w-32 mt-2" />
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <Skeleton className="h-10 w-80" />
          <Card className="mt-4">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
