'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Star, MessageSquare, ThumbsUp, ThumbsDown, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useCompanyReviews, useRespondToReview } from '@/hooks/employer/use-reviews'
import { CompanyReview } from '@/lib/api/employer/reviews'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClass,
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          )}
        />
      ))}
    </div>
  )
}

export default function CompanyReviewsPage() {
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { data: reviewsData, isLoading } = useCompanyReviews({
    rating: ratingFilter !== 'all' ? parseInt(ratingFilter) : undefined,
  })
  const respondToReview = useRespondToReview()

  const [respondingReview, setRespondingReview] = useState<CompanyReview | null>(null)
  const [responseText, setResponseText] = useState('')

  const handleRespond = async () => {
    if (respondingReview && responseText.trim()) {
      await respondToReview.mutateAsync({
        id: respondingReview.id,
        data: { content: responseText },
      })
      setRespondingReview(null)
      setResponseText('')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  const reviews = reviewsData?.reviews || []
  const averageRating = reviewsData?.average_rating || 0
  const ratingBreakdown = reviewsData?.rating_breakdown

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/company">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Company Reviews</h1>
          <p className="text-muted-foreground">
            See what people are saying about your company
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      {reviewsData && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
                <StarRating rating={Math.round(averageRating)} />
                <p className="mt-1 text-sm text-muted-foreground">
                  Average Rating
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold">{reviewsData.total}</div>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold">
                  {reviews.filter(r => !r.response).length}
                </div>
                <p className="text-sm text-muted-foreground">Awaiting Response</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold">
                  {reviews.filter(r => r.response).length}
                </div>
                <p className="text-sm text-muted-foreground">Responded</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rating Distribution */}
      {ratingBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingBreakdown[rating as keyof typeof ratingBreakdown] || 0
                const total = reviewsData?.total || 1
                const percentage = total > 0 ? (count / total) * 100 : 0
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-12">
                      <span className="text-sm font-medium">{rating}</span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Response Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reviews</SelectItem>
            <SelectItem value="pending">Awaiting Response</SelectItem>
            <SelectItem value="responded">Responded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No reviews yet</h3>
            <p className="mt-2 text-muted-foreground text-center">
              Reviews will appear here once employees start sharing their experiences.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Review Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} />
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <h3 className="mt-1 font-semibold">{review.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {review.job_title} • {review.employment_status}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {review.is_verified && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="space-y-3">
                    {review.pros && (
                      <div>
                        <p className="text-sm font-medium text-green-700">Pros</p>
                        <p className="text-sm text-muted-foreground">{review.pros}</p>
                      </div>
                    )}
                    {review.cons && (
                      <div>
                        <p className="text-sm font-medium text-red-700">Cons</p>
                        <p className="text-sm text-muted-foreground">{review.cons}</p>
                      </div>
                    )}
                  </div>

                  {/* Company Response */}
                  {review.response ? (
                    <div className="rounded-lg bg-muted p-4 mt-4">
                      <p className="text-sm font-medium">Company Response</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {review.response.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Responded by {review.response.responder_name} {formatDistanceToNow(new Date(review.response.responded_at), { addSuffix: true })}
                      </p>
                    </div>
                  ) : (
                    <div className="pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRespondingReview(review)}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Respond to Review
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Response Dialog */}
      <Dialog open={!!respondingReview} onOpenChange={() => setRespondingReview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Review</DialogTitle>
            <DialogDescription>
              Your response will be visible to everyone viewing this review.
            </DialogDescription>
          </DialogHeader>
          {respondingReview && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center gap-2 mb-2">
                  <StarRating rating={respondingReview.rating} size="sm" />
                  <span className="text-sm font-medium">{respondingReview.title}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {respondingReview.pros || respondingReview.cons}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="response">Your Response</Label>
                <Textarea
                  id="response"
                  placeholder="Write a professional and constructive response..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  Tips: Thank the reviewer, address specific points, and maintain a professional tone.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondingReview(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleRespond}
              disabled={!responseText.trim() || respondToReview.isPending}
            >
              {respondToReview.isPending ? 'Submitting...' : 'Submit Response'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
