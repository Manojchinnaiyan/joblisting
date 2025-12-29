import { Metadata } from 'next'
import { Suspense } from 'react'
import { JobsPageClient } from './jobs-page-client'
import { JobSkeletonList } from '@/components/jobs/job-skeleton'
import { Container } from '@/components/layout/container'

// Use internal Docker network URL for server-side fetching, fallback to public URL
const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://jobsworld.in/api/v1'

export const metadata: Metadata = {
  title: 'Browse Jobs - Find Your Next Career Opportunity',
  description: 'Search and browse thousands of job opportunities across various industries. Find remote jobs, full-time positions, internships, and more. Filter by location, experience level, and job type.',
  keywords: [
    'job search',
    'find jobs',
    'job listings',
    'career opportunities',
    'remote jobs',
    'full time jobs',
    'part time jobs',
    'internships',
    'entry level jobs',
    'job vacancies',
  ],
  openGraph: {
    title: 'Browse Jobs - Find Your Next Career Opportunity',
    description: 'Search and browse thousands of job opportunities across various industries.',
    type: 'website',
  },
}

async function getInitialJobs() {
  try {
    const response = await fetch(`${API_URL}/jobs?page=1&per_page=12`, {
      next: { revalidate: 300 }, // Revalidate every 5 minutes
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch initial jobs:', response.status, response.statusText)
      return null
    }

    const data = await response.json()

    // Return the jobs and pagination data
    if (data.data) {
      return {
        jobs: data.data.jobs || [],
        pagination: data.data.pagination || null,
      }
    }

    return null
  } catch (error) {
    console.error('Error fetching initial jobs:', error)
    return null
  }
}

function JobsPageFallback() {
  return (
    <Container className="py-4 sm:py-8">
      <div className="mb-4 sm:mb-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded mb-4" />
        <div className="h-12 w-full bg-muted animate-pulse rounded" />
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="h-96 bg-muted animate-pulse rounded" />
        </aside>
        <main className="flex-1">
          <JobSkeletonList count={12} />
        </main>
      </div>
    </Container>
  )
}

export default async function JobsPage() {
  const initialData = await getInitialJobs()

  return (
    <Suspense fallback={<JobsPageFallback />}>
      <JobsPageClient initialData={initialData} />
    </Suspense>
  )
}
