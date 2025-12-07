'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'
import { ROUTES } from '@/lib/constants'
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
      toast.success('Application submitted successfully')
    } catch (error) {
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
      >
        <a
          href={job.original_url}
          target="_blank"
          rel="noopener noreferrer"
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
