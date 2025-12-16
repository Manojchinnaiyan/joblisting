'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bookmark, MapPin, Briefcase, DollarSign, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSavedJobs, useUnsaveJob } from '@/hooks/use-saved-jobs'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { format } from 'date-fns'

export default function SavedJobsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useSavedJobs({ page, per_page: 20 })
  const unsaveJob = useUnsaveJob()
  const [unsaveId, setUnsaveId] = useState<string | null>(null)

  const savedJobs = data?.jobs || []
  const pagination = data?.pagination

  const handleUnsave = async (jobId: string) => {
    await unsaveJob.mutateAsync(jobId)
    setUnsaveId(null)
  }

  if (isLoading && page === 1) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-muted animate-pulse rounded-lg" />
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Saved Jobs</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Jobs you&apos;ve bookmarked for later
        </p>
      </div>

      {/* Saved Jobs List */}
      {savedJobs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bookmark className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No saved jobs</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Save jobs you&apos;re interested in to apply later
            </p>
            <Button asChild>
              <Link href="/jobs">Browse Jobs</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {savedJobs.map((job) => {
            return (
              <Card key={job.id} className="hover:bg-accent transition-colors">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {job.company_logo_url ? (
                      <Image
                        src={job.company_logo_url}
                        alt={job.company_name}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-primary">
                          {job.company_name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <Link href={`/jobs/${job.slug}`} className="group">
                        <h3 className="font-semibold truncate group-hover:text-primary">
                          {job.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground">{job.company_name}</p>

                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                        {job.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </div>
                        )}
                        {job.job_type && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {job.job_type.replace('_', ' ')}
                          </div>
                        )}
                        {job.salary && !job.salary.hidden && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {job.salary.currency}{job.salary.min && job.salary.max
                              ? `${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}`
                              : job.salary.min
                              ? `${job.salary.min.toLocaleString()}+`
                              : `Up to ${job.salary.max?.toLocaleString()}`}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0 w-full sm:w-auto">
                      <Button asChild className="flex-1 sm:flex-none">
                        <Link href={`/jobs/${job.slug}`}>View Job</Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 sm:flex-none"
                        onClick={() => setUnsaveId(job.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={!pagination.has_prev}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.total_pages}
          </span>
          <Button
            variant="outline"
            disabled={!pagination.has_next}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Unsave Confirmation */}
      <ConfirmDialog
        open={!!unsaveId}
        onOpenChange={(open) => !open && setUnsaveId(null)}
        title="Remove Saved Job"
        description="Are you sure you want to remove this job from your saved list?"
        confirmText="Remove"
        onConfirm={() => unsaveId && handleUnsave(unsaveId)}
        loading={unsaveJob.isPending}
      />
    </div>
  )
}
