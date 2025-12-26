'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import {
  MoreHorizontal,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  Trash2,
  Star,
  StarOff,
  Briefcase,
  ExternalLink,
  Clock,
  MapPin,
  DollarSign,
  Plus,
  Link2,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { DataTable, getSelectColumn } from '@/components/admin/data-table'
import {
  useAdminJobs,
  useApproveJob,
  useRejectJob,
  useFeatureJob,
  useUnfeatureJob,
  useDeleteJob,
  useReindexJobs,
} from '@/hooks/admin'
import { AdminJobListItem } from '@/lib/api/admin/jobs'

type Job = AdminJobListItem

export default function JobsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [selectedJobs, setSelectedJobs] = useState<Job[]>([])
  const [actionDialog, setActionDialog] = useState<
    'approve' | 'reject' | 'feature' | 'unfeature' | 'delete' | 'bulk-feature' | 'bulk-unfeature' | 'bulk-delete' | null
  >(null)
  const [featuringJobId, setFeaturingJobId] = useState<string | null>(null)

  const { data, isLoading, refetch, isFetching } = useAdminJobs({ search: search || undefined }, { page, limit })
  const approveJob = useApproveJob()
  const rejectJob = useRejectJob()
  const featureJob = useFeatureJob()
  const unfeatureJob = useUnfeatureJob()
  const deleteJob = useDeleteJob()
  const reindexJobs = useReindexJobs()

  const handleAction = async () => {
    try {
      switch (actionDialog) {
        case 'approve':
          if (selectedJob) await approveJob.mutateAsync(selectedJob.id)
          break
        case 'reject':
          if (selectedJob) await rejectJob.mutateAsync({ id: selectedJob.id, reason: 'Rejected by admin' })
          break
        case 'feature':
          if (selectedJob) await featureJob.mutateAsync({ id: selectedJob.id })
          break
        case 'unfeature':
          if (selectedJob) await unfeatureJob.mutateAsync(selectedJob.id)
          break
        case 'delete':
          if (selectedJob) await deleteJob.mutateAsync(selectedJob.id)
          break
        case 'bulk-feature':
          for (const job of selectedJobs) {
            if (!job.is_featured) {
              await featureJob.mutateAsync({ id: job.id })
            }
          }
          break
        case 'bulk-unfeature':
          for (const job of selectedJobs) {
            if (job.is_featured) {
              await unfeatureJob.mutateAsync(job.id)
            }
          }
          break
        case 'bulk-delete':
          for (const job of selectedJobs) {
            await deleteJob.mutateAsync(job.id)
          }
          break
      }
    } finally {
      setActionDialog(null)
      setSelectedJob(null)
      setSelectedJobs([])
    }
  }

  const handleQuickFeatureToggle = async (job: Job) => {
    setFeaturingJobId(job.id)
    try {
      if (job.is_featured) {
        await unfeatureJob.mutateAsync(job.id)
      } else {
        await featureJob.mutateAsync({ id: job.id })
      }
    } finally {
      setFeaturingJobId(null)
    }
  }

  const formatSalary = (min?: number, max?: number, currency?: string) => {
    if (!min && !max) return '-'
    const curr = currency || 'USD'
    if (min && max) {
      return `${curr} ${min.toLocaleString()} - ${max.toLocaleString()}`
    }
    return `${curr} ${(min || max)?.toLocaleString()}`
  }

  const columns: ColumnDef<Job>[] = [
    getSelectColumn<Job>(),
    {
      accessorKey: 'job',
      header: 'Job',
      cell: ({ row }) => {
        const job = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={job.company_logo} />
              <AvatarFallback>
                {job.company_name?.charAt(0)?.toUpperCase() || 'C'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/jobs/${job.id}`}
                  className="font-medium hover:underline"
                >
                  {job.title}
                </Link>
                {job.is_featured && (
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                )}
              </div>
              <Link
                href={`/admin/companies/${job.company_id}`}
                className="text-sm text-muted-foreground hover:underline"
              >
                {job.company_name}
              </Link>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          {row.original.workplace_type === 'REMOTE' ? 'Remote' : row.original.location || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'job_type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">
          {row.original.job_type.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'experience_level',
      header: 'Experience',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">
          {row.original.experience_level?.replace('_', ' ') || '-'}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        const variants: Record<string, string> = {
          ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
          PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
          PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
          REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
          CLOSED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
          DRAFT: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
          EXPIRED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
        }
        return (
          <Badge className={variants[status] || ''}>
            {status ? status.charAt(0) + status.slice(1).toLowerCase() : 'Unknown'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'applications_count',
      header: 'Applications',
      cell: ({ row }) => (
        <Badge variant="outline" className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">{row.original.applications_count}</Badge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Posted',
      cell: ({ row }) => {
        const date = row.original.created_at
        if (!date) return '-'
        try {
          const d = new Date(date)
          if (isNaN(d.getTime())) return '-'
          return format(d, 'MMM d, yyyy')
        } catch {
          return '-'
        }
      },
    },
    {
      id: 'featured',
      header: 'Featured',
      cell: ({ row }) => {
        const job = row.original
        const isLoading = featuringJobId === job.id
        return (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleQuickFeatureToggle(job)}
            disabled={isLoading}
            title={job.is_featured ? 'Remove featured' : 'Mark as featured'}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : job.is_featured ? (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            ) : (
              <StarOff className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const job = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/admin/jobs/${job.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/jobs/${job.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Job
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {job.status === 'PENDING' && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedJob(job)
                      setActionDialog('approve')
                    }}
                    className="text-green-600"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Job
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedJob(job)
                      setActionDialog('reject')
                    }}
                    className="text-red-600"
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Reject Job
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {job.is_featured ? (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedJob(job)
                    setActionDialog('unfeature')
                  }}
                >
                  <StarOff className="mr-2 h-4 w-4" />
                  Remove Featured
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedJob(job)
                    setActionDialog('feature')
                  }}
                  className="text-yellow-600"
                >
                  <Star className="mr-2 h-4 w-4" />
                  Mark as Featured
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedJob(job)
                  setActionDialog('delete')
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Job
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const jobs = data?.jobs || []
  const pagination = data
    ? { page, limit, total: data.total, totalPages: data.total_pages }
    : undefined

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Jobs</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage all job listings on the platform</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/jobs/pending">
              <Clock className="mr-2 h-4 w-4" />
              Pending
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/jobs/featured">
              <Star className="mr-2 h-4 w-4" />
              Featured
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/jobs/scrape">
              <Link2 className="mr-2 h-4 w-4" />
              Import from URL
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => reindexJobs.mutate()}
            disabled={reindexJobs.isPending}
          >
            {reindexJobs.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Reindex Search
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/jobs/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Job
            </Link>
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={jobs}
        searchPlaceholder="Search jobs..."
        searchValue={search}
        onSearch={(value) => {
          setSearch(value)
          setPage(1)
        }}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={setPage}
        onLimitChange={setLimit}
        enableExport
        onExport={() => console.log('Export jobs')}
        onRefresh={() => refetch()}
        isRefreshing={isFetching && !isLoading}
        onSelectionChange={setSelectedJobs}
        bulkActions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActionDialog('bulk-feature')}
              className="text-yellow-600 hover:text-yellow-700"
            >
              <Star className="mr-2 h-4 w-4" />
              Feature
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActionDialog('bulk-unfeature')}
            >
              <StarOff className="mr-2 h-4 w-4" />
              Unfeature
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActionDialog('bulk-delete')}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </>
        }
      />

      {/* Approve Dialog */}
      <AlertDialog open={actionDialog === 'approve'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve &quot;{selectedJob?.title}&quot;? This job will be
              published and visible to job seekers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={actionDialog === 'reject'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject &quot;{selectedJob?.title}&quot;? The employer will be
              notified of the rejection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Feature Dialog */}
      <AlertDialog open={actionDialog === 'feature'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Feature Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to feature &quot;{selectedJob?.title}&quot;? Featured jobs appear
              prominently in search results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Feature Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unfeature Dialog */}
      <AlertDialog open={actionDialog === 'unfeature'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Featured Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the featured status from &quot;{selectedJob?.title}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>Remove Featured</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={actionDialog === 'delete'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedJob?.title}&quot;? This action cannot be undone.
              All applications for this job will also be removed.
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

      {/* Bulk Feature Dialog */}
      <AlertDialog open={actionDialog === 'bulk-feature'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Feature Selected Jobs</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to feature {selectedJobs.length} selected job(s)?
              Featured jobs appear prominently in search results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Feature {selectedJobs.length} Jobs
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Unfeature Dialog */}
      <AlertDialog open={actionDialog === 'bulk-unfeature'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Featured Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the featured status from {selectedJobs.length} selected job(s)?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>
              Remove Featured from {selectedJobs.length} Jobs
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={actionDialog === 'bulk-delete'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Jobs</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedJobs.length} selected job(s)?
              This action cannot be undone. All applications for these jobs will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete {selectedJobs.length} Jobs
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
