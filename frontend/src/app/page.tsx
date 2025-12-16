'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { HeroSectionBento } from '@/components/home/hero-section-bento'
import { CategoriesBento } from '@/components/home/categories-bento'
import { StatsBento } from '@/components/home/stats-bento'
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
      <main className="flex-1">
        <HeroSectionBento />
        <CategoriesBento />
        <StatsBento />
      </main>
      <Footer />
    </div>
  )
}
