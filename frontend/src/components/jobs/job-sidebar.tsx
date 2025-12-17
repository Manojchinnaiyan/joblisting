'use client'

import { useEffect, useState } from 'react'
import { JobApplyButton } from './job-apply-button'
import { SocialShare } from './social-share'
import type { Job } from '@/types/job'

interface JobSidebarProps {
  job: Job
  className?: string
}

export function JobSidebar({ job, className }: JobSidebarProps) {
  const [jobUrl, setJobUrl] = useState('')

  useEffect(() => {
    // Get the current URL on the client side
    setJobUrl(window.location.href)
  }, [])

  // Create a short description for sharing
  const shareDescription = `${job.job_type.replace('_', ' ')} at ${job.company_name} - ${job.location}`

  return (
    <div className={className}>
      <div className="space-y-3">
        <JobApplyButton job={job} />
        {jobUrl && (
          <SocialShare
            title={`${job.title} at ${job.company_name}`}
            url={jobUrl}
            description={shareDescription}
          />
        )}
      </div>
    </div>
  )
}
