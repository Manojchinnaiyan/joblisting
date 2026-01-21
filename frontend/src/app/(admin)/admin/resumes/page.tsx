'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import {
  MoreHorizontal,
  Eye,
  Download,
  Trash2,
  FileText,
  File,
  User,
  Star,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, getSelectColumn } from '@/components/admin/data-table'
import {
  useAdminResumes,
  useAdminResumeStats,
  useAdminResumeDownload,
  useDeleteAdminResume,
} from '@/hooks/admin'
import { AdminResume } from '@/lib/api/admin/resumes'

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getFileIcon(mimeType: string) {
  if (mimeType === 'application/pdf') {
    return <FileText className="h-4 w-4 text-red-500" />
  }
  return <File className="h-4 w-4 text-blue-500" />
}

function getMimeTypeLabel(mimeType: string): string {
  const labels: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  }
  return labels[mimeType] || mimeType
}

export default function ResumesPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [mimeTypeFilter, setMimeTypeFilter] = useState<string>('')
  const [selectedResume, setSelectedResume] = useState<AdminResume | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const filters = {
    search: search || undefined,
    mime_type: mimeTypeFilter || undefined,
  }

  const { data, isLoading, refetch, isFetching } = useAdminResumes(filters, { page, limit })
  const { data: stats, isLoading: statsLoading } = useAdminResumeStats()
  const downloadResume = useAdminResumeDownload()
  const deleteResume = useDeleteAdminResume()

  const handleDelete = async () => {
    if (!selectedResume) return
    try {
      await deleteResume.mutateAsync(selectedResume.id)
    } finally {
      setDeleteDialogOpen(false)
      setSelectedResume(null)
    }
  }

  const columns: ColumnDef<AdminResume>[] = [
    getSelectColumn<AdminResume>(),
    {
      accessorKey: 'file',
      header: 'File',
      cell: ({ row }) => {
        const resume = row.original
        return (
          <div className="flex items-center gap-3">
            {getFileIcon(resume.mime_type)}
            <div>
              <p className="font-medium truncate max-w-[200px]" title={resume.original_name}>
                {resume.title || resume.original_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(resume.file_size)} - {getMimeTypeLabel(resume.mime_type)}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'user',
      header: 'User',
      cell: ({ row }) => {
        const user = row.original.user
        if (!user) return '-'
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <Link
                href={`/admin/users/${user.id}`}
                className="font-medium hover:underline"
              >
                {user.first_name} {user.last_name}
              </Link>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'is_primary',
      header: 'Primary',
      cell: ({ row }) => (
        row.original.is_primary ? (
          <Badge variant="default" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Star className="mr-1 h-3 w-3" />
            Primary
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      accessorKey: 'download_count',
      header: 'Downloads',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.download_count}
        </Badge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Uploaded',
      cell: ({ row }) => {
        const date = row.original.created_at
        if (!date) return '-'
        try {
          return format(new Date(date), 'MMM d, yyyy HH:mm')
        } catch {
          return '-'
        }
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const resume = row.original
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
              <DropdownMenuItem
                onClick={() => downloadResume.mutate(resume.id)}
                disabled={downloadResume.isPending}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              {resume.user && (
                <DropdownMenuItem asChild>
                  <Link href={`/admin/users/${resume.user.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View User
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedResume(resume)
                  setDeleteDialogOpen(true)
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const resumes = data?.resumes || []
  const pagination = data
    ? { page, limit, total: data.total, totalPages: data.total_pages }
    : undefined

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Resumes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View and manage all user-generated resumes
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resumes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.total_resumes || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.total_downloads || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">File Types</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {statsLoading ? (
                '...'
              ) : (
                stats?.by_file_type?.map((ft) => (
                  <Badge key={ft.mime_type} variant="outline">
                    {getMimeTypeLabel(ft.mime_type)}: {ft.count}
                  </Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Select
          value={mimeTypeFilter}
          onValueChange={(value) => {
            setMimeTypeFilter(value === 'all' ? '' : value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All file types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All file types</SelectItem>
            <SelectItem value="application/pdf">PDF</SelectItem>
            <SelectItem value="application/msword">DOC</SelectItem>
            <SelectItem value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">DOCX</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={resumes}
        searchPlaceholder="Search by filename..."
        searchValue={search}
        onSearch={(value) => {
          setSearch(value)
          setPage(1)
        }}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onRefresh={() => refetch()}
        isRefreshing={isFetching && !isLoading}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resume</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this resume?
              <br />
              <strong>{selectedResume?.original_name}</strong>
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Resume
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
