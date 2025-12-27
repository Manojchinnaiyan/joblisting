'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Cookie, X, Settings } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

const COOKIE_CONSENT_KEY = 'cookie-consent'

interface CookiePreferences {
  essential: boolean // Always true, can't be disabled
  functional: boolean
  analytics: boolean
  marketing: boolean
}

const defaultPreferences: CookiePreferences = {
  essential: true,
  functional: true,
  analytics: true,
  marketing: false,
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      // Delay cookie banner to 5s to ensure LCP is measured before it appears
      // LCP is typically measured within 2.5s of page load
      const timer = setTimeout(() => setShowBanner(true), 5000)
      return () => clearTimeout(timer)
    } else {
      try {
        setPreferences(JSON.parse(consent))
      } catch {
        setPreferences(defaultPreferences)
      }
    }
  }, [])

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs))
    setPreferences(prefs)
    setShowBanner(false)
    setShowSettings(false)
  }

  const acceptAll = () => {
    savePreferences({
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    })
  }

  const rejectNonEssential = () => {
    savePreferences({
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
    })
  }

  const saveCustomPreferences = () => {
    savePreferences(preferences)
  }

  if (!showBanner) return null

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-in slide-in-from-bottom duration-500">
        <Card className="max-w-4xl mx-auto p-6 shadow-lg border-2">
          <div className="flex flex-col md:flex-row gap-4 md:items-start">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Cookie className="h-5 w-5 text-primary" />
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-semibold text-lg">We use cookies</h3>
                <button
                  onClick={rejectNonEssential}
                  className="md:hidden text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground">
                We use cookies to enhance your browsing experience, serve personalized content,
                and analyze our traffic. By clicking &quot;Accept All&quot;, you consent to our use of cookies.
                Read our{' '}
                <Link href="/cookies" className="text-primary hover:underline">
                  Cookie Policy
                </Link>{' '}
                to learn more.
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={acceptAll} size="sm">
                  Accept All
                </Button>
                <Button onClick={rejectNonEssential} variant="outline" size="sm">
                  Essential Only
                </Button>
                <Button
                  onClick={() => setShowSettings(true)}
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Customize
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5" />
              Cookie Preferences
            </DialogTitle>
            <DialogDescription>
              Manage your cookie preferences. Essential cookies cannot be disabled as they are
              required for the website to function.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Essential Cookies */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <Label className="font-medium">Essential Cookies</Label>
                <p className="text-xs text-muted-foreground">
                  Required for authentication and security
                </p>
              </div>
              <Switch checked disabled />
            </div>

            {/* Functional Cookies */}
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="space-y-0.5">
                <Label htmlFor="functional" className="font-medium cursor-pointer">
                  Functional Cookies
                </Label>
                <p className="text-xs text-muted-foreground">
                  Remember preferences and settings
                </p>
              </div>
              <Switch
                id="functional"
                checked={preferences.functional}
                onCheckedChange={(checked) =>
                  setPreferences((p) => ({ ...p, functional: checked }))
                }
              />
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="space-y-0.5">
                <Label htmlFor="analytics" className="font-medium cursor-pointer">
                  Analytics Cookies
                </Label>
                <p className="text-xs text-muted-foreground">
                  Help us improve by tracking usage
                </p>
              </div>
              <Switch
                id="analytics"
                checked={preferences.analytics}
                onCheckedChange={(checked) =>
                  setPreferences((p) => ({ ...p, analytics: checked }))
                }
              />
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="space-y-0.5">
                <Label htmlFor="marketing" className="font-medium cursor-pointer">
                  Marketing Cookies
                </Label>
                <p className="text-xs text-muted-foreground">
                  Personalized ads and content
                </p>
              </div>
              <Switch
                id="marketing"
                checked={preferences.marketing}
                onCheckedChange={(checked) =>
                  setPreferences((p) => ({ ...p, marketing: checked }))
                }
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={saveCustomPreferences}>
              Save Preferences
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
