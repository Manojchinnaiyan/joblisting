import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants'

const BASE_URL = 'https://jobsworld.in'

export function OrganizationStructuredData() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: APP_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: APP_DESCRIPTION,
    sameAs: [
      // Add your social media profiles here when available
      // 'https://twitter.com/jobsworld',
      // 'https://linkedin.com/company/jobsworld',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      url: `${BASE_URL}/contact`,
    },
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: APP_NAME,
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/jobs?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  )
}
