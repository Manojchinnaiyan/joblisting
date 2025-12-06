'use client'

import { JobCard } from './job-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Briefcase } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useSaveJob, useUnsaveJob } from '@/hooks/use-job-mutations'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Job } from '@/types/job'

export type ViewMode = 'grid' | 'list'

interface JobListProps {
  jobs: Job[]
  viewMode?: ViewMode
}

export function JobList({ jobs, viewMode = 'grid' }: JobListProps) {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const saveJob = useSaveJob()
  const unsaveJob = useUnsaveJob()

  const handleSave = (jobId: string) => {
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN)
      return
    }

    const job = jobs.find((j) => j.id === jobId)
    if (job?.is_saved) {
      unsaveJob.mutate(jobId)
    } else {
      saveJob.mutate(jobId)
    }
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={<Briefcase className="h-12 w-12" />}
        title="No jobs found"
        description="Try adjusting your filters or search query to find more jobs."
      />
    )
  }

  return (
    <div
      className={cn(
        viewMode === 'grid'
          ? 'grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2'
          : 'flex flex-col gap-4'
      )}
    >
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} onSave={handleSave} viewMode={viewMode} />
      ))}
    </div>
  )
}
