import { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { Container } from '@/components/layout/container'
import { CompanyHeader } from '@/components/companies/company-header'
import { CompanyAbout } from '@/components/companies/company-about'
import { CompanyLocations } from '@/components/companies/company-locations'
import { CompanyBenefits } from '@/components/companies/company-benefits'
import { CompanyMedia } from '@/components/companies/company-media'
import { FollowButton } from '@/components/companies/follow-button'
import { BackButton } from '@/components/shared/back-button'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { companiesApi } from '@/lib/api/companies'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jobsworld.in'

async function getCompany(slug: string) {
  try {
    return await companiesApi.getCompanyBySlug(slug)
  } catch (error) {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const company = await getCompany(slug)

  if (!company) {
    return {
      title: 'Company Not Found',
      description: 'The company you are looking for does not exist.',
    }
  }

  const title = `${company.name} - Company Profile, Jobs & Culture`
  const description = company.description
    ? company.description.replace(/<[^>]*>/g, '').slice(0, 160)
    : `Explore ${company.name} company profile. View open job positions, company culture, benefits, and more. Find your next career opportunity.`

  return {
    title,
    description,
    keywords: [
      company.name,
      `${company.name} jobs`,
      `${company.name} careers`,
      'company profile',
      'job opportunities',
      company.industry || 'hiring company',
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${BASE_URL}/companies/${slug}`,
      images: company.logo_url
        ? [
            {
              url: company.logo_url,
              width: 200,
              height: 200,
              alt: company.name,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: company.logo_url ? [company.logo_url] : undefined,
    },
    alternates: {
      canonical: `${BASE_URL}/companies/${slug}`,
    },
  }
}

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const company = await getCompany(slug)

  if (!company) {
    notFound()
  }

  return (
    <Container className="py-8">
      <div className="mb-6">
        <BackButton fallbackHref="/companies" label="Back to Companies" />
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <CompanyHeader company={company}>
          <FollowButton companyId={company.id} isFollowing={company.is_following} />
        </CompanyHeader>

        <div className="mt-8 space-y-8">
          <CompanyAbout company={company} />
          {company.media && company.media.length > 0 && (
            <CompanyMedia media={company.media} />
          )}
          {company.locations && company.locations.length > 0 && (
            <CompanyLocations locations={company.locations} />
          )}
          {company.benefits && company.benefits.length > 0 && (
            <CompanyBenefits benefits={company.benefits} />
          )}
        </div>
      </Suspense>
    </Container>
  )
}
