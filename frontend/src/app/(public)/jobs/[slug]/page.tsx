import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { Container } from '@/components/layout/container'
import { JobDetail } from '@/components/jobs/job-detail'
import { JobSidebar } from '@/components/jobs/job-sidebar'
import { BackButton } from '@/components/shared/back-button'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { jobsApi } from '@/lib/api/jobs'

async function getJob(slug: string) {
  try {
    return await jobsApi.getJobBySlug(slug)
  } catch (error) {
    return null
  }
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const job = await getJob(slug)

  if (!job) {
    notFound()
  }

  return (
    <Container className="py-4 sm:py-8">
      <div className="mb-4 sm:mb-6">
        <BackButton fallbackHref="/jobs" label="Back to Jobs" />
      </div>

      {/* Mobile: Apply button and share at top */}
      <div className="lg:hidden mb-4">
        <JobSidebar job={job} />
      </div>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 min-w-0 overflow-hidden">
          <Suspense fallback={<LoadingSpinner />}>
            <JobDetail job={job} />
          </Suspense>
        </div>

        {/* Desktop: Apply button and share in sidebar */}
        <div className="hidden lg:block lg:col-span-1">
          <JobSidebar job={job} className="sticky top-20" />
        </div>
      </div>
    </Container>
  )
}
