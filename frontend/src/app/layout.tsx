import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import NextTopLoader from 'nextjs-toploader'
import './globals.css'
import { QueryProvider } from '@/providers/query-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import { AuthProvider } from '@/providers/auth-provider'
import { Toaster } from '@/components/ui/toaster'
// import { CookieConsent } from '@/components/shared/cookie-consent'
import { OrganizationStructuredData } from '@/components/seo/organization-structured-data'
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants'

// Inter font for entire application
const inter = Inter({
  subsets: ['latin'],
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
        {/* Preconnect to external origins for faster resource loading */}
        <link rel="preconnect" href="https://s3.smartdreamers.com" />
        <link rel="preconnect" href="https://www.accenture.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-5F6RMCTV');`}
        </Script>
        {/* Google AdSense */}
        <Script
          id="adsense"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2850705628908256"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <OrganizationStructuredData />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="google-adsense-account" content="ca-pub-2850705628908256" />
      </head>
      <body className={inter.variable} suppressHydrationWarning>
        <NextTopLoader
          color="#2563eb"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #2563eb,0 0 5px #2563eb"
          zIndex={9999}
        />
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5F6RMCTV"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster />
              {/* <CookieConsent /> */}
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
