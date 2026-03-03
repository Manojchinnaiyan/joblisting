'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'

/**
 * HydrationLogger - Development-only component that logs hydration state
 * to help debug React error #418 (hydration mismatch).
 *
 * Only logs in development mode. Remove or disable in production.
 */
export function HydrationLogger() {
  const { isAuthenticated, _hasHydrated, user } = useAuthStore()

  // Log initial render (happens during hydration)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('[Hydration] Render - _hasHydrated:', _hasHydrated, 'isAuthenticated:', isAuthenticated, 'user:', user?.email ?? 'null')
  }

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    console.log('[Hydration] After mount - _hasHydrated:', _hasHydrated, 'isAuthenticated:', isAuthenticated)

    // Listen for React's hydration error in the console
    const originalError = console.error
    console.error = (...args: unknown[]) => {
      const msg = typeof args[0] === 'string' ? args[0] : ''
      if (msg.includes('Hydration') || msg.includes('hydrat') || msg.includes('#418') || msg.includes('#425')) {
        console.warn('[Hydration Debug] Caught hydration error:', ...args)
        console.trace('[Hydration Debug] Stack trace')
      }
      originalError.apply(console, args)
    }

    return () => {
      console.error = originalError
    }
  }, [_hasHydrated, isAuthenticated])

  return null
}
