'use client'

import { useEffect } from 'react'

/**
 * This component suppresses the React hydration error #418 in production.
 *
 * The error occurs because:
 * 1. Browser extensions (Grammarly, ad blockers, etc.) inject elements into the DOM
 * 2. next-themes modifies the <html> class attribute for theme support
 * 3. GTM/Analytics scripts modify the DOM before React hydrates
 *
 * This is a known issue with React 19's stricter hydration checking.
 * The suppressHydrationWarning prop doesn't fully prevent the error from being thrown.
 *
 * This fix patches console.error to filter out the specific hydration error message
 * only in production builds.
 */
export function HydrationFix() {
  useEffect(() => {
    // Only apply in production
    if (process.env.NODE_ENV !== 'production') return

    const originalError = console.error

    console.error = (...args: unknown[]) => {
      // Check if this is the hydration error
      const message = args[0]
      if (
        typeof message === 'string' &&
        (message.includes('Minified React error #418') ||
          message.includes('Minified React error #423') ||
          message.includes('Minified React error #425') ||
          message.includes('Hydration failed') ||
          message.includes('There was an error while hydrating'))
      ) {
        // Suppress hydration errors in production
        return
      }
      originalError.apply(console, args)
    }

    return () => {
      console.error = originalError
    }
  }, [])

  return null
}
