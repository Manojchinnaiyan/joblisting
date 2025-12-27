import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jobsworld.in'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/employer/',
          '/dashboard/',
          '/profile/',
          '/settings/',
          '/applications/',
          '/saved-jobs/',
          '/resumes/',
          '/api/',
          '/_next/',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/verify-email',
          '/tag/',  // Old URLs from previous domain owner
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/employer/',
          '/dashboard/',
          '/profile/',
          '/settings/',
          '/applications/',
          '/saved-jobs/',
          '/resumes/',
          '/api/',
          '/tag/',  // Old URLs from previous domain owner
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
