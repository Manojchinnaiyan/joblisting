'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { useAdminAuthStore } from '@/store/admin-auth-store'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, accessToken, _hasHydrated } = useAdminAuthStore()

  useEffect(() => {
    // Wait for hydration before checking auth
    if (!_hasHydrated) return

    // Redirect to main login if not authenticated
    if (!isAuthenticated || !accessToken) {
      router.replace('/login')
    }
  }, [isAuthenticated, accessToken, router, _hasHydrated])

  // Show loading while hydrating or checking auth
  if (!_hasHydrated || !isAuthenticated || !accessToken) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-950">
      {/* Desktop Sidebar - Fixed, no scroll */}
      <aside className="hidden md:flex md:w-64 md:flex-shrink-0">
        <div className="fixed inset-y-0 left-0 w-64 z-50 overflow-hidden">
          <AdminSidebar />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col h-screen overflow-hidden">
        {/* Header - Fixed height */}
        <div className="h-16 flex-shrink-0">
          <AdminHeader />
        </div>

        {/* Scrollable Main Content - calc remaining height */}
        <main className="flex-1 overflow-y-auto" style={{ height: 'calc(100vh - 4rem)' }}>
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
