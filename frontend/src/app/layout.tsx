import type { Metadata } from 'next'
import { Work_Sans } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/providers/query-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import { AuthProvider } from '@/providers/auth-provider'
import { Toaster } from '@/components/ui/toaster'
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants'

// Work Sans font for entire application
const workSans = Work_Sans({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://jobsworld.in'),
  title: {
    default: `${APP_NAME} - Find Remote Jobs, International Jobs & Career Opportunities Worldwide`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    'remote jobs',
    'work from home jobs',
    'international jobs',
    'global jobs',
    'job search',
    'career opportunities',
    'find jobs online',
    'job listings',
    'employment',
    'job vacancies',
    'full time jobs',
    'part time jobs',
    'freelance jobs',
    'contract jobs',
    'IT jobs',
    'tech jobs',
    'software developer jobs',
    'marketing jobs',
    'sales jobs',
    'design jobs',
    'remote work',
    'work anywhere',
    'jobs worldwide',
    'jobs India',
    'jobs USA',
    'jobs UK',
    'jobs Europe',
    'jobs Asia',
    'entry level jobs',
    'senior jobs',
    'executive jobs',
  ],
  authors: [{ name: 'JobsWorld' }],
  creator: 'JobsWorld',
  publisher: 'JobsWorld',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://jobsworld.in',
    siteName: APP_NAME,
    title: `${APP_NAME} - Find Remote Jobs & Career Opportunities Worldwide`,
    description: 'Discover thousands of remote jobs, international opportunities, and career openings across all industries. Your global job search starts here.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'JobsWorld - Global Job Search Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} - Find Remote Jobs & Career Opportunities Worldwide`,
    description: 'Discover thousands of remote jobs, international opportunities, and career openings across all industries.',
    images: ['/og-image.png'],
    creator: '@jobsworld',
  },
  alternates: {
    canonical: 'https://jobsworld.in',
  },
  category: 'Jobs & Employment',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className={workSans.variable}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
