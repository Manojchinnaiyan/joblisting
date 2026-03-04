'use client'

import { useEffect } from 'react'

/**
 * Loads Cloudflare Web Analytics beacon after hydration.
 *
 * This replaces Cloudflare's auto-injected script (which causes React
 * hydration error #418 when ad blockers remove the injected <script> tag).
 *
 * To use: disable "Web Analytics" auto-injection in the Cloudflare dashboard,
 * then add this component to your layout.
 *
 * Set your beacon token via NEXT_PUBLIC_CF_BEACON_TOKEN env variable,
 * or leave it empty to disable.
 */
export function CloudflareScript() {
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN
    if (!token) return

    const script = document.createElement('script')
    script.src = `https://static.cloudflareinsights.com/beacon.min.js`
    script.async = true
    script.defer = true
    script.dataset.cfBeacon = JSON.stringify({ token })
    document.head.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  return null
}
