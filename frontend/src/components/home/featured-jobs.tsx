'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/layout/container'
import { JobCard } from '@/components/jobs/job-card'
import { jobsApi } from '@/lib/api/jobs'
import type { Job } from '@/types/job'

interface FeaturedJobsProps {
  initialJobs?: Job[]
}

export function FeaturedJobs({ initialJobs }: FeaturedJobsProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs || [])
  const [isLoading, setIsLoading] = useState(!initialJobs || initialJobs.length === 0)

  useEffect(() => {
    // Only fetch if we don't have initial data
    if (initialJobs && initialJobs.length > 0) {
      return
    }

    const fetchFeaturedJobs = async () => {
      try {
        const data = await jobsApi.getFeaturedJobs(6)
        setJobs(data)
      } catch (error) {
        // Silently fail - don't show error toast for featured jobs
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeaturedJobs()
  }, [initialJobs])

  // Don't render if no jobs after loading
  if (!isLoading && jobs.length === 0) {
    return null
  }

  return (
    <section className="py-10 md:py-14">
      <Container>
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold">Featured Jobs</h2>
          <p className="text-muted-foreground mt-2">
            Handpicked opportunities from top companies
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[180px] bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} compact />
            ))}
          </div>
        )}

        <div className="text-center mt-6">
          <Button variant="outline" asChild>
            <Link href="/jobs">
              View all jobs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  )
}
