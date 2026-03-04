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

    // Add GTM noscript iframe (for completeness, though JS is clearly enabled)
    const noscript = document.createElement('noscript')
    const iframe = document.createElement('iframe')
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${GTM_ID}`
    iframe.height = '0'
    iframe.width = '0'
    iframe.style.display = 'none'
    iframe.style.visibility = 'hidden'
    noscript.appendChild(iframe)
    document.body.appendChild(noscript)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
      if (noscript.parentNode) {
        noscript.parentNode.removeChild(noscript)
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
