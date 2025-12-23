import { Job } from '@/types/job'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jobsworld.in'

interface JobStructuredDataProps {
  job: Job
}

export function JobStructuredData({ job }: JobStructuredDataProps) {
  // Map job type to schema.org employment type
  const employmentTypeMap: Record<string, string> = {
    FULL_TIME: 'FULL_TIME',
    PART_TIME: 'PART_TIME',
    CONTRACT: 'CONTRACTOR',
    FREELANCE: 'CONTRACTOR',
    INTERNSHIP: 'INTERN',
  }

  // Map workplace type
  const workplaceTypeMap: Record<string, string> = {
    REMOTE: 'TELECOMMUTE',
    ONSITE: '',
    HYBRID: 'TELECOMMUTE',
  }

  // Build salary structure
  let baseSalary = null
  if (job.salary && !job.salary.hidden && (job.salary.min || job.salary.max)) {
    baseSalary = {
      '@type': 'MonetaryAmount',
      currency: job.salary.currency || 'USD',
      value: {
        '@type': 'QuantitativeValue',
        ...(job.salary.min && job.salary.max
          ? {
              minValue: job.salary.min,
              maxValue: job.salary.max,
            }
          : job.salary.min
          ? { value: job.salary.min }
          : { value: job.salary.max }),
        unitText: job.salary.period === 'hourly' ? 'HOUR' : job.salary.period === 'monthly' ? 'MONTH' : 'YEAR',
      },
    }
  }

  // Build job location
  const jobLocation = job.workplace_type === 'REMOTE'
    ? {
        '@type': 'VirtualLocation',
      }
    : {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: job.city || job.location,
          addressRegion: job.city ? job.location : undefined,
          addressCountry: job.country || 'US',
        },
      }

  // Clean description - remove HTML tags
  const cleanDescription = job.description
    ? job.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    : `${job.title} position at ${job.company_name}`

  // Build the structured data
  const structuredData = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: job.title,
    description: cleanDescription,
    identifier: {
      '@type': 'PropertyValue',
      name: job.company_name,
      value: job.id,
    },
    datePosted: job.published_at || job.created_at,
    validThrough: job.expires_at,
    employmentType: employmentTypeMap[job.job_type] || 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company_name,
      sameAs: `${BASE_URL}/companies/${job.company_name.toLowerCase().replace(/\s+/g, '-')}`,
      ...(job.company_logo_url && { logo: job.company_logo_url }),
    },
    jobLocation,
    ...(job.workplace_type && workplaceTypeMap[job.workplace_type] && {
      jobLocationType: workplaceTypeMap[job.workplace_type],
    }),
    ...(baseSalary && { baseSalary }),
    ...(job.skills && job.skills.length > 0 && {
      skills: job.skills.join(', '),
    }),
    ...(job.experience_level && {
      experienceRequirements: {
        '@type': 'OccupationalExperienceRequirements',
        monthsOfExperience: job.experience_level === 'ENTRY' ? 0 :
          job.experience_level === 'MID' ? 24 :
          job.experience_level === 'SENIOR' ? 60 :
          job.experience_level === 'LEAD' ? 84 : 120,
      },
    }),
    applicantLocationRequirements: job.workplace_type === 'REMOTE'
      ? { '@type': 'Country', name: 'Worldwide' }
      : undefined,
    directApply: !job.original_url,
  }

  // Remove undefined values
  const cleanStructuredData = JSON.parse(JSON.stringify(structuredData))

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(cleanStructuredData) }}
    />
  )
}

// BreadcrumbList structured data for job pages
export function JobBreadcrumbData({ job }: JobStructuredDataProps) {
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: BASE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Jobs',
        item: `${BASE_URL}/jobs`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: job.title,
        item: `${BASE_URL}/jobs/${job.slug}`,
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
    />
  )
}
