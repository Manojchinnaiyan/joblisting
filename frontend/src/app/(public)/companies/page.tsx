import { Metadata } from 'next'
import { Suspense } from 'react'
import { CompaniesPageClient } from './companies-page-client'
import { Container } from '@/components/layout/container'

const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://jobsworld.in/api/v1'

export const metadata: Metadata = {
  title: 'Explore Companies - Find Top Employers Hiring Now',
  description: 'Discover top companies hiring for your dream role. Browse company profiles, see open positions, benefits, and company culture. Find your ideal workplace.',
  keywords: [
    'companies hiring',
    'top employers',
    'company profiles',
    'workplace culture',
    'job opportunities',
    'company reviews',
    'employer information',
    'hiring companies',
  ],
  openGraph: {
    title: 'Explore Companies - Find Top Employers Hiring Now',
    description: 'Discover top companies hiring for your dream role. Browse company profiles and find your ideal workplace.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://jobsworld.in/companies',
  },
}

async function getInitialCompanies() {
  try {
    const response = await fetch(`${API_URL}/companies?page=1&per_page=12`, {
      next: { revalidate: 300 },
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch initial companies:', response.status)
      return null
    }

    const data = await response.json()

    if (data.data) {
      return {
        companies: data.data.companies || [],
        pagination: data.data.pagination || null,
      }
    }

    return null
  } catch (error) {
    console.error('Error fetching initial companies:', error)
    return null
  }
}

function CompaniesPageFallback() {
  return (
    <Container className="py-8">
      <div className="mb-8">
        <div className="h-9 w-64 bg-muted animate-pulse rounded mb-4" />
        <div className="h-5 w-96 bg-muted animate-pulse rounded mb-4" />
        <div className="h-12 w-full bg-muted animate-pulse rounded" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </Container>
  )
}

export default async function CompaniesPage() {
  const initialData = await getInitialCompanies()

  return (
    <Suspense fallback={<CompaniesPageFallback />}>
      <CompaniesPageClient initialData={initialData} />
    </Suspense>
  )
}
