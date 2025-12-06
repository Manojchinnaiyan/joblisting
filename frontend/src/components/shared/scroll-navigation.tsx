'use client'

import { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ScrollNavigationProps {
  className?: string
}

export function ScrollNavigation({ className }: ScrollNavigationProps) {
  const [showTopButton, setShowTopButton] = useState(false)
  const [showBottomButton, setShowBottomButton] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = window.innerHeight

      // Show top button after scrolling down 300px
      setShowTopButton(scrollTop > 300)

      // Hide bottom button when near the bottom (within 100px)
      setShowBottomButton(scrollTop + clientHeight < scrollHeight - 100)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial state

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    })
  }

  // Don't render if both buttons are hidden
  if (!showTopButton && !showBottomButton) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed right-4 bottom-4 sm:right-6 sm:bottom-6 flex flex-col gap-2 z-50',
        className
      )}
    >
      {showTopButton && (
        <Button
          variant="outline"
          size="icon"
          onClick={scrollToTop}
          className="h-10 w-10 rounded-full shadow-lg bg-background/80 backdrop-blur-sm hover:bg-background"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
      )}
      {showBottomButton && (
        <Button
          variant="outline"
          size="icon"
          onClick={scrollToBottom}
          className="h-10 w-10 rounded-full shadow-lg bg-background/80 backdrop-blur-sm hover:bg-background"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="h-5 w-5" />
        </Button>
      )}
    </div>
  )
}
