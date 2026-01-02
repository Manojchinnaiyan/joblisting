'use client'

import { useEffect } from 'react'

const GTM_ID = 'GTM-5F6RMCTV'

export function GTMScript() {
  useEffect(() => {
    // Initialize dataLayer
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js',
    })

    // Load GTM script after hydration
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`
    document.head.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  return null
}

// Extend Window interface for dataLayer
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
  }
}
