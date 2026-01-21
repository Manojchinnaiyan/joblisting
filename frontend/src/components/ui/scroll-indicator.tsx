'use client'

import { useEffect, useState } from 'react'

export function ScrollIndicator() {
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight

      if (docHeight > 0) {
        const progress = (scrollTop / docHeight) * 100
        setScrollProgress(Math.min(progress, 100))
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Only show when there's scroll progress
  if (scrollProgress === 0) return null

  return (
    <div
      id="scroll-indicator"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '3px',
        zIndex: 99999,
        backgroundColor: 'transparent',
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${scrollProgress}%`,
          backgroundColor: '#2563eb',
          boxShadow: '0 0 8px rgba(37, 99, 235, 0.6)',
          transition: 'width 100ms linear'
        }}
      />
    </div>
  )
}
