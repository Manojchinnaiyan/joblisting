'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect, ReactNode } from 'react'

if (typeof window !== 'undefined') {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

  if (key && host && !posthog.__loaded) {
    posthog.init(key, {
      api_host: host,
      person_profiles: 'identified_only',
      capture_pageview: false,
      capture_pageleave: true,
      loaded: (ph) => {
        console.log('✅ PostHog initialized successfully!')
        if (process.env.NODE_ENV === 'development') {
          ph.debug()
          console.log('🐛 PostHog debug mode enabled')
        }
      },
    })
  }
}

export function PHProvider({ children }: { children: ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
