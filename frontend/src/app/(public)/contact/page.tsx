import { Metadata } from 'next'
import Script from 'next/script'
import { ContactPageClient } from './contact-page-client'
import { APP_NAME } from '@/lib/constants'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jobsworld.in'

export const metadata: Metadata = {
  title: 'Contact Us - Get Help & Support',
  description: 'Have questions about JobsWorld? Contact our support team for help with job searching, employer services, account issues, or general inquiries. We respond within 24-48 hours.',
  keywords: [
    'contact jobsworld',
    'customer support',
    'job search help',
    'employer support',
    'contact us',
    'help center',
  ],
  openGraph: {
    title: 'Contact Us - Get Help & Support',
    description: 'Have questions? Contact our support team for help with job searching, employer services, or general inquiries.',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'JobsWorld - Contact Us' }],
  },
  alternates: {
    canonical: `${BASE_URL}/contact`,
  },
}

// FAQ Schema for structured data
function ContactStructuredData() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I create an account?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Click the "Sign Up" button in the top right corner and follow the registration process. You can sign up with your email or use Google authentication.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I apply for jobs?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Browse our job listings, click on a job you\'re interested in, and click the "Apply" button. Make sure your profile and resume are up to date.',
        },
      },
      {
        '@type': 'Question',
        name: `Is ${APP_NAME} free to use?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Yes! Job seekers can use ${APP_NAME} completely free of charge. Create your profile, upload your resume, and apply to unlimited jobs.`,
        },
      },
      {
        '@type': 'Question',
        name: 'How do I post a job?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Employers can post jobs by creating an employer account. Go to your dashboard and click "Post a Job" to get started with your job listing.',
        },
      },
    ],
  }

  const contactSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact JobsWorld',
    description: 'Contact JobsWorld for help with job searching, employer services, or general inquiries.',
    url: `${BASE_URL}/contact`,
    mainEntity: {
      '@type': 'Organization',
      name: APP_NAME,
      email: 'support@jobsworld.com',
      telephone: '+1 (555) 123-4567',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '123 Tech Hub Street',
        addressLocality: 'San Francisco',
        addressRegion: 'CA',
        postalCode: '94105',
        addressCountry: 'US',
      },
    },
  }

  return (
    <>
      <Script
        id="faq-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="contact-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />
    </>
  )
}

export default function ContactPage() {
  return (
    <>
      <ContactStructuredData />
      <ContactPageClient />
    </>
  )
}
