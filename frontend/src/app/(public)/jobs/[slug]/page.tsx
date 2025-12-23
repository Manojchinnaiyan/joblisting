import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { Container } from '@/components/layout/container'
import { JobDetail } from '@/components/jobs/job-detail'
import { JobSidebar } from '@/components/jobs/job-sidebar'
import { BackButton } from '@/components/shared/back-button'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { NewsletterSubscription } from '@/components/shared/newsletter-subscription'
import { JobStructuredData, JobBreadcrumbData } from '@/components/seo/job-structured-data'
import { jobsApi } from '@/lib/api/jobs'
import { APP_NAME } from '@/lib/constants'
import { Job } from '@/types/job'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jobsworld.in'

async function getJob(slug: string): Promise<Job | null> {
  try {
    return await jobsApi.getJobBySlug(slug)
  } catch {
    return null
  }
}

// Generate dynamic metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const job = await getJob(slug)

  if (!job) {
    return {
      title: 'Job Not Found',
      description: 'The job posting you are looking for does not exist or has been removed.',
    }
  }

  const jobTitle = job.title
  const companyName = job.company_name
  const location = job.location || 'Remote'
  const jobType = job.job_type?.replace('_', ' ').toLowerCase() || 'full time'

  // Create a clean description for SEO
  const cleanDescription = job.short_description ||
    (job.description ? job.description.replace(/<[^>]*>/g, '').substring(0, 160) : '')

  const title = `${jobTitle} at ${companyName} - ${location}`
  const description = cleanDescription ||
    `Apply for ${jobTitle} position at ${companyName}. ${location}. ${jobType} opportunity. Find your next career move on ${APP_NAME}.`

  // Format salary for display
  let salaryText = ''
  if (job.salary && !job.salary.hidden) {
    const currency = job.salary.currency || 'USD'
    if (job.salary.min && job.salary.max) {
      salaryText = `${currency} ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}`
    } else if (job.salary.min) {
      salaryText = `From ${currency} ${job.salary.min.toLocaleString()}`
    }
  }

  const keywords = [
    jobTitle,
    companyName,
    location,
    jobType,
    job.experience_level?.toLowerCase() || '',
    job.workplace_type?.toLowerCase() || '',
    ...(job.skills || []),
    'job',
    'career',
    'employment',
    'hiring',
  ].filter(Boolean)

  return {
    title,
    description,
    keywords: keywords.join(', '),
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: `${BASE_URL}/jobs/${slug}`,
      siteName: APP_NAME,
      title: `${jobTitle} - ${companyName} | ${APP_NAME}`,
      description,
      images: job.company_logo_url ? [
        {
          url: job.company_logo_url,
          width: 200,
          height: 200,
          alt: `${companyName} logo`,
        },
      ] : [
        {
          url: `${BASE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `${jobTitle} at ${companyName}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${jobTitle} at ${companyName}`,
      description,
      images: job.company_logo_url ? [job.company_logo_url] : [`${BASE_URL}/og-image.png`],
    },
    alternates: {
      canonical: `${BASE_URL}/jobs/${slug}`,
    },
    other: {
      'job:title': jobTitle,
      'job:company': companyName,
      'job:location': location,
      'job:type': jobType,
      ...(salaryText && { 'job:salary': salaryText }),
    },
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
    <>
      {/* Structured Data for SEO */}
      <JobStructuredData job={job} />
      <JobBreadcrumbData job={job} />

      <Container className="py-4 sm:py-8 pb-24 lg:pb-8">
        <div className="mb-4 sm:mb-6">
          <BackButton fallbackHref="/jobs" label="Back to Jobs" />
        </div>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 min-w-0 overflow-hidden">
            <Suspense fallback={<LoadingSpinner />}>
              <JobDetail
                job={job}
                mobileActions={<JobSidebar job={job} />}
              />
            </Suspense>

            {/* Mobile Newsletter - show at bottom of content */}
            <div className="lg:hidden mt-8">
              <NewsletterSubscription
                title="Get Job Alerts"
                description="Subscribe to receive similar job opportunities."
              />
            </div>
          </div>

          {/* Desktop: Apply button and share in sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <JobSidebar job={job} className="sticky top-20" />
          </div>
        </div>
      </Container>

      {/* Mobile Sticky Apply Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t p-3 lg:hidden">
        <Container className="!py-0">
          <JobSidebar job={job} isMobile />
        </Container>
      </div>
    </>
  )
}
