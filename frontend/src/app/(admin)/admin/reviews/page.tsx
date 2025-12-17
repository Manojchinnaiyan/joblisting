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
  Trash2,
  MessageSquare,
  Star,
  Clock,
  Building2,
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
  useAdminReviews,
  useApproveReview,
  useRejectReview,
  useDeleteReview,
} from '@/hooks/admin'
import { AdminReview } from '@/lib/api/admin/reviews'

type Review = AdminReview

export default function ReviewsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [actionDialog, setActionDialog] = useState<'approve' | 'reject' | 'delete' | null>(null)

  const { data, isLoading, refetch, isFetching } = useAdminReviews({ search: search || undefined }, { page, limit })
  const approveReview = useApproveReview()
  const rejectReview = useRejectReview()
  const deleteReview = useDeleteReview()

  const handleAction = async () => {
    if (!selectedReview) return

    try {
      switch (actionDialog) {
        case 'approve':
          await approveReview.mutateAsync(selectedReview.id)
          break
        case 'reject':
          await rejectReview.mutateAsync({ id: selectedReview.id, reason: 'Rejected by admin' })
          break
        case 'delete':
          await deleteReview.mutateAsync(selectedReview.id)
          break
      }
    } finally {
      setActionDialog(null)
      setSelectedReview(null)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const columns: ColumnDef<Review>[] = [
    getSelectColumn<Review>(),
    {
      accessorKey: 'review',
      header: 'Review',
      cell: ({ row }) => {
        const review = row.original
        return (
          <div className="max-w-md">
            <div className="flex items-center gap-2 mb-1">
              {renderStars(review.rating)}
              <span className="text-sm font-medium">{review.rating}/5</span>
            </div>
            <p className="font-medium line-clamp-1">{review.title}</p>
            <p className="text-sm text-muted-foreground line-clamp-2">{review.pros || review.cons || '-'}</p>
          </div>
        )
      },
    },
    {
      accessorKey: 'company_name',
      header: 'Company',
      cell: ({ row }) => {
        const review = row.original
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={review.company_logo} />
              <AvatarFallback>{review.company_name?.charAt(0) || 'C'}</AvatarFallback>
            </Avatar>
            <Link
              href={`/admin/companies/${review.company_id}`}
              className="text-sm hover:underline"
            >
              {review.company_name}
            </Link>
          </div>
        )
      },
    },
    {
      accessorKey: 'reviewer_name',
      header: 'Reviewer',
      cell: ({ row }) => {
        const review = row.original
        return (
          <Link
            href={`/admin/users/${review.user_id}`}
            className="text-sm hover:underline"
          >
            {review.reviewer_name || 'Anonymous'}
          </Link>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        const variants: Record<string, string> = {
          APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
          PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
          REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
        }
        return (
          <Badge className={variants[status] || ''}>
            {status ? status.charAt(0) + status.slice(1).toLowerCase() : 'Unknown'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Submitted',
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
      id: 'actions',
      cell: ({ row }) => {
        const review = row.original
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
                <Link href={`/admin/reviews/${review.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {review.status === 'PENDING' && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedReview(review)
                      setActionDialog('approve')
                    }}
                    className="text-green-600"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Review
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedReview(review)
                      setActionDialog('reject')
                    }}
                    className="text-red-600"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Review
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={() => {
                  setSelectedReview(review)
                  setActionDialog('delete')
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Review
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const reviews = data?.reviews || []
  const pagination = data
    ? { page, limit, total: data.total, totalPages: data.total_pages }
    : undefined

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Reviews</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Moderate company reviews</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/reviews/pending">
            <Clock className="mr-2 h-4 w-4" />
            Pending
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={reviews}
        searchPlaceholder="Search reviews..."
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

      {/* Approve Dialog */}
      <AlertDialog open={actionDialog === 'approve'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this review? It will be visible on the company&apos;s
              profile page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={actionDialog === 'reject'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this review? It will not be visible to users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={actionDialog === 'delete'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
