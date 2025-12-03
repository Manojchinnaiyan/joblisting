'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface UseUnsavedChangesOptions {
  isDirty: boolean
  onNavigate?: () => void
}

export function useUnsavedChanges({ isDirty, onNavigate }: UseUnsavedChangesOptions) {
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(false)
  const [pendingUrl, setPendingUrl] = useState<string | null>(null)
  const isNavigatingRef = useRef(false)

  // Handle browser back/forward and refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isNavigatingRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // Intercept all link clicks when dirty
  useEffect(() => {
    if (!isDirty) return

    const handleClick = (e: MouseEvent) => {
      // Skip if we're intentionally navigating
      if (isNavigatingRef.current) return

      const target = e.target as HTMLElement
      const anchor = target.closest('a')

      if (anchor && anchor.href) {
        const url = new URL(anchor.href)
        const currentUrl = new URL(window.location.href)

        // Only intercept internal navigation (same origin, different path)
        if (url.origin === currentUrl.origin && url.pathname !== currentUrl.pathname) {
          e.preventDefault()
          e.stopPropagation()
          setPendingUrl(url.pathname)
          setShowDialog(true)
        }
      }
    }

    // Use capture phase to intercept before other handlers
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [isDirty])

  // Handle browser back button with popstate
  useEffect(() => {
    if (!isDirty) return

    const handlePopState = () => {
      // Skip if we're intentionally navigating
      if (isNavigatingRef.current) return

      // Push current state back to prevent navigation
      window.history.pushState(null, '', window.location.href)
      setShowDialog(true)
      setPendingUrl(null) // Will use history.back() on confirm
    }

    // Push current state so we can detect back button
    window.history.pushState(null, '', window.location.href)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isDirty])

  const handleDiscard = useCallback(() => {
    // Set flag to bypass interceptors
    isNavigatingRef.current = true
    setShowDialog(false)
    onNavigate?.()

    // Use setTimeout to ensure state updates before navigation
    setTimeout(() => {
      if (pendingUrl) {
        router.push(pendingUrl)
      } else {
        // Browser back button was pressed - go back twice (once for our pushState, once for actual back)
        window.history.go(-2)
      }
      setPendingUrl(null)
    }, 0)
  }, [pendingUrl, router, onNavigate])

  const handleContinue = useCallback(() => {
    setShowDialog(false)
    setPendingUrl(null)
  }, [])

  const navigateWithCheck = useCallback((url: string) => {
    if (isDirty) {
      setPendingUrl(url)
      setShowDialog(true)
    } else {
      router.push(url)
    }
  }, [isDirty, router])

  return {
    showDialog,
    setShowDialog,
    handleDiscard,
    handleContinue,
    navigateWithCheck,
  }
}
