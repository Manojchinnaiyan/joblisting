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
  Star,
  ArrowLeft,
  MessageSquare,
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
import { useAdminReviews, useApproveReview, useRejectReview } from '@/hooks/admin'
import { AdminReview } from '@/lib/api/admin/reviews'

type PendingReview = AdminReview

export default function PendingReviewsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null)
  const [actionDialog, setActionDialog] = useState<'approve' | 'reject' | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data, isLoading, isFetching } = useAdminReviews({ status: 'PENDING', search: search || undefined }, { page, limit })
  const showLoading = isLoading || (!data && isFetching)
  const approveReview = useApproveReview()
  const rejectReview = useRejectReview()

  const handleApprove = async () => {
    if (!selectedReview) return
    await approveReview.mutateAsync(selectedReview.id)
    setActionDialog(null)
    setSelectedReview(null)
  }

  const handleReject = async () => {
    if (!selectedReview) return
    await rejectReview.mutateAsync({ id: selectedReview.id, reason: rejectReason })
    setActionDialog(null)
    setSelectedReview(null)
    setRejectReason('')
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

  const columns: ColumnDef<PendingReview>[] = [
    getSelectColumn<PendingReview>(),
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
            <p className="text-sm text-muted-foreground line-clamp-2">{review.content || review.pros || review.cons || '-'}</p>
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
      header: 'Author',
      cell: ({ row }) => {
        const review = row.original
        if (review.is_anonymous || !review.reviewer_name) {
          return <span className="text-muted-foreground">Anonymous</span>
        }
        return (
          <Link
            href={`/admin/users/${review.user_id}`}
            className="text-sm hover:underline"
          >
            {review.reviewer_name}
          </Link>
        )
      },
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
        const review = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 border-green-600 hover:bg-green-50"
              onClick={() => {
                setSelectedReview(review)
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
                setSelectedReview(review)
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
                  <Link href={`/admin/reviews/${review.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Full Review
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const reviews = data?.reviews || []
  const pagination = data
    ? { page, limit, total: data.total, totalPages: data.total_pages }
    : undefined

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="flex-shrink-0 h-9 w-9">
            <Link href="/admin/reviews">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Pending Reviews</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Review and moderate submitted reviews</p>
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
          searchPlaceholder="Search pending reviews..."
          searchValue={search}
          onSearch={(value) => {
            setSearch(value)
            setPage(1)
          }}
          isLoading={true}
        />
      ) : reviews.length === 0 && !search ? (
        <div className="flex flex-col items-center justify-center py-12 bg-card border rounded-lg">
          <MessageSquare className="h-16 w-16 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Pending Reviews</h3>
          <p className="text-muted-foreground mt-2">All reviews have been moderated</p>
          <Button asChild className="mt-4">
            <Link href="/admin/reviews">View All Reviews</Link>
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={reviews}
          searchPlaceholder="Search pending reviews..."
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
            <AlertDialogTitle>Approve Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this review? It will be published and visible on the
              company&apos;s profile page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedReview && (
            <div className="border rounded-lg p-4 my-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                {renderStars(selectedReview.rating)}
              </div>
              <p className="font-medium">{selectedReview.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{selectedReview.content || selectedReview.pros || selectedReview.cons || '-'}</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
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
              Please provide a reason for rejecting this review. The author will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedReview && (
            <div className="border rounded-lg p-4 my-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                {renderStars(selectedReview.rating)}
              </div>
              <p className="font-medium">{selectedReview.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{selectedReview.content || selectedReview.pros || selectedReview.cons || '-'}</p>
            </div>
          )}
          <div className="py-2">
            <Label htmlFor="reject-reason">Rejection Reason</Label>
            <Textarea
              id="reject-reason"
              placeholder="Please explain why this review is being rejected..."
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
              Reject Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
