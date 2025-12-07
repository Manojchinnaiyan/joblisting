'use client'

import { useEffect, ReactNode } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { authApi } from '@/lib/api/auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setLoading, logout, accessToken, setHasHydrated } = useAuthStore()

  // Force hydration on mount and validate auth
  useEffect(() => {
    const initAuth = async () => {
      // Mark as hydrated immediately on client
      setHasHydrated(true)

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
    }

    initAuth()
  }, [accessToken, setUser, setLoading, logout, setHasHydrated])

  // Always render children - don't block on auth
  return <>{children}</>
}
