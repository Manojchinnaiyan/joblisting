import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { Container } from '@/components/layout/container'
import { CompanyHeader } from '@/components/companies/company-header'
import { CompanyAbout } from '@/components/companies/company-about'
import { CompanyLocations } from '@/components/companies/company-locations'
import { CompanyBenefits } from '@/components/companies/company-benefits'
import { FollowButton } from '@/components/companies/follow-button'
import { BackButton } from '@/components/shared/back-button'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { companiesApi } from '@/lib/api/companies'

async function getCompany(slug: string) {
  try {
    return await companiesApi.getCompanyBySlug(slug)
  } catch (error) {
    return null
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
