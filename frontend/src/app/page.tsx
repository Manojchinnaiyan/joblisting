import dynamic from 'next/dynamic'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from '@/components/home/hero-section'
import { AnnouncementBanner } from '@/components/shared/announcement-banner'

// Lazy load below-the-fold sections for better initial page load
const FeaturedJobs = dynamic(() => import('@/components/home/featured-jobs').then(mod => ({ default: mod.FeaturedJobs })))
const JobCategories = dynamic(() => import('@/components/home/job-categories').then(mod => ({ default: mod.JobCategories })))
const StatsSection = dynamic(() => import('@/components/home/stats-section').then(mod => ({ default: mod.StatsSection })))
const FeaturedCompanies = dynamic(() => import('@/components/home/featured-companies').then(mod => ({ default: mod.FeaturedCompanies })))
const HowItWorks = dynamic(() => import('@/components/home/how-it-works').then(mod => ({ default: mod.HowItWorks })))
const CTASection = dynamic(() => import('@/components/home/cta-section').then(mod => ({ default: mod.CTASection })))

// Note: Redirect after login is handled by the login form itself
// Home page is accessible to all users (authenticated or not)
export default function HomePage() {

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
