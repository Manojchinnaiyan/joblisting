'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import {
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  ArrowLeft,
  MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { DataTable, getSelectColumn } from '@/components/admin/data-table'
import { useAdminJobs, useApproveJob, useRejectJob } from '@/hooks/admin'
import { AdminJobListItem } from '@/lib/api/admin/jobs'

type PendingJob = AdminJobListItem

export default function PendingJobsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [selectedJob, setSelectedJob] = useState<PendingJob | null>(null)
  const [actionDialog, setActionDialog] = useState<'approve' | 'reject' | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data, isLoading, isFetching } = useAdminJobs({ status: 'PENDING_APPROVAL', search: search || undefined }, { page, limit })
  const showLoading = isLoading || (!data && isFetching)
  const approveJob = useApproveJob()
  const rejectJob = useRejectJob()

  const handleApprove = async () => {
    if (!selectedJob) return
    await approveJob.mutateAsync(selectedJob.id)
    setActionDialog(null)
    setSelectedJob(null)
  }

  const handleReject = async () => {
    if (!selectedJob) return
    await rejectJob.mutateAsync({ id: selectedJob.id, reason: rejectReason })
    setActionDialog(null)
    setSelectedJob(null)
    setRejectReason('')
  }

  const formatSalary = (min?: number, max?: number, currency?: string) => {
    if (!min && !max) return '-'
    const curr = currency || 'USD'
    if (min && max) {
      return `${curr} ${min.toLocaleString()} - ${max.toLocaleString()}`
    }
    return `${curr} ${(min || max)?.toLocaleString()}`
  }

  const columns: ColumnDef<PendingJob>[] = [
    getSelectColumn<PendingJob>(),
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
              <Link
                href={`/admin/jobs/${job.id}`}
                className="font-medium hover:underline"
              >
                {job.title}
              </Link>
              <Link
                href={`/admin/companies/${job.company_id}`}
                className="text-sm text-muted-foreground hover:underline block"
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
      accessorKey: 'created_at',
      header: 'Submitted',
      cell: ({ row }) => {
        const date = row.original.created_at
        let formatted = '-'
        if (date) {
          try {
            const d = new Date(date)
            if (!isNaN(d.getTime())) {
              formatted = format(d, 'MMM d, yyyy')
            }
          } catch {
            // Keep default
          }
        }
        return (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {formatted}
          </div>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const job = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 border-green-600 hover:bg-green-50"
              onClick={() => {
                setSelectedJob(job)
                setActionDialog('approve')
              }}
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-600 hover:bg-red-50"
              onClick={() => {
                setSelectedJob(job)
                setActionDialog('reject')
              }}
            >
              <XCircle className="mr-1 h-4 w-4" />
              Reject
            </Button>
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const jobs = data?.jobs || []
  const pagination = data
    ? { page, limit, total: data.total, totalPages: data.total_pages }
    : undefined

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="flex-shrink-0 h-9 w-9">
            <Link href="/admin/jobs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Pending Approvals</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Review and approve job listings</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2 flex-shrink-0">
          {data?.total || 0} pending
        </Badge>
      </div>

      {showLoading ? (
        <DataTable
          columns={columns}
          data={[]}
          searchPlaceholder="Search pending jobs..."
          searchValue={search}
          onSearch={(value) => {
            setSearch(value)
            setPage(1)
          }}
          isLoading={true}
        />
      ) : jobs.length === 0 && !search ? (
        <div className="flex flex-col items-center justify-center py-12 bg-card border rounded-lg">
          <Briefcase className="h-16 w-16 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Pending Jobs</h3>
          <p className="text-muted-foreground mt-2">
            All job listings have been reviewed
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/jobs">View All Jobs</Link>
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={jobs}
          searchPlaceholder="Search pending jobs..."
          searchValue={search}
          onSearch={(value) => {
            setSearch(value)
            setPage(1)
          }}
          isLoading={false}
          pagination={pagination}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      )}

      {/* Approve Dialog */}
      <AlertDialog open={actionDialog === 'approve'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve &quot;{selectedJob?.title}&quot;? This job will be published
              and visible to job seekers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
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
              Please provide a reason for rejecting &quot;{selectedJob?.title}&quot;. This will be sent to
              the employer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="reject-reason">Rejection Reason</Label>
            <Textarea
              id="reject-reason"
              placeholder="Please provide details about why this job listing is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectReason('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700"
              disabled={!rejectReason.trim()}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
