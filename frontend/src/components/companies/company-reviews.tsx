'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Pagination } from '@/components/shared/pagination'
import { companiesApi } from '@/lib/api/companies'
import { toast } from 'sonner'
import { formatDate, getInitials } from '@/lib/utils'
import type { CompanyReview } from '@/types/company'
import type { Pagination as PaginationType } from '@/types/api'

interface CompanyReviewsProps {
  companySlug: string
}

export function CompanyReviews({ companySlug }: CompanyReviewsProps) {
  const [reviews, setReviews] = useState<CompanyReview[]>([])
  const [pagination, setPagination] = useState<PaginationType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true)
      try {
        const data = await companiesApi.getCompanyReviews(companySlug, {
          page: currentPage,
          per_page: 5,
        })
        setReviews(data.reviews)
        setPagination(data.pagination)
      } catch (error) {
        toast.error('Failed to load company reviews')
      } finally {
        setIsLoading(false)
      }
    }

    fetchReviews()
  }, [companySlug, currentPage])

  if (isLoading || reviews.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Reviews</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {reviews.map((review, index) => (
            <div key={review.id}>
              {index > 0 && <Separator className="my-6" />}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {!review.is_anonymous && review.author && (
                      <Avatar>
                        <AvatarImage src={review.author.avatar_url} />
                        <AvatarFallback>
                          {getInitials(review.author.first_name, review.author.last_name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <p className="font-medium">
                        {review.is_anonymous
                          ? 'Anonymous'
                          : `${review.author?.first_name} ${review.author?.last_name}`}
                      </p>
                      {review.job_title && (
                        <p className="text-sm text-muted-foreground">{review.job_title}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{review.overall_rating.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(review.created_at)}
                    </p>
                  </div>
                </div>

                <div>
                  <Badge variant={review.is_current_employee ? 'default' : 'secondary'}>
                    {review.is_current_employee ? 'Current Employee' : 'Former Employee'}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">{review.title}</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                        Pros
                      </p>
                      <p className="text-sm text-muted-foreground">{review.pros}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                        Cons
                      </p>
                      <p className="text-sm text-muted-foreground">{review.cons}</p>
                    </div>
                  </div>
                </div>

                {review.company_response && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm font-medium mb-2">Response from {review.company_response.responded_by}</p>
                    <p className="text-sm text-muted-foreground">{review.company_response.response}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(review.company_response.responded_at)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {pagination && pagination.total_pages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.total_pages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
