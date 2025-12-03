'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/layout/container'
import { JobCard } from '@/components/jobs/job-card'
import { JobSkeletonList } from '@/components/jobs/job-skeleton'
import { jobsApi } from '@/lib/api/jobs'
import { toast } from 'sonner'
import type { Job } from '@/types/job'

export function FeaturedJobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedJobs = async () => {
      try {
        const data = await jobsApi.getFeaturedJobs(6)
        setJobs(data)
      } catch (error) {
        toast.error('Failed to load featured jobs')
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeaturedJobs()
  }, [])

  if (!isLoading && jobs.length === 0) {
    return null
  }

  return (
    <section className="py-16 md:py-24">
      <Container>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Featured Jobs</h2>
            <p className="text-muted-foreground mt-2">
              Handpicked opportunities from top companies
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/jobs">
              View all jobs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <JobSkeletonList count={6} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}
