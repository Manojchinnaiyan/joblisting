'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { useMyCompany } from '@/hooks/employer/use-company'
import { EmployerSidebar } from '@/components/employer/sidebar'
import { EmployerMobileNav } from '@/components/employer/mobile-nav'

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading: isAuthLoading, accessToken, _hasHydrated } = useAuthStore()
  const hasRedirected = useRef(false)

  // Only enable company query when auth is fully ready AND email is verified
  const isAuthReady = _hasHydrated && !isAuthLoading && !!accessToken && user?.role === 'EMPLOYER' && user?.email_verified

  const {
    data: company,
    isLoading: isCompanyLoading,
    isFetched: isCompanyFetched,
  } = useMyCompany()

  // Handle auth redirects - only once
  useEffect(() => {
    if (hasRedirected.current) return
    if (!_hasHydrated) return

    if (!accessToken) {
      hasRedirected.current = true
      router.replace('/login?redirect=/employer')
      return
    }

    // Check email verification first
    if (user && !user.email_verified) {
      hasRedirected.current = true
      router.replace('/verify-email')
      return
    }

    if (user && user.role !== 'EMPLOYER') {
      hasRedirected.current = true
      // Redirect to appropriate dashboard based on role
      if (user.role === 'JOB_SEEKER') {
        router.replace('/dashboard')
      } else if (user.role === 'ADMIN') {
        router.replace('/admin')
      } else {
        router.replace('/')
      }
      return
    }
  }, [user, _hasHydrated, accessToken, router])

  // Handle company setup redirect - only once after company is fetched
  useEffect(() => {
    if (hasRedirected.current) return
    if (!isAuthReady) return
    if (isCompanyLoading || !isCompanyFetched) return

    const isOnSetupPage = pathname === '/company/setup'
    if (company === null && !isOnSetupPage) {
      hasRedirected.current = true
      router.replace('/company/setup')
    }
  }, [company, isCompanyLoading, isCompanyFetched, isAuthReady, pathname, router])

  // Show loading while checking auth
  if (!_hasHydrated || isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated or not employer - will redirect
  if (!accessToken || !user || user.role !== 'EMPLOYER') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  // Email not verified - will redirect to verify email page
  if (!user.email_verified) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">Email verification required...</p>
        </div>
      </div>
    )
  }

  // Show loading while checking company
  if (isCompanyLoading && !isCompanyFetched) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">Loading company...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block lg:fixed lg:inset-y-0 lg:z-50">
        <EmployerSidebar />
      </aside>

      {/* Mobile Navigation */}
      <EmployerMobileNav />

      {/* Main Content */}
      <main className="flex-1 lg:pl-64">
        <div className="container mx-auto px-4 py-6 pt-20 pb-20 lg:pt-6 lg:pb-6">
          {children}
        </div>
      </main>
    </div>
  )
}
