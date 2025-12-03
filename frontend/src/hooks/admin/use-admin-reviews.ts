'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  adminReviewsApi,
  ReviewsFilters,
  ReviewsPagination,
} from '@/lib/api/admin/reviews'

export const adminReviewsKeys = {
  all: ['admin', 'reviews'] as const,
  lists: () => [...adminReviewsKeys.all, 'list'] as const,
  list: (filters: ReviewsFilters, pagination: ReviewsPagination) =>
    [...adminReviewsKeys.lists(), { filters, pagination }] as const,
  details: () => [...adminReviewsKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminReviewsKeys.details(), id] as const,
  pending: (pagination: ReviewsPagination) =>
    [...adminReviewsKeys.all, 'pending', pagination] as const,
}

export function useAdminReviews(
  filters: ReviewsFilters = {},
  pagination: ReviewsPagination = { page: 1, limit: 20 }
) {
  return useQuery({
    queryKey: adminReviewsKeys.list(filters, pagination),
    queryFn: () => adminReviewsApi.getReviews(filters, pagination),
  })
}

export function usePendingReviews(pagination: ReviewsPagination = { page: 1, limit: 20 }) {
  return useQuery({
    queryKey: adminReviewsKeys.pending(pagination),
    queryFn: () => adminReviewsApi.getPendingReviews(pagination),
  })
}

export function useAdminReview(id: string) {
  return useQuery({
    queryKey: adminReviewsKeys.detail(id),
    queryFn: () => adminReviewsApi.getReview(id),
    enabled: !!id,
  })
}

export function useApproveReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminReviewsApi.approveReview(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: adminReviewsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminReviewsKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: [...adminReviewsKeys.all, 'pending'] })
      toast.success('Review approved successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve review')
    },
  })
}

export function useRejectReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminReviewsApi.rejectReview(id, reason),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminReviewsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: adminReviewsKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: [...adminReviewsKeys.all, 'pending'] })
      toast.success('Review rejected')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject review')
    },
  })
}

export function useDeleteReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminReviewsApi.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminReviewsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: [...adminReviewsKeys.all, 'pending'] })
      toast.success('Review deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete review')
    },
  })
}
