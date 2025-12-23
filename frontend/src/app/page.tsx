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
