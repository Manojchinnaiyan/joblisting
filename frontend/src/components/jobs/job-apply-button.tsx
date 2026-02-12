'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'
import { ROUTES } from '@/lib/constants'
import { trackJobApplication, trackEvent } from '@/lib/posthog'
import type { Job } from '@/types/job'

interface JobApplyButtonProps {
  job: Job
}

export function JobApplyButton({ job }: JobApplyButtonProps) {
  const [isApplying, setIsApplying] = useState(false)
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()

  const handleApply = async () => {
    if (!isAuthenticated) {
      trackEvent('apply_button_clicked_unauthenticated', {
        job_id: job.id,
        job_title: job.title,
      })
      toast.error('Please log in to apply for jobs')
      router.push(ROUTES.LOGIN)
      return
    }

    if (user?.role !== 'JOB_SEEKER') {
      toast.error('Only job seekers can apply for jobs')
      return
    }

    if (job.has_applied) {
      toast.info('You have already applied to this job')
      return
    }

    setIsApplying(true)
    try {
      // Application logic will be implemented in dashboard
      trackJobApplication(job.id, job.title)
      toast.success('Application submitted successfully')
    } catch (error) {
      trackEvent('job_application_failed', {
        job_id: job.id,
        job_title: job.title,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      toast.error('Failed to submit application')
    } finally {
      setIsApplying(false)
    }
  }

  // If job was scraped from external source, show "Apply at Source" button
  if (job.original_url) {
    return (
      <Button
        asChild
        size="lg"
        className="w-full"
        onClick={() => {
          trackEvent('apply_at_source_clicked', {
            job_id: job.id,
            job_title: job.title,
            company_name: job.company_name,
            original_url: job.original_url,
          })
        }}
      >
        <a
          href={job.original_url}
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          Apply at {job.company_name}
          <ExternalLink className="ml-2 h-4 w-4" />
        </a>
      </Button>
    )
  }

  return (
    <Button
      onClick={handleApply}
      disabled={isApplying || job.has_applied}
      size="lg"
      className="w-full"
    >
      {job.has_applied ? 'Already Applied' : isApplying ? 'Applying...' : 'Apply Now'}
    </Button>
  )
}
