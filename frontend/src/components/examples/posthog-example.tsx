'use client'

import { usePostHog } from 'posthog-js/react'
import { trackJobView, trackJobApplication, trackEvent } from '@/lib/posthog'
import { Button } from '@/components/ui/button'

/**
 * Example component demonstrating PostHog analytics integration
 *
 * This shows three ways to track events:
 * 1. Using the usePostHog hook directly
 * 2. Using utility functions from @/lib/posthog
 * 3. Using custom trackEvent function
 */
export function PostHogExample() {
  const posthog = usePostHog()

  // Method 1: Using the PostHog hook directly
  const handleClickWithHook = () => {
    posthog.capture('button_clicked', {
      button_name: 'example_button',
      timestamp: new Date().toISOString(),
    })
  }

  // Method 2: Using pre-built utility functions
  const handleJobView = () => {
    trackJobView('job-123', 'Senior Full Stack Developer')
  }

  const handleJobApplication = () => {
    trackJobApplication('job-123', 'Senior Full Stack Developer')
  }

  // Method 3: Using custom trackEvent function
  const handleCustomEvent = () => {
    trackEvent('custom_action', {
      action_type: 'example',
      value: 42,
      metadata: { foo: 'bar' },
    })
  }

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <h2 className="text-xl font-semibold">PostHog Analytics Examples</h2>

      <div className="space-y-2">
        <Button onClick={handleClickWithHook} variant="outline">
          Track with Hook (Check Console)
        </Button>

        <Button onClick={handleJobView} variant="outline">
          Track Job View
        </Button>

        <Button onClick={handleJobApplication} variant="outline">
          Track Job Application
        </Button>

        <Button onClick={handleCustomEvent} variant="outline">
          Track Custom Event
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Open your browser console (in development) to see PostHog debug logs
      </p>
    </div>
  )
}
