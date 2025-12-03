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
import { useAuthStore } from '@/store/auth-store'
import { ROUTES } from '@/lib/constants'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, _hasHydrated } = useAuthStore()

  useEffect(() => {
    // Wait for hydration before checking auth
    if (!_hasHydrated) {
      return
    }

    if (isAuthenticated) {
      router.push(ROUTES.DASHBOARD)
    }
  }, [isAuthenticated, router, _hasHydrated])

  // Show loading while hydrating
  if (!_hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render the landing page if user is authenticated
  if (isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
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
