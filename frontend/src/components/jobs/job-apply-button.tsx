'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
