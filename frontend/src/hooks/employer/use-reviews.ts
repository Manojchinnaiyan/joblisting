'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  employerReviewsApi,
  GetReviewsParams,
  RespondToReviewData,
  ReviewsResponse,
  CompanyReview,
} from '@/lib/api/employer/reviews'

export const reviewsKeys = {
  all: ['employer', 'reviews'] as const,
  list: (params: GetReviewsParams) => [...reviewsKeys.all, 'list', params] as const,
}

export function useCompanyReviews(params: GetReviewsParams = {}) {
  return useQuery({
    queryKey: reviewsKeys.list(params),
    queryFn: () => employerReviewsApi.getCompanyReviews(params),
  })
}

export function useRespondToReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RespondToReviewData }) =>
      employerReviewsApi.respondToReview(id, data),
    onSuccess: (response, { id }) => {
      // Update the review with the response in all cached queries
      queryClient.setQueriesData(
        { queryKey: reviewsKeys.all },
        (old: ReviewsResponse | undefined) => {
          if (!old) return old
          return {
            ...old,
            reviews: old.reviews.map((r: CompanyReview) =>
              r.id === id ? { ...r, response } : r
            ),
          }
        }
      )
      toast.success('Response submitted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit response')
    },
  })
}
