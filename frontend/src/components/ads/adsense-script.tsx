'use client'

import { useEffect } from 'react'

export function AdSenseScript() {
  useEffect(() => {
    // Load AdSense script after hydration to avoid hydration mismatch
    const script = document.createElement('script')
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2850705628908256'
    script.async = true
    script.crossOrigin = 'anonymous'
    document.head.appendChild(script)

    return () => {
      // Cleanup on unmount (though this rarely happens for root layout)
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  return null
}
