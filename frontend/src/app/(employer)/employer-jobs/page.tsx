'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Copy,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  useEmployerJobs,
  useDeleteJob,
  useCloseJob,
  useRenewJob,
  useDuplicateJob,
} from '@/hooks/employer/use-employer-jobs'
import { EmployerJob, JobStatus } from '@/lib/api/employer/jobs'
import { formatDistanceToNow, format } from 'date-fns'
import { cn } from '@/lib/utils'

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Clock },
  active: { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  paused: { label: 'Paused', color: 'bg-yellow-100 text-yellow-800', icon: PauseCircle },
  closed: { label: 'Closed', color: 'bg-red-100 text-red-800', icon: XCircle },
  expired: { label: 'Expired', color: 'bg-orange-100 text-orange-800', icon: Clock },
}

export default function JobsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useEmployerJobs({
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter as JobStatus : undefined,
    page,
    limit: 10,
  })

  const deleteJob = useDeleteJob()
  const closeJob = useCloseJob()
  const renewJob = useRenewJob()
  const duplicateJob = useDuplicateJob()

  const [deletingJob, setDeletingJob] = useState<EmployerJob | null>(null)
  const [closingJob, setClosingJob] = useState<EmployerJob | null>(null)

  const handleDelete = async () => {
    if (deletingJob) {
      await deleteJob.mutateAsync(deletingJob.id)
      setDeletingJob(null)
    }
  }

  const handleClose = async () => {
    if (closingJob) {
      await closeJob.mutateAsync(closingJob.id)
      setClosingJob(null)
    }
  }

  const handleRenew = async (jobId: string) => {
    await renewJob.mutateAsync(jobId)
  }

  const handleDuplicate = async (jobId: string) => {
    await duplicateJob.mutateAsync(jobId)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 animate-pulse rounded bg-muted" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  const jobs = data?.jobs || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 10)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-muted-foreground">
            Manage your job postings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/employer-jobs/import">
              <FileText className="mr-2 h-4 w-4" />
              Import Jobs
            </Link>
          </Button>
          <Button asChild>
            <Link href="/employer-jobs/new">
              <Plus className="mr-2 h-4 w-4" />
              Post New Job
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No jobs found</h3>
            <p className="mt-2 text-muted-foreground text-center">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start by posting your first job'}
            </p>
            {!search && statusFilter === 'all' && (
              <Button className="mt-4" asChild>
                <Link href="/employer-jobs/new">Post your first job</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const status = statusConfig[job.status as keyof typeof statusConfig]
            const StatusIcon = status?.icon || Clock

            return (
              <Card key={job.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/employer-jobs/${job.id}`}
                          className="font-semibold hover:underline truncate"
                        >
                          {job.title}
                        </Link>
                        <Badge variant="secondary" className={status?.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status?.label}
                        </Badge>
                        {job.is_featured && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            Featured
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>{job.location || 'Remote'}</span>
                        <span className="capitalize">{job.job_type.replace('_', ' ')}</span>
                        {job.salary_min && job.salary_max && (
                          <span>
                            ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {job.applications_count} application{job.applications_count !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {job.views_count} view{job.views_count !== 1 ? 's' : ''}
                        </span>
                        <span>
                          Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                        </span>
                        {job.expires_at && (
                          <span>
                            Expires {format(new Date(job.expires_at), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/employer-jobs/${job.id}/applications`}>
                          <FileText className="mr-1 h-4 w-4" />
                          Applications
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/employer-jobs/${job.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/employer-jobs/${job.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Job
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(job.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {(job.status === 'expired' || job.status === 'closed') && (
                            <DropdownMenuItem onClick={() => handleRenew(job.id)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Renew Job
                            </DropdownMenuItem>
                          )}
                          {job.status === 'active' && (
                            <DropdownMenuItem onClick={() => setClosingJob(job)}>
                              <XCircle className="mr-2 h-4 w-4" />
                              Close Job
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeletingJob(job)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Job
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingJob} onOpenChange={() => setDeletingJob(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingJob?.title}&quot;? This action cannot be undone
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
      <AlertDialog open={!!closingJob} onOpenChange={() => setClosingJob(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Job?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to close &quot;{closingJob?.title}&quot;? This will stop accepting new
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
