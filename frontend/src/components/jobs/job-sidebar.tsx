'use client'

import { useEffect, useState } from 'react'
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react'
import { JobApplyButton } from './job-apply-button'
import { SocialShare } from './social-share'
import { NewsletterSubscription } from '@/components/shared/newsletter-subscription'
import { Button } from '@/components/ui/button'
import { useSaveJob, useUnsaveJob } from '@/hooks/use-saved-jobs'
import { useAuthStore } from '@/store/auth-store'
import type { Job } from '@/types/job'

interface JobSidebarProps {
  job: Job
  className?: string
  isMobile?: boolean
}

export function JobSidebar({ job, className, isMobile = false }: JobSidebarProps) {
  const [jobUrl, setJobUrl] = useState('')
  const [isSaved, setIsSaved] = useState(job.is_saved || false)
  const { isAuthenticated, user } = useAuthStore()
  const saveJob = useSaveJob()
  const unsaveJob = useUnsaveJob()

  const isJobSeeker = user?.role === 'JOB_SEEKER'
  const canSave = isAuthenticated && isJobSeeker

  useEffect(() => {
    // Get the current URL on the client side
    setJobUrl(window.location.href)
  }, [])

  useEffect(() => {
    setIsSaved(job.is_saved || false)
  }, [job.is_saved])

  const handleSaveToggle = async () => {
    if (!canSave) return

    if (isSaved) {
      setIsSaved(false)
      unsaveJob.mutate(job.id, {
        onError: () => setIsSaved(true),
      })
    } else {
      setIsSaved(true)
      saveJob.mutate(job.id, {
        onError: () => setIsSaved(false),
      })
    }
  }

  // Create a short description for sharing
  const shareDescription = `${job.job_type.replace('_', ' ')} at ${job.company_name} - ${job.location}`
  const isLoading = saveJob.isPending || unsaveJob.isPending

  // Mobile sticky version - only show apply and save buttons
  if (isMobile) {
    return (
      <div className={className}>
        <div className="flex gap-2">
          <div className="flex-1">
            <JobApplyButton job={job} />
          </div>
          {canSave && (
            <Button
              variant={isSaved ? 'default' : 'outline'}
              size="icon"
              onClick={handleSaveToggle}
              disabled={isLoading}
              className="shrink-0 h-10 w-10"
              title={isSaved ? 'Remove from saved' : 'Save job'}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSaved ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-4 sm:space-y-6">
        {/* Apply and Save buttons */}
        <div className="flex gap-2">
          <div className="flex-1">
            <JobApplyButton job={job} />
          </div>
          {canSave && (
            <Button
              variant={isSaved ? 'default' : 'outline'}
              size="icon"
              onClick={handleSaveToggle}
              disabled={isLoading}
              className="shrink-0"
              title={isSaved ? 'Remove from saved' : 'Save job'}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSaved ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {jobUrl && (
          <SocialShare
            title={`${job.title} at ${job.company_name}`}
            url={jobUrl}
            description={shareDescription}
          />
        )}

        {/* Newsletter - only show on desktop sidebar */}
        <div className="hidden lg:block">
          <NewsletterSubscription
            variant="compact"
            title="Get Similar Jobs"
            description="Subscribe to receive job alerts matching your interests."
          />
        </div>
      </div>
    </div>
  )
}
