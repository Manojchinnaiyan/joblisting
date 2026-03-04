'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { ReactNode, useEffect, useRef } from 'react'

export function PHProvider({ children }: { children: ReactNode }) {
  const initialized = useRef(false)

  // Initialize PostHog AFTER hydration (inside useEffect) to prevent
  // DOM modifications before React hydrates, which causes error #418
  // when ad blockers block the injected PostHog scripts.
  useEffect(() => {
    if (initialized.current) return
    if (process.env.NODE_ENV !== 'production') return

    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

    if (key && host && !posthog.__loaded) {
      initialized.current = true
      posthog.init(key, {
        api_host: host,
        person_profiles: 'identified_only',
        capture_pageview: false,
        capture_pageleave: true,
      })
    }
  }, [])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
