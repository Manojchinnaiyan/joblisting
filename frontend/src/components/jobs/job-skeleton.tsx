import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function JobSkeleton() {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex gap-3 sm:gap-4">
            <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-4 sm:h-5 w-32 sm:w-48" />
              <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
            <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
            <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
            <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function JobSkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <JobSkeleton key={i} />
      ))}
    </div>
  )
}
