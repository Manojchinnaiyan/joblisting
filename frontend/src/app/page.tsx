import { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from '@/components/home/hero-section'
import { AnnouncementBanner } from '@/components/shared/announcement-banner'
import { FeaturedJobs } from '@/components/home/featured-jobs'
import { JobCategories } from '@/components/home/job-categories'
import { StatsSection } from '@/components/home/stats-section'
import { FeaturedCompanies } from '@/components/home/featured-companies'
import { HowItWorks } from '@/components/home/how-it-works'
import { CTASection } from '@/components/home/cta-section'
import { SEOContentSection } from '@/components/home/seo-content-section'
import { serverApi } from '@/lib/api/server'

export const metadata: Metadata = {
  title: 'JobsWorld - Find Remote Jobs, International Opportunities & Career Growth',
  description: 'Discover thousands of remote jobs, international positions, and career opportunities from top companies worldwide. Search jobs by location, salary, and job type. Start your career journey today.',
  keywords: ['jobs', 'remote jobs', 'international jobs', 'career opportunities', 'job search', 'employment', 'work from home', 'hiring', 'job listings'],
  openGraph: {
    title: 'JobsWorld - Global Job Search Platform',
    description: 'Find your dream job from thousands of opportunities worldwide. Remote jobs, international positions, and career growth await.',
    type: 'website',
    url: 'https://jobsworld.in',
    siteName: 'JobsWorld',
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
    title: 'JobsWorld - Global Job Search Platform',
    description: 'Find your dream job from thousands of opportunities worldwide. Remote jobs, international positions, and career growth await.',
    images: ['/og-image.png'],
  },
}

// Server-side data fetching for SEO
async function getHomePageData() {
  // Fetch data in parallel
  const [featuredJobs, categories] = await Promise.all([
    serverApi.getFeaturedJobs(6),
    serverApi.getCategories(),
  ])

  return {
    featuredJobs,
    categories,
  }
}

export default async function HomePage() {
  const { featuredJobs, categories } = await getHomePageData()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <AnnouncementBanner />
      <main className="flex-1">
        <HeroSection />
        <FeaturedJobs initialJobs={featuredJobs} />
        <JobCategories initialCategories={categories} />
        <StatsSection />
        <FeaturedCompanies />
        <HowItWorks />
        <SEOContentSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
