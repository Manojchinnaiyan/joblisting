'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { Sidebar } from '@/components/dashboard/sidebar'
import { MobileNav } from '@/components/dashboard/mobile-nav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAuthenticated, _hasHydrated } = useAuthStore()
  const hasRedirected = useRef(false)

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) return

    // Wait for hydration before checking auth
    if (!_hasHydrated) {
      return
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      hasRedirected.current = true
      router.replace('/login?redirect=/dashboard')
      return
    }

    // Redirect based on role if not a job seeker
    if (user?.role === 'EMPLOYER') {
      hasRedirected.current = true
      router.replace('/employer')
      return
    }
    if (user?.role === 'ADMIN') {
      hasRedirected.current = true
      router.replace('/admin')
      return
    }
    if (user?.role !== 'JOB_SEEKER') {
      hasRedirected.current = true
      router.replace('/')
    }
  }, [isAuthenticated, user, router, _hasHydrated])

  // Show loading state while hydrating
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

  // Show loading state while redirecting for wrong role
  if (!isAuthenticated || user?.role !== 'JOB_SEEKER') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-2 text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block lg:fixed lg:inset-y-0 lg:z-50">
        <Sidebar />
      </aside>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Main Content */}
      <main className="flex-1 lg:pl-64">
        {/* Mobile top padding */}
        <div className="lg:hidden h-16" />

        <div className="w-full max-w-7xl mx-auto px-6 py-6 pb-20 lg:pb-6">
          {children}
        </div>
      </main>
    </div>
  )
}
