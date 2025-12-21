'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from '@/components/home/hero-section'
import { FeaturedJobs } from '@/components/home/featured-jobs'
import { FeaturedCompanies } from '@/components/home/featured-companies'
import { JobCategories } from '@/components/home/job-categories'
import { StatsSection } from '@/components/home/stats-section'
import { HowItWorks } from '@/components/home/how-it-works'
import { CTASection } from '@/components/home/cta-section'
import { AnnouncementBanner } from '@/components/shared/announcement-banner'
import { useAuthStore } from '@/store/auth-store'
import { ROUTES } from '@/lib/constants'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (isAuthenticated) {
      router.push(ROUTES.DASHBOARD)
    }
  }, [isAuthenticated, router])

  // Don't render the landing page if user is authenticated (will redirect)
  if (isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <AnnouncementBanner />
      <main className="flex-1">
        <HeroSection />
        <FeaturedJobs />
        <JobCategories />
        <StatsSection />
        <FeaturedCompanies />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
