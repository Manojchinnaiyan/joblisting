'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import {
  MoreHorizontal,
  Eye,
  Edit,
  StarOff,
  Star,
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
import { useAdminJobs, useUnfeatureJob } from '@/hooks/admin'
import { AdminJobListItem } from '@/lib/api/admin/jobs'

type FeaturedJob = AdminJobListItem

export default function FeaturedJobsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [selectedJob, setSelectedJob] = useState<FeaturedJob | null>(null)
  const [showUnfeatureDialog, setShowUnfeatureDialog] = useState(false)

  const { data, isLoading, isFetching } = useAdminJobs({ is_featured: true, search: search || undefined }, { page, limit })
  const showLoading = isLoading || (!data && isFetching)
  const unfeatureJob = useUnfeatureJob()

  const handleUnfeature = async () => {
    if (!selectedJob) return
    await unfeatureJob.mutateAsync(selectedJob.id)
    setShowUnfeatureDialog(false)
    setSelectedJob(null)
  }

  const columns: ColumnDef<FeaturedJob>[] = [
    getSelectColumn<FeaturedJob>(),
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
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
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
      accessorKey: 'applications_count',
      header: 'Applications',
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.applications_count}</Badge>
      ),
    },
    {
      accessorKey: 'views_count',
      header: 'Views',
      cell: ({ row }) => row.original.views_count.toLocaleString(),
    },
    {
      accessorKey: 'featured_until',
      header: 'Featured Until',
      cell: ({ row }) =>
        row.original.featured_until
          ? format(new Date(row.original.featured_until), 'MMM d, yyyy')
          : 'Permanent',
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
              onClick={() => {
                setSelectedJob(job)
                setShowUnfeatureDialog(true)
              }}
            >
              <StarOff className="mr-1 h-4 w-4" />
              Remove Featured
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
                <DropdownMenuItem asChild>
                  <Link href={`/admin/jobs/${job.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Job
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
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Featured Jobs</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Jobs highlighted on the platform</p>
          </div>
        </div>
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 text-lg px-4 py-2 flex-shrink-0">
          <Star className="mr-2 h-4 w-4 fill-yellow-600" />
          {data?.total || 0} featured
        </Badge>
      </div>

      {showLoading ? (
        <DataTable
          columns={columns}
          data={[]}
          searchPlaceholder="Search featured jobs..."
          searchValue={search}
          onSearch={(value) => {
            setSearch(value)
            setPage(1)
          }}
          isLoading={true}
        />
      ) : jobs.length === 0 && !search ? (
        <div className="flex flex-col items-center justify-center py-12 bg-card border rounded-lg">
          <Star className="h-16 w-16 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Featured Jobs</h3>
          <p className="text-muted-foreground mt-2">
            No jobs are currently featured on the platform
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/jobs">Browse Jobs to Feature</Link>
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={jobs}
          searchPlaceholder="Search featured jobs..."
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

      {/* Unfeature Dialog */}
      <AlertDialog open={showUnfeatureDialog} onOpenChange={setShowUnfeatureDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Featured Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{selectedJob?.title}&quot; from featured jobs? It will no
              longer appear in prominent positions in search results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnfeature}>Remove Featured</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
