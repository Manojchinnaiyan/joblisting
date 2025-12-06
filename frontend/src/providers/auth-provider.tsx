'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { authApi } from '@/lib/api/auth'

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setLoading, logout, accessToken, _hasHydrated } = useAuthStore()
  const [isValidating, setIsValidating] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      // Wait for hydration before validating
      if (!_hasHydrated) return

      if (accessToken) {
        try {
          const user = await authApi.getMe()
          setUser(user)
        } catch {
          // Token is invalid - clear auth state
          logout()
        }
      }
      setLoading(false)
      setIsValidating(false)
    }

    initAuth()
  }, [accessToken, setUser, setLoading, logout, _hasHydrated])

  // Show loading screen until zustand store has hydrated and auth is validated
  if (!_hasHydrated || isValidating) {
    return <LoadingScreen />
  }

  return <>{children}</>
}
