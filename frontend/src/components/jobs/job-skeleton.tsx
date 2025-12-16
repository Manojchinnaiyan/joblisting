import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function JobSkeleton() {
  return (
    <Card className="min-h-[220px]">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Company Logo Skeleton */}
          <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg shrink-0" />

          {/* Job Info Skeleton */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 sm:h-5 w-3/4" />
                <Skeleton className="h-3 sm:h-4 w-1/2" />
              </div>
              <Skeleton className="h-8 w-8 rounded shrink-0" />
            </div>

            {/* Description Skeleton */}
            <div className="hidden sm:block space-y-2 mt-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>

            {/* Tags Skeleton */}
            <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-2 sm:mt-3">
              <Skeleton className="h-5 sm:h-6 w-16 sm:w-20 rounded-full" />
              <Skeleton className="h-5 sm:h-6 w-14 sm:w-18 rounded-full" />
              <Skeleton className="h-5 sm:h-6 w-16 sm:w-20 rounded-full" />
            </div>

            {/* Meta Info Skeleton */}
            <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 mt-2 sm:mt-3">
              <Skeleton className="h-3 sm:h-4 w-24" />
              <Skeleton className="h-3 sm:h-4 w-20" />
            </div>

            {/* Skills Skeleton */}
            <div className="hidden sm:flex flex-wrap gap-1.5 mt-3">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function JobSkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <JobSkeleton key={i} />
      ))}
    </div>
  )
}
